<?php
ob_start();
/**
 * Umlilo Portal — Approvals API
 * POST   /api/approvals.php              → send approval request email
 * GET    /api/approvals.php?token=...    → fetch record for approval page (public)
 * PATCH  /api/approvals.php?token=...    → approve/reject (public)
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/mailer.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$method = $_SERVER['REQUEST_METHOD'];
$token = clean($_GET['token'] ?? '', 64);

// ── POST — Send approval request ────────────────────────
if ($method === 'POST') {
    $usr = require_perm('approval.send');
    $b   = get_body();
    require_fields($b, ['type', 'ref_id', 'client_email']);

    $type = clean($b['type'], 20);
    $ref_id = clean($b['ref_id'], 20);
    $email = clean($b['client_email'], 150);

    if (!in_array($type, ['callout', 'quote'])) {
        json_err('Invalid type: must be callout or quote');
    }

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_err('Invalid email address');
    }

    $table = $type === 'callout' ? 'bf_callouts' : 'bf_quotes';

    // Fetch the record
    $record = db_row("SELECT * FROM {$table} WHERE ref_id = ?", [$ref_id]);
    if (!$record) {
        json_err("Record not found: {$ref_id}", 404);
    }

    // Generate token (random 64 hex chars)
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', time() + 86400); // 24 hours

    // Update record with token
    db_exec(
        "UPDATE {$table} SET approval_token = ?, approval_token_expires = ?, approval_status = 'pending' WHERE ref_id = ?",
        [$token, $expires, $ref_id]
    );

    // Send email
    $sent = send_approval_request($email, $type, $ref_id, $token, $record);
    if (!$sent) {
        json_err('Failed to send approval email', 500);
    }

    audit($usr['username'], 'APPROVAL_REQUEST_SENT', "{$type} {$ref_id} to {$email}");
    json_ok(['data' => ['token' => $token, 'expires' => $expires]], "Approval request sent to {$email}");
}

// ── GET — Fetch record by token (public, no auth) ───────
if ($method === 'GET') {
    if (!$token) {
        json_err('Token required', 400);
    }

    // Find which table has this token
    $callout = db_row(
        "SELECT 'callout' as type, * FROM bf_callouts WHERE approval_token = ? AND approval_token_expires > NOW()",
        [$token]
    );
    if ($callout) {
        json_ok(['data' => $callout]);
    }

    $quote = db_row(
        "SELECT 'quote' as type, * FROM bf_quotes WHERE approval_token = ? AND approval_token_expires > NOW()",
        [$token]
    );
    if ($quote) {
        json_ok(['data' => $quote]);
    }

    json_err('Invalid or expired token', 404);
}

// ── PATCH — Approve or Reject (public, no auth) ─────────
if ($method === 'PATCH') {
    if (!$token) {
        json_err('Token required', 400);
    }

    $b = get_body();
    $decision = clean($b['decision'] ?? '', 20);
    $notes = clean($b['notes'] ?? '', 500);

    if (!in_array($decision, ['approved', 'rejected'])) {
        json_err('Invalid decision: must be approved or rejected');
    }

    $status = $decision === 'approved' ? 'Approved' : 'Cancelled';

    // Find which table has this token
    $callout = db_row(
        "SELECT id, approval_token, ref_id, client_name FROM bf_callouts WHERE approval_token = ? AND approval_token_expires > NOW()",
        [$token]
    );

    if ($callout) {
        $approver = 'client:' . hash('sha256', strtolower(trim($callout['client_name'])));
        db_exec(
            "UPDATE bf_callouts SET approval_status = ?, approved_at = NOW(), approved_by = ? WHERE id = ?",
            [$status, 'Client (' . $callout['client_name'] . ')', $callout['id']]
        );
        audit($approver, 'CALLOUT_APPROVAL', "Callout {$callout['ref_id']} {$status} via approval link");
        json_ok(['data' => ['type' => 'callout', 'ref_id' => $callout['ref_id'], 'approval_status' => $status]]);
    }

    $quote = db_row(
        "SELECT id, approval_token, ref_id, client_name FROM bf_quotes WHERE approval_token = ? AND approval_token_expires > NOW()",
        [$token]
    );

    if ($quote) {
        $approver = 'client:' . hash('sha256', strtolower(trim($quote['client_name'])));
        db_exec(
            "UPDATE bf_quotes SET approval_status = ?, approved_at = NOW(), approved_by = ? WHERE id = ?",
            [$status, 'Client (' . $quote['client_name'] . ')', $quote['id']]
        );
        audit($approver, 'QUOTE_APPROVAL', "Quote {$quote['ref_id']} {$status} via approval link");
        json_ok(['data' => ['type' => 'quote', 'ref_id' => $quote['ref_id'], 'approval_status' => $status]]);
    }

    json_err('Invalid or expired token', 404);
}

// No other methods supported
http_response_code(405);
json_err('Method not allowed', 405);
?>
