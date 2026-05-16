<?php
ob_start();
/**
 * BlackFire Solutions Portal — Audit Log API
 * GET /api/audit.php
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();
require_perm('security.audit');

$pg     = get_pagination();
$q      = clean($_GET['q'] ?? '', 100);
$params = [];
$where  = '';
if ($q) {
    $like  = "%$q%";
    $where = 'WHERE (username LIKE ? OR action LIKE ? OR detail LIKE ?)';
    $params = [$like, $like, $like];
}
$total = db_row("SELECT COUNT(*) AS n FROM bf_audit_log $where", $params)['n'] ?? 0;
$rows  = db_select("SELECT * FROM bf_audit_log $where ORDER BY created_at DESC LIMIT {$pg['limit']} OFFSET {$pg['offset']}", $params);
json_ok(['data' => $rows, 'total' => (int)$total]);
