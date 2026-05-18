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

    // Auto-mark overdue
    db_exec(
        "UPDATE bf_invoices SET status = 'Overdue' WHERE status = 'Sent' AND due_date < CURDATE()"
    );

    if ($q) {
        $like  = "%$q%";
        $where = 'WHERE (ref_id LIKE ? OR client_name LIKE ? OR status LIKE ? OR po LIKE ?)';
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
    require_fields($b, ['client_name', 'amount', 'due_date']);

    $ref = next_ref_id('inv');
    $id  = db_insert(
        "INSERT INTO bf_invoices (ref_id, client_name, amount, due_date, status, quote_ref, callout_ref, po, invoice_date)
         VALUES (?,?,?,?,?,?,?,?,?)",
        [
            $ref,
            clean($b['client_name']),
            (float)($b['amount'] ?? 0),
            $b['due_date'],
            clean($b['status'] ?? 'Draft'),
            clean($b['quote_ref']   ?? ''),
            clean($b['callout_ref'] ?? ''),
            clean($b['po'] ?? ''),
            date('Y-m-d'),
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

    if ($action === 'mark_paid') {
        require_perm('invoice.mark_paid');
        $pay_date = valid_date($b['pay_date'] ?? null) ? $b['pay_date'] : date('Y-m-d');
        db_exec(
            "UPDATE bf_invoices SET status = 'Paid', paid_date = ? WHERE ref_id = ?",
            [$pay_date, $ref_id]
        );

        $inv = db_row("SELECT * FROM bf_invoices WHERE ref_id = ?", [$ref_id]);
        if ($inv) {
            // Add transaction record
            db_exec(
                "INSERT INTO bf_transactions (trans_date, description, category, reference, credit, debit) VALUES (?,?,?,?,?,?)",
                [$pay_date, "Payment received — {$inv['client_name']}", 'Invoice Payment', $ref_id, $inv['amount'], 0]
            );
            // Log payment
            $notes = clean($b['notes'] ?? '');
            $amount = (float)($b['amount'] ?? $inv['amount']);
            db_exec(
                "INSERT INTO bf_payments (invoice_ref, client_name, amount, payment_date, notes, logged_by) VALUES (?,?,?,?,?,?)",
                [$ref_id, $inv['client_name'], $amount, $pay_date, $notes, $usr['username']]
            );
        }

        audit($usr['username'], 'PAID', "Invoice $ref_id marked as paid");
        json_ok(['data' => $inv], "Invoice $ref_id marked as paid");
    }

    // General update
    $allowed = ['status', 'due_date', 'po', 'amount'];
    $sets = []; $params = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $sets[]   = "$f = ?";
            $params[] = $f === 'amount' ? (float)$b[$f] : clean($b[$f]);
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
    $affected = db_exec("DELETE FROM bf_invoices WHERE ref_id = ?", [$ref_id]);
    if (!$affected) json_err('Invoice not found', 404);
    audit($usr['username'], 'DELETE', "Invoice $ref_id deleted");
    json_ok([], "Invoice $ref_id deleted");
}

json_err('Method not allowed', 405);
