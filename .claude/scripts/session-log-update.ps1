# session-log-update.ps1
# Called by the Claude Code Stop hook to timestamp session end.
# Creates today's session log if it doesn't exist.

$sessionsDir = "c:\DevWork\sessions"
$today = Get-Date -Format "yyyy-MM-dd"
$ts = Get-Date -Format "HH:mm:ss"

# Find any session log created today
$todayLogs = Get-ChildItem $sessionsDir -Filter "$today*.md" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne "_template.md" }

if ($todayLogs) {
    # Append session-ended marker to the most recent log
    $logFile = ($todayLogs | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
    $marker = "`n---`n_Session ended: $today $ts (Claude Code / claude-sonnet-4-6)_"
    Add-Content -Path $logFile -Value $marker -Encoding utf8
} else {
    # Create a minimal session log so no session goes unrecorded
    $logFile = Join-Path $sessionsDir "$today_session.md"
    $content = @"
# Session: $(Get-Date -Format "yyyy-MM-dd")
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

_Session ended: $today $ts_
"@
    Set-Content -Path $logFile -Value $content -Encoding utf8
}
