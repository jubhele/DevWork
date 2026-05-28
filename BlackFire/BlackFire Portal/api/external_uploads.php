<?php
ob_start();
/**
 * Umlilo Portal — External Upload Tokens API
 *
 * GET    ?entity_ref=SAF-xxx              → list all tokens for a safety file
 * POST                                    → create token + optionally email recipient
 * PUT    ?id=N  body:{action,email}       → resend email | cancel token
 * DELETE ?id=N                            → delete token record
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user   = require_auth();
$method = $_SERVER['REQUEST_METHOD'];

/* ── GET list ─────────────────────────────────────────────── */
if ($method === 'GET') {
    require_perm('safety.view');
    $ref = clean($_GET['entity_ref'] ?? '', 50);
    if (!$ref) json_err('entity_ref required');
    $rows = db_select(
        "SELECT id, entity_type, entity_ref, section_key, item_no, upload_purpose,
                allowed_mime_types, max_files, files_uploaded,
                uploader_name, uploader_email, uploader_company,
                status, expires_at, first_used_at, completed_at,
                notify_email, created_by, created_at
           FROM bf_external_upload_tokens
          WHERE entity_ref = ?
          ORDER BY created_at DESC",
        [$ref]
    );
    json_ok(['data' => $rows]);
}

/* ── POST create ─────────────────────────────────────────── */
if ($method === 'POST') {
    require_perm('safety.create');
    $b = get_body();
    require_fields($b, ['entity_ref', 'upload_purpose', 'expires_at']);

    $entity_type    = clean($b['entity_type']    ?? 'safety_file', 30);
    $entity_ref     = clean($b['entity_ref'],       50);
    $section_key    = isset($b['section_key'])  ? clean($b['section_key'], 1)   : null;
    $item_no        = isset($b['item_no'])       ? (int)$b['item_no']            : null;
    $purpose        = clean($b['upload_purpose'],  500);
    $mimes          = clean($b['allowed_mime_types'] ?? 'application/pdf,image/jpeg,image/png', 500);
    $max_files      = max(1, min(20, (int)($b['max_files']      ?? 5)));
    $uploader_email = clean($b['uploader_email'] ?? '', 255);
    $notify_email   = clean($b['notify_email']   ?? '', 255);
    $expires_at     = clean($b['expires_at'],       20);

    if (!preg_match('/^\d{4}-\d{2}-\d{2}/', $expires_at)) json_err('expires_at must be a date (YYYY-MM-DD)');

    $token = bin2hex(random_bytes(32)); // 64-char hex, URL-safe

    $id = db_insert(
        "INSERT INTO bf_external_upload_tokens
           (token, entity_type, entity_ref, section_key, item_no,
            upload_purpose, allowed_mime_types, max_files,
            uploader_email, notify_email, status, expires_at, created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,'Active',?,?)",
        [$token, $entity_type, $entity_ref, $section_key, $item_no ?: null,
         $purpose, $mimes, $max_files,
         $uploader_email ?: null, $notify_email ?: null,
         $expires_at . ' 23:59:00', $user['username']]
    );

    $sent = false;
    if ($uploader_email && filter_var($uploader_email, FILTER_VALIDATE_EMAIL)) {
        $sent = _ext_send_email($uploader_email, $token, $purpose, $entity_ref, $expires_at, $cfg);
    }

    audit($user['username'], 'EXT_UPLOAD_CREATE',
          "External upload token created for $entity_ref — $purpose" . ($sent ? " (emailed $uploader_email)" : ''));

    $row = db_row("SELECT * FROM bf_external_upload_tokens WHERE id=?", [$id]);
    json_ok(['data' => $row], $sent ? "Token created and email sent to $uploader_email" : 'Token created');
}

