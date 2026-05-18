param(
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 8080
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$phpExe = $null

try {
    $phpCommand = Get-Command php -ErrorAction Stop
    $phpExe = $phpCommand.Source
} catch {
    $wingetPhp = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe'
    if (Test-Path $wingetPhp) {
        $phpExe = $wingetPhp
    }
}

if (-not $phpExe) {
    Write-Error "PHP was not found. Install PHP first, then run this script again."
    exit 1
}

$phpDir = Split-Path -Parent $phpExe
$phpDirIni = $phpDir -replace '\\','/'
$localIni = Join-Path $projectRoot 'php.local.ini'
$iniLines = @(
    '[PHP]',
    ('extension_dir="' + $phpDirIni + '/ext"'),
    'extension=php_openssl.dll',
    'extension=php_pdo_mysql.dll',
    'date.timezone=Africa/Johannesburg'
)
Set-Content -Path $localIni -Value $iniLines -Encoding utf8

$url = "http://$BindHost`:$Port/"
Write-Host "Starting PHP server in: $projectRoot"
Write-Host "URL: $url"
Write-Host "Using ini: $localIni"
Write-Host "Press Ctrl+C to stop the server."

& $phpExe -c $localIni -S "$BindHost`:$Port" -t $projectRoot
