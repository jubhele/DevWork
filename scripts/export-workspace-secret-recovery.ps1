param(
    [string]$Source = "C:\DevWork\.env",
    [string]$EncryptedVault = "C:\DevWork\.env.enc",
    [string]$DestinationRoot = (Join-Path $env:USERPROFILE 'DevWork-Vault-Backups')
)

$ErrorActionPreference = 'Stop'

& (Join-Path $PSScriptRoot 'refresh-workspace-secrets.ps1') `
    -Source $Source `
    -EncryptedOutput $EncryptedVault

$sourceContent = Get-Content -LiteralPath $Source -Raw
$keyLine = $sourceContent -split "`r?`n" | Where-Object { $_ -match '^GBL_SECRET_MASTER_KEY_B64=' } | Select-Object -First 1
if (-not $keyLine) {
    throw "GBL_SECRET_MASTER_KEY_B64 is missing from $Source"
}

$keyText = ($keyLine -split '=', 2)[1].Trim()
try {
    $keyBytes = [Convert]::FromBase64String($keyText)
}
catch {
    throw "GBL_SECRET_MASTER_KEY_B64 is not valid base64"
}
if ($keyBytes.Length -ne 32) {
    throw "GBL_SECRET_MASTER_KEY_B64 must decode to 32 bytes for AES-256"
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$vaultDir = Join-Path $DestinationRoot 'encrypted-vaults'
$keyDir = Join-Path $DestinationRoot 'recovery-keys'
New-Item -ItemType Directory -Force -Path $vaultDir | Out-Null
New-Item -ItemType Directory -Force -Path $keyDir | Out-Null

$vaultExport = Join-Path $vaultDir "workspace-vault_$stamp.env.enc"
$keyExport = Join-Path $keyDir "workspace-vault_$stamp.key"
$manifestExport = Join-Path $vaultDir "workspace-vault_$stamp.sha256"

Copy-Item -LiteralPath $EncryptedVault -Destination $vaultExport
Set-Content -LiteralPath $keyExport -Value "GBL_SECRET_MASTER_KEY_B64=$keyText" -Encoding utf8
$hash = (Get-FileHash -LiteralPath $vaultExport -Algorithm SHA256).Hash
Set-Content -LiteralPath $manifestExport -Value "$hash  $([System.IO.Path]::GetFileName($vaultExport))" -Encoding ascii

Write-Host "Encrypted vault export: $vaultExport"
Write-Host "Recovery key export:   $keyExport"
Write-Host "SHA-256 manifest:      $manifestExport"
Write-Warning "Store the encrypted vault and recovery key in separate secure locations."
