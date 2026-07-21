<?php
ob_start();
require_once __DIR__ . '/document_templates.php';
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
    $attachments = mailer_normalize_attachments($options['attachments'] ?? []);

    $encReply = '=?UTF-8?B?' . base64_encode($replyTo) . '?=';

    $msg  = "Date: $date\r\n";
    $msg .= "From: $encName <$from>\r\n";
    $msg .= "Reply-To: <$replyTo>\r\n";
    $msg .= "To: <$to>\r\n";
    $msg .= "Subject: $encSubj\r\n";
    $msg .= "Message-ID: $msgId\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    if ($attachments) {
        $boundary = 'bf_mixed_' . bin2hex(random_bytes(12));
        $msg .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";
        $msg .= "\r\n";
        $msg .= "--{$boundary}\r\n";
        $msg .= "Content-Type: $ctype; charset=UTF-8\r\n";
        $msg .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
        $msg .= quoted_printable_encode($body) . "\r\n";
        foreach ($attachments as $att) {
            $filename = mailer_header_filename($att['filename']);
            $mime = $att['mime_type'];
            $msg .= "--{$boundary}\r\n";
            $msg .= "Content-Type: {$mime}; name=\"{$filename}\"\r\n";
            $msg .= "Content-Transfer-Encoding: base64\r\n";
            $msg .= "Content-Disposition: attachment; filename=\"{$filename}\"\r\n\r\n";
            $msg .= chunk_split(base64_encode($att['content']), 76, "\r\n");
        }
        $msg .= "--{$boundary}--\r\n.";
    } else {
        $msg .= "Content-Type: $ctype; charset=UTF-8\r\n";
        $msg .= "Content-Transfer-Encoding: quoted-printable\r\n";
        $msg .= "\r\n";
        $msg .= quoted_printable_encode($body) . "\r\n.";
    }

    $expect($cmd($msg), '250');
    $cmd('QUIT');
    fclose($sock);
    return true;
}

function mailer_header_filename(string $filename): string {
    $filename = basename(str_replace(["\r", "\n", '"'], '', $filename));
    return $filename !== '' ? $filename : 'document.pdf';
}

function mailer_normalize_attachments(array $attachments): array {
    $out = [];
    foreach ($attachments as $att) {
        $filename = mailer_header_filename((string)($att['filename'] ?? 'document.pdf'));
        $mime = (string)($att['mime_type'] ?? 'application/octet-stream');
        $content = null;
        if (array_key_exists('content', $att)) {
            $content = (string)$att['content'];
        } elseif (!empty($att['path']) && is_readable($att['path'])) {
            $content = file_get_contents($att['path']);
        }
        if ($content === null || $content === '') continue;
        $out[] = [
            'filename' => $filename,
            'mime_type' => $mime,
            'content' => $content,
        ];
    }
    return $out;
}

/**
 * Convenience wrapper — keeps backward compatibility with callers that pass cfg arrays.
 */
function send_mail(
    string $to,
    string $subject,
    string $html_body,
    ?string $reply_to = null,
    array $attachments = []
): bool {
    try {
        $opts = $reply_to ? ['reply_to' => $reply_to] : [];
        if ($attachments) $opts['attachments'] = $attachments;
        return smtp_send($to, $subject, $html_body, true, $opts);
    } catch (RuntimeException $e) {
        error_log('send_mail SMTP error: ' . $e->getMessage());
        return false;
    }
}

function pdf_escape_text(string $text): string {
    $text = str_replace(["\r\n", "\r"], "\n", $text);
    $text = preg_replace('/[^\P{C}\n\t]/u', '', $text);
    return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
}

function pdf_rgb(string $hex, string $fallback): array {
    $value = preg_match('/^#[0-9A-Fa-f]{6}$/', $hex) ? $hex : $fallback;
    return [hexdec(substr($value, 1, 2)) / 255, hexdec(substr($value, 3, 2)) / 255, hexdec(substr($value, 5, 2)) / 255];
}

function make_simple_pdf(string $title, array $lines, array $profile = []): string {
    $safeTitle = pdf_escape_text($title);
    $companyName = pdf_escape_text((string)($profile['display_name'] ?? ''));
    $footer = pdf_escape_text(trim((string)($profile['display_name'] ?? '') . ' | Reg: ' . (string)($profile['registration_number'] ?? '') . ' | VAT: ' . (string)($profile['vat_number'] ?? '')));
    [$pr, $pg, $pb] = pdf_rgb((string)($profile['primary_color'] ?? ''), '#0A1626');
    [$ar, $ag, $ab] = pdf_rgb((string)($profile['accent_color'] ?? ''), '#C2A04A');
    [$rr, $rg, $rb] = pdf_rgb((string)($profile['paper_color'] ?? ''), '#F4F0E6');
    $content = sprintf("q %.4F %.4F %.4F rg 0 780 595 62 re f Q\n", $pr, $pg, $pb);
    $content .= sprintf("q %.4F %.4F %.4F rg 0 772 595 8 re f Q\n", $ar, $ag, $ab);
    $content .= sprintf("q %.4F %.4F %.4F rg 0 0 595 44 re f Q\n", $rr, $rg, $rb);
    $content .= "BT\n1 1 1 rg\n/F2 15 Tf\n50 808 Td\n({$companyName}) Tj\n/F2 17 Tf\n210 0 Td\n({$safeTitle}) Tj\nET\n";
    $content .= "BT\n0 0 0 rg\n/F1 8.5 Tf\n50 750 Td\n";
    $lineCount = 0;
    foreach ($lines as $line) {
        $parts = explode("\n", wordwrap((string)$line, 110, "\n", true));
        foreach ($parts as $part) {
            if ($lineCount >= 60) break 2;
            $content .= '(' . pdf_escape_text($part) . ") Tj\n0 -11 Td\n";
            $lineCount++;
        }
        if ($lineCount < 60) {
            $content .= "0 -3 Td\n";
            $lineCount++;
        }
    }
    $content .= "ET\nBT\n0.27 0.31 0.37 rg\n/F1 7.5 Tf\n50 18 Td\n({$footer}) Tj\nET";

    $objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 6 0 R >> >> /Contents 5 0 R >>\nendobj\n",
        "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        "5 0 obj\n<< /Length " . strlen($content) . " >>\nstream\n{$content}\nendstream\nendobj\n",
        "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    ];

    $pdf = "%PDF-1.4\n";
    $offsets = [0];
    foreach ($objects as $object) {
        $offsets[] = strlen($pdf);
        $pdf .= $object;
    }
    $xref = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
    $pdf .= "0000000000 65535 f \n";
    for ($i = 1; $i <= count($objects); $i++) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
    }
    $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
    $pdf .= "startxref\n{$xref}\n%%EOF";
    return $pdf;
}

