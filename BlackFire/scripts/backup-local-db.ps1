# Backup the local BlackFire Portal MySQL database (gzipped, timestamped).
# Credentials come from the portal .env (BF_DB_*) — nothing hardcoded.
# PowerShell 5.1 compatible.

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile   = Join-Path $scriptDir '..\BlackFire Portal\.env'
$backupDir = Join-Path $scriptDir '..\_backups'
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'

# mysqldump is not on PATH on this machine
$mysqldump = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe'
if (-not (Test-Path $mysqldump)) { $mysqldump = 'mysqldump' }

# ── 1. Load credentials from .env ────────────────────────────────────────────
if (-not (Test-Path $envFile)) {
    Write-Host "[ERROR] .env not found: $envFile" -ForegroundColor Red
    exit 1
}
$envVars = @{}
foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*([A-Z0-9_]+)\s*=(.*)$') { $envVars[$Matches[1]] = $Matches[2].Trim() }
}
$dbHost = if ($envVars['BF_DB_HOST']) { $envVars['BF_DB_HOST'] } else { 'localhost' }
$dbPort = if ($envVars['BF_DB_PORT']) { $envVars['BF_DB_PORT'] } else { '3306' }
$dbName = $envVars['BF_DB_NAME']
$dbUser = $envVars['BF_DB_USER']
$dbPass = $envVars['BF_DB_PASS']

if (-not $dbName -or -not $dbUser -or -not $dbPass) {
    Write-Host '[ERROR] BF_DB_NAME / BF_DB_USER / BF_DB_PASS missing in .env' -ForegroundColor Red
    exit 2
}

# ── 2. Ensure backup directory ───────────────────────────────────────────────
New-Item -ItemType Directory -Force $backupDir | Out-Null
$backupDir = (Resolve-Path $backupDir).Path

# ── 3. Dump MySQL database (gzipped) ─────────────────────────────────────────
$dbDump = Join-Path $backupDir "portal_db_$timestamp.sql.gz"
Write-Host ''
Write-Host "Dumping database: $dbName ..."

# MYSQL_PWD keeps the password off the process command line;
# --no-tablespaces: portal user lacks the PROCESS privilege
$env:MYSQL_PWD = $dbPass
$rawSql = Join-Path $env:TEMP "portal_db_$timestamp.sql"
& $mysqldump `
    --host=$dbHost `
    --port=$dbPort `
    --user=$dbUser `
    --single-transaction `
    --routines `
    --triggers `
    --events `
    --add-drop-table `
    --no-tablespaces `
    --result-file=$rawSql `
    $dbName
$dumpExit = $LASTEXITCODE
$env:MYSQL_PWD = $null

if ($dumpExit -ne 0 -or -not (Test-Path $rawSql)) {
    if (Test-Path $rawSql) { Remove-Item $rawSql -Force }
    Write-Host '[ERROR] Database dump failed. Check DB_NAME / DB_USER / DB_PASS.' -ForegroundColor Red
    exit 3
}

# MySQL 8 utf8mb4_0900_* collations don't exist on the cPanel server (MariaDB) —
# map them to utf8mb4_unicode_ci / utf8mb4_bin so dumps restore cleanly there
$sql = [IO.File]::ReadAllText($rawSql)
$sql = $sql -replace 'utf8mb4_0900_bin', 'utf8mb4_bin'
$sql = [regex]::Replace($sql, 'utf8mb4_0900_[a-z_]+', 'utf8mb4_unicode_ci')
[IO.File]::WriteAllText($rawSql, $sql)

$inStream  = [IO.File]::OpenRead($rawSql)
$outStream = [IO.File]::Create($dbDump)
$gzip = New-Object IO.Compression.GZipStream($outStream, [IO.Compression.CompressionMode]::Compress)
$inStream.CopyTo($gzip)
$gzip.Dispose(); $outStream.Dispose(); $inStream.Dispose()
Remove-Item $rawSql -Force

$size = '{0:N0} KB' -f ((Get-Item $dbDump).Length / 1KB)
Write-Host "[OK] Database dumped -> $(Split-Path $dbDump -Leaf)  ($size)" -ForegroundColor Green
