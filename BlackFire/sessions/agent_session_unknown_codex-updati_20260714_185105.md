# Session: Constitution-enforced Unknown session
Date: 2026-07-14
Provider: OpenAI Codex
Model: GPT-5 Codex
Project: BlackFire
Project Root: C:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding

## Goal
Update the BlackFire Portal quote and invoice process so due dates are mandatory and default to the current database timestamp plus one day; every quote belongs to exactly one call log; administrator approval and call escalation unlock multiple quotes per call; and each invoice is linked one-to-one with a corresponding quote while a call may have multiple invoices before completion. Verify the behavior against calls CO-BF-CP1723 and CO-040726-0131.

## Model Recommendation
Task tier: 3-Complex
Recommended model: o3 / o1 with reasoning (workspace matrix trust 9/10)
Active model: GPT-5 Codex with reasoning (Codex complex-task trust 8/10) — Status: appropriate

## Decisions
- Session created automatically by the SessionStart enforcement hook.
- Project bound to BlackFire because both reference call IDs resolve exclusively to BlackFire Portal records.
- uSibali classified the task as TIER_3_HIGH; uMlawuli routed implementation to uMakhi, functional QA to uMvavanyi, code QA to uMcwaningi, and governance review to uMlindi.
- The interactive plan-eng-review skill was unavailable because this session mode exposes no compatible AskUserQuestion tool; direct engineering review is the fallback.
- Re-open is a lifecycle action available only for Completed or Invoiced calls; it does not authorize additional documents.
- A dedicated administrator-approved Upgrade Call Type state authorizes additional quotes and invoices.
- Site Timeline, Reports, and Clients belong to Support, including navigation, shortcuts, page subtitles, and help copy.
- The migration remains unapplied because `Q-140125-0001` has no safe deterministic call-log mapping; no mapping was guessed.
- Release is frozen after governance discovered application commits on `origin/master` without the required schema migration and a potentially sensitive database dump in pushed commit `3fde452`.
- Invoice due dates now default to issue/submission date plus 14 days, while manually supplied due dates remain supported.
- `Q-140125-0001` was checked in the database: it is a rejected AECI competitor benchmark quote with no current callout link; its notes name `CO-2025-0001` / `CP0934` and `CO-2025-0003` / `CP1028` as comparable BlackFire work, but the migration was not applied because preflight still contains unresolved orphan records.
- The session close-hook compatibility path `C:\DevWork\scripts\session-log-update.ps1` should exist and delegate to the canonical `C:\DevWork\.claude\scripts\session-log-update.ps1` script.
- Quote Log ownership must be consistent across platforms: PHP portal, Next web, and mobile app all place Quote Log in Finance, not Operations.
- Upgrade Call Type must use an explanatory modal, require a reason, and include that reason in administrator audit history.
- Help/page-guide content must be updated on every active platform surface so users see the same process rules regardless of PHP, Next, or app entry point.
- Uploaded file links must resolve through the related record and tolerate the deployed server upload folder (`opload`) as well as legacy `uploads/attachments`.
- Quote and invoice send actions must email the client with a generated PDF attachment, not only an HTML email body.
- The standalone BF-SHE-FRM-010 action tracker must either render its rows or show a visible load error; it must not sit indefinitely at 0% / Loading with a blank grid.

