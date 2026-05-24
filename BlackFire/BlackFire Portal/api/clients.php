<?php
ob_start();
/**
 * Umlilo Portal — Clients API
 * GET    /api/clients.php            → list (?active=1 for dropdown, ?q=search)
 * POST   /api/clients.php            → create
 * PUT    /api/clients.php?id=N       → update
 * DELETE /api/clients.php?id=N       → soft-delete (sets is_active=0)
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user   = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$id     = (int)($_GET['id'] ?? 0);

// ── GET — List ─────────────────────────────────────────
if ($method === 'GET') {
    require_perm('clients.view');

    $activeOnly = !isset($_GET['active']) || $_GET['active'] !== '0';
    $q          = clean($_GET['q'] ?? '', 100);

    $where  = [];
    $params = [];

    if ($activeOnly) {
        $where[] = 'is_active = 1';
    }
    if ($q) {
        $like    = '%' . like_escape($q) . '%';
        $where[] = '(name LIKE ? ESCAPE \'\\\\\' OR email LIKE ? ESCAPE \'\\\\\' OR contact_person LIKE ? ESCAPE \'\\\\\')';
        array_push($params, $like, $like, $like);
    }

    $sql_where = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $rows = db_select("SELECT * FROM bf_clients $sql_where ORDER BY name", $params);
    json_ok(['data' => $rows]);
}

// ── POST — Create ──────────────────────────────────────
if ($method === 'POST') {
    $usr = require_perm('clients.create');
    $b   = get_body();
    require_fields($b, ['name']);

    $id = db_insert(
        "INSERT INTO bf_clients
         (name, email, phone, vat_number, address, contact_person, contact_details, notes, created_by)
         VALUES (?,?,?,?,?,?,?,?,?)",
        [
            clean($b['name']),
            clean($b['email']           ?? '', 150),
            clean($b['phone']           ?? '', 50),
            clean($b['vat_number']      ?? '', 50),
            clean($b['address']         ?? '', 2000),
            clean($b['contact_person']  ?? ''),
            clean($b['contact_details'] ?? '', 2000),
            clean($b['notes']           ?? '', 2000),
            $usr['username'],
        ]
    );

    audit($usr['username'], 'CREATE', "Client created: " . clean($b['name']));
    $row = db_row("SELECT * FROM bf_clients WHERE id = ?", [$id]);
    json_ok(['data' => $row], "Client " . clean($b['name']) . " created");
}

// ── PUT — Update ───────────────────────────────────────
if ($method === 'PUT') {
    $usr = require_perm('clients.update');
    if (!$id) json_err('Missing id');
    $b = get_body();

    $allowed = ['name', 'email', 'phone', 'vat_number', 'address', 'contact_person', 'contact_details', 'notes', 'is_active'];
    $sets    = [];
    $params  = [];
    foreach ($allowed as $field) {
        if (!array_key_exists($field, $b)) continue;
        $sets[]   = "$field = ?";
        if ($field === 'is_active') {
            $params[] = (int)(bool)$b[$field];
        } else {
            $params[] = clean($b[$field], in_array($field, ['address', 'contact_details', 'notes']) ? 2000 : 255);
        }
    }
    if (!$sets) json_err('No fields to update');
    $params[] = $id;

    db_exec("UPDATE bf_clients SET " . implode(', ', $sets) . " WHERE id = ?", $params);
    audit($usr['username'], 'UPDATE', "Client ID $id updated");
    $row = db_row("SELECT * FROM bf_clients WHERE id = ?", [$id]);
    if (!$row) json_err('Client not found', 404);
    json_ok(['data' => $row], 'Client updated');
}

// ── DELETE — Soft delete ───────────────────────────────
if ($method === 'DELETE') {
    $usr = require_perm('clients.update');
    if (!$id) json_err('Missing id');
    $affected = db_exec("UPDATE bf_clients SET is_active = 0 WHERE id = ? AND is_active = 1", [$id]);
    if (!$affected) json_err('Client not found or already inactive', 404);
    audit($usr['username'], 'DELETE', "Client ID $id deactivated");
    json_ok([], 'Client deactivated');
}

json_err('Method not allowed', 405);
