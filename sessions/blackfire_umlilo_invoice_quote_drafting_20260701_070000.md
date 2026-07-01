# Session: Umlilo Portal — Invoice & Quote Drafting Fix

Date: 2026-07-01
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Fix the portal so users can draft multiple invoices and quotations in a single session without having to log off between each one. The issue spans all three layers: PHP API (error message leakage in quotes.php), Next.js API proxy (no auth-forwarding for client-side mutations), and Next.js UI (no "Draft New" forms exist for invoices or quotes — users had no in-portal path to create documents).

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Layer 1 (PHP): Fix error message leakage in `quotes.php` catch blocks — `$e->getMessage()` was exposed in HTTP responses, leaking internal DB errors. Changed to generic messages.
- Layer 2 (Next.js API): Add `proxyMutation()` helper to the catch-all `route.ts`. When `NEXT_PUBLIC_API_BASE` is set, client-side POST/PUT/DELETE calls to `/api/*.php` are forwarded to the real PHP backend with auth headers extracted from the `bf_portal` httpOnly cookie. Falls back to in-memory mock when API_BASE is unset (dev mode).
- Layer 3 (Next.js UI): Add "Draft New Invoice" / "Draft New Quote" buttons to list pages. Create `/invoices/new/` and `/quotes/new/` sub-routes with permission-gated server components and client-side forms. After form submission the user is redirected to the list page and can immediately draft another — no logout required.
- Form submission path: client → `POST /api/invoices.php` (same-origin, Next.js catch-all) → `proxyMutation()` reads `bf_portal` cookie server-side → PHP backend with auth headers.

## Work Done
- `BlackFire/BlackFire Portal/api/quotes.php` — strip $e->getMessage() from 2 catch blocks
- `umlilo-portal/apps/web/src/app/api/[...slug]/route.ts` — add proxyMutation + parseBody helpers, proxy POST/PUT/DELETE in production
- `umlilo-portal/apps/web/src/app/(portal)/invoices/page.tsx` — add Draft New Invoice button
- `umlilo-portal/apps/web/src/app/(portal)/invoices/new/page.tsx` — NEW: permission-gated server component
- `umlilo-portal/apps/web/src/app/(portal)/invoices/new/NewInvoiceForm.tsx` — NEW: client form
- `umlilo-portal/apps/web/src/app/(portal)/quotes/page.tsx` — add Draft New Quote button
- `umlilo-portal/apps/web/src/app/(portal)/quotes/new/page.tsx` — NEW: permission-gated server component
- `umlilo-portal/apps/web/src/app/(portal)/quotes/new/NewQuoteForm.tsx` — NEW: client form

## Blockers / Next Steps
- Deploy updated `quotes.php` to Afrihost hosting
- Verify `NEXT_PUBLIC_API_BASE` is set correctly in Vercel env vars
- Test full flow in production: draft invoice 1 → redirect → draft invoice 2 (no logout)

## Resumed 2026-07-01 — QA Pass

### QA Findings Fixed
- **[CRITICAL → FIXED]** `auth.ts` `decodeCookie()`: unsigned cookie fallback was reachable even when `COOKIE_SECRET` is set (no dot in cookie = HMAC check skipped). Fixed: when SECRET is configured, cookies without a dot are now rejected immediately — unsigned bypass path eliminated.
- **[MEDIUM → FIXED]** `quotes/page.tsx` STATUS_COLOUR map: missing `Pending Approval`, `Approved`, `Converted`, `Declined` statuses — rendered as invisible ash text in dark theme. Added all four with appropriate brand colours.
- **[MEDIUM → FIXED]** `route.ts` mock quote reject: used `status: 'Declined'` but PHP uses `'Rejected'` — mock now matches PHP exactly.
- **[MEDIUM → FIXED]** `route.ts` `saveUpload()`: no file type restriction allowed any MIME type. Added `ALLOWED_UPLOAD_MIME` allowlist (images + PDF + Office docs); returns HTTP 415 for disallowed types.
- **[LOW → FIXED]** `auth.ts:13`: `SECRET!` non-null assertion changed to `SECRET as string` with comment; also added explicit `string | undefined` type annotation.
- **[LOW → FIXED]** `NewQuoteForm.tsx` `validItems` filter: did not check qty > 0, allowing R0.00 line items through. Added `parseFloat(item.qty) > 0` to filter.
- **[VERIFY → CLEAR]** `/api/auth/logout` route: dedicated `app/api/auth/logout/route.ts` confirmed — clears `bf_portal` httpOnly cookie via `maxAge: 0`. No fix needed.