function pdf_text(float $x, float $y, float $size, string $text, string $font = 'F1', array $color = [0, 0, 0]): string {
    return sprintf(
        "BT /%s %.2F Tf %.4F %.4F %.4F rg 1 0 0 1 %.2F %.2F Tm (%s) Tj ET\n",
        $font, $size, $color[0], $color[1], $color[2], $x, $y, pdf_escape_text($text)
    );
}

function pdf_line(float $x1, float $y1, float $x2, float $y2, float $width, array $color): string {
    return sprintf("q %.4F %.4F %.4F RG %.2F w %.2F %.2F m %.2F %.2F l S Q\n", $color[0], $color[1], $color[2], $width, $x1, $y1, $x2, $y2);
}

function pdf_rect(float $x, float $y, float $width, float $height, array $fill, ?array $stroke = null, float $lineWidth = 1): string {
    $cmd = sprintf("q %.4F %.4F %.4F rg ", $fill[0], $fill[1], $fill[2]);
    if ($stroke) $cmd .= sprintf("%.4F %.4F %.4F RG %.2F w ", $stroke[0], $stroke[1], $stroke[2], $lineWidth);
    return $cmd . sprintf("%.2F %.2F %.2F %.2F re %s Q\n", $x, $y, $width, $height, $stroke ? 'B' : 'f');
}

function pdf_filled_circle(float $cx, float $cy, float $radius, array $fill): string {
    $k = 0.5522847498 * $radius;
    return sprintf(
        "q %.4F %.4F %.4F rg %.2F %.2F m %.2F %.2F %.2F %.2F %.2F %.2F c %.2F %.2F %.2F %.2F %.2F %.2F c %.2F %.2F %.2F %.2F %.2F %.2F c %.2F %.2F %.2F %.2F %.2F %.2F c h f Q\n",
        $fill[0], $fill[1], $fill[2],
        $cx + $radius, $cy,
        $cx + $radius, $cy + $k, $cx + $k, $cy + $radius, $cx, $cy + $radius,
        $cx - $k, $cy + $radius, $cx - $radius, $cy + $k, $cx - $radius, $cy,
        $cx - $radius, $cy - $k, $cx - $k, $cy - $radius, $cx, $cy - $radius,
        $cx + $k, $cy - $radius, $cx + $radius, $cy - $k, $cx + $radius, $cy
    );
}

function pdf_astute_wordmark(float $x, float $baselineY, array $accent): string {
    $ivory = pdf_rgb('#F4F0E6', '#F4F0E6');
    $divider = pdf_rgb('#244360', '#244360');
    $markLeft = $x;
    $markRight = $x + 30;
    $markBottom = $baselineY + 2;
    $markTop = $baselineY + 43;
    $content = pdf_line($x + 8.4, $markTop, $markLeft, $baselineY + 17, 1.8, $accent);
    $content .= pdf_line($x + 16.7, $markTop, $markRight, $markBottom, 1.8, $accent);
    $content .= pdf_filled_circle($x + 12.6, $baselineY + 23, 2.3, $accent);
    $content .= pdf_text($x + 35, $baselineY + 17, 25, 'stute', 'F1', $ivory);
    $content .= pdf_text($x + 36, $baselineY + 1, 6.3, 'I N S I G H T S', 'F3', $accent);
    $content .= pdf_line($x + 141, $baselineY, $x + 141, $baselineY + 45, 0.7, $divider);
    $content .= pdf_text($x + 154, $baselineY + 27, 6.2, 'D A T A', 'F3', $accent);
    $content .= pdf_text($x + 154, $baselineY + 13, 6.2, 'I N T E L L I G E N C E', 'F3', $accent);
    return $content;
}

function pdf_wrap(string $text, int $width): array {
    $clean = preg_replace('/\s+/', ' ', trim($text));
    if ($clean === '') return [''];
    return explode("\n", wordwrap($clean, $width, "\n", true));
}

function pdf_money(float $amount): string {
    return 'R ' . number_format($amount, 2);
}

