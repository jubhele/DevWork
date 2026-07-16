<?php
ob_start();
/**
 * Umlilo Portal — File Attachments API
 *
 * GET    ?action=list&entity_type=callout&entity_ref=CO-2024-0001  → list attachments
 * GET    ?action=download&id=123                                   → stream file download
 * POST   multipart: entity_type, entity_ref, file                 → upload
 * DELETE ?id=123                                                   → delete
 *
 * Files are stored on disk at uploads/attachments/<stored_name>.
 * DB stores metadata only (path, original name, uploader, size).
 * Accepted types: PDF, Excel (.xlsx/.xls), Word (.docx/.doc), JPEG, PNG.
 * Max size: 10 MB.
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/tracker_records.php';
require_once __DIR__ . '/../includes/file_storage.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Must be before require_auth() so 401 responses have Content-Type: application/json.
// The download success path overwrites Content-Type with the file's mime type at line 86.
api_headers();

$user = require_auth();

const ALLOWED_TYPES = [
    'application/pdf'                                                          => 'pdf',
    'application/vnd.ms-excel'                                                 => 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'       => 'xlsx',
    'application/msword'                                                       => 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    'image/jpeg'                                                               => 'jpg',
    'image/png'                                                                => 'png',
];

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function attachment_can_view(array $user, array $attachment): bool {
    if (in_array($attachment['entity_type'], ['task', 'callout'], true)) {
        $record = tracker_record($attachment['entity_type'], $attachment['entity_ref']);
        return $record && tracker_can_view($user, $attachment['entity_type'], $record);
    }
    $perm_map = [
        'quote'             => 'quote.view',
        'invoice'           => 'invoice.view',
        'payment'           => 'invoice.view',
        'safety_file'       => 'safety.view',
        'safety_compliance' => 'safety.view',
        'safety_item'       => 'safety.view',
    ];
    if (isset($perm_map[$attachment['entity_type']]) && can($perm_map[$attachment['entity_type']])) {
        return true;
    }
    $roles = task_user_roles($user);
    return count(array_intersect($roles, ['sysadmin', 'admin', 'manager'])) > 0
        || (int)($attachment['uploaded_by_id'] ?? 0) === (int)$user['id'];
}

// ── GET list ──────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'list') {
    $entity_type = clean($_GET['entity_type'] ?? '', 20);
    $entity_ref  = clean($_GET['entity_ref']  ?? '', 50);
    if (!$entity_type || !$entity_ref) json_err('entity_type and entity_ref required');

    if (in_array($entity_type, ['task', 'callout'], true)) {
        $record = tracker_record($entity_type, $entity_ref);
        if (!$record) json_err('Tracker record not found', 404);
        if (!tracker_can_view($user, $entity_type, $record)) json_err('Permission denied', 403);
    } else {
        $perm_map = [
            'quote'             => 'quote.view',
            'invoice'           => 'invoice.view',
            'payment'           => 'invoice.view',
            'safety_file'       => 'safety.view',
            'safety_compliance' => 'safety.view',
            'safety_item'       => 'safety.view',
        ];
        if (isset($perm_map[$entity_type]) && !can($perm_map[$entity_type])) json_err('Permission denied', 403);
    }

    api_headers();
    $rows = db_select(
        "SELECT f.id, f.original_name, f.stored_name, f.file_size, f.mime_type,
                COALESCE(u.username, '') AS uploaded_by, f.created_at
           FROM bf_attachments f
           LEFT JOIN bf_users u ON u.id = f.uploaded_by_id
          WHERE f.entity_type = ? AND f.entity_ref = ?
          ORDER BY f.created_at DESC",
        [$entity_type, $entity_ref]
    );
    foreach ($rows as &$row) {
        $row['view_url'] = 'api/files.php?action=view&id=' . (int)$row['id'];
        $row['download_url'] = 'api/files.php?action=download&id=' . (int)$row['id'];
        $row['direct_url'] = bf_attachment_url($row['stored_name'] ?? '');
        unset($row['stored_name']);
    }
    json_ok(['attachments' => $rows]);
}

// ── GET download / view ───────────────────────────────────────────────
if ($method === 'GET' && ($action === 'download' || $action === 'view')) {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) { api_headers(); json_err('id required'); }

    $row = db_row("SELECT * FROM bf_attachments WHERE id = ?", [$id]);
    if (!$row) { api_headers(); json_err('File not found', 404); }

    if (!attachment_can_view($user, $row)) {
        api_headers(); json_err('Permission denied', 403);
    }

    $path = bf_attachment_disk_path($row['stored_name']);
    if (!file_exists($path)) { api_headers(); json_err('File not on disk', 404); }

    // Flush output buffers — we're streaming binary, not JSON
    while (ob_get_level()) ob_end_clean();

    $safe_name = str_replace(['"', '\\'], ['', ''], $row['original_name']);
    $inline_types = ['application/pdf', 'image/jpeg', 'image/png'];
    $disposition  = ($action === 'view' && in_array($row['mime_type'], $inline_types, true))
                    ? 'inline'
                    : 'attachment';
    header('Content-Type: ' . $row['mime_type']);
    header('Content-Disposition: ' . $disposition . '; filename="' . $safe_name . '"');
    header('Content-Length: ' . filesize($path));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, no-cache');
    // Allow same-origin iframe embedding for the inline document viewer
    if ($action === 'view') {
        header('X-Frame-Options: SAMEORIGIN');
        header('Content-Security-Policy: default-src \'self\'');
    }
    readfile($path);
    exit;
}

// ── POST upload ───────────────────────────────────────────────────────
if ($method === 'POST') {
    api_headers();

    $entity_type = clean($_POST['entity_type'] ?? '', 20);
    $entity_ref  = clean($_POST['entity_ref']  ?? '', 50);

    if (!in_array($entity_type, ['task', 'callout', 'invoice', 'quote', 'payment', 'safety_file', 'safety_compliance', 'safety_item'], true)) {
        json_err('Invalid entity_type');
    }
    if (!$entity_ref) json_err('entity_ref required');

    // safety_compliance records use an integer PK, all others use ref_id
    if ($entity_type === 'safety_compliance') {
        $rec_id = (int)$entity_ref;
        if (!$rec_id || !db_row("SELECT id FROM bf_safety_compliance WHERE id = ?", [$rec_id])) {
            json_err('Compliance record not found', 404);
        }
        // One document per compliance record — prevents stacking multiple certs on the same entry
        $existing = (int)(db_row(
            "SELECT COUNT(*) AS n FROM bf_attachments WHERE entity_type = 'safety_compliance' AND entity_ref = ?",
            [$entity_ref]
        )['n'] ?? 0);
        if ($existing > 0) {
            json_err('A document is already attached to this record. Remove it first to replace it.');
        }
    } elseif ($entity_type === 'safety_item') {
        // entity_ref format: {file_ref}:{section_key}:{item_no}  e.g. SAF-001:H:12
        $parts = explode(':', $entity_ref, 3);
        if (count($parts) !== 3) json_err('Invalid safety_item ref — expected {file_ref}:{section}:{item_no}');
        [$si_ref, $si_sec, $si_no_str] = $parts;
        $si_no = (int)$si_no_str;
        if (!db_row("SELECT id FROM bf_safety_files WHERE ref_id = ? AND is_active = 1", [$si_ref])) {
            json_err('Safety file not found', 404);
        }
        if (!db_row("SELECT id FROM bf_safety_items WHERE file_ref = ? AND section_key = ? AND item_no = ?",
                    [$si_ref, strtoupper($si_sec), $si_no])) {
            json_err('Safety item not found', 404);
        }
    } else {
        $entity_table_map = [
            'task'        => 'bf_tasks',
            'callout'     => 'bf_callouts',
            'invoice'     => 'bf_invoices',
            'quote'       => 'bf_quotes',
            'payment'     => 'bf_payments',
            'safety_file' => 'bf_safety_files',
        ];
        $entity_table = $entity_table_map[$entity_type];
        $entity_ref_column = $entity_type === 'payment' ? 'payment_ref' : 'ref_id';
        if (!db_row("SELECT id FROM {$entity_table} WHERE {$entity_ref_column} = ?", [$entity_ref])) {
            json_err(ucfirst($entity_type) . ' not found', 404);
        }
    }

    if (in_array($entity_type, ['task', 'callout'], true)) {
        $record = tracker_record($entity_type, $entity_ref);
        if (!$record || !tracker_can_edit($user, $entity_type, $record)) json_err('Permission denied', 403);
    } else {
        $upload_perm_map = [
            'quote'             => ['quote.create', 'quote.update'],
            'invoice'           => ['invoice.create'],
            'payment'           => ['capture.log_payment'],
            'safety_file'       => ['safety.create', 'safety.update'],
            'safety_compliance' => ['safety.create', 'safety.update'],
            'safety_item'       => ['safety.create', 'safety.update'],
        ];
        $allowed = false;
        foreach ($upload_perm_map[$entity_type] ?? [] as $permission) {
            if (can($permission)) {
                $allowed = true;
                break;
            }
        }
        if (!$allowed) json_err('Permission denied', 403);
    }

    if (empty($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
        json_err('No file uploaded');
    }

    $f = $_FILES['file'];
    if ($f['error'] !== UPLOAD_ERR_OK) {
        $msgs = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit',
            UPLOAD_ERR_FORM_SIZE  => 'File too large',
            UPLOAD_ERR_PARTIAL    => 'Upload incomplete',
            UPLOAD_ERR_NO_TMP_DIR => 'No temp directory',
            UPLOAD_ERR_CANT_WRITE => 'Cannot write to disk',
        ];
        json_err($msgs[$f['error']] ?? 'Upload error ' . $f['error']);
    }

    if ($f['size'] > MAX_BYTES) json_err('File too large — max 10 MB');

    // Detect real MIME via finfo (never trust $_FILES['type'])
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($f['tmp_name']);
    if (!array_key_exists($mime, ALLOWED_TYPES)) {
        json_err('File type not allowed. Accepted: PDF, Excel, Word, JPEG, PNG');
    }

    $ext    = ALLOWED_TYPES[$mime];
    $stored = bin2hex(random_bytes(16)) . '.' . $ext; // random, unguessable name
    $dir    = bf_upload_dir();
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        json_err('Cannot create upload directory');
    }

    if (!move_uploaded_file($f['tmp_name'], $dir . '/' . $stored)) {
        json_err('Failed to save file');
    }

    $att_id = db_insert(
        "INSERT INTO bf_attachments (entity_type, entity_ref, original_name, stored_name, file_size, mime_type, uploaded_by_id)
         VALUES (?,?,?,?,?,?,?)",
        [$entity_type, $entity_ref, basename($f['name']), $stored, (int)$f['size'], $mime, (int)$user['id']]
    );

    audit($user['username'], 'FILE_UPLOAD',
          "Attached " . basename($f['name']) . " to $entity_type $entity_ref");

    json_ok([
        'attachment' => [
            'id'            => $att_id,
            'original_name' => basename($f['name']),
            'file_size'     => (int)$f['size'],
            'mime_type'     => $mime,
            'view_url'      => 'api/files.php?action=view&id=' . (int)$att_id,
            'download_url'  => 'api/files.php?action=download&id=' . (int)$att_id,
            'direct_url'    => bf_attachment_url($stored),
            'uploaded_by'   => $user['username'],
            'created_at'    => date('Y-m-d H:i:s'),
        ]
    ], 'File uploaded');
}

// ── DELETE ────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    api_headers();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_err('id required');

    $row = db_row("SELECT * FROM bf_attachments WHERE id = ?", [$id]);
    if (!$row) json_err('File not found', 404);

    $roles = task_user_roles($user);
    if (count(array_intersect($roles, ['sysadmin', 'admin', 'manager'])) === 0
        && (int)($row['uploaded_by_id'] ?? 0) !== (int)$user['id']) {
        json_err('Permission denied', 403);
    }

    $path = bf_attachment_disk_path($row['stored_name']);
    if (file_exists($path)) unlink($path);
    db_exec("DELETE FROM bf_attachments WHERE id = ?", [$id]);

    audit($user['username'], 'FILE_DELETE',
          "Deleted {$row['original_name']} from {$row['entity_type']} {$row['entity_ref']}");

    json_ok([], 'File deleted');
}

api_headers();
json_err('Unknown action or method', 404);
