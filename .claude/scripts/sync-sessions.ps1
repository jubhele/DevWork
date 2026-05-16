# sync-sessions.ps1
# Refreshes c:\DevWork\sessions\system_chatsessions\ from VS Code workspaceStorage.
# Run after any Copilot session to get the latest copies.

$dest = "c:\DevWork\sessions\system_chatsessions"
$vsBase = "$env:APPDATA\Code\User\workspaceStorage"
New-Item -ItemType Directory -Force $dest | Out-Null

$sources = @{
    "da6518229af7ddab166ad8bc4da6ee72" = "DevWork"
    "64f9f73b41aec3b96d469cb6a8bc5971" = "Other"
}

$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Output "[$ts] Syncing session files to $dest"
$count = 0

foreach ($wsId in $sources.Keys) {
    $wsName = $sources[$wsId]
    $chatDir = "$vsBase\$wsId\chatSessions"
    if (Test-Path $chatDir) {
        Get-ChildItem $chatDir -Filter "*.jsonl" | ForEach-Object {
            $target = Join-Path $dest $_.Name
            Copy-Item $_.FullName $target -Force
            Write-Output "  [OK] $wsName / $($_.Name)"
            $count++
        }
    }
}

Write-Output "[$ts] Synced $count session files."
