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
        ini_set('session.cookie_httponly', '1');
        ini_set('session.use_strict_mode', '1');
        ini_set('session.cookie_samesite', 'Lax');
        ini_set('session.cookie_secure', '0');
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
    if (!isset($_SESSION['bf_user']) || !isset($_SESSION['bf_expires'])) return null;
    if ($_SESSION['bf_expires'] < time()) {
        session_destroy();
        return null;
    }
    $_SESSION['bf_expires'] = time() + 7200;
    $user = $_SESSION['bf_user'];
    // Release session file lock so concurrent API calls don't serialize
    session_write_close();
    return $user;
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
