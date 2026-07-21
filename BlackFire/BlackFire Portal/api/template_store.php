<?php
ob_start();

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$id = (int)($_GET['id'] ?? 0);
$entity = clean($_GET['entity'] ?? 'template', 30);

if ($method === 'GET') {
    $profiles = db_select(
        'SELECT * FROM bf_company_profiles WHERE host_company_id=1 AND is_active=1 ORDER BY is_default DESC, display_name'
    );
    $templates = db_select(
        'SELECT t.*, p.profile_key, p.display_name AS company_name
           FROM bf_document_templates t
           JOIN bf_company_profiles p ON p.id=t.company_profile_id
          WHERE t.host_company_id=1 AND t.is_active=1
          ORDER BY p.is_default DESC, p.display_name, t.template_type, t.name'
    );
    foreach ($templates as &$template) {
        $settings = json_decode((string)($template['settings_json'] ?? ''), true);
        $template['settings'] = is_array($settings) ? $settings : [];
    }
    unset($template);
    $clientProfiles = db_select(
        'SELECT cp.*, c.name AS client_record_name
           FROM bf_client_document_profiles cp
           JOIN bf_clients c ON c.id=cp.client_id
          WHERE cp.host_company_id=1 AND cp.is_active=1
          ORDER BY cp.is_default DESC, cp.display_name'
    );
    json_ok(['profiles' => $profiles, 'templates' => $templates, 'client_profiles' => $clientProfiles]);
}

$usr = require_perm('security.users');
$b = get_body();

if ($method === 'POST' && $entity === 'template') {
    require_fields($b, ['company_profile_id', 'template_key', 'template_type', 'name', 'body_template']);
    $profileId = (int)$b['company_profile_id'];
    if (!db_row('SELECT id FROM bf_company_profiles WHERE id=? AND host_company_id=1 AND is_active=1', [$profileId])) {
        json_err('Company profile not found', 404);
    }
    $settings = isset($b['settings']) && is_array($b['settings'])
        ? json_encode($b['settings'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        : clean($b['settings_json'] ?? '', 10000);
    $newId = db_insert(
        'INSERT INTO bf_document_templates
         (host_company_id, company_profile_id, template_key, template_type, name, description,
          subject_template, body_template, settings_json, allowed_placeholders, is_default,
          created_by_user_id, updated_by_user_id)
         VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?)',
        [
            $profileId,
            clean($b['template_key'], 80),
            clean($b['template_type'], 20),
            clean($b['name'], 150),
            clean($b['description'] ?? '', 500),
            clean($b['subject_template'] ?? '', 500),
            clean($b['body_template'] ?? '', 20000),
            $settings,
            clean($b['allowed_placeholders'] ?? '', 3000),
            !empty($b['is_default']) ? 1 : 0,
            (int)$usr['id'],
            (int)$usr['id'],
        ]
    );
    audit($usr['username'], 'CREATE', "Document template #{$newId} created");
    json_ok(['data' => db_row('SELECT * FROM bf_document_templates WHERE id=?', [$newId])], 'Template created');
}

if ($method === 'PUT' && $entity === 'template') {
    if (!$id) json_err('Missing id');
    $allowed = ['name','description','subject_template','body_template','allowed_placeholders','is_default','is_active'];
    $sets = [];
    $params = [];
    foreach ($allowed as $field) {
        if (!array_key_exists($field, $b)) continue;
        $sets[] = "{$field}=?";
        $params[] = in_array($field, ['is_default','is_active'], true)
            ? (int)(bool)$b[$field]
            : clean($b[$field], $field === 'body_template' ? 20000 : 3000);
    }
    if (isset($b['settings']) && is_array($b['settings'])) {
        $sets[] = 'settings_json=?';
        $params[] = json_encode($b['settings'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
    if (!$sets) json_err('No fields to update');
    $sets[] = 'updated_by_user_id=?';
    $params[] = (int)$usr['id'];
    $sets[] = 'version=version+1';
    $params[] = $id;
    db_exec('UPDATE bf_document_templates SET ' . implode(',', $sets) . ' WHERE id=? AND host_company_id=1', $params);
    audit($usr['username'], 'UPDATE', "Document template #{$id} updated");
    json_ok(['data' => db_row('SELECT * FROM bf_document_templates WHERE id=?', [$id])], 'Template updated');
}

if ($method === 'PUT' && $entity === 'profile') {
    if (!$id) json_err('Missing id');
    $allowed = [
        'display_name','legal_name','registration_number','vat_number','phone','email','address','logo_path',
        'primary_color','accent_color','paper_color','body_font','bank_name','bank_account_type',
        'bank_account_number','bank_branch_code','bank_swift_code','currency_code','vat_rate',
        'quote_prefix','invoice_prefix','quote_valid_days','invoice_due_days','is_default','is_active'
    ];
    $sets = [];
    $params = [];
    foreach ($allowed as $field) {
        if (!array_key_exists($field, $b)) continue;
        $sets[] = "{$field}=?";
        if (in_array($field, ['is_default','is_active'], true)) $params[] = (int)(bool)$b[$field];
        elseif (in_array($field, ['vat_rate','quote_valid_days','invoice_due_days'], true)) $params[] = (float)$b[$field];
        else $params[] = clean($b[$field], $field === 'address' ? 2000 : 500);
    }
    if (!$sets) json_err('No fields to update');
    $params[] = $id;
    db_exec('UPDATE bf_company_profiles SET ' . implode(',', $sets) . ' WHERE id=? AND host_company_id=1', $params);
    audit($usr['username'], 'UPDATE', "Company profile #{$id} updated");
    json_ok(['data' => db_row('SELECT * FROM bf_company_profiles WHERE id=?', [$id])], 'Company profile updated');
}

if ($method === 'PUT' && $entity === 'client_profile') {
    if (!$id) json_err('Missing id');
    $allowed = [
        'display_name','legal_name','vat_number','phone','email','quote_address','invoice_address',
        'supplier_reference','purchase_order_prefix','is_default','is_active','source_note'
    ];
    $sets = [];
    $params = [];
    foreach ($allowed as $field) {
        if (!array_key_exists($field, $b)) continue;
        $sets[] = "{$field}=?";
        if (in_array($field, ['is_default','is_active'], true)) $params[] = (int)(bool)$b[$field];
        else $params[] = clean($b[$field], in_array($field, ['quote_address','invoice_address'], true) ? 2000 : 500);
    }
    if (!$sets) json_err('No fields to update');
    $params[] = $id;
    db_exec('UPDATE bf_client_document_profiles SET ' . implode(',', $sets) . ' WHERE id=? AND host_company_id=1', $params);
    audit($usr['username'], 'UPDATE', "Client document profile #{$id} updated");
    json_ok(['data' => db_row('SELECT * FROM bf_client_document_profiles WHERE id=?', [$id])], 'Client document profile updated');
}

if ($method === 'DELETE' && $entity === 'template') {
    if (!$id) json_err('Missing id');
    db_exec('UPDATE bf_document_templates SET is_active=0, updated_by_user_id=?, version=version+1 WHERE id=? AND host_company_id=1', [(int)$usr['id'], $id]);
    audit($usr['username'], 'DELETE', "Document template #{$id} deactivated");
    json_ok([], 'Template deactivated');
}

json_err('Method not allowed', 405);
