<?php
ob_start();
/**
 * Umlilo Portal — Compliance Records API
 *
 * GET    /api/safety_compliance.php?file_ref=SAF-xxx       → list compliance for a file
 * GET    /api/safety_compliance.php?action=due_soon        → cross-file items expiring within 60 days
 * POST   /api/safety_compliance.php                        → add compliance record
 * PUT    /api/safety_compliance.php?id=123                 → update record
 * DELETE /api/safety_compliance.php?id=123                 → delete record
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

const VALID_CATEGORIES = ['Induction','Certification','Submission','Permit','Policy','Other'];
const VALID_SCOPES     = ['Person','Company'];

/* ── GET ──────────────────────────────────────────────── */
if ($method === 'GET') {
    $action = clean($_GET['action'] ?? '', 30);

    if ($action === 'due_soon') {
        // Cross-file: items expiring within 60 days or already expired
        $rows = db_select(
            "SELECT c.*, u.name AS person_name, u.role AS person_role, f.contractor
               FROM bf_safety_compliance c
               LEFT JOIN bf_safety_personnel p ON c.personnel_id = p.id
               LEFT JOIN bf_users u            ON u.id = p.user_id
               LEFT JOIN bf_safety_files f     ON c.file_ref = f.ref_id
              WHERE c.expiry_date IS NOT NULL
                AND c.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
              ORDER BY c.expiry_date ASC
              LIMIT 200"
        );
        json_ok(['data' => $rows]);
    }

    $file_ref = clean($_GET['file_ref'] ?? '', 30);
    if (!$file_ref) json_err('Missing file_ref or action');

    $rows = db_select(
        "SELECT c.*, u.name AS person_name, u.role AS person_role,
                a.id AS att_id, a.original_name AS att_name,
                a.file_size AS att_size, a.mime_type AS att_mime
           FROM bf_safety_compliance c
           LEFT JOIN bf_safety_personnel p ON c.personnel_id = p.id
           LEFT JOIN bf_users u            ON u.id = p.user_id
           LEFT JOIN bf_attachments a
                  ON a.entity_type = 'safety_compliance'
                 AND a.entity_ref  = CAST(c.id AS CHAR)
          WHERE c.file_ref = ?
          ORDER BY c.scope DESC, c.compliance_type ASC, c.expiry_date ASC",
        [$file_ref]
    );
    json_ok(['data' => $rows]);
}

/* ── POST create ──────────────────────────────────────── */
if ($method === 'POST') {
    $b = get_body();
    require_fields($b, ['file_ref', 'compliance_type', 'category', 'scope']);

    $file_ref = clean($b['file_ref'], 30);
    if (!db_row("SELECT id FROM bf_safety_files WHERE ref_id = ?", [$file_ref]))
        json_err('Safety file not found', 404);

    $category = in_array($b['category'], VALID_CATEGORIES, true) ? $b['category'] : 'Other';
    $scope    = in_array($b['scope'],    VALID_SCOPES,     true) ? $b['scope']    : 'Person';

    $personnel_id = null;
    if (!empty($b['personnel_id'])) {
        $pid = (int)$b['personnel_id'];
        if ($pid && db_row(
            "SELECT id FROM bf_safety_personnel WHERE id = ? AND file_ref = ?",
            [$pid, $file_ref]
        )) {
            $personnel_id = $pid;
        }
    }

    $issue_date  = (!empty($b['issue_date'])  && valid_date($b['issue_date']))  ? $b['issue_date']  : null;
    $expiry_date = (!empty($b['expiry_date']) && valid_date($b['expiry_date'])) ? $b['expiry_date'] : null;

    $new_id = db_insert(
        "INSERT INTO bf_safety_compliance
         (file_ref, personnel_id, compliance_type, category, scope,
          issue_date, expiry_date, renewal_months, document_ref, notes, created_by_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            $file_ref,
            $personnel_id,
            clean($b['compliance_type'], 100),
            $category,
            $scope,
            $issue_date,
            $expiry_date,
            max(0, (int)($b['renewal_months'] ?? 12)),
            clean($b['document_ref'] ?? '', 255),
            clean($b['notes'] ?? '', 2000),
            $user['id'],
        ]
    );
    audit($user['username'], 'CREATE',
        "Compliance record $new_id added to $file_ref: " . clean($b['compliance_type']));

    $rows = db_select(
        "SELECT c.*, u.name AS person_name, u.role AS person_role
           FROM bf_safety_compliance c
           LEFT JOIN bf_safety_personnel p ON c.personnel_id = p.id
           LEFT JOIN bf_users u            ON u.id = p.user_id
          WHERE c.id = ?",
        [$new_id]
    );
    json_ok(['data' => $rows[0] ?? []], 'Compliance record added');
}