function make_branded_document_pdf(array $document): string {
    $profile = $document['profile'];
    $client = $document['client'];
    $primary = pdf_rgb((string)($profile['primary_color'] ?? ''), '#0A1626');
    $accent = pdf_rgb((string)($profile['accent_color'] ?? ''), '#C2A04A');
    $paper = pdf_rgb((string)($profile['paper_color'] ?? ''), '#F4F0E6');
    $ink = pdf_rgb('#0A1626', '#0A1626');
    $graphite = pdf_rgb('#44505F', '#44505F');
    $white = [1, 1, 1];
    $content = '';

    $content .= pdf_rect(0, 720, 595, 122, $primary);
    $content .= pdf_rect(0, 712, 595, 8, $accent);
    $content .= pdf_rect(0, 0, 8, 842, $accent);

    if (($profile['profile_key'] ?? '') === 'blackfire_solutions') {
        $content .= sprintf("q %.4F %.4F %.4F rg 34 774 m 46 817 l 54 796 l 63 824 l 75 779 l 61 767 l 48 770 l h f Q\n", $accent[0], $accent[1], $accent[2]);
        $content .= pdf_text(88, 792, 23, 'BlackFire', 'F2', $accent);
        $content .= pdf_text(89, 774, 9, 'S O L U T I O N S', 'F1', $white);
    } else {
        $content .= pdf_astute_wordmark(36, 772, $accent);
    }

    $content .= pdf_text(353, 799, 9, strtoupper((string)$document['type_label']), 'F3', $accent);
    $content .= pdf_text(353, 774, 18, (string)$document['number'], 'F2', $white);
    if (($profile['profile_key'] ?? '') === 'blackfire_solutions') {
        $content .= pdf_text(34, 741, 7.5, (string)($profile['legal_name'] ?? ''), 'F1', $white);
    }
    $content .= pdf_text(315, 741, 7.5, 'REG ' . ($profile['registration_number'] ?? '') . '  |  VAT ' . ($profile['vat_number'] ?? ''), 'F1', $white);

    $meta = $document['meta'];
    $metaX = [34, 173, 312, 451];
    foreach (array_slice($meta, 0, 4) as $i => $item) {
        $content .= pdf_text($metaX[$i], 686, 6.5, strtoupper((string)$item[0]), 'F3', $graphite);
        $content .= pdf_text($metaX[$i], 669, 10, (string)$item[1], 'F2', $ink);
    }
    $content .= pdf_line(34, 656, 561, 656, 1.2, $accent);

    $content .= pdf_rect(34, 560, 253, 82, $paper, $accent, .6);
    $content .= pdf_rect(308, 560, 253, 82, $paper, $accent, .6);
    $content .= pdf_text(47, 627, 6.5, 'ISSUED BY', 'F3', $accent);
    $content .= pdf_text(321, 627, 6.5, strtoupper((string)$document['client_label']), 'F3', $accent);
    $content .= pdf_text(47, 611, 8.5, (string)($profile['legal_name'] ?? ''), 'F2', $ink);
    $issuerAddress = array_slice(pdf_wrap(str_replace("\n", ', ', (string)($profile['address'] ?? '')), 54), 0, 2);
    foreach ($issuerAddress as $i => $line) $content .= pdf_text(47, 597 - ($i * 10), 6.7, $line, 'F1', $graphite);
    $content .= pdf_text(47, 568, 6.7, (string)($profile['phone'] ?? '') . '  |  ' . (string)($profile['email'] ?? ''), 'F1', $graphite);

    $content .= pdf_text(321, 611, 8.5, (string)($client['legal_name'] ?? $client['display_name'] ?? ''), 'F2', $ink);
    $clientAddress = array_slice(pdf_wrap(str_replace("\n", ', ', (string)($document['client_address'] ?? '')), 54), 0, 2);
    foreach ($clientAddress as $i => $line) $content .= pdf_text(321, 597 - ($i * 10), 6.7, $line, 'F1', $graphite);
    $content .= pdf_text(321, 568, 6.7, 'VAT ' . (string)($client['vat_number'] ?? '') . '  |  ' . (string)($client['phone'] ?? ''), 'F1', $graphite);

    $tableTop = 534;
    $content .= pdf_rect(34, $tableTop - 22, 527, 22, $primary);
    $content .= pdf_text(47, $tableTop - 15, 7, 'DESCRIPTION', 'F3', $white);
    $content .= pdf_text(384, $tableTop - 15, 7, 'QTY', 'F3', $white);
    $content .= pdf_text(435, $tableTop - 15, 7, 'UNIT PRICE', 'F3', $white);
    $content .= pdf_text(520, $tableTop - 15, 7, 'TOTAL', 'F3', $white);

    $items = array_slice($document['items'] ?? [], 0, 7);
    if (!$items) $items = [['description' => 'See linked approved quotation', 'qty' => 1, 'unit_price' => (float)$document['subtotal']]];
    $rowY = $tableTop - 50;
    foreach ($items as $index => $item) {
        $fill = $index % 2 === 0 ? [1, 1, 1] : $paper;
        $content .= pdf_rect(34, $rowY - 7, 527, 30, $fill);
        $descLines = array_slice(pdf_wrap((string)($item['description'] ?? $item['desc'] ?? ''), 62), 0, 2);
        foreach ($descLines as $lineIndex => $line) $content .= pdf_text(47, $rowY + 9 - ($lineIndex * 10), 7.5, $line, 'F1', $ink);
        $qty = (float)($item['qty'] ?? 1);
        $unit = (float)($item['unit_price'] ?? $item['unit'] ?? 0);
        $content .= pdf_text(388, $rowY + 7, 7.5, rtrim(rtrim(number_format($qty, 2), '0'), '.'), 'F3', $ink);
        $content .= pdf_text(435, $rowY + 7, 7.5, pdf_money($unit), 'F3', $ink);
        $content .= pdf_text(508, $rowY + 7, 7.5, pdf_money($qty * $unit), 'F3', $ink);
        $content .= pdf_line(34, $rowY - 7, 561, $rowY - 7, .35, $accent);
        $rowY -= 31;
    }

    $summaryTop = min($rowY - 6, 284);
    $content .= pdf_rect(354, $summaryTop - 86, 207, 86, $paper, $accent, .7);
    $summaryRows = [
        ['SUBTOTAL', pdf_money((float)$document['subtotal'])],
        ['VAT (' . rtrim(rtrim(number_format((float)$document['vat_rate'], 2), '0'), '.') . '%)', pdf_money((float)$document['vat'])],
        ['TOTAL', pdf_money((float)$document['total'])],
    ];
    foreach ($summaryRows as $i => $row) {
        $y = $summaryTop - 22 - ($i * 24);
        $content .= pdf_text(368, $y, $i === 2 ? 9 : 7, $row[0], $i === 2 ? 'F2' : 'F3', $i === 2 ? $ink : $graphite);
        $content .= pdf_text(477, $y, $i === 2 ? 10 : 8, $row[1], $i === 2 ? 'F2' : 'F3', $ink);
        if ($i < 2) $content .= pdf_line(368, $y - 8, 548, $y - 8, .35, $accent);
    }

    $content .= pdf_rect(34, 74, 527, 92, $primary);
    $content .= pdf_rect(34, 158, 527, 8, $accent);
    $content .= pdf_text(48, 143, 6.5, 'BANKING DETAILS', 'F3', $accent);
    $content .= pdf_text(48, 124, 9, (string)($profile['bank_name'] ?? ''), 'F2', $white);
    $content .= pdf_text(48, 108, 7.5, (string)($profile['bank_account_type'] ?? '') . '  |  ACCOUNT ' . (string)($profile['bank_account_number'] ?? ''), 'F1', $white);
    $content .= pdf_text(48, 93, 7.5, 'BRANCH ' . (string)($profile['bank_branch_code'] ?? '') . '  |  SWIFT ' . (string)($profile['bank_swift_code'] ?? ''), 'F1', $white);
    $content .= pdf_text(343, 143, 6.5, 'PAYMENT / DOCUMENT REFERENCE', 'F3', $accent);
    $content .= pdf_text(343, 121, 11, (string)$document['number'], 'F2', $white);
    $content .= pdf_text(343, 98, 7, 'THANK YOU FOR YOUR BUSINESS', 'F3', $white);

    $content .= pdf_text(34, 48, 7, (string)($profile['display_name'] ?? '') . '  |  Reg ' . (string)($profile['registration_number'] ?? '') . '  |  VAT ' . (string)($profile['vat_number'] ?? ''), 'F1', $graphite);
    $content .= pdf_text(430, 48, 6.5, 'CLASSIFIED - CONFIDENTIAL', 'F3', pdf_rgb('#7E2E36', '#7E2E36'));
    $content .= pdf_line(34, 60, 561, 60, .8, $accent);

    $objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 5 0 R >>\nendobj\n",
        "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        "5 0 obj\n<< /Length " . strlen($content) . " >>\nstream\n{$content}\nendstream\nendobj\n",
        "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
        "7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n",
    ];
    $pdf = "%PDF-1.4\n";
    $offsets = [0];
    foreach ($objects as $object) { $offsets[] = strlen($pdf); $pdf .= $object; }
    $xref = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
    for ($i = 1; $i <= count($objects); $i++) $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
    $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    return $pdf;
}

