<?php
ob_start();
/**
 * BlackFire Solutions Portal — Authentication & Permissions
 */

// Permissions matrix — mirrors the JS PERMS object
const PERMS = [
    'callout.view'          => ['admin','manager','call_logger','junior_tech','senior_tech','client_support','admin_clerk','viewer'],
    'callout.create'        => ['admin','manager','call_logger','client_support'],
    'callout.update_status' => ['admin','manager','call_logger','junior_tech','senior_tech','admin_clerk'],
    'callout.assign_po'     => ['admin','manager','admin_clerk'],
    'callout.assign_tech'   => ['admin','manager','admin_clerk'],
    'callout.delete'        => ['admin','manager'],

    'quote.view'            => ['admin','manager','senior_tech','client_support','admin_clerk','viewer'],
    'quote.create'          => ['admin','manager','senior_tech'],
    'quote.approve'         => ['admin','manager'],
    'quote.convert'         => ['admin','manager','admin_clerk'],
    'quote.delete'          => ['admin','manager'],

    'invoice.view'          => ['admin','manager','client_support','admin_clerk','viewer'],
    'invoice.create'        => ['admin','manager','admin_clerk'],
    'invoice.mark_paid'     => ['admin','manager','admin_clerk'],
    'invoice.delete'        => ['admin','manager'],

    'finance.transactions'  => ['admin','manager','admin_clerk'],
    'finance.statement'     => ['admin','manager','client_support','admin_clerk'],
    'finance.income'        => ['admin','manager','admin_clerk'],

    'capture.new_callout'   => ['admin','manager','call_logger','client_support'],
    'capture.new_quote'     => ['admin','manager','senior_tech'],
    'capture.new_invoice'   => ['admin','manager','admin_clerk'],
    'capture.log_payment'   => ['admin','manager','admin_clerk'],

    'security.audit'        => ['admin'],
    'security.users'        => ['admin'],
    'user.create'           => ['admin'],
    'user.update'           => ['admin'],
];

/**
 * Start or resume session (called on every page/api load)
 */
function bf_session_start(): void {
    if (session_status() === PHP_SESSION_NONE) {
        // LiteSpeed-compatible session config
        // SameSite=Lax (not Strict) so cookie is sent on same-site requests
        // cookie_secure=0 because LiteSpeed may terminate SSL before PHP
        ini_set('session.cookie_httponly', '1');
        ini_set('session.use_strict_mode', '1');
        ini_set('session.cookie_samesite', 'Lax');
        ini_set('session.cookie_secure', '0');
        ini_set('session.cookie_path', '/portal/');
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
    // Slide expiry window
    $_SESSION['bf_expires'] = time() + 7200; // 2hr
    return $_SESSION['bf_user'];
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
 * Check if a role has a permission
 */
function can(string $perm, ?string $role = null): bool {
    if ($role === null) {
        $user = current_user();
        if (!$user) return false;
        $role = $user['role'];
    }
    return in_array($role, PERMS[$perm] ?? [], true);
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
