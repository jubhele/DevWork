<?php
ob_start();
/**
 * Umlilo Portal — Admin Functions API
 * POST /api/admin.php?action=generate_password_hashes
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ── POST /admin?action=generate_password_hashes ──────────────────
if ($action === 'generate_password_hashes' && $method === 'POST') {
    $usr = require_perm('security.users');
    $body = get_body();
    
    // Seed user credentials (from blackfire_aeci_seed.sql)
    $seed_users = [
        ['username' => 'admin',   'password' => 'BlackFire2026!', 'name' => 'J. Ndlovu',  'role' => 'admin'],
        ['username' => 'manager', 'password' => 'BlackFire2026!', 'name' => 'T. Nkosi',   'role' => 'manager'],
        ['username' => 'calllog', 'password' => 'CallLog2026!',   'name' => 'N. Mokoena', 'role' => 'call_logger'],
        ['username' => 'jtech',   'password' => 'JTech2026!',     'name' => 'J. Mthembu', 'role' => 'junior_tech'],
        ['username' => 'stech',   'password' => 'STech2026!',     'name' => 'R. Khumalo', 'role' => 'senior_tech'],
        ['username' => 'support', 'password' => 'Support2026!',   'name' => 'L. Dlamini', 'role' => 'client_support'],
        ['username' => 'clerk',   'password' => 'Clerk2026!',     'name' => 'A. Sithole', 'role' => 'admin_clerk'],
        ['username' => 'viewer',  'password' => 'view2026',       'name' => 'S. Baloyi',  'role' => 'viewer'],
    ];
    
    $hashes = [];
    $updates = [];
    
    foreach ($seed_users as $seed_user) {
        $hash = password_hash($seed_user['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        
        $hashes[] = [
            'username'  => $seed_user['username'],
            'password'  => $seed_user['password'],
            'hash'      => $hash,
            'name'      => $seed_user['name'],
            'role'      => $seed_user['role'],
        ];
        
        // Escape hash for SQL (though bcrypt hashes don't typically have quotes)
        $hash_escaped = str_replace("'", "''", $hash);
        $updates[] = "UPDATE bf_users SET password_hash = '$hash_escaped' WHERE username = '{$seed_user['username']}';";
    }
    
    // If apply=true in request, apply to database
    if ($body['apply'] ?? false) {
        foreach ($hashes as $item) {
            db_exec(
                "UPDATE bf_users SET password_hash = ? WHERE username = ?",
                [$item['hash'], $item['username']]
            );
        }
        audit($usr['username'], 'SECURITY', 'Password hashes regenerated for all seed users');
        json_ok(
            ['hashes' => $hashes, 'updates' => $updates, 'applied' => true],
            'Password hashes applied to database'
        );
    }
    
    // Return hashes for review (don't apply yet)
    json_ok(
        ['hashes' => $hashes, 'updates' => $updates, 'applied' => false],
        'Password hashes generated (not yet applied)'
    );
}

// ── POST /admin?action=reset_user_password ──────────────────
// Reset a specific user's password to a temporary one
if ($action === 'reset_user_password' && $method === 'POST') {
    $usr = require_perm('security.users');
    $body = get_body();
    require_fields($body, ['username']);
    
    $username = strtolower(clean($body['username']));
    $user_row = db_row("SELECT id, username FROM bf_users WHERE username = ?", [$username]);
    if (!$user_row) json_err('User not found');
    
    // Generate temporary password
    $temp_password = bin2hex(random_bytes(6)); // 12-character hex string
    $hash = password_hash($temp_password, PASSWORD_BCRYPT, ['cost' => 12]);
    
    db_exec("UPDATE bf_users SET password_hash = ? WHERE id = ?", [$hash, $user_row['id']]);
    audit($usr['username'], 'SECURITY', "Password reset for user: {$username}");
    
    json_ok(
        ['username' => $username, 'temp_password' => $temp_password],
        'Password reset successfully'
    );
}

// ── POST /admin?action=export_password_sql ──────────────────
// Export all seed user hashes as SQL UPDATE statements
if ($action === 'export_password_sql' && $method === 'POST') {
    $usr = require_perm('security.users');
    
    $seed_users = [
        ['username' => 'admin',   'password' => 'BlackFire2026!'],
        ['username' => 'manager', 'password' => 'BlackFire2026!'],
        ['username' => 'calllog', 'password' => 'CallLog2026!'],
        ['username' => 'jtech',   'password' => 'JTech2026!'],
        ['username' => 'stech',   'password' => 'STech2026!'],
        ['username' => 'support', 'password' => 'Support2026!'],
        ['username' => 'clerk',   'password' => 'Clerk2026!'],
        ['username' => 'viewer',  'password' => 'view2026'],
    ];
    
    $sql_lines = [
        "-- BlackFire Solutions — Password Hash Update Script",
        "-- Generated: " . date('Y-m-d H:i:s'),
        "-- Admin: {$usr['username']}",
        "--",
        "",
        "-- Update all seed user passwords with bcrypt hashes",
        "",
    ];
    
    foreach ($seed_users as $seed_user) {
        $hash = password_hash($seed_user['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        $hash_escaped = str_replace("'", "''", $hash);
        $sql_lines[] = "UPDATE bf_users SET password_hash = '$hash_escaped' WHERE username = '{$seed_user['username']}';";
    }
    
    $sql_lines[] = "";
    $sql_lines[] = "-- After running above updates:";
    $sql_lines[] = "-- 1. Delete the password_plain column (if it exists)";
    $sql_lines[] = "-- 2. Update the seed script to remove password_plain from INSERT";
    $sql_lines[] = "-- 3. Require users to change password on next login";
    $sql_lines[] = "";
    
    $sql_content = implode("\n", $sql_lines);
    
    // Return as downloadable file
    header('Content-Type: text/plain; charset=utf-8');
    header('Content-Disposition: attachment; filename="update_passwords_' . date('Y-m-d_His') . '.sql"');
    echo $sql_content;
    exit;
}

json_err('Invalid action', 400);