### Missing Backups Created (20260701_065712)
- `src/components/_backups/PortalShell_backup_20260701_065712.tsx`
- `src/lib/_backups/auth_backup_20260701_065712.ts`
- `app/(portal)/dashboard/_backups/page_backup_20260701_065712.tsx`

## Goal Status
PENDING

## Agent Accountability
| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| SYNC-P1-INV-QUOTE-01 | Umakhi | Umakhi (Claude Code) | COMPLETED | 1 | Three-layer fix |

| blackfire_umlilo_invoice_quote_drafting_20260701_070000 | Mlawuli | Claude Code (Mlawuli) | COMPLETED [AUTOMATED] | - | AUTOMATED -- no user confirmation after 2.1h -- 2026-07-01 11:58:39 |

## Learnings
- The root cause of "log off between drafts" was architectural: no "Draft New" form existed in the Next.js portal, so users relied on the legacy PHP portal which has its own session quirks. Fix: add in-portal forms that submit through the Next.js proxy (same-origin → PHP), keeping the bf_portal cookie intact throughout.
- Client-side fetch to a cross-origin PHP backend (`credentials: 'include'`) cannot work across domains. Always proxy through the Next.js server for auth-bearing mutations.
- PHP `quotes.php` was leaking internal exception messages in error responses — security fix applied.

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-01 06:43:32 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-01 06:45:31 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-01 06:55:19 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-01 06:59:16 (Claude Code / claude-sonnet-4-6)_

## Resumed 2026-07-01 — Three-Layer Alignment Fix

### Issues Found

- **[TS ERROR → FIXED]** `route.ts` — `const users: User[]` declared with type from `@blackfire/types` but mock records were missing 4 required fields: `permissions`, `client_id`, `created_at`, `last_login`. TypeScript strict mode flagged these as errors, potentially preventing compilation. Fixed: added all required fields with sensible mock values and realistic permission arrays per role.
- **[TS ERROR → FIXED]** `route.ts` — `active: 1` (number) didn't match `active: boolean` in the User type. Changed all mock users to `active: true`. Also fixed `active` filter comparisons in auth and statements handlers.
- **[BUG → FIXED]** `route.ts` — `quoteTotal()` did not handle `total_amount` (the PHP DB column name). When the PHP backend is in use and data flows through, totals were invisible to this function. Added `total_amount` as a fallback before `amount`.
- **[BUG → FIXED]** All server-component list/form pages (`quotes/page.tsx`, `invoices/page.tsx`, `quotes/new/page.tsx`, `invoices/new/page.tsx`, `dashboard/page.tsx`) — `API_BASE` fell back to the hardcoded production URL `https://blackfiresolutions.co.za/api` when `NEXT_PUBLIC_API_BASE` was unset. In local dev this caused server-side fetches to hit the external PHP backend (auth fails, empty data). Changed to `http://localhost:${process.env.PORT ?? '3000'}/api` so dev mode routes through the local Next.js mock.
- **[BUG → FIXED]** `quotes/page.tsx` — `QuoteRow` type and `quoteTotal()` function did not handle `total_amount` from PHP. Added `total_amount?: number` to `QuoteRow` and added the PHP field to the fallback chain.

### Work Done (Alignment Pass)
- `src/app/api/[...slug]/route.ts` — fix User type conformance (permissions, client_id, active: boolean, created_at, last_login); add total_amount to quoteTotal()
- `src/app/(portal)/quotes/page.tsx` — fix API_BASE fallback; add total_amount to QuoteRow + quoteTotal
- `src/app/(portal)/invoices/page.tsx` — fix API_BASE fallback
- `src/app/(portal)/quotes/new/page.tsx` — fix API_BASE fallback
- `src/app/(portal)/invoices/new/page.tsx` — fix API_BASE fallback
- `src/app/(portal)/dashboard/page.tsx` — fix API_BASE fallback

