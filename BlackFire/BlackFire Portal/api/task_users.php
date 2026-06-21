<?php
/**
 * GET /api/task_users.php
 * Returns active non-client staff users for the task "Assign To" dropdown.
 * Requires task.create permission — available to all staff who can log tasks.
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

api_headers();
$user = require_auth();
require_perm('task.create');

$rows = db_select(
    "SELECT id, username, name, role
       FROM bf_users
      WHERE active = 1
        AND role NOT IN ('client','client_support','viewer')
      ORDER BY name ASC"
);

json_ok(['data' => $rows]);