function quote_pdf_attachment(array $quote): array {
    $ref = $quote['ref_id'] ?? $quote['quote_no'] ?? 'quote';
    $profile = document_company_profile((int)($quote['company_profile_id'] ?? 0));
    $settings = document_template_settings($profile, 'quote_document');
    $variables = document_variables($quote, $profile);
    $items = $quote['items'] ?? [];
    if (!$items && function_exists('db_select') && !empty($quote['id'])) {
        $items = db_select("SELECT description, qty, unit_price FROM bf_quote_items WHERE quote_id = ? ORDER BY id", [(int)$quote['id']]);
    }

    $lines = [
        ($profile['display_name'] ?? '') . ' | ' . ($profile['legal_name'] ?? ''),
        'Registration: ' . ($profile['registration_number'] ?? '') . ' | VAT: ' . ($profile['vat_number'] ?? ''),
        'Contact: ' . ($profile['phone'] ?? '') . ' | ' . ($profile['email'] ?? ''),
        'Address: ' . str_replace("\n", ', ', (string)($profile['address'] ?? '')),
        '',
        'Quote To: ' . $variables['client_name'],
        'Client Legal Name: ' . $variables['client_legal_name'],
        'Client VAT: ' . $variables['client_vat'],
        'Client Address: ' . str_replace("\n", ', ', $variables['client_quote_address']),
        'Client Phone: ' . $variables['client_phone'],
        'Quote Reference: ' . $ref,
        'Quote Number: ' . ($quote['quote_no'] ?? $ref),
        'Quote Date: ' . ($quote['quote_date'] ?? ''),
        'Valid Until: ' . ($quote['valid_until'] ?? ''),
        'Call Log: ' . ($quote['callout_ref'] ?? ''),
        '',
        'Line Items:',
    ];
    foreach ($items as $item) {
        $qty = (float)($item['qty'] ?? 1);
        $unit = (float)($item['unit_price'] ?? $item['unit'] ?? 0);
        $lines[] = '- ' . ($item['description'] ?? $item['desc'] ?? '') . ' | Qty ' . $qty . ' | Unit R ' . number_format($unit, 2) . ' | Total R ' . number_format($qty * $unit, 2);
    }
    $lines[] = '';
    $lines[] = ($settings['subtotal_label'] ?? 'Subtotal') . ': ' . $variables['subtotal'];
    $lines[] = ($settings['vat_label'] ?? 'VAT') . ' (' . $variables['vat_rate'] . '%): ' . $variables['vat'];
    $lines[] = ($settings['total_label'] ?? 'Total') . ': ' . $variables['total'];
    if (!empty($quote['notes'])) $lines[] = 'Notes: ' . $quote['notes'];
    if (!empty($profile['bank_name'])) {
        $lines[] = '';
        $lines[] = 'Bank: ' . $profile['bank_name'] . ' | ' . ($profile['bank_account_type'] ?? '');
        $lines[] = 'Account: ' . ($profile['bank_account_number'] ?? '') . ' | Branch: ' . ($profile['bank_branch_code'] ?? '') . ' | SWIFT: ' . ($profile['bank_swift_code'] ?? '');
    }
    $documentTemplate = document_template_row((int)$profile['id'], 'quote_document');
    if ($documentTemplate && !empty($documentTemplate['body_template'])) {
        $lines[] = document_render_template((string)$documentTemplate['body_template'], $variables);
    }
    if (!empty($settings['classification'])) $lines[] = (string)$settings['classification'];

    $clientProfile = document_client_profile($quote);
    $totalValue = (float)($quote['total_amount'] ?? 0);
    $vatRate = (float)($profile['vat_rate'] ?? 15);
    $subtotalValue = $vatRate > 0 ? $totalValue / (1 + ($vatRate / 100)) : $totalValue;
    $brandedPdf = make_branded_document_pdf([
        'type_label' => $settings['title'] ?? 'Quote',
        'number' => $quote['quote_no'] ?? $ref,
        'profile' => $profile,
        'client' => $clientProfile,
        'client_label' => 'Quote To',
        'client_address' => $clientProfile['quote_address'] ?? '',
        'meta' => [
            [$settings['number_label'] ?? 'Quote No.', $quote['quote_no'] ?? $ref],
            [$settings['date_label'] ?? 'Date', $quote['quote_date'] ?? ''],
            [$settings['expiry_label'] ?? 'Valid Until', $quote['valid_until'] ?? ''],
            ['Call Log', $quote['callout_ref'] ?? ''],
        ],
        'items' => $items,
        'subtotal' => $subtotalValue,
        'vat' => $totalValue - $subtotalValue,
        'total' => $totalValue,
        'vat_rate' => $vatRate,
    ]);

    return [
        'filename' => 'Quote_' . preg_replace('/[^A-Za-z0-9_-]/', '_', (string)$ref) . '.pdf',
        'mime_type' => 'application/pdf',
        'content' => $brandedPdf,
    ];
}

