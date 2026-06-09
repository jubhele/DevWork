# session-log-update.ps1
# Called by the Claude Code Stop hook to close out the session log.
# 1. Timestamps the session end.
# 2. Checks mandatory sections: Learnings, Decisions, Work Done.
# 3. Injects a warning stub for any missing or empty section.

$sessionsDir = "c:\DevWork\sessions"
$today = Get-Date -Format "yyyy-MM-dd"
$ts    = Get-Date -Format "HH:mm:ss"

$todayLogs = Get-ChildItem $sessionsDir -Filter "*.md" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne "_template.md" -and $_.LastWriteTime.Date -eq (Get-Date).Date } |
    Sort-Object LastWriteTime -Descending

if ($todayLogs) {
    $logFile = $todayLogs[0].FullName
    $content = Get-Content $logFile -Raw -Encoding utf8

    # Check each mandatory section — flag if missing OR if the line immediately
    # after the heading is blank or only contains a dash placeholder.
    function Test-SectionFilled($text, $heading) {
        if ($text -notmatch "##\s+$heading") { return $false }
        # Extract content between this heading and the next ## heading (or EOF)
        if ($text -match "##\s+$heading\s*`r?`n([\s\S]*?)(?=`r?`n##|\z)") {
            $body = $Matches[1].Trim()
            return ($body.Length -gt 0 -and $body -ne '-')
        }
        return $false
    }

    $warnings = @()
    if (-not (Test-SectionFilled $content 'Decisions'))   { $warnings += '## Decisions'  }
    if (-not (Test-SectionFilled $content 'Work Done'))   { $warnings += '## Work Done'   }
    if (-not (Test-SectionFilled $content 'Learnings'))   { $warnings += '## Learnings'   }

    if ($warnings.Count -gt 0) {
        $sectionList = $warnings -join ', '
        $warning = @"

## ⚠ Session Log Incomplete
The following mandatory sections were empty when this session ended: $sectionList
Action required: fill these in before running /learn or starting the next session.

"@
        Add-Content -Path $logFile -Value $warning -Encoding utf8
    }

    $marker = "_Session ended: $today $ts (Claude Code / claude-sonnet-4-6)_"
    Add-Content -Path $logFile -Value $marker -Encoding utf8

} else {
    # No log created today — make a minimal stub so nothing goes unrecorded
    $logFile = Join-Path $sessionsDir "${today}_session.md"
    $content = @"
# Session: $today
Date: $today
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
(Session ended without a log being created manually — add goal description here)

## Decisions
-

## Work Done
-

## Blockers / Next Steps
-

## Learnings
⚠ /learn was not run before this session ended.
Action required: review this log and run /learn (Claude Code)
or manually update memory/ files (all other providers) before new work begins.

_Session ended: $today $ts_
"@
    Set-Content -Path $logFile -Value $content -Encoding utf8
}
