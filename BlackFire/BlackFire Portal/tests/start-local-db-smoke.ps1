param(
    [string]$BaseUrl = 'http://localhost:8080'
)

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$captcha = Invoke-RestMethod -Uri "$BaseUrl/api/auth.php?action=captcha" `
    -WebSession $session `
    -Method Get `
    -TimeoutSec 10

if ([string]$captcha.question -notmatch '(\d+)\s*\+\s*(\d+)') {
    throw 'Could not parse the login security question.'
}

$answer = [int]$Matches[1] + [int]$Matches[2]
$payload = @{
    username = 'local_db_smoke_probe'
    password = 'not-a-real-password'
    captcha = $answer
} | ConvertTo-Json -Compress

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth.php?action=login" `
        -WebSession $session `
        -Method Post `
        -Body $payload `
        -ContentType 'application/json' `
        -UseBasicParsing `
        -TimeoutSec 15
    $statusCode = [int]$response.StatusCode
    $content = $response.Content
}
catch {
    $httpResponse = $_.Exception.Response
    if (-not $httpResponse) {
        throw
    }

    $statusCode = [int]$httpResponse.StatusCode
    $reader = New-Object System.IO.StreamReader($httpResponse.GetResponseStream())
    $content = $reader.ReadToEnd()
}

if ($statusCode -eq 503 -or $content -match 'Database connection failed') {
    throw 'Local authentication endpoint cannot connect to MySQL.'
}

if ($statusCode -ne 401 -or $content -notmatch 'Invalid username or password') {
    throw "Unexpected authentication probe response: HTTP $statusCode $content"
}

$portalRoot = Split-Path -Parent $PSScriptRoot
$phpCode = @'
chdir('__PORTAL_ROOT__');
require_once 'includes/db.php';
$cfg = require 'config/config.php';
$host = strtolower((string)($cfg['db_host'] ?? ''));
if (!in_array($host, ['localhost', '127.0.0.1', '::1'], true)) {
    fwrite(STDERR, 'Refusing non-local database');
    exit(2);
}
$required = [
    ['bf_transactions', 'callout_ref', 'install/migration_transactions_callout_ref_20260709.sql'],
    ['bf_payments', 'reversed_at', 'install/migration_payment_reversal_20260716.sql'],
    ['bf_payments', 'reversed_by_user_id', 'install/migration_payment_reversal_20260716.sql'],
    ['bf_payments', 'reversal_reason', 'install/migration_payment_reversal_20260716.sql'],
];
foreach ($required as [$table, $column, $migration]) {
    $row = db_row(
        'SELECT COUNT(*) AS present FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [$table, $column]
    );
    if ((int)($row['present'] ?? 0) !== 1) {
        fwrite(STDERR, "Missing required schema $table.$column; run $migration");
        exit(3);
    }
}
'@
$phpCode = $phpCode.Replace('__PORTAL_ROOT__', $portalRoot.Replace('\', '/').Replace("'", "\'"))
$encodedPhp = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($phpCode))
$schemaOutput = & php -r "eval(base64_decode('$encodedPhp'));" 2>&1
if ($LASTEXITCODE -ne 0) {
    throw "Local database schema check failed: $schemaOutput"
}

Write-Host 'PASS: localhost authentication reached MySQL and required schema is present.'
