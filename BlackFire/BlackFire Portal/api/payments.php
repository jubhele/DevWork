<?php
ob_start();
/**
 * Umlilo Portal — Payments API
 *
 * POST /api/payments.php  → log a batch payment (one or more invoices)
 *                           body: { invoice_refs: [...], payment_date, amount, notes }
 *                           returns: { payment_ref }
 *
 * GET  /api/payments.php  → list recent payments with remittance file info
 *
 * Remittance/proof-of-payment files are uploaded separately via files.php
 * using entity_type='payment' and entity_ref=<payment_ref>.
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user   = require_auth();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET — list payments ──────────────────────────────────────────────
if ($method === 'GET') {
    require_perm('invoice.mark_paid');
    $rows = db_select(
        "SELECT p.id, p.payment_ref, p.invoice_ref, p.client_name, p.amount,
                p.payment_date, p.notes,
                p.reversed_at, p.reversal_reason,
                COALESCE(u.username, '') AS logged_by,
                p.created_at,
                a.id AS file_id, a.original_name, a.file_size, a.mime_type
           FROM bf_payments p
           LEFT JOIN bf_users u ON u.id = p.logged_by_user_id
           LEFT JOIN bf_attachments a
             ON a.entity_type = 'payment' AND a.entity_ref = p.payment_ref
          ORDER BY p.payment_date DESC, p.id DESC
          LIMIT 200"
    );
    json_ok(['data' => $rows]);
}

// ── POST — log batch payment ─────────────────────────────────────────
if ($method === 'POST') {
    $usr = require_perm('invoice.mark_paid');
    $b   = get_body();
    require_fields($b, ['invoice_refs', 'payment_date', 'amount']);

    $raw_refs = (array)($b['invoice_refs'] ?? []);
    $refs     = array_values(array_filter(array_map(fn($r) => clean(trim((string)$r), 30), $raw_refs)));
    if (empty($refs)) json_err('At least one invoice must be selected');

    $pay_date = valid_date($b['payment_date'] ?? null) ? $b['payment_date'] : date('Y-m-d');
    $notes    = clean($b['notes'] ?? '');
    $amount   = (float)($b['amount'] ?? 0);
    $pay_ref  = next_ref_id('pay');

    $logged = [];
    db_exec("START TRANSACTION");

    try {
        foreach ($refs as $inv_ref) {
            $inv = db_row("SELECT * FROM bf_invoices WHERE ref_id = ?", [$inv_ref]);
            if (!$inv || in_array($inv['status'], ['Paid', 'Cancelled'], true)) continue;

            db_exec(
                "UPDATE bf_invoices SET status = 'Paid', paid_date = ? WHERE ref_id = ?",
                [$pay_date, $inv['ref_id']]
            );
            db_exec(
                "INSERT INTO bf_transactions (trans_date, description, category, reference, callout_ref, credit, debit)
                 VALUES (?,?,?,?,?,?,?)",
                [$pay_date, "Payment received — {$inv['client_name']}", 'Invoice Payment', $inv['ref_id'], clean($inv['callout_ref'] ?? '', 30), $inv['amount'], 0]
            );
            db_insert(
                "INSERT INTO bf_payments
                 (payment_ref, invoice_ref, invoice_id, client_id, client_name, amount, payment_date, notes, logged_by_user_id)
                 VALUES (?,?,?,?,?,?,?,?,?)",
                [
                    $pay_ref,
                    $inv['ref_id'],
                    (int)$inv['id'],
                    $inv['client_id'] ?? null,
                    $inv['client_name'],
                    $inv['amount'],
                    $pay_date,
                    $notes,
                    (int)$usr['id'],
                ]
            );
            $logged[] = $inv['ref_id'];
        }

        db_exec("COMMIT");

    } catch (Exception $e) {
        db_exec("ROLLBACK");
        json_err('Payment batch failed to process. Changes reverted.');
    }

    if (empty($logged)) json_err('No eligible invoices found to mark as paid');

    audit($usr['username'], 'LOG_PAYMENT',
          "Batch payment $pay_ref logged — " . implode(', ', $logged));

    json_ok(
        ['payment_ref' => $pay_ref, 'invoices_processed' => $logged],
        "Logged payment $pay_ref for " . count($logged) . " invoice(s)"
    );
}

json_err('Method not allowed', 405);
