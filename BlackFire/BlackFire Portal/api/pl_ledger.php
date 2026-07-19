<?php
ob_start();
/**
 * P&L Ledger API
 * GET /api/pl_ledger.php?action=<action>[&client_id=1]
 *
 * Actions:
 *   remittances    — all payment remittances (bf_remittances)
 *   bank_statement — bank-confirmed receipts summary
 *   invoices       — sales invoices with remittance cross-ref
 *   supplier_costs — Siyasiza + Megahertz costs (bf_supplier_invoices)
 *   monthly_pl     — monthly P&L: cash received vs costs vs margin
 *   summary        — headline KPIs for finance dashboard
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user   = require_auth();
$action = clean($_GET['action'] ?? '', 40);

require_perm('finance.income');

function ledger_period_date(string $value, string $field): string {
  if ($value === '') return '';
  $date = DateTime::createFromFormat('!Y-m-d', $value);
  if (!$date || $date->format('Y-m-d') !== $value) json_err("Invalid {$field}; expected YYYY-MM-DD", 400);
  return $value;
}

function ledger_period_clause(string $column, string $from, string $to): array {
  $clauses = [];
  $params = [];
  if ($from !== '') { $clauses[] = "{$column} >= ?"; $params[] = $from; }
  if ($to !== '') { $clauses[] = "{$column} <= ?"; $params[] = $to; }
  return ['sql' => $clauses ? ' AND ' . implode(' AND ', $clauses) : '', 'params' => $params];
}

function ledger_supplier_flags(): array {
  $flags = ['Siyasiza Group' => true, 'Megahertz Systems' => true];
  try {
    foreach (db_select("SELECT name, active FROM bf_suppliers") as $r) {
      if (array_key_exists($r['name'], $flags)) $flags[$r['name']] = (bool)(int)$r['active'];
    }
  } catch (PDOException $e) {
    // bf_suppliers not migrated yet — treat all suppliers as active
  }
  return $flags;
}

$period_from = ledger_period_date(clean($_GET['from'] ?? '', 10), 'from');
$period_to = ledger_period_date(clean($_GET['to'] ?? '', 10), 'to');
if ($period_from !== '' && $period_to !== '' && $period_from > $period_to) json_err('from must be on or before to', 400);

switch ($action) {

  // ── REMITTANCES ───────────────────────────────────────────────
  case 'remittances':
    $period = ledger_period_clause('r.remittance_date', $period_from, $period_to);
    $rows = db_select(
      "SELECT r.*
         FROM bf_remittances r
        WHERE 1=1 {$period['sql']}
        ORDER BY r.remittance_date ASC",
      $period['params']
    );
    $total          = array_sum(array_column($rows, 'amount'));
    $bank_confirmed = array_sum(array_map(
      fn($r) => $r['bank_confirmed'] ? $r['amount'] : 0, $rows
    ));
    $unreconciled   = $total - $bank_confirmed;
    json_ok([
      'rows'           => $rows,
      'total'          => (float)$total,
      'bank_confirmed' => (float)$bank_confirmed,
      'unreconciled'   => (float)$unreconciled,
    ]);
    break;

  // ── BANK STATEMENT (confirmed receipts only) ──────────────────
  case 'bank_statement':
    $period = ledger_period_clause('bank_date', $period_from, $period_to);
    $rows = db_select(
      "SELECT control_no, cheque_no, bank_date, amount, invoices_covered
         FROM bf_remittances
        WHERE bank_confirmed = 1 {$period['sql']}
        ORDER BY bank_date ASC",
      $period['params']
    );
    json_ok([
      'rows'  => $rows,
      'total' => (float)array_sum(array_column($rows, 'amount')),
      'count' => count($rows),
    ]);
    break;

  // ── SALES INVOICES ────────────────────────────────────────────
  case 'invoices':
    $period = ledger_period_clause('i.invoice_date', $period_from, $period_to);
    $rows = db_select(
      "SELECT
          i.invoice_date,
          i.ref_id,
          i.po,
          i.client_name,
          LEFT(COALESCE(i.callout_ref, ''), 50) AS callout_ref,
          i.amount,
          COALESCE(r.control_no, '') AS remittance_ctrl,
          COALESCE(r.cheque_no,  '') AS cheque_no,
          r.bank_date AS payment_date,
          i.status,
          CASE WHEN i.status = 'Paid' AND r.bank_date IS NOT NULL
               THEN DATEDIFF(r.bank_date, i.invoice_date)
               ELSE NULL END AS age_days
       FROM bf_invoices i
       LEFT JOIN bf_remittances r
              ON FIND_IN_SET(i.ref_id, REPLACE(r.invoices_covered, ' ', '')) > 0
          OR r.invoices_covered LIKE CONCAT('%', i.ref_id, '%')
      WHERE i.client_name = 'AECI Chempark' {$period['sql']}
      ORDER BY i.invoice_date ASC",
      $period['params']
    );
    $total_invoiced   = (float)array_sum(array_column($rows, 'amount'));
    $paid_rows        = array_filter($rows, fn($r) => $r['status'] === 'Paid');
    $outstanding_rows = array_filter($rows, fn($r) => in_array($r['status'], ['Sent','Overdue','Draft']));
    json_ok([
      'rows'             => array_values($rows),
      'total_invoiced'   => $total_invoiced,
      'total_paid'       => (float)array_sum(array_column(array_values($paid_rows), 'amount')),
      'total_outstanding'=> (float)array_sum(array_column(array_values($outstanding_rows), 'amount')),
    ]);
    break;

  // ── SUPPLIER COSTS ────────────────────────────────────────────
  case 'supplier_costs':
    $period = ledger_period_clause('s.invoice_date', $period_from, $period_to);
    $rows = db_select(
      "SELECT
          s.invoice_date AS `date`,
          s.ref_id,
          s.supplier,
          s.description,
          s.total_amount AS amount,
          s.amount_paid,
          s.status,
          COALESCE(s.notes, '') AS notes
         FROM bf_supplier_invoices s
        WHERE s.supplier IN ('Siyasiza Group','Megahertz Systems','Nqobanathi Holdings','NkosinathiMajola (Pty) Ltd') {$period['sql']}
        ORDER BY s.supplier, s.invoice_date ASC",
      $period['params']
    );

    $by_supplier = [];
    $grand_total = 0.0;
    foreach ($rows as $r) {
      $sup = $r['supplier'];
      // Normalise old name variants to Siyasiza Group
      if (in_array($sup, ['Nqobanathi Holdings', 'NkosinathiMajola (Pty) Ltd'])) {
        $sup = 'Siyasiza Group';
        $r['supplier'] = $sup;
      }
      $by_supplier[$sup][] = $r;
      $grand_total += (float)$r['amount'];
    }

    $totals = [];
    foreach ($by_supplier as $sup => $items) {
      $totals[$sup] = array_sum(array_column($items, 'amount'));
    }

    json_ok([
      'rows'        => array_values($rows),
      'by_supplier' => $by_supplier,
      'totals'      => $totals,
      'grand_total' => $grand_total,
    ]);
    break;

  // ── MONTHLY P&L ───────────────────────────────────────────────
  case 'monthly_pl':
    // Cash received per month (bank-confirmed remittances only)
    $cash_period = ledger_period_clause('bank_date', $period_from, $period_to);
    $cash_rows = db_select(
      "SELECT DATE_FORMAT(bank_date, '%Y-%m') AS ym,
              SUM(amount) AS cash_received
         FROM bf_remittances
        WHERE bank_confirmed = 1 AND bank_date IS NOT NULL {$cash_period['sql']}
        GROUP BY ym
        ORDER BY ym ASC",
      $cash_period['params']
    );

    // Supplier costs per month
    $cost_period = ledger_period_clause('invoice_date', $period_from, $period_to);
    $cost_rows = db_select(
      "SELECT DATE_FORMAT(invoice_date, '%Y-%m') AS ym,
              supplier,
              SUM(total_amount) AS cost
         FROM bf_supplier_invoices
        WHERE supplier IN ('Siyasiza Group','Megahertz Systems','Nqobanathi Holdings','NkosinathiMajola (Pty) Ltd') {$cost_period['sql']}
        GROUP BY ym, supplier
        ORDER BY ym ASC",
      $cost_period['params']
    );

    // Build a map of all months that appear in either dataset
    $months_set = [];
    foreach ($cash_rows  as $r) $months_set[$r['ym']] = true;
    foreach ($cost_rows  as $r) $months_set[$r['ym']] = true;
    ksort($months_set);

    $cash_map = [];
    foreach ($cash_rows as $r) $cash_map[$r['ym']] = (float)$r['cash_received'];

    $siy_map = [];
    $mgh_map = [];
    foreach ($cost_rows as $r) {
      $sup = $r['supplier'];
      if (in_array($sup, ['Siyasiza Group','Nqobanathi Holdings','NkosinathiMajola (Pty) Ltd'])) {
        $siy_map[$r['ym']] = ($siy_map[$r['ym']] ?? 0) + (float)$r['cost'];
      } else {
        $mgh_map[$r['ym']] = ($mgh_map[$r['ym']] ?? 0) + (float)$r['cost'];
      }
    }

    $pl_rows        = [];
    $cumulative_margin = 0.0;
    foreach (array_keys($months_set) as $ym) {
      $cash   = $cash_map[$ym] ?? 0.0;
      $siy    = $siy_map[$ym]  ?? 0.0;
      $mgh    = $mgh_map[$ym]  ?? 0.0;
      $costs  = $siy + $mgh;
      $margin = $cash - $costs;
      $cumulative_margin += $margin;

      [$y, $m] = explode('-', $ym);
      $pl_rows[] = [
        'ym'               => $ym,
        'label'            => date('M Y', mktime(0,0,0,(int)$m,1,(int)$y)),
        'cash_received'    => $cash,
        'siyasiza_cost'    => $siy,
        'megahertz_cost'   => $mgh,
        'total_costs'      => $costs,
        'gross_margin'     => $margin,
        'cumulative_margin'=> $cumulative_margin,
      ];
    }

    $totals_pl = [
      'cash_received'  => array_sum(array_column($pl_rows, 'cash_received')),
      'siyasiza_cost'  => array_sum(array_column($pl_rows, 'siyasiza_cost')),
      'megahertz_cost' => array_sum(array_column($pl_rows, 'megahertz_cost')),
      'total_costs'    => array_sum(array_column($pl_rows, 'total_costs')),
      'gross_margin'   => $cumulative_margin,
    ];

    $flags = ledger_supplier_flags();
    json_ok([
      'rows'   => $pl_rows,
      'totals' => $totals_pl,
      'suppliers_active' => [
        'siyasiza'  => $flags['Siyasiza Group'],
        'megahertz' => $flags['Megahertz Systems'],
      ],
    ]);
    break;

  // ── SUMMARY (finance dashboard KPIs) ─────────────────────────
  case 'summary':
    $remittance_period = ledger_period_clause('remittance_date', $period_from, $period_to);
    $rem = db_row(
      "SELECT SUM(amount) AS total, SUM(IF(bank_confirmed=0,amount,0)) AS unreconciled
         FROM bf_remittances
        WHERE 1=1 {$remittance_period['sql']}",
      $remittance_period['params']
    );
    $confirmed_period = ledger_period_clause('bank_date', $period_from, $period_to);
    $confirmed = db_row(
      "SELECT SUM(amount) AS total
         FROM bf_remittances
        WHERE bank_confirmed=1 AND bank_date IS NOT NULL {$confirmed_period['sql']}",
      $confirmed_period['params']
    );
    $invoice_period = ledger_period_clause('invoice_date', $period_from, $period_to);
    $inv = db_row(
      "SELECT SUM(amount) AS invoiced,
              SUM(IF(status='Paid',amount,0)) AS paid,
              SUM(IF(status IN ('Sent','Overdue'),amount,0)) AS outstanding,
              COUNT(IF(status='Overdue',1,NULL)) AS overdue_count
         FROM bf_invoices WHERE client_name='AECI Chempark' {$invoice_period['sql']}",
      $invoice_period['params']
    );
    $cost_period = ledger_period_clause('invoice_date', $period_from, $period_to);
    $costs = db_row(
      "SELECT SUM(total_amount) AS total
         FROM bf_supplier_invoices
        WHERE supplier IN ('Siyasiza Group','Megahertz Systems','Nqobanathi Holdings','NkosinathiMajola (Pty) Ltd') {$cost_period['sql']}",
      $cost_period['params']
    );
    $margin = (float)($confirmed['total'] ?? 0) - (float)($costs['total'] ?? 0);

    json_ok([
      'bank_confirmed'   => (float)($confirmed['total']   ?? 0),
      'unreconciled'     => (float)($rem['unreconciled']  ?? 0),
      'total_remitted'   => (float)($rem['total']         ?? 0),
      'total_invoiced'   => (float)($inv['invoiced']      ?? 0),
      'total_paid'       => (float)($inv['paid']          ?? 0),
      'outstanding'      => (float)($inv['outstanding']   ?? 0),
      'overdue_count'    => (int)($inv['overdue_count']   ?? 0),
      'supplier_costs'   => (float)($costs['total']       ?? 0),
      'gross_margin'     => $margin,
    ]);
    break;

  default:
    json_err('Unknown action', 400);
}
