<?php
ob_start();
/**
 * Umlilo Portal — Company Tracker API
 * GET    /api/tasks.php                        → list (category required unless sysadmin/admin)
 * GET    /api/tasks.php?id=TK-ADMIN-001        → single task
 * POST   /api/tasks.php                        → create
 * PUT    /api/tasks.php?id=TK-ADMIN-001        → update
 * DELETE /api/tasks.php?id=TK-ADMIN-001        → delete
 *
 * Category→role visibility matrix (enforced server-side on every request):
 *   admin   → sysadmin, admin, admin_clerk, manager
 *   sales   → sysadmin, admin, manager
 *   general → sysadmin, admin, manager, admin_clerk, finance, safety_officer,
 *             call_logger, junior_tech, senior_tech, viewer
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/task_access.php';
require_once __DIR__ . '/../includes/tracker_records.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user   = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$ref_id = clean($_GET['id'] ?? '', 20);

// ── Category visibility matrix ─────────────────────────────────────────────

// ── Ref-ID generator ──────────────────────────────────────────────────────────
// Uses bf_task_sequences to atomically generate the next ref_id per category.

function next_task_ref(string $category): string {
    $prefix_map = ['admin' => 'TK-ADMIN', 'sales' => 'TK-SALES', 'general' => 'TK-GEN'];
    $prefix = $prefix_map[$category] ?? 'TK';

    db_exec(
        "INSERT INTO bf_task_sequences (category, last_seq) VALUES (?, 1)
         ON DUPLICATE KEY UPDATE last_seq = last_seq + 1",
        [$category]
    );
    $row = db_row("SELECT last_seq FROM bf_task_sequences WHERE category = ?", [$category]);
    $n   = (int)($row['last_seq'] ?? 1);

    return sprintf('%s-%03d', $prefix, $n);
}

// ── Multi-assignee helpers ────────────────────────────────────────────────────

function resolve_assignees(array $usernames): array {
    $result = [];
    foreach (array_unique($usernames) as $uname) {
        $uname = trim($uname);
        if ($uname === '') continue;
        $row = db_row("SELECT id, name, username FROM bf_users WHERE username = ? AND active = 1", [$uname]);
        if ($row) $result[] = $row;
    }
    return $result;
}

function sync_task_assignees(string $task_ref, array $assignees, int $actor_uid): void {
    db_exec("DELETE FROM bf_task_assignees WHERE task_ref = ?", [$task_ref]);
    foreach ($assignees as $a) {
        db_exec(
            "INSERT IGNORE INTO bf_task_assignees (task_ref, user_id, username, name, assigned_by_uid)
             VALUES (?, ?, ?, ?, ?)",
            [$task_ref, (int)$a['id'], $a['username'], $a['name'], $actor_uid]
        );
    }
}

function enrich_tasks_with_assignees(array &$tasks): void {
    if (empty($tasks)) return;
    $refs         = array_column($tasks, 'ref_id');
    $placeholders = implode(',', array_fill(0, count($refs), '?'));
    $rows = db_select(
        "SELECT task_ref, user_id, username, name
           FROM bf_task_assignees
          WHERE task_ref IN ($placeholders)
          ORDER BY name ASC",
        $refs
    );
    $by_ref = [];
    foreach ($rows as $r) {
        $by_ref[$r['task_ref']][] = ['user_id' => (int)$r['user_id'], 'username' => $r['username'], 'name' => $r['name']];
    }
    foreach ($tasks as &$t) {
        $t['assignees'] = $by_ref[$t['ref_id']] ?? [];
    }
    unset($t);
}

// ── GET — Single task ─────────────────────────────────────────────────────────
if ($method === 'GET' && $ref_id !== '') {
    require_perm('task.view');

    $task = db_row(
        "SELECT t.*,
                u1.name AS assignee_name,
                u2.name AS creator_name
           FROM bf_tasks t
           LEFT JOIN bf_users u1 ON u1.id = t.assigned_to_user_id
           LEFT JOIN bf_users u2 ON u2.id = t.created_by_user_id
          WHERE t.ref_id = ?",
        [$ref_id]
    );
    if (!$task) json_err('Task not found', 404);
    if (!task_can_access_category(task_user_roles($user), $task['category'])) json_err('Forbidden', 403);

    $tasks_arr = [&$task];
    enrich_tasks_with_assignees($tasks_arr);
    unset($tasks_arr);

    json_ok(['data' => $task]);
}

// ── GET — List ────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    require_perm('task.view');

    $pg          = get_pagination();
    $q           = clean($_GET['q'] ?? '', 100);
    $req_cat     = clean($_GET['category'] ?? '', 20);

    // Determine which categories this user may see
    $allowed = task_accessible_categories(task_user_roles($user));
    if (empty($allowed)) json_err('Forbidden', 403);

    if ($req_cat !== '') {
        if (!in_array($req_cat, $allowed, true)) json_err('Forbidden', 403);
        $categories = [$req_cat];
    } else {
        $categories = $allowed;
    }

    // Build IN clause placeholders
    $placeholders = implode(',', array_fill(0, count($categories), '?'));

    $where  = "t.category IN ($placeholders) AND t.status != 'Cancelled'";
    $params = $categories;

    if ($q !== '') {
        $like = "%$q%";
        $where .= " AND (t.ref_id LIKE ? OR t.title LIKE ? OR t.assigned_to LIKE ?)";
        $params = array_merge($params, [$like, $like, $like]);
    }

    $status_filter = clean($_GET['status'] ?? '', 20);
    if ($status_filter !== '') {
        $where .= " AND t.status = ?";
        $params[] = $status_filter;
    }

    $total = (int)(db_row("SELECT COUNT(*) AS n FROM bf_tasks t WHERE $where", $params)['n'] ?? 0);

    $rows = db_select(
        "SELECT t.*, u1.name AS assignee_name
           FROM bf_tasks t
           LEFT JOIN bf_users u1 ON u1.id = t.assigned_to_user_id
          WHERE $where
          ORDER BY
            FIELD(t.priority,'Urgent','High','Normal','Low'),
            t.due_date IS NULL,
            t.due_date ASC,
            t.created_at DESC
          LIMIT {$pg['limit']} OFFSET {$pg['offset']}",
        $params
    );

    enrich_tasks_with_assignees($rows);

    json_ok([
        'data'       => $rows,
        'total'      => $total,
        'page'       => $pg['page'],
        'limit'      => $pg['limit'],
        'categories' => $allowed,
    ]);
}

// ── POST — Create ─────────────────────────────────────────────────────────────
if ($method === 'POST') {
    require_perm('task.create');

    $body = get_body();
    require_fields($body, ['category', 'title']);

    $category = clean($body['category'] ?? '', 20);
    if (!isset(TASK_CATEGORY_ROLES[$category])) json_err('Invalid category');
    if (!task_can_access_category(task_user_roles($user), $category)) json_err('Forbidden', 403);

    $title       = clean($body['title'] ?? '', 255);
    $description = clean($body['description'] ?? '', 2000);
    $priority    = clean($body['priority'] ?? 'Normal', 20);
    $due_date    = valid_date($body['due_date'] ?? null) ? $body['due_date'] : null;
    $start_at    = tracker_datetime($body['start_at'] ?? null);
    $end_at      = tracker_datetime($body['end_at'] ?? null);
    $due_at      = tracker_datetime($body['due_at'] ?? null);

    foreach (['start_at', 'end_at', 'due_at'] as $field) {
        if (!empty($body[$field]) && ${$field} === null) json_err("Invalid {$field} date and time");
    }
    if ($due_at) $due_date = substr($due_at, 0, 10);

    $valid_priorities = ['Low', 'Normal', 'High', 'Urgent'];
    if (!in_array($priority, $valid_priorities, true)) $priority = 'Normal';

    // Resolve assignees — accepts array (assigned_to_usernames) or single string (assigned_to)
    $assignee_usernames = [];
    if (!empty($body['assigned_to_usernames']) && is_array($body['assigned_to_usernames'])) {
        $assignee_usernames = array_map(fn($u) => clean($u, 100), $body['assigned_to_usernames']);
    } elseif (!empty($body['assigned_to'])) {
        $assignee_usernames = [clean($body['assigned_to'], 50)];
    }
    $assignees = resolve_assignees($assignee_usernames);

    // Primary assignee kept in main table for backward compat with existing filter/display code
    $assigned_to_user_id = !empty($assignees) ? (int)$assignees[0]['id']   : null;
    $assigned_to         = !empty($assignees) ? $assignees[0]['name']       : null;

    $ref_id = next_task_ref($category);

    db_begin();
    try {
        db_exec(
            "INSERT INTO bf_tasks
             (ref_id, category, title, description, status, priority,
              assigned_to_user_id, assigned_to,
              created_by_user_id, created_by, due_date, start_at, end_at, due_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                $ref_id, $category, $title, $description ?: null, 'Open', $priority,
                $assigned_to_user_id, $assigned_to,
                (int)$user['id'], $user['name'],
                $due_date, $start_at, $end_at, $due_at,
            ]
        );
        if (!empty($assignees)) {
            sync_task_assignees($ref_id, $assignees, (int)$user['id']);
        }
        if ($description) {
            db_insert(
                "INSERT INTO bf_tracker_updates
                 (entity_type, entity_ref, label, content, source_kind, created_by_user_id, created_by)
                 VALUES ('task', ?, 'Initial description', ?, 'initial', ?, ?)",
                [$ref_id, $description, (int)$user['id'], $user['name']]
            );
        }
        db_commit();
    } catch (Throwable $error) {
        db_rollback();
        json_err('Task could not be created');
    }

    audit($user['username'], 'TASK_CREATE', "Created {$ref_id} in {$category} tracker");

    $task = db_row("SELECT * FROM bf_tasks WHERE ref_id = ?", [$ref_id]);
    json_ok(['data' => $task], 'Task created');
}

// ── PUT — Update ──────────────────────────────────────────────────────────────
if ($method === 'PUT') {
    if (!$ref_id) json_err('id required');
    require_perm('task.update');

    $task = db_row("SELECT * FROM bf_tasks WHERE ref_id = ?", [$ref_id]);
    if (!$task) json_err('Task not found', 404);
    if (!task_can_access_category(task_user_roles($user), $task['category'])) json_err('Forbidden', 403);

    $body = get_body();

    $set    = [];
    $params = [];
    $changed = [];

    if (array_key_exists('title', $body)) {
        $set[]    = 'title = ?';
        $params[] = clean($body['title'], 255);
        $changed[] = 'title';
    }
    if (array_key_exists('description', $body)) {
        $set[]    = 'description = ?';
        $params[] = clean($body['description'], 2000) ?: null;
        $changed[] = 'description';
    }
    if (array_key_exists('priority', $body)) {
        $valid_priorities = ['Low', 'Normal', 'High', 'Urgent'];
        $p = clean($body['priority'], 20);
        if (in_array($p, $valid_priorities, true)) {
            $set[]    = 'priority = ?';
            $params[] = $p;
            $changed[] = 'priority';
        }
    }
    if (array_key_exists('status', $body)) {
        $valid_statuses = ['Open', 'In Progress', 'Done', 'Cancelled'];
        $s = clean($body['status'], 20);
        if (in_array($s, $valid_statuses, true)) {
            $set[]    = 'status = ?';
            $params[] = $s;
            $changed[] = 'status';
            if ($s === 'In Progress' && empty($task['start_at']) && !array_key_exists('start_at', $body)) {
                $set[] = 'start_at = NOW()';
                $changed[] = 'start_at';
            }
            if ($s === 'Done') {
                $set[]    = 'completed_at = NOW()';
                if (empty($task['end_at']) && !array_key_exists('end_at', $body)) {
                    $set[] = 'end_at = NOW()';
                    $changed[] = 'end_at';
                }
            } elseif ($task['status'] === 'Done' && $s !== 'Done') {
                $set[]    = 'completed_at = NULL';
            }
        }
    }
    if (array_key_exists('due_date', $body)) {
        $set[]    = 'due_date = ?';
        $params[] = valid_date($body['due_date'] ?? null) ? $body['due_date'] : null;
        $changed[] = 'due_date';
    }
    foreach (['start_at', 'end_at', 'due_at'] as $field) {
        if (array_key_exists($field, $body)) {
            $value = tracker_datetime($body[$field]);
            if (!empty($body[$field]) && $value === null) json_err("Invalid {$field} date and time");
            $set[] = "{$field} = ?";
            $params[] = $value;
            $changed[] = $field;
            if ($field === 'due_at') {
                $set[] = 'due_date = ?';
                $params[] = $value ? substr($value, 0, 10) : null;
            }
        }
    }
    $new_assignees = null; // null means no change requested
    if (array_key_exists('assigned_to_usernames', $body)) {
        $unames = is_array($body['assigned_to_usernames']) ? $body['assigned_to_usernames'] : [];
        $new_assignees = resolve_assignees(array_map(fn($u) => clean($u, 100), $unames));
    } elseif (array_key_exists('assigned_to', $body)) {
        if (empty($body['assigned_to'])) {
            $new_assignees = [];
        } else {
            $new_assignees = resolve_assignees([clean($body['assigned_to'], 50)]);
        }
    }
    if ($new_assignees !== null) {
        $primary_uid  = !empty($new_assignees) ? (int)$new_assignees[0]['id']   : null;
        $primary_name = !empty($new_assignees) ? $new_assignees[0]['name']       : null;
        if ($primary_uid !== null) {
            $set[]    = 'assigned_to_user_id = ?';
            $params[] = $primary_uid;
            $set[]    = 'assigned_to = ?';
            $params[] = $primary_name;
        } else {
            $set[] = 'assigned_to_user_id = NULL';
            $set[] = 'assigned_to = NULL';
        }
        $changed[] = 'assigned_to';
    }

    if (empty($set)) json_err('Nothing to update');

    $params[] = $ref_id;
    db_exec("UPDATE bf_tasks SET " . implode(', ', $set) . " WHERE ref_id = ?", $params);

    // Sync junction table if assignees were changed
    if ($new_assignees !== null) {
        sync_task_assignees($ref_id, $new_assignees, (int)$user['id']);
    }

    audit($user['username'], 'TASK_UPDATE', "Updated {$ref_id}: " . implode(', ', array_values(array_unique($changed))));

    $updated = db_row("SELECT * FROM bf_tasks WHERE ref_id = ?", [$ref_id]);
    json_ok(['data' => $updated], 'Task updated');
}

// ── DELETE ────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (!$ref_id) json_err('id required');
    require_perm('task.delete');

    $task = db_row("SELECT id, category, title FROM bf_tasks WHERE ref_id = ?", [$ref_id]);
    if (!$task) json_err('Task not found', 404);
    if (!task_can_access_category(task_user_roles($user), $task['category'])) json_err('Forbidden', 403);

    db_exec("DELETE FROM bf_tasks WHERE ref_id = ?", [$ref_id]);
    audit($user['username'], 'TASK_DELETE', "Deleted {$ref_id}: {$task['title']}");
    json_ok([], 'Task deleted');
}

json_err('Method not allowed', 405);
