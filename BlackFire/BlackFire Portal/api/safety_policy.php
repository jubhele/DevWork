<?php
ob_start();
/**
 * Umlilo Portal — Policy Acknowledgment API
 *
 * GET    /api/safety_policy.php?file_ref=SAF-001   → list acks for a safety file
 * POST   /api/safety_policy.php                    → create new ack request (generates token)
 * PUT    /api/safety_policy.php?id=N               → manual acknowledge, resend email
 * DELETE /api/safety_policy.php?id=N               → remove ack record
 *
 * Public endpoint (no auth): PUT ?action=ack&token=XXXX → record acknowledgment from link
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$method = $_SERVER['REQUEST_METHOD'];

/* ── Public token acknowledgment (no login required) ── */
if ($method === 'PUT') {
    $action = clean($_GET['action'] ?? '', 20);
    if ($action === 'ack') {
        $token = clean($_GET['token'] ?? '', 64);
        if (!$token) json_err('Missing token', 400);
        $rec = db_row("SELECT * FROM bf_policy_acks WHERE token = ? AND status IN ('Pending','Sent')", [$token]);
        if (!$rec) json_err('Invalid or already-used acknowledgment link', 404);
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
        db_exec(
            "UPDATE bf_policy_acks SET status='Acknowledged', acked_at=NOW(), acked_ip=? WHERE id=?",
            [substr($ip, 0, 45), $rec['id']]
        );
        json_ok(['name' => $rec['recipient_name'], 'policy' => $rec['policy_title']], 'Acknowledgment recorded');
    }
}

$user = require_auth();

/* ── GET list ─────────────────────────────────────────── */
if ($method === 'GET') {
    $ref = clean($_GET['file_ref'] ?? '', 30);
    if (!$ref) json_err('Missing file_ref');
    $rows = db_select(
        "SELECT * FROM bf_policy_acks WHERE file_ref = ? ORDER BY created_at DESC",
        [$ref]
    );
    json_ok(['data' => $rows]);
}

/* ── POST create ─────────────────────────────────────── */
if ($method === 'POST') {
    $b = get_body();
    require_fields($b, ['file_ref', 'policy_title', 'recipient_name']);
    $ref   = clean($b['file_ref'], 30);
    $title = clean($b['policy_title'], 255);
    $body  = clean($b['policy_body'] ?? '', 5000);
    $name  = clean($b['recipient_name'], 255);
    $email = clean($b['recipient_email'] ?? '', 255);
    $token = bin2hex(random_bytes(32)); // 64-char hex token

    $id = db_insert(
        "INSERT INTO bf_policy_acks (file_ref, policy_title, policy_body, recipient_name, recipient_email, token, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)",
        [$ref, $title, $body, $name, $email, $token, $user['username']]
    );

    // Optionally send email right away if email provided
    $sent = false;
    if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $sent = _send_ack_email($email, $name, $title, $body, $token, $ref, $cfg);
        if ($sent) {
            db_exec(
                "UPDATE bf_policy_acks SET status='Sent', sent_at=NOW() WHERE id=?",
                [$id]
            );
        }
    }

    $row = db_row("SELECT * FROM bf_policy_acks WHERE id = ?", [$id]);
    audit($user['username'], 'POLICY_ACK_CREATE',
          "Policy ack created for $ref — $name — $title" . ($sent ? ' (email sent)' : ''));
    json_ok(['data' => $row], $sent ? "Acknowledgment request sent to $email" : "Acknowledgment request created");
}

