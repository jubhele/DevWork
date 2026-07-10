<?php
ob_start();
/**
 * Umlilo Portal — Transactions API
 * GET  /api/transactions.php  → list
 * POST /api/transactions.php  → create
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';

// FIX: Ensure $cfg is safely accessed as an array
$timezone = (is_array($cfg) && isset($cfg['timezone'])) ? $cfg['timezone'] : 'Africa/Johannesburg';
date_default_timezone_set($timezone);

api_headers();
require_perm('finance.transactions');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $pg     = get_pagination();
    $q      = clean($_GET['q'] ?? '', 100);
    $params = [];
    $where  = '';

    if ($q) {
        $like   = "%$q%";
        $where  = 'WHERE (description LIKE ? OR category LIKE ? OR reference LIKE ? OR callout_ref LIKE ? OR trans_date LIKE ?)';
        $params = [$like, $like, $like, $like, $like];
    }

    $total = db_row("SELECT COUNT(*) AS n FROM bf_transactions $where", $params)['n'] ?? 0;
    $rows  = db_select("SELECT * FROM bf_transactions $where ORDER BY trans_date DESC LIMIT {$pg['limit']} OFFSET {$pg['offset']}", $params);

    // FIX: Apply the $where clause and $params to the totals calculation to match the filtered view
    $totals = db_row("SELECT SUM(credit) AS total_credit, SUM(debit) AS total_debit FROM bf_transactions $where", $params);
    
    // Ensure null sums (from empty result sets) default to 0
    $totals['total_credit'] = $totals['total_credit'] ?? 0;
    $totals['total_debit']  = $totals['total_debit'] ?? 0;

    json_ok(['data' => $rows, 'total' => (int)$total, 'totals' => $totals]);
    exit; // FIX: Ensure script termination after successful GET
}

if ($method === 'POST') {
    $usr = require_auth();
    $b   = get_body();

    require_fields($b, ['trans_date', 'description', 'category', 'callout_ref']);

    $dateObj = DateTime::createFromFormat('Y-m-d', $b['trans_date']);
    if (!$dateObj || $dateObj->format('Y-m-d') !== $b['trans_date']) {
        json_err('Invalid trans_date format. Expected YYYY-MM-DD.', 400);
    }
    $now     = new DateTime();
    $fiveAgo = (new DateTime())->modify('-5 years');
    if ($dateObj > $now || $dateObj < $fiveAgo) {
        json_err('trans_date must be within the last 5 years and not in the future.', 400);
    }

    $credit = max(0, (float)($b['credit'] ?? 0));
    $debit  = max(0, (float)($b['debit']  ?? 0));
    $calloutRef = clean($b['callout_ref'] ?? '', 30);

    $callout = db_row("SELECT id FROM bf_callouts WHERE ref_id = ? LIMIT 1", [$calloutRef]);
    if (!$callout) {
        json_err('Invalid callout_ref: transaction must link to an existing call log.', 400);
    }

    // FIX: Enforce mutual exclusivity of credit and debit for data integrity
    if ($credit > 0 && $debit > 0) {
        json_err('A single transaction line cannot contain both a credit and a debit amount.', 400);
        exit;
    }

    $id = db_insert(
        "INSERT INTO bf_transactions (trans_date, description, category, reference, callout_ref, credit, debit) VALUES (?,?,?,?,?,?,?)",
        [
            $b['trans_date'],
            clean($b['description']),
            clean($b['category']),
            clean($b['reference'] ?? ''),
            $calloutRef,
            $credit,
            $debit
        ]
    );

    audit($usr['username'], 'CREATE', "Transaction #{$id} added");
    $row = db_row("SELECT * FROM bf_transactions WHERE id = ?", [$id]);

    json_ok(['data' => $row], 'Transaction added');
    exit; // FIX: Ensure script termination after successful POST
}

json_err('Method not allowed', 405);
