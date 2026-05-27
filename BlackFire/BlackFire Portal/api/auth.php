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
require_once __DIR__ . '/../includes/mailer.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ── GET /captcha ─────────────────────────────────────
if ($action === 'captcha') {
    bf_session_start();
    $a = rand(1, 12);
    $b = rand(1, 12);
    $_SESSION['bf_captcha'] = $a + $b;
    $_SESSION['bf_captcha_ts'] = time();
    json_ok(['question' => "$a + $b = ?"]);
}

// ── GET /me ──────────────────────────────────────────
if ($action === 'me') {
    $user = current_user();
    if (!$user) json_err('Not authenticated', 401);
    json_ok(['user' => $user, 'csrf_token' => csrf_token()]);
}

// ── POST /logout ─────────────────────────────────────
if ($action === 'logout') {
    $user = current_user();
    if ($user) audit($user['username'], 'LOGOUT', $user['username'] . ' signed out');
    bf_session_start();
    session_destroy();
    setcookie('bf_session_hint', '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => false, 'samesite' => 'Lax']);
    json_ok([], 'Logged out');
}

// ── POST /login ───────────────────────────────────────
if ($action === 'login' && $method === 'POST') {
    $body = get_body();
    $username = strtolower(clean($body['username'] ?? '', 50));
    $password = $body['password'] ?? '';
    $captcha  = (int)($body['captcha'] ?? -1);

    if (!$username || !$password) json_err('Username and password required');

    // Verify CAPTCHA
    bf_session_start();
    $expected = $_SESSION['bf_captcha'] ?? null;
    $captcha_ts = $_SESSION['bf_captcha_ts'] ?? 0;
    unset($_SESSION['bf_captcha'], $_SESSION['bf_captcha_ts']);
    if ($expected === null || $captcha !== $expected || (time() - $captcha_ts) > 600) {
        json_err('Invalid security check answer', 400);
    }

    // Rate limiting (simple: lock account after 10 fails — via failed_attempts column)
    $row = db_row(
        "SELECT id, username, password_hash, name, role, title, active, client_id FROM bf_users WHERE username = ?",
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
        'id'        => (int) $row['id'],
        'username'  => $row['username'],
        'name'      => $row['name'],
        'role'      => $row['role'],
        'title'     => $row['title'],
        'client_id' => $row['client_id'] !== null ? (int)$row['client_id'] : null,
    ];

    bf_session_start();
    session_regenerate_id(true);
    $_SESSION['bf_user']    = $session_user;
    $_SESSION['bf_expires'] = time() + 7200; // 2 hours
    $csrf = csrf_token();

    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? 80) == 443);
    setcookie('bf_session_hint', '1', ['expires' => time() + 7200, 'path' => '/', 'secure' => $isSecure, 'httponly' => false, 'samesite' => 'Lax']);
    audit($username, 'LOGIN', "{$row['name']} signed in as {$row['role']}");
    json_ok(['user' => $session_user, 'csrf_token' => $csrf], 'Login successful');
}

// ── POST /reset_request ──────────────────────────────
if ($action === 'reset_request' && $method === 'POST') {
    $body = get_body();
    $username = strtolower(clean($body['username'] ?? '', 50));
    if (!$username) json_err('Username required');

    $row = db_row("SELECT id, username, name, email FROM bf_users WHERE username = ? AND active = 1", [$username]);
    // Constant-time response to prevent user enumeration via timing
    if ($row && !empty($row['email'])) {
        // Expire old tokens
        db_exec("UPDATE bf_password_resets SET used = 1 WHERE user_id = ?", [$row['id']]);
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour
        db_exec(
            "INSERT INTO bf_password_resets (user_id, token, expires_at) VALUES (?,?,?)",
            [$row['id'], hash('sha256', $token), $expires]
        );
        $resetLink = ($cfg['base_url'] ?? '') . '?reset_token=' . urlencode($token);
        $subject = 'BlackFire Portal — Password Reset';
        $body  = "Hi {$row['name']},\r\n\r\n";
        $body .= "A password reset was requested for your account.\r\n\r\n";
        $body .= "Click the link below to reset your password (valid for 1 hour):\r\n";
        $body .= "$resetLink\r\n\r\n";
        $body .= "If you did not request this, please ignore this email.\r\n\r\n";
        $body .= "— BlackFire Solutions\r\nFire, taught to behave.";
        try {
            smtp_send($row['email'], $subject, $body);
        } catch (RuntimeException $e) {
            error_log('Password reset mail failed: ' . $e->getMessage());
        }
        audit($username, 'RESET_REQUEST', "Password reset requested for {$row['username']}");
    }
    sleep(1); // Constant delay regardless of whether user exists
    json_ok([], 'If that username exists with a registered email, a reset link has been sent.');
}

// ── POST /reset_password ─────────────────────────────
if ($action === 'reset_password' && $method === 'POST') {
    $body  = get_body();
    $token = clean($body['token'] ?? '', 128);
    $pass  = $body['password'] ?? '';
    if (!$token || !$pass) json_err('Token and new password required');
    if (!password_valid($pass)) json_err(PASSWORD_COMPLEXITY_MSG);

    $hashed = hash('sha256', $token);
    $row = db_row(
        "SELECT r.id, r.user_id, u.username FROM bf_password_resets r
         JOIN bf_users u ON u.id = r.user_id
         WHERE r.token = ? AND r.used = 0 AND r.expires_at > NOW()",
        [$hashed]
    );
    if (!$row) json_err('Invalid or expired reset link', 400);

    db_exec("UPDATE bf_users SET password_hash = ? WHERE id = ?", [
        password_hash($pass, PASSWORD_BCRYPT),
        $row['user_id']
    ]);
    db_exec("UPDATE bf_password_resets SET used = 1 WHERE id = ?", [$row['id']]);
    audit($row['username'], 'RESET_PASSWORD', "Password reset completed for {$row['username']}");
    json_ok([], 'Password updated. You can now log in.');
}

json_err('Unknown action or method', 404);
