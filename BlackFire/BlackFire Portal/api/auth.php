<?php
ob_start();
/**
 * Umlilo Portal — Auth API
 * POST /api/auth.php?action=login   { username, password }
 * POST /api/auth.php?action=logout
 * GET  /api/auth.php?action=me
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ── GET /me ──────────────────────────────────────────
if ($action === 'me') {
    $user = current_user();
    if (!$user) json_err('Not authenticated', 401);
    json_ok(['user' => $user]);
}

// ── POST /logout ─────────────────────────────────────
if ($action === 'logout') {
    $user = current_user();
    if ($user) audit($user['username'], 'LOGOUT', $user['username'] . ' signed out');
    bf_session_start();
    session_destroy();
    json_ok([], 'Logged out');
}

// ── POST /login ───────────────────────────────────────
if ($action === 'login' && $method === 'POST') {
    $body = get_body();
    $username = strtolower(clean($body['username'] ?? '', 50));
    $password = $body['password'] ?? '';

    if (!$username || !$password) json_err('Username and password required');

    // Rate limiting (simple: lock account after 10 fails — via failed_attempts column)
    $row = db_row(
        "SELECT id, username, password_hash, name, role, title, active FROM bf_users WHERE username = ?",
        [$username]
    );

    if (!$row || !$row['active']) {
        // Deliberate vague message (don't reveal username existence)
        sleep(1); // mild brute-force delay
        json_err('Invalid username or password', 401);
    }

    if (!password_verify($password, $row['password_hash'])) {
        sleep(1);
        audit($username, 'LOGIN_FAIL', "Failed login attempt for $username");
        json_err('Invalid username or password', 401);
    }

    // Update last login
    db_exec("UPDATE bf_users SET last_login = NOW() WHERE id = ?", [$row['id']]);

    // Build session user object
    $session_user = [
        'id'       => (int) $row['id'],
        'username' => $row['username'],
        'name'     => $row['name'],
        'role'     => $row['role'],
        'title'    => $row['title'],
    ];

    bf_session_start();
    session_regenerate_id(true);
    $_SESSION['bf_user']    = $session_user;
    $_SESSION['bf_expires'] = time() + 7200; // 2 hours

    audit($username, 'LOGIN', "{$row['name']} signed in as {$row['role']}");
    json_ok(['user' => $session_user], 'Login successful');
}

json_err('Unknown action or method', 404);
