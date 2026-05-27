# BlackFire Portal — local dev server
# Run from this directory: .\start-local.ps1
# Opens http://localhost:8080 in your browser

$port = 8080
$existing = netstat -ano | Select-String ":$port\s"
if ($existing) {
    Write-Host "Port $port already in use. Server may already be running."
    Start-Process "http://localhost:$port"
    exit 0
}

Write-Host "Starting PHP built-in server on http://localhost:$port ..."
Start-Process -FilePath "php" -ArgumentList "-S localhost:$port router.php" -WorkingDirectory $PSScriptRoot -WindowStyle Minimized
Start-Sleep -Seconds 1
Start-Process "http://localhost:$port"
Write-Host "Server started. Press Ctrl+C in the PHP window to stop."
