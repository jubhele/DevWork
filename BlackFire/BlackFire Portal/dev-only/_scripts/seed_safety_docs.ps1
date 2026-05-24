<#
.SYNOPSIS
    Stages safety file documents for upload to the Umlilo Portal.

.DESCRIPTION
    Two modes:

    FLAT (default when source has loose files):
        Reads all supported documents directly from -Source.
        Expected filename pattern: [SECTION][NN]_[doctype]_[description-kebab].[ext]

    STRUCTURED (auto-detected when source contains "Section X\" subfolders):
        Walks a folder tree built from the audit checklist:
            <Source>\Section A\NN - Full description\actual-files.ext
        Derives the canonical original_name from the folder path.
        Skips placeholder files: Not Applicable.docx, *_Template.*, PENDING_UPLOAD.txt, *.md, *.gsheet

    Both modes:
        - Copy each file to uploads/attachments/ with a unique 32-char hex stored name
          (matching the bin2hex(random_bytes(16)) format used by files.php)
        - Write install/safety_attachments_seed.sql with all the INSERT records

    Deployment order on Afrihost:
        1. safety_migration.sql
        2. safety_seed_astute.sql
        3. seed_safety_docs.ps1          <- this script (local)
        4. FTP uploads/attachments/      <- hex-named files only
        5. safety_attachments_seed.sql

.PARAMETER Source
    Folder containing the documents to process.
    Default: _sample_docs\safety  (relative to portal root)
    Can be an absolute path, e.g. "G:\My Drive\...\Astute Insight"

.PARAMETER SafetyRef
    The safety file ref the documents belong to.
    Default: SAF-210526-0001

.PARAMETER UploadedBy
    Username to record as the uploader in bf_attachments.
    Default: admin

.EXAMPLE
    # Use default flat source folder
    .\seed_safety_docs.ps1

    # Point at the real Google Drive folder (structured mode auto-detected)
    .\seed_safety_docs.ps1 -Source "G:\.shortcut-targets-by-id\19jPRakzdBBQgK_LaHiAtGZiEm-A3fXb3\Astute Insight"

    # Point at an unzipped staging folder
    .\seed_safety_docs.ps1 -Source "C:\Temp\astute_unzipped" -SafetyRef "SAF-210526-0001"

.NAMING CONVENTION
    Canonical pattern: [SECTION][NN]_[doctype]_[description-kebab].[ext]
    e.g.  A04_certificate_letter-of-good-standing.pdf
          C01_photo_img-20260518-medical-cert.jpg
          H01_appointment_legal-appointments.pdf
#>

param(
    [string]$Source     = '_sample_docs\safety',
    [string]$SafetyRef  = 'SAF-210526-0001',
    [string]$UploadedBy = 'admin'
)

# ── Paths ──────────────────────────────────────────────────────────────────
$portalRoot = Split-Path $PSScriptRoot -Parent
$sourcePath = if ([System.IO.Path]::IsPathRooted($Source)) { $Source } `
              else { Join-Path $portalRoot $Source }
$attachDir  = Join-Path $portalRoot 'uploads\attachments'
$sqlOutPath = Join-Path $portalRoot 'install\safety_attachments_seed.sql'

# ── MIME map (matches files.php ALLOWED_TYPES) ─────────────────────────────
$mimeMap = @{
    '.pdf'  = 'application/pdf'
    '.docx' = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    '.doc'  = 'application/msword'
    '.xlsx' = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    '.xls'  = 'application/vnd.ms-excel'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.png'  = 'image/png'
}

# Placeholder/template file patterns to skip in structured mode
$skipPatterns = @(
    'Not Applicable*',
    '*_Template.*',
    'PENDING_UPLOAD*',
    '*.md',
    '*.gsheet',
    '*.lnk',
    '*.txt',
    'APPOINTMENT_*',
    'Audit_Folder_Index*',
    'Missing_Items_Report*',
    'Pending_Upload_Master*'
)

# ── Validate source ────────────────────────────────────────────────────────
if (-not (Test-Path $sourcePath)) {
    Write-Host "ERROR: Source folder not found: $sourcePath" -ForegroundColor Red
    exit 1
}

# ── Detect structured vs flat mode ────────────────────────────────────────
$sectionFolders = Get-ChildItem $sourcePath -Directory |
                  Where-Object { $_.Name -match '^Section [A-I]$' }
$isStructured   = $sectionFolders.Count -gt 0

Write-Host ""
Write-Host "  Source  : $sourcePath"
Write-Host "  Mode    : $(if($isStructured){'STRUCTURED (Section X\NN - desc\files)'}else{'FLAT'})" -ForegroundColor $(if($isStructured){'Cyan'}else{'Gray'})
Write-Host "  Dest    : $attachDir"
Write-Host "  Ref     : $SafetyRef"
Write-Host ""

# ── Doctype inference from folder description keywords ────────────────────
function Get-Doctype {
    param([string]$FolderDesc, [string]$Ext)
    if ($Ext -in @('.jpg','.jpeg','.png')) { return 'photo' }
    $desc = $FolderDesc.ToLower()
    if ($desc -match 'insurance|liability')             { return 'insurance' }
    if ($desc -match 'policy|policies')                 { return 'policy' }
    if ($desc -match 'appointment|legal appointment')   { return 'appointment' }
    if ($desc -match 'organogram')                      { return 'organogram' }
    if ($desc -match 'standing|competency|fitness|certificate') { return 'certificate' }
    if ($desc -match 'agreement|contract|37\.2|sla')    { return 'agreement' }
    if ($desc -match 'risk assessment|baseline')        { return 'assessment' }
    if ($desc -match 'register|statistics|records')     { return 'register' }
    if ($desc -match 'plan|planning|protection plan')   { return 'plan' }
    if ($desc -match 'procedure|management|induction')  { return 'procedure' }
    if ($desc -match 'training|matrix|toolbox|talks')   { return 'training' }
    if ($desc -match 'inspection|schedule')             { return 'inspection' }
    if ($desc -match 'maintenance|maintenance log')     { return 'record' }
    if ($desc -match 'notification')                    { return 'notification' }
    if ($desc -match 'permit')                          { return 'permit' }
    if ($desc -match 'scope|activities')                { return 'procedure' }
    return 'document'
}

# ── Slugify a filename (strip leading "NN. " prefix, kebab-case, max 40) ──
function Get-Slug {
    param([string]$Name)
    # Strip leading "NN. " or "NN - " prefix often found on filed documents
    $clean = $Name -replace '^\d+[\.\s-]+\s*', ''
    # Remove extension
    $clean = [System.IO.Path]::GetFileNameWithoutExtension($clean)
    # Replace non-alphanumeric runs with hyphens, lowercase, trim, max 40
    $slug  = ($clean -replace '[^a-zA-Z0-9]+', '-').ToLower().Trim('-')
    if ($slug.Length -gt 40) { $slug = $slug.Substring(0, 40).TrimEnd('-') }
    if (-not $slug) { $slug = 'document' }
    return $slug
}

# ── Determine if a file should be skipped ─────────────────────────────────
function Test-ShouldSkip {
    param([System.IO.FileInfo]$File)
    foreach ($pat in $skipPatterns) {
        if ($File.Name -like $pat) { return $true }
    }
    # Skip files without a supported extension
    if (-not $mimeMap.ContainsKey($File.Extension.ToLower())) { return $true }
    return $false
}

# ── Build file list ────────────────────────────────────────────────────────
$fileEntries = @()  # [pscustomobject]{ FileInfo, OriginalName, Section, ItemNo }

if ($isStructured) {
    foreach ($secDir in ($sectionFolders | Sort-Object Name)) {
        # Section letter: "Section A" -> "A"
        $secLetter = $secDir.Name -replace 'Section ', ''

        $itemDirs = Get-ChildItem $secDir.FullName -Directory | Sort-Object Name

        # Also pick up files directly in the section folder (Section H has loose files)
        $looseFiles = Get-ChildItem $secDir.FullName -File
        foreach ($lf in $looseFiles) {
            if (Test-ShouldSkip $lf) { continue }
            $canonical = "$($secLetter)00_$(Get-Doctype -FolderDesc $secDir.Name -Ext $lf.Extension.ToLower())_$(Get-Slug $lf.Name)$($lf.Extension.ToLower())"
            $fileEntries += [pscustomobject]@{
                FileInfo     = $lf
                OriginalName = $canonical
                Section      = $secLetter
                ItemNo       = '00'
            }
        }

        foreach ($itemDir in $itemDirs) {
            # Item number: "01 - Employees..." -> "01", "33 - ..." -> "33"
            $itemNo = ''
            if ($itemDir.Name -match '^(\d+)') {
                $itemNo = $Matches[1].PadLeft(2, '0')
            }
            $folderDesc = $itemDir.Name

            $docFiles = Get-ChildItem $itemDir.FullName -File
            foreach ($df in $docFiles) {
                if (Test-ShouldSkip $df) { continue }
                $ext      = $df.Extension.ToLower()
                $doctype  = Get-Doctype -FolderDesc $folderDesc -Ext $ext
                $slug     = Get-Slug $df.Name
                $canonical = "$secLetter$itemNo`_$doctype`_$slug$ext"
                $fileEntries += [pscustomobject]@{
                    FileInfo     = $df
                    OriginalName = $canonical
                    Section      = $secLetter
                    ItemNo       = $itemNo
                }
            }
        }
    }
} else {
    # Flat mode — files must already be named to convention
    $flatFiles = Get-ChildItem $sourcePath -File |
                 Where-Object { $mimeMap.ContainsKey($_.Extension.ToLower()) } |
                 Sort-Object Name
    foreach ($ff in $flatFiles) {
        $fileEntries += [pscustomobject]@{
            FileInfo     = $ff
            OriginalName = $ff.Name
            Section      = ''
            ItemNo       = ''
        }
    }
}

if ($fileEntries.Count -eq 0) {
    Write-Host "No supported evidence files found in: $sourcePath" -ForegroundColor Yellow
    exit 0
}

Write-Host "  Files   : $($fileEntries.Count)" -ForegroundColor Green
Write-Host ""

# ── Ensure uploads/attachments exists ─────────────────────────────────────
if (-not (Test-Path $attachDir)) {
    New-Item -ItemType Directory -Force $attachDir | Out-Null
}

# ── RNG for hex stored names (matches bin2hex(random_bytes(16)) in PHP) ────
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

function New-HexName {
    param([string]$Ext)
    $bytes = New-Object byte[] 16
    $rng.GetBytes($bytes)
    $hex = ([System.BitConverter]::ToString($bytes)).Replace('-', '').ToLower()
    return "$hex$Ext"
}

# ── Process files ──────────────────────────────────────────────────────────
$sqlValues   = @()
$copiedFiles = @()
$now         = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

foreach ($entry in $fileEntries) {
    $file       = $entry.FileInfo
    $ext        = $file.Extension.ToLower()
    $mime       = $mimeMap[$ext]
    $storedName = New-HexName -Ext $ext
    $destFile   = Join-Path $attachDir $storedName
    $sizeBytes  = $file.Length

    Copy-Item $file.FullName $destFile

    $sqlOriginal = $entry.OriginalName -replace "'", "''"

    $sqlValues += "(
    'safety_file',
    '$SafetyRef',
    '$sqlOriginal',
    '$storedName',
    $sizeBytes,
    '$mime',
    '$UploadedBy',
    '$now'
)"

    $copiedFiles += [pscustomobject]@{
        Section  = "$($entry.Section)$($entry.ItemNo)"
        Original = $file.Name
        Canonical = $entry.OriginalName
        Stored   = $storedName
        Size     = "$([math]::Round($sizeBytes / 1KB, 1)) KB"
    }

    Write-Host ("  + [$($entry.Section)$($entry.ItemNo)] " + $file.Name + " -> " + $entry.OriginalName) -ForegroundColor Cyan
}

# ── Build SQL ──────────────────────────────────────────────────────────────
$valueBlock = $sqlValues -join ","

$sqlContent = @"
-- ============================================================
-- Safety File Attachments Seed
-- Ref     : $SafetyRef
-- Source  : $sourcePath
-- Files   : $($fileEntries.Count)
-- Generated: $now
--
-- Run AFTER: safety_seed_astute.sql
-- Then FTP uploads/attachments/ files to Afrihost before running.
--
-- RESTORE BACKUP IF NEEDED:
-- DELETE FROM bf_attachments WHERE entity_type = 'safety_file' AND entity_ref = '$SafetyRef';
-- ============================================================

DELETE FROM bf_attachments
 WHERE entity_type = 'safety_file'
   AND entity_ref  = '$SafetyRef';

INSERT INTO bf_attachments
    (entity_type, entity_ref, original_name, stored_name, file_size, mime_type, uploaded_by, created_at)
VALUES
$valueBlock;

SELECT id, original_name, ROUND(file_size/1024,1) AS kb, uploaded_by, created_at
  FROM bf_attachments
 WHERE entity_type = 'safety_file' AND entity_ref = '$SafetyRef'
 ORDER BY original_name;
"@

$sqlContent | Out-File -FilePath $sqlOutPath -Encoding utf8 -Force

# ── Summary ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ---------------------------------------------" -ForegroundColor DarkGray
Write-Host "  $($fileEntries.Count) files copied to uploads\attachments\" -ForegroundColor Green
Write-Host "  SQL written : install\safety_attachments_seed.sql" -ForegroundColor Green
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. FTP the new files in uploads\attachments\ to Afrihost"
Write-Host "     (only the new hex-named files - check dates or compare)"
Write-Host "  2. Run install\safety_attachments_seed.sql on Afrihost MySQL"
Write-Host "  3. Open portal -> $SafetyRef -> Supporting Documents to verify"
Write-Host ""

$copiedFiles | Format-Table Section, Canonical, Size -AutoSize
