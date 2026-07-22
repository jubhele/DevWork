# Session: BlackFire Maintenance & Compliance Recurring Jobs
Date: 2026-07-22
Provider: Claude Code
Model: claude-sonnet-5
Project: BlackFire
Project Root: c:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding

## Goal
Design and implement a recurring monthly job for the BlackFire Portal that (1) creates standard maintenance call items — electric fence check, camera checks, face/palm reader check, boardroom IT checks — and (2) creates safety-file compliance tasks (yearly policy sign-off, monthly PPE/tools checks, and any other required items), auto-assigning each to the relevant responsible person.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-5  Status: correct

## Decisions
- Routed as uMakhi (code/portal domain) work, task ID BF-MAINT-JOB-01.
- Explored existing calls/tasks/users/sites schema before designing the job, per constitution routing (design must fit existing data model, not a parallel one).

## Work Done
- Bound session to BlackFire project via constitution-hook.ps1 ProjectBind.
- Explore agent mapped existing schema: `bf_tasks`/`bf_task_sequences`/`bf_task_assignees` (tasks), `bf_clients` (sites/clients), `bf_user_roles`/`bf_role_permissions` (roles), and a mature safety-file subsystem (`bf_safety_files`, `bf_safety_items`, `bf_safety_compliance`, `bf_safety_personnel`, policy-ack migration) — reused rather than rebuilt. No prior cron/scheduler mechanism existed.
- User decisions: scope checks per-client (not per-zone); assignment is role-based lookup (0 holders → unassigned + flagged, >1 holders → assign all); job runs as a PHP script triggered by cPanel cron.
- Created `BlackFire Portal/install/migration_recurring_maintenance_20260722.sql`: new `bf_maintenance_schedules` (recurring templates) and `bf_maintenance_schedule_runs` (idempotency + unassigned-flag log) tables, seeded with 4 maintenance items (electric fence, camera, face/palm reader, boardroom IT — monthly, per client) and 3 compliance items (annual policy sign-off, monthly PPE check, monthly tools/equipment check).
- Created `BlackFire Portal/cron/generate_recurring_tasks.php` — CLI-only generator that creates one `bf_tasks` row per due schedule per active client, resolves `assignee_role` via `bf_user_roles`, multi-assigns via `bf_task_assignees` when >1 holder, leaves unassigned + flags in `bf_maintenance_schedule_runs` when 0 holders, and is idempotent per (schedule, client, month) via a UNIQUE constraint.
- Created `BlackFire Portal/cron/README.md` documenting the cPanel cron entry and how to add new recurring items without code changes.
- Initially built `cron/install_cpanel_cron.sh` using the cPanel UAPI with an API token — replaced after reading `install/deploy.sh`, which showed the real deploy model is SSH-based (run directly on the Afrihost box, secrets read from `~/blackfire_secrets.php`, not `.env`) and explicitly strips `*.sh`/`.env` files from the deployed `public_html/`. `BF_CPANEL_API_TOKEN` is also not a field `blackfire_secrets.php.example` defines, confirming the API-token approach doesn't match this project's actual auth model.
- Replaced with `BlackFire Portal/install/install_cron.sh`, matching `deploy.sh`'s conventions (same log/color helpers, same `install/` location so it's excluded from the deployed site, run over the same SSH session as `bash deploy.sh`). Edits the account crontab directly (`crontab -l` / `crontab -`), tags its line with `# BLKFR-CRON-RECURRING-TASKS` for idempotent re-runs, supports `--dry-run` and `--remove`. Not executed — requires the live SSH session, left for user to run per their stated workflow ("I will be running it like deploy.sh").
- Followed project code principles: PHP 7.3-compatible (no match/str_starts_with), reused existing `includes/db.php` helpers and the `next_task_ref`/`sync_task_assignees` patterns from `api/tasks.php`.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| BF-MAINT-JOB-01-explore | uMakhi | uMakhi | COMPLETED | 1 | Schema discovery — found existing tasks/safety/clients/roles schema, no prior cron mechanism |
| BF-MAINT-JOB-01-build | uMakhi | uMakhi | COMPLETED | 1 | Migration + cron script + README delivered |

## Blockers / Next Steps
- Migration applied and verified against local MySQL mirror (`blackfm6w9f9_portal` @ 127.0.0.1:3306): both new tables created, 7 schedules seeded.
- **Found and fixed unrelated pre-existing bug**: `BlackFire Portal/.env` line 7 `BF_DB_USER` had a stray trailing backtick (`blackfm6w9f9_umlilo_admin\``) not present in the root vault (`c:\DevWork\.env`), causing local DB auth failures ("Access denied ... using password: YES"). Backed up `.env` to `_backups/` before fixing. Root cause of the drift (manual edit vs. sync script bug) not investigated — worth checking `refresh-workspace-secrets.ps1` output next time it runs.
- Dry-ran (with user confirmation) `php cron/generate_recurring_tasks.php` for period 2026-07: created 6 tasks (electric fence, camera, face/palm reader, boardroom IT ×2 assignees, PPE check, tools check) for AECI Chempark, correctly assigned by role (senior_tech → Farai Mujere; junior_tech → Martin Mahlangu + Dan Mupeta multi-assigned; safety_officer group → Sibulelo Mtolo). 0 unassigned. Annual policy sign-off correctly skipped (fires only in December, month % 12 == 0) — fixed a doc comment that incorrectly said "January."
- Not yet deployed/wired to prod cPanel cron — user still needs to add the cron entry from `cron/README.md` on the live Afrihost cPanel once satisfied with local behavior.
- uMlindi (governance) has not yet audited this change — recommend a pass before deploying to prod per §12.2 (uMlindi audits uMakhi's changes pre-deploy).
- This session created real `bf_tasks` rows in the local dev DB mirror — if that DB is shared/synced anywhere, confirm it's understood as real data, not throwaway.

## Learnings
- BlackFire Portal already has a mature safety-file compliance subsystem (bf_safety_files/items/compliance/personnel + policy acks) — always check for this before proposing new compliance tracking tables in this project.
- No cron/scheduler mechanism existed anywhere in the portal prior to this session; any future "recurring job" request in this codebase needs the mechanism built from scratch (cPanel cron + CLI-guarded PHP script), not assumed to exist.
- api/tasks.php's `next_task_ref()`/`sync_task_assignees()` pattern is the canonical way to create and multi-assign `bf_tasks` rows outside the API layer — reused directly in the cron script.
- Local `.env` mirror can drift from the root vault (stray backtick in `BF_DB_USER`) — when a local DB connection unexpectedly fails with "Access denied," diff the mirror against `c:\DevWork\.env` before assuming the password is stale.
- BlackFire Portal deploy/ops tooling runs on the server via SSH, not from a local machine calling a remote API — always check `install/deploy.sh` for the established pattern (secrets from `~/blackfire_secrets.php`, `install/` scripts excluded from `public_html/`) before inventing a new remote-API-based approach for cPanel operations.

## Goal Status
PENDING
