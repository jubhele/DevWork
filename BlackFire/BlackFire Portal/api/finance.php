<?php
ob_start();
/**
 * Umlilo Portal — Finance Summary API
 * GET /api/finance.php?action=summary[&year=YYYY&month=M]
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user   = require_auth();
$action = clean($_GET['action'] ?? '', 30);

if ($action !== 'summary') json_err('Unknown action', 400);
require_perm('invoice.view');

$year  = (int)($_GET['year']  ?? date('Y'));
$month = (int)($_GET['month'] ?? date('n'));
if ($year < 2020 || $year > 2099) $year  = (int)date('Y');
if ($month < 1   || $month > 12)  $month = (int)date('n');

// MTD Invoiced — all invoices issued in this period (no duplicates: single table, no join)
$invoiced_mtd = (float)(db_row(
    "SELECT COALESCE(SUM(amount), 0) AS total
       FROM bf_invoices
      WHERE YEAR(invoice_date) = ? AND MONTH(invoice_date) = ?",
    [$year, $month]
)['total'] ?? 0);

// MTD Collected — payments received in this period
$collected_mtd = (float)(db_row(
    "SELECT COALESCE(SUM(amount), 0) AS total
       FROM bf_invoices
      WHERE status = 'Paid'
        AND YEAR(paid_date) = ? AND MONTH(paid_date) = ?",
    [$year, $month]
)['total'] ?? 0);

// YTD Revenue — all paid invoices in this calendar year
$ytd_revenue = (float)(db_row(
    "SELECT COALESCE(SUM(amount), 0) AS total
       FROM bf_invoices
      WHERE status = 'Paid' AND YEAR(paid_date) = ?",
    [$year]
)['total'] ?? 0);

// YTD Cost of Sales — cost transactions this year (avoid double-counting: sum debit only)
$ytd_costs = (float)(db_row(
    "SELECT COALESCE(SUM(debit), 0) AS total
       FROM bf_transactions
      WHERE category = 'Cost of Sales' AND YEAR(trans_date) = ?",
    [$year]
)['total'] ?? 0);

// Net Balance = YTD Revenue minus YTD Costs
$net_balance = $ytd_revenue - $ytd_costs;

// Outstanding — unpaid invoices (Sent, Overdue, Draft) — current state, not period-filtered
$outstanding_row = db_row(
    "SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS cnt
       FROM bf_invoices
      WHERE status IN ('Sent', 'Overdue', 'Draft')"
);
$outstanding_balance = (float)($outstanding_row['total'] ?? 0);

// Overdue
$overdue_row = db_row(
    "SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS cnt
       FROM bf_invoices WHERE status = 'Overdue'"
);
$overdue_amount = (float)($overdue_row['total'] ?? 0);
$overdue_count  = (int)($overdue_row['cnt'] ?? 0);

// Invoice aging by how many days past due_date (outstanding invoices only)
$aging = [];
$bands = [
    ['label' => 'Current (0–30 days)',  'min' => 0,  'max' => 30],
    ['label' => '31–60 days',           'min' => 31, 'max' => 60],
    ['label' => '61–90 days',           'min' => 61, 'max' => 90],
    ['label' => '90+ days',             'min' => 91, 'max' => 9999],
];
foreach ($bands as $b) {
    $row = db_row(
        "SELECT COALESCE(SUM(amount), 0) AS total
           FROM bf_invoices
          WHERE status IN ('Sent', 'Overdue')
            AND DATEDIFF(CURDATE(), due_date) BETWEEN ? AND ?",
        [$b['min'], $b['max']]
    );
    $aging[] = ['band' => $b['label'], 'amount' => (float)($row['total'] ?? 0)];
}

json_ok([
    'invoiced_mtd'       => $invoiced_mtd,
    'collected_mtd'      => $collected_mtd,
    'ytd_revenue'        => $ytd_revenue,
    'net_balance'        => $net_balance,
    'outstanding_balance'=> $outstanding_balance,
    'overdue_amount'     => $overdue_amount,
    'overdue_count'      => $overdue_count,
    'aging'              => $aging,
    'period'             => ['year' => $year, 'month' => $month],
]);
