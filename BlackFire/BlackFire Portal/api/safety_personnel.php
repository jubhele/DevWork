<?php
ob_start();
/**
 * Umlilo Portal — Personnel API
 *
 * GET    /api/safety_personnel.php?file_ref=SAF-xxx        → list all personnel (active + inactive)
 * POST   /api/safety_personnel.php                         → add person to file
 * POST   /api/safety_personnel.php {action:link_user}      → link portal user (creates/reactivates personnel row)
 * PUT    /api/safety_personnel.php?id=123                  → update person details
 * PUT    /api/safety_personnel.php?id=123&action=remove    → soft-delete (record retained for audit)
 * PUT    /api/safety_personnel.php?id=123&action=reinstate → reactivate
 * DELETE /api/safety_personnel.php?action=unlink_user      → unlink portal user (soft-removes personnel row)
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

    $rows = db_select(
        "SELECT * FROM bf_safety_personnel
          WHERE file_ref = ?
          ORDER BY is_active DESC, full_name ASC",
        [$file_ref]
    );
    json_ok(['data' => $rows]);
}

/* ── POST create / link_user ──────────────────────────── */
if ($method === 'POST') {
    $b      = get_body();
    $action = clean($b['action'] ?? '', 30);

    /* ── sub-action: link portal user ─────────────────── */
    if ($action === 'link_user') {
        require_fields($b, ['file_ref', 'user_id']);
        $file_ref = clean($b['file_ref'], 30);
        $uid      = (int)$b['user_id'];

        if (!db_row("SELECT id FROM bf_safety_files WHERE ref_id = ?", [$file_ref]))
            json_err('Safety file not found', 404);

        $pu = db_row(
            "SELECT id, name, role, title FROM bf_users WHERE id = ? AND active = 1",
            [$uid]
        );
        if (!$pu) json_err('Portal user not found or inactive', 404);

        $existing = db_row(
            "SELECT id, is_active FROM bf_safety_personnel WHERE file_ref = ? AND portal_user_id = ?",
            [$file_ref, $uid]
        );

        if ($existing && $existing['is_active']) json_err('User already linked to this file');

        if ($existing) {
            db_exec(
                "UPDATE bf_safety_personnel
                 SET is_active = 1, removed_at = NULL, removed_reason = '', removed_by = ''
                 WHERE id = ?",
                [$existing['id']]
            );
        } else {
            $role = in_array($pu['title'], VALID_ROLES, true) ? $pu['title']
                  : (in_array($pu['role'],  VALID_ROLES, true) ? $pu['role'] : 'Employee');
            db_insert(
                "INSERT INTO bf_safety_personnel
                 (file_ref, full_name, role, portal_user_id, created_by)
                 VALUES (?, ?, ?, ?, ?)",
                [$file_ref, $pu['name'], $role, $uid, $user['username']]
            );
        }

        audit($user['username'], 'LINK_USER', "Portal user {$pu['name']} linked to $file_ref");

        $rows = db_select(
            "SELECT * FROM bf_safety_personnel
              WHERE file_ref = ?
              ORDER BY is_active DESC, full_name ASC",
            [$file_ref]
        );
        json_ok(['data' => $rows], "User linked to safety file");
    }

    require_fields($b, ['file_ref', 'full_name', 'role']);

    $file_ref = clean($b['file_ref'], 30);
    if (!db_row("SELECT id FROM bf_safety_files WHERE ref_id = ?", [$file_ref]))
        json_err('Safety file not found', 404);

    $role = in_array($b['role'], VALID_ROLES, true) ? $b['role'] : 'Employee';

    $new_id = db_insert(
        "INSERT INTO bf_safety_personnel
         (file_ref, full_name, id_number, role, company, email, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            $file_ref,
            clean($b['full_name'], 255),
            clean($b['id_number'] ?? '', 30),
            $role,
            clean($b['company'] ?? '', 255),
            clean($b['email'] ?? '', 255),
            $user['username'],
        ]
    );
    audit($user['username'], 'CREATE', "Personnel $new_id added to $file_ref: " . clean($b['full_name']));
    $row = db_row("SELECT * FROM bf_safety_personnel WHERE id = ?", [$new_id]);
    json_ok(['data' => $row], 'Personnel added');
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
        audit($user['username'], 'REMOVE',
            "Personnel $id ({$person['full_name']}) removed from {$person['file_ref']}: $reason");
        $row = db_row("SELECT * FROM bf_safety_personnel WHERE id = ?", [$id]);
        json_ok(['data' => $row], 'Person removed from file — record retained for audit');
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

    // Standard field update
    $sets   = [];
    $params = [];
    if (array_key_exists('full_name', $b)) { $sets[] = 'full_name = ?'; $params[] = clean($b['full_name'], 255); }
    if (array_key_exists('id_number', $b)) { $sets[] = 'id_number = ?'; $params[] = clean($b['id_number'], 30); }
    if (array_key_exists('role', $b) && in_array($b['role'], VALID_ROLES, true)) {
        $sets[] = 'role = ?'; $params[] = $b['role'];
    }
    if (array_key_exists('company', $b)) { $sets[] = 'company = ?'; $params[] = clean($b['company'], 255); }
    if (array_key_exists('email', $b))   { $sets[] = 'email = ?';   $params[] = clean($b['email'], 255); }

    if ($sets) {
        $params[] = $id;
        db_exec("UPDATE bf_safety_personnel SET " . implode(', ', $sets) . " WHERE id = ?", $params);
        audit($user['username'], 'UPDATE', "Personnel $id updated on {$person['file_ref']}");
    }
    $row = db_row("SELECT * FROM bf_safety_personnel WHERE id = ?", [$id]);
    json_ok(['data' => $row], 'Person updated');
}

/* ── DELETE hard-delete / unlink_user ─────────────────── */
if ($method === 'DELETE') {
    $action = clean($_GET['action'] ?? '', 30);

    /* ── sub-action: unlink portal user ───────────────── */
    if ($action === 'unlink_user') {
        $file_ref = clean($_GET['file_ref'] ?? '', 30);
        $uid      = (int)($_GET['user_id'] ?? 0);
        if (!$file_ref || !$uid) json_err('Missing file_ref or user_id');

        $prs = db_row(
            "SELECT id FROM bf_safety_personnel
             WHERE file_ref = ? AND portal_user_id = ? AND is_active = 1",
            [$file_ref, $uid]
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
            "Portal user " . ($pu['name'] ?? "#$uid") . " unlinked from $file_ref");
        json_ok([], 'User unlinked from safety file');
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
