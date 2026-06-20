# BlackFire Portal — local dev server
# Run from this directory: .\start-local.ps1
# Opens http://localhost:8080 in your browser

$port = 8080
$workspaceRefresh = Join-Path $PSScriptRoot "..\..\scripts\refresh-workspace-secrets.ps1"
if (Test-Path -LiteralPath $workspaceRefresh) {
    & $workspaceRefresh
}

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
if ($listener) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
    $isPortalServer = $process.Name -ieq 'php.exe' -and
        $process.CommandLine -match "-S\s+localhost:$port\s+router\.php"

    if (-not $isPortalServer) {
        throw "Port $port is already used by another process (PID $($listener.OwningProcess))."
    }

    Write-Host "Restarting the existing PHP server to load refreshed local secrets..."
    Stop-Process -Id $listener.OwningProcess -Force
    Wait-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
}

Write-Host "Starting PHP built-in server on http://localhost:$port ..."
$savedEnvironment = @{}
Get-ChildItem Env: | Where-Object { $_.Name -like 'BF_*' } | ForEach-Object {
    $savedEnvironment[$_.Name] = $_.Value
    Remove-Item -LiteralPath ("Env:" + $_.Name)
}

try {
    Start-Process -FilePath "php" -ArgumentList "-S localhost:$port router.php" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
}
finally {
    foreach ($name in $savedEnvironment.Keys) {
        Set-Item -LiteralPath ("Env:" + $name) -Value $savedEnvironment[$name]
    }
}

Start-Sleep -Seconds 1
Start-Process "http://localhost:$port"
Write-Host "Server started."
