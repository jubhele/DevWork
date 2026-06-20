param(
    [string]$Source = "C:\DevWork\.env",
    [string]$EncryptedOutput = "C:\DevWork\.env.enc"
)

$ErrorActionPreference = 'Stop'

& (Join-Path $PSScriptRoot 'sync-workspace-secrets.ps1') `
    -Source $Source `
    -EncryptedOutput $EncryptedOutput
