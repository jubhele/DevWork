<?php
ob_start();
/**
 * Umlilo Portal — SMTP Mailer
 * Pure PHP STARTTLS on port 587. No Composer required.
 */

/**
 * Core SMTP sender. Reads credentials from portal config.
 *
 * @param  string $to      Recipient address
 * @param  string $subject Subject line
 * @param  string $body    Plain-text body  (HTML body for html=true)
 * @param  bool   $html    Send as text/html instead of text/plain
 * @return bool
 * @throws RuntimeException on SMTP protocol error
 */
/**
 * @param array $options Optional overrides:
 *   from_override  string  Display From address (different from SMTP auth)
 *   from_name      string  Display From name
 *   reply_to       string  Reply-To header (defaults to info@blackfiresolutions.co.za)
 */
function smtp_send(string $to, string $subject, string $body, bool $html = false, array $options = []): bool {
    $cfg = require __DIR__ . '/../config/config.php';

    $host     = $cfg['mail_host']     ?? 'localhost';
    $port     = (int)($cfg['mail_port'] ?? 587);
    $username = $cfg['mail_username'] ?? '';
    $password = getenv('BF_MAIL_PASS') ?: ($cfg['mail_password'] ?? '');
    $from     = $options['from_override'] ?? ($cfg['mail_from'] ?? $username);
    $fromName = $options['from_name']     ?? ($cfg['mail_from_name'] ?? 'BlackFire Solutions');
    $replyTo  = $options['reply_to']      ?? ($cfg['company_email'] ?? 'info@blackfiresolutions.co.za');

    if (!$username || !$password) {
        error_log('smtp_send: mail credentials not configured');
        return false;
    }

    $timeout = 15;
    $errno = 0; $errstr = '';

    $sock = @fsockopen($host, $port, $errno, $errstr, $timeout);
    if (!$sock) {
        throw new RuntimeException("SMTP connect failed ($host:$port): $errstr ($errno)");
    }
    stream_set_timeout($sock, $timeout);

    $read = function() use ($sock): string {
        $buf = '';
        while (!feof($sock)) {
            $line = fgets($sock, 512);
            if ($line === false) break;
            $buf .= $line;
            // Last line of a multi-line response has a space after the code
            if (strlen($line) >= 4 && $line[3] === ' ') break;
        }
        return $buf;
    };

    $cmd = function(string $c) use ($sock, $read): string {
        fwrite($sock, $c . "\r\n");
        return $read();
    };

    $expect = function(string $resp, string $code) use ($host, $port) {
        if (substr(ltrim($resp), 0, 3) !== $code) {
            throw new RuntimeException("SMTP error (expected $code from $host:$port): " . trim($resp));
        }
    };

    // Greeting + EHLO
    $expect($read(), '220');
    $expect($cmd("EHLO $host"), '250');

    // Upgrade to TLS
    $expect($cmd('STARTTLS'), '220');
    if (!stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
        throw new RuntimeException('STARTTLS: TLS negotiation failed');
    }

    // Re-greet after TLS
    $expect($cmd("EHLO $host"), '250');

    // Authenticate
    $expect($cmd('AUTH LOGIN'), '334');
    $expect($cmd(base64_encode($username)), '334');
    $expect($cmd(base64_encode($password)), '235');

    // Envelope
    $expect($cmd("MAIL FROM:<$from>"), '250');
    $expect($cmd("RCPT TO:<$to>"),     '250');
    $expect($cmd('DATA'),              '354');

    // Build the message
    $date    = date('r');
    $msgId   = '<' . uniqid('bf', true) . '@' . $host . '>';
    $encName = '=?UTF-8?B?' . base64_encode($fromName) . '?=';
    $encSubj = '=?UTF-8?B?' . base64_encode($subject)  . '?=';
    $ctype   = $html ? 'text/html' : 'text/plain';

    $encReply = '=?UTF-8?B?' . base64_encode($replyTo) . '?=';

    $msg  = "Date: $date\r\n";
    $msg .= "From: $encName <$from>\r\n";
    $msg .= "Reply-To: <$replyTo>\r\n";
    $msg .= "To: <$to>\r\n";
    $msg .= "Subject: $encSubj\r\n";
    $msg .= "Message-ID: $msgId\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: $ctype; charset=UTF-8\r\n";
    $msg .= "Content-Transfer-Encoding: quoted-printable\r\n";
    $msg .= "\r\n";
    $msg .= quoted_printable_encode($body) . "\r\n.";

    $expect($cmd($msg), '250');
    $cmd('QUIT');
    fclose($sock);
    return true;
}

/**
 * Convenience wrapper — keeps backward compatibility with callers that pass cfg arrays.
 */
