<?php
ob_start();
/**
 * Umlilo Portal — Callouts API
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

    // Techs only see their assigned callouts; client_support users see only their client's callouts
    if (in_array($role, ['junior_tech', 'senior_tech'])) {
        $where  = 'WHERE assigned_to = ?';
        $params = [$user['username']];
    } elseif ($role === 'client_support' && !empty($user['client_id'])) {
        $where  = 'WHERE client_id = ?';
        $params = [(int)$user['client_id']];
    } else {
        $where  = '';
        $params = [];
    }

    // Search filter
    if ($q) {
        $like = '%' . like_escape($q) . '%';
        $where .= ($where ? ' AND' : ' WHERE') . ' (ref_id LIKE ? ESCAPE \'\\\\\' OR client_name LIKE ? ESCAPE \'\\\\\' OR service LIKE ? ESCAPE \'\\\\\' OR location LIKE ? ESCAPE \'\\\\\')';
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
    require_fields($b, ['service', 'callout_date']);

    // Resolve client: accept client_id (FK) or fallback to plain client_name
    $client_id    = isset($b['client_id']) && $b['client_id'] ? (int)$b['client_id'] : null;
    $client_name  = clean($b['client_name'] ?? '', 255);
    $client_email = clean($b['client_email'] ?? '', 150);

    if ($client_id) {
        $cl = db_row("SELECT name, email FROM bf_clients WHERE id = ? AND is_active = 1", [$client_id]);
        if (!$cl) json_err('Client not found', 404);
        $client_name  = $cl['name'];
        $client_email = $cl['email'];
    } elseif (!$client_name) {
        json_err('client_id or client_name is required');
    }

    // Auto-determine approval_status based on who logged the callout
    $approval_status = 'not_required';
    if ($usr['role'] !== 'client' && $client_email && filter_var($client_email, FILTER_VALIDATE_EMAIL)) {
        $approval_status = 'pending';
    }

    // Resolve assigned_to user FK
    $assigned_to_str     = clean($b['assigned_to'] ?? '');
    $assigned_to_user_id = null;
    if ($assigned_to_str) {
        $au = db_row("SELECT id FROM bf_users WHERE username = ? LIMIT 1", [$assigned_to_str]);
        $assigned_to_user_id = $au ? (int)$au['id'] : null;
    }

    $ref = next_ref_id('co');
    $id  = db_insert(
        "INSERT INTO bf_callouts
         (ref_id, client_id, client_name, client_email, service, location, tech, assigned_to, assigned_to_user_id,
          priority, status, approval_status, callout_date, callout_time, notes, logged_by, logged_by_user_id, po)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            $ref,
            $client_id,
            $client_name,
            $client_email,
            clean($b['service']),
            clean($b['location'] ?? ''),
            clean($b['tech']     ?? ''),
            $assigned_to_str,
            $assigned_to_user_id,
            clean($b['priority'] ?? 'Normal'),
            clean($b['status']   ?? 'Open'),
            $approval_status,
            $b['callout_date'],
            clean($b['callout_time'] ?? '08:00'),
            clean($b['notes'] ?? '', 2000),
            $usr['username'],
            (int)$usr['id'],
            clean($b['po'] ?? ''),
        ]
    );

    audit($usr['username'], 'CREATE', "Callout $ref created (approval: $approval_status)");
    $row = db_row("SELECT * FROM bf_callouts WHERE id = ?", [$id]);
    json_ok(['data' => $row], "Callout $ref created");
}

// ── PUT — Update ───────────────────────────────────────
if ($method === 'PUT') {
    $usr = require_auth();
    if (!$ref_id) json_err('Missing id');

    $b      = get_body();
    $action = clean($b['action'] ?? '', 50);

    // ── Action: confirm_closure ──────────────────────────────────────
    if ($action === 'confirm_closure') {
        require_perm('callout.confirm_closure');
        $callout = db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
        if (!$callout) json_err('Callout not found', 404);
        if ($callout['status'] !== 'Completed') json_err('Callout must be in Completed status before confirming closure');
        if (!empty($callout['closure_confirmed'])) json_err('Closure already confirmed for this callout');
        if (!empty($callout['invoice_generated'])) json_err('Invoice already generated for this callout');

        $closure_notes = clean($b['closure_notes'] ?? '', 2000);
        if (!$closure_notes) json_err('Closure notes are required');

        // Manager must have uploaded at least one document to this callout
        $has_doc = db_row(
            "SELECT id FROM bf_attachments WHERE entity_type = 'callout' AND entity_ref = ? LIMIT 1",
            [$ref_id]
        );
        if (!$has_doc) json_err('A closure confirmation document must be uploaded to this callout first');

        // Auto-create a Draft invoice
        require_once __DIR__ . '/../includes/helpers.php';
        $inv_ref  = next_ref_id('inv');
        $due_date = date('Y-m-d', strtotime('+30 days'));

        db_exec("START TRANSACTION");
        try {
            db_insert(
                "INSERT INTO bf_invoices
                 (ref_id, client_id, client_name, client_email, amount, due_date, status,
                  callout_ref, callout_id, invoice_date, sent_by, sent_by_user_id)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                [
                    $inv_ref,
                    $callout['client_id'] ?? null,
                    $callout['client_name'],
                    $callout['client_email'] ?? '',
                    0.00,
                    $due_date,
                    'Draft',
                    $ref_id,
                    $callout['id'],
                    date('Y-m-d'),
                    $usr['username'],
                    (int)$usr['id'],
                ]
            );

            db_exec(
                "UPDATE bf_callouts
                 SET closure_confirmed = 1, closure_confirmed_by = ?, closure_confirmed_at = NOW(),
                     closure_notes = ?, invoice_generated = 1
                 WHERE ref_id = ?",
                [$usr['username'], $closure_notes, $ref_id]
            );

            db_exec("COMMIT");
        } catch (Exception $e) {
            db_exec("ROLLBACK");
            json_err('Failed to confirm closure — no changes were saved.');
        }

        audit($usr['username'], 'CLOSURE_CONFIRMED',
              "Callout {$ref_id} closure confirmed by {$usr['username']}; Invoice {$inv_ref} created");

        $row = db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
        json_ok(['data' => $row, 'invoice_ref' => $inv_ref],
                "Closure confirmed. Draft invoice {$inv_ref} created.");
    }

    // ── Standard field update ────────────────────────────────────────
    $allowed = [
        'client_name', 'service', 'location', 'tech', 'assigned_to',
        'priority', 'status', 'callout_date', 'callout_time', 'notes', 'po'
    ];

    require_perm('callout.update');

    // Techs may only update callouts assigned to them
    $usr_roles = !empty($usr['roles']) ? $usr['roles'] : [$usr['role']];
    if (count(array_intersect($usr_roles, ['junior_tech', 'senior_tech'])) > 0
        && count(array_intersect($usr_roles, ['admin', 'manager', 'sysadmin'])) === 0) {
        $ownership = db_row("SELECT assigned_to FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
        if (!$ownership) json_err('Callout not found', 404);
        if ($ownership['assigned_to'] !== $usr['username']) json_err('You can only update callouts assigned to you', 403);
    }

    // Permission gates on specific fields — use can() without role arg to check all user roles
    if (isset($b['status']) && !can('callout.update_status')) json_err('No permission to update status', 403);
    if (isset($b['po'])     && !can('callout.assign_po'))     json_err('No permission to assign PO', 403);

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

    // ── Post-update: auto-invoice when client closes callout ─────────
    if (isset($b['status']) && $b['status'] === 'Completed') {
        $callout = db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
        if ($callout && empty($callout['invoice_generated']) && $usr['role'] === 'client') {
            require_once __DIR__ . '/../includes/mailer.php';
            $inv_ref  = next_ref_id('inv');
            $due_date = date('Y-m-d', strtotime('+30 days'));

            db_exec("START TRANSACTION");
            try {
                db_insert(
                    "INSERT INTO bf_invoices
                     (ref_id, client_id, client_name, client_email, amount, due_date, status,
                      callout_ref, callout_id, invoice_date, sent_by, sent_by_user_id)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                    [
                        $inv_ref,
                        $callout['client_id'] ?? null,
                        $callout['client_name'],
                        $callout['client_email'] ?? '',
                        0.00,
                        $due_date,
                        'Draft',
                        $ref_id,
                        $callout['id'],
                        date('Y-m-d'),
                        $usr['username'],
                        (int)$usr['id'],
                    ]
                );
                db_exec("UPDATE bf_callouts SET invoice_generated = 1 WHERE ref_id = ?", [$ref_id]);
                db_exec("COMMIT");
            } catch (Exception $e) {
                db_exec("ROLLBACK");
                // Log the failure but don't abort the callout status update that already committed
                error_log("Auto-invoice failed for callout {$ref_id}: " . $e->getMessage());
                $inv_ref = null;
            }

            if ($inv_ref && !empty($callout['client_email'])) {
                send_invoice_notification_email($callout['client_email'], $callout, $inv_ref);
            }
            if ($inv_ref) {
                audit($usr['username'], 'INVOICE_AUTO',
                      "Invoice {$inv_ref} auto-generated for client-closed callout {$ref_id}");
            }
        }
    }

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
