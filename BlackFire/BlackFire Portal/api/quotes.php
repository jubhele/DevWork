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
        $like  = '%' . like_escape($q) . '%';
        $where = 'WHERE (ref_id LIKE ? ESCAPE \'\\\\\' OR quote_no LIKE ? ESCAPE \'\\\\\' OR client_name LIKE ? ESCAPE \'\\\\\' OR status LIKE ? ESCAPE \'\\\\\')';
        $params = [$like, $like, $like, $like];
    }

    $total = db_row("SELECT COUNT(*) AS n FROM bf_quotes $where", $params)['n'] ?? 0;
    $rows  = db_select(
        "SELECT q.*, COALESCE(u.username,'') AS submitted_by
           FROM bf_quotes q
           LEFT JOIN bf_users u ON u.id = q.submitted_by_user_id
          $where ORDER BY q.quote_date DESC LIMIT {$pg['limit']} OFFSET {$pg['offset']}",
        $params
    );
    $rows  = attach_items($rows);
    json_ok(['data' => $rows, 'total' => (int)$total]);
}

// ── POST — Create ──────────────────────────────────────
if ($method === 'POST') {
    $usr = require_perm('quote.create');
    $b   = get_body();
    require_fields($b, ['items']);

    $items = is_array($b['items']) ? $b['items'] : [];
    if (!$items) json_err('Quote must have at least one line item');

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
    } elseif ($usr['role'] !== 'client' && $client_email && filter_var($client_email, FILTER_VALIDATE_EMAIL)) {
        $approval_status = 'pending';
    }

    // Resolve linked callout FK
    $callout_ref_str = clean($b['callout_ref'] ?? '', 30);
    $callout_id_fk   = null;
    if ($callout_ref_str) {
        $co = db_row("SELECT id FROM bf_callouts WHERE ref_id = ? LIMIT 1", [$callout_ref_str]);
        $callout_id_fk = $co ? (int)$co['id'] : null;
    }

    $ref      = next_ref_id('q');
    $quote_no = clean($b['quote_no'] ?? '', 50);
    if (!$quote_no) $quote_no = $ref;

    try {
        db_begin();

        $id = db_insert(
            "INSERT INTO bf_quotes
             (ref_id, quote_no, client_id, client_name, client_email, status, valid_until, quote_date,
              submitted_by_user_id, source, approval_status, notes, total_amount,
              callout_ref, callout_id)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                $ref,
                $quote_no,
                $client_id,
                $client_name,
                $client_email,
                $status,
                valid_date($b['valid_until'] ?? null) ? $b['valid_until'] : null,
                date('Y-m-d'),
                (int)$usr['id'],
                clean($b['source'] ?? 'staff'),
                $approval_status,
                clean($b['notes'] ?? '', 2000),
                $total,
                $callout_ref_str,
                $callout_id_fk,
            ]
        );

        foreach ($items as $item) {
            db_exec(
                "INSERT INTO bf_quote_items (quote_id, description, qty, unit_price) VALUES (?,?,?,?)",
                [$id, clean($item['desc'] ?? '', 255), (float)($item['qty'] ?? 1), (float)($item['unit'] ?? 0)]
            );
        }
        
        db_commit();
    } catch (Exception $e) {
        db_rollback();
        json_err('Failed to create quote and line items securely: ' . $e->getMessage(), 500);
    }

    audit($usr['username'], 'CREATE', "Quote $ref created (R" . number_format($total, 2) . ", approval: $approval_status)");
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

    // Convert approved quote to a draft invoice
    if ($action === 'convert') {
        require_perm('invoice.create');

        $quote = db_row("SELECT * FROM bf_quotes WHERE ref_id = ?", [$ref_id]);
        if (!$quote) json_err('Quote not found', 404);
        if ($quote['status'] !== 'Approved') json_err('Only Approved quotes can be converted to invoices', 422);

        $linked_callout = db_row(
            "SELECT id, ref_id FROM bf_callouts WHERE ref_id = ? OR id = ? LIMIT 1",
            [$quote['callout_ref'] ?? '', (int)($quote['callout_id'] ?? 0)]
        );
        if (!$linked_callout) json_err('Quote must be linked to a valid callout before conversion', 422);

        $existing = db_row("SELECT ref_id FROM bf_invoices WHERE quote_ref = ? LIMIT 1", [$ref_id]);
        if ($existing) json_err('Quote already converted — see Invoice ' . $existing['ref_id'], 409);

        $due_date = (isset($b['due_date']) && valid_date($b['due_date'])) ? $b['due_date'] : date('Y-m-d', strtotime('+30 days'));
        $po       = clean($b['po'] ?? '', 100);
        $inv_ref  = next_ref_id('inv');

        try {
            db_begin();
            db_insert(
                "INSERT INTO bf_invoices
                 (ref_id, invoice_no, client_id, client_name, client_email, amount, due_date, status,
                  quote_ref, quote_id, callout_ref, callout_id, po, invoice_date, sent_by_user_id)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [
                    $inv_ref, $inv_ref,
                    $quote['client_id'],
                    $quote['client_name'],
                    $quote['client_email'],
                    $quote['total_amount'],
                    $due_date,
                    'Draft',
                    $ref_id, (int)$quote['id'],
                    $linked_callout['ref_id'], (int)$linked_callout['id'],
                    $po, date('Y-m-d'), (int)$usr['id'],
                ]
            );
            record_invoice_cost_of_sales([
                'ref_id' => $inv_ref,
                'callout_ref' => $linked_callout['ref_id'],
                'client_name' => $quote['client_name'],
                'amount' => $quote['total_amount'],
                'invoice_date' => date('Y-m-d'),
            ]);
            db_exec("UPDATE bf_quotes SET status = 'Converted' WHERE ref_id = ?", [$ref_id]);
            db_commit();
        } catch (Exception $e) {
            db_rollback();
            json_err('Conversion failed: ' . $e->getMessage(), 500);
        }

        audit($usr['username'], 'CONVERT', "Quote $ref_id converted to Invoice $inv_ref");
        $inv = db_row("SELECT * FROM bf_invoices WHERE ref_id = ?", [$inv_ref]);
        json_ok(['data' => $inv], "Quote $ref_id converted to Invoice $inv_ref");
    }

    // General status update
    require_perm('quote.update');
    $allowed = ['status', 'valid_until', 'notes', 'quote_no'];
    $sets   = [];
    $params = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            // Prevent manual status overrides that break approval workflow
            if ($f === 'status' && in_array(strtolower($b[$f]), ['approved', 'rejected'])) {
                continue; 
            }
            // Enforce date validation on update
            if ($f === 'valid_until' && !valid_date($b[$f])) {
                $b[$f] = null; 
            }
            
            $sets[]   = "$f = ?";
            $params[] = clean($b[$f], $f === 'notes' ? 2000 : 255);
        }
    }
    
    if (!$sets) json_err('No valid fields to update');
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
    
    $quote = db_row("SELECT id FROM bf_quotes WHERE ref_id = ?", [$ref_id]);
    if (!$quote) json_err('Quote not found', 404);

    try {
        db_begin();
        // Explicitly clear line items first to prevent orphans
        db_exec("DELETE FROM bf_quote_items WHERE quote_id = ?", [$quote['id']]);
        db_exec("DELETE FROM bf_quotes WHERE id = ?", [$quote['id']]);
        db_commit();
    } catch (Exception $e) {
        db_rollback();
        json_err('Failed to delete quote securely', 500);
    }
    
    audit($usr['username'], 'DELETE', "Quote $ref_id deleted");
    json_ok([], "Quote $ref_id deleted");
}

json_err('Method not allowed', 405);
