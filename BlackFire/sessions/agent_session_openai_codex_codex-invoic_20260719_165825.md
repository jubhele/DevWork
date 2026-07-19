# Session: Constitution-enforced OpenAI Codex session
Date: 2026-07-19
Provider: OpenAI Codex
Model: GPT-5 Codex
Project: BlackFire
Project Root: C:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding

## Goal
Show both the invoice count and invoiced monetary value for every month directly on the Invoice Run Rate graph, change Portal Usage by User to seven-day login-based activity with visibly flagged inactive users, and keep the complete dashboard experience synchronized across the PHP portal, Next.js web portal, and Expo mobile app.

## Model Recommendation
Initial task tier: 1-Fast / Cheap; expanded task tier: 3-Complex after the user requested synchronization across PHP, Next.js, and Expo.
Recommended model for expanded scope: o3 / o1  Trust score: 9/10
Active model: GPT-5 Codex  Status: not listed in the current workspace trust matrix; user was advised and work continued with full build verification.

## Decisions
- Session created automatically by the SessionStart enforcement hook.
- Routed by uMlawuli through uSibali to uMakhi, with uMdwebi responsible for graph-label readability.
- Displayed compact Rand values above the run-rate bars while retaining the exact full amount in the graph tooltip and accessible label.
- Defined an active portal user strictly as someone with at least one successful web or mobile login in the current seven-day window.
- Compared the current seven calendar days, including today, against the immediately preceding seven days; page views and actions use the current seven-day window but do not override inactive status.
- Defined the three synchronized platforms as the PHP portal, Next.js web portal, and Expo mobile app.
- Established `packages/types` as the shared dashboard contract and made both PHP and Next.js endpoints return that contract so Expo does not rely on web-only or mock data.
- Prepared the release from a clean branch based on current `master`, excluding project backups, artifact indexes, and session logs from the production commit.
- Treated the user's explicit instruction to perform deployment as authorization to merge the verified release PR.
- Reused the established login-screen logo asset on the first-run consent page rather than maintaining a separate text wordmark.
- Kept local API trust narrowly scoped by adding the active Expo web origin (`http://localhost:8081`) to the existing explicit CORS allowlist.
- Kept the existing desktop Umlilo Portal call-to-action and added a mobile-only copy inside the hamburger menu to avoid desktop duplication.
- Removed the duplicate Next.js route-level favicon and versioned the canonical BlackFire icon metadata so browsers cannot reuse the stale default tab icon.
- Added explicit SQL aliases to the Next.js seven-day usage aggregates so MySQL can sort by those calculated fields.

