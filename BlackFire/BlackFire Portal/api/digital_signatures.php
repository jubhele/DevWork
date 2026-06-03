<?php
ob_start();
/**
 * Umlilo Portal — Digital Signatures API
 *
 * GET    ?entity_type=X&entity_ref=Y   → list signatures for a record
 * POST                                  → create signature request + email signer
 * PUT    ?id=N  body:{action}           → resend email
 * DELETE ?id=N                          → delete signature record
 *
 * The public signing page is sign.php?token=XXXX (no auth required).
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
    $entity_type = clean($_GET['entity_type'] ?? '', 30);
    $entity_ref  = clean($_GET['entity_ref']  ?? '', 50);
    if (!$entity_type || !$entity_ref) json_err('entity_type and entity_ref required');

    $rows = db_select(
        "SELECT id, entity_type, entity_ref, document_label,
                signer_name, signer_email, signer_role, signer_company,
                signature_method, status,
                sent_at, signed_at, declined_at, declined_reason,
                signer_ip, created_by, created_at
           FROM bf_digital_signatures
          WHERE entity_type = ? AND entity_ref = ?
          ORDER BY created_at DESC",
        [$entity_type, $entity_ref]
    );
    json_ok(['data' => $rows]);
}

/* ── POST create ─────────────────────────────────────────── */
if ($method === 'POST') {
    require_perm('safety.create');
    $b = get_body();
    require_fields($b, ['entity_type', 'entity_ref', 'document_label', 'signer_name', 'signer_email']);

    $entity_type    = clean($b['entity_type'],     30);
    $entity_ref     = clean($b['entity_ref'],       50);
    $doc_label      = clean($b['document_label'],  255);
    $signer_name    = clean($b['signer_name'],     255);
    $signer_email   = clean($b['signer_email'],    255);
    $signer_role    = clean($b['signer_role']    ?? '', 100);
    $signer_company = clean($b['signer_company'] ?? '', 255);
    $sig_method     = in_array($b['signature_method'] ?? 'email_link',
                               ['email_link','digital_certificate'], true)
                      ? $b['signature_method'] : 'email_link';
    $expires_days   = max(1, min(30, (int)($b['expires_days'] ?? 7)));
    $expires_at     = date('Y-m-d H:i:s', strtotime("+{$expires_days} days"));

    if (!filter_var($signer_email, FILTER_VALIDATE_EMAIL)) json_err('Invalid signer email address');

    $token = null;
    if ($sig_method === 'email_link') {
        $token = bin2hex(random_bytes(32)); // 64-char hex
    }

    $id = db_insert(
        "INSERT INTO bf_digital_signatures
           (entity_type, entity_ref, document_label,
            signer_name, signer_email, signer_role, signer_company,
            signature_method, token, token_expires_at,
            status, created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,'Pending',?)",
        [$entity_type, $entity_ref, $doc_label,
         $signer_name, $signer_email,
         $signer_role ?: null, $signer_company ?: null,
         $sig_method, $token, $token ? $expires_at : null,
         $user['username']]
    );

    $sent = false;
    if ($sig_method === 'email_link' && $token) {
        $sent = _sig_send_email($signer_email, $signer_name, $token,
                                $doc_label, $entity_ref, $expires_at, $cfg);
        if ($sent) {
            db_exec("UPDATE bf_digital_signatures SET status='Sent', sent_at=NOW() WHERE id=?", [$id]);
        }
    }

    audit($user['username'], 'DIGSIG_CREATE',
          "Signature request created: $entity_ref — $doc_label — $signer_name" .
          ($sent ? " (emailed $signer_email)" : ''));

    $row = db_row(
        "SELECT id, entity_type, entity_ref, document_label, signer_name, signer_email,
                signer_role, signer_company, signature_method, status, sent_at, created_at
           FROM bf_digital_signatures WHERE id=?",
        [$id]
    );
    json_ok(['data' => $row],
            $sent ? "Signature request sent to $signer_email" : 'Signature request created');
}

