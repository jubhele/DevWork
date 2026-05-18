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
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

require_perm('finance.transactions');
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $pg     = get_pagination();
    $q      = clean($_GET['q'] ?? '', 100);
    $params = [];
    $where  = '';
    if ($q) {
        $like  = "%$q%";
        $where = 'WHERE (description LIKE ? OR category LIKE ? OR reference LIKE ?)';
        $params = [$like, $like, $like];
    }
    $total   = db_row("SELECT COUNT(*) AS n FROM bf_transactions $where", $params)['n'] ?? 0;
    $rows    = db_select("SELECT * FROM bf_transactions $where ORDER BY trans_date DESC LIMIT {$pg['limit']} OFFSET {$pg['offset']}", $params);
    $totals  = db_row("SELECT SUM(credit) AS total_credit, SUM(debit) AS total_debit FROM bf_transactions");
    json_ok(['data' => $rows, 'total' => (int)$total, 'totals' => $totals]);
}

if ($method === 'POST') {
    $usr = current_user();
    $b   = get_body();
    require_fields($b, ['trans_date', 'description', 'category']);
    $id = db_insert(
        "INSERT INTO bf_transactions (trans_date, description, category, reference, credit, debit) VALUES (?,?,?,?,?,?)",
        [
            $b['trans_date'],
            clean($b['description']),
            clean($b['category']),
            clean($b['reference'] ?? ''),
            max(0, (float)($b['credit'] ?? 0)),
            max(0, (float)($b['debit']  ?? 0)),
        ]
    );
    audit($usr['username'], 'CREATE', "Transaction #{$id} added");
    $row = db_row("SELECT * FROM bf_transactions WHERE id = ?", [$id]);
    json_ok(['data' => $row], 'Transaction added');
}

json_err('Method not allowed', 405);
