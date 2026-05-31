<?php
ob_start();
/**
 * Umlilo Portal — Personnel API
 *
 * All personnel must be portal users (bf_users). Standalone creation is disabled.
 *
 * GET    /api/safety_personnel.php?file_ref=SAF-xxx        → list all personnel (active + inactive)
 * POST   /api/safety_personnel.php {action:link_user}      → link portal user to file
 * PUT    /api/safety_personnel.php?id=123                  → update safety-specific fields (role, id_number, company)
 * PUT    /api/safety_personnel.php?id=123&action=remove    → soft-delete (record retained for audit)
 * PUT    /api/safety_personnel.php?id=123&action=reinstate → reactivate
 * DELETE /api/safety_personnel.php?action=unlink_user      → soft-removes personnel row
 * DELETE /api/safety_personnel.php?id=123                  → hard delete (admin only)
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user   = require_auth();
require_perm('safety.view');
$method = $_SERVER['REQUEST_METHOD'];
$id     = (int)($_GET['id'] ?? 0);

const VALID_ROLES = ['Employee','Subcontractor','Supervisor','SHE Rep','First Aider','Other'];

/* ── GET ──────────────────────────────────────────────── */
if ($method === 'GET') {
    $file_ref = clean($_GET['file_ref'] ?? '', 30);
    if (!$file_ref) json_err('Missing file_ref');

    // JOIN bf_users so the frontend always shows the current name/email/title
    $rows = db_select(
        "SELECT sp.*,
                u.name  AS user_name,
                u.email AS user_email,
                u.title AS user_title
           FROM bf_safety_personnel sp
           LEFT JOIN bf_users u ON u.id = sp.user_id
          WHERE sp.file_ref = ?
          ORDER BY sp.is_active DESC,
                   COALESCE(u.name, sp.full_name) ASC",
        [$file_ref]
    );
    json_ok(['data' => $rows]);
}

/* ── POST — link portal user only ────────────────────── */
if ($method === 'POST') {
    $b      = get_body();
    $action = clean($b['action'] ?? '', 30);

    if ($action !== 'link_user') {
        json_err('Standalone personnel creation is disabled. All personnel must be portal users — use action=link_user.');
    }

    require_fields($b, ['file_ref', 'user_id']);
    $file_ref = clean($b['file_ref'], 30);
    $uid      = (int)$b['user_id'];

    if (!db_row("SELECT id FROM bf_safety_files WHERE ref_id = ?", [$file_ref]))
        json_err('Safety file not found', 404);

    $pu = db_row(
        "SELECT id, name, role, title, email FROM bf_users WHERE id = ? AND active = 1",
        [$uid]
    );
    if (!$pu) json_err('Portal user not found or inactive', 404);

    // Check by user_id first, fall back to portal_user_id for legacy rows
    $existing = db_row(
        "SELECT id, is_active FROM bf_safety_personnel
          WHERE file_ref = ? AND (user_id = ? OR portal_user_id = ?)",
        [$file_ref, $uid, $uid]
    );

    if ($existing && $existing['is_active']) json_err('User already on this safety file');

    if ($existing) {
        // Reactivate an old record and ensure user_id is set
        db_exec(
            "UPDATE bf_safety_personnel
             SET is_active = 1, user_id = ?, portal_user_id = ?,
                 full_name = ?,
                 removed_at = NULL, removed_reason = '', removed_by = ''
             WHERE id = ?",
            [$uid, $uid, $pu['name'], $existing['id']]
        );
    } else {
        $role = in_array($pu['title'], VALID_ROLES, true) ? $pu['title']
              : (in_array($pu['role'],  VALID_ROLES, true) ? $pu['role'] : 'Employee');
        db_insert(
            "INSERT INTO bf_safety_personnel
             (file_ref, user_id, portal_user_id, full_name, role, created_by)
             VALUES (?, ?, ?, ?, ?, ?)",
            [$file_ref, $uid, $uid, $pu['name'], $role, $user['username']]
        );
    }

    audit($user['username'], 'LINK_USER', "Portal user {$pu['name']} linked to $file_ref");

    $rows = db_select(
        "SELECT sp.*, u.name AS user_name, u.email AS user_email, u.title AS user_title
           FROM bf_safety_personnel sp
           LEFT JOIN bf_users u ON u.id = sp.user_id
          WHERE sp.file_ref = ?
          ORDER BY sp.is_active DESC, COALESCE(u.name, sp.full_name) ASC",
        [$file_ref]
    );
    json_ok(['data' => $rows], 'User added to safety file');
}

