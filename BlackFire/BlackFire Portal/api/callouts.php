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
require_once __DIR__ . '/../includes/tracker_records.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user   = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$ref_id = clean($_GET['id'] ?? '', 20);

// ── GET — Chain lookup ─────────────────────────────────
if ($method === 'GET' && ($_GET['action'] ?? '') === 'chain') {
    require_perm('callout.view');
    $ref = clean($_GET['ref'] ?? '', 30);
    if (!$ref) json_err('ref required');

    $co = db_row(
        "SELECT c.*, COALESCE(u.name,'') AS logged_by_name
           FROM bf_callouts c
           LEFT JOIN bf_users u ON u.id = c.logged_by_user_id
          WHERE c.ref_id = ?", [$ref]);
    if (!$co) json_err('Callout not found', 404);
    if (!tracker_can_view($user, 'callout', $co)) json_err('Forbidden', 403);

    $quotes = db_select(
        "SELECT q.*, COALESCE(u.name,'') AS submitted_by_name
           FROM bf_quotes q
           LEFT JOIN bf_users u ON u.id = q.submitted_by_user_id
          WHERE q.callout_ref = ? OR q.callout_id = ?
          ORDER BY q.quote_date, q.id",
        [$ref, (int)$co['id']]);

    $items = [];
    if ($quotes) {
        $quote_ids = array_map(fn($quote) => (int)$quote['id'], $quotes);
        $placeholders = implode(',', array_fill(0, count($quote_ids), '?'));
        $items = db_select("SELECT * FROM bf_quote_items WHERE quote_id IN ({$placeholders}) ORDER BY quote_id, id", $quote_ids);
    }

    $invoices = db_select(
        "SELECT * FROM bf_invoices WHERE callout_ref = ? OR callout_id = ? ORDER BY invoice_date, id",
        [$ref, (int)$co['id']]);

    $payments = [];
    if ($invoices) {
        $invoice_refs = array_column($invoices, 'ref_id');
        $placeholders = implode(',', array_fill(0, count($invoice_refs), '?'));
        $payments = db_select("SELECT * FROM bf_payments WHERE invoice_ref IN ({$placeholders}) ORDER BY payment_date", $invoice_refs);
    }

    json_ok([
        'callout'     => $co,
        'quotes'      => $quotes,
        'quote'       => $quotes[0] ?? null,
        'quote_items' => $items,
        'invoices'    => $invoices,
        'invoice'     => $invoices[0] ?? null,
        'payments'    => $payments,
    ]);
}

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
        $where .= ($where ? ' AND' : ' WHERE') . ' (ref_id LIKE ? ESCAPE \'\\\\\' OR job_no LIKE ? ESCAPE \'\\\\\' OR client_name LIKE ? ESCAPE \'\\\\\' OR service LIKE ? ESCAPE \'\\\\\' OR location LIKE ? ESCAPE \'\\\\\')';
        array_push($params, $like, $like, $like, $like, $like);
    }

    $total = db_row("SELECT COUNT(*) AS n FROM bf_callouts $where", $params)['n'] ?? 0;

    $rows = db_select(
        "SELECT c.*, COALESCE(u.username,'') AS logged_by,
                (SELECT COUNT(*) FROM bf_quotes q WHERE q.callout_id = c.id OR q.callout_ref = c.ref_id) AS quote_count,
                (SELECT COUNT(*) FROM bf_invoices i WHERE i.callout_id = c.id OR i.callout_ref = c.ref_id) AS invoice_count,
                EXISTS(SELECT 1 FROM bf_tracker_updates tu
                        WHERE tu.entity_type = 'callout' AND tu.entity_ref = c.ref_id
                          AND LEFT(tu.source_kind, 14) = 'system_reopen_') AS has_reopen_history
           FROM bf_callouts c
           LEFT JOIN bf_users u ON u.id = c.logged_by_user_id
          $where ORDER BY c.callout_date DESC, c.created_at DESC LIMIT {$pg['limit']} OFFSET {$pg['offset']}",
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

    $ref    = next_ref_id('co');
    $job_no = clean($b['job_no'] ?? '', 50);
    if (!$job_no) $job_no = $ref;

    $callout_time = clean($b['callout_time'] ?? '08:00');
    $start_at = tracker_datetime($b['start_at'] ?? ($b['callout_date'] . ' ' . $callout_time));
    $end_at = tracker_datetime($b['end_at'] ?? null);
    $due_at = tracker_datetime($b['due_at'] ?? null);
    foreach (['start_at', 'end_at', 'due_at'] as $field) {
        if (!empty($b[$field]) && ${$field} === null) json_err("Invalid {$field} date and time");
    }

    $notes = clean($b['notes'] ?? '', 2000);

    db_begin();
    try {
        $id = db_insert(
            "INSERT INTO bf_callouts
             (ref_id, job_no, client_id, client_name, client_email, service, location, tech, assigned_to, assigned_to_user_id,
              priority, status, approval_status, callout_date, callout_time, notes, logged_by_user_id, po,
              start_at, end_at, due_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                $ref,
                $job_no,
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
                $callout_time,
                $notes,
                (int)$usr['id'],
                clean($b['po'] ?? ''),
                $start_at,
                $end_at,
                $due_at,
            ]
        );
        if ($notes) {
            db_insert(
                "INSERT INTO bf_tracker_updates
                 (entity_type, entity_ref, label, content, source_kind, created_by_user_id, created_by)
                 VALUES ('callout', ?, 'Initial notes', ?, 'initial', ?, ?)",
                [$ref, $notes, (int)$usr['id'], $usr['name']]
            );
        }
        db_commit();
    } catch (Throwable $error) {
        db_rollback();
        json_err('Callout could not be created');
    }

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

    if ($action === 'request_document_escalation') {
        require_perm('callout.update');
        $reason = clean($b['reason'] ?? '', 500);
        if (!$reason) json_err('A reason is required to request additional quotes or invoices');

        db_begin();
        try {
            $callout = db_row("SELECT id, document_escalation_status FROM bf_callouts WHERE ref_id = ? FOR UPDATE", [$ref_id]);
            if (!$callout) throw new RuntimeException('not_found');
            if ($callout['document_escalation_status'] === 'approved') throw new RuntimeException('already_approved');
            db_exec(
                "UPDATE bf_callouts
                    SET document_escalation_status = 'pending', document_escalation_reason = ?,
                        document_escalation_requested_by_user_id = ?, document_escalation_requested_at = NOW(),
                        document_escalation_approved_by_user_id = NULL, document_escalation_approved_at = NULL
                  WHERE id = ?",
                [$reason, (int)$usr['id'], (int)$callout['id']]
            );
            db_commit();
        } catch (RuntimeException $error) {
            db_rollback();
            if ($error->getMessage() === 'not_found') json_err('Callout not found', 404);
            if ($error->getMessage() === 'already_approved') json_err('Additional quote/invoice functionality is already approved', 409);
            json_err('Escalation request could not be saved');
        } catch (Throwable $error) {
            db_rollback();
            json_err('Escalation request could not be saved');
        }
        audit($usr['username'], 'DOCUMENT_ESCALATION_REQUESTED', "Additional quote/invoice access requested for {$ref_id}: {$reason}");
        json_ok(['data' => db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id])], 'Administrator approval requested');
    }

    if ($action === 'approve_document_escalation' || $action === 'reject_document_escalation') {
        $roles = !empty($usr['roles']) ? $usr['roles'] : [$usr['role']];
        if (!array_intersect($roles, ['sysadmin', 'admin'])) json_err('Only an administrator may decide call escalation', 403);
        $approved = $action === 'approve_document_escalation';

        db_begin();
        try {
            $callout = db_row("SELECT id, document_escalation_status FROM bf_callouts WHERE ref_id = ? FOR UPDATE", [$ref_id]);
            if (!$callout) throw new RuntimeException('not_found');
            if ($callout['document_escalation_status'] !== 'pending') throw new RuntimeException('not_pending');
            db_exec(
                "UPDATE bf_callouts
                    SET document_escalation_status = ?, document_escalation_approved_by_user_id = ?,
                        document_escalation_approved_at = NOW()
                  WHERE id = ?",
                [$approved ? 'approved' : 'rejected', (int)$usr['id'], (int)$callout['id']]
            );
            db_commit();
        } catch (RuntimeException $error) {
            db_rollback();
            if ($error->getMessage() === 'not_found') json_err('Callout not found', 404);
            if ($error->getMessage() === 'not_pending') json_err('This call has no pending escalation request', 409);
            json_err('Escalation decision could not be saved');
        } catch (Throwable $error) {
            db_rollback();
            json_err('Escalation decision could not be saved');
        }
        audit($usr['username'], $approved ? 'DOCUMENT_ESCALATION_APPROVED' : 'DOCUMENT_ESCALATION_REJECTED', "Additional quote/invoice access " . ($approved ? 'approved' : 'rejected') . " for {$ref_id}");
        json_ok(['data' => db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id])], $approved ? 'Additional quote/invoice access approved' : 'Call escalation rejected');
    }

    if ($action === 'edit_service') {
        $roles = !empty($usr['roles']) ? $usr['roles'] : [$usr['role']];
        if (!in_array('sysadmin', $roles, true)) json_err('Only a system administrator may edit a callout service', 403);

        $raw_service = $b['service'] ?? null;
        if (!is_string($raw_service) && !is_numeric($raw_service)) json_err('Service is required');
        $service = trim((string)$raw_service);
        if ($service === '') json_err('Service is required');
        $service_length = function_exists('mb_strlen') ? mb_strlen($service, 'UTF-8') : strlen($service);
        if ($service_length > 255) json_err('Service must be 255 characters or fewer');

        if (!array_key_exists('expected_service', $b)) {
            json_err('This page is out of date and cannot safely save Service. Refresh the page and try again.', 409);
        }
        $raw_expected_service = $b['expected_service'];
        if (!is_scalar($raw_expected_service)) json_err('Expected service is required');
        $expected_service = (string)$raw_expected_service;
        $expected_length = function_exists('mb_strlen') ? mb_strlen($expected_service, 'UTF-8') : strlen($expected_service);
        if ($expected_length > 255) json_err('Expected service must be 255 characters or fewer');

        db_begin();
        try {
            $callout = db_row("SELECT id, service FROM bf_callouts WHERE ref_id = ? FOR UPDATE", [$ref_id]);
            if (!$callout) throw new RuntimeException('not_found');
            $previous_service = (string)$callout['service'];
            if ($previous_service !== $expected_service) throw new RuntimeException('conflict');
            if ($previous_service === $service) throw new RuntimeException('unchanged');

            $edited_at = date('Y-m-d H:i:s');
            $source_kind = 'system_service_edit_' . bin2hex(random_bytes(8));
            $content = "Service edited by {$usr['name']} ({$usr['username']}) at {$edited_at}. Previous service: {$previous_service}. New service: {$service}. The original callout and lifecycle history were retained.";
            db_exec("UPDATE bf_callouts SET service = ? WHERE id = ?", [$service, (int)$callout['id']]);
            db_insert(
                "INSERT INTO bf_tracker_updates
                 (entity_type, entity_ref, label, content, source_kind, created_by_user_id, created_by)
                 VALUES ('callout', ?, 'System service edit event', ?, ?, ?, ?)",
                [$ref_id, $content, $source_kind, (int)$usr['id'], $usr['name']]
            );
            db_commit();
        } catch (RuntimeException $error) {
            db_rollback();
            if ($error->getMessage() === 'not_found') json_err('Callout not found', 404);
            if ($error->getMessage() === 'conflict') json_err('Service changed after this form was opened. Refresh the call log and try again.', 409);
            if ($error->getMessage() === 'unchanged') json_err('Service is unchanged', 409);
            json_err('Service could not be updated');
        } catch (Throwable $error) {
            db_rollback();
            json_err('Service could not be updated');
        }

        audit($usr['username'], 'CALLOUT_SERVICE_EDITED', "Callout {$ref_id} service changed from '{$previous_service}' to '{$service}'; original record retained");
        json_ok(['data' => db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id])], "Callout {$ref_id} service updated");
    }

    if ($action === 'reopen') {
        $roles = !empty($usr['roles']) ? $usr['roles'] : [$usr['role']];
        if (!in_array('sysadmin', $roles, true)) json_err('Only a system administrator may re-open a callout', 403);

        db_begin();
        try {
            $callout = db_row(
                "SELECT c.id, c.ref_id, c.status, c.end_at,
                        (SELECT COUNT(*) FROM bf_quotes q WHERE q.callout_id = c.id OR q.callout_ref = c.ref_id) AS quote_count,
                        (SELECT COUNT(*) FROM bf_invoices i WHERE i.callout_id = c.id OR i.callout_ref = c.ref_id) AS invoice_count,
                        EXISTS(SELECT 1 FROM bf_tracker_updates tu
                                WHERE tu.entity_type = 'callout' AND tu.entity_ref = c.ref_id
                                  AND LEFT(tu.source_kind, 14) = 'system_reopen_') AS has_reopen_history
                   FROM bf_callouts c WHERE c.ref_id = ? FOR UPDATE",
                [$ref_id]
            );
            if (!$callout) throw new RuntimeException('not_found');
            $closed_status = in_array($callout['status'], ['Completed', 'Invoiced'], true);
            $has_documents = (int)$callout['quote_count'] > 0 || (int)$callout['invoice_count'] > 0;
            if (!$closed_status && (!$has_documents || !empty($callout['has_reopen_history']))) {
                throw new RuntimeException('not_eligible');
            }

            $reopened_at = date('Y-m-d H:i:s');
            $previous_status = $callout['status'];
            $previous_end = $callout['end_at'] ?: 'not recorded';
            $source_kind = 'system_reopen_' . bin2hex(random_bytes(8));
            $content = "Re-opened by {$usr['name']} ({$usr['username']}) at {$reopened_at}. Previous status: {$previous_status}. Previous end time: {$previous_end}. The original record and lifecycle history were retained.";
            if ($callout['status'] !== 'Open' || $callout['end_at'] !== null) {
                db_exec("UPDATE bf_callouts SET status = 'Open', end_at = NULL WHERE id = ?", [(int)$callout['id']]);
            }
            db_insert(
                "INSERT INTO bf_tracker_updates
                 (entity_type, entity_ref, label, content, source_kind, created_by_user_id, created_by)
                 VALUES ('callout', ?, 'System re-open event', ?, ?, ?, ?)",
                [$ref_id, $content, $source_kind, (int)$usr['id'], $usr['name']]
            );
            db_commit();
        } catch (RuntimeException $error) {
            db_rollback();
            if ($error->getMessage() === 'not_found') json_err('Callout not found', 404);
            if ($error->getMessage() === 'not_eligible') json_err('Only a Completed, Invoiced, or document-linked callout without prior re-open history may be re-opened', 409);
            json_err('Callout could not be re-opened');
        } catch (Throwable $error) {
            db_rollback();
            json_err('Callout could not be re-opened');
        }

        audit($usr['username'], 'CALLOUT_REOPENED', "Callout {$ref_id} re-opened from {$previous_status}; previous end {$previous_end}; original record retained");
        $row = db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
        json_ok(['data' => $row], "Callout {$ref_id} re-opened");
    }

    // ── Action: confirm_closure ──────────────────────────────────────
    if ($action === 'confirm_closure') {
        require_perm('callout.confirm_closure');
        $callout = db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
        if (!$callout) json_err('Callout not found', 404);
        if ($callout['status'] !== 'Completed') json_err('Callout must be in Completed status before confirming closure');
        if (!empty($callout['closure_confirmed'])) json_err('Closure already confirmed for this callout');
        $closure_notes = clean($b['closure_notes'] ?? '', 2000);
        if (!$closure_notes) json_err('Closure notes are required');

        // Manager must have uploaded at least one document to this callout
        $has_doc = db_row(
            "SELECT id FROM bf_attachments WHERE entity_type = 'callout' AND entity_ref = ? LIMIT 1",
            [$ref_id]
        );
        if (!$has_doc) json_err('A closure confirmation document must be uploaded to this callout first');

        db_exec("START TRANSACTION");
        try {
            db_exec(
                "UPDATE bf_callouts
                 SET closure_confirmed = 1, closure_confirmed_by = ?, closure_confirmed_at = NOW(),
                     closure_notes = ?, end_at = COALESCE(end_at, NOW())
                 WHERE ref_id = ?",
                [$usr['username'], $closure_notes, $ref_id]
            );

            db_exec("COMMIT");
        } catch (Exception $e) {
            db_exec("ROLLBACK");
            json_err('Failed to confirm closure — no changes were saved.');
        }

        audit($usr['username'], 'CLOSURE_CONFIRMED',
              "Callout {$ref_id} closure confirmed by {$usr['username']}");

        $row = db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
        json_ok(['data' => $row], 'Closure confirmed. Create the invoice from an approved quote.');
    }

    // ── Standard field update ────────────────────────────────────────
    $allowed = [
        'client_name', 'location', 'tech', 'assigned_to',
        'priority', 'status', 'callout_date', 'callout_time', 'notes', 'po', 'job_no',
        'start_at', 'end_at', 'due_at'
    ];

    require_perm('callout.update');
    if (array_key_exists('service', $b)) json_err('Use the system administrator service edit action', 403);

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

    $current = db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
    if (!$current) json_err('Callout not found', 404);
    if (in_array($current['status'], ['Completed', 'Invoiced'], true)
        && isset($b['status']) && $b['status'] !== $current['status']) {
        json_err('Completed and Invoiced callouts are terminal. Use Re-open Callout before changing status.', 403);
    }

    $sets   = [];
    $params = [];
    $changed = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $b)) {
            if (in_array($field, ['start_at', 'end_at', 'due_at'], true)) {
                $value = tracker_datetime($b[$field]);
                if (!empty($b[$field]) && $value === null) json_err("Invalid {$field} date and time");
                $sets[] = "$field = ?";
                $params[] = $value;
                $changed[] = $field;
                continue;
            }
            $sets[]   = "$field = ?";
            $params[] = clean($b[$field], $field === 'notes' ? 2000 : 255);
            $changed[] = $field;
        }
    }

    if (($b['status'] ?? '') === 'In Progress' && empty($current['start_at']) && !array_key_exists('start_at', $b)) {
        $sets[] = 'start_at = NOW()';
        $changed[] = 'start_at';
    }
    if (($b['status'] ?? '') === 'Completed' && empty($current['end_at']) && !array_key_exists('end_at', $b)) {
        $sets[] = 'end_at = NOW()';
        $changed[] = 'end_at';
    }

    if (!$sets) json_err('No fields to update');
    $params[] = $ref_id;

    db_begin();
    try {
        db_exec("UPDATE bf_callouts SET " . implode(', ', $sets) . " WHERE ref_id = ?", $params);
        if (array_key_exists('notes', $b) && clean($b['notes'], 2000) !== (string)($current['notes'] ?? '')) {
            db_insert(
                "INSERT INTO bf_tracker_updates
                 (entity_type, entity_ref, label, content, created_by_user_id, created_by)
                 VALUES ('callout', ?, 'Notes update', ?, ?, ?)",
                [$ref_id, clean($b['notes'], 2000), (int)$usr['id'], $usr['name']]
            );
        }
        db_commit();
    } catch (Throwable $error) {
        db_rollback();
        json_err('Callout could not be updated');
    }
    audit($usr['username'], 'CALLOUT_UPDATE', "Updated {$ref_id}: " . implode(', ', array_values(array_unique($changed))));

    $row = db_row("SELECT * FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
    if (!$row) json_err('Callout not found', 404);
    json_ok(['data' => $row], "Callout $ref_id updated");
}

