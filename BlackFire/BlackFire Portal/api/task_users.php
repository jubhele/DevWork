<?php
/**
 * GET /api/task_users.php
 * Returns active non-client staff users for the task "Assign To" dropdown.
 * Requires task.create or task.update permission.
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

api_headers();
$user = require_auth();
if (!can('task.create') && !can('task.update')) {
    json_err('Forbidden', 403);
}

$rows = db_select(
    "SELECT id, username, name, role
       FROM bf_users
      WHERE active = 1
        AND role NOT IN ('client','client_support','viewer')
      ORDER BY name ASC"
);

json_ok(['data' => $rows]);
