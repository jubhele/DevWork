<?php
ob_start();
/**
 * Umlilo Portal — Contractor Safety File API (BF-SHE-FRM-010)
 *
 * GET    /api/safety.php               → list all files (summary, no items)
 * GET    /api/safety.php?id=SAF-001    → full file with all item results
 * POST   /api/safety.php               → create new file (blank items auto-created)
 * PUT    /api/safety.php?id=SAF-001    → update header, items, status
 * DELETE /api/safety.php?id=SAF-001    → delete (manager/admin only)
 *
 * Sections A–H, 75 items total.  Items stored in bf_safety_items.
 * Documents attached via files.php with entity_type='safety_file', entity_ref=<ref_id>.
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
$ref_id = clean($_GET['id'] ?? '', 30);

/* ── Helpers ───────────────────────────────────────── */

/** Full item map: section_key → count (matches SAFETY_SECTIONS in JS) */
const SECTION_COUNTS = [
    'A' => 9,
    'B' => 7,
    'C' => 2,
    'D' => 6,
    'E' => 12,
    'F' => 3,
    'G' => 3,
    'H' => 34,
    'I' => 10,   // Bonus section — Advanced & Best Practice
];

/** Bonus sections contribute up to +10% on top of the main 100% score */
const BONUS_SECTIONS = ['I'];

function calc_score(string $ref_id): ?float {
    $items = db_select(
        "SELECT section_key, result FROM bf_safety_items WHERE file_ref = ?",
        [$ref_id]
    );
    if (!$items) return null;

    $main_total = $main_na = $main_std = 0;
    $bonus_total = $bonus_na = $bonus_std = 0;

    foreach ($items as $row) {
        if (in_array($row['section_key'], BONUS_SECTIONS, true)) {
            $bonus_total++;
            if ($row['result'] === 'N/A')          $bonus_na++;
            elseif ($row['result'] === 'To Standard') $bonus_std++;
        } else {
            $main_total++;
            if ($row['result'] === 'N/A')          $main_na++;
            elseif ($row['result'] === 'To Standard') $main_std++;
        }
    }

    $main_applicable  = $main_total  - $main_na;
    $bonus_applicable = $bonus_total - $bonus_na;
    if (!$main_applicable) return null;

    $main_score  = ($main_std  / $main_applicable)  * 100;
    $bonus_score = $bonus_applicable ? ($bonus_std / $bonus_applicable) * 10 : 0;
    return round($main_score + $bonus_score, 2);
}

function calc_band(?float $score): ?string {
    if ($score === null) return null;
    if ($score >= 89) return 'GREEN';
    if ($score >= 74) return 'YELLOW';
    if ($score >= 50) return 'ORANGE';
    return 'RED';
}

function insert_blank_items(string $ref_id): void {
    foreach (SECTION_COUNTS as $sec => $count) {
        for ($i = 1; $i <= $count; $i++) {
            db_exec(
                "INSERT IGNORE INTO bf_safety_items (file_ref, section_key, item_no)
                 VALUES (?, ?, ?)",
                [$ref_id, $sec, $i]
            );
        }
    }
}

function build_sections(string $ref_id): array {
    $rows = db_select(
        "SELECT section_key, item_no, result, appointee, comments, ap_status
           FROM bf_safety_items
          WHERE file_ref = ?
          ORDER BY section_key, item_no",
        [$ref_id]
    );
    $sections = [];
    foreach (SECTION_COUNTS as $sec => $count) {
        $sections[$sec] = array_fill(0, $count, null);
    }
    foreach ($rows as $r) {
        $sec = $r['section_key'];
        $idx = (int)$r['item_no'] - 1;
        if (isset($sections[$sec])) {
            $sections[$sec][$idx] = [
                'no'        => (int)$r['item_no'],
                'result'    => $r['result'],
                'appointee' => $r['appointee'] ?? '',
                'comments'  => $r['comments']  ?? '',
                'ap_status' => $r['ap_status']  ?? 'Open',
                'uploads'   => [],
            ];
        }
    }
    // Fill nulls with blank items (handles missing rows gracefully)
    foreach ($sections as $sec => &$items) {
        foreach ($items as $idx => &$item) {
            if ($item === null) {
                $item = ['no' => $idx + 1, 'result' => null, 'appointee' => '',
                         'comments' => '', 'ap_status' => 'Open', 'uploads' => []];
            }
        }
    }

    // Load per-item evidence from bf_attachments (entity_ref = "{file_ref}:{sec}:{no}")
    try {
        $atts = db_select(
            "SELECT id, entity_ref, original_name, file_size, mime_type, uploaded_by, created_at
               FROM bf_attachments
              WHERE entity_type = 'safety_item' AND entity_ref LIKE ?",
            [$ref_id . ':%']
        );
        foreach ($atts as $att) {
            $parts = explode(':', $att['entity_ref'], 3);
            if (count($parts) !== 3) continue;
            [, $sec, $no_str] = $parts;
            $no  = (int)$no_str;
            $idx = $no - 1;
            if (isset($sections[$sec][$idx])) {
                $sections[$sec][$idx]['uploads'][] = [
                    'id'            => (int)$att['id'],
                    'original_name' => $att['original_name'],
                    'file_size'     => (int)$att['file_size'],
                    'mime_type'     => $att['mime_type'],
                    'uploaded_by'   => $att['uploaded_by'],
                    'created_at'    => $att['created_at'],
                ];
            }
        }
    } catch (\Exception $e) {
        // bf_attachments missing in older installs — uploads stay empty
    }

    return $sections;
}


