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

## Resumed 2026-07-22
Two follow-up requests: (1) add a manual "kick off the job" button under the Support tab, like the existing statement Generate Now button; (2) user noticed Template Store has no way to create new records and suspected this pattern exists elsewhere.

### Manual trigger button
- Studied `portal.js:6024/6045` (`generateStatement`) and `api/statements.php` (`_generate_scheduled_statements()`/`_generate_statement()` split, `GET_LOCK`/`RELEASE_LOCK` pattern, `BF_CRON_SECRET`-gated `?action=cron`) as the reference implementation.
- Refactored `cron/generate_recurring_tasks.php`'s logic into `includes/recurring_tasks.php` (`generate_recurring_tasks($actor)`), shared by both the cron entrypoint and the new API action — same pattern as statements.
- Added `api/maintenance_schedules.php`: `GET ?action=status` (last run per schedule) and `POST ?action=generate` (`task.create` permission gated, `GET_LOCK('bf_recurring_tasks_cron', 2)` to prevent concurrent runs/double-clicks).
- Added "Generate Recurring Maintenance Tasks" button to Support Overview → Quick Actions (`renderSupDashboard`, gated on `can('task.create')`), with `generateRecurringTasks()` JS handler (disable-while-running, toast result, refresh tasks).
- Verified against local DB: re-running after the already-generated July tasks correctly reports all 6 as `skipped`, 0 created — refactor preserved identical behavior and idempotency.

### Template Store missing create-record audit
- Confirmed the gap directly in `portal.js`/`api/template_store.php`: Company Profiles and Client Document Profiles had **no POST/create at all** (frontend or backend) — only `PUT` (edit). Document Templates had a working backend `POST` but **no UI button** anywhere called it.
- Sent an Explore agent to survey the rest of the portal for the same "Edit without Add" pattern. Result: Clients, Users & Roles, Safety Files, and Safety Compliance Records all already have complete, working Add/Create flows (button + backend POST) — confirmed not broken. Callout "Edit Service" is an inline single-field edit, not a missing top-level create (false-positive pattern match). **Template Store is the sole instance of this bug in the codebase.**
- Fixed `api/template_store.php`: added `POST ?entity=profile` (company profile create, `profile_key` uniqueness pre-check) and `POST ?entity=client_profile` (client document profile create, `client_id` existence + `profile_key`-per-client uniqueness pre-check), matching the existing `POST ?entity=template` style and column set from `install/migration_template_store_20260720.sql`.
- Fixed `portal.php`: added "+ New Company Profile" / "+ New Customer Profile" / "+ New Template" buttons to each Template Store section header (`.ph` flex row, matching the "+ New Quote" convention).
- Fixed `portal.js`: added `openCompanyProfileCreator`/`saveCompanyProfileCreator`, `openClientProfileCreator`/`saveClientProfileCreator` (client dropdown from `DB.clients`), `openTemplateCreator`/`saveTemplateCreator` (company dropdown from `DB.companyProfiles`, JSON settings validation matching the existing editor) — all wired into the central `data-action` dispatcher.
- Verified against local DB: inserted and deleted a throwaway company profile and client document profile directly via the same schema/constraints the new endpoints use — confirmed insert succeeds, duplicate `profile_key` is correctly rejected by the DB unique constraint, cleanup succeeded. User approved this DB write before running it.
- `php -l` and `node --check` clean on all touched files (`portal.php`, `portal.js`, `api/template_store.php`, `api/maintenance_schedules.php`, `includes/recurring_tasks.php`, `cron/generate_recurring_tasks.php`).

### Live browser UI verification (2026-07-22)
Started local PHP dev server (`php -S localhost:8899`) and drove the actual portal UI with the gstack `browse` skill (headless Chromium), logged in as `sibu` (admin role) — `blackfm6w9f9_izilo`'s `.env` password is confirmed stale/401 (matches earlier drift note), `bf_seniortech`'s login worked but lacks `security.users` so Template Store/Users nav items are correctly hidden for that role.
- **Support Overview → Quick Actions**: "Generate Recurring Maintenance Tasks" button renders correctly alongside the existing three buttons, matching style. Clicked it live: `POST api/maintenance_schedules.php?action=generate` returned 200 with `"Created 0 task(s) for 2026-07, 6 already existed"` — correct idempotent behavior, button re-enabled after completion.
- **Template Store**: all three "+ New" buttons ("+ New Company Profile", "+ New Customer Profile", "+ New Template") render correctly in their section headers. Opened each modal, filled required fields, submitted — all three returned 200 and the new records appeared immediately in their respective lists. The new company profile also correctly flowed through to the Issuing Company dropdowns on Quotes/Invoices, confirming the create path is fully wired into the rest of the app, not just Template Store's own list.
- Cleaned up all three test records (`qa_ui_test` company profile, `qa_ui_test_client` client profile, `qa_ui_test_template` template) directly via DB delete after confirming they rendered correctly.
- One false alarm during testing: a screenshot appeared to show the Quick Actions panel missing entirely, which looked like a real CSS/layout bug. Root cause was an earlier `scrollIntoView()` call scrolling the window 267px down before the screenshot was taken — not a bug. Resolved by explicitly resetting `window.scrollTo(0,0)` before re-screenshotting.

## Learnings
- BlackFire Portal already has a mature safety-file compliance subsystem (bf_safety_files/items/compliance/personnel + policy acks) — always check for this before proposing new compliance tracking tables in this project.
- No cron/scheduler mechanism existed anywhere in the portal prior to this session; any future "recurring job" request in this codebase needs the mechanism built from scratch (cPanel cron + CLI-guarded PHP script), not assumed to exist.
- api/tasks.php's `next_task_ref()`/`sync_task_assignees()` pattern is the canonical way to create and multi-assign `bf_tasks` rows outside the API layer — reused directly in the cron script.
- Local `.env` mirror can drift from the root vault (stray backtick in `BF_DB_USER`) — when a local DB connection unexpectedly fails with "Access denied," diff the mirror against `c:\DevWork\.env` before assuming the password is stale.
- BlackFire Portal deploy/ops tooling runs on the server via SSH, not from a local machine calling a remote API — always check `install/deploy.sh` for the established pattern (secrets from `~/blackfire_secrets.php`, `install/` scripts excluded from `public_html/`) before inventing a new remote-API-based approach for cPanel operations.
- `api/statements.php` is the canonical reference for "cron job + manual trigger button" features in this portal: shared generation function, `GET_LOCK`/`RELEASE_LOCK` to prevent concurrent runs, permission-gated POST for the UI button, secret-gated `?action=cron` for headless triggers. Follow this shape for any future recurring-job UI.
- When a user reports one missing UI capability ("X page can't create new records"), check whether it's an isolated bug or a systemic pattern before fixing just the one spot — an Explore agent survey here confirmed Template Store was the only instance, saving a broader unnecessary rewrite.
- BlackFire Portal test accounts: `blackfm6w9f9_izilo`'s `.env`-listed password is stale (401 on login) — use `sibu` (admin) or `bf_manager`/`bf_seniortech`/`bf_tech1` etc. from `.env` for local UI testing instead. `security.users` permission gates both Template Store and Users & Roles nav items — a senior_tech login correctly can't see either.
- When a gstack `browse` screenshot looks like it's missing content that DOM inspection confirms exists (`getBoundingClientRect()` shows real height), check `window.scrollY` before concluding it's a CSS bug — a prior `scrollIntoView()` call can leave the page scrolled past the target before the next screenshot.

## Goal Status
PENDING