// ── DELETE ─────────────────────────────────────────────
if ($method === 'DELETE') {
    $usr = require_perm('callout.delete');
    if (!$ref_id) json_err('Missing id');
    db_begin();
    try {
        $callout = db_row(
            "SELECT c.status, c.invoice_generated, c.closure_confirmed,
                    (SELECT COUNT(*) FROM bf_quotes q WHERE q.callout_id = c.id OR q.callout_ref = c.ref_id) AS quote_count,
                    (SELECT COUNT(*) FROM bf_invoices i WHERE i.callout_id = c.id OR i.callout_ref = c.ref_id) AS invoice_count,
                    EXISTS(SELECT 1 FROM bf_tracker_updates tu
                            WHERE tu.entity_type = 'callout' AND tu.entity_ref = c.ref_id
                              AND LEFT(tu.source_kind, 14) = 'system_reopen_') AS has_reopen_history
             FROM bf_callouts c WHERE c.ref_id = ? FOR UPDATE",
            [$ref_id]
        );
        if (!$callout) throw new RuntimeException('not_found');
        if (in_array($callout['status'], ['Completed', 'Invoiced'], true)
            || !empty($callout['invoice_generated'])
            || !empty($callout['closure_confirmed'])
            || !empty($callout['has_reopen_history'])
            || (int)$callout['quote_count'] > 0
            || (int)$callout['invoice_count'] > 0) {
            throw new RuntimeException('permanent_record');
        }
        $affected = db_exec("DELETE FROM bf_callouts WHERE ref_id = ?", [$ref_id]);
        if (!$affected) throw new RuntimeException('not_found');
        db_commit();
    } catch (RuntimeException $error) {
        db_rollback();
        if ($error->getMessage() === 'not_found') json_err('Callout not found', 404);
        if ($error->getMessage() === 'permanent_record') {
            json_err('Callouts with lifecycle history, quotes, or invoices are permanent records and cannot be deleted', 409);
        }
        json_err('Callout could not be deleted');
    } catch (Throwable $error) {
        db_rollback();
        json_err('Callout could not be deleted');
    }
    audit($usr['username'], 'DELETE', "Callout $ref_id deleted");
    json_ok([], "Callout $ref_id deleted");
}

json_err('Method not allowed', 405);
