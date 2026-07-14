param(
    [Parameter(Mandatory = $true)]
    [string]$LogPath
)

$ErrorActionPreference = 'Stop'
$workspaceRoot = (Resolve-Path -LiteralPath 'C:\DevWork').Path
$canonicalScript = Join-Path $workspaceRoot '.claude\scripts\session-log-update.ps1'

if (-not (Test-Path -LiteralPath $canonicalScript -PathType Leaf)) {
    throw "Canonical session close hook is missing: $canonicalScript"
}

& $canonicalScript -LogPath $LogPath