/* ── GET list ──────────────────────────────────────── */
if ($method === 'GET' && !$ref_id) {
    $pg = get_pagination();
    $q  = clean($_GET['q'] ?? '', 100);
    $st = clean($_GET['status'] ?? '', 30);

    $where  = '1=1';
    $params = [];

    if ($q) {
        $like = '%' . like_escape($q) . '%';
        $where .= ' AND (ref_id LIKE ? ESCAPE \'\\\\\' OR contractor LIKE ? ESCAPE \'\\\\\')';
        array_push($params, $like, $like);
    }
    if ($st) {
        $where .= ' AND status = ?';
        $params[] = $st;
    }

    $where = 'f.is_active = 1 AND ' . $where;
    $total = db_row("SELECT COUNT(*) AS n FROM bf_safety_files f WHERE $where", $params)['n'] ?? 0;
    $rows  = db_select(
        "SELECT f.*,
                SUM(CASE WHEN i.result = 'To Standard'     THEN 1 ELSE 0 END) AS to_std_count,
                SUM(CASE WHEN i.result = 'Not to Standard' THEN 1 ELSE 0 END) AS not_std_count,
                SUM(CASE WHEN i.result = 'N/A'             THEN 1 ELSE 0 END) AS na_count
           FROM bf_safety_files f
           LEFT JOIN bf_safety_items i ON i.file_ref = f.ref_id
          WHERE $where
          GROUP BY f.id
          ORDER BY f.updated_at DESC
          LIMIT {$pg['limit']} OFFSET {$pg['offset']}",
        $params
    );

    json_ok(['data' => $rows, 'total' => (int)$total]);
}

/* ── GET single (full, with items) ─────────────────── */
if ($method === 'GET' && $ref_id) {
    $file = db_row("SELECT * FROM bf_safety_files WHERE ref_id = ? AND is_active = 1", [$ref_id]);
    if (!$file) json_err('Safety file not found', 404);

    $file['sections'] = build_sections($ref_id);
    json_ok(['data' => $file]);
}

/* ── POST create ────────────────────────────────────── */
if ($method === 'POST') {
    require_perm('safety.create');
    $b = get_body();
    require_fields($b, ['contractor']);

    $ref = next_ref_id('saf');

    db_insert(
        "INSERT INTO bf_safety_files
         (ref_id, contractor, contractor_rep, appointee162, audit_date, region,
          audit_team, scope_of_work, manpower, supervisors, she_reps, first_aiders,
          auditor_name, sign_off_date, status, created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            $ref,
            clean($b['contractor']),
            clean($b['contractor_rep']  ?? ''),
            clean($b['appointee162']    ?? ''),
            ($b['audit_date'] && valid_date($b['audit_date'])) ? $b['audit_date'] : null,
            clean($b['region']          ?? ''),
            clean($b['audit_team']      ?? ''),
            clean($b['scope_of_work']   ?? '', 2000),
            max(0, (int)($b['manpower']    ?? 0)),
            max(0, (int)($b['supervisors'] ?? 0)),
            max(0, (int)($b['she_reps']    ?? 0)),
            max(0, (int)($b['first_aiders']?? 0)),
            clean($b['auditor_name']    ?? ''),
            ($b['sign_off_date'] && valid_date($b['sign_off_date'])) ? $b['sign_off_date'] : null,
            clean($b['status'] ?? 'Draft'),
            $user['username'],
        ]
    );

    insert_blank_items($ref);

    // Optionally save items if sent with creation
    if (!empty($b['sections']) && is_array($b['sections'])) {
        _upsert_items($ref, $b['sections']);
    }

    $score = calc_score($ref);
    db_exec("UPDATE bf_safety_files SET score = ?, band = ? WHERE ref_id = ?", [$score, calc_band($score), $ref]);

    audit($user['username'], 'CREATE', "Safety file $ref created for " . clean($b['contractor']));

    $file = db_row("SELECT * FROM bf_safety_files WHERE ref_id = ?", [$ref]);
    $file['sections'] = build_sections($ref);
    json_ok(['data' => $file], "Safety file $ref created");
}