/* ── PUT update ───────────────────────────────────────── */
if ($method === 'PUT') {
    if (!$id) json_err('Missing id');
    $rec = db_row("SELECT * FROM bf_safety_compliance WHERE id = ?", [$id]);
    if (!$rec) json_err('Record not found', 404);

    $b      = get_body();
    $sets   = ['updated_by_id = ?'];
    $params = [$user['id']];

    if (array_key_exists('compliance_type', $b)) {
        $sets[] = 'compliance_type = ?'; $params[] = clean($b['compliance_type'], 100);
    }
    if (array_key_exists('category', $b) && in_array($b['category'], VALID_CATEGORIES, true)) {
        $sets[] = 'category = ?'; $params[] = $b['category'];
    }
    if (array_key_exists('scope', $b) && in_array($b['scope'], VALID_SCOPES, true)) {
        $sets[] = 'scope = ?'; $params[] = $b['scope'];
    }
    if (array_key_exists('issue_date', $b)) {
        $sets[] = 'issue_date = ?';
        $params[] = (!empty($b['issue_date']) && valid_date($b['issue_date'])) ? $b['issue_date'] : null;
    }
    if (array_key_exists('expiry_date', $b)) {
        $sets[] = 'expiry_date = ?';
        $params[] = (!empty($b['expiry_date']) && valid_date($b['expiry_date'])) ? $b['expiry_date'] : null;
    }
    if (array_key_exists('renewal_months', $b)) {
        $sets[] = 'renewal_months = ?'; $params[] = max(0, (int)$b['renewal_months']);
    }
    if (array_key_exists('document_ref', $b)) {
        $sets[] = 'document_ref = ?'; $params[] = clean($b['document_ref'], 255);
    }
    if (array_key_exists('notes', $b)) {
        $sets[] = 'notes = ?'; $params[] = clean($b['notes'], 2000);
    }

    $params[] = $id;
    db_exec("UPDATE bf_safety_compliance SET " . implode(', ', $sets) . " WHERE id = ?", $params);
    audit($user['username'], 'UPDATE', "Compliance record $id updated on {$rec['file_ref']}");

    $rows = db_select(
        "SELECT c.*, u.name AS person_name, u.role AS person_role
           FROM bf_safety_compliance c
           LEFT JOIN bf_safety_personnel p ON c.personnel_id = p.id
           LEFT JOIN bf_users u            ON u.id = p.user_id
          WHERE c.id = ?",
        [$id]
    );
    json_ok(['data' => $rows[0] ?? []], 'Record updated');
}

/* ── DELETE ───────────────────────────────────────────── */
if ($method === 'DELETE') {
    if (!$id) json_err('Missing id');
    $rec = db_row("SELECT * FROM bf_safety_compliance WHERE id = ?", [$id]);
    if (!$rec) json_err('Record not found', 404);

    // Cascade: remove the attached document (one-per-record enforced at upload)
    $att = db_row(
        "SELECT id, stored_name FROM bf_attachments
          WHERE entity_type = 'safety_compliance' AND entity_ref = ?",
        [(string)$id]
    );
    if ($att) {
        $disk = dirname(__DIR__) . '/uploads/attachments/' . $att['stored_name'];
        if (file_exists($disk)) unlink($disk);
        db_exec("DELETE FROM bf_attachments WHERE id = ?", [$att['id']]);
    }

    db_exec("DELETE FROM bf_safety_compliance WHERE id = ?", [$id]);
    audit($user['username'], 'DELETE', "Compliance record $id deleted from {$rec['file_ref']}");
    json_ok([], 'Record deleted');
}

json_err('Method not allowed', 405);
