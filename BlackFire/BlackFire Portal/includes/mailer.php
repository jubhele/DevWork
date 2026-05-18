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
function smtp_send(string $to, string $subject, string $body, bool $html = false): bool {
    $cfg = require __DIR__ . '/../config/config.php';

    $host     = $cfg['mail_host']     ?? 'localhost';
    $port     = (int)($cfg['mail_port'] ?? 587);
    $username = $cfg['mail_username'] ?? '';
    $password = getenv('BF_MAIL_PASS') ?: ($cfg['mail_password'] ?? '');
    $from     = $cfg['mail_from']     ?? $username;
    $fromName = $cfg['mail_from_name'] ?? 'BlackFire Solutions';

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

    $msg  = "Date: $date\r\n";
    $msg .= "From: $encName <$from>\r\n";
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
        return smtp_send($to, $subject, $html_body, true);
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
    $base_url    = $cfg['base_url'] ?? 'https://blackfiresolutions.co.za/portal';
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
