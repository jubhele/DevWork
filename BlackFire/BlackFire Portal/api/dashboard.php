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
$open_callouts  = db_row("SELECT COUNT(*) AS n FROM bf_callouts WHERE status IN ('Open','In Progress')")['n'] ?? 0;
$pending_quotes = db_row("SELECT COUNT(*) AS n FROM bf_quotes WHERE status IN ('Draft','Sent','Pending Approval')")['n'] ?? 0;
$overdue_inv    = db_row("SELECT COUNT(*) AS n FROM bf_invoices WHERE status = 'Overdue'")['n'] ?? 0;
$urgent_calls   = db_row("SELECT COUNT(*) AS n FROM bf_callouts WHERE priority IN ('Urgent','Emergency') AND status NOT IN ('Completed','Invoiced')")['n'] ?? 0;
$pending_appr   = db_row("SELECT COUNT(*) AS n FROM bf_quotes WHERE approval_status = 'pending'")['n'] ?? 0;
$open_inv_count = db_row("SELECT COUNT(*) AS n FROM bf_invoices WHERE status IN ('Sent','Overdue')")['n'] ?? 0;

// MTD revenue (paid invoices this month)
$mtd = db_row(
    "SELECT COALESCE(SUM(amount),0) AS total FROM bf_invoices
     WHERE status = 'Paid' AND MONTH(paid_date) = MONTH(NOW()) AND YEAR(paid_date) = YEAR(NOW())"
)['total'] ?? 0;

// Net position (all transactions)
$net = db_row("SELECT COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) AS net FROM bf_transactions")['net'] ?? 0;

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

json_ok([
    'kpi' => [
        'open_callouts'  => (int)$open_callouts,
        'pending_quotes' => (int)$pending_quotes,
        'overdue_inv'    => (int)$overdue_inv,
        'urgent_calls'   => (int)$urgent_calls,
        'pending_appr'   => (int)$pending_appr,
        'open_inv_count' => (int)$open_inv_count,
        'mtd_revenue'    => (float)$mtd,
        'net_position'   => (float)$net,
    ],
    'recent_callouts' => $recent_callouts,
    'monthly_revenue' => $months,
]);
