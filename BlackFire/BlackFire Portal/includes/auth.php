<?php
ob_start();
/**
 * Umlilo Portal — Authentication & Permissions
 * Permissions are stored in bf_role_permissions and loaded once per request.
 */

/**
 * Load the full permissions map from DB — cached for the lifetime of this request.
 * Returns: [ 'permission.name' => ['role1', 'role2', ...], ... ]
 */
function _load_role_perms(): array {
    static $cache = null;
    if ($cache !== null) return $cache;
    require_once __DIR__ . '/db.php';
    $rows = db_select("SELECT role, permission FROM bf_role_permissions");
    $cache = [];
    foreach ($rows as $row) {
        $cache[$row['permission']][] = $row['role'];
    }
    return $cache;
}

/**
 * Start or resume session (called on every page/api load)
 */
function bf_session_start(): void {
    if (session_status() === PHP_SESSION_NONE) {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
                || (($_SERVER['SERVER_PORT'] ?? 80) == 443);
        ini_set('session.cookie_httponly', '1');
        ini_set('session.use_strict_mode', '1');
        ini_set('session.cookie_samesite', 'Lax');
        ini_set('session.cookie_secure', $isHttps ? '1' : '0');
        $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/\\');
        ini_set('session.cookie_path', ($scriptDir ?: '') . '/');
        ini_set('session.use_cookies', '1');
        ini_set('session.use_only_cookies', '1');
        session_name('bf_portal');
        session_start();
    }
}

/**
 * Get the currently logged-in user array or null
 */
function current_user(): ?array {
    bf_session_start();
    if (!isset($_SESSION['bf_user']) || !is_array($_SESSION['bf_user'])) return null;
    if (!isset($_SESSION['bf_expires']) || $_SESSION['bf_expires'] < time()) {
        session_destroy();
        return null;
    }
    $_SESSION['bf_expires'] = time() + 7200;
    $user = $_SESSION['bf_user'];
    session_write_close();
    return $user;
}

/**
 * Get or create a CSRF token for the current session.
 * Token is stored in session; expose via /me and verify on state-changing requests.
 */
function csrf_token(): string {
    bf_session_start();
    if (empty($_SESSION['bf_csrf'])) {
        $_SESSION['bf_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['bf_csrf'];
}

/**
 * Verify the CSRF token from X-CSRF-Token header or body field.
 * Call before processing any state-changing request.
 */
function verify_csrf(): void {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $token = $headers['X-Csrf-Token']
          ?? $headers['X-CSRF-Token']
          ?? $_POST['csrf_token']
          ?? '';
    bf_session_start();
    $expected = $_SESSION['bf_csrf'] ?? '';
    if (!$expected || !hash_equals($expected, $token)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid or missing CSRF token']);
        exit;
    }
}

/**
 * Require a logged-in user for API endpoints.
 * Exits with 401 JSON if not authenticated.
 */
function require_auth(): array {
    $user = current_user();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    return $user;
}

/**
 * Check if a role has a permission (reads from bf_role_permissions table).
 */
function can(string $perm, ?string $role = null): bool {
    if ($role === null) {
        $user = current_user();
        if (!$user) return false;
        $role = $user['role'];
    }
    if ($role === 'sysadmin') return true;
    $perms = _load_role_perms();
    return in_array($role, $perms[$perm] ?? [], true);
}

/**
 * Require a specific permission or exit with 403
 */
function require_perm(string $perm): array {
    $user = require_auth();
    if (!can($perm, $user['role'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Permission denied']);
        exit;
    }
    return $user;
}

/**
 * Log an action to the audit table
 */
function audit(string $username, string $action, string $detail = ''): void {
    try {
        require_once __DIR__ . '/db.php';
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        db_exec(
            "INSERT INTO bf_audit_log (username, action, detail, ip_address) VALUES (?,?,?,?)",
            [$username, $action, substr($detail, 0, 500), $ip]
        );
    } catch (Exception $e) {
        // Don't fail requests because of audit logging
    }
}
