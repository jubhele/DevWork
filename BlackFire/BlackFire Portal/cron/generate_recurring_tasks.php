<?php
/**
 * BlackFire Portal — Recurring Maintenance & Compliance Task Generator
 *
 * Run monthly via cPanel cron (see cron/README.md for the schedule entry).
 * For every active bf_maintenance_schedules row due this period, creates
 * one bf_tasks row per active bf_clients row and assigns it to every
 * bf_users holder of the schedule's assignee_role (bf_task_assignees).
 *
 * A schedule is "due" when the current calendar month number is evenly
 * divisible by its frequency_months (frequency_months=1 fires every month;
 * frequency_months=12 fires only in December).
 * Idempotent: bf_maintenance_schedule_runs has a UNIQUE(schedule_id, client_id, period)
 * guard, so re-running the same month is a no-op.
 *
 * CLI only — refuses to run over HTTP.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('CLI only');
}

require_once __DIR__ . '/../includes/db.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');

$period = (new DateTime('now'))->format('Y-m');
$month  = (int)(new DateTime('now'))->format('n');

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

function role_holders(string $role): array {
    return db_select(
        "SELECT u.id, u.username, u.name
           FROM bf_user_roles ur
           JOIN bf_users u ON u.id = ur.user_id
          WHERE ur.role = ? AND u.active = 1",
        [$role]
    );
}

$system_user = db_row("SELECT id, username, name FROM bf_users WHERE username = 'system' AND active = 1")
    ?? db_row("SELECT id, username, name FROM bf_users WHERE role = 'sysadmin' AND active = 1 ORDER BY id LIMIT 1");

if (!$system_user) {
    fwrite(STDERR, "No system/sysadmin user found to attribute generated tasks to. Aborting.\n");
    exit(1);
}

$schedules = db_select(
    "SELECT * FROM bf_maintenance_schedules WHERE is_active = 1"
);

$created   = 0;
$skipped   = 0;
$unassigned = 0;

foreach ($schedules as $sched) {
    $freq = max(1, (int)$sched['frequency_months']);
    if ($month % $freq !== 0 && $freq !== 1) continue;

    $clients = $sched['applies_per_client']
        ? db_select("SELECT id, name FROM bf_clients WHERE is_active = 1")
        : [null];

    foreach ($clients as $client) {
        $client_id = $client['id'] ?? null;

        $already = db_row(
            "SELECT id FROM bf_maintenance_schedule_runs WHERE schedule_id = ? AND client_id <=> ? AND period = ?",
            [$sched['id'], $client_id, $period]
        );
        if ($already) { $skipped++; continue; }

        $holders = role_holders($sched['assignee_role']);
        $is_unassigned = count($holders) === 0;

        $title = $client
            ? $sched['title'] . ' — ' . $client['name']
            : $sched['title'];

        $description = $sched['description'];
        if ($is_unassigned) {
            $description .= "\n\n[AUTO] No active user holds role '{$sched['assignee_role']}' — unassigned, needs manual assignment.";
        }

        db_begin();
        try {
            $ref_id = next_task_ref($sched['task_category']);
            $primary = $holders[0] ?? null;

            db_exec(
                "INSERT INTO bf_tasks
                    (ref_id, category, title, description, status, priority,
                     assigned_to_user_id, assigned_to, created_by_user_id, created_by,
                     due_date)
                 VALUES (?, ?, ?, ?, 'Open', 'Normal', ?, ?, ?, ?, ?)",
                [
                    $ref_id,
                    $sched['task_category'],
                    $title,
                    $description,
                    $primary['id'] ?? null,
                    $primary['name'] ?? null,
                    $system_user['id'],
                    $system_user['name'] ?: $system_user['username'],
                    (new DateTime('last day of this month'))->format('Y-m-d'),
                ]
            );

            foreach ($holders as $h) {
                db_exec(
                    "INSERT IGNORE INTO bf_task_assignees (task_ref, user_id, username, name, assigned_by_uid)
                     VALUES (?, ?, ?, ?, ?)",
                    [$ref_id, $h['id'], $h['username'], $h['name'], $system_user['id']]
                );
            }

            db_exec(
                "INSERT INTO bf_maintenance_schedule_runs
                    (schedule_id, client_id, period, task_ref, unassigned_flag)
                 VALUES (?, ?, ?, ?, ?)",
                [$sched['id'], $client_id, $period, $ref_id, $is_unassigned ? 1 : 0]
            );

            db_commit();
            $created++;
            if ($is_unassigned) $unassigned++;
        } catch (Throwable $e) {
            db_rollback();
            fwrite(STDERR, "Failed schedule={$sched['schedule_key']} client_id={$client_id}: {$e->getMessage()}\n");
        }
    }
}

echo "Recurring task generation for {$period}: created={$created} skipped(existing)={$skipped} unassigned={$unassigned}\n";