/* ── PUT resend / cancel ─────────────────────────────────── */
if ($method === 'PUT') {
    require_perm('safety.create');
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_err('Missing id');
    $rec = db_row("SELECT * FROM bf_external_upload_tokens WHERE id=?", [$id]);
    if (!$rec) json_err('Token not found', 404);

    $b      = get_body();
    $action = clean($b['action'] ?? '', 20);

    if ($action === 'resend') {
        $email = clean($b['email'] ?? $rec['uploader_email'] ?? '', 255);
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('No valid email address');
        if (in_array($rec['status'], ['Completed','Cancelled','Expired'], true)) {
            json_err('Cannot resend — token is ' . strtolower($rec['status']));
        }
        $sent = _ext_send_email($email, $rec['token'], $rec['upload_purpose'],
                                $rec['entity_ref'], $rec['expires_at'], $cfg);
        if (!$sent) json_err('Failed to send email — check SMTP configuration');
        audit($user['username'], 'EXT_UPLOAD_RESEND', "Resent upload link #{$id} to $email");
        json_ok([], "Email resent to $email");
    }

    if ($action === 'cancel') {
        db_exec("UPDATE bf_external_upload_tokens SET status='Cancelled' WHERE id=?", [$id]);
        audit($user['username'], 'EXT_UPLOAD_CANCEL', "Cancelled upload token #{$id} ({$rec['entity_ref']})");
        json_ok([], 'Upload token cancelled');
    }

    json_err('Unknown action — use resend or cancel');
}

/* ── DELETE ──────────────────────────────────────────────── */
if ($method === 'DELETE') {
    require_perm('safety.create');
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_err('Missing id');
    $rec = db_row("SELECT id, entity_ref FROM bf_external_upload_tokens WHERE id=?", [$id]);
    if (!$rec) json_err('Token not found', 404);
    db_exec("DELETE FROM bf_external_upload_tokens WHERE id=?", [$id]);
    audit($user['username'], 'EXT_UPLOAD_DELETE', "Deleted upload token #{$id} ({$rec['entity_ref']})");
    json_ok([], 'Token deleted');
}

json_err('Method not allowed', 405);

/* ── Email helper ─────────────────────────────────────────── */
function _ext_send_email(
    string $to_email,
    string $token,
    string $purpose,
    string $entity_ref,
    string $expires_at,
    array  $cfg
): bool {
    require_once __DIR__ . '/../includes/mailer.php';
    $company  = $cfg['company_name']  ?? 'Astute Insights / BlackFire Solutions';
    $co_email = $cfg['company_email'] ?? 'info@blackfiresolutions.co.za';
    $base_url = $cfg['portal_base_url'] ?? 'https://portal.umlilo.co.za';
    $url      = rtrim($base_url, '/') . '/external_upload.php?token=' . urlencode($token);
    $exp_h    = htmlspecialchars(date('d M Y', strtotime($expires_at)));
    $ref_h    = htmlspecialchars($entity_ref);
    $purp_h   = htmlspecialchars($purpose);

    $html  = "<html><body style='font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto'>";
    $html .= "<div style='background:#1a1a1a;padding:20px 24px;margin-bottom:24px'>";
    $html .= "<h2 style='color:#f97316;margin:0;font-size:20px'>{$company}</h2>";
    $html .= "<p style='color:#94a3b8;margin:6px 0 0;font-size:13px'>Secure Document Upload Request</p>";
    $html .= "</div>";
    $html .= "<p>You have been asked to upload document(s) to our secure portal. No login is required.</p>";
    $html .= "<div style='border:1px solid #e2e8f0;border-left:4px solid #f97316;padding:14px 16px;margin:16px 0;background:#fafafa'>";
    $html .= "<p style='margin:0 0 8px'><strong>Reference:</strong> {$ref_h}</p>";
    $html .= "<p style='margin:0 0 8px'><strong>What to upload:</strong> {$purp_h}</p>";
    $html .= "<p style='margin:0'><strong>Link expires:</strong> {$exp_h}</p>";
    $html .= "</div>";
    $html .= "<div style='margin:24px 0;text-align:center'>";
    $html .= "<a href='{$url}' style='background:#f97316;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;font-size:15px;font-weight:bold'>Upload Document</a>";
    $html .= "</div>";
    $html .= "<p style='font-size:12px;color:#64748b'>Or copy this link into your browser:<br>{$url}</p>";
    $html .= "<p style='font-size:12px;color:#64748b'>Files are stored securely. Questions? Contact <a href='mailto:{$co_email}'>{$co_email}</a>.</p>";
    $html .= "<hr style='border:none;border-top:1px solid #e2e8f0;margin:24px 0'>";
    $html .= "<p style='font-size:11px;color:#94a3b8'>{$company} — automated notification. Do not reply to this message.</p>";
    $html .= "</body></html>";

    return send_mail($to_email, "Document Upload Request — {$entity_ref} | {$company}", $html, $co_email);
}
