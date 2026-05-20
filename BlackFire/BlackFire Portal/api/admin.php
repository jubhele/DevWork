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
    require_fields($body, ['default_password']);
    $default_password = $body['default_password'];
    if (!password_valid($default_password)) json_err(PASSWORD_COMPLEXITY_MSG, 400);

    $rows = db_select("SELECT username FROM bf_users ORDER BY username", []);
    $seed_usernames = array_column($rows, 'username');
    if (!$seed_usernames) json_err('No users found in database', 404);

    $hashes  = [];
    $updates = [];

    foreach ($seed_usernames as $uname) {
        $hash = password_hash($default_password, PASSWORD_BCRYPT, ['cost' => 12]);
        $hashes[] = ['username' => $uname, 'hash' => $hash];
        // bcrypt output is ASCII-safe (alphanumeric + $, /, .) — no SQL quoting needed
        $updates[] = "UPDATE bf_users SET password_hash = '$hash' WHERE username = '$uname';";
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

    // Return hashes for review (not yet applied)
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
    
    // Generate temporary password — 16 hex chars (64-bit entropy), always meets complexity
    $temp_password = bin2hex(random_bytes(8));
    $hash = password_hash($temp_password, PASSWORD_BCRYPT, ['cost' => 12]);
    
    db_exec("UPDATE bf_users SET password_hash = ? WHERE id = ?", [$hash, $user_row['id']]);
    audit($usr['username'], 'SECURITY', "Password reset for user: {$username}");
    
    json_ok(
        ['username' => $username, 'temp_password' => $temp_password],
        'Password reset successfully'
    );
}

// ── POST /admin?action=export_password_sql ──────────────────
// Export seed user hashes as SQL UPDATE statements
if ($action === 'export_password_sql' && $method === 'POST') {
    $usr = require_perm('security.users');
    $body = get_body();
    require_fields($body, ['default_password']);
    $default_password = $body['default_password'];
    if (!password_valid($default_password)) json_err(PASSWORD_COMPLEXITY_MSG, 400);

    $rows = db_select("SELECT username FROM bf_users ORDER BY username", []);
    $seed_usernames = array_column($rows, 'username');
    if (!$seed_usernames) json_err('No users found in database', 404);

    $sql_lines = [
        "-- BlackFire Solutions — Password Hash Update Script",
        "-- Generated: " . date('Y-m-d H:i:s'),
        "-- Admin: {$usr['username']}",
        "--",
        "",
        "-- Update all seed user passwords with bcrypt hashes",
        "",
    ];

    foreach ($seed_usernames as $uname) {
        $hash = password_hash($default_password, PASSWORD_BCRYPT, ['cost' => 12]);
        // bcrypt output is ASCII-safe (alphanumeric + $, /, .) — no SQL quoting needed
        $sql_lines[] = "UPDATE bf_users SET password_hash = '$hash' WHERE username = '$uname';";
    }

    $sql_lines[] = "";
    $sql_lines[] = "-- After running above updates:";
    $sql_lines[] = "-- 1. Delete the password_plain column (if it exists)";
    $sql_lines[] = "-- 2. Update the seed script to remove password_plain from INSERT";
    $sql_lines[] = "-- 3. Require users to change password on next login";
    $sql_lines[] = "";

    $sql_content = implode("\n", $sql_lines);

    header('Content-Type: text/plain; charset=utf-8');
    header('Content-Disposition: attachment; filename="update_passwords_' . date('Y-m-d_His') . '.sql"');
    echo $sql_content;
    exit;
}

json_err('Invalid action', 400);
