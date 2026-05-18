<?php
/**
 * Umlilo Portal — Email Mailer
 * Uses PHP mail() with SMTP configured via config/config.php
 */

function send_mail(
    string $to,
    string $subject,
    string $html_body,
    ?string $reply_to = null
): bool {
    $cfg = require __DIR__ . '/../config/config.php';

    $from_name = $cfg['mail_from_name'] ?? 'Umlilo Portal';
    $from = $cfg['mail_from'] ?? 'noreply@portal.local';

    // Build headers
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: {$from_name} <{$from}>\r\n";
    if ($reply_to) {
        $headers .= "Reply-To: {$reply_to}\r\n";
    }
    $headers .= "X-Mailer: Umlilo Portal\r\n";

    // For production, use SMTP credentials if configured
    // Note: PHP's native mail() uses system sendmail.
    // For production SMTP, consider SwiftMailer or PHP-Mailer.
    // For now, this works with server-side SMTP relay.

    $result = mail($to, $subject, $html_body, $headers);

    if (!$result) {
        error_log("Email send failed: to={$to}, subject={$subject}");
    }

    return $result;
}

function send_approval_request(
    string $to_email,
    string $record_type,  // 'callout' or 'quote'
    string $ref_id,
    string $token,
    array $record        // the full record (callout/quote details)
): bool {
    $cfg = require __DIR__ . '/../config/config.php';
    $base_url = $cfg['base_url'] ?? 'https://blackfiresolutions.co.za/portal';

    // Build approval link
    $approval_url = "{$base_url}/approve.php?token={$token}&type={$record_type}";

    // Build HTML email
    $html = "<html><body style='font-family: Arial, sans-serif; color: #333;'>";
    $html .= "<h2>Approval Request</h2>";
    $html .= "<p>Dear Client,</p>";
    $html .= "<p>We have recorded a {$record_type} and are requesting your approval:</p>";

    if ($record_type === 'callout') {
        $html .= "<div style='border: 1px solid #ddd; padding: 12px; margin: 15px 0; background: #f9f9f9;'>";
        $html .= "<p><strong>Callout Reference:</strong> {$ref_id}</p>";
        $html .= "<p><strong>Service:</strong> " . htmlspecialchars($record['service'] ?? '') . "</p>";
        $html .= "<p><strong>Location:</strong> " . htmlspecialchars($record['location'] ?? '') . "</p>";
        $html .= "<p><strong>Date:</strong> " . htmlspecialchars($record['callout_date'] ?? '') . "</p>";
        if (!empty($record['notes'])) {
            $html .= "<p><strong>Notes:</strong> " . htmlspecialchars($record['notes']) . "</p>";
        }
        $html .= "</div>";
    } elseif ($record_type === 'quote') {
        $html .= "<div style='border: 1px solid #ddd; padding: 12px; margin: 15px 0; background: #f9f9f9;'>";
        $html .= "<p><strong>Quote Reference:</strong> {$ref_id}</p>";
        $html .= "<p><strong>Total Amount:</strong> R " . number_format($record['total_amount'] ?? 0, 2) . "</p>";
        $html .= "<p><strong>Valid Until:</strong> " . htmlspecialchars($record['valid_until'] ?? '') . "</p>";
        if (!empty($record['notes'])) {
            $html .= "<p><strong>Notes:</strong> " . htmlspecialchars($record['notes']) . "</p>";
        }
        $html .= "</div>";
    }

    $html .= "<p><a href='{$approval_url}' style='display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0;'>Review & Approve</a></p>";
    $html .= "<p>Or click this link: <a href='{$approval_url}'>{$approval_url}</a></p>";
    $html .= "<hr>";
    $html .= "<p style='font-size: 12px; color: #666;'>";
    $html .= "This link expires in 7 days. If you have any questions, please contact us at " . htmlspecialchars($cfg['company_email'] ?? 'info@example.com') . ".<br>";
    $html .= "</p>";
    $html .= "</body></html>";

    return send_mail(
        $to_email,
        "Approval Request: {$record_type} {$ref_id}",
        $html,
        $cfg['company_email'] ?? 'noreply@portal.local'
    );
}
?>