function send_mail(
    string $to,
    string $subject,
    string $html_body,
    ?string $reply_to = null
): bool {
    try {
        $opts = $reply_to ? ['reply_to' => $reply_to] : [];
        return smtp_send($to, $subject, $html_body, true, $opts);
    } catch (RuntimeException $e) {
        error_log('send_mail SMTP error: ' . $e->getMessage());
        return false;
    }
}

function send_approval_request(
    string $to_email,
    string $record_type,
    string $ref_id,
    string $token,
    array  $record
): bool {
    $cfg = require __DIR__ . '/../config/config.php';
    $base_url    = $cfg['base_url'] ?? 'https://blackfiresolutions.co.za';
    $approval_url = "{$base_url}/approve.php?token={$token}&type={$record_type}";

    $html  = "<html><body style='font-family:Arial,sans-serif;color:#333'>";
    $html .= "<h2>Approval Request</h2><p>Dear Client,</p>";
    $html .= "<p>We have recorded a {$record_type} and are requesting your approval:</p>";

    if ($record_type === 'callout') {
        $html .= "<div style='border:1px solid #ddd;padding:12px;margin:15px 0;background:#f9f9f9'>";
        $html .= "<p><strong>Callout Reference:</strong> {$ref_id}</p>";
        $html .= "<p><strong>Service:</strong> " . htmlspecialchars($record['service'] ?? '') . "</p>";
        $html .= "<p><strong>Location:</strong> " . htmlspecialchars($record['location'] ?? '') . "</p>";
        $html .= "<p><strong>Date:</strong> "     . htmlspecialchars($record['callout_date'] ?? '') . "</p>";
        if (!empty($record['notes'])) {
            $html .= "<p><strong>Notes:</strong> " . htmlspecialchars($record['notes']) . "</p>";
        }
        $html .= "</div>";
    } elseif ($record_type === 'quote') {
        $html .= "<div style='border:1px solid #ddd;padding:12px;margin:15px 0;background:#f9f9f9'>";
        $html .= "<p><strong>Quote Reference:</strong> {$ref_id}</p>";
        $html .= "<p><strong>Total Amount:</strong> R " . number_format($record['total_amount'] ?? 0, 2) . "</p>";
        $html .= "<p><strong>Valid Until:</strong> "   . htmlspecialchars($record['valid_until'] ?? '') . "</p>";
        if (!empty($record['notes'])) {
            $html .= "<p><strong>Notes:</strong> " . htmlspecialchars($record['notes']) . "</p>";
        }
        $html .= "</div>";
    }

    $html .= "<p><a href='{$approval_url}' style='display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:4px;margin:10px 0'>Review &amp; Approve</a></p>";
    $html .= "<p>Or use this link: <a href='{$approval_url}'>{$approval_url}</a></p>";
    $html .= "<hr><p style='font-size:12px;color:#666'>This link expires in 7 days. Questions? Contact " . htmlspecialchars($cfg['company_email'] ?? '') . "</p>";
    $html .= "</body></html>";

    return send_mail($to_email, "Approval Request: {$record_type} {$ref_id}", $html);
}

/**
 * Notify client that their callout is completed and a draft invoice is being prepared.
 * From: noreply@, Reply-To: info@
 */
function send_invoice_notification_email(
    string $to_email,
    array  $callout,
    string $inv_ref
): bool {
    $cfg      = require __DIR__ . '/../config/config.php';
    $company  = $cfg['company_name'] ?? 'BlackFire Solutions';
    $co_email = $cfg['company_email'] ?? 'info@blackfiresolutions.co.za';

    $html  = "<html><body style='font-family:Arial,sans-serif;color:#333'>";
    $html .= "<h2>{$company}</h2>";
    $html .= "<p>Dear " . htmlspecialchars($callout['client_name'] ?? 'Client') . ",</p>";
    $html .= "<p>Your callout has been completed and an invoice has been prepared for your records.</p>";
    $html .= "<div style='border:1px solid #ddd;padding:14px;margin:16px 0;background:#f9f9f9'>";
    $html .= "<p><strong>Callout Reference:</strong> " . htmlspecialchars($callout['ref_id'] ?? '') . "</p>";
    $html .= "<p><strong>Service:</strong> " . htmlspecialchars($callout['service'] ?? '') . "</p>";
    $html .= "<p><strong>Location:</strong> " . htmlspecialchars($callout['location'] ?? '') . "</p>";
    $html .= "<p><strong>Date:</strong> " . htmlspecialchars($callout['callout_date'] ?? '') . "</p>";
    $html .= "<p><strong>Invoice Reference:</strong> {$inv_ref} (amount to be confirmed)</p>";
    $html .= "</div>";
    $html .= "<p>Your account manager will send the finalised invoice shortly. For queries contact <a href='mailto:{$co_email}'>{$co_email}</a>.</p>";
    $html .= "<hr><p style='font-size:11px;color:#888'>{$company} — automated notification. Do not reply to this email.</p>";
    $html .= "</body></html>";

    return send_mail($to_email, "Callout Completed — Invoice {$inv_ref} Prepared | {$company}", $html);
}

