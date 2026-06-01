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

const VALID_ROLES = ['sysadmin','admin','manager','call_logger','junior_tech','senior_tech','client_support','admin_clerk','viewer','safety_officer'];

function sanitise_roles(mixed $raw): array {
    if (!is_array($raw)) $raw = [$raw];
    return array_values(array_intersect(array_map('strval', $raw), VALID_ROLES));
}

$method = $_SERVER['REQUEST_METHOD'];
$uid    = (int)($_GET['id'] ?? 0);

if ($method === 'GET') {
    require_perm('security.users');
    $rows = db_select("SELECT id, username, name, role, title, email, active, last_login, created_at,
        (signature_image IS NOT NULL) AS has_signature,
        signature_updated_by, signature_updated_at
        FROM bf_users ORDER BY id");

    // Attach roles array from junction table
    if ($rows) {
        $ids = implode(',', array_map('intval', array_column($rows, 'id')));
        $role_rows = db_select("SELECT user_id, role FROM bf_user_roles WHERE user_id IN ($ids) ORDER BY user_id, role");
        $roles_map = [];
        foreach ($role_rows as $r) {
            $roles_map[(int)$r['user_id']][] = $r['role'];
        }
        foreach ($rows as &$row) {
            $row['roles'] = $roles_map[(int)$row['id']] ?? [$row['role']];
        }
        unset($row);
    }

    json_ok(['data' => $rows]);
}

if ($method === 'POST') {
    $usr = require_perm('user.create');
    $b   = get_body();
    require_fields($b, ['username', 'password', 'name']);

    // Accept roles array or fall back to single role field
    $roles = sanitise_roles($b['roles'] ?? $b['role'] ?? 'viewer');
    if (!$roles) json_err('At least one valid role is required');
    $primary_role = $roles[0];

    $exists = db_row("SELECT id FROM bf_users WHERE username = ?", [strtolower(clean($b['username']))]);
    if ($exists) json_err('Username already exists');

    $id = db_insert(
        "INSERT INTO bf_users (username, password_hash, name, role, title, email, active) VALUES (?,?,?,?,?,?,1)",
        [
            strtolower(clean($b['username'])),
            password_hash($b['password'], PASSWORD_BCRYPT),
            clean($b['name']),
            $primary_role,
            clean($b['title'] ?? ''),
            clean($b['email'] ?? ''),
        ]
    );

    foreach ($roles as $r) {
        db_exec("INSERT IGNORE INTO bf_user_roles (user_id, role) VALUES (?,?)", [$id, $r]);
    }

    audit($usr['username'], 'CREATE', "User created: {$b['username']} roles: " . implode(', ', $roles));
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

    // Role(s) update — accept roles array or single role field
    if (array_key_exists('roles', $b) || array_key_exists('role', $b)) {
        $roles = sanitise_roles($b['roles'] ?? $b['role'] ?? []);
        if ($roles) {
            $primary_role = $roles[0];
            db_exec("UPDATE bf_users SET role = ? WHERE id = ?", [$primary_role, $uid]);
            db_exec("DELETE FROM bf_user_roles WHERE user_id = ?", [$uid]);
            foreach ($roles as $r) {
                db_exec("INSERT INTO bf_user_roles (user_id, role) VALUES (?,?)", [$uid, $r]);
            }
            audit($usr['username'], 'UPDATE', "Roles updated for user #$uid: " . implode(', ', $roles));
        }
    }

    $sets = []; $params = [];
    foreach (['name', 'title', 'email', 'active'] as $f) {
        if (array_key_exists($f, $b)) {
            $sets[]   = "$f = ?";
            $params[] = $f === 'active' ? (int)filter_var($b[$f], FILTER_VALIDATE_BOOLEAN) : clean($b[$f]);
        }
    }
    if ($sets) {
        $params[] = $uid;
        db_exec("UPDATE bf_users SET " . implode(', ', $sets) . " WHERE id = ?", $params);
    }

    audit($usr['username'], 'UPDATE', "User #$uid updated");
    $row = db_row("SELECT id, username, name, role, title, email, active, last_login FROM bf_users WHERE id = ?", [$uid]);
    if ($row) {
        $role_rows = db_select("SELECT role FROM bf_user_roles WHERE user_id = ? ORDER BY role", [$uid]);
        $row['roles'] = array_column($role_rows, 'role') ?: [$row['role']];
    }
    json_ok(['data' => $row], 'User updated');
}

json_err('Method not allowed', 405);
