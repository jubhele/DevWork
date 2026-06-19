<?php
/**
 * BlackFire Solutions — Safety & Operations Reports
 * Tabbed overview of safety compliance journey, business activity,
 * financials, workforce, and digital documents.
 * Requires portal login.
 */
ob_start();
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

$cfg = require __DIR__ . '/config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');

bf_session_start();
$user = current_user();
if (!$user) {
    ob_end_clean();
    header('Location: /');
    exit;
}

// ─── PERMISSION GATES ──────────────────────────────────────────────────────
// sysadmin bypasses all checks via can(). Others need explicit permissions.
$can_safety    = can('safety.view');          // Safety Journey, Workforce, Digital Docs
$can_callouts  = can('callout.view');          // Business Activity
$can_financial = can('invoice.view')           // Financial Flow
               || can('finance.income');

// If the user has no access to any tab, turn them away.
if (!$can_safety && !$can_callouts && !$can_financial) {
    ob_end_clean();
    http_response_code(403);
    header('Location: /');
    exit;
}

// Build the set of tabs this user may see, in display order.
$allowed_tabs = array_filter([
    'safety'    => $can_safety,
    'callouts'  => $can_callouts,
    'financial' => $can_financial,
    'workforce' => $can_safety,
    'docs'      => $can_safety,
]);

$tab = preg_replace('/[^a-z_]/', '', strtolower($_GET['tab'] ?? 'safety'));
// Fall back to the first tab the user can actually see.
if (!isset($allowed_tabs[$tab])) {
    $tab = array_key_first($allowed_tabs);
}
$export = isset($_GET['export']);

// ═══════════════════════════════════════════════════════════════════════════
// DATA QUERIES
// ═══════════════════════════════════════════════════════════════════════════