function invoice_pdf_attachment(array $invoice): array {
    $ref = $invoice['ref_id'] ?? $invoice['invoice_no'] ?? 'invoice';
    $profile = document_company_profile((int)($invoice['company_profile_id'] ?? 0));
    $settings = document_template_settings($profile, 'invoice_document');
    $variables = document_variables($invoice, $profile);
    $lines = [
        ($profile['display_name'] ?? '') . ' | ' . ($profile['legal_name'] ?? ''),
        'Registration: ' . ($profile['registration_number'] ?? '') . ' | VAT: ' . ($profile['vat_number'] ?? ''),
        'Contact: ' . ($profile['phone'] ?? '') . ' | ' . ($profile['email'] ?? ''),
        'Address: ' . str_replace("\n", ', ', (string)($profile['address'] ?? '')),
        '',
        'Bill To: ' . $variables['client_legal_name'],
        'Customer / Site: ' . $variables['client_name'],
        'Client VAT: ' . $variables['client_vat'],
        'Billing Address: ' . str_replace("\n", ', ', $variables['client_invoice_address']),
        'Client Phone: ' . $variables['client_phone'],
        'Invoice Reference: ' . $ref,
        'Invoice Number: ' . ($invoice['invoice_no'] ?? $ref),
        'Invoice Date: ' . ($invoice['invoice_date'] ?? ''),
        'Due Date: ' . ($invoice['due_date'] ?? ''),
        'Quote Reference: ' . ($invoice['quote_ref'] ?? ''),
        'Call Log: ' . ($invoice['callout_ref'] ?? ''),
        'Purchase Order: ' . ($invoice['po'] ?? ''),
        '',
    ];

    $items = [];
    if (function_exists('db_select') && !empty($invoice['quote_id'])) {
        $items = db_select('SELECT description, qty, unit_price FROM bf_quote_items WHERE quote_id=? ORDER BY id', [(int)$invoice['quote_id']]);
        if ($items) {
            $lines[] = 'Line Items:';
            foreach ($items as $item) {
                $qty = (float)($item['qty'] ?? 1);
                $unit = (float)($item['unit_price'] ?? 0);
                $lines[] = '- ' . ($item['description'] ?? '') . ' | Qty ' . $qty . ' | Unit R ' . number_format($unit, 2) . ' | Total R ' . number_format($qty * $unit, 2);
            }
            $lines[] = '';
        }
    }
    $lines[] = ($settings['subtotal_label'] ?? 'Subtotal') . ': ' . $variables['subtotal'];
    $lines[] = ($settings['vat_label'] ?? 'VAT') . ' (' . $variables['vat_rate'] . '%): ' . $variables['vat'];
    $lines[] = ($settings['total_label'] ?? 'Total') . ': ' . $variables['total'];
    if (!empty($profile['bank_name'])) {
        $lines[] = '';
        $lines[] = 'Bank: ' . $profile['bank_name'] . ' | ' . ($profile['bank_account_type'] ?? '');
        $lines[] = 'Account: ' . ($profile['bank_account_number'] ?? '') . ' | Branch: ' . ($profile['bank_branch_code'] ?? '') . ' | SWIFT: ' . ($profile['bank_swift_code'] ?? '');
    }
    $documentTemplate = document_template_row((int)$profile['id'], 'invoice_document');
    if ($documentTemplate && !empty($documentTemplate['body_template'])) {
        $lines[] = document_render_template((string)$documentTemplate['body_template'], $variables);
    }
    if (!empty($settings['classification'])) $lines[] = (string)$settings['classification'];

    $clientProfile = document_client_profile($invoice);
    $totalValue = (float)($invoice['amount'] ?? 0);
    $vatRate = (float)($profile['vat_rate'] ?? 15);
    $subtotalValue = $vatRate > 0 ? $totalValue / (1 + ($vatRate / 100)) : $totalValue;
    $brandedPdf = make_branded_document_pdf([
        'type_label' => $settings['title'] ?? 'Tax Invoice',
        'number' => $invoice['invoice_no'] ?? $ref,
        'profile' => $profile,
        'client' => $clientProfile,
        'client_label' => 'Bill To',
        'client_address' => $clientProfile['invoice_address'] ?? '',
        'meta' => [
            [$settings['number_label'] ?? 'Tax Invoice No.', $invoice['invoice_no'] ?? $ref],
            [$settings['date_label'] ?? 'Date', $invoice['invoice_date'] ?? ''],
            [$settings['order_label'] ?? 'Order Number', $invoice['po'] ?? ''],
            [$settings['due_label'] ?? 'Invoice Due', $invoice['due_date'] ?? ''],
        ],
        'items' => $items,
        'subtotal' => $subtotalValue,
        'vat' => $totalValue - $subtotalValue,
        'total' => $totalValue,
        'vat_rate' => $vatRate,
    ]);

    return [
        'filename' => 'Invoice_' . preg_replace('/[^A-Za-z0-9_-]/', '_', (string)$ref) . '.pdf',
        'mime_type' => 'application/pdf',
        'content' => $brandedPdf,
    ];
}

