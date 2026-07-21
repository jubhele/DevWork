<?php

function document_profile_fallback(): array {
    $cfg = require __DIR__ . '/../config/config.php';
    return [
        'id' => 1,
        'profile_key' => 'astute_insights',
        'display_name' => $cfg['company_name'] ?? 'Astute Insights',
        'legal_name' => $cfg['company_legal_name'] ?? 'Astute Insights (Pty) Ltd',
        'registration_number' => $cfg['company_reg'] ?? '',
        'vat_number' => $cfg['company_vat'] ?? '',
        'phone' => $cfg['company_phone'] ?? '',
        'email' => $cfg['company_email'] ?? '',
        'address' => $cfg['company_addr'] ?? '',
        'logo_path' => $cfg['company_logo'] ?? '',
        'primary_color' => '#0A1626',
        'accent_color' => '#C2A04A',
        'paper_color' => '#F4F0E6',
        'body_font' => 'Arial, sans-serif',
        'bank_name' => '',
        'bank_account_type' => '',
        'bank_account_number' => '',
        'bank_branch_code' => '',
        'bank_swift_code' => '',
        'currency_code' => 'ZAR',
        'vat_rate' => 15,
        'quote_valid_days' => 30,
        'invoice_due_days' => 14,
    ];
}

function document_company_profile(?int $profileId = null): array {
    try {
        if ($profileId) {
            $profile = db_row('SELECT * FROM bf_company_profiles WHERE id=? AND host_company_id=1 AND is_active=1', [$profileId]);
        } else {
            $profile = db_row('SELECT * FROM bf_company_profiles WHERE host_company_id=1 AND is_active=1 ORDER BY is_default DESC, id LIMIT 1');
        }
        return $profile ?: document_profile_fallback();
    } catch (Throwable $error) {
        return document_profile_fallback();
    }
}

function document_template_row(int $profileId, string $templateKey): ?array {
    try {
        return db_row(
            'SELECT * FROM bf_document_templates WHERE company_profile_id=? AND template_key=? AND host_company_id=1 AND is_active=1 LIMIT 1',
            [$profileId, $templateKey]
        );
    } catch (Throwable $error) {
        return null;
    }
}

function document_client_profile(array $record): array {
    $clientId = (int)($record['client_id'] ?? 0);
    if ($clientId) {
        try {
            $profile = db_row(
                'SELECT * FROM bf_client_document_profiles WHERE client_id=? AND host_company_id=1 AND is_active=1 ORDER BY is_default DESC, id LIMIT 1',
                [$clientId]
            );
            if ($profile) return $profile;
            $client = db_row('SELECT * FROM bf_clients WHERE id=? AND is_active=1', [$clientId]);
            if ($client) {
                return [
                    'client_id' => $clientId,
                    'display_name' => (string)($client['name'] ?? ''),
                    'legal_name' => (string)($client['name'] ?? ''),
                    'vat_number' => (string)($client['vat_number'] ?? ''),
                    'phone' => (string)($client['phone'] ?? ''),
                    'email' => (string)($client['email'] ?? ''),
                    'quote_address' => (string)($client['address'] ?? ''),
                    'invoice_address' => (string)($client['address'] ?? ''),
                ];
            }
        } catch (Throwable $error) {
        }
    }
    $name = (string)($record['client_name'] ?? 'Client');
    return [
        'client_id' => $clientId,
        'display_name' => $name,
        'legal_name' => $name,
        'vat_number' => '',
        'phone' => '',
        'email' => (string)($record['client_email'] ?? ''),
        'quote_address' => '',
        'invoice_address' => '',
    ];
}

function document_money(float $amount, array $profile): string {
    $currency = ($profile['currency_code'] ?? 'ZAR') === 'ZAR' ? 'R' : (string)$profile['currency_code'];
    return $currency . ' ' . number_format($amount, 2);
}

