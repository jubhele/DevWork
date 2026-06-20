param(
    [string]$Source = "C:\DevWork\.env",
    [string[]]$Targets = @(
        "C:\DevWork\BlackFire\BlackFire Portal\.env",
        "C:\DevWork\Astute\.env"
    )
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Source)) {
    throw "Source vault not found: $Source"
}

$sourceContent = Get-Content -LiteralPath $Source -Raw

foreach ($target in $Targets) {
    $targetDir = Split-Path -LiteralPath $target -Parent
    if (-not (Test-Path -LiteralPath $targetDir)) {
        continue
    }

    $needsWrite = $true
    if (Test-Path -LiteralPath $target) {
        $existing = Get-Content -LiteralPath $target -Raw
        if ($existing -eq $sourceContent) {
            $needsWrite = $false
        }
    }

    if ($needsWrite) {
        Set-Content -LiteralPath $target -Value $sourceContent -Encoding utf8
        Write-Host "Synced $target"
    }
}
