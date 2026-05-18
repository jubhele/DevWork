<?php
ob_start();
/**
 * Umlilo Portal — Quotes API
 * GET    /api/quotes.php              → list
 * POST   /api/quotes.php              → create (with items[])
 * PUT    /api/quotes.php?id=QTE-001   → update status / approval
 * DELETE /api/quotes.php?id=QTE-001   → delete
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user   = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$ref_id = clean($_GET['id'] ?? '', 20);

// Attach line items to a quote row
function attach_items(array $quotes): array {
    if (!$quotes) return [];
    $ids = array_column($quotes, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $items = db_select("SELECT * FROM bf_quote_items WHERE quote_id IN ($placeholders) ORDER BY id", $ids);
    $map = [];
    foreach ($items as $item) $map[$item['quote_id']][] = $item;
    foreach ($quotes as &$q) $q['items'] = $map[$q['id']] ?? [];
    return $quotes;
}

// ── GET — List ─────────────────────────────────────────
if ($method === 'GET') {
    require_perm('quote.view');
    $pg   = get_pagination();
    $q    = clean($_GET['q'] ?? '', 100);
    $params = [];
    $where  = '';

    if ($q) {
        $like  = "%$q%";
        $where = 'WHERE (ref_id LIKE ? OR client_name LIKE ? OR status LIKE ?)';
        $params = [$like, $like, $like];
    }

    $total = db_row("SELECT COUNT(*) AS n FROM bf_quotes $where", $params)['n'] ?? 0;
    $rows  = db_select("SELECT * FROM bf_quotes $where ORDER BY quote_date DESC LIMIT {$pg['limit']} OFFSET {$pg['offset']}", $params);
    $rows  = attach_items($rows);
    json_ok(['data' => $rows, 'total' => (int)$total]);
}

// ── POST — Create ──────────────────────────────────────
if ($method === 'POST') {
    $usr = require_perm('quote.create');
    $b   = get_body();
    require_fields($b, ['client_name', 'items']);

    $items = is_array($b['items']) ? $b['items'] : [];
    if (!$items) json_err('Quote must have at least one line item');

    // Calculate total
    $total = 0;
    foreach ($items as $item) {
        $total += ((float)($item['qty'] ?? 1)) * ((float)($item['unit'] ?? 0));
    }

    // Determine approval status
    $approval_status = null;
    $status = clean($b['status'] ?? 'Draft');
    if ($usr['role'] === 'senior_tech') {
        $status          = 'Pending Approval';
        $approval_status = 'pending';
    }

    $ref = next_ref_id('q');
    $id  = db_insert(
        "INSERT INTO bf_quotes (ref_id, client_name, status, valid_until, quote_date, submitted_by, source, approval_status, notes, total_amount)
         VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
            $ref,
            clean($b['client_name']),
            $status,
            valid_date($b['valid_until'] ?? null) ? $b['valid_until'] : null,
            date('Y-m-d'),
            $usr['username'],
            clean($b['source'] ?? 'staff'),
            $approval_status,
            clean($b['notes'] ?? '', 2000),
            $total,
        ]
    );

    foreach ($items as $item) {
        db_exec(
            "INSERT INTO bf_quote_items (quote_id, description, qty, unit_price) VALUES (?,?,?,?)",
            [$id, clean($item['desc'] ?? '', 255), (float)($item['qty'] ?? 1), (float)($item['unit'] ?? 0)]
        );
    }

    audit($usr['username'], 'CREATE', "Quote $ref created (R" . number_format($total, 2) . ")");
    $row = db_row("SELECT * FROM bf_quotes WHERE id = ?", [$id]);
    $row['items'] = $items;
    json_ok(['data' => $row], "Quote $ref created");
}

// ── PUT — Update ───────────────────────────────────────
if ($method === 'PUT') {
    $usr = require_auth();
    if (!$ref_id) json_err('Missing id');
    $b = get_body();

    $action = clean($b['action'] ?? '', 50);

    // Approve/reject
    if ($action === 'approve' || $action === 'reject') {
        require_perm('quote.approve');
        $new_status  = $action === 'approve' ? 'Approved' : 'Rejected';
        $appr_status = $action === 'approve' ? 'approved' : 'rejected';
        db_exec(
            "UPDATE bf_quotes SET status = ?, approval_status = ? WHERE ref_id = ?",
            [$new_status, $appr_status, $ref_id]
        );
        audit($usr['username'], 'APPROVE', "Quote $ref_id {$new_status}");
        json_ok([], "Quote $ref_id $new_status");
    }

    // General status update
    $allowed = ['status', 'valid_until', 'notes'];
    $sets   = [];
    $params = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $sets[]   = "$f = ?";
            $params[] = clean($b[$f], $f === 'notes' ? 2000 : 255);
        }
    }
    if (!$sets) json_err('No fields to update');
    $params[] = $ref_id;
    db_exec("UPDATE bf_quotes SET " . implode(', ', $sets) . " WHERE ref_id = ?", $params);
    audit($usr['username'], 'UPDATE', "Quote $ref_id updated");
    $row = db_row("SELECT * FROM bf_quotes WHERE ref_id = ?", [$ref_id]);
    if (!$row) json_err('Quote not found', 404);
    $rows = attach_items([$row]);
    json_ok(['data' => $rows[0]], "Quote $ref_id updated");
}

// ── DELETE ─────────────────────────────────────────────
if ($method === 'DELETE') {
    $usr = require_perm('quote.delete');
    if (!$ref_id) json_err('Missing id');
    $affected = db_exec("DELETE FROM bf_quotes WHERE ref_id = ?", [$ref_id]);
    if (!$affected) json_err('Quote not found', 404);
    audit($usr['username'], 'DELETE', "Quote $ref_id deleted");
    json_ok([], "Quote $ref_id deleted");
}

json_err('Method not allowed', 405);