/* ── PUT update (resend / manual ack) ─────────────────── */
if ($method === 'PUT') {
    $id  = (int)($_GET['id'] ?? 0);
    if (!$id) json_err('Missing id');
    $rec = db_row("SELECT * FROM bf_policy_acks WHERE id = ?", [$id]);
    if (!$rec) json_err('Record not found', 404);
    $b      = get_body();
    $action = clean($b['action'] ?? '', 30);

    if ($action === 'manual_ack') {
        db_exec(
            "UPDATE bf_policy_acks SET status='Acknowledged', acked_at=NOW(), acked_ip='manual' WHERE id=?",
            [$id]
        );
        audit($user['username'], 'POLICY_ACK_MANUAL',
              "Manual acknowledgment recorded for #{$id} ({$rec['recipient_name']})");
        json_ok([], 'Acknowledgment recorded for ' . $rec['recipient_name']);
    }

    if ($action === 'resend') {
        $email = $rec['recipient_email'];
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL))
            json_err('No valid email on this record');
        $sent = _send_ack_email($email, $rec['recipient_name'], $rec['policy_title'],
                                $rec['policy_body'] ?? '', $rec['token'], $rec['file_ref'], $cfg);
        if (!$sent) json_err('Failed to send email — check SMTP config');
        db_exec(
            "UPDATE bf_policy_acks SET status='Sent', sent_at=NOW() WHERE id=?",
            [$id]
        );
        audit($user['username'], 'POLICY_ACK_RESEND', "Resent ack email #{$id} to $email");
        json_ok([], "Email resent to $email");
    }

    json_err('Unknown action');
}

/* ── DELETE ──────────────────────────────────────────── */
if ($method === 'DELETE') {
    require_perm('safety.create');
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_err('Missing id');
    db_exec("DELETE FROM bf_policy_acks WHERE id = ?", [$id]);
    audit($user['username'], 'POLICY_ACK_DELETE', "Policy ack #{$id} deleted");
    json_ok([], 'Record deleted');
}

json_err('Method not allowed', 405);

/* ── Email helper ─────────────────────────────────────── */
function _send_ack_email(
    string $to_email,
    string $recipient_name,
    string $policy_title,
    string $policy_body,
    string $token,
    string $file_ref,
    array  $cfg
): bool {
    require_once __DIR__ . '/../includes/mailer.php';
    $company  = $cfg['company_name']  ?? 'Astute Insights / BlackFire Solutions';
    $co_email = $cfg['company_email'] ?? 'info@blackfiresolutions.co.za';
    $base_url = $cfg['portal_base_url'] ?? 'https://portal.umlilo.co.za';
    $ack_url  = rtrim($base_url, '/') . '/policy_ack.php?token=' . urlencode($token);

    $name_h  = htmlspecialchars($recipient_name, ENT_QUOTES);
    $title_h = htmlspecialchars($policy_title,   ENT_QUOTES);
    $ref_h   = htmlspecialchars($file_ref,        ENT_QUOTES);
    $body_h  = $policy_body ? '<div style="border:1px solid #e2e8f0;padding:14px;margin:16px 0;background:#fafafa;white-space:pre-line">' . htmlspecialchars($policy_body) . '</div>' : '';

    $html  = "<html><body style='font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto'>";
    $html .= "<div style='background:#1a1a1a;padding:20px 24px;margin-bottom:24px'>";
    $html .= "<h2 style='color:#f97316;margin:0;font-size:20px'>{$company}</h2>";
    $html .= "<p style='color:#94a3b8;margin:6px 0 0;font-size:13px'>Health &amp; Safety — Policy Acknowledgment</p>";
    $html .= "</div>";
    $html .= "<p>Dear {$name_h},</p>";
    $html .= "<p>You are required to read and formally acknowledge the following Health &amp; Safety policy before commencing or continuing work on site.</p>";
    $html .= "<p><strong>Policy: {$title_h}</strong><br>Safety File Reference: {$ref_h}</p>";
    $html .= $body_h;
    $html .= "<div style='margin:24px 0;text-align:center'>";
    $html .= "<a href='{$ack_url}' style='background:#f97316;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;font-size:15px;font-weight:bold'>Read &amp; Acknowledge Policy</a>";
    $html .= "</div>";
    $html .= "<p style='font-size:12px;color:#64748b'>Or copy this link into your browser:<br>{$ack_url}</p>";
    $html .= "<p>If you have any questions, contact <a href='mailto:{$co_email}'>{$co_email}</a>.</p>";
    $html .= "<hr style='border:none;border-top:1px solid #e2e8f0;margin:24px 0'>";
    $html .= "<p style='font-size:11px;color:#94a3b8'>{$company} — automated notification. Do not reply to this message.</p>";
    $html .= "</body></html>";

    return send_mail($to_email, "Policy Acknowledgment Required — {$title_h} | {$company}", $html, $co_email);
}
