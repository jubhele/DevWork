<?php
ob_start();
/**
 * Umlilo Portal — Audit Log API
 * GET  /api/audit.php         — list entries (requires security.audit)
 * POST /api/audit.php         — submit a page suggestion (any authenticated user)
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user    = require_auth();
    $body    = get_body();
    $action  = clean($_GET['action'] ?? '', 30);

    if ($action === 'activity') {
        $page = clean($body['page'] ?? '', 100);
        if (!preg_match('/^p-[a-z0-9-]+$/', $page)) json_err('Invalid page');
        audit($user['username'], 'PAGE_VIEW', $page);
        json_ok(['ok' => true]);
    }

    $comment = clean($body['comment'] ?? '', 500);
    $page    = clean($body['page']    ?? '', 100);
    if (!$comment) json_err('Comment is required');
    audit($user['username'], 'PAGE_SUGGESTION', "[{$page}] {$comment}");
    json_ok(['ok' => true]);
}

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
