# Regression: ISSUE-001 — invoice Callout modal stayed on Loading and invoice creation allowed missing callouts
# Found by /qa on 2026-06-21
# Report: .gstack/qa-reports/qa-report-localhost-8080-2026-06-21.md

$portalRoot = Split-Path -Parent $PSScriptRoot
$portalJs = Get-Content -LiteralPath (Join-Path $portalRoot 'portal.js') -Raw
$portalPhp = Get-Content -LiteralPath (Join-Path $portalRoot 'portal.php') -Raw
$invoiceApi = Get-Content -LiteralPath (Join-Path $portalRoot 'api\invoices.php') -Raw
$quoteApi = Get-Content -LiteralPath (Join-Path $portalRoot 'api\quotes.php') -Raw

if ($portalJs -match '\bpillClass\s*\(') {
    throw 'openRecordChain still calls the undefined pillClass helper.'
}

foreach ($expected in @('pillH(q.status)', 'pillH(co.priority)', 'pillH(co.status)', 'pillH(inv.status)')) {
    if (-not $portalJs.Contains($expected)) {
        throw "Record-chain status rendering is missing $expected."
    }
}

if (-not $portalJs.Contains("if (!calloutRef || !quoteRef) { toast('Select the approved quote and call log this invoice belongs to'")) {
    throw 'The invoice form does not block submission without linked quote and callout records.'
}

if (-not $portalPhp.Contains('id="ni-callout-ref" required')) {
    throw 'The invoice form does not mark Linked Callout as required.'
}

if (-not $invoiceApi.Contains("require_fields(`$b, ['amount', 'quote_ref', 'callout_ref'])")) {
    throw 'The invoice API does not require quote_ref and callout_ref.'
}

if (-not $invoiceApi.Contains("strtotime(`$invoice_date . ' +14 days')")) {
    throw 'The invoice API does not default due_date to issue date plus 14 days.'
}

if (-not $invoiceApi.Contains('the linked quote belongs to a different call log')) {
    throw 'The invoice API does not reject a mismatched quote/callout chain.'
}

if (-not $quoteApi.Contains("json_err('Quote must be linked to a valid callout before conversion', 422)")) {
    throw 'Quote conversion can still produce an invoice without a valid callout.'
}

$phpCode = @'
chdir('C:/DevWork/BlackFire/BlackFire Portal');
$cfg = require 'config/config.php';
require_once 'includes/db.php';
$host = strtolower((string)($cfg['db_host'] ?? ''));
if (!in_array($host, ['localhost', '127.0.0.1', '::1'], true)) {
    fwrite(STDERR, 'Refusing non-local database');
    exit(2);
}
$row = db_row(
    "SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN COALESCE(i.callout_ref, '') = '' AND i.callout_id IS NULL THEN 1 ELSE 0 END) AS unlinked,
        SUM(CASE WHEN COALESCE(i.callout_ref, '') <> '' AND c.id IS NULL THEN 1 ELSE 0 END) AS broken_ref,
        SUM(CASE WHEN COALESCE(i.callout_ref, '') = '' AND i.callout_id IS NOT NULL THEN 1 ELSE 0 END) AS id_only
     FROM bf_invoices i
     LEFT JOIN bf_callouts c ON c.id = i.callout_id OR c.ref_id = i.callout_ref"
);
echo json_encode($row), PHP_EOL;
'@

$encodedPhp = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($phpCode))
$dbOutput = @(& php -r "eval(base64_decode('$encodedPhp'));" 2>$null)
if ($LASTEXITCODE -ne 0 -or $dbOutput.Count -eq 0) {
    throw 'Could not audit invoice-to-callout links in the local database.'
}

$audit = $dbOutput[-1] | ConvertFrom-Json
if ([int]$audit.unlinked -ne 0 -or [int]$audit.broken_ref -ne 0 -or [int]$audit.id_only -ne 0) {
    throw "Invoice linkage audit failed: unlinked=$($audit.unlinked), broken_ref=$($audit.broken_ref), id_only=$($audit.id_only)."
}

Write-Host "PASS: record modal renders with defined helpers and all $($audit.total) local invoices have valid callout links."