/* ── PUT resend ──────────────────────────────────────────── */
if ($method === 'PUT') {
    require_perm('safety.create');
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_err('Missing id');
    $rec = db_row("SELECT * FROM bf_digital_signatures WHERE id=?", [$id]);
    if (!$rec) json_err('Record not found', 404);

    $b      = get_body();
    $action = clean($b['action'] ?? 'resend', 20);

    if ($action === 'resend') {
        if ($rec['signature_method'] !== 'email_link' || !$rec['token']) {
            json_err('Resend is only available for email-link signatures');
        }
        if (in_array($rec['status'], ['Signed','Declined','Expired'], true)) {
            json_err('Cannot resend — signature is already ' . strtolower($rec['status']));
        }
        $sent = _sig_send_email(
            $rec['signer_email'], $rec['signer_name'], $rec['token'],
            $rec['document_label'], $rec['entity_ref'], $rec['token_expires_at'] ?? '', $cfg
        );
        if (!$sent) json_err('Failed to send email — check SMTP configuration');
        db_exec("UPDATE bf_digital_signatures SET status='Sent', sent_at=NOW() WHERE id=?", [$id]);
        audit($user['username'], 'DIGSIG_RESEND',
              "Resent signature request #{$id} to {$rec['signer_email']}");
        json_ok([], 'Signature request resent to ' . $rec['signer_email']);
    }

    json_err('Unknown action — use resend');
}

/* ── DELETE ──────────────────────────────────────────────── */
if ($method === 'DELETE') {
    require_perm('safety.create');
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_err('Missing id');
    $rec = db_row("SELECT id, entity_ref, document_label FROM bf_digital_signatures WHERE id=?", [$id]);
    if (!$rec) json_err('Record not found', 404);
    db_exec("DELETE FROM bf_digital_signatures WHERE id=?", [$id]);
    audit($user['username'], 'DIGSIG_DELETE',
          "Deleted signature record #{$id} ({$rec['entity_ref']} — {$rec['document_label']})");
    json_ok([], 'Signature record deleted');
}

json_err('Method not allowed', 405);

/* ── Email helper ─────────────────────────────────────────── */
function _sig_send_email(
    string $to_email,
    string $signer_name,
    string $token,
    string $doc_label,
    string $entity_ref,
    string $expires_at,
    array  $cfg
): bool {
    require_once __DIR__ . '/../includes/mailer.php';
    $company  = $cfg['company_name']  ?? 'BlackFire Solutions';
    $co_email = $cfg['company_email'] ?? 'info@blackfiresolutions.co.za';
    $base_url = $cfg['portal_base_url'] ?? 'https://portal.umlilo.co.za';
    $url      = rtrim($base_url, '/') . '/sign.php?token=' . urlencode($token);
    $name_h   = htmlspecialchars($signer_name);
    $label_h  = htmlspecialchars($doc_label);
    $ref_h    = htmlspecialchars($entity_ref);
    $exp_h    = $expires_at ? htmlspecialchars(date('d M Y H:i', strtotime($expires_at))) : 'N/A';

    $html  = "<html><body style='font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto'>";
    $html .= "<div style='background:#1a1a1a;padding:20px 24px;margin-bottom:24px'>";
    $html .= "<h2 style='color:#f97316;margin:0;font-size:20px'>{$company}</h2>";
    $html .= "<p style='color:#94a3b8;margin:6px 0 0;font-size:13px'>Electronic Signature Request</p>";
    $html .= "</div>";
    $html .= "<p>Dear {$name_h},</p>";
    $html .= "<p style='margin-top:12px'>You have been asked to electronically sign the following document. No login is required — simply click the button below.</p>";
    $html .= "<div style='border:1px solid #e2e8f0;border-left:4px solid #16a34a;padding:14px 16px;margin:16px 0;background:#fafafa'>";
    $html .= "<p style='margin:0 0 8px'><strong>Document:</strong> {$label_h}</p>";
    $html .= "<p style='margin:0 0 8px'><strong>Reference:</strong> {$ref_h}</p>";
    $html .= "<p style='margin:0'><strong>Link expires:</strong> {$exp_h}</p>";
    $html .= "</div>";
    $html .= "<p style='font-size:13px;color:#475569'>Your electronic signature carries the same legal weight as a handwritten signature under the Electronic Communications and Transactions Act (ECT Act) 25 of 2002 of South Africa.</p>";
    $html .= "<div style='margin:24px 0;text-align:center'>";
    $html .= "<a href='{$url}' style='background:#16a34a;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;font-size:15px;font-weight:bold'>Sign Document</a>";
    $html .= "</div>";
    $html .= "<p style='font-size:12px;color:#64748b'>Or copy this link into your browser:<br>{$url}</p>";
    $html .= "<p style='font-size:12px;color:#64748b'>Questions? Contact <a href='mailto:{$co_email}'>{$co_email}</a>.</p>";
    $html .= "<hr style='border:none;border-top:1px solid #e2e8f0;margin:24px 0'>";
    $html .= "<p style='font-size:11px;color:#94a3b8'>{$company} — automated notification. Your signature will be recorded with a timestamp and IP address for audit purposes.</p>";
    $html .= "</body></html>";

    return send_mail($to_email, "Signature Required — {$doc_label} | {$company}", $html, $co_email);
}
