<?php
ob_start();
/**
 * Umlilo Portal — Dashboard Layout Preferences API
 *
 * GET  /api/dashboard_prefs.php
 *      Returns the current user's saved layout and the admin default.
 *
 * PUT  /api/dashboard_prefs.php
 *      Saves the current user's personal layout.
 *      Body: { enabled:{}, order:[], customized:true, savedAt:ms }
 *
 * PUT  /api/dashboard_prefs.php?action=set_default
 *      Admin/sysadmin only. Saves layout as the shared default for all
 *      users who have no personal layout.
 *      Body: { enabled:{}, order:[] }
 *
 * PUT  /api/dashboard_prefs.php?action=reset_all
 *      Admin/sysadmin only. Clears every user's personal layout so they
 *      revert to the shared default on their next load.
 *      The requesting user's own layout is preserved.
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$usr    = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ── GET ─────────────────────────────────────────────────── */
if ($method === 'GET') {
    $row = db_row("SELECT dashboard_layout FROM bf_users WHERE id = ?", [$usr['id']]);
    $user_layout = null;
    if ($row && $row['dashboard_layout']) {
        $decoded = json_decode($row['dashboard_layout'], true);
        if (is_array($decoded)) $user_layout = $decoded;
    }

    $default_row = db_row(
        "SELECT setting_value FROM bf_settings WHERE setting_key = 'dashboard_default'"
    );
    $default_layout = null;
    if ($default_row && $default_row['setting_value']) {
        $decoded = json_decode($default_row['setting_value'], true);
        if (is_array($decoded)) $default_layout = $decoded;
    }

    json_ok(['user_layout' => $user_layout, 'default_layout' => $default_layout]);
}

/* ── PUT ─────────────────────────────────────────────────── */
if ($method === 'PUT') {

    /* set_default — admin/sysadmin only */
    if ($action === 'set_default') {
        $roles = !empty($usr['roles']) ? $usr['roles'] : [$usr['role']];
        if (!in_array('admin', $roles, true) && !in_array('sysadmin', $roles, true)) {
            json_err('Permission denied', 403);
        }
        $b = get_body();
        if (empty($b['order']) || !is_array($b['order'])) json_err('Missing order array');
        $payload = json_encode([
            'enabled' => is_array($b['enabled'] ?? null) ? $b['enabled'] : (object)[],
            'order'   => array_values(array_map('strval', $b['order'])),
        ]);
        db_exec(
            "INSERT INTO bf_settings (setting_key, setting_value, updated_by)
             VALUES ('dashboard_default', ?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value),
                                     updated_by    = VALUES(updated_by),
                                     updated_at    = NOW()",
            [$payload, $usr['username']]
        );
        json_ok([], 'Default layout saved');
    }

    /* reset_all — admin/sysadmin only */
    if ($action === 'reset_all') {
        $roles = !empty($usr['roles']) ? $usr['roles'] : [$usr['role']];
        if (!in_array('admin', $roles, true) && !in_array('sysadmin', $roles, true)) {
            json_err('Permission denied', 403);
        }
        // Null every user's personal layout except the admin who triggered the reset
        db_exec(
            "UPDATE bf_users SET dashboard_layout = NULL WHERE id != ?",
            [$usr['id']]
        );
        audit($usr['username'], 'DASHBOARD_RESET', 'Dashboard layout reset for all users');
        json_ok([], 'All user layouts reset');
    }

    /* save personal layout (no action) */
    $b = get_body();
    if (empty($b['order']) || !is_array($b['order'])) json_err('Missing order array');
    $payload = json_encode([
        'enabled'    => is_array($b['enabled'] ?? null) ? $b['enabled'] : (object)[],
        'order'      => array_values(array_map('strval', $b['order'])),
        'customized' => true,
        'savedAt'    => isset($b['savedAt']) ? (int)$b['savedAt'] : (int)(microtime(true) * 1000),
    ]);
    db_exec(
        "UPDATE bf_users SET dashboard_layout = ? WHERE id = ?",
        [$payload, $usr['id']]
    );
    json_ok([], 'Layout saved');
}

json_err('Method not allowed', 405);
