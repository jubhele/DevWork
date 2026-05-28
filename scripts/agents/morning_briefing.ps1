# morning_briefing.ps1 — Runs at Windows logon via Task Scheduler
# Shows yesterday's session cost and any pending portal QA reports

$venv  = "c:\DevWork\.venv\Scripts\python.exe"
$tracker = "c:\DevWork\scripts\agents\token_tracker.py"
$sessions = "c:\DevWork\sessions"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BlackFire Morning Briefing" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'dddd, dd MMMM yyyy  HH:mm')" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- Yesterday's cost summary ---
Write-Host "-- Token cost (last 24h) --" -ForegroundColor Yellow
& $venv $tracker --days 1 --sessions-dir $sessions
Write-Host ""

# --- Any unread portal QA reports ---
$yesterday = (Get-Date).AddDays(-1).ToString("yyyyMMdd")
$today     = (Get-Date).ToString("yyyyMMdd")

$qaFiles = Get-ChildItem $sessions -Filter "portal_qa_*.md" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match "portal_qa_($yesterday|$today)" }

if ($qaFiles) {
    foreach ($f in $qaFiles) {
        $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match "BLOCKED") {
            Write-Host "⛔  PORTAL QA BLOCKED: $($f.Name)" -ForegroundColor Red
            Write-Host "    Open: $($f.FullName)" -ForegroundColor Red
        } elseif ($content -match "Ready to commit") {
            Write-Host "✓  Portal QA passed: $($f.Name)" -ForegroundColor Green
        } else {
            Write-Host "   QA report: $($f.Name)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "   No portal QA report found for today/yesterday." -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
