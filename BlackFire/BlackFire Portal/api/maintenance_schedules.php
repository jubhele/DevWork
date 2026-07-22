<?php
ob_start();
/**
 * BlackFire Portal — Recurring Maintenance & Compliance Schedules API
 *
 * GET  ?action=status                    → last run per schedule (for Support Overview display)
 * POST ?action=generate                  → manually kick off this period's task generation
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/recurring_tasks.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$user   = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$action = clean($_GET['action'] ?? '', 30);

// ── GET — status ─────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'status') {
    if (!can('task.view')) json_err('Permission denied', 403);

    $schedules = db_select(
        "SELECT s.id, s.schedule_key, s.title, s.category, s.frequency_months,
                MAX(r.created_at) AS last_run_at, MAX(r.period) AS last_run_period
           FROM bf_maintenance_schedules s
           LEFT JOIN bf_maintenance_schedule_runs r ON r.schedule_id = s.id
          WHERE s.is_active = 1
          GROUP BY s.id
          ORDER BY s.category, s.title"
    );
    json_ok(['schedules' => $schedules]);
}

// ── POST — generate ─────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'generate') {
    if (!can('task.create')) json_err('Permission denied', 403);

    $lock = db_row("SELECT GET_LOCK('bf_recurring_tasks_cron', 2) AS acquired");
    if ((int)($lock['acquired'] ?? 0) !== 1) {
        json_err('Task generation is already running — try again shortly', 409);
    }

    try {
        $result = generate_recurring_tasks($user);
    } finally {
        db_row("SELECT RELEASE_LOCK('bf_recurring_tasks_cron') AS released");
    }

    $message = "Created {$result['created']} task(s) for {$result['period']}"
        . ($result['skipped'] ? ", {$result['skipped']} already existed" : '')
        . ($result['unassigned'] ? ", {$result['unassigned']} unassigned (no role holder)" : '');

    json_ok($result, $message);
}

json_err('Not found', 404);