## Work Done
- Constitution, memory index, and session-log schema verified at session start.
- Implemented strict quote-to-call and invoice-to-quote/call relationships, one invoice per quote, mandatory `due_date` defaults, administrator-gated additional documents, and immutable relationship enforcement in the migration and APIs.
- Added a SELECT-only preflight, deterministic repair for `CO-BF-CP1723`, and explicit diagnostics for missing or conflicting identifiers.
- Updated Call Log UI/API so Re-open appears and succeeds only for Completed/Invoiced calls; added Upgrade Call Type, approval actions, and Call Type beside Due.
- Moved Site Timeline, Reports, and Clients to Support and removed residual Operations shortcuts/copy.
- PHP/JavaScript syntax, all three workflow regressions, and scoped diff checks pass. uMcwaningi and uMbheki final reviews pass.
- uMvavanyi confirmed source/regression behavior but correctly failed runtime readiness because the migration is unapplied. uMlindi issued POLICY_BLOCK for release.
- Updated invoice defaults in `api/quotes.php`, `api/invoices.php`, `portal.js`, the migration SQL, and regressions so invoice due dates default to 14 days after issue/submission while still accepting override due dates.
- Created a clean cPanel-restorable pre-migration database backup at `BlackFire Portal\_backups\portal_db_pre_quote_workflow_migration_clean_20260714_233130.sql`.
- Re-ran PHP lint, `node --check`, all three quote/call/invoice regressions, and SELECT-only migration preflight. Code checks pass; migration preflight still blocks on orphan quotes and missing canonical quote rows for four legacy invoices.
- Added `C:\DevWork\scripts\session-log-update.ps1` as a compatibility wrapper around the canonical `.claude` close-hook script and verified both paths return `[session-log] Not signed. Incomplete: Goal Status PENDING` for this pending session.
- Replaced the PHP portal browser prompt for Upgrade Call Type with a branded modal explaining why upgrades are needed, the one-quote/one-invoice standard rule, and the audit impact; the submitted reason is now required.
- Updated `api/callouts.php` so upgrade requests, approvals, and rejections include the submitted reason in the Audit Log and return a clearer migration-needed message if the new database columns are not present.
- Moved PHP Quote Log navigation from Operations to Finance beside Overview; kept Site Timeline, Reports, and Clients under Support; refreshed portal page-guide content for all active portal pages.
- Updated Next web navigation so Operations no longer owns Quotes/Clients, Finance shows Overview -> Quote Log -> Invoices, and Support owns Clients plus copy for Site Timeline/Reports.
- Updated the Next Finance, Support, Quote Log, Operations, Sidebar, and Help pages to reflect Finance-owned Quote Log, Support-owned Clients/Reports/Timeline, 14-day invoice due defaults, and audited Upgrade Call Type reasons.
- Updated the mobile app so Quote Log is removed from the Operations nested tabs and added as a Finance nested tab beside Finance Overview; mobile Finance and Support copy now reflects 14-day due defaults and Support-owned Clients/Reports/Timeline.
- Created source backups under `BlackFire\_backups\multi_platform_quote_finance_20260715_004344217` before modifying Next/mobile files.
- Re-ran PHP portal verification: `node --check portal.js`, `php -l api/callouts.php`, `quote-invoice-workflow-regression.ps1`, `invoice-callout-regression-1.ps1`, and `calllog-reopen-history-regression.ps1` all passed.
- Re-ran platform checks: `pnpm --filter web typecheck` and `pnpm --filter mobile exec tsc --noEmit` passed. `pnpm --filter web test:portal-parity` could not run because the Next dev server was not running at `http://localhost:3000`.
- Added shared attachment storage helpers in `includes/file_storage.php`; `api/files.php`, `external_upload.php`, and safety compliance delete now resolve attachment disk paths through the shared helper.
- `api/files.php` now resolves attachments from configured `BF_UPLOAD_PATH`, `opload/attachments`, `opload`, or legacy `uploads/attachments`, and returns view/download URL metadata for listed attachments.
- Attachment viewing now follows the related module permission (`quote.view`, `invoice.view`, `safety.view`) so users who can open a record can also open its uploaded files.
- `includes/mailer.php` now supports multipart/mixed SMTP messages with attachments and generates simple server-side PDF bytes for invoices and quotes.
- Invoice send now attaches a generated invoice PDF. Quote send was added to `api/quotes.php` and the PHP Quote Log UI now has a Send Quote modal/action.
- Updated deployment guidance to document `BF_UPLOAD_PATH=opload/attachments` or `BF_UPLOAD_PATH=opload` for cPanel deployments that use the live `opload` folder.
- Re-ran PHP lint for `file_storage.php`, `mailer.php`, `files.php`, `quotes.php`, `invoices.php`, `safety_compliance.php`, `external_upload.php`, and `config.php`; all passed. `node --check portal.js` and all three local regressions passed.
- Hardened the generated standalone safety action tracker in `portal.js`: the storage key is JSON-encoded before injection, localStorage failures fall back to in-memory state, missing criteria text is guarded, and first render is wrapped with a visible fatal-error panel.
- Added `tests/safety-tracker-standalone-regression.ps1` to verify the standalone tracker load contracts.
- Re-ran `node --check portal.js`, the new standalone tracker regression, quote/invoice workflow regression, invoice/callout regression, and call-log reopen regression; all passed.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| BF-QUOTE-RULES-001 | uMakhi | uMakhi | COMPLETED | 3/3 | Implementation and final concurrent-write reconciliation completed; no migration applied. |
| BF-QUOTE-FUNCTIONAL-QA | uMvavanyi | uMvavanyi | COMPLETED | 1/3 | Regressions pass; runtime readiness failed because schema migration is unapplied. |
| BF-QUOTE-CODE-QA | uMcwaningi | uMcwaningi | COMPLETED | 3/3 | Final code and scoped preflight regression review passed. |
| BF-QUOTE-UX-QA | uMbheki | uMbheki | COMPLETED | 2/2 | Final Support navigation and Call Log UI consistency review passed. |
| BF-QUOTE-GOVERNANCE | uMlindi | uMlindi | COMPLETED | 2/2 | POLICY_BLOCK issued for release and sensitive dump incident. |
| BF-QUOTE-ORCHESTRATION | uMlawuli | uMlawuli | COMPLETED | 1/1 | Coordinated implementation, reviews, verification, and blocked unsafe deployment. |

