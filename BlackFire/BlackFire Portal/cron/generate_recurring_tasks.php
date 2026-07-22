<?php
/**
 * BlackFire Portal — Recurring Maintenance & Compliance Task Generator (cron entrypoint)
 *
 * Run monthly via cPanel cron (see cron/README.md). Generation logic lives in
 * includes/recurring_tasks.php, shared with the manual "Generate Now" button
 * on the Support Overview page (api/maintenance_schedules.php).
 *
 * CLI only — refuses to run over HTTP.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('CLI only');
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/recurring_tasks.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');

$system_user = db_row("SELECT id, username, name FROM bf_users WHERE username = 'system' AND active = 1")
    ?? db_row("SELECT id, username, name FROM bf_users WHERE role = 'sysadmin' AND active = 1 ORDER BY id LIMIT 1");

if (!$system_user) {
    fwrite(STDERR, "No system/sysadmin user found to attribute generated tasks to. Aborting.\n");
    exit(1);
}

$lock = db_row("SELECT GET_LOCK('bf_recurring_tasks_cron', 0) AS acquired");
if ((int)($lock['acquired'] ?? 0) !== 1) {
    echo "Recurring task generation already in progress — skipping.\n";
    exit(0);
}

try {
    $result = generate_recurring_tasks($system_user);
} finally {
    db_row("SELECT RELEASE_LOCK('bf_recurring_tasks_cron') AS released");
}

foreach ($result['errors'] as $err) {
    fwrite(STDERR, "Failed $err\n");
}

echo "Recurring task generation for {$result['period']}: created={$result['created']} skipped(existing)={$result['skipped']} unassigned={$result['unassigned']}\n";
