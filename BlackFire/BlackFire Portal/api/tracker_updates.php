<?php
ob_start();

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/tracker_records.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$entity_type = clean($_GET['entity_type'] ?? '', 20);
$entity_ref = clean($_GET['entity_ref'] ?? '', 50);

if ($method === 'GET' && ($_GET['action'] ?? '') === 'revisions') {
    $id = (int)($_GET['id'] ?? 0);
    $update = db_row("SELECT * FROM bf_tracker_updates WHERE id = ?", [$id]);
    if (!$update) json_err('Description record not found', 404);
    $record = tracker_record($update['entity_type'], $update['entity_ref']);
    if (!$record || !tracker_can_view($user, $update['entity_type'], $record)) json_err('Forbidden', 403);
    $rows = db_select(
        "SELECT id, old_label, old_content, new_label, new_content, edited_by, edited_at
         FROM bf_tracker_update_revisions WHERE tracker_update_id = ? ORDER BY edited_at DESC",
        [$id]
    );
    json_ok(['data' => $rows]);
}

if ($method === 'GET') {
    if (!$entity_type || !$entity_ref) json_err('entity_type and entity_ref required');
    $record = tracker_record($entity_type, $entity_ref);
    if (!$record) json_err('Tracker record not found', 404);
    if (!tracker_can_view($user, $entity_type, $record)) json_err('Forbidden', 403);
    $rows = db_select(
        "SELECT u.id, u.label, u.content, u.source_kind, u.created_by, u.updated_by,
                u.created_at, u.updated_at,
                (SELECT COUNT(*) FROM bf_tracker_update_revisions r WHERE r.tracker_update_id = u.id) AS revision_count
         FROM bf_tracker_updates u
         WHERE u.entity_type = ? AND u.entity_ref = ?
         ORDER BY u.created_at ASC, u.id ASC",
        [$entity_type, $entity_ref]
    );
    json_ok(['data' => $rows]);
}

if ($method === 'POST') {
    $body = get_body();
    $entity_type = clean($body['entity_type'] ?? '', 20);
    $entity_ref = clean($body['entity_ref'] ?? '', 50);
    $record = tracker_record($entity_type, $entity_ref);
    if (!$record) json_err('Tracker record not found', 404);
    if (!tracker_can_edit($user, $entity_type, $record)) json_err('Forbidden', 403);

    $label = clean($body['label'] ?? '', 120);
    $content = clean($body['content'] ?? '', 10000);
    if (!$label || !$content) json_err('Label and description are required');

    $id = db_insert(
        "INSERT INTO bf_tracker_updates
         (entity_type, entity_ref, label, content, created_by_user_id, created_by)
         VALUES (?,?,?,?,?,?)",
        [$entity_type, $entity_ref, $label, $content, (int)$user['id'], $user['name']]
    );
    audit($user['username'], 'TRACKER_DESCRIPTION_CREATE',
          "Added description #{$id} '{$label}' to {$entity_type} {$entity_ref}");
    json_ok(['data' => db_row("SELECT * FROM bf_tracker_updates WHERE id = ?", [$id])], 'Description added');
}

if ($method === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    $update = db_row("SELECT * FROM bf_tracker_updates WHERE id = ?", [$id]);
    if (!$update) json_err('Description record not found', 404);
    if (strpos((string)($update['source_kind'] ?? ''), 'system_') === 0) {
        json_err('System records are immutable', 409);
    }
    $record = tracker_record($update['entity_type'], $update['entity_ref']);
    if (!$record || !tracker_can_edit($user, $update['entity_type'], $record)) json_err('Forbidden', 403);

    $body = get_body();
    $label = clean($body['label'] ?? $update['label'], 120);
    $content = clean($body['content'] ?? $update['content'], 10000);
    if (!$label || !$content) json_err('Label and description are required');
    if ($label === $update['label'] && $content === $update['content']) json_err('Nothing to update');

    db_begin();
    try {
        db_insert(
            "INSERT INTO bf_tracker_update_revisions
             (tracker_update_id, old_label, old_content, new_label, new_content, edited_by_user_id, edited_by)
             VALUES (?,?,?,?,?,?,?)",
            [$id, $update['label'], $update['content'], $label, $content, (int)$user['id'], $user['name']]
        );
        db_exec(
            "UPDATE bf_tracker_updates
             SET label = ?, content = ?, updated_by_user_id = ?, updated_by = ?
             WHERE id = ?",
            [$label, $content, (int)$user['id'], $user['name'], $id]
        );
        db_commit();
    } catch (Throwable $error) {
        db_rollback();
        json_err('Description update failed');
    }

    $label_change = $label === $update['label'] ? 'label unchanged' : "label '{$update['label']}' to '{$label}'";
    audit($user['username'], 'TRACKER_DESCRIPTION_EDIT',
          "Edited description #{$id} on {$update['entity_type']} {$update['entity_ref']} ({$label_change}); revision saved");
    json_ok(['data' => db_row("SELECT * FROM bf_tracker_updates WHERE id = ?", [$id])], 'Description updated');
}

json_err('Method not allowed', 405);

