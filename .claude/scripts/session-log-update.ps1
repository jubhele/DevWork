# session-log-update.ps1
# Called by the Claude Code Stop hook to close out the session log.
# 1. Timestamps the session end.
# 2. Checks for a mandatory ## Learnings section.
# 3. Warns if /learn was not run (no ## Learnings section found).

$sessionsDir = "c:\DevWork\sessions"
$today = Get-Date -Format "yyyy-MM-dd"
$ts = Get-Date -Format "HH:mm:ss"

$todayLogs = Get-ChildItem $sessionsDir -Filter "*.md" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne "_template.md" -and $_.LastWriteTime.Date -eq (Get-Date).Date } |
    Sort-Object LastWriteTime -Descending

if ($todayLogs) {
    $logFile = $todayLogs[0].FullName
    $content = Get-Content $logFile -Raw -Encoding utf8

    $hasLearnings = $content -match '##\s+Learnings'

    if (-not $hasLearnings) {
        $warning = @"

## Learnings
⚠ /learn was not run before this session ended.
Action required at next session start: review this log and run /learn (Claude Code)
or manually update memory/ files (all other providers) before new work begins.

"@
        Add-Content -Path $logFile -Value $warning -Encoding utf8
    }

    $marker = "_Session ended: $today $ts (Claude Code / claude-sonnet-4-6)_"
    Add-Content -Path $logFile -Value $marker -Encoding utf8

} else {
    # No log created today — make a minimal one so nothing goes unrecorded
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
Action required at next session start: review this log and run /learn (Claude Code)
or manually update memory/ files (all other providers) before new work begins.

_Session ended: $today $ts_
"@
    Set-Content -Path $logFile -Value $content -Encoding utf8
}
