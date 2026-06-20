param(
    [string]$Source = "C:\DevWork\.env",
    [string[]]$Targets = @(
        "C:\DevWork\BlackFire\BlackFire Portal\.env",
        "C:\DevWork\Astute\.env"
    ),
    [string]$EncryptedOutput = "C:\DevWork\.env.enc"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Source)) {
    throw "Source vault not found: $Source"
}

$sourceContent = Get-Content -LiteralPath $Source -Raw
$sourceLines = $sourceContent -split "`r?`n"
$masterKeyLine = $sourceLines | Where-Object { $_ -match '^GBL_SECRET_MASTER_KEY_B64=' } | Select-Object -First 1
if (-not $masterKeyLine) {
    throw "GBL_SECRET_MASTER_KEY_B64 is missing from $Source"
}

$masterKeyText = ($masterKeyLine -split '=', 2)[1].Trim()
if (-not $masterKeyText) {
    throw "GBL_SECRET_MASTER_KEY_B64 is empty in $Source"
}

try {
    $masterKey = [Convert]::FromBase64String($masterKeyText)
}
catch {
    throw "GBL_SECRET_MASTER_KEY_B64 is not valid base64"
}
if ($masterKey.Length -ne 32) {
    throw "GBL_SECRET_MASTER_KEY_B64 must decode to 32 bytes for AES-256"
}

$secure = ConvertTo-SecureString -String $sourceContent -AsPlainText -Force
$encrypted = ($secure | ConvertFrom-SecureString -Key $masterKey).Trim()
Set-Content -LiteralPath $EncryptedOutput -Value $encrypted -Encoding utf8

function Get-MirrorPrefix {
    param([string]$TargetPath)

    switch -Regex ($TargetPath) {
        'BlackFire\\BlackFire Portal\\\.env$' { return 'BF_' }
        'Astute\\\.env$' { return 'AI_' }
        default { throw "No secret namespace is configured for mirror: $TargetPath" }
    }
}

function Get-SecretMirror {
    param(
        [string[]]$Lines,
        [string]$Prefix
    )

    $out = New-Object System.Collections.Generic.List[string]
    $out.Add("# Generated workspace secret mirror. Source namespace: $Prefix")
    $out.Add('# Regenerate with C:\DevWork\scripts\refresh-workspace-secrets.ps1')
    $out.Add('')

    foreach ($line in $Lines) {
        if ($line -notmatch '^([A-Za-z_][A-Za-z0-9_]*)=') {
            continue
        }
        if ($Matches[1].StartsWith($Prefix, [System.StringComparison]::Ordinal)) {
            $out.Add($line)
        }
    }

    return ($out -join "`r`n") + "`r`n"
}

foreach ($target in $Targets) {
    $targetDir = Split-Path -Path $target -Parent
    if (-not (Test-Path -LiteralPath $targetDir)) {
        Write-Warning "Skipping secret mirror because its directory does not exist: $targetDir"
        continue
    }

    $prefix = Get-MirrorPrefix -TargetPath $target
    $targetContent = Get-SecretMirror -Lines $sourceLines -Prefix $prefix
    $needsWrite = $true
    if (Test-Path -LiteralPath $target) {
        $existing = Get-Content -LiteralPath $target -Raw
        if ($existing -eq $targetContent) {
            $needsWrite = $false
        }
    }

    if ($needsWrite) {
        Set-Content -LiteralPath $target -Value $targetContent -Encoding utf8
        Write-Host "Synced $prefix secrets to $target"
    }
}

Write-Host "Refreshed encrypted vault: $EncryptedOutput"