/* ── PUT update ─────────────────────────────────────── */
if ($method === 'PUT') {
    require_perm('safety.update');
    if (!$ref_id) json_err('Missing id');
    $file = db_row("SELECT * FROM bf_safety_files WHERE ref_id = ?", [$ref_id]);
    if (!$file) json_err('Safety file not found', 404);

    $b      = get_body();
    $action = clean($b['action'] ?? '', 50);

    /* ── sub-action: send policy email ───────────── */
    if ($action === 'send_policy_email') {
        require_once __DIR__ . '/../includes/mailer.php';
        $to = clean($b['policy_email_to'] ?? '', 255);
        if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) json_err('Valid email required');

        $ref_doc = clean($b['policy_ref'] ?? 'BF-SHE-FRM-010 — Contractor Safety File Checklist Rev 01', 255);
        $extra   = clean($b['message']    ?? '', 2000);

        $sent = send_safety_policy_email($to, $file, $ref_doc, $extra);
        if (!$sent) json_err('Failed to send email — check SMTP configuration');

        db_exec(
            "UPDATE bf_safety_files
             SET policy_email_sent = 1, policy_email_date = CURDATE(), policy_email_to = ?,
                 updated_by = ?
             WHERE ref_id = ?",
            [$to, $user['username'], $ref_id]
        );
        audit($user['username'], 'POLICY_EMAIL', "Policy acknowledgment email sent for $ref_id to $to");
        $row = db_row("SELECT * FROM bf_safety_files WHERE ref_id = ?", [$ref_id]);
        json_ok(['data' => $row], "Policy email sent to $to");
    }

    /* ── sub-action: update_ap_status ───────────── */
    if ($action === 'update_ap_status') {
        require_fields($b, ['section_key', 'item_no', 'ap_status']);
        $sec = strtoupper(clean($b['section_key'], 2));
        $no  = max(1, (int)$b['item_no']);
        $ap  = in_array($b['ap_status'], ['Open', 'In Progress', 'Resolved'], true)
               ? $b['ap_status'] : 'Open';
        if (!isset(SECTION_COUNTS[$sec])) json_err('Invalid section_key');
        $row = db_row(
            "SELECT id FROM bf_safety_items WHERE file_ref=? AND section_key=? AND item_no=?",
            [$ref_id, $sec, $no]
        );
        if (!$row) json_err('Item not found', 404);
        db_exec(
            "UPDATE bf_safety_items SET ap_status=? WHERE file_ref=? AND section_key=? AND item_no=?",
            [$ap, $ref_id, $sec, $no]
        );
        audit($user['username'], 'AP_STATUS',
              "Action plan $ref_id $sec.$no → $ap");
        json_ok(['ap_status' => $ap], 'Action plan status updated');
    }

    /* ── sub-action: update_appointee ───────────── */
    if ($action === 'update_appointee') {
        require_perm('safety.update');
        require_fields($b, ['section_key', 'item_no']);
        $sec = strtoupper(clean($b['section_key'], 2));
        $no  = max(1, (int)$b['item_no']);
        if (!isset(SECTION_COUNTS[$sec])) json_err('Invalid section_key');
        $row = db_row(
            "SELECT id FROM bf_safety_items WHERE file_ref=? AND section_key=? AND item_no=?",
            [$ref_id, $sec, $no]
        );
        if (!$row) json_err('Item not found', 404);

        $sets   = ['updated_at = NOW()'];
        $params = [];

        if (array_key_exists('appointee', $b)) {
            $sets[]   = 'appointee = ?';
            $params[] = clean($b['appointee'], 100);
        }
        if (array_key_exists('comments', $b)) {
            $sets[]   = 'comments = ?';
            $params[] = clean($b['comments'], 2000);
        }
        if (empty($params)) json_err('Nothing to update');

        $params[] = $ref_id; $params[] = $sec; $params[] = $no;
        db_exec(
            "UPDATE bf_safety_items SET " . implode(', ', $sets) .
            " WHERE file_ref=? AND section_key=? AND item_no=?",
            $params
        );
        audit($user['username'], 'UPDATE_ITEM',
              "Item $ref_id $sec.$no updated (appointee/comments)");
        json_ok([], 'Item updated');
    }

    /* ── sub-action: approve ─────────────────────── */
    if ($action === 'approve') {
        require_perm('safety.approve');
        $allowed = ['Submitted', 'In Progress'];
        if (!in_array($file['status'], $allowed, true)) {
            json_err('Only Submitted or In Progress files can be approved');
        }
        db_exec(
            "UPDATE bf_safety_files SET status = 'Approved', updated_by = ? WHERE ref_id = ?",
            [$user['username'], $ref_id]
        );
        audit($user['username'], 'APPROVE', "Safety file $ref_id approved");
        $row = db_row("SELECT * FROM bf_safety_files WHERE ref_id = ?", [$ref_id]);
        json_ok(['data' => $row], "Safety file $ref_id approved");
    }

    /* ── standard update ────────────────────────── */
    require_perm('safety.update');
    $header_fields = [
        'contractor', 'contractor_rep', 'appointee162', 'audit_date', 'region',
        'audit_team', 'scope_of_work', 'manpower', 'supervisors', 'she_reps',
        'first_aiders', 'auditor_name', 'sign_off_date', 'status',
    ];

    $sets   = ['updated_by = ?'];
    $params = [$user['username']];

    foreach ($header_fields as $field) {
        if (!array_key_exists($field, $b)) continue;
        if (in_array($field, ['audit_date', 'sign_off_date'])) {
            $sets[]   = "$field = ?";
            $params[] = ($b[$field] && valid_date($b[$field])) ? $b[$field] : null;
        } elseif (in_array($field, ['manpower', 'supervisors', 'she_reps', 'first_aiders'])) {
            $sets[]   = "$field = ?";
            $params[] = max(0, (int)$b[$field]);
        } else {
            $sets[]   = "$field = ?";
            $params[] = clean($b[$field], $field === 'scope_of_work' ? 2000 : 255);
        }
    }

    $params[] = $ref_id;
    db_exec("UPDATE bf_safety_files SET " . implode(', ', $sets) . " WHERE ref_id = ?", $params);

    // Upsert items if provided
    if (!empty($b['sections']) && is_array($b['sections'])) {
        _upsert_items($ref_id, $b['sections']);
    }

    $score = calc_score($ref_id);
    db_exec("UPDATE bf_safety_files SET score = ?, band = ? WHERE ref_id = ?", [$score, calc_band($score), $ref_id]);

    audit($user['username'], 'UPDATE', "Safety file $ref_id updated");

    $row = db_row("SELECT * FROM bf_safety_files WHERE ref_id = ?", [$ref_id]);
    $row['sections'] = build_sections($ref_id);
    json_ok(['data' => $row], "Safety file $ref_id updated");
}