/**
 * Send a specific invoice to a client by email.
 * From: noreply@, Reply-To: info@
 */
function send_invoice_email(array $invoice, string $to_email): bool {
    $cfg      = require __DIR__ . '/../config/config.php';
    $company  = $cfg['company_name'] ?? 'BlackFire Solutions';
    $co_email = $cfg['company_email'] ?? 'info@blackfiresolutions.co.za';
    $ref      = $invoice['ref_id'] ?? '';

    $html  = "<html><body style='font-family:Arial,sans-serif;color:#333'>";
    $html .= "<h2>{$company} — Invoice {$ref}</h2>";
    $html .= "<p>Dear " . htmlspecialchars($invoice['client_name'] ?? 'Client') . ",</p>";
    $html .= "<p>Please find your invoice details below.</p>";
    $html .= "<div style='border:1px solid #ddd;padding:14px;margin:16px 0;background:#f9f9f9'>";
    $html .= "<p><strong>Invoice Reference:</strong> {$ref}</p>";
    $html .= "<p><strong>Invoice Date:</strong> " . htmlspecialchars($invoice['invoice_date'] ?? '') . "</p>";
    $html .= "<p><strong>Due Date:</strong> " . htmlspecialchars($invoice['due_date'] ?? '') . "</p>";
    if (!empty($invoice['callout_ref'])) {
        $html .= "<p><strong>Callout Reference:</strong> " . htmlspecialchars($invoice['callout_ref']) . "</p>";
    }
    if (!empty($invoice['po'])) {
        $html .= "<p><strong>Purchase Order:</strong> " . htmlspecialchars($invoice['po']) . "</p>";
    }
    $html .= "<p><strong>Amount Due:</strong> R " . number_format((float)($invoice['amount'] ?? 0), 2) . "</p>";
    $html .= "</div>";
    $html .= "<p>Please arrange payment before the due date. For queries contact <a href='mailto:{$co_email}'>{$co_email}</a>.</p>";
    $html .= "<hr><p style='font-size:11px;color:#888'>{$company} — automated notification. Do not reply to this email.</p>";
    $html .= "</body></html>";

    return send_mail($to_email, "Invoice {$ref} from {$company}", $html);
}

/**
 * Send a statement of outstanding invoices.
 *
 * @param array  $statement   Row from bf_statements
 * @param array  $invoices    Rows from bf_invoices (outstanding)
 * @param string $to_email    Recipient address
 * @param string $from_email  Sender address (display From header override)
 * @param string $from_name   Sender display name
 */
/**
 * Send a policy acknowledgment request to a contractor.
 * The contractor is asked to confirm they have read the H&S policies for the safety file.
 */
function send_safety_policy_email(
    string $to_email,
    array  $file,
    string $policy_ref,
    string $extra_message = ''
): bool {
    $cfg     = require __DIR__ . '/../config/config.php';
    $company = $cfg['company_name'] ?? 'Astute Insights / BlackFire Solutions';
    $co_email = $cfg['company_email'] ?? 'info@blackfiresolutions.co.za';

    $ref        = htmlspecialchars($file['ref_id']     ?? '');
    $contractor = htmlspecialchars($file['contractor'] ?? 'Contractor');
    $scope      = htmlspecialchars($file['scope_of_work'] ?? '');
    $audit_date = htmlspecialchars($file['audit_date'] ?? date('Y-m-d'));
    $pol_ref    = htmlspecialchars($policy_ref);

    $html  = "<html><body style='font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto'>";
    $html .= "<div style='background:#1a1a1a;padding:20px 24px;margin-bottom:24px'>";
    $html .= "<h2 style='color:#f97316;margin:0;font-size:20px'>{$company}</h2>";
    $html .= "<p style='color:#94a3b8;margin:6px 0 0;font-size:13px'>Health &amp; Safety — Policy Acknowledgment Request</p>";
    $html .= "</div>";
    $html .= "<p>Dear {$contractor},</p>";
    $html .= "<p>We are writing to request your formal acknowledgment that you have read and understood the health, safety and environment (H&amp;S) policies applicable to your scope of work at our site.</p>";
    $html .= "<div style='border:1px solid #e2e8f0;border-left:4px solid #f97316;padding:14px 16px;margin:16px 0;background:#fafafa'>";
    $html .= "<p style='margin:0 0 8px'><strong>Safety File Reference:</strong> {$ref}</p>";
    $html .= "<p style='margin:0 0 8px'><strong>Policy Document:</strong> {$pol_ref}</p>";
    $html .= "<p style='margin:0 0 8px'><strong>Scope of Work:</strong> {$scope}</p>";
    $html .= "<p style='margin:0'><strong>Audit Date:</strong> {$audit_date}</p>";
    $html .= "</div>";
    if ($extra_message) {
        $html .= "<p>" . nl2br(htmlspecialchars($extra_message)) . "</p>";
    }
    $html .= "<p>Please reply to this email with a written confirmation stating:</p>";
    $html .= "<blockquote style='border-left:3px solid #e2e8f0;padding-left:14px;color:#555;margin:16px 0'>";
    $html .= "<em>\"I, [Full Name], [Designation], confirm that I have read, understood and accept the health and safety policies referenced in {$pol_ref} as they apply to safety file {$ref}.\"</em>";
    $html .= "</blockquote>";
    $html .= "<p>This confirmation is required before work may commence. Please respond within <strong>5 working days</strong>.</p>";
    $html .= "<p>For queries, contact us at <a href='mailto:{$co_email}'>{$co_email}</a>.</p>";
    $html .= "<hr style='border:none;border-top:1px solid #e2e8f0;margin:24px 0'>";
    $html .= "<p style='font-size:11px;color:#94a3b8'>{$company} — automated notification for safety file {$ref}. Do not reply to this email directly; contact {$co_email}.</p>";
    $html .= "</body></html>";

    return send_mail($to_email, "Policy Acknowledgment Required — Safety File {$ref} | {$company}", $html, $co_email);
}

