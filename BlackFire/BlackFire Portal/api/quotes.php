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

function stream_pdf_attachment(array $attachment): void {
    while (ob_get_level()) ob_end_clean();
    $filename = basename((string)($attachment['filename'] ?? 'document.pdf'));
    $content = (string)($attachment['content'] ?? '');
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . str_replace(['"', '\\'], '', $filename) . '"');
    header('Content-Length: ' . strlen($content));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, no-cache');
    echo $content;
    exit;
}

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
if ($method === 'GET' && clean($_GET['action'] ?? '', 30) === 'download_pdf') {
    require_perm('quote.view');
    if (!$ref_id) json_err('Missing id');
    $quote = db_row("SELECT * FROM bf_quotes WHERE ref_id = ?", [$ref_id]);
    if (!$quote) json_err('Quote not found', 404);
    $rows = attach_items([$quote]);
    require_once __DIR__ . '/../includes/mailer.php';
    stream_pdf_attachment(quote_pdf_attachment($rows[0] ?? $quote));
}

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
    require_fields($b, ['items', 'callout_ref']);

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

    $company_profile_id = (int)($b['company_profile_id'] ?? 1);
    $company_profile = db_row(
        'SELECT id, vat_rate FROM bf_company_profiles WHERE id=? AND host_company_id=1 AND is_active=1',
        [$company_profile_id]
    );
    if (!$company_profile) json_err('Issuing company not found', 404);

    // Calculate total — accept unit_price (web form) or unit (legacy)
    $total = 0;
    foreach ($items as $item) {
        $total += ((float)($item['qty'] ?? 1)) * ((float)($item['unit_price'] ?? $item['unit'] ?? 0));
    }
    // Items are ex-VAT lines; total_amount is the VAT-inclusive final because the
    // convert action bills it verbatim as the invoice amount.
    $total = round($total * (1 + ((float)$company_profile['vat_rate'] / 100)), 2);

    // Determine approval status
    $approval_status = null;
    $status = clean($b['status'] ?? 'Draft');
    if ($usr['role'] === 'senior_tech') {
        $status          = 'Pending Approval';
        $approval_status = 'pending';
    } elseif ($usr['role'] !== 'client' && $client_email && filter_var($client_email, FILTER_VALIDATE_EMAIL)) {
        $approval_status = 'pending';
    }

    $callout_ref_str = clean($b['callout_ref'] ?? '', 30);
    $ref      = next_ref_id('q');
    $quote_no = clean($b['quote_no'] ?? '', 50);
    if (!$quote_no) $quote_no = $ref;

    try {
        db_begin();

        $co = db_row(
            "SELECT id, ref_id, client_id, document_escalation_status,
                    (SELECT COUNT(*) FROM bf_quotes
                      WHERE callout_id = bf_callouts.id OR callout_ref = bf_callouts.ref_id) AS quote_count
               FROM bf_callouts WHERE ref_id = ? LIMIT 1 FOR UPDATE",
            [$callout_ref_str]
        );
        if (!$co) throw new RuntimeException('invalid_callout');
        if ($client_id && $co['client_id'] && (int)$co['client_id'] !== $client_id) {
            throw new RuntimeException('client_mismatch');
        }
        if ((int)$co['quote_count'] > 0 && $co['document_escalation_status'] !== 'approved') {
            throw new RuntimeException('escalation_required');
        }
        $callout_id_fk = (int)$co['id'];
        $callout_ref_str = $co['ref_id'];

        $id = db_insert(
            "INSERT INTO bf_quotes
             (ref_id, quote_no, client_id, client_name, client_email, company_profile_id, status, valid_until, quote_date,
              submitted_by_user_id, source, approval_status, notes, total_amount,
              callout_ref, callout_id)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                $ref,
                $quote_no,
                $client_id,
                $client_name,
                $client_email,
                $company_profile_id,
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
            $item_qty  = (float)($item['qty'] ?? 1);
            $item_unit = (float)($item['unit_price'] ?? $item['unit'] ?? 0);
            db_exec(
                "INSERT INTO bf_quote_items (quote_id, description, qty, unit_price, line_total) VALUES (?,?,?,?,?)",
                [
                    $id,
                    clean($item['description'] ?? $item['desc'] ?? '', 255),
                    $item_qty,
                    $item_unit,
                    round($item_qty * $item_unit, 2),
                ]
            );
        }
        
        db_commit();
    } catch (RuntimeException $error) {
        db_rollback();
        if ($error->getMessage() === 'invalid_callout') json_err('Quote must belong to a valid call log', 422);
        if ($error->getMessage() === 'client_mismatch') json_err('Quote client must match the linked call log client', 422);
        if ($error->getMessage() === 'escalation_required') json_err('Additional quotes require administrator-approved call escalation', 403);
        json_err('Quote creation failed - no changes saved', 500);
    } catch (Throwable $error) {
        db_rollback();
        json_err('Quote creation failed — no changes saved', 500);
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

    if ($action === 'send_quote') {
        require_perm('quote.update');
        $quote = db_row("SELECT * FROM bf_quotes WHERE ref_id = ?", [$ref_id]);
        if (!$quote) json_err('Quote not found', 404);

        $companyProfileId = (int)($b['company_profile_id'] ?? $quote['company_profile_id'] ?? 1);
        if (!db_row('SELECT id FROM bf_company_profiles WHERE id=? AND host_company_id=1 AND is_active=1', [$companyProfileId])) {
            json_err('Issuing company not found', 404);
        }
        $quote['company_profile_id'] = $companyProfileId;

        $to = clean($b['to_email'] ?? $quote['client_email'] ?? '', 150);
        if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) json_err('Valid recipient email required');
        if ((float)($quote['total_amount'] ?? 0) <= 0) json_err('Quote total must be set before sending');

        require_once __DIR__ . '/../includes/mailer.php';
        $rows = attach_items([$quote]);
        $quote = $rows[0] ?? $quote;
        $sent = send_quote_email($quote, $to);
        if (!$sent) json_err('Failed to send quote email - check SMTP settings');

        db_exec(
            "UPDATE bf_quotes SET status = CASE WHEN status = 'Draft' THEN 'Sent' ELSE status END, client_email = ?, company_profile_id = ? WHERE ref_id = ?",
            [$to, $companyProfileId, $ref_id]
        );
        audit($usr['username'], 'QUOTE_SENT', "Quote {$ref_id} sent to {$to} with PDF attachment");
        $row = db_row("SELECT * FROM bf_quotes WHERE ref_id = ?", [$ref_id]);
        $rows = attach_items([$row]);
        json_ok(['data' => $rows[0] ?? $row], "Quote {$ref_id} sent to {$to}");
    }

    // Convert approved quote to a draft invoice
    if ($action === 'convert') {
        require_perm('invoice.create');

        $due_date = (isset($b['due_date']) && valid_date($b['due_date'])) ? $b['due_date'] : date('Y-m-d', strtotime('+14 days'));
        $po       = clean($b['po'] ?? '', 100);
        $inv_ref  = next_ref_id('inv');

        try {
            db_begin();
            $quote = db_row("SELECT * FROM bf_quotes WHERE ref_id = ? FOR UPDATE", [$ref_id]);
            if (!$quote) throw new RuntimeException('quote_not_found');
            if ($quote['status'] !== 'Approved') throw new RuntimeException('quote_not_approved');

            $linked_callout = db_row(
                "SELECT id, ref_id, document_escalation_status,
                        (SELECT COUNT(*) FROM bf_invoices
                          WHERE callout_id = bf_callouts.id OR callout_ref = bf_callouts.ref_id) AS invoice_count
                   FROM bf_callouts
                  WHERE id = ? AND ref_id = ? FOR UPDATE",
                [(int)($quote['callout_id'] ?? 0), $quote['callout_ref'] ?? '']
            );
            if (!$linked_callout) throw new RuntimeException('invalid_callout');

            $existing = db_row(
                "SELECT ref_id FROM bf_invoices WHERE quote_id = ? OR quote_ref = ? LIMIT 1",
                [(int)$quote['id'], $ref_id]
            );
            if ($existing) throw new RuntimeException('already_converted:' . $existing['ref_id']);
            if ((int)$linked_callout['invoice_count'] > 0 && $linked_callout['document_escalation_status'] !== 'approved') {
                throw new RuntimeException('escalation_required');
            }
            $new_invoice_id = db_insert(
                "INSERT INTO bf_invoices
                 (ref_id, invoice_no, client_id, client_name, client_email, company_profile_id, amount, due_date, status,
                  quote_ref, quote_id, callout_ref, callout_id, po, invoice_date, sent_by_user_id)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [
                    $inv_ref, $inv_ref,
                    $quote['client_id'],
                    $quote['client_name'],
                    $quote['client_email'],
                    $quote['company_profile_id'] ?? 1,
                    $quote['total_amount'],
                    $due_date,
                    'Draft',
                    $ref_id, (int)$quote['id'],
                    $linked_callout['ref_id'], (int)$linked_callout['id'],
                    $po, date('Y-m-d'), (int)$usr['id'],
                ]
            );

            $quote_items = db_select("SELECT description, qty, unit_price, line_total FROM bf_quote_items WHERE quote_id = ? ORDER BY id", [(int)$quote['id']]);
            foreach ($quote_items as $qi) {
                db_exec(
                    "INSERT INTO bf_invoice_items (invoice_id, description, qty, unit_price, line_total) VALUES (?,?,?,?,?)",
                    [$new_invoice_id, $qi['description'], $qi['qty'], $qi['unit_price'], $qi['line_total']]
                );
            }

            record_invoice_cost_of_sales([
                'ref_id' => $inv_ref,
                'callout_ref' => $linked_callout['ref_id'],
                'client_name' => $quote['client_name'],
                'amount' => $quote['total_amount'],
                'invoice_date' => date('Y-m-d'),
            ]);
            db_exec("UPDATE bf_quotes SET status = 'Converted' WHERE ref_id = ?", [$ref_id]);
            db_commit();
        } catch (RuntimeException $error) {
            db_rollback();
            if ($error->getMessage() === 'quote_not_found') json_err('Quote not found', 404);
            if ($error->getMessage() === 'quote_not_approved') json_err('Only Approved quotes can be converted to invoices', 422);
            if ($error->getMessage() === 'invalid_callout') json_err('Quote must be linked to a valid callout before conversion', 422);
            if (strpos($error->getMessage(), 'already_converted:') === 0) {
                json_err('Quote already converted - see Invoice ' . substr($error->getMessage(), 18), 409);
            }
            if ($error->getMessage() === 'escalation_required') json_err('Additional invoices require administrator-approved call escalation', 403);
            json_err('Quote conversion failed - no changes saved', 500);
        } catch (Throwable $error) {
            db_rollback();
            json_err('Quote conversion failed - no changes saved', 500);
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
    
    try {
        db_begin();
        $quote = db_row(
            "SELECT q.id, q.status,
                    (SELECT COUNT(*) FROM bf_invoices i WHERE i.quote_id = q.id OR i.quote_ref = q.ref_id) AS invoice_count
               FROM bf_quotes q WHERE q.ref_id = ? FOR UPDATE",
            [$ref_id]
        );
        if (!$quote) throw new RuntimeException('not_found');
        if ($quote['status'] !== 'Draft' || (int)$quote['invoice_count'] > 0) throw new RuntimeException('permanent_record');
        db_exec("DELETE FROM bf_quote_items WHERE quote_id = ?", [(int)$quote['id']]);
        db_exec("DELETE FROM bf_quotes WHERE id = ?", [(int)$quote['id']]);
        db_commit();
    } catch (RuntimeException $error) {
        db_rollback();
        if ($error->getMessage() === 'not_found') json_err('Quote not found', 404);
        if ($error->getMessage() === 'permanent_record') json_err('Only an unused Draft quote may be deleted; declined, approved, converted, and invoiced quotes are retained', 409);
        json_err('Failed to delete quote securely', 500);
    } catch (Throwable $error) {
        db_rollback();
        json_err('Failed to delete quote securely', 500);
    }
    
    audit($usr['username'], 'DELETE', "Quote $ref_id deleted");
    json_ok([], "Quote $ref_id deleted");
}

json_err('Method not allowed', 405);
