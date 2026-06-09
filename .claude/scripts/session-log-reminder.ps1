# session-log-reminder.ps1
# Called by the Claude Code PostToolUse hook after Edit / Write tool calls.
# Checks whether the current session log's Work Done section has been updated
# since the session started. If it looks stale (empty or placeholder only),
# writes a reminder line to stderr so Claude sees it in the tool result.

$sessionsDir = "c:\DevWork\sessions"
$today       = Get-Date -Format "yyyy-MM-dd"

$todayLogs = Get-ChildItem $sessionsDir -Filter "*.md" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne "_template.md" -and $_.LastWriteTime.Date -eq (Get-Date).Date } |
    Sort-Object LastWriteTime -Descending

if (-not $todayLogs) {
    Write-Host "[session-log] No session log found for today — create one in c:\DevWork\sessions\"
    exit 0
}

$logFile = $todayLogs[0].FullName
$content = Get-Content $logFile -Raw -Encoding utf8

# Check if Work Done has real content (more than a placeholder dash or blank)
$workDoneFilled = $false
if ($content -match '##\s+Work Done\s*\r?\n([\s\S]*?)(?=\r?\n##|\z)') {
    $body = $Matches[1].Trim()
    $workDoneFilled = ($body.Length -gt 0 -and $body -ne '-')
}

if (-not $workDoneFilled) {
    Write-Host "[session-log] ⚠ Work Done section is empty — update $([System.IO.Path]::GetFileName($logFile)) before this session ends."
}
