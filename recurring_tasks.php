<?php
/**
 * Recurring maintenance & compliance generation.
 * Shared by cron/generate_recurring_tasks.php and api/maintenance_schedules.php
 * so the manual "Generate Now" button and the monthly cron run the same logic.
 *
 * Each bf_maintenance_schedules row has an output_type: 'callout' for physical
 * site-visit checks (electric fence, camera, biometric reader, boardroom IT —
 * these become bf_callouts, matching how real technician site visits are
 * logged everywhere else in the portal), or 'task' for admin/paperwork items
 * (policy sign-off, PPE/tools checks — these become bf_tasks).
 */

require_once __DIR__ . '/db.php';

function rt_next_task_ref(string $category): string {
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

function rt_role_holders(string $role): array {
    return db_select(
        "SELECT u.id, u.username, u.name
           FROM bf_user_roles ur
           JOIN bf_users u ON u.id = ur.user_id
          WHERE ur.role = ? AND u.active = 1
          ORDER BY u.id",
        [$role]
    );
}

function rt_create_task(array $sched, array $client, array $holders, array $actor, bool $is_unassigned): string {
    $title = $client ? $sched['title'] . ' — ' . $client['name'] : $sched['title'];

    $description = $sched['description'];
    if ($is_unassigned) {
        $description .= "\n\n[AUTO] No active user holds role '{$sched['assignee_role']}' — unassigned, needs manual assignment.";
    }

    $ref_id  = rt_next_task_ref($sched['task_category']);
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
            $actor['id'],
            $actor['name'] ?: $actor['username'],
            (new DateTime('last day of this month'))->format('Y-m-d'),
        ]
    );

    foreach ($holders as $h) {
        db_exec(
            "INSERT IGNORE INTO bf_task_assignees (task_ref, user_id, username, name, assigned_by_uid)
             VALUES (?, ?, ?, ?, ?)",
            [$ref_id, $h['id'], $h['username'], $h['name'], $actor['id']]
        );
    }

    return $ref_id;
}

function rt_create_callout(array $sched, array $client, array $holders, array $actor, bool $is_unassigned): string {
    $notes = $sched['description'];
    if ($is_unassigned) {
        $notes .= "\n\n[AUTO] No active user holds role '{$sched['assignee_role']}' — unassigned, needs manual assignment.";
    }
    if (count($holders) > 1) {
        $notes .= "\n\n[AUTO] Multiple users hold role '{$sched['assignee_role']}' — assigned to the first by user id; others were not auto-assigned this period.";
    }

    $tech = $holders[0] ?? null;
    $due_date = (new DateTime('last day of this month'))->format('Y-m-d');

    $ref_id = next_ref_id('co');

    db_exec(
        "INSERT INTO bf_callouts
            (ref_id, job_no, client_id, client_name, client_email, service, location, tech, assigned_to, assigned_to_user_id,
             priority, status, approval_status, callout_date, callout_time, notes, logged_by_user_id, due_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Normal', 'Open', 'not_required', ?, '08:00:00', ?, ?, ?)",
        [
            $ref_id,
            $ref_id,
            $client['id'],
            $client['name'],
            $client['email'] ?? '',
            $sched['title'],
            $client['address'] ?? '',
            $tech['name'] ?? '',
            $tech['username'] ?? '',
            $tech['id'] ?? null,
            $due_date,
            $notes,
            $actor['id'],
            $due_date . ' 17:00:00',
        ]
    );

    return $ref_id;
}

/**
 * Generate this period's recurring maintenance/compliance items.
 * $actor is the bf_users row attributed as creator (system user for cron,
 * the clicking user for the manual button).
 * Idempotent per (schedule, client, period) via bf_maintenance_schedule_runs.
 */
function generate_recurring_tasks(array $actor): array {
    $period = (new DateTime('now'))->format('Y-m');
    $month  = (int)(new DateTime('now'))->format('n');

    $schedules = db_select("SELECT * FROM bf_maintenance_schedules WHERE is_active = 1");

    $created    = 0;
    $skipped    = 0;
    $unassigned = 0;
    $errors     = [];

    foreach ($schedules as $sched) {
        $freq = max(1, (int)$sched['frequency_months']);
        if ($month % $freq !== 0 && $freq !== 1) continue;

        $isCallout = ($sched['output_type'] ?? 'task') === 'callout';
        if ($isCallout && !$sched['applies_per_client']) {
            $errors[] = "schedule={$sched['schedule_key']}: output_type=callout requires applies_per_client=1 (skipped)";
            continue;
        }

        $clients = $sched['applies_per_client']
            ? db_select("SELECT id, name, email, address FROM bf_clients WHERE is_active = 1")
            : [null];

        foreach ($clients as $client) {
            $client_id = $client['id'] ?? null;

            $already = db_row(
                "SELECT id FROM bf_maintenance_schedule_runs WHERE schedule_id = ? AND client_id <=> ? AND period = ?",
                [$sched['id'], $client_id, $period]
            );
            if ($already) { $skipped++; continue; }

            $holders = rt_role_holders($sched['assignee_role']);
            $is_unassigned = count($holders) === 0;

            db_begin();
            try {
                $ref_id = $isCallout
                    ? rt_create_callout($sched, $client, $holders, $actor, $is_unassigned)
                    : rt_create_task($sched, $client, $holders, $actor, $is_unassigned);

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
                $errors[] = "schedule={$sched['schedule_key']} client_id={$client_id}: {$e->getMessage()}";
            }
        }
    }

    return [
        'period'     => $period,
        'created'    => $created,
        'skipped'    => $skipped,
        'unassigned' => $unassigned,
        'errors'     => $errors,
    ];
}
