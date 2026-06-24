# session-log-update.ps1
# Called by the Claude Code Stop hook after every response.
#
# Signature is written ONLY when the user (or Claude acting on user instruction)
# has set "## Goal Status" to ACHIEVED in the session log.
#
# Exception — automated confirmation (noted as such in the signature):
#   If the session log has not been modified for AUTO_CONFIRM_HOURS and the core
#   sections (Decisions + Work Done) are filled, the hook auto-signs with an
#   [AUTOMATED] flag so the archive is never silently missing a close.
#
# Once signed, subsequent Stop events just timestamp and exit.

$sessionsDir       = "c:\DevWork\sessions"
$AUTO_CONFIRM_HOURS = 0.5      # 30 minutes of inactivity before automated confirmation

$today    = Get-Date -Format "yyyy-MM-dd"
$ts       = Get-Date -Format "HH:mm:ss"
$datetime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# ---- Resolve log file -------------------------------------------------------

$todayLogs = Get-ChildItem $sessionsDir -Filter "*.md" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne "_template.md" -and $_.LastWriteTime.Date -eq (Get-Date).Date } |
    Sort-Object LastWriteTime -Descending

if ($todayLogs) {
    $logFile = $todayLogs[0].FullName
} else {
    $logFile = Join-Path $sessionsDir ($today + "_session.md")
    $stub = @(
        "# Session: $today",
        "Date: $today",
        "Provider: Claude Code",
        "Model: claude-sonnet-4-6",
        "",
        "## Goal",
        "(add goal here)",
        "",
        "## Goal Status",
        "PENDING",
        "",
        "## Decisions",
        "-",
        "",
        "## Work Done",
        "-",
        "",
        "## Agent Accountability",
        "| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |",
        "|---------|---------------|--------------|--------|------------|------|",
        "",
        "## Blockers / Next Steps",
        "-",
        "",
        "## Learnings",
        "-"
    )
    Set-Content -Path $logFile -Value $stub -Encoding utf8
}

$logItem  = Get-Item $logFile
$rawLines = Get-Content $logFile -Encoding utf8

# ---- Already signed? Just timestamp and exit --------------------------------

$alreadySigned = $rawLines | Where-Object { $_ -match '> Completed by:' }
if ($alreadySigned) {
    Add-Content -Path $logFile -Value "_Session ended: $today $ts (Claude Code / claude-sonnet-4-6)_" -Encoding utf8
    exit 0
}

# ---- Helper: check if a section has real content ----------------------------

function Test-SectionFilled {
    param([string[]]$lines, [string]$heading)
    $inSection = $false
    foreach ($line in $lines) {
        if ($line -match "^## $heading\s*$") { $inSection = $true; continue }
        if ($inSection) {
            if ($line -match '^## ') { break }
            $t = $line.Trim()
            if ($t -eq '' -or $t -eq '-' -or $t -eq 'PENDING' -or $t -eq 'ACHIEVED') { continue }
            if ($t -match '^\|\s*(Task ID|[-\s|]+)\s*\|') { continue }
            return $true
        }
    }
    return $false
}

function Get-SectionValue {
    param([string[]]$lines, [string]$heading)
    $inSection = $false
    foreach ($line in $lines) {
        if ($line -match "^## $heading\s*$") { $inSection = $true; continue }
        if ($inSection) {
            if ($line -match '^## ') { break }
            $t = $line.Trim()
            if ($t -ne '') { return $t }
        }
    }
    return ''
}

# ---- Determine confirmation status ------------------------------------------

$goalStatus   = Get-SectionValue $rawLines 'Goal Status'
$decisionsOk  = Test-SectionFilled $rawLines 'Decisions'
$workDoneOk   = Test-SectionFilled $rawLines 'Work Done'
$learningsOk  = Test-SectionFilled $rawLines 'Learnings'

$userConfirmed = ($goalStatus -eq 'ACHIEVED')

# Automated confirmation: log inactive for AUTO_CONFIRM_HOURS and core sections filled
$hoursSinceWrite = (New-TimeSpan -Start $logItem.LastWriteTime -End (Get-Date)).TotalHours
$autoConfirm     = (-not $userConfirmed) -and ($hoursSinceWrite -ge $AUTO_CONFIRM_HOURS) -and $decisionsOk -and $workDoneOk

$shouldSign = $userConfirmed -or $autoConfirm

# ---- Warn about incomplete sections (always, mid-session) -------------------

$warnings = @()
if (-not $decisionsOk) { $warnings += '## Decisions' }
if (-not $workDoneOk)  { $warnings += '## Work Done' }
if (-not $learningsOk) { $warnings += '## Learnings' }
if ($goalStatus -eq 'PENDING' -and -not $autoConfirm) { $warnings += '## Goal Status (still PENDING -- user must set to ACHIEVED)' }

if ($warnings.Count -gt 0 -and -not $shouldSign) {
    $sectionList = $warnings -join ', '
    $warn = @(
        "",
        "## Warning: Session Log Incomplete",
        "Incomplete at this stop: $sectionList",
        ""
    )
    Add-Content -Path $logFile -Value $warn -Encoding utf8
}

# ---- Write accountability signature (once, on user confirmation or auto) ----

if ($shouldSign) {
    $taskId = [System.IO.Path]::GetFileNameWithoutExtension($logFile)

    if ($autoConfirm) {
        $confirmNote = "AUTOMATED -- no user confirmation after $([Math]::Round($hoursSinceWrite,1))h"
        $rowStatus   = "COMPLETED [AUTOMATED]"
    } else {
        $confirmNote = "User confirmed ACHIEVED"
        $rowStatus   = "COMPLETED"
    }

    $tableRow    = "| $taskId | Mlawuli | Claude Code (Mlawuli) | $rowStatus | - | $confirmNote -- $datetime |"
    $closingLine = "> Completed by: Claude Code (Mlawuli)  |  Task: $taskId  |  Status: $rowStatus  |  Confirmed: $confirmNote  |  $datetime"

    # Inject table row into Agent Accountability section
    $resultLines = [System.Collections.Generic.List[string]]::new()
    $inAcct      = $false
    $rowWritten  = $false

    foreach ($line in $rawLines) {
        if ($line -match '^## Agent Accountability\s*$') { $inAcct = $true }
        if ($inAcct -and -not $rowWritten -and $line -match '^## ' -and $line -notmatch '^## Agent Accountability') {
            $resultLines.Add($tableRow)
            $resultLines.Add("")
            $rowWritten = $true
            $inAcct     = $false
        }
        $resultLines.Add($line)
    }
    if ($inAcct -and -not $rowWritten) {
        $resultLines.Add($tableRow)
        $rowWritten = $true
    }
    if (-not $rowWritten) {
        $resultLines.Add("")
        $resultLines.Add("## Agent Accountability")
        $resultLines.Add("| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |")
        $resultLines.Add("|---------|---------------|--------------|--------|------------|------|")
        $resultLines.Add($tableRow)
    }

    Set-Content -Path $logFile -Value $resultLines.ToArray() -Encoding utf8
    Add-Content -Path $logFile -Value "" -Encoding utf8
    Add-Content -Path $logFile -Value $closingLine -Encoding utf8
}

# ---- Timestamp --------------------------------------------------------------

Add-Content -Path $logFile -Value "_Session ended: $today $ts (Claude Code / claude-sonnet-4-6)_" -Encoding utf8
