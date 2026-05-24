<?php
ob_start();
/**
 * Umlilo Portal — Invoices API
 * GET    /api/invoices.php              → list
 * POST   /api/invoices.php              → create
 * PUT    /api/invoices.php?id=INV-001   → update / mark paid
 * DELETE /api/invoices.php?id=INV-001   → delete
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
    require_perm('invoice.view');
    $pg     = get_pagination();
    $q      = clean($_GET['q'] ?? '', 100);
    $params = [];
    $where  = '';

    if ($q) {
        $like  = '%' . like_escape($q) . '%';
        $where = 'WHERE (ref_id LIKE ? ESCAPE \'\\\\\' OR client_name LIKE ? ESCAPE \'\\\\\' OR status LIKE ? ESCAPE \'\\\\\' OR po LIKE ? ESCAPE \'\\\\\')';
        $params = [$like, $like, $like, $like];
    }

    $total = db_row("SELECT COUNT(*) AS n FROM bf_invoices $where", $params)['n'] ?? 0;
    $rows  = db_select("SELECT * FROM bf_invoices $where ORDER BY invoice_date DESC LIMIT {$pg['limit']} OFFSET {$pg['offset']}", $params);
    json_ok(['data' => $rows, 'total' => (int)$total]);
}

// ── POST — Create ──────────────────────────────────────
if ($method === 'POST') {
    $usr = require_perm('invoice.create');
    $b   = get_body();
    require_fields($b, ['amount', 'due_date']);

    $amount = (float)($b['amount'] ?? 0);
    if ($amount < 0) json_err('Amount cannot be negative');

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

    // Resolve linked quote FK
    $quote_ref_str = clean($b['quote_ref']   ?? '', 30);
    $co_ref_str    = clean($b['callout_ref'] ?? '', 30);
    $quote_id_fk   = null;
    $callout_id_fk = null;

    if ($quote_ref_str) {
        $qrow = db_row("SELECT id FROM bf_quotes WHERE ref_id = ? LIMIT 1", [$quote_ref_str]);
        $quote_id_fk = $qrow ? (int)$qrow['id'] : null;
    }
    if ($co_ref_str) {
        $crow = db_row("SELECT id FROM bf_callouts WHERE ref_id = ? LIMIT 1", [$co_ref_str]);
        $callout_id_fk = $crow ? (int)$crow['id'] : null;
    }

    $ref = next_ref_id('inv');
    $id  = db_insert(
        "INSERT INTO bf_invoices
         (ref_id, client_id, client_name, client_email, amount, due_date, status,
          quote_ref, quote_id, callout_ref, callout_id, po, invoice_date, sent_by, sent_by_user_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            $ref,
            $client_id,
            $client_name,
            $client_email,
            $amount,
            $b['due_date'],
            clean($b['status'] ?? 'Draft'),
            $quote_ref_str,
            $quote_id_fk,
            $co_ref_str,
            $callout_id_fk,
            clean($b['po'] ?? ''),
            date('Y-m-d'),
            $usr['username'],
            (int)$usr['id'],
        ]
    );

    audit($usr['username'], 'CREATE', "Invoice $ref created (R" . number_format((float)$b['amount'], 2) . ")");
    $row = db_row("SELECT * FROM bf_invoices WHERE id = ?", [$id]);
    json_ok(['data' => $row], "Invoice $ref created");
}

// ── PUT — Update / Mark Paid ───────────────────────────
if ($method === 'PUT') {
    $usr = require_auth();
    if (!$ref_id) json_err('Missing id');
    $b = get_body();

    $action = clean($b['action'] ?? '', 50);

    if ($action === 'send_invoice') {
        require_perm('invoice.send');
        $inv = db_row("SELECT * FROM bf_invoices WHERE ref_id = ?", [$ref_id]);
        if (!$inv) json_err('Invoice not found', 404);

        $to = clean($b['to_email'] ?? $inv['client_email'] ?? '', 150);
        if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) json_err('Valid recipient email required');
        if ((float)$inv['amount'] <= 0) json_err('Invoice amount must be set before sending');

        require_once __DIR__ . '/../includes/mailer.php';
        $sent = send_invoice_email($inv, $to);
        if (!$sent) json_err('Failed to send invoice email — check SMTP settings');

        db_exec(
            "UPDATE bf_invoices SET status = 'Sent', sent_at = NOW(), sent_by = ?, client_email = ? WHERE ref_id = ?",
            [$usr['username'], $to, $ref_id]
        );
        audit($usr['username'], 'INVOICE_SENT', "Invoice {$ref_id} sent to {$to}");
        $inv = db_row("SELECT * FROM bf_invoices WHERE ref_id = ?", [$ref_id]);
        json_ok(['data' => $inv], "Invoice {$ref_id} sent to {$to}");
    }

    if ($action === 'mark_paid') {
        require_perm('invoice.mark_paid');
        $inv = db_row("SELECT * FROM bf_invoices WHERE ref_id = ?", [$ref_id]);
        if (!$inv) json_err('Invoice not found', 404);
        if ($inv['status'] === 'Paid') json_err('Invoice is already marked as paid');

        $pay_date = valid_date($b['pay_date'] ?? null) ? $b['pay_date'] : date('Y-m-d');
        $notes    = clean($b['notes'] ?? '');
        $amount   = (float)($b['amount'] ?? $inv['amount']);

        $db = get_db();
        $db->beginTransaction();
        try {
            db_exec(
                "UPDATE bf_invoices SET status = 'Paid', paid_date = ? WHERE ref_id = ?",
                [$pay_date, $ref_id]
            );
            db_exec(
                "INSERT INTO bf_transactions (trans_date, description, category, reference, credit, debit) VALUES (?,?,?,?,?,?)",
                [$pay_date, "Payment received — {$inv['client_name']}", 'Invoice Payment', $ref_id, $inv['amount'], 0]
            );
            db_exec(
                "INSERT INTO bf_payments (invoice_ref, client_name, amount, payment_date, notes, logged_by) VALUES (?,?,?,?,?,?)",
                [$ref_id, $inv['client_name'], $amount, $pay_date, $notes, $usr['username']]
            );
            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            json_err('Payment recording failed — no changes saved');
        }

        audit($usr['username'], 'PAID', "Invoice $ref_id marked as paid");
        $updated_inv = db_row("SELECT * FROM bf_invoices WHERE ref_id = ?", [$ref_id]);
        json_ok(['data' => $updated_inv], "Invoice $ref_id marked as paid");
    }

    // General update
    require_perm('invoice.update');
    $inv = db_row("SELECT * FROM bf_invoices WHERE ref_id = ?", [$ref_id]);
    if (!$inv) json_err('Invoice not found', 404);
    if ($inv['status'] === 'Paid') json_err('Cannot modify a paid invoice directly.');

    $allowed = ['status', 'due_date', 'po', 'amount'];
    $sets = []; $params = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            if ($f === 'amount') {
                $val = (float)$b[$f];
                if ($val < 0) json_err('Amount cannot be negative');
                $sets[]   = "$f = ?";
                $params[] = $val;
            } else {
                $sets[]   = "$f = ?";
                $params[] = clean($b[$f]);
            }
        }
    }
    if (!$sets) json_err('No fields to update');
    $params[] = $ref_id;
    db_exec("UPDATE bf_invoices SET " . implode(', ', $sets) . " WHERE ref_id = ?", $params);
    audit($usr['username'], 'UPDATE', "Invoice $ref_id updated");
    $row = db_row("SELECT * FROM bf_invoices WHERE ref_id = ?", [$ref_id]);
    json_ok(['data' => $row], "Invoice $ref_id updated");
}

// ── DELETE ─────────────────────────────────────────────
if ($method === 'DELETE') {
    $usr = require_perm('invoice.delete');
    if (!$ref_id) json_err('Missing id');
    $inv = db_row("SELECT status FROM bf_invoices WHERE ref_id = ?", [$ref_id]);
    if (!$inv) json_err('Invoice not found', 404);
    if ($inv['status'] === 'Paid') json_err('Cannot delete a paid invoice — reverse the payment first.');
    db_exec("DELETE FROM bf_invoices WHERE ref_id = ?", [$ref_id]);
    audit($usr['username'], 'DELETE', "Invoice $ref_id deleted");
    json_ok([], "Invoice $ref_id deleted");
}

json_err('Method not allowed', 405);