function send_statement_email(
    array  $statement,
    array  $invoices,
    string $to_email,
    string $from_email,
    string $from_name
): bool {
    $cfg     = require __DIR__ . '/../config/config.php';
    $company = $cfg['company_name'] ?? 'BlackFire Solutions';
    $total   = (float)($statement['total_outstanding'] ?? 0);

    $rows = '';
    foreach ($invoices as $inv) {
        $rows .= "<tr>";
        $rows .= "<td style='padding:8px;border-bottom:1px solid #eee'>" . htmlspecialchars($inv['ref_id']) . "</td>";
        $rows .= "<td style='padding:8px;border-bottom:1px solid #eee'>" . htmlspecialchars($inv['invoice_date']) . "</td>";
        $rows .= "<td style='padding:8px;border-bottom:1px solid #eee'>" . htmlspecialchars($inv['due_date']) . "</td>";
        $rows .= "<td style='padding:8px;border-bottom:1px solid #eee'>" . htmlspecialchars($inv['status']) . "</td>";
        $rows .= "<td style='padding:8px;border-bottom:1px solid #eee;text-align:right'>R " . number_format((float)$inv['amount'], 2) . "</td>";
        $rows .= "</tr>";
    }

    $html  = "<html><body style='font-family:Arial,sans-serif;color:#333'>";
    $html .= "<h2>{$company} — Statement of Account</h2>";
    $html .= "<p>Statement Date: " . date('d F Y') . "</p>";
    $html .= "<p>The following invoices are currently outstanding on your account:</p>";
    $html .= "<table style='width:100%;border-collapse:collapse;margin:16px 0'>";
    $html .= "<thead><tr style='background:#f0f0f0'>";
    $html .= "<th style='padding:10px;text-align:left'>Invoice #</th>";
    $html .= "<th style='padding:10px;text-align:left'>Date</th>";
    $html .= "<th style='padding:10px;text-align:left'>Due Date</th>";
    $html .= "<th style='padding:10px;text-align:left'>Status</th>";
    $html .= "<th style='padding:10px;text-align:right'>Amount</th>";
    $html .= "</tr></thead><tbody>{$rows}</tbody>";
    $html .= "<tfoot><tr><td colspan='4' style='padding:10px;font-weight:bold;text-align:right'>Total Outstanding</td>";
    $html .= "<td style='padding:10px;font-weight:bold;text-align:right'>R " . number_format($total, 2) . "</td></tr></tfoot>";
    $html .= "</table>";
    $html .= "<p>Please arrange payment at your earliest convenience. Contact us at <a href='mailto:{$from_email}'>{$from_email}</a> if you have any queries.</p>";
    $html .= "<hr><p style='font-size:11px;color:#888'>{$company} — Statement ref: " . htmlspecialchars($statement['ref_id']) . "</p>";
    $html .= "</body></html>";

    try {
        return smtp_send($to_email, "Account Statement — {$company} — " . date('d F Y'), $html, true, [
            'from_override' => $from_email,
            'from_name'     => $from_name,
            'reply_to'      => $from_email,
        ]);
    } catch (RuntimeException $e) {
        error_log('send_statement_email SMTP error: ' . $e->getMessage());
        return false;
    }
}
