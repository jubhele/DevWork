<?php
ob_start();
/**
 * BlackFire Solutions Portal — Callouts API
 * GET    /api/callouts.php              → list
 * POST   /api/callouts.php              → create
 * PUT    /api/callouts.php?id=JOB-001   → update
 * DELETE /api/callouts.php?id=JOB-001   → delete
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

// ── GET — List ─────────────────────────────────────────
if ($method === 'GET') {
    require_perm('callout.view');

    $role = $user['role'];
    $pg   = get_pagination();
    $q    = clean($_GET['q'] ?? '', 100);

    // Techs only see their assigned callouts
    if (in_array($role, ['junior_tech', 'senior_tech'])) {
        $where = 'WHERE assigned_to = ?';
        $params = [$user['username']];
    } else {
        $where  = '';
        $params = [];
    }

    // Search filter
    if ($q) {
        $like = "%$q%";
        $where .= ($where ? ' AND' : ' WHERE') . ' (ref_id LIKE ? OR client_name LIKE ? OR service LIKE ? OR location LIKE ?)';
        array_push($params, $like, $like, $like, $like);
    }

    $total = db_row("SELECT COUNT(*) AS n FROM bf_callouts $where", $params)['n'] ?? 0;

    $rows = db_select(
        "SELECT * FROM bf_callouts $where ORDER BY callout_date DESC, created_at DESC LIMIT {$pg['limit']} OFFSET {$pg['offset']}",
        $params
    );

    json_ok(['data' => $rows, 'total' => (int)$total]);
}

// ── POST — Create ──────────────────────────────────────
if ($method === 'POST') {
    $usr = require_perm('callout.create');
    $b   = get_body();
    require_fields($b, ['client_name', 'service', 'callout_date']);

    $ref = next_ref_id('co');
    $id  = db_insert(
        "INSERT INTO bf_callouts
         (ref_id, client_name, service, location, tech, assigned_to, priority, status,
          callout_date, callout_time, notes, logged_by, po)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            $ref,
            clean($b['client_name']),
            clean($b['service']),
            clean($b['location'] ?? ''),
            clean($b['tech']     ?? ''),
            clean($b['assigned_to'] ?? ''),
            clean($b['priority'] ?? 'Normal'),
            clean($b['status']   ?? 'Open'),
            $b['callout_date'],
            clean($b['callout_time'] ?? '08:00'),
            clean($b['notes'] ?? '', 2000),
            $usr['username'],
            clean($b['po'] ?? ''),
        ]
    );

    audit($usr['username'], 'CREATE', "Callout $ref created");
    $row = db_row("SELECT * FROM bf_callouts WHERE id = ?", [$id]);
    json_ok(['data' => $row], "Callout $ref created");
}

// ── PUT — Update ───────────────────────────────────────
if ($method === 'PUT') {
    $usr = require_auth();
    if (!$ref_id) json_err('Missing id');

    $b = get_body();

    // Build dynamic update — only set fields that are present
    $allowed = [
        'client_name', 'service', 'location', 'tech', 'assigned_to',
        'priority', 'status', 'callout_date', 'callout_time', 'notes', 'po'
    ];

    // Permission gates on specific fields
    if (isset($b['status']) && !can('callout.update_status', $usr['role'])) json_err('No permission to update status', 403);
    if (isset($b['po'])     && !can('callout.assign_po', $usr['role']))     json_err('No permission to assign PO', 403);

    $sets   = [];
    $params = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $b)) {
            $sets[]   = "$field = ?";
            $params[] = clean($b[$field], $field === 'notes' ? 2000 : 255);
        }
    }

    if (!$sets) json_err('No fields to update');
    $params[] = $ref_id;

    db_exec("UPDATE bf_callouts SET " . implode(', ', $sets) . " WHERE ref_id = ?", $params);
    audit($usr['username'], 'UPDATE', "Callout $ref_id updated");

    $row = db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
    if (!$row) json_err('Callout not found', 404);
    json_ok(['data' => $row], "Callout $ref_id updated");
}

// ── DELETE ─────────────────────────────────────────────
if ($method === 'DELETE') {
    $usr = require_perm('callout.delete');
    if (!$ref_id) json_err('Missing id');
    $affected = db_exec("DELETE FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
    if (!$affected) json_err('Callout not found', 404);
    audit($usr['username'], 'DELETE', "Callout $ref_id deleted");
    json_ok([], "Callout $ref_id deleted");
}

json_err('Method not allowed', 405);