function statement_pdf_attachment(array $statement, array $invoices): array {
    $ref = (string)($statement['ref_id'] ?? 'statement');
    $profile = document_company_profile((int)($statement['company_profile_id'] ?? 0));
    $settings = document_template_settings($profile, 'statement_document');
    $primary = pdf_rgb((string)($profile['primary_color'] ?? ''), '#0A1626');
    $accent = pdf_rgb((string)($profile['accent_color'] ?? ''), '#C2A04A');
    $paper = pdf_rgb((string)($profile['paper_color'] ?? ''), '#F4F0E6');
    $ink = pdf_rgb('#0A1626', '#0A1626');
    $graphite = pdf_rgb('#44505F', '#44505F');
    $white = [1, 1, 1];
    $content = '';

    $content .= pdf_rect(0, 720, 595, 122, $primary);
    $content .= pdf_rect(0, 712, 595, 8, $accent);
    $content .= pdf_rect(0, 0, 8, 842, $accent);
    if (($profile['profile_key'] ?? '') === 'blackfire_solutions') {
        $content .= sprintf("q %.4F %.4F %.4F rg 34 774 m 46 817 l 54 796 l 63 824 l 75 779 l 61 767 l 48 770 l h f Q\n", $accent[0], $accent[1], $accent[2]);
        $content .= pdf_text(88, 792, 23, 'BlackFire', 'F2', $accent);
        $content .= pdf_text(89, 774, 9, 'S O L U T I O N S', 'F1', $white);
    } else {
        $content .= pdf_astute_wordmark(36, 772, $accent);
    }
    $content .= pdf_text(353, 799, 8.5, strtoupper((string)($settings['title'] ?? 'Account Statement')), 'F3', $accent);
    $content .= pdf_text(353, 774, 17, $ref, 'F2', $white);
    if (($profile['profile_key'] ?? '') === 'blackfire_solutions') {
        $content .= pdf_text(34, 741, 7.5, (string)($profile['legal_name'] ?? ''), 'F1', $white);
    }
    $content .= pdf_text(315, 741, 7.5, 'REG ' . ($profile['registration_number'] ?? '') . '  |  VAT ' . ($profile['vat_number'] ?? ''), 'F1', $white);

    $meta = [
        [$settings['date_label'] ?? 'Statement Date', $statement['scheduled_for'] ?? ''],
        ['Invoices', (string)count($invoices)],
        ['Status', str_replace('_', ' ', strtoupper((string)($statement['status'] ?? 'pending')))],
        [$settings['total_label'] ?? 'Balance Due', document_money((float)($statement['total_outstanding'] ?? 0), $profile)],
    ];
    foreach ($meta as $i => $item) {
        $x = [34, 173, 312, 451][$i];
        $content .= pdf_text($x, 686, 6.5, strtoupper((string)$item[0]), 'F3', $graphite);
        $content .= pdf_text($x, 669, 9.3, (string)$item[1], 'F2', $ink);
    }
    $content .= pdf_line(34, 656, 561, 656, 1.2, $accent);

    $content .= pdf_rect(34, 564, 253, 78, $paper, $accent, .6);
    $content .= pdf_rect(308, 564, 253, 78, $paper, $accent, .6);
    $content .= pdf_text(47, 627, 6.5, 'ISSUED BY', 'F3', $accent);
    $content .= pdf_text(47, 610, 8.5, (string)($profile['legal_name'] ?? ''), 'F2', $ink);
    foreach (array_slice(pdf_wrap(str_replace("\n", ', ', (string)($profile['address'] ?? '')), 52), 0, 2) as $i => $line) {
        $content .= pdf_text(47, 595 - ($i * 10), 6.7, $line, 'F1', $graphite);
    }
    $content .= pdf_text(321, 627, 6.5, 'ACCOUNT SUMMARY', 'F3', $accent);
    $content .= pdf_text(321, 608, 8.5, count($invoices) . ' outstanding invoice' . (count($invoices) === 1 ? '' : 's'), 'F2', $ink);
    $content .= pdf_text(321, 591, 6.8, 'Statement ref ' . $ref, 'F1', $graphite);
    $content .= pdf_text(321, 577, 6.8, (string)($profile['phone'] ?? '') . '  |  ' . (string)($profile['email'] ?? ''), 'F1', $graphite);

    $tableTop = 538;
    $content .= pdf_rect(34, $tableTop - 22, 527, 22, $primary);
    foreach ([[47,'INVOICE #'],[158,'CLIENT'],[298,'INVOICE DATE'],[371,'DUE DATE'],[433,'STATUS'],[510,'AMOUNT']] as $heading) {
        $content .= pdf_text($heading[0], $tableTop - 15, 6.3, $heading[1], 'F3', $white);
    }
    $rowY = $tableTop - 49;
    foreach (array_slice($invoices, 0, 8) as $index => $invoice) {
        $content .= pdf_rect(34, $rowY - 7, 527, 28, $index % 2 === 0 ? [1, 1, 1] : $paper);
        $content .= pdf_text(47, $rowY + 4, 6.8, (string)($invoice['ref_id'] ?? ''), 'F3', $ink);
        $clientLines = array_slice(pdf_wrap((string)($invoice['client_name'] ?? ''), 23), 0, 1);
        $content .= pdf_text(158, $rowY + 4, 6.8, $clientLines[0] ?? '', 'F1', $ink);
        $content .= pdf_text(298, $rowY + 4, 6.8, (string)($invoice['invoice_date'] ?? ''), 'F1', $ink);
        $content .= pdf_text(371, $rowY + 4, 6.8, (string)($invoice['due_date'] ?? ''), 'F1', $ink);
        $content .= pdf_text(433, $rowY + 4, 6.8, strtoupper((string)($invoice['status'] ?? '')), 'F1', $ink);
        $content .= pdf_text(500, $rowY + 4, 6.8, pdf_money((float)($invoice['amount'] ?? 0)), 'F3', $ink);
        $content .= pdf_line(34, $rowY - 7, 561, $rowY - 7, .35, $accent);
        $rowY -= 29;
    }
    if (!$invoices) $content .= pdf_text(47, $rowY + 3, 8, 'No outstanding invoices on this statement.', 'F1', $graphite);

    $summaryTop = max(191, min($rowY - 5, 288));
    $content .= pdf_rect(34, $summaryTop - 70, 300, 70, $paper, $accent, .7);
    $content .= pdf_text(48, $summaryTop - 20, 6.5, 'PAYMENT NOTE', 'F3', $accent);
    $content .= pdf_text(48, $summaryTop - 39, 7.2, 'Use the relevant invoice number as your payment reference.', 'F1', $ink);
    $content .= pdf_text(48, $summaryTop - 54, 6.8, 'Please send payment queries to ' . (string)($profile['email'] ?? ''), 'F1', $graphite);
    $content .= pdf_rect(354, $summaryTop - 70, 207, 70, $paper, $accent, .8);
    $content .= pdf_text(368, $summaryTop - 23, 6.8, strtoupper((string)($settings['total_label'] ?? 'Total Outstanding')), 'F3', $graphite);
    $content .= pdf_text(418, $summaryTop - 51, 13, document_money((float)($statement['total_outstanding'] ?? 0), $profile), 'F2', $ink);

    $content .= pdf_rect(34, 74, 527, 92, $primary);
    $content .= pdf_rect(34, 158, 527, 8, $accent);
    $content .= pdf_text(48, 143, 6.5, 'BANKING DETAILS', 'F3', $accent);
    $content .= pdf_text(48, 124, 9, (string)($profile['bank_name'] ?? ''), 'F2', $white);
    $content .= pdf_text(48, 108, 7.5, (string)($profile['bank_account_type'] ?? '') . '  |  ACCOUNT ' . (string)($profile['bank_account_number'] ?? ''), 'F1', $white);
    $content .= pdf_text(48, 93, 7.5, 'BRANCH ' . (string)($profile['bank_branch_code'] ?? '') . '  |  SWIFT ' . (string)($profile['bank_swift_code'] ?? ''), 'F1', $white);
    $content .= pdf_text(343, 143, 6.5, 'STATEMENT REFERENCE', 'F3', $accent);
    $content .= pdf_text(343, 121, 11, $ref, 'F2', $white);
    $content .= pdf_text(343, 98, 7, 'THANK YOU FOR YOUR BUSINESS', 'F3', $white);
    $content .= pdf_text(34, 48, 7, (string)($profile['display_name'] ?? '') . '  |  Reg ' . (string)($profile['registration_number'] ?? '') . '  |  VAT ' . (string)($profile['vat_number'] ?? ''), 'F1', $graphite);
    $content .= pdf_text(430, 48, 6.5, (string)($settings['classification'] ?? 'CLASSIFIED - CONFIDENTIAL'), 'F3', pdf_rgb('#7E2E36', '#7E2E36'));
    $content .= pdf_line(34, 60, 561, 60, .8, $accent);

    $objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 5 0 R >>\nendobj\n",
        "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        "5 0 obj\n<< /Length " . strlen($content) . " >>\nstream\n{$content}\nendstream\nendobj\n",
        "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
        "7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n",
    ];
    $pdf = "%PDF-1.4\n";
    $offsets = [0];
    foreach ($objects as $object) { $offsets[] = strlen($pdf); $pdf .= $object; }
    $xref = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
    for ($i = 1; $i <= count($objects); $i++) $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
    $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";

    return [
        'filename' => 'Statement_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $ref) . '.pdf',
        'mime_type' => 'application/pdf',
        'content' => $pdf,
    ];
}