/* ── DELETE (soft) ──────────────────────────────────── */
if ($method === 'DELETE') {
    require_perm('safety.delete');
    if (!$ref_id) json_err('Missing id');
    if (!db_row("SELECT id FROM bf_safety_files WHERE ref_id = ? AND is_active = 1", [$ref_id]))
        json_err('Safety file not found', 404);

    db_exec(
        "UPDATE bf_safety_files SET is_active = 0, updated_by = ? WHERE ref_id = ?",
        [$user['username'], $ref_id]
    );
    audit($user['username'], 'DEACTIVATE', "Safety file $ref_id deactivated (soft delete)");
    json_ok([], "Safety file $ref_id deactivated");
}

json_err('Method not allowed', 405);

/* ── Internal: upsert items ─────────────────────────── */
function _upsert_items(string $ref_id, array $sections): void {
    foreach ($sections as $sec_key => $items) {
        if (!isset(SECTION_COUNTS[$sec_key]) || !is_array($items)) continue;
        foreach ($items as $item) {
            $no     = (int)($item['no'] ?? 0);
            if (!$no) continue;
            $result = isset($item['result']) && in_array(
                $item['result'], ['N/A', 'Not to Standard', 'To Standard'], true
            ) ? $item['result'] : null;
            $ap     = isset($item['ap_status']) && in_array(
                $item['ap_status'], ['Open', 'In Progress', 'Resolved'], true
            ) ? $item['ap_status'] : 'Open';

            db_exec(
                "INSERT INTO bf_safety_items
                    (file_ref, section_key, item_no, result, appointee, comments, ap_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    result    = VALUES(result),
                    appointee = VALUES(appointee),
                    comments  = VALUES(comments),
                    ap_status = VALUES(ap_status)",
                [
                    $ref_id,
                    $sec_key,
                    $no,
                    $result,
                    clean($item['appointee'] ?? ''),
                    clean($item['comments']  ?? '', 2000),
                    $ap,
                ]
            );
        }
    }
}
