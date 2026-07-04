# BlackFire Portal — full local dev launcher
# Starts all three layers via ..\start-dev.ps1:
#   1) PHP portal/API (:8080)
#   2) Next.js web app (:3000)
#   3) Expo mobile app
#
# Usage:
#   .\start-local.ps1
#   .\start-local.ps1 -NoMobile

param([switch]$NoMobile)

$workspaceRefresh = Join-Path $PSScriptRoot "..\..\scripts\refresh-workspace-secrets.ps1"
if (Test-Path -LiteralPath $workspaceRefresh) {
    & $workspaceRefresh
}

$startDevScript = Join-Path (Split-Path -Parent $PSScriptRoot) "start-dev.ps1"
if (-not (Test-Path -LiteralPath $startDevScript)) {
    throw "Could not find full-stack launcher at '$startDevScript'."
}

if ($NoMobile) {
    & $startDevScript -NoMobile
}
else {
    & $startDevScript
}