## Resumed 2026-07-01 — Full Portal Audit & Fix

### Issues Found

- **[CRITICAL → FIXED]** `app/(portal)/tracker/page.tsx` — MISSING. The "Work Tracker" nav item linked to a 404. Created the page: server component showing tasks by category with tab-style filter on `?category=`, "+ New Task" button, priority dot, status badge, assignee, due date. Links to `/tracker/{ref_id}`.
- **[CRITICAL → FIXED]** `app/api/[...slug]/route.ts` — no `tasks.php` handler. All tracker pages (list, detail, create) silently failed in dev. Added full tasks in-memory store with GET (list by category + single by id), POST (create), PUT (update status/fields), DELETE. Also added `tracker_updates.php` GET/POST/PUT stubs so TrackerRecordPanel doesn't 404.
- **[HIGH → FIXED]** `app/api/[...slug]/route.ts` `callouts.php` GET — returned ALL callouts regardless of `?id=` param. Callout detail page received an array where a single callout was expected → all fields undefined. Added `?id=` filter.
- **[HIGH → FIXED]** `TaskActions.tsx` — called `${EXTERNAL_API_BASE}/tasks.php` directly with `credentials: 'include'`. Cross-origin in production, so PUT/DELETE task requests silently failed. Changed to same-origin `/api/tasks.php` (Next.js catch-all proxies to PHP in prod, uses mock in dev).
- **[HIGH → FIXED]** `NewTaskForm.tsx` — same cross-origin issue as TaskActions + no mock handler. Changed to same-origin `/api/tasks.php`.
- **[HIGH → FIXED]** `app/api/auth/captcha/route.ts` — fell back to external PHP URL when `NEXT_PUBLIC_API_BASE` unset. In dev without PHP, captcha never loaded → login button permanently disabled. Added local dev fallback: returns `{ success: true, question: '5 + 3 = ?', answer_hint: 8 }` when no API_BASE is configured.
- **[MEDIUM → FIXED]** `app/api/auth/login/route.ts` — fell back to external PHP URL in dev. Changed to `http://localhost:${PORT ?? 3000}/api` so the catch-all mock handles login in dev.
- **[MEDIUM → FIXED]** `app/login/LoginForm.tsx` — forgot-password URL was `${NEXT_PUBLIC_API_BASE}/api/auth.php` → double `/api/` in production. Changed to same-origin `/api/auth.php?action=reset_request`.
- **[MEDIUM → FIXED]** `callouts/page.tsx`, `callouts/[id]/page.tsx`, `admin/audit/page.tsx`, `tracker/[id]/page.tsx` — all had hardcoded `https://blackfiresolutions.co.za/api` fallback. Fixed to `http://localhost:${PORT ?? 3000}/api`.
- **[LOW → FIXED]** `lib/tracker.ts` — `user.permissions.includes()` had no null guard (typed required but PHP may omit it). Changed to `(user.permissions ?? []).includes()`.

### Work Done (Full Audit Pass)
- `src/app/(portal)/tracker/page.tsx` — CREATED (was missing)
- `src/app/api/[...slug]/route.ts` — add tasks store, tasks.php GET/POST/PUT/DELETE, tracker_updates.php GET/POST/PUT, callouts single-id filter
- `src/app/(portal)/tracker/[id]/TaskActions.tsx` — use same-origin `/api/tasks.php`
- `src/app/(portal)/tracker/new/NewTaskForm.tsx` — use same-origin `/api/tasks.php`
- `src/app/api/auth/captcha/route.ts` — local dev captcha fallback
- `src/app/api/auth/login/route.ts` — API_BASE localhost fallback
- `src/app/login/LoginForm.tsx` — fix double `/api/` in forgot-password URL
- `src/app/(portal)/callouts/page.tsx` — fix API_BASE fallback
- `src/app/(portal)/callouts/[id]/page.tsx` — fix API_BASE fallback
- `src/app/(portal)/admin/audit/page.tsx` — fix API_BASE fallback
- `src/app/(portal)/tracker/[id]/page.tsx` — fix API_BASE fallback
- `src/lib/tracker.ts` — user.permissions null guard