/* ── PUT update / remove / reinstate ─────────────────── */
if ($method === 'PUT') {
    if (!$id) json_err('Missing id');
    $person = db_row("SELECT * FROM bf_safety_personnel WHERE id = ?", [$id]);
    if (!$person) json_err('Person not found', 404);

    $b      = get_body();
    $action = clean($b['action'] ?? $_GET['action'] ?? '', 30);

    if ($action === 'remove') {
        $reason = clean($b['reason'] ?? '', 500);
        db_exec(
            "UPDATE bf_safety_personnel
             SET is_active = 0, removed_at = CURDATE(), removed_reason = ?, removed_by = ?
             WHERE id = ?",
            [$reason, $user['username'], $id]
        );
        $name = $person['full_name'];
        audit($user['username'], 'REMOVE',
            "Personnel $id ($name) removed from {$person['file_ref']}: $reason");
        $row = db_row("SELECT * FROM bf_safety_personnel WHERE id = ?", [$id]);
        json_ok(['data' => $row], 'Person removed — record retained for audit');
    }

    if ($action === 'reinstate') {
        db_exec(
            "UPDATE bf_safety_personnel
             SET is_active = 1, removed_at = NULL, removed_reason = '', removed_by = ''
             WHERE id = ?",
            [$id]
        );
        audit($user['username'], 'REINSTATE',
            "Personnel $id ({$person['full_name']}) reinstated on {$person['file_ref']}");
        $row = db_row("SELECT * FROM bf_safety_personnel WHERE id = ?", [$id]);
        json_ok(['data' => $row], 'Person reinstated');
    }

    // Only safety-specific fields are editable; name/email come from bf_users
    $sets   = [];
    $params = [];
    if (array_key_exists('id_number', $b)) { $sets[] = 'id_number = ?'; $params[] = clean($b['id_number'], 30); }
    if (array_key_exists('role', $b) && in_array($b['role'], VALID_ROLES, true)) {
        $sets[] = 'role = ?'; $params[] = $b['role'];
    }
    if (array_key_exists('company', $b)) { $sets[] = 'company = ?'; $params[] = clean($b['company'], 255); }

    if ($sets) {
        $params[] = $id;
        db_exec("UPDATE bf_safety_personnel SET " . implode(', ', $sets) . " WHERE id = ?", $params);
        audit($user['username'], 'UPDATE', "Personnel $id updated on {$person['file_ref']}");
    }
    $row = db_row("SELECT * FROM bf_safety_personnel WHERE id = ?", [$id]);
    json_ok(['data' => $row], 'Person updated');
}

/* ── DELETE hard-delete / unlink ──────────────────────── */
if ($method === 'DELETE') {
    $action = clean($_GET['action'] ?? '', 30);

    if ($action === 'unlink_user') {
        $file_ref = clean($_GET['file_ref'] ?? '', 30);
        $uid      = (int)($_GET['user_id'] ?? 0);
        if (!$file_ref || !$uid) json_err('Missing file_ref or user_id');

        $prs = db_row(
            "SELECT id FROM bf_safety_personnel
              WHERE file_ref = ? AND (user_id = ? OR portal_user_id = ?) AND is_active = 1",
            [$file_ref, $uid, $uid]
        );
        if (!$prs) json_err('Link not found', 404);

        db_exec(
            "UPDATE bf_safety_personnel
             SET is_active = 0, removed_at = CURDATE(),
                 removed_reason = 'Portal user unlinked', removed_by = ?
             WHERE id = ?",
            [$user['username'], $prs['id']]
        );

        $pu = db_row("SELECT name FROM bf_users WHERE id = ?", [$uid]);
        audit($user['username'], 'UNLINK_USER',
            "Portal user " . ($pu['name'] ?? "#$uid") . " removed from $file_ref");
        json_ok([], 'User removed from safety file');
    }

    require_perm('safety.delete');
    if (!$id) json_err('Missing id');
    $person = db_row("SELECT * FROM bf_safety_personnel WHERE id = ?", [$id]);
    if (!$person) json_err('Person not found', 404);
    db_exec("DELETE FROM bf_safety_personnel WHERE id = ?", [$id]);
    audit($user['username'], 'DELETE',
        "Personnel $id ({$person['full_name']}) hard-deleted from {$person['file_ref']}");
    json_ok([], 'Person deleted');
}

json_err('Method not allowed', 405);
