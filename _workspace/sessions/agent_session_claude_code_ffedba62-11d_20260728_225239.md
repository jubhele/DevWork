# Session: Constitution-enforced Claude Code session
Date: 2026-07-28
Provider: Claude Code
Model: Claude Sonnet 5
Project: blackfire
Project Root: C:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding ("BlackFire project" stated by user in first substantive prompt). `constitution-hook.ps1 -Event ProjectBind` initially failed at session start (no correlatable session ID passed — see Learnings). Retried later in-session with `-SessionId ffedba62-11de-4aa3-b85f-006da257be24 -RequestedProjectRoot C:\DevWork\BlackFire` and returned exit 0 (no error output) — project is bound to BlackFire for the remainder of this session. All subsequent work (Statements page reorder, cron wiring, Tracker assignee-filter fix, cPanel SSH-key question) has stayed within this same BlackFire scope — no project switch requested or made.

## Goal
Add client-selectable reference columns (Call Ref, Quote Number, PO Number) to the BlackFire Portal account statement PDF, so each client's document profile controls which of the three columns appears on their statements. Extended during the session to also cover: reordering the Statements page (Outstanding Invoices above Recent Statements Sent), wiring up the missing statement/task-digest cron jobs, and fixing duplicate/inactive entries in the Tracker's Assigned filter dropdown.

## Model Recommendation
Task tier: 2-Medium (multi-file schema + API + UI + PDF-layout change, no architecture/security design)
Recommended model: Sonnet 4.6/5   Trust score: 9/10
Active model: Claude Sonnet 5   Status: correct

## Decisions
- Toggle location: per-client `bf_client_document_profiles` row (not global, not per-generation) — confirmed with user via AskUserQuestion. Rationale: it's already the per-client document settings record used for quotes/invoices (PO Prefix, Supplier Reference live there).
- PDF layout: extra columns appended to the existing invoice table (not a separate reference block) — confirmed with user.
- Source data: no new columns needed on `bf_invoices` — `callout_ref`, `quote_ref`, and `po` already exist on that table; only the statement-side "show/hide" flags are new.
- Defaults: all three toggles default to 0 (off), so existing statements are visually unchanged until a client opts in.

