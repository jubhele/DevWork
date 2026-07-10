param(
    [string]$WorkspaceRoot = 'C:\DevWork',
    [string]$SessionLogPath = '',
    [switch]$FullAudit
)

$ErrorActionPreference = 'Stop'
$schemaVersion = '1.0'
$indexPath = Join-Path $WorkspaceRoot 'WORKSPACE_INDEX.md'
$indexDirectory = Join-Path $WorkspaceRoot '_workspace\index'
$manifestPath = Join-Path $indexDirectory 'workspace-index.json'
$unresolvedDirectory = Join-Path $indexDirectory 'unresolved'

function Get-SafeSlug {
    param([string]$Value)
    $slug = (($Value.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-'))
    if ([string]::IsNullOrWhiteSpace($slug)) { return 'project' }
    return $slug
}

function Get-RelativePath {
    param([string]$Path)
    $root = [IO.Path]::GetFullPath($WorkspaceRoot).TrimEnd('\')
    $full = [IO.Path]::GetFullPath($Path)
    if ($full.Equals($root, [StringComparison]::OrdinalIgnoreCase)) { return '.' }
    return $full.Substring($root.Length).TrimStart('\')
}

function Get-DirectoryMetric {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        return [ordered]@{ exists = $false; files = 0; bytes = 0; oldest = $null; latest = $null }
    }

    $files = @(Get-ChildItem -LiteralPath $Path -File -Recurse -Force -ErrorAction SilentlyContinue)
    $bytes = 0
    $oldest = $null
    $latest = $null
    if ($files.Count -gt 0) {
        $measure = $files | Measure-Object -Property Length -Sum
        $bytes = [int64]$measure.Sum
        $oldest = ($files | Sort-Object LastWriteTimeUtc | Select-Object -First 1).LastWriteTimeUtc.ToString('o')
        $latest = ($files | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1).LastWriteTimeUtc.ToString('o')
    }
    return [ordered]@{ exists = $true; files = $files.Count; bytes = $bytes; oldest = $oldest; latest = $latest }
}

function Write-AtomicUtf8 {
    param([string]$Path, [string]$Content)
    $parent = Split-Path $Path -Parent
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    if (Test-Path -LiteralPath $Path) {
        $existing = Get-Content -LiteralPath $Path -Raw -Encoding utf8
        if ($existing -eq $Content) { return $false }
    }
    $temporary = $Path + '.' + [guid]::NewGuid().ToString('N') + '.tmp'
    Set-Content -LiteralPath $temporary -Value $Content -Encoding utf8 -NoNewline
    Move-Item -LiteralPath $temporary -Destination $Path -Force
    return $true
}

function Get-ProjectRoots {
    $skip = @(
        '.agents', '.claude', '.codex', '.cursor', '.factory', '.git', '.github', '.gstack', '.kiro',
        '.memory', '.pnpm-store', '.venv', '.vscode', '_backups', '_workspace', 'agents', 'chatsessions',
        'design', 'docs', 'logs', 'mysql-data', 'queue', 'scripts', 'sessions', 'temp', 'updates'
    )
    $roots = New-Object System.Collections.Generic.List[string]
    foreach ($directory in Get-ChildItem -LiteralPath $WorkspaceRoot -Directory -Force) {
        if ($skip -contains $directory.Name.ToLowerInvariant()) { continue }
        $signals = @('.git', 'AGENTS.md', 'CLAUDE.md', 'package.json', 'pyproject.toml', 'composer.json', 'README.md')
        $isProject = $false
        foreach ($signal in $signals) {
            if (Test-Path -LiteralPath (Join-Path $directory.FullName $signal)) { $isProject = $true; break }
        }
        if ($isProject) { $roots.Add($directory.FullName) }
    }
    $roots.Add((Join-Path $WorkspaceRoot '_workspace'))
    return @($roots | Sort-Object -Unique)
}

function Get-ProjectSummary {
    param([string]$ProjectRoot)
    $name = Split-Path $ProjectRoot -Leaf
    if ($name -eq '_workspace') { $slug = '_workspace' } else { $slug = Get-SafeSlug $name }
    $kinds = [ordered]@{
        sessions = @('sessions')
        artifacts = @('artifacts', 'exports', 'reports')
        archive = @('archive', '_archive')
        temp = @('temp', 'tmp')
        logs = @('logs')
        backups = @('_backups', 'backups')
    }
    $categories = [ordered]@{}
    foreach ($kind in $kinds.Keys) {
        $locations = @()
        foreach ($relative in $kinds[$kind]) {
            $path = Join-Path $ProjectRoot $relative
            if (Test-Path -LiteralPath $path -PathType Container) {
                $locations += [ordered]@{ path = Get-RelativePath $path; metric = Get-DirectoryMetric $path }
            }
        }
        $categories[$kind] = $locations
    }

    return [ordered]@{
        name = $name
        slug = $slug
        root = Get-RelativePath $ProjectRoot
        standalone_repository = (Test-Path -LiteralPath (Join-Path $ProjectRoot '.git'))
        artifact_index = Get-RelativePath (Join-Path $ProjectRoot 'ARTIFACT_INDEX.md')
        categories = $categories
    }
}

function Get-CategoryTotals {
    param($Locations)
    $files = 0
    $bytes = [int64]0
    $latest = $null
    foreach ($location in @($Locations)) {
        $files += [int]$location.metric.files
        $bytes += [int64]$location.metric.bytes
        if ($location.metric.latest -and ($null -eq $latest -or $location.metric.latest -gt $latest)) {
            $latest = $location.metric.latest
        }
    }
    return [ordered]@{ files = $files; bytes = $bytes; latest = $latest }
}

function Get-ProjectMarkdown {
    param($Project)
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add('# Artifact Index: ' + $Project.name)
    $lines.Add('')
    $lines.Add('Canonical root: `' + $Project.root + '`')
    $lines.Add('Schema: ' + $schemaVersion)
    $lines.Add('')
    $lines.Add('| Kind | Locations | Files | Size (MB) | Latest |')
    $lines.Add('|------|-----------|------:|----------:|--------|')
    foreach ($kind in $Project.categories.Keys) {
        $locations = @($Project.categories[$kind])
        $totals = Get-CategoryTotals $locations
        $paths = if ($locations.Count -gt 0) { (@($locations | ForEach-Object { '`' + $_.path + '`' }) -join '<br>') } else { 'Not present' }
        $latest = if ($totals.latest) { $totals.latest } else { '-' }
        $lines.Add('| ' + $kind + ' | ' + $paths + ' | ' + $totals.files + ' | ' + ([math]::Round($totals.bytes / 1MB, 2)) + ' | ' + $latest + ' |')
    }
    $lines.Add('')
    $lines.Add('This file is generated by `scripts/governance/update-workspace-index.ps1`. Canonical artifacts remain in the linked project folders.')
    return (($lines -join "`r`n") + "`r`n")
}

New-Item -ItemType Directory -Path $unresolvedDirectory -Force | Out-Null
$projectRoots = @(Get-ProjectRoots)
$projects = @()
foreach ($root in $projectRoots) { $projects += Get-ProjectSummary $root }

$legacyNames = @('sessions', 'temp', '_backups', 'chatsessions', 'logs')
$legacy = @()
foreach ($name in $legacyNames) {
    $path = Join-Path $WorkspaceRoot $name
    if (Test-Path -LiteralPath $path -PathType Container) {
        $legacy += [ordered]@{ path = Get-RelativePath $path; metric = Get-DirectoryMetric $path }
    }
}

$looseCandidates = @()
foreach ($name in @('agent-log.txt', 'portal.php', 'delete', 'stop')) {
    $path = Join-Path $WorkspaceRoot $name
    if (Test-Path -LiteralPath $path -PathType Leaf) {
        $item = Get-Item -LiteralPath $path
        $looseCandidates += [ordered]@{ path = $name; bytes = [int64]$item.Length; reason = 'Ownership/runtime reference requires review before migration.' }
    }
}

$infrastructure = @()
foreach ($name in @('.git', '.venv', '.pnpm-store', 'mysql-data')) {
    $path = Join-Path $WorkspaceRoot $name
    if (Test-Path -LiteralPath $path -PathType Container) {
        $infrastructure += [ordered]@{ path = $name; metric = Get-DirectoryMetric $path; classification = 'excluded infrastructure/cache' }
    }
}

$inventory = [ordered]@{
    projects = $projects
    legacy_root_stores = $legacy
    loose_root_candidates = $looseCandidates
    excluded_infrastructure = $infrastructure
    unresolved_files = @(Get-ChildItem -LiteralPath $unresolvedDirectory -File -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object { Get-RelativePath $_.FullName })
}
$inventoryJson = $inventory | ConvertTo-Json -Depth 12
$previousInventoryJson = ''
if (Test-Path -LiteralPath $manifestPath) {
    try {
        $previous = Get-Content -LiteralPath $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json
        $previousInventoryJson = $previous.inventory | ConvertTo-Json -Depth 12
    } catch { $previousInventoryJson = '' }
}

$changed = ($inventoryJson -ne $previousInventoryJson)
foreach ($project in $projects) {
    $projectRoot = Join-Path $WorkspaceRoot $project.root
    $projectMarkdown = Get-ProjectMarkdown $project
    $projectJson = $project | ConvertTo-Json -Depth 12
    if (Write-AtomicUtf8 (Join-Path $projectRoot 'ARTIFACT_INDEX.md') $projectMarkdown) { $changed = $true }
    if (Write-AtomicUtf8 (Join-Path $projectRoot 'ARTIFACT_INDEX.json') ($projectJson + "`r`n")) { $changed = $true }
}

if ($changed) {
    $trigger = if ([string]::IsNullOrWhiteSpace($SessionLogPath)) { 'manual/full audit' } else { Get-RelativePath $SessionLogPath }
    $manifest = [ordered]@{
        schema_version = $schemaVersion
        generated_at = (Get-Date).ToUniversalTime().ToString('o')
        triggered_by = $trigger
        inventory = $inventory
    }
    $manifestJson = ($manifest | ConvertTo-Json -Depth 14) + "`r`n"
    [void](Write-AtomicUtf8 $manifestPath $manifestJson)

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add('# DevWork Workspace Index')
    $lines.Add('')
    $lines.Add('Generated: ' + $manifest.generated_at)
    $lines.Add('Schema: ' + $schemaVersion)
    $lines.Add('Trigger: `' + $trigger + '`')
    $lines.Add('')
    $lines.Add('This is a discovery map. Canonical sessions and artifacts remain below their owning project roots.')
    $lines.Add('')
    $lines.Add('## Projects')
    $lines.Add('')
    $lines.Add('| Project | Root | Repository | Sessions | Artifacts | Archive | Temp | Backups | Index |')
    $lines.Add('|---------|------|------------|---------:|----------:|--------:|-----:|--------:|-------|')
    foreach ($project in $projects) {
        $sessionTotals = Get-CategoryTotals $project.categories.sessions
        $artifactTotals = Get-CategoryTotals $project.categories.artifacts
        $archiveTotals = Get-CategoryTotals $project.categories.archive
        $tempTotals = Get-CategoryTotals $project.categories.temp
        $backupTotals = Get-CategoryTotals $project.categories.backups
        $repo = if ($project.standalone_repository) { 'Yes' } else { 'No' }
        $lines.Add('| ' + $project.name + ' | `' + $project.root + '` | ' + $repo + ' | ' + $sessionTotals.files + ' | ' + $artifactTotals.files + ' | ' + $archiveTotals.files + ' | ' + $tempTotals.files + ' | ' + $backupTotals.files + ' | [' + $project.slug + '](' + ($project.artifact_index -replace '\\','/') + ') |')
    }
    $lines.Add('')
    $lines.Add('## Legacy Root Stores Requiring Migration')
    $lines.Add('')
    $lines.Add('| Path | Files | Size (MB) | Latest |')
    $lines.Add('|------|------:|----------:|--------|')
    foreach ($entry in $legacy) {
        $latest = if ($entry.metric.latest) { $entry.metric.latest } else { '-' }
        $lines.Add('| `' + $entry.path + '` | ' + $entry.metric.files + ' | ' + ([math]::Round($entry.metric.bytes / 1MB, 2)) + ' | ' + $latest + ' |')
    }
    $lines.Add('')
    $lines.Add('## Unresolved and Excluded')
    $lines.Add('')
    $lines.Add('- Unresolved queue: `_workspace/index/unresolved/` (' + $inventory.unresolved_files.Count + ' files)')
    $lines.Add('- Loose root candidates awaiting ownership/runtime verification: ' + $looseCandidates.Count)
    $lines.Add('- Excluded infrastructure/cache roots: ' + $infrastructure.Count)
    $lines.Add('')
    $lines.Add('Machine-readable manifest: `_workspace/index/workspace-index.json`.')
    [void](Write-AtomicUtf8 $indexPath (($lines -join "`r`n") + "`r`n"))
    $status = 'UPDATED'
} else {
    $status = 'NO_CHANGE'
}

[pscustomobject]@{
    status = $status
    workspace_index = $indexPath
    manifest = $manifestPath
    projects = $projects.Count
    legacy_root_stores = $legacy.Count
    unresolved = $inventory.unresolved_files.Count
} | ConvertTo-Json -Compress
