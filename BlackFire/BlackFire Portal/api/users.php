<?php
ob_start();
/**
 * Umlilo Portal — Users API
 * GET  /api/users.php           → list (admin only)
 * POST /api/users.php           → create
 * PUT  /api/users.php?id=N      → update
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$method = $_SERVER['REQUEST_METHOD'];
$uid    = (int)($_GET['id'] ?? 0);

if ($method === 'GET') {
    require_perm('security.users');
    $rows = db_select("SELECT id, username, name, role, title, active, last_login, created_at FROM bf_users ORDER BY id");
    json_ok(['data' => $rows]);
}

if ($method === 'POST') {
    $usr = require_perm('user.create');
    $b   = get_body();
    require_fields($b, ['username', 'password', 'name', 'role']);

    $exists = db_row("SELECT id FROM bf_users WHERE username = ?", [strtolower(clean($b['username']))]);
    if ($exists) json_err('Username already exists');

    $id = db_insert(
        "INSERT INTO bf_users (username, password_hash, name, role, title, active) VALUES (?,?,?,?,?,1)",
        [
            strtolower(clean($b['username'])),
            password_hash($b['password'], PASSWORD_BCRYPT),
            clean($b['name']),
            clean($b['role']),
            clean($b['title'] ?? ''),
        ]
    );
    audit($usr['username'], 'CREATE', "User created: {$b['username']}");
    json_ok(['id' => $id], 'User created');
}

if ($method === 'PUT') {
    $usr = require_perm('user.update');
    if (!$uid) json_err('Missing id');
    $b = get_body();

    // Password change
    if (!empty($b['password'])) {
        db_exec("UPDATE bf_users SET password_hash = ? WHERE id = ?", [
            password_hash($b['password'], PASSWORD_BCRYPT),
            $uid
        ]);
        audit($usr['username'], 'UPDATE', "Password changed for user #$uid");
    }

    $sets = []; $params = [];
    foreach (['name', 'role', 'title', 'active'] as $f) {
        if (array_key_exists($f, $b)) {
            $sets[]   = "$f = ?";
            $params[] = $f === 'active' ? (int)(bool)$b[$f] : clean($b[$f]);
        }
    }
    if ($sets) {
        $params[] = $uid;
        db_exec("UPDATE bf_users SET " . implode(', ', $sets) . " WHERE id = ?", $params);
    }

    audit($usr['username'], 'UPDATE', "User #$uid updated");
    $row = db_row("SELECT id, username, name, role, title, active, last_login FROM bf_users WHERE id = ?", [$uid]);
    json_ok(['data' => $row], 'User updated');
}

json_err('Method not allowed', 405);