function statement_pdf_attachment_legacy(array $statement, array $invoices): array {
    $ref = (string)($statement['ref_id'] ?? 'statement');
    $profile = document_company_profile((int)($statement['company_profile_id'] ?? 0));
    $settings = document_template_settings($profile, 'statement_document');
    $variables = document_variables($statement, $profile);
    $lines = [
        ($profile['display_name'] ?? '') . ' | ' . ($profile['legal_name'] ?? ''),
        'Registration: ' . ($profile['registration_number'] ?? '') . ' | VAT: ' . ($profile['vat_number'] ?? ''),
        'Contact: ' . ($profile['phone'] ?? '') . ' | ' . ($profile['email'] ?? ''),
        'Address: ' . str_replace("\n", ', ', (string)($profile['address'] ?? '')),
        '',
        'Statement Reference: ' . $ref,
        ($settings['date_label'] ?? 'Statement Date') . ': ' . ($statement['scheduled_for'] ?? ''),
        'Status: ' . str_replace('_', ' ', strtoupper((string)($statement['status'] ?? 'pending'))),
        '',
        'Outstanding Invoices:',
    ];
    foreach ($invoices as $invoice) {
        $lines[] = implode(' | ', [
            (string)($invoice['ref_id'] ?? ''),
            (string)($invoice['client_name'] ?? ''),
            'Invoice ' . (string)($invoice['invoice_date'] ?? ''),
            'Due ' . (string)($invoice['due_date'] ?? ''),
            (string)($invoice['status'] ?? ''),
            document_money((float)($invoice['amount'] ?? 0), $profile),
        ]);
    }
    if (!$invoices) $lines[] = 'No outstanding invoices on this statement.';
    $lines[] = '';
    $lines[] = strtoupper((string)($settings['total_label'] ?? 'Total Outstanding')) . ': ' . $variables['total'];
    if (!empty($profile['bank_name'])) {
        $lines[] = '';
        $lines[] = 'BANKING DETAILS';
        $lines[] = ($profile['bank_name'] ?? '') . ' | ' . ($profile['bank_account_type'] ?? '');
        $lines[] = 'Account: ' . ($profile['bank_account_number'] ?? '') . ' | Branch: ' . ($profile['bank_branch_code'] ?? '') . ' | SWIFT: ' . ($profile['bank_swift_code'] ?? '');
    }
    $documentTemplate = document_template_row((int)$profile['id'], 'statement_document');
    if ($documentTemplate && !empty($documentTemplate['body_template'])) {
        $lines[] = '';
        $lines[] = document_render_template((string)$documentTemplate['body_template'], $variables);
    }
    if (!empty($settings['classification'])) $lines[] = (string)$settings['classification'];

    return [
        'filename' => 'Statement_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $ref) . '.pdf',
        'mime_type' => 'application/pdf',
        'content' => make_simple_pdf((string)($settings['title'] ?? 'Account Statement') . ' - ' . $ref, $lines, $profile),
    ];
}