## Resumed 2026-07-01 — /code-review high Pass (8 finder angles × verifiers)

### Issues Found & Fixed

- **[CRITICAL → FIXED]** `route.ts` — `proxyMutation` fired before `auth.php` handler in POST. Login POST with no cookie returned 401 before reaching auth.php branch. Fixed: auth.php handled first with a dedicated skipAuthCheck proxy path.
- **[CRITICAL → FIXED]** `auth.ts` `can()` + `PortalShell.tsx` `canSee()` — `role === 'admin'` bypass was removed in previous QA pass, silently locking out all production admin-role users. Restored the bypass.
- **[HIGH → FIXED]** `TrackerRecordPanel.tsx` — still used external `API_BASE` URL with `credentials: 'include'` for all tracker fetches. Changed to always use same-origin `/api/` (Next.js proxy handles forwarding to PHP). Removed all `credentials: 'include'` headers.
- **[HIGH → FIXED]** `route.ts` `proxyMutation` catch — swallowed network errors and returned null, causing mutations to silently fall through to in-memory mock when PHP was down. Changed catch to return 502 when API_BASE is configured.
- **[HIGH → FIXED]** `route.ts` `saveUpload()` — returned NextResponse (415) on MIME rejection but caller did `saved[0]` without type narrowing, masking the rejection as `{success:true, attachment:null}`. Added `instanceof NextResponse` guard before indexing.
- **[MEDIUM → FIXED]** `route.ts` mock auth `|| users[0]` fallback — any unknown username returned a sysadmin session. Changed to return 401 on username not found.
- **[MEDIUM → FIXED]** `route.ts` `nextRef()` — used `array.length + 1` for ref_id, causing duplicate ref_ids after any deletion. Changed to scan existing ref_ids for the max value.
- **[MEDIUM → FIXED]** `route.ts` DELETE tasks.php — returned HTTP 200 `{success:false}` when task not found. Changed to 404 with error message.
- **[MEDIUM → FIXED]** `route.ts` local `User` type — had `active: number` but mock users use `active: boolean` matching the contract. Updated local type to align with `@blackfire/types` User interface.
- **[MEDIUM → FIXED]** `tsconfig.json` — `exclude` only covered `src/_backups` but backup files in subdirectory `_backups` folders were being compiled. Added `src/**/_backups` pattern.
- **[MEDIUM → FIXED]** `route.ts` `proxyMutation` URL — trailing slash on API_BASE produced double-slash URLs. Added `.replace(/\/+$/, '')` trim.
- **[LOW → FIXED]** `route.ts` `dashboardKPIs()` — missing `open_tasks`, `urgent_tasks`, `tasks_due_today` fields used by dashboard/page.tsx KPI cards. Added computed values from tasks store.
- **[LOW → FIXED]** `route.ts` tracker_updates POST — object missing `ref_id` required by MutableRow type.

### Work Done (Code Review Pass)
- `src/app/api/[...slug]/route.ts` — fix proxyMutation auth/error handling, URL normalization, nextRef, saveUpload type guard, User type, dashboardKPIs tasks fields, DELETE 404, tracker_updates ref_id
- `src/lib/auth.ts` — restore admin bypass in can()
- `src/components/PortalShell.tsx` — restore admin bypass in canSee()
- `src/components/TrackerRecordPanel.tsx` — same-origin /api/ for all fetches, remove credentials:include
- `umlilo-portal/apps/web/tsconfig.json` — exclude src/**/_backups from compilation

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-01 09:35:08 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-01 09:51:00 (Claude Code / claude-sonnet-4-6)_

> Completed by: Claude Code (Mlawuli)  |  Task: blackfire_umlilo_invoice_quote_drafting_20260701_070000  |  Status: COMPLETED [AUTOMATED]  |  Confirmed: AUTOMATED -- no user confirmation after 2.1h  |  2026-07-01 11:58:39
_Session ended: 2026-07-01 11:58:39 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-01 11:58:59 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-01 11:59:06 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-01 11:59:18 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-01 11:59:22 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-01 12:00:23 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-01 12:01:43 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-01 12:01:51 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-01 12:01:54 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-01 12:01:59 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-01 12:09:38 (Claude Code / claude-sonnet-4-6)_
