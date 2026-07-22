# BlackFire Portal — Cron Jobs

## generate_recurring_tasks.php

Creates monthly/yearly maintenance and safety-compliance tasks in `bf_tasks`,
assigned by role. See `install/migration_recurring_maintenance_20260722.sql`
for the schedule table and seed data.

**Setup — automated (recommended, matches `install/deploy.sh` workflow):**

`install/install_cron.sh` edits the account crontab directly over the same SSH
session used for deploys — no API token needed. Idempotent: tags its line with
`# BLKFR-CRON-RECURRING-TASKS` so re-running never duplicates the entry.

```
ssh blackfm6w9f9@blackfiresolutions.co.za
bash public_html/install/install_cron.sh --dry-run   # preview
bash public_html/install/install_cron.sh              # install
bash public_html/install/install_cron.sh --remove     # uninstall
```

Run it once after the first `deploy.sh` (or any time — it installs whether or
not `cron/generate_recurring_tasks.php` exists yet, warning if it doesn't).

**Setup — manual (cPanel → Cron Jobs UI):**

Run once on the 1st of every month at 06:00 SAST:

```
0 6 1 * * /usr/local/bin/php /home/<cpanel_user>/<path-to-portal>/cron/generate_recurring_tasks.php >> /home/<cpanel_user>/<path-to-portal>/cron/generate_recurring_tasks.log 2>&1
```

Adjust the PHP binary path per the cPanel "PHP Selector" version in use (must be PHP 7.3+).

**To add a new recurring item:** insert a row into `bf_maintenance_schedules`
(`category`, `assignee_role`, `frequency_months`, `applies_per_client`).
No code change needed unless the item requires per-client scoping logic
beyond "one task per active `bf_clients` row".

**Unassigned tasks:** if a schedule's `assignee_role` has zero active holders,
the task is still created (unassigned) and flagged in
`bf_maintenance_schedule_runs.unassigned_flag = 1`. Query:

```sql
SELECT r.*, s.title FROM bf_maintenance_schedule_runs r
JOIN bf_maintenance_schedules s ON s.id = r.schedule_id
WHERE r.unassigned_flag = 1 ORDER BY r.created_at DESC;
```