function r_safety(): array {
    try {
        return db_select("
            SELECT sf.ref_id, sf.audit_date, sf.score,
                   CASE
                     WHEN sf.score >= 89 THEN 'GREEN'
                     WHEN sf.score >= 74 THEN 'YELLOW'
                     WHEN sf.score >= 50 THEN 'ORANGE'
                     ELSE 'RED'
                   END AS band,
                   COALESCE(SUM(CASE WHEN si.result = 'To Standard' THEN 1 ELSE 0 END), 0) AS items_to_standard,
                   COALESCE(SUM(CASE WHEN si.result != 'N/A'        THEN 1 ELSE 0 END), 0) AS items_applicable,
                   sf.region       AS site_name,
                   sf.auditor_name AS audited_by,
                   sf.status
            FROM bf_safety_files sf
            LEFT JOIN bf_safety_items si ON si.file_ref = sf.ref_id
            GROUP BY sf.id
            ORDER BY sf.audit_date ASC
        ");
    } catch (Throwable $e) { return []; }
}

function r_callouts(): array {
    try {
        return db_select("
            SELECT c.ref_id, c.client_name,
                   SUBSTRING(c.description,1,72) AS description,
                   c.status, c.priority, DATE(c.logged_at) AS date,
                   c.assigned_to, c.invoice_generated,
                   q.ref_id AS quote_ref, q.total_amount AS quote_amount,
                   q.status AS quote_status,
                   i.ref_id AS invoice_ref, i.amount AS invoice_amount,
                   i.status AS invoice_status
            FROM bf_callouts c
            LEFT JOIN bf_quotes q ON q.callout_ref = c.ref_id
            LEFT JOIN bf_invoices i ON i.callout_ref = c.ref_id
            ORDER BY c.logged_at ASC
        ");
    } catch (Throwable $e) { return []; }
}

function r_invoices(): array {
    try {
        return db_select("
            SELECT i.ref_id, DATE(i.invoice_date) AS invoice_date,
                   DATE(i.due_date) AS due_date,
                   i.client_name, i.amount AS total_amount, i.status AS invoice_status,
                   p.payment_ref, DATE(p.payment_date) AS paid_date,
                   p.amount AS paid_amount,
                   (SELECT COUNT(*) FROM bf_attachments
                    WHERE entity_type='payment' AND entity_ref=p.payment_ref) > 0 AS has_remittance
            FROM bf_invoices i
            LEFT JOIN bf_payments p ON p.invoice_ref = i.ref_id
            ORDER BY i.invoice_date ASC
        ");
    } catch (Throwable $e) { return []; }
}

function r_payment_batches(): array {
    try {
        return db_select("
            SELECT payment_ref, payment_date, payment_method,
                   COUNT(*) AS invoice_count,
                   SUM(amount) AS total_paid,
                   GROUP_CONCAT(invoice_ref ORDER BY invoice_ref SEPARATOR ', ') AS invoices,
                   (SELECT COUNT(*) FROM bf_attachments
                    WHERE entity_type='payment' AND entity_ref=payment_ref) > 0 AS has_remittance
            FROM bf_payments
            GROUP BY payment_ref, payment_date, payment_method
            ORDER BY payment_date ASC
        ");
    } catch (Throwable $e) { return []; }
}

function r_personnel(): array {
    try {
        return db_select("
            SELECT sp.file_ref, u.name AS full_name, u.title AS role,
                   sp.company, COUNT(DISTINCT sc.id) AS compliance_records
            FROM bf_safety_personnel sp
            JOIN  bf_users u ON u.id = sp.user_id
            LEFT JOIN bf_safety_compliance sc ON sc.personnel_id = sp.id
            WHERE sp.is_active = 1
            GROUP BY sp.id, sp.file_ref, u.name, u.title, sp.company
            ORDER BY sp.file_ref ASC, u.name ASC
        ");
    } catch (Throwable $e) { return []; }
}

function r_compliance(): array {
    try {
        return db_select("
            SELECT sc.file_ref, sc.compliance_type, sc.category, sc.scope,
                   DATE(sc.issue_date) AS issue_date,
                   DATE(sc.expiry_date) AS expiry_date,
                   COALESCE(u.name, 'Company-wide') AS person,
                   CASE
                     WHEN sc.expiry_date IS NULL THEN 'N/A'
                     WHEN sc.expiry_date < CURDATE() THEN 'Expired'
                     WHEN sc.expiry_date < DATE_ADD(CURDATE(), INTERVAL 60 DAY) THEN 'Due Soon'
                     ELSE 'Valid'
                   END AS validity
            FROM bf_safety_compliance sc
            LEFT JOIN bf_safety_personnel sp ON sp.id = sc.personnel_id
            LEFT JOIN bf_users u ON u.id = sp.user_id
            ORDER BY sc.file_ref ASC, sc.compliance_type ASC
        ");
    } catch (Throwable $e) { return []; }
}

function r_signatures(): array {
    try {
        return db_select("
            SELECT entity_type, entity_ref, document_label,
                   signer_name, signer_email, signature_method,
                   status, DATE(sent_at) AS sent_date, DATE(signed_at) AS signed_date
            FROM bf_digital_signatures
            ORDER BY created_at ASC
        ");
    } catch (Throwable $e) { return []; }
}

function r_uploads(): array {
    try {
        return db_select("
            SELECT entity_ref, COALESCE(section_key,'—') AS section_key,
                   SUBSTRING(upload_purpose,1,75) AS purpose,
                   COALESCE(uploader_name,'—') AS uploader,
                   COALESCE(uploader_company,'—') AS company,
                   CONCAT(files_uploaded,'/',max_files) AS progress,
                   status, DATE(expires_at) AS expires, notify_email
            FROM bf_external_upload_tokens
            ORDER BY created_at ASC
        ");
    } catch (Throwable $e) { return []; }
}

// ═══════════════════════════════════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════════════════════════════════
if ($export) {
    $map = [
        'safety'    => ['r_safety',    'safety_journey',    $can_safety],
        'callouts'  => ['r_callouts',  'business_activity', $can_callouts],
        'financial' => ['r_invoices',  'financial_flow',    $can_financial],
        'workforce' => ['r_personnel', 'workforce',         $can_safety],
        'docs'      => ['r_signatures','digital_signatures',$can_safety],
    ];
    [$fn, $fname, $allowed] = $map[$tab] ?? ['r_safety', 'safety_journey', $can_safety];
    if (!$allowed) {
        ob_end_clean();
        http_response_code(403);
        exit;
    }
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    ini_set('display_errors', '0');
    $rows = call_user_func($fn);
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="blackfire_' . $fname . '_' . date('Ymd') . '.csv"');
    if (!empty($rows)) {
        $f = fopen('php://output', 'w');
        fputcsv($f, array_keys($rows[0]), ',', '"', '');
        foreach ($rows as $r) {
            fputcsv($f, array_map(static fn($v) => $v ?? '', $r), ',', '"', '');
        }
        fclose($f);
    }
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// FETCH & SUMMARISE
// ═══════════════════════════════════════════════════════════════════════════
$safety     = r_safety();
$callouts   = r_callouts();
$invoices   = r_invoices();
$payments   = r_payment_batches();
$personnel  = r_personnel();
$compliance = r_compliance();
$signatures = r_signatures();
$uploads    = r_uploads();

$current_score  = !empty($safety) ? (float)end($safety)['score'] : 0;
$base_score     = !empty($safety) ? (float)$safety[0]['score'] : 0;
$improvement    = round($current_score - $base_score, 2);
$total_invoiced = array_sum(array_column($invoices, 'total_amount'));
$total_paid     = array_sum(array_column($invoices, 'paid_amount'));
$paid_count     = count(array_filter($invoices, fn($r) => strtolower((string)($r['invoice_status'] ?? '')) === 'paid'));
$sig_signed     = count(array_filter($signatures, fn($r) => strtolower((string)($r['status'] ?? '')) === 'signed'));
$outstanding     = $total_invoiced - $total_paid;
$overdue_count   = count(array_filter($invoices, fn($r) => strtolower((string)($r['invoice_status'] ?? '')) === 'overdue'));
$personnel_count = count($personnel);

// Group invoices by ref_id for collapse/expand rows (payments as children)
$invoices_grouped = [];
foreach ($invoices as $row) {
    $id = $row['ref_id'];
    if (!isset($invoices_grouped[$id])) {
        $invoices_grouped[$id] = [
            'ref_id'         => $row['ref_id'],
            'invoice_date'   => $row['invoice_date'],
            'due_date'       => $row['due_date'],
            'total_amount'   => $row['total_amount'],
            'invoice_status' => $row['invoice_status'],
            'payments'       => [],
        ];
    }
    if (!empty($row['payment_ref'])) {
        $invoices_grouped[$id]['payments'][] = [
            'payment_ref'    => $row['payment_ref'],
            'paid_date'      => $row['paid_date'],
            'paid_amount'    => $row['paid_amount'],
            'has_remittance' => $row['has_remittance'],
        ];
    }
}

// Business period from invoice dates
$inv_dates = array_filter(array_column($invoices, 'invoice_date'));
$biz_from  = !empty($inv_dates) ? date('M Y', strtotime(min($inv_dates))) : '';
$biz_to    = !empty($inv_dates) ? date('M Y', strtotime(max($inv_dates))) : '';
$biz_range = $biz_from ? $biz_from . ($biz_to && $biz_to !== $biz_from ? ' — ' . $biz_to : '') : 'No data';

// ─── HELPERS ───────────────────────────────────────────────────────────────
function band_pill(string $band): string {
    $cls = match(strtoupper($band)) {
        'GREEN'  => 'p-grn', 'YELLOW' => 'p-ylw',
        'ORANGE' => 'p-org', 'RED'    => 'p-red',
        default  => 'p-dflt',
    };
    return "<span class=\"pill $cls\">$band</span>";
}
function status_pill(string $s): string {
    $cls = match(strtolower(trim($s))) {
        'paid','completed','signed','active','approved','valid'      => 'p-grn',
        'pending','sent','open','draft'                              => 'p-blu',
        'in_progress','in progress','partially used','due soon'      => 'p-ylw',
        'overdue','expired','cancelled','declined','red'             => 'p-red',
        default                                                      => 'p-dflt',
    };
    return "<span class=\"pill $cls\">$s</span>";
}
function zar(?float $v): string {
    return $v !== null ? 'R&nbsp;'.number_format($v, 2) : '—';
}
function nilstr(?string $v): string { return ($v === null || $v === '') ? '—' : htmlspecialchars($v); }

// ─── SCORE TREND CHART (inline SVG) ────────────────────────────────────────
function score_chart(array $files): string {
    if (empty($files)) return '';
    $w = 640; $h = 220; $pl = 48; $pr = 20; $pt = 20; $pb = 50;
    $pw = $w - $pl - $pr;
    $ph = $h - $pt - $pb;
    $n  = count($files);
    $step = $n > 1 ? $pw / ($n - 1) : $pw / 2;

    $bands = [
        [0,  50,  '#C0392B22', 'RED'],
        [50, 74,  '#E05A1A22', 'ORANGE'],
        [74, 89,  '#F5A62322', 'YELLOW'],
        [89, 100, '#1A7A4022', 'GREEN'],
    ];
    $svg  = "<svg viewBox=\"0 0 $w $h\" xmlns=\"http://www.w3.org/2000/svg\" style=\"width:100%;max-width:640px\">";
    foreach ($bands as [$lo, $hi, $fill, $label]) {
        $y1 = $pt + $ph * (1 - $hi / 100);
        $bh = $ph * ($hi - $lo) / 100;
        $svg .= "<rect x=\"$pl\" y=\"$y1\" width=\"$pw\" height=\"$bh\" fill=\"$fill\"/>";
        $ly  = $pt + $ph * (1 - ($lo + ($hi - $lo) / 2) / 100);
        $svg .= "<text x=\"".($pl+4)."\" y=\"$ly\" font-size=\"9\" fill=\"#7A8699\" dominant-baseline=\"middle\">$label</text>";
    }
    foreach ([0, 25, 50, 75, 100] as $pct) {
        $y = $pt + $ph * (1 - $pct / 100);
        $svg .= "<line x1=\"".($pl-4)."\" y1=\"$y\" x2=\"".($pl+$pw)."\" y2=\"$y\" stroke=\"#2B334033\" stroke-width=\"1\"/>";
        $svg .= "<text x=\"".($pl-6)."\" y=\"$y\" font-size=\"9\" fill=\"#7A8699\" text-anchor=\"end\" dominant-baseline=\"middle\">{$pct}%</text>";
    }
    $pts = [];
    foreach ($files as $i => $f) {
        $x = $pl + $i * $step;
        $y = $pt + $ph * (1 - (float)$f['score'] / 100);
        $pts[] = "$x,$y";
    }
    $svg .= "<polyline points=\"".implode(' ',$pts)."\" fill=\"none\" stroke=\"#F07820\" stroke-width=\"2.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>";
    foreach ($files as $i => $f) {
        $x    = $pl + $i * $step;
        $y    = $pt + $ph * (1 - (float)$f['score'] / 100);
        $dot  = match(strtoupper($f['band'])) {
            'GREEN'=>'#1A7A40','YELLOW'=>'#F5A623','ORANGE'=>'#E05A1A',default=>'#C0392B'
        };
        $sc   = number_format((float)$f['score'], 1);
        $svg .= "<circle cx=\"$x\" cy=\"$y\" r=\"5\" fill=\"$dot\" stroke=\"#fff\" stroke-width=\"1.5\"/>";
        $svg .= "<text x=\"$x\" y=\"".($y-12)."\" font-size=\"10\" font-weight=\"600\" fill=\"$dot\" text-anchor=\"middle\">{$sc}%</text>";
        $dl   = substr($f['audit_date'], 0, 7);
        $svg .= "<text x=\"$x\" y=\"".($pt+$ph+14)."\" font-size=\"9\" fill=\"#7A8699\" text-anchor=\"middle\">$dl</text>";
    }
    $svg .= "</svg>";
    return $svg;
}

ob_end_clean();
?>
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reports — <?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?></title>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --ember:#C0392B;--orange:#E05A1A;--amber:#F07820;--gold:#F5A623;
  --green:#1A7A40;--blue:#3B82F6;--warn:#E67E22;
}
[data-theme="light"]{
  --bg:#F5F1EA;--surface:#FFFFFF;--surface2:#EDE8DE;--surface3:#E4DED2;
  --border:#C8C1B3;--border2:#B8B1A3;
  --text:#1A1814;--text2:#4A4638;--muted:#7A7566;
  --accent:#C94A10;--th-bg:#EDE8DE;--row-hover:rgba(200,193,179,.25);
}
[data-theme="dark"]{
  --bg:#0A0E19;--surface:#141B26;--surface2:#1E2530;--surface3:#2B3340;
  --border:#2B3340;--border2:#3D4A58;
  --text:#E0E4EA;--text2:#A8B2BE;--muted:#7A8699;
  --accent:#F07820;--th-bg:#1E2530;--row-hover:rgba(43,51,64,.45);
}
*{margin:0;padding:0;box-sizing:border-box}
html{font-size:14px}
body{background:var(--bg);color:var(--text);font-family:'Instrument Sans',sans-serif;min-height:100vh}
a{color:inherit;text-decoration:none}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--border)}

.rpt-wrap{max-width:1200px;margin:0 auto;padding:24px 16px 64px}
.rpt-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px}
.rpt-header h1{font-family:'Big Shoulders Display',sans-serif;font-size:2rem;font-weight:900;letter-spacing:.03em;color:var(--accent)}
.rpt-header p{font-size:.85rem;color:var(--muted);margin-top:2px}
.rpt-header-actions{display:flex;align-items:center;gap:8px}
.btn-back{font-size:.8rem;padding:6px 14px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text2);cursor:pointer;transition:background .15s}
.btn-back:hover{background:var(--surface2)}
.btn-theme{width:32px;height:32px;border:1px solid var(--border);border-radius:6px;background:var(--surface);cursor:pointer;display:grid;place-items:center;font-size:1rem;transition:background .15s}
.btn-theme:hover{background:var(--surface2)}

.kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px}
.kpi-label{font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.kpi-value{font-family:'IBM Plex Mono',monospace;font-size:1.4rem;font-weight:500;color:var(--text)}
.kpi-sub{font-size:.75rem;color:var(--muted);margin-top:2px}
.kpi.accent .kpi-value{color:var(--accent)}
.kpi.green  .kpi-value{color:var(--green)}

.inv-row.expandable{cursor:pointer}
.inv-row.expandable:hover td{background:var(--row-hover)}
.tog-icon{display:inline-block;font-size:.6rem;color:var(--muted);margin-right:2px;transition:transform .15s}
.inv-detail td{background:var(--surface2)}
.inv-pmt-tbl{width:100%;border-collapse:collapse}
.inv-pmt-tbl th{background:var(--surface3);font-size:.7rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:6px 8px;text-align:left}
.inv-pmt-tbl td{padding:6px 8px;font-size:.82rem;border-bottom:1px solid var(--border)}

.tab-bar{display:flex;gap:2px;margin-bottom:20px;background:var(--surface2);border-radius:10px;padding:4px;flex-wrap:wrap}
.tab-btn{flex:1;min-width:120px;padding:8px 12px;border:none;background:transparent;border-radius:7px;cursor:pointer;font-family:'Instrument Sans',sans-serif;font-size:.82rem;font-weight:600;color:var(--muted);transition:all .15s;white-space:nowrap;text-align:center}
.tab-btn:hover{color:var(--text);background:var(--surface3)}
.tab-btn.active{background:var(--surface);color:var(--accent);box-shadow:0 1px 4px rgba(0,0,0,.12)}

.tab-panel{display:none}
.tab-panel.active{display:block}
.panel-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.panel-title{font-family:'Big Shoulders Display',sans-serif;font-size:1.25rem;font-weight:700;letter-spacing:.04em}
.panel-subtitle{font-size:.78rem;color:var(--muted);margin-top:2px}
.btn-csv{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid var(--border);border-radius:7px;background:var(--surface);font-size:.78rem;font-weight:600;color:var(--text2);cursor:pointer;transition:background .15s}
.btn-csv:hover{background:var(--surface2);color:var(--accent)}
.btn-csv svg{width:14px;height:14px;opacity:.7}

.chart-box{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:20px;overflow-x:auto}
.chart-box h3{font-size:.8rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:16px}

.tbl-wrap{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:20px}
.tbl-label{padding:12px 16px 0;font-size:.75rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
table{width:100%;border-collapse:collapse;font-size:.82rem}
thead th{background:var(--th-bg);padding:8px 12px;text-align:left;font-weight:600;font-size:.73rem;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);white-space:nowrap;border-bottom:1px solid var(--border)}
tbody tr{border-bottom:1px solid var(--border)}
tbody tr:last-child{border-bottom:none}
tbody tr:hover{background:var(--row-hover)}
td{padding:8px 12px;vertical-align:middle;color:var(--text2)}
td.mono{font-family:'IBM Plex Mono',monospace;font-size:.78rem}
td.hi{color:var(--text);font-weight:600}

.pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:.72rem;font-weight:600;white-space:nowrap;letter-spacing:.03em}
.p-grn{background:rgba(26,122,64,.12);border:1px solid rgba(26,122,64,.3);color:#1A6633}
.p-ylw{background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.3);color:#9A6A0A}
.p-org{background:rgba(224,90,26,.12);border:1px solid rgba(224,90,26,.3);color:#C05010}
.p-red{background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.3);color:#A82A1E}
.p-blu{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);color:#2563EB}
.p-dflt{background:rgba(122,117,102,.1);border:1px solid rgba(122,117,102,.2);color:#5A5448}
[data-theme="dark"] .p-grn{color:#2ecc71}
[data-theme="dark"] .p-ylw{color:#F5A623}
[data-theme="dark"] .p-org{color:#E05A1A}
[data-theme="dark"] .p-red{color:#C0392B}
[data-theme="dark"] .p-blu{color:#3B82F6}
[data-theme="dark"] .p-dflt{color:#7A8699}

.score-bar-wrap{display:flex;align-items:center;gap:8px}
.score-bar-track{flex:1;height:6px;background:var(--surface2);border-radius:3px;overflow:hidden;min-width:60px}
.score-bar-fill{height:100%;border-radius:3px}

@media(max-width:600px){
  .rpt-header{flex-direction:column}
  .tab-btn{min-width:100px;font-size:.76rem;padding:7px 8px}
  td,thead th{padding:6px 8px}
}
</style>
</head>
<body>

<div class="rpt-wrap">

  <!-- Header -->
  <div class="rpt-header">
    <div>
      <h1>Safety &amp; Operations Overview</h1>
      <p>AECI Chempark · <?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?> · <?= date('d M Y') ?> · <?= htmlspecialchars($user['username']) ?></p>
    </div>
    <div class="rpt-header-actions">
      <button class="btn-back" onclick="window.location='/'">← Portal</button>
      <button class="btn-theme" id="themeToggle" title="Toggle theme">☀</button>
    </div>
  </div>

  <!-- KPI Summary Row -->
  <div class="kpi-row">
    <div class="kpi green">
      <div class="kpi-label">Current Safety Score</div>
      <div class="kpi-value"><?= number_format($current_score, 1) ?>%</div>
      <div class="kpi-sub">Band: <?= end($safety)['band'] ?? '—' ?> · <?= count($safety) ?> audits on record</div>
    </div>
    <div class="kpi accent">
      <div class="kpi-label">Score Improvement</div>
      <div class="kpi-value">+<?= $improvement ?>%</div>
      <div class="kpi-sub"><?= $base_score ?>% → <?= $current_score ?>% over 16 months</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Total Invoiced</div>
      <div class="kpi-value"><?= 'R '.number_format($total_invoiced, 0) ?></div>
      <div class="kpi-sub"><?= count($invoices) ?> invoices · <?= $paid_count ?> paid</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Callouts</div>
      <div class="kpi-value"><?= count($callouts) ?></div>
      <div class="kpi-sub"><?= count($callouts) > 0 ? $biz_range : 'No callouts on record' ?></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Digital Signatures</div>
      <div class="kpi-value"><?= count($signatures) ?></div>
      <div class="kpi-sub"><?= $sig_signed ?> signed · <?= count($uploads) ?> upload tokens</div>
    </div>
    <?php if ($can_financial): ?>
    <div class="kpi green">
      <div class="kpi-label">Amount Collected</div>
      <div class="kpi-value">R <?= number_format($total_paid, 0) ?></div>
      <div class="kpi-sub"><?= $paid_count ?> invoice<?= $paid_count !== 1 ? 's' : '' ?> settled</div>
    </div>
    <div class="kpi <?= $outstanding > 0 ? 'accent' : '' ?>">
      <div class="kpi-label">Outstanding</div>
      <div class="kpi-value">R <?= number_format(max(0, $outstanding), 0) ?></div>
      <div class="kpi-sub"><?= $overdue_count > 0 ? $overdue_count . ' overdue' : ($outstanding <= 0 ? 'All settled' : 'Pending payment') ?></div>
    </div>
    <?php endif ?>
    <?php if ($can_safety && $personnel_count > 0): ?>
    <div class="kpi">
      <div class="kpi-label">Personnel On File</div>
      <div class="kpi-value"><?= $personnel_count ?></div>
      <div class="kpi-sub">Active site personnel</div>
    </div>
    <?php endif ?>
  </div>

  <!-- Tab Bar (only shows tabs this user can access) -->
  <div class="tab-bar" role="tablist">
    <?php if ($can_safety):    ?><button class="tab-btn <?= $tab==='safety'    ?'active':'' ?>" data-tab="safety"    role="tab">Safety Journey</button><?php endif ?>
    <?php if ($can_callouts):  ?><button class="tab-btn <?= $tab==='callouts'  ?'active':'' ?>" data-tab="callouts"  role="tab">Business Activity</button><?php endif ?>
    <?php if ($can_financial): ?><button class="tab-btn <?= $tab==='financial' ?'active':'' ?>" data-tab="financial" role="tab">Financial Flow</button><?php endif ?>
    <?php if ($can_safety):    ?><button class="tab-btn <?= $tab==='workforce' ?'active':'' ?>" data-tab="workforce" role="tab">Workforce</button><?php endif ?>
    <?php if ($can_safety):    ?><button class="tab-btn <?= $tab==='docs'      ?'active':'' ?>" data-tab="docs"      role="tab">Digital Docs</button><?php endif ?>
  </div>

  <!-- ═══ TAB: SAFETY JOURNEY ═══════════════════════════════════════════ -->
  <?php if ($can_safety): ?>
  <div class="tab-panel <?= $tab==='safety'?'active':'' ?>" id="panel-safety">
    <div class="panel-header">
      <div>
        <div class="panel-title">Safety File Journey — 2025/26</div>
        <div class="panel-subtitle">APS-EHS-FRM-010 · 49 applicable items · Contractor safety audit</div>
      </div>
      <a href="?tab=safety&export=1" class="btn-csv">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12l4-4 4 4M6 8V2M2 14h12"/></svg>
        Export CSV
      </a>
    </div>

    <div class="chart-box">
      <h3>Score Progression — RED → ORANGE → YELLOW → GREEN target</h3>
      <?= score_chart($safety) ?>
    </div>

    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Ref ID</th>
            <th>Audit Date</th>
            <th>Score</th>
            <th>Band</th>
            <th>Pass / Applicable</th>
            <th>Audited By</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
<?php foreach ($safety as $f):
  $pct = (float)$f['score'];
  $bar = match(strtoupper($f['band'])) {
    'GREEN'=>'#1A7A40','YELLOW'=>'#F5A623','ORANGE'=>'#E05A1A',default=>'#C0392B'
  };
?>
          <tr>
            <td class="mono hi"><?= htmlspecialchars($f['ref_id']) ?></td>
            <td class="mono"><?= htmlspecialchars($f['audit_date']) ?></td>
            <td>
              <div class="score-bar-wrap">
                <span class="mono" style="width:42px;color:var(--text)"><?= number_format($pct,2) ?>%</span>
                <div class="score-bar-track"><div class="score-bar-fill" style="width:<?= $pct ?>%;background:<?= $bar ?>"></div></div>
              </div>
            </td>
            <td><?= band_pill($f['band']) ?></td>
            <td class="mono"><?= (int)$f['items_to_standard'] ?> / <?= (int)$f['items_applicable'] ?></td>
            <td><?= nilstr($f['audited_by']) ?></td>
            <td><?= status_pill($f['status']) ?></td>
          </tr>
<?php endforeach ?>
        </tbody>
      </table>
    </div>
  </div>

  <?php endif // can_safety ?>

  <!-- ═══ TAB: BUSINESS ACTIVITY ════════════════════════════════════════ -->
  <?php if ($can_callouts): ?>
  <div class="tab-panel <?= $tab==='callouts'?'active':'' ?>" id="panel-callouts">
    <div class="panel-header">
      <div>
        <div class="panel-title">Business Activity — Callout Workflow</div>
        <div class="panel-subtitle">Call logged → Quote → PO received → Work done → Invoice raised → Paid</div>
      </div>
      <a href="?tab=callouts&export=1" class="btn-csv">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12l4-4 4 4M6 8V2M2 14h12"/></svg>
        Export CSV
      </a>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Callout Ref</th>
            <th>Date</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Quote Ref</th>
            <th>Quote Value</th>
            <th>Invoice Ref</th>
            <th>Invoice Status</th>
          </tr>
        </thead>
        <tbody>
<?php if (empty($callouts)): ?>
          <tr><td colspan="10" style="text-align:center;color:var(--muted);padding:28px 16px">
            No callout records found. Callouts are logged from the portal's <strong>Call Log</strong> module.
          </td></tr>
<?php else: foreach ($callouts as $c): ?>
          <tr>
            <td class="mono hi"><?= htmlspecialchars($c['ref_id']) ?></td>
            <td class="mono"><?= nilstr($c['date']) ?></td>
            <td><?= nilstr($c['description']) ?>…</td>
            <td><?= status_pill(ucfirst(strtolower((string)($c['priority'] ?? 'Normal')))) ?></td>
            <td><?= status_pill(ucfirst(str_replace('_',' ',(string)($c['status'] ?? '')))) ?></td>
            <td><?= nilstr($c['assigned_to']) ?></td>
            <td class="mono"><?= nilstr($c['quote_ref']) ?></td>
            <td class="mono"><?= $c['quote_amount'] ? zar((float)$c['quote_amount']) : '—' ?></td>
            <td class="mono"><?= nilstr($c['invoice_ref']) ?></td>
            <td><?= $c['invoice_status'] ? status_pill(ucfirst(strtolower($c['invoice_status']))) : '<span class="pill p-dflt">—</span>' ?></td>
          </tr>
<?php endforeach; endif ?>
        </tbody>
      </table>
    </div>
  </div>

  <?php endif // can_callouts ?>

  <!-- ═══ TAB: FINANCIAL FLOW ═══════════════════════════════════════════ -->
  <?php if ($can_financial): ?>
  <div class="tab-panel <?= $tab==='financial'?'active':'' ?>" id="panel-financial">
    <div class="panel-header">
      <div>
        <div class="panel-title">Financial Flow — Invoices &amp; Payments</div>
        <div class="panel-subtitle">All <?= count($invoices) ?> invoices · Total invoiced: <?= 'R '.number_format($total_invoiced, 2) ?></div>
      </div>
      <a href="?tab=financial&export=1" class="btn-csv">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12l4-4 4 4M6 8V2M2 14h12"/></svg>
        Export CSV
      </a>
    </div>

    <div class="tbl-wrap">
      <div class="tbl-label">Invoices <span style="font-weight:400;color:var(--muted);font-size:.75rem">— click a row to expand payments</span></div>
      <table>
        <thead>
          <tr>
            <th>Invoice Ref</th>
            <th>Date</th>
            <th>Due</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Payments</th>
            <th>Last Paid</th>
            <th>Remittance</th>
          </tr>
        </thead>
        <tbody>
<?php foreach ($invoices_grouped as $inv):
    $hasP = !empty($inv['payments']);
    $uid  = 'inv_' . preg_replace('/[^a-z0-9]/i', '_', $inv['ref_id']);
    $lastPmt  = $hasP ? end($inv['payments']) : null;
    $anyRemit = $hasP && count(array_filter($inv['payments'], fn($p) => $p['has_remittance'])) > 0;
?>
          <tr class="inv-row<?= $hasP ? ' expandable' : '' ?>"
              <?= $hasP ? 'onclick="toggleInv(\''.$uid.'\')"' : '' ?>>
            <td class="mono hi">
              <?php if ($hasP): ?><span class="tog-icon" id="icon-<?= $uid ?>">▶</span> <?php endif ?>
              <?= htmlspecialchars($inv['ref_id']) ?>
            </td>
            <td class="mono"><?= nilstr($inv['invoice_date']) ?></td>
            <td class="mono"><?= nilstr($inv['due_date']) ?></td>
            <td class="mono"><?= zar((float)$inv['total_amount']) ?></td>
            <td><?= status_pill(ucfirst(strtolower((string)($inv['invoice_status'] ?? '')))) ?></td>
            <td class="mono" style="text-align:center"><?= $hasP ? count($inv['payments']) : '—' ?></td>
            <td class="mono"><?= $lastPmt ? nilstr($lastPmt['paid_date']) : '—' ?></td>
            <td class="mono" style="text-align:center"><?= $anyRemit ? '✓' : '—' ?></td>
          </tr>
<?php if ($hasP): ?>
          <tr class="inv-detail" id="<?= $uid ?>" style="display:none">
            <td colspan="8" style="padding:0 0 4px 0">
              <table class="inv-pmt-tbl">
                <thead>
                  <tr>
                    <th style="padding-left:36px">Payment Ref</th>
                    <th>Paid Date</th>
                    <th>Amount</th>
                    <th>Remittance</th>
                    <th colspan="4"></th>
                  </tr>
                </thead>
                <tbody>
                <?php foreach ($inv['payments'] as $p): ?>
                  <tr>
                    <td class="mono hi" style="padding-left:36px"><?= htmlspecialchars($p['payment_ref']) ?></td>
                    <td class="mono"><?= nilstr($p['paid_date']) ?></td>
                    <td class="mono"><?= zar((float)$p['paid_amount']) ?></td>
                    <td class="mono" style="text-align:center"><?= $p['has_remittance'] ? '✓' : '—' ?></td>
                    <td colspan="4"></td>
                  </tr>
                <?php endforeach ?>
                </tbody>
              </table>
            </td>
          </tr>
<?php endif ?>
<?php endforeach ?>
        </tbody>
      </table>
    </div>

    <div class="tbl-wrap">
      <div class="tbl-label">Payment Batches</div>
      <table>
        <thead>
          <tr>
            <th>Payment Ref</th>
            <th>Date</th>
            <th>Method</th>
            <th>Invoices Settled</th>
            <th>Count</th>
            <th>Total Paid</th>
            <th>Remittance</th>
          </tr>
        </thead>
        <tbody>
<?php foreach ($payments as $p): ?>
          <tr>
            <td class="mono hi"><?= htmlspecialchars($p['payment_ref']) ?></td>
            <td class="mono"><?= nilstr($p['payment_date']) ?></td>
            <td><?= nilstr($p['payment_method']) ?></td>
            <td class="mono" style="font-size:.72rem"><?= nilstr($p['invoices']) ?></td>
            <td class="mono" style="text-align:center"><?= (int)$p['invoice_count'] ?></td>
            <td class="mono"><?= zar((float)$p['total_paid']) ?></td>
            <td class="mono" style="text-align:center"><?= $p['has_remittance'] ? '✓' : '—' ?></td>
          </tr>
<?php endforeach ?>
        </tbody>
      </table>
    </div>
  </div>

  <?php endif // can_financial ?>

  <!-- ═══ TAB: WORKFORCE ════════════════════════════════════════════════ -->
  <?php if ($can_safety): ?>
  <div class="tab-panel <?= $tab==='workforce'?'active':'' ?>" id="panel-workforce">
    <div class="panel-header">
      <div>
        <div class="panel-title">Workforce — Personnel &amp; Compliance</div>
        <div class="panel-subtitle"><?= count($personnel) ?> personnel records · <?= count($compliance) ?> compliance &amp; training records</div>
      </div>
      <a href="?tab=workforce&export=1" class="btn-csv">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12l4-4 4 4M6 8V2M2 14h12"/></svg>
        Export CSV
      </a>
    </div>

    <div class="tbl-wrap">
      <div class="tbl-label">Safety Personnel</div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Company</th>
            <th>ID Number</th>
            <th>Safety File</th>
            <th>Compliance Records</th>
          </tr>
        </thead>
        <tbody>
<?php if (empty($personnel)): ?>
          <tr><td colspan="6" style="text-align:center;color:var(--muted);padding:28px 16px">
            No personnel records found. Run <strong>cleanup_data_persons.sql</strong> to load workforce data.
          </td></tr>
<?php else: foreach ($personnel as $p): ?>
          <tr>
            <td class="hi"><?= nilstr($p['full_name']) ?></td>
            <td><?= nilstr($p['role']) ?></td>
            <td><?= nilstr($p['company']) ?></td>
            <td class="mono">—</td>
            <td class="mono"><?= nilstr($p['file_ref']) ?></td>
            <td style="text-align:center"><?= (int)$p['compliance_records'] ?></td>
          </tr>
<?php endforeach; endif ?>
        </tbody>
      </table>
    </div>

    <div class="tbl-wrap">
      <div class="tbl-label">Compliance &amp; Training Records</div>
      <table>
        <thead>
          <tr>
            <th>Compliance Type</th>
            <th>Category</th>
            <th>Scope</th>
            <th>Person</th>
            <th>Safety File</th>
            <th>Issue Date</th>
            <th>Expiry Date</th>
            <th>Validity</th>
          </tr>
        </thead>
        <tbody>
<?php if (empty($compliance)): ?>
          <tr><td colspan="8" style="text-align:center;color:var(--muted);padding:28px 16px">
            No compliance records found.
          </td></tr>
<?php else: foreach ($compliance as $c): ?>
          <tr>
            <td class="hi"><?= nilstr($c['compliance_type']) ?></td>
            <td><?= nilstr($c['category']) ?></td>
            <td><?= nilstr($c['scope']) ?></td>
            <td><?= nilstr($c['person']) ?></td>
            <td class="mono"><?= nilstr($c['file_ref']) ?></td>
            <td class="mono"><?= nilstr($c['issue_date']) ?></td>
            <td class="mono"><?= nilstr($c['expiry_date']) ?></td>
            <td><?= status_pill((string)($c['validity'] ?? '—')) ?></td>
          </tr>
<?php endforeach; endif ?>
        </tbody>
      </table>
    </div>
  </div>

  <?php endif // can_safety (workforce) ?>

  <!-- ═══ TAB: DIGITAL DOCS ════════════════════════════════════════════ -->
  <?php if ($can_safety): ?>
  <div class="tab-panel <?= $tab==='docs'?'active':'' ?>" id="panel-docs">
    <div class="panel-header">
      <div>
        <div class="panel-title">Digital Documents — Signatures &amp; External Uploads</div>
        <div class="panel-subtitle"><?= count($signatures) ?> signature records · <?= count($uploads) ?> external upload tokens</div>
      </div>
      <a href="?tab=docs&export=1" class="btn-csv">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12l4-4 4 4M6 8V2M2 14h12"/></svg>
        Export CSV
      </a>
    </div>

    <div class="tbl-wrap">
      <div class="tbl-label">Digital Signatures</div>
      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>Entity</th>
            <th>Signer</th>
            <th>Email</th>
            <th>Method</th>
            <th>Status</th>
            <th>Sent</th>
            <th>Signed</th>
          </tr>
        </thead>
        <tbody>
<?php if (empty($signatures)): ?>
          <tr><td colspan="8" style="text-align:center;color:var(--muted);padding:20px">Run migration_digital_signatures.sql to load records.</td></tr>
<?php else: foreach ($signatures as $s): ?>
          <tr>
            <td class="hi" style="max-width:220px;white-space:normal"><?= nilstr($s['document_label']) ?></td>
            <td class="mono"><?= nilstr($s['entity_ref']) ?></td>
            <td><?= nilstr($s['signer_name']) ?></td>
            <td style="font-size:.75rem"><?= nilstr($s['signer_email']) ?></td>
            <td><?= status_pill(str_replace('_',' ',ucfirst((string)($s['signature_method'] ?? '')))) ?></td>
            <td><?= status_pill(ucfirst(strtolower((string)($s['status'] ?? '')))) ?></td>
            <td class="mono"><?= nilstr($s['sent_date']) ?></td>
            <td class="mono"><?= nilstr($s['signed_date']) ?></td>
          </tr>
<?php endforeach; endif ?>
        </tbody>
      </table>
    </div>

    <div class="tbl-wrap">
      <div class="tbl-label">External Upload Tokens</div>
      <table>
        <thead>
          <tr>
            <th>Safety File</th>
            <th>Section</th>
            <th>Purpose</th>
            <th>Uploader</th>
            <th>Company</th>
            <th>Progress</th>
            <th>Status</th>
            <th>Expires</th>
            <th>Notify</th>
          </tr>
        </thead>
        <tbody>
<?php if (empty($uploads)): ?>
          <tr><td colspan="9" style="text-align:center;color:var(--muted);padding:20px">Run migration_external_uploads.sql to load records.</td></tr>
<?php else: foreach ($uploads as $u): ?>
          <tr>
            <td class="mono hi"><?= nilstr($u['entity_ref']) ?></td>
            <td style="text-align:center"><?= nilstr($u['section_key']) ?></td>
            <td style="max-width:200px;white-space:normal;font-size:.78rem"><?= nilstr($u['purpose']) ?>…</td>
            <td><?= nilstr($u['uploader']) ?></td>
            <td><?= nilstr($u['company']) ?></td>
            <td class="mono" style="text-align:center"><?= nilstr($u['progress']) ?></td>
            <td><?= status_pill(ucfirst(strtolower((string)($u['status'] ?? '')))) ?></td>
            <td class="mono"><?= nilstr($u['expires']) ?></td>
            <td style="font-size:.75rem"><?= nilstr($u['notify_email']) ?></td>
          </tr>
<?php endforeach; endif ?>
        </tbody>
      </table>
    </div>
  </div>

  <?php endif // can_safety (docs) ?>

</div><!-- /rpt-wrap -->

<script>
(function(){
  const btns   = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tab;
      btns.forEach(b  => b.classList.toggle('active', b.dataset.tab === t));
      panels.forEach(p => p.classList.toggle('active', p.id === 'panel-' + t));
      history.replaceState(null, '', '?tab=' + t);
    });
  });

  function toggleInv(uid) {
    const detail = document.getElementById(uid);
    const icon   = document.getElementById('icon-' + uid);
    if (!detail) return;
    const open = detail.style.display !== 'none';
    detail.style.display = open ? 'none' : '';
    if (icon) icon.textContent = open ? '▶' : '▼';
  }
  window.toggleInv = toggleInv;

  const themeBtn = document.getElementById('themeToggle');
  const html = document.documentElement;
  const saved = localStorage.getItem('bf_theme') || 'light';
  html.dataset.theme = saved;
  themeBtn.textContent = saved === 'dark' ? '☀' : '🌙';
  themeBtn.addEventListener('click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    themeBtn.textContent = next === 'dark' ? '☀' : '🌙';
    localStorage.setItem('bf_theme', next);
  });
})();
</script>
</body>
</html>