## Blockers / Next Steps
- Administrator must map `Q-140125-0001` to its correct call log.
- Resolve or explicitly archive seven legacy `QA Test quote` rows (`Q-090626-0101` through `Q-090626-0107`) whose callout links point to missing call logs.
- Reconstruct or map missing canonical quotes for invoices `INV-AI20260520`, `INV-AI20260526`, `INV-AI20260528`, and `INV-AI20260606` before applying the strict one-to-one invoice constraint.
- Create and verify a database backup, rehearse the non-transactional DDL migration on a restored staging copy, then obtain explicit apply/deploy authority.
- Contain the application-only changes already pushed in commits `8cd1d49` and `42592e1` until application and schema can release together.
- Treat pushed commit `3fde452` as a potential sensitive-data incident: restrict access, audit remote access, rotate applicable credentials/reset tokens, and remove the dump from Git history through an approved incident/history-rewrite process.
- After migration, rerun integration tests and smoke-test `CO-BF-CP1723` and `CO-040726-0131`.
- If parity screenshots are required, start the Next dev server (`pnpm -C C:\DevWork\BlackFire\apps\web dev`) and rerun `pnpm --filter web test:portal-parity`.
- Set `BF_UPLOAD_PATH` on cPanel to the actual deployed upload folder before uploading this change; recommended value is `opload/attachments` if that is the server folder in use.
- SMTP attachment behavior still needs a live-mail smoke test with real cPanel SMTP credentials because local tests cannot send mail without production SMTP configuration.
- Re-upload the updated `portal.js` to cPanel and regenerate/open the action tracker again. If anything still fails, the tracker will now show the exact load error in the page instead of silently staying blank.

## Learnings
- Application code and required schema must be released atomically; pushing APIs that reference unapplied columns creates immediate runtime risk.
- Read-only preflight checks must mirror every blocking migration predicate, including cases where two exact identifiers resolve to different parent rows.
- Navigation moves require checking menu groups, dashboard shortcuts, page subtitles, and help copy, not only the primary sidebar.
- Repository backups can contain production-like data; backup directories and database dumps require secret/data classification before any commit.
- Concurrent sessions require hash custody and a final live-file reread because tested files can be overwritten without merge conflicts.
- Backup verification must confirm table count and actual `CREATE TABLE` / `INSERT INTO` content; a header-only dump is not a usable cPanel restore file.
- Keep one canonical session-close implementation under `.claude\scripts`; additional provider/constitution paths should be wrappers so close-hook behavior cannot drift.
- Cross-platform process changes should be treated as one product rule and verified in PHP, Next, and mobile together; otherwise navigation and guide copy diverge quickly.
- Branded modals are safer than browser prompts for audited workflow decisions because they can explain business rules, show the affected record, and capture required reason text consistently.
- Attachment storage should never be hardcoded in individual endpoints; a single resolver prevents cPanel folder-name drift from breaking file links.
- Email send paths should generate the attachment on the server at send time so the client receives the actual commercial document even when they never log into the portal.
- Blob-based standalone tools need defensive bootstrapping because storage/security/runtime errors otherwise leave static chrome visible while the data table never renders.

## Goal Status
PENDING

