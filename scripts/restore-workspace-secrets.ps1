param(
    [string]$EncryptedInput = "C:\DevWork\.env.enc",
    [string]$EncryptedOutput = "C:\DevWork\.env.enc",
    [string]$SourceOutput = "C:\DevWork\.env",
    [string]$MasterKeyFile = "",
    [string[]]$Targets = @(
        "C:\DevWork\BlackFire\BlackFire Portal\.env",
        "C:\DevWork\Astute\.env"
    )
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $EncryptedInput)) {
    throw "Encrypted vault not found: $EncryptedInput"
}

function Get-MasterKeyText {
    param(
        [string]$KeyFile,
        [string]$ExistingVault
    )

    if ($KeyFile) {
        if (-not (Test-Path -LiteralPath $KeyFile)) {
            throw "Master key file not found: $KeyFile"
        }
        $keyContent = (Get-Content -LiteralPath $KeyFile -Raw).Trim()
        if ($keyContent -match '(?m)^GBL_SECRET_MASTER_KEY_B64=(.+)$') {
            return $Matches[1].Trim()
        }
        return $keyContent
    }

    if (-not (Test-Path -LiteralPath $ExistingVault)) {
        throw "Provide -MasterKeyFile when restoring without an existing plaintext vault."
    }

    $vaultContent = Get-Content -LiteralPath $ExistingVault -Raw
    $keyLine = $vaultContent -split "`r?`n" | Where-Object { $_ -match '^GBL_SECRET_MASTER_KEY_B64=' } | Select-Object -First 1
    if (-not $keyLine) {
        throw "GBL_SECRET_MASTER_KEY_B64 is missing from $ExistingVault"
    }
    return ($keyLine -split '=', 2)[1].Trim()
}

$masterKeyText = Get-MasterKeyText -KeyFile $MasterKeyFile -ExistingVault $SourceOutput
if (-not $masterKeyText) {
    throw "The master key is empty."
}

try {
    $masterKey = [Convert]::FromBase64String($masterKeyText)
}
catch {
    throw "The master key is not valid base64."
}
if ($masterKey.Length -ne 32) {
    throw "The master key must decode to 32 bytes for AES-256."
}

$encrypted = (Get-Content -LiteralPath $EncryptedInput -Raw).Trim()
$secure = ConvertTo-SecureString -String $encrypted -Key $masterKey
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $plaintext = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
}
finally {
    if ($bstr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

$sourceDir = Split-Path -Path $SourceOutput -Parent
if (-not (Test-Path -LiteralPath $sourceDir)) {
    New-Item -ItemType Directory -Force -Path $sourceDir | Out-Null
}
Set-Content -LiteralPath $SourceOutput -Value $plaintext -Encoding utf8

& (Join-Path $PSScriptRoot 'sync-workspace-secrets.ps1') `
    -Source $SourceOutput `
    -Targets $Targets `
    -EncryptedOutput $EncryptedOutput

Write-Host "Restored plaintext vault: $SourceOutput"