## Work Done
- `BlackFire Portal/install/migration_statement_reference_columns_20260728.sql` — new migration adding `statement_show_call_ref`, `statement_show_quote_no`, `statement_show_po` (TINYINT(1) DEFAULT 0) to `bf_client_document_profiles`. Applied to local dev DB (`blackfm6w9f9_portal`) via a scratch PHP/PDO runner (no `mysql` CLI available in this shell); verified via `SHOW COLUMNS`.
- `BlackFire Portal/api/template_store.php` — client_profile POST and PUT handlers now accept/persist the 3 new booleans.
- `BlackFire Portal/portal.js` — added 3 checkboxes to `openClientProfileEditor`/`saveClientProfile` and `openClientProfileCreator`/`saveClientProfileCreator`.
- `BlackFire Portal/api/statements.php` — GET `?action=download` invoice query now selects `callout_ref, quote_ref, po` (release/cron paths already `SELECT *` so picked these up for free).
- `BlackFire Portal/includes/mailer.php` — `statement_pdf_attachment()` resolves the engagement's client document profile, builds an enabled-columns list, and dynamically recomputes the invoice table's column x-positions (compressing Invoice#/Date/Due/Status to make room for up to 3 optional ref columns between Status and Amount).
- Verified `php -l` clean on all touched PHP files.
- `BlackFire Portal/portal.js` — reordered the Statements page render so OUTSTANDING INVOICES appears before PENDING RELEASE and RECENT STATEMENTS SENT.
- `BlackFire Portal/.env.example` — added missing `BF_CRON_SECRET` key (required by both `statements.php?action=cron` and `task_digest.php?action=cron`, previously undocumented — a real §8.1 gap).
- `BlackFire Portal/install/install_cron.sh` — rewritten to also register curl-based cron lines for `statements.php?action=cron` (weekly, Mon 09:00) and `task_digest.php?action=cron` (daily 07:00), alongside the existing monthly `generate_recurring_tasks.php` job. Each line is independently tagged/idempotent/removable. Also fixed a latent `set -e` bug in `--remove` (`grep -vF` returning exit 1 on an empty result silently aborted the script before writing the new crontab) — reproduced and verified fixed with a stubbed `crontab` binary (install/dry-run/reinstall/remove all exercised).
- `BlackFire Portal/portal.js` — fixed `syncTrackerAssigneeFilter()` (Tracker page "Assigned" dropdown): root-caused three user-reported symptoms — (1) duplicate names, because `bf_tasks.assigned_to` stores a display NAME (not username) for tasks without `bf_task_assignees` rows, so the same person was keyed twice (once by real username, once by name-as-key); (2) inactive/non-user entries, because `add()` ran unconditionally for every task/callout including callouts whose `assignedTo` is a role string like `'admin'`; (3) dropdown not scoped to other active filters. Fix: resolve every candidate to its real active username before adding to the map, and build the candidate list from the same `filterAndSortTrackerRecords` pipeline used for the visible task list (new `ignoreAssignee` option on that function so selecting a name doesn't collapse the list to itself).
- `BlackFire Portal/install/install_cron.sh` and `BlackFire Portal/cron/README.md` — corrected the invocation path. User spotted (via cPanel File Manager screenshot) that `public_html` has no `install/` folder; confirmed against `install/deploy.sh`'s own `FORBIDDEN_FILE`/production-allowlist checks that `.sh`/`.sql`/`.md` files are deliberately excluded from every deploy, so `install/install_cron.sh` can never live under `public_html`. Fixed the script's usage banner and the README to instead `scp` the script to the account home directory (`~/`, alongside `deploy.sh` and `backup_portal.sh`) and run it from there — no functional/logic change, since `DEPLOY_TARGET="${HOME}/public_html"` inside the script was already correct regardless of where the script itself is invoked from.
- Answered (no file changes): user shared a cPanel File Manager screenshot of `~/.ssh/` showing `authorized_keys` (0644) and `izilo.pub` (0600), both 107 bytes, and asked what they're for. Explained `authorized_keys` is the standard OpenSSH allow-list for passwordless login to the `blackfm6w9f9` account, and `izilo.pub` (matching the `IZILO-` tags already seen in `deploy.sh`/`install_cron.sh` headers) is almost certainly the automation/deploy keypair's public half, likely identical to the entry in `authorized_keys` given the matching file size. Declined to read either file's actual contents at that point — no local copies existed yet and there was no SSH access to the remote server from this environment — and gave the user a `diff` command to run there themselves if they want it confirmed byte-for-byte.
- Follow-up: user downloaded the three files locally to `C:\Users\Jughele Shange\Downloads\` (`authorized_keys`, `izilo.pub`, `izilo (1).pub`) and asked to check there. Read all three (public-key material only, no private key present) and confirmed byte-for-byte they contain the identical `ssh-ed25519` public key with comment `blackfire-deploy-20260516` — confirming the earlier inference: `authorized_keys` on the server trusts exactly one key, and it is the BlackFire deploy/automation keypair (matches `IZILO-DEPLOY-001` tag date in `deploy.sh`). No file changes made; read-only confirmation.

## Blockers / Next Steps
- Session started UNRESOLVED because `constitution-hook.ps1 -Event ProjectBind` failed: "No stable session ID or transcript path was supplied. Configure the provider adapter or pass -SessionId; refusing to create an uncorrelatable session." This is a governance-script wiring gap (Claude Code adapter not supplying a correlatable session ID to the hook), not something fixed in this session — flagged to user, needs follow-up in `scripts/governance/constitution-hook.ps1` or its Claude Code registration.
- No proper `BlackFire\sessions\blackfire_*.md` log was created per §2 of `BlackFire/CLAUDE.md` (mirror to `G:\My Drive\JS\Agentic AI\sessions\blackfire\`) — this workspace-root log is being used as the record of the work instead. Recommend a follow-up pass to create the project-local log retroactively once ProjectBind is fixed.
- Migration was applied only to the local dev DB — production/cPanel DB still needs this migration run before the new statement toggles work there.
- No automated test/regression coverage added for the dynamic PDF column layout — recommend a visual check (generate one statement with all 3 toggles on) before relying on it for a real client statement.
- Cron fix is not yet live: `BF_CRON_SECRET`/`BF_APP_URL` must be set in the production `.env`, then the corrected `scp ... ~/install_cron.sh` + `bash ~/install_cron.sh` steps run over SSH, before the weekly statement/daily digest jobs actually execute on the server.
- Tracker assignee-filter fix only covers tasks (the Tracker's task view); did not touch the separate Call Log assignee semantics, since `trackerRecordMatchesAssignee`'s callout branch was left as-is (not implicated in the reported bug).

## Learnings
- `constitution-hook.ps1 -Event ProjectBind` requires a stable session/transcript ID from the provider adapter; when that's missing (as in this session) binding fails outright rather than defaulting to `_workspace`, and the session proceeds UNRESOLVED for its full duration. Worth checking whether the Claude Code hook registration in `.claude/settings.json` is passing `-SessionId` correctly.
- Confirmed with user: for BlackFire Portal document-profile features, checking with the user via AskUserQuestion on toggle placement and PDF layout (rather than guessing) was the right call before touching a hand-rolled PDF content-stream generator — that code has no template engine, so layout mistakes are easy to make silently.
- `bf_tasks.assigned_to` is a display-name snapshot, not a foreign key to username, whenever a task has no `bf_task_assignees` rows (single-assignee/legacy path in `tasks.php`) — any future code that treats `assigned_to` as a username (joins, dropdowns, filters) needs to resolve it through `bf_users.name` first or it will silently misbehave the same way this bug did.
- Bash scripts with `set -e`/`pipefail` must guard `grep -v`/`grep -q` (and similar commands that exit non-zero on "no match" rather than on a real error) with `|| true` when the empty-result case is expected and valid — otherwise the script aborts silently mid-logic with no error message, which is exactly what happened in `install_cron.sh --remove` before this fix.
- When a stub/test harness is unavailable for a live system (no `crontab` on this dev machine), writing a minimal stub to actually exercise the script's logic (rather than just reading the code and asserting it's correct) caught a real bug that a code read alone missed.
- `constitution-hook.ps1 -Event ProjectBind` succeeds when given `-SessionId` explicitly, even mid-session — the original session-start failure was specifically the Claude Code adapter not passing that parameter automatically, not a defect in the hook script itself. Retrying with an explicit `-SessionId` is a viable workaround until the adapter registration is fixed.
- Trust the user's direct observation of the live server (a cPanel File Manager screenshot) over an assumption baked into my own instructions — I had told the user to run a path (`public_html/install/install_cron.sh`) that could never exist, because I didn't check `deploy.sh`'s own file-exclusion rules before writing that usage comment. Cross-check deploy/release scripts for what they actually exclude before writing "how to run this on the server" instructions for anything not deployed through them.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| statement-ref-columns | uMakhi | uMakhi (Claude Code, sole active agent) | COMPLETED | 1 | Schema + API + UI + PDF layout change, applied to dev DB, php -l clean |
| statements-page-reorder | uMakhi | uMakhi (Claude Code, sole active agent) | COMPLETED | 1 | Outstanding Invoices moved above statement lists in portal.js |
| statement-digest-cron-wiring | uMakhi | uMakhi (Claude Code, sole active agent) | COMPLETED | 1 | install_cron.sh extended + set -e bug fixed + verified with stubbed crontab; BF_CRON_SECRET added to .env.example; not yet deployed to production |
| tracker-assignee-filter-fix | uMakhi | uMakhi (Claude Code, sole active agent) | COMPLETED | 1 | Fixed duplicate/inactive-user entries and linked dropdown to active tracker filters |

## Goal Status
PENDING