function document_variables(array $record, array $profile): array {
    $total = (float)($record['total_amount'] ?? $record['amount'] ?? $record['total_outstanding'] ?? 0);
    $vatRate = (float)($profile['vat_rate'] ?? 15);
    $subtotal = $vatRate > 0 ? $total / (1 + ($vatRate / 100)) : $total;
    $vat = $total - $subtotal;
    $documentNo = (string)($record['quote_no'] ?? $record['invoice_no'] ?? $record['ref_id'] ?? '');
    $client = document_client_profile($record);

    return [
        'company_name' => (string)($profile['display_name'] ?? ''),
        'company_legal_name' => (string)($profile['legal_name'] ?? ''),
        'company_email' => (string)($profile['email'] ?? ''),
        'company_phone' => (string)($profile['phone'] ?? ''),
        'company_address' => (string)($profile['address'] ?? ''),
        'company_registration' => (string)($profile['registration_number'] ?? ''),
        'company_vat' => (string)($profile['vat_number'] ?? ''),
        'client_name' => (string)($client['display_name'] ?? $record['client_name'] ?? 'Client'),
        'client_legal_name' => (string)($client['legal_name'] ?? ''),
        'client_vat' => (string)($client['vat_number'] ?? ''),
        'client_phone' => (string)($client['phone'] ?? ''),
        'client_email' => (string)($client['email'] ?? ''),
        'client_quote_address' => (string)($client['quote_address'] ?? ''),
        'client_invoice_address' => (string)($client['invoice_address'] ?? ''),
        'supplier_reference' => (string)($client['supplier_reference'] ?? ''),
        'document_no' => $documentNo,
        'document_date' => (string)($record['quote_date'] ?? $record['invoice_date'] ?? $record['scheduled_for'] ?? ''),
        'valid_until' => (string)($record['valid_until'] ?? ''),
        'due_date' => (string)($record['due_date'] ?? ''),
        'po_number' => (string)($record['po'] ?? 'Not supplied'),
        'callout_ref' => (string)($record['callout_ref'] ?? ''),
        'quote_ref' => (string)($record['quote_ref'] ?? ''),
        'subtotal' => document_money($subtotal, $profile),
        'vat' => document_money($vat, $profile),
        'total' => document_money($total, $profile),
        'vat_rate' => rtrim(rtrim(number_format($vatRate, 2, '.', ''), '0'), '.'),
    ];
}

function document_render_template(string $template, array $variables): string {
    return preg_replace_callback('/\{\{([a-z0-9_]+)\}\}/i', static function (array $match) use ($variables): string {
        return array_key_exists($match[1], $variables) ? (string)$variables[$match[1]] : '';
    }, $template);
}

function document_email_content(array $record, string $templateKey, ?int $profileId = null): array {
    $profile = document_company_profile($profileId ?: (int)($record['company_profile_id'] ?? 0));
    $template = document_template_row((int)$profile['id'], $templateKey);
    $variables = document_variables($record, $profile);

    if ($template) {
        $subject = document_render_template((string)$template['subject_template'], $variables);
        $plainBody = document_render_template((string)$template['body_template'], $variables);
    } else {
        $label = $templateKey === 'invoice_email' ? 'Tax Invoice' : 'Quote';
        $subject = $label . ' ' . $variables['document_no'] . ' | ' . $variables['company_name'];
        $plainBody = "Dear {$variables['client_name']},\n\nPlease find {$label} {$variables['document_no']} attached.\n\nKind regards,\n{$variables['company_name']}";
    }

    $primary = preg_match('/^#[0-9A-Fa-f]{6}$/', (string)($profile['primary_color'] ?? '')) ? $profile['primary_color'] : '#0A1626';
    $accent = preg_match('/^#[0-9A-Fa-f]{6}$/', (string)($profile['accent_color'] ?? '')) ? $profile['accent_color'] : '#C2A04A';
    $safeBody = nl2br(htmlspecialchars($plainBody, ENT_QUOTES, 'UTF-8'));
    $company = htmlspecialchars((string)$profile['display_name'], ENT_QUOTES, 'UTF-8');
    $legal = htmlspecialchars((string)$profile['legal_name'], ENT_QUOTES, 'UTF-8');
    $html = "<html><body style='margin:0;background:#f4f4f4;font-family:Arial,sans-serif;color:#27303f'>";
    $html .= "<div style='max-width:640px;margin:0 auto;background:#fff'>";
    $html .= "<div style='padding:22px 28px;background:{$primary};border-bottom:4px solid {$accent};color:#fff'><div style='font-size:22px;font-weight:700'>{$company}</div><div style='font-size:12px;opacity:.78;margin-top:4px'>{$legal}</div></div>";
    $html .= "<div style='padding:28px;line-height:1.65;font-size:15px'>{$safeBody}</div>";
    $html .= "<div style='padding:16px 28px;background:#f7f7f7;border-top:1px solid #ddd;font-size:11px;color:#667085'>Reg: " . htmlspecialchars((string)($profile['registration_number'] ?? ''), ENT_QUOTES, 'UTF-8') . " | VAT: " . htmlspecialchars((string)($profile['vat_number'] ?? ''), ENT_QUOTES, 'UTF-8') . "</div>";
    $html .= '</div></body></html>';

    return ['subject' => $subject, 'html' => $html, 'profile' => $profile, 'variables' => $variables];
}

function document_template_settings(array $profile, string $templateKey): array {
    $template = document_template_row((int)$profile['id'], $templateKey);
    if (!$template || empty($template['settings_json'])) return [];
    $settings = json_decode((string)$template['settings_json'], true);
    return is_array($settings) ? $settings : [];
}
