<?php
ob_start();
/**
 * Umlilo Portal — Enquiries API
 * POST /api/enquiries.php → submit a portal enquiry (any authenticated user)
 * GET  /api/enquiries.php → list enquiries (requires clients.view permission)
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user   = require_auth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $body    = get_body();
    $name    = clean($body['name']    ?? '', 255);
    $company = clean($body['company'] ?? '', 255);
    $phone   = clean($body['phone']   ?? '', 50);
    $email   = clean($body['email']   ?? '', 255);
    $service = clean($body['service'] ?? '', 100);
    $message = clean($body['message'] ?? '', 2000);

    if (!$name)    json_err('Name is required');
    if (!$email)   json_err('Email is required');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Invalid email address');
    if (!$service) json_err('Service is required');

    db_exec(
        "INSERT INTO bf_portal_enquiries (name, company, phone, email, service, message, submitted_by)
         VALUES (?,?,?,?,?,?,?)",
        [$name, $company, $phone, $email, $service, $message, $user['username']]
    );

    audit($user['username'], 'CREATE', "Portal enquiry from {$name} ({$email}) — {$service}");
    json_ok([], 'Enquiry received — a member of the BlackFire team will be in touch.');
}

if ($method === 'GET') {
    require_perm('clients.view');
    $rows = db_select(
        "SELECT id, name, company, phone, email, service, LEFT(message,200) AS message,
                submitted_by, submitted_at, status
         FROM bf_portal_enquiries ORDER BY submitted_at DESC LIMIT 200"
    );
    json_ok(['enquiries' => $rows]);
}

json_err('Method not allowed', 405);
