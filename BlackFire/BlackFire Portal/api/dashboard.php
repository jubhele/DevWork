<?php
ob_start();
/**
 * Umlilo Portal — Dashboard Stats API
 * GET /api/dashboard.php
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();
require_auth();

// KPI counts
$open_callouts    = db_row("SELECT COUNT(*) AS n FROM bf_callouts WHERE status IN ('Open','In Progress')")['n'] ?? 0;
$pending_quotes   = db_row("SELECT COUNT(*) AS n FROM bf_quotes WHERE status IN ('Draft','Sent','Pending Approval')")['n'] ?? 0;
$overdue_invoices = db_row("SELECT COUNT(*) AS n FROM bf_invoices WHERE status = 'Overdue'")['n'] ?? 0;
$active_clients   = db_row("SELECT COUNT(*) AS n FROM bf_clients WHERE is_active = 1")['n'] ?? 0;

// Safety score: average score across active, approved safety files (null if none exist)
$ss_row      = db_row("SELECT AVG(score) AS avg FROM bf_safety_files WHERE status = 'Approved' AND is_active = 1");
$safety_score = ($ss_row['avg'] !== null) ? round((float)$ss_row['avg'], 1) : null;

// MTD revenue (paid invoices this month)
$mtd = db_row(
    "SELECT COALESCE(SUM(amount),0) AS total FROM bf_invoices
     WHERE status = 'Paid' AND MONTH(paid_date) = MONTH(NOW()) AND YEAR(paid_date) = YEAR(NOW())"
)['total'] ?? 0;

// Recent callouts (5 most recent)
$recent_callouts = db_select("SELECT ref_id, client_name, service, status, priority, callout_date FROM bf_callouts ORDER BY callout_date DESC LIMIT 5");

// Monthly revenue chart (last 6 months)
$months = [];
for ($i = 5; $i >= 0; $i--) {
    $ts     = strtotime("-$i months");
    $y      = date('Y', $ts);
    $m      = date('n', $ts);
    $label  = date('M', $ts);
    $row    = db_row(
        "SELECT COALESCE(SUM(amount),0) AS total FROM bf_invoices
         WHERE status = 'Paid' AND YEAR(paid_date) = ? AND MONTH(paid_date) = ?",
        [$y, $m]
    );
    $months[] = ['label' => $label, 'value' => (float)($row['total'] ?? 0)];
}

// Wrap KPIs under 'data' to match ApiResponse<DashboardKPIs> contract
json_ok([
    'data' => [
        'open_callouts'    => (int)$open_callouts,
        'overdue_invoices' => (int)$overdue_invoices,
        'mtd_revenue'      => (float)$mtd,
        'safety_score'     => $safety_score,
        'pending_quotes'   => (int)$pending_quotes,
        'active_clients'   => (int)$active_clients,
    ],
    'recent_callouts' => $recent_callouts,
    'monthly_revenue' => $months,
]);