## Work Done
- Constitution, memory index, and session-log schema verified at session start.
- Updated the Invoice Run Rate graph to show monthly invoice count and compact Rand amount directly above every bar.
- Added exact count and amount details to each graph bar's tooltip and accessible label.
- Changed dashboard usage SQL from 30-day windows to current and preceding seven-day windows.
- Added Active/Inactive status, inactive-row highlighting, an inactive summary badge, and seven-day table labels to Portal Usage by User.
- Verified `portal.js` with `node --check`, `api/dashboard.php` with `php -l`, and the working diff with `git diff --check`.
- Exercised the dashboard endpoint against the local database: the seven-day response succeeded for 12 enabled users and identified 2 users with no successful login as inactive.
- Added shared dashboard types covering consolidated KPIs, monetary summaries, invoice run rate, cash comparisons, due-soon records, and usage rows.
- Extended the PHP dashboard endpoint to return the complete shared contract used by mobile, including date-driven overdue invoices and urgent callouts.
- Rebuilt the Next.js dashboard with one Counts row, one Amounts row, one Attention row, real invoice count/value run rate, combined cash comparisons, approaching deadlines, and permission-scoped seven-day user usage.
- Rebuilt the Expo dashboard to consume `dashboard.summary()` and present the same metrics using real server data; removed its mocked trend series.
- Verified the PHP contract against the local database: 5 invoice-run months, 3 cash comparisons, 12 usage users, a 7-day window, and 5 urgent callouts were returned successfully.
- Passed Next.js and Expo TypeScript checks, Next.js ESLint, the Next.js production build, Expo web export (550 modules), PHP/JavaScript syntax checks, and the 36-route portal parity test.
- Fixed a pre-release permissions gap so Next.js only returns due-soon callouts, invoices, quotes, and tasks that the signed-in user may view; aligned PHP task deadlines to use `due_at` before `due_date`.
- Re-ran the PHP runtime contract after the fix: success, 5 run-rate months, 3 cash comparisons, 12 usage users, 7-day usage period, and 5 urgent callouts.
- Created and merged GitHub PR #22 into `master`; merge commit `810fe6cd3419e96c7ae80e53e911c9506386c46b`.
- Probed production publication paths. The Vercel token is invalid, EAS is logged out and the mobile project has no `eas.json`, and Afrihost SSH timed out on ports 22 and 2222 with no saved WinSCP/FileZilla session.
- Verified the PHP production bundle remains stale: the live `portal.js` returns HTTP 200 but contains none of the four new dashboard markers.
- Started and verified all three local viewing surfaces: PHP on port 8080, Next.js on port 3000, and Expo web on port 8081; each returned HTTP 200 after expected redirects.
- Diagnosed the first-run mobile defects from source and a live preflight: `ConsentScreen` hardcoded `BLACKFIRE`, and the PHP API omitted Expo's active port 8081 from its CORS allowlist.
- Replaced the consent text wordmark with `blackfire-logo-transparent.png`, matching the login screen.
- Added `http://localhost:8081` to the PHP API CORS allowlist and confirmed a live preflight now returns HTTP 204 with the matching `Access-Control-Allow-Origin` header.
- Passed Expo TypeScript validation, PHP syntax validation, `git diff --check`, and observed the Expo web development bundle rebuild successfully after the change.
- Added a mobile-only `Umlilo Portal` menu entry to both the PHP and Next.js public navigation implementations.
- Passed PHP syntax, Next.js TypeScript, Next.js production build, and diff checks; restarted the Next.js local server and HTTP-verified that both ports 8080 and 3000 render the new menu entry.
- Diagnosed the incorrect Next.js tab icon as competing route-level and metadata favicon declarations combined with browser caching.
- Removed `src/app/favicon.ico`, added cache-versioned BlackFire PNG/ICO metadata URLs, rebuilt Next.js, and verified `/login` now emits five versioned BlackFire icon links with no auto-generated route icon.
- Traced Next.js dashboard digest `3347348212` to MySQL error `ER_BAD_FIELD_ERROR: Unknown column 'currentLogins' in 'order clause'`.
- Aliased `lastActivity`, `currentLogins`, `previousLogins`, `pageViews`, and `actions` in the Drizzle selection, rebuilt and restarted port 3000, and executed the corrected aggregate/order query against the local database successfully for 12 active-user rows.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| dashboard-graph-usage-001 | uMakhi + uMdwebi | OpenAI Codex | COMPLETED | 2/3, 2/2 | PHP, Next.js, and Expo implementations synchronized and build-verified. |
| dashboard-deploy-002 | uMakhi + uMlindi | OpenAI Codex | FAILED | 1/3, 1/2 | Source merged in PR #22; external publication blocked by expired/missing platform authentication and unreachable Afrihost SSH. |
| dashboard-local-preview-003 | uMakhi | OpenAI Codex | COMPLETED | 1/3 | Three local dashboard surfaces started and HTTP-verified. |
| mobile-first-run-cors-004 | uMakhi | OpenAI Codex | COMPLETED | 1/3 | Consent logo restored and Expo localhost API preflight verified. |
| public-mobile-menu-005 | uMakhi | OpenAI Codex | COMPLETED | 1/3 | Umlilo Portal added to both mobile public-site menus and locally verified. |
| next-favicon-006 | uMakhi | OpenAI Codex | COMPLETED | 1/3 | Stale competing favicon removed; versioned BlackFire icons served and verified. |
| next-dashboard-runtime-007 | uMakhi | OpenAI Codex | COMPLETED | 1/3 | SQL aggregate aliases fixed; real database query and production build passed. |

## Blockers / Next Steps
- Source release is merged, but production publication needs renewed Vercel authentication, an authenticated/configured EAS project, and working Afrihost cPanel/FTP/SSH access.
- After credentials are restored, publish Next.js to `umlilo-portal-web`, publish/configure the Expo mobile release, upload the PHP portal to Afrihost, and rerun live dashboard health checks.
- The consent/CORS fix is active in the local development servers but remains uncommitted pending the next release decision.

## Learnings
- Compact monetary labels keep month-by-month graph values readable while tooltips preserve exact financial amounts.
- Portal adoption status must use a clear qualifying event; treating unrelated actions as active use can hide users who have not actually logged in.
- A seven-day current-versus-prior comparison provides a faster intervention signal than the previous 30-day window.
- Mobile dashboard requests resolve to the PHP API through the shared client, so PHP and Next.js must expose the same response shape; synchronizing UI alone is insufficient.
- A shared typed dashboard contract prevents the mobile app from silently falling back to partial KPI payloads or fabricated trend values.
- A clean release branch from the current base avoids shipping governance logs and backup snapshots that were accidentally bundled in an earlier feature commit.
- Repository deployment scripts can become stale independently of source code; both PHP scripts still default to non-existent legacy branches, so branch existence and authentication must be verified before every production run.
- Expo web development ports are origin-specific for browser CORS; the active local port must be represented in the server allowlist or login fails at preflight before authentication code runs.
- First-run and login branding should share the same image asset so logo changes cannot diverge between adjacent authentication screens.
- Responsive call-to-action buttons hidden to conserve mobile header space need an equivalent entry inside the expanded hamburger menu.
- Next.js App Router file-based favicon metadata can compete with explicit layout metadata; use one canonical declaration and version its URLs when replacing a cached browser icon.
- Drizzle object property names do not automatically become SQL aliases for raw expressions; any aggregate referenced by `ORDER BY` must use `.as(...)` or repeat the expression.

## Goal Status
PENDING