function send_templated_document_email(string $toEmail, array $content, array $attachments): bool {
    $profile = $content['profile'];
    try {
        return smtp_send($toEmail, $content['subject'], $content['html'], true, [
            'from_name' => (string)($profile['display_name'] ?? ''),
            'reply_to' => (string)($profile['email'] ?? ''),
            'attachments' => $attachments,
        ]);
    } catch (RuntimeException $error) {
        error_log('send_templated_document_email SMTP error: ' . $error->getMessage());
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
    $content = document_email_content($invoice, 'invoice_email');
    return send_templated_document_email($to_email, $content, [invoice_pdf_attachment($invoice)]);
}

/**
 * Send a specific quote to a client by email with a PDF attachment.
 */
function send_quote_email(array $quote, string $to_email): bool {
    $content = document_email_content($quote, 'quote_email');
    return send_templated_document_email($to_email, $content, [quote_pdf_attachment($quote)]);
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
    array $statement,
    array $invoices,
    string $to_email,
    string $from_email,
    string $from_name
): bool {
    $content = document_email_content($statement, 'statement_email');
    $profile = $content['profile'];
    try {
        return smtp_send($to_email, $content['subject'], $content['html'], true, [
            'from_override' => $from_email,
            'from_name' => (string)($profile['display_name'] ?? $from_name),
            'reply_to' => $from_email,
            'attachments' => [statement_pdf_attachment($statement, $invoices)],
        ]);
    } catch (RuntimeException $error) {
        error_log('send_statement_email SMTP error: ' . $error->getMessage());
        return false;
    }
}

function send_statement_email_legacy(
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
