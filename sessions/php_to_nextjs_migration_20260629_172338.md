# Session: PHP → Next.js Migration (Phase 0 + Phase 1 auth cutover)
Date: 2026-06-29
Provider: GitHub Copilot
Model: Claude Opus 4.8

## Goal
Move the BlackFire/AECI portal away from the PHP/MySQL backend to a fully native
Next.js architecture. Inventory all remaining PHP usage, produce a migration plan,
and begin implementation. User approved PlanetScale (drop-in MySQL) and instructed
"use what you recommend and actions". First vertical slice: native data layer
(Drizzle) + native auth, replacing the PHP-proxy API routes.

## Model Recommendation
Task tier: 3-Complex (architecture migration)
Recommended model: Opus 4.7 (Claude) / o3 (OpenAI). Trust score: 10/10 (Claude tier 3)
Active model: Claude Opus 4.8. Status: correct for tier.
Routed agent: Umakhi (The Builder — code/portal).

## Decisions
- Target DB: PlanetScale (MySQL-compatible, drop-in for existing bf_ schema). Vercel for hosting.
- Data layer: Drizzle ORM + mysql2, snake_case casing, schema hand-authored from prod backup (local MySQL not running).
- Auth: custom native module reusing existing `bf_mobile_tokens` table. Raw token in httpOnly `bf_auth` cookie (web) or `Authorization: Bearer` (mobile); token_hash = sha256(raw). bcryptjs verifies PHP `$2y$` hashes. Stateless HMAC CAPTCHA + HMAC CSRF.
- Kept `getServerUser(cookieHeader)` signature for call-site compatibility (all ~20 portal pages) but resolve natively via `getCurrentUser()`.
- Drizzle datetime columns take `Date` objects (not formatted strings) on insert/update.
- `can()`/`hasRole()` made null-tolerant to keep typecheck green.

## Work Done
- apps/web/drizzle.config.ts — NEW: drizzle-kit introspection config.
- apps/web/src/db/schema.ts — EXTENDED: now covers ALL 28 bf_ tables (auth, clients, callouts, quotes/items, invoices, payments, transactions, statements, remittances, tasks/assignees/sequences, tracker_updates/revisions, safety_files/items/personnel/compliance, attachments, digital_signatures, external_upload_tokens, policy_acks, portal_enquiries, mobile_rate_limits). Missing columns added: paid_date on invoices, is_active + closure_confirmed_at on callouts, is_active on safety_files.
- apps/web/src/db/client.ts — NEW: pooled mysql2 + drizzle instance.
- apps/web/src/lib/server-auth.ts — NEW: login/logout/getCurrentUser/captcha/CSRF/RBAC. Fixed Date typing.
- apps/web/src/lib/data/counters.ts — NEW: nextRefId() port.
- apps/web/src/lib/data/dashboard.ts — NEW: getDashboardData(role) native Drizzle replacement for dashboard.php.
- apps/web/src/lib/data/clients.ts — NEW: getClients/getClient/createClient native Drizzle.
- apps/web/src/lib/auth.ts — getServerUser now calls native getCurrentUser; can()/hasRole() null-tolerant.
- apps/web/src/app/api/auth/{captcha,login,me,logout}/route.ts — all 4 replaced PHP-proxy → native.
- apps/web/src/app/api/dashboard/route.ts — NEW: GET /api/dashboard (native).
- apps/web/src/app/api/clients/route.ts — NEW: GET + POST /api/clients (native, Zod-validated).
- apps/web/src/app/(portal)/dashboard/page.tsx — uses getDashboardData() directly, no PHP fetch.
- apps/web/package.json — added typecheck, db:pull, db:generate, db:migrate scripts.
- apps/web/.env — NEW (gitignored): local BF_DB_* dev creds.
- pnpm-workspace.yaml — allowBuilds esbuild: true.
- packages/api-client/index.ts — dashboard.kpis and clients.{list,get} point to native /api/* routes.
- Installed: drizzle-orm, mysql2, zod, bcryptjs, drizzle-kit, @types/bcryptjs, dotenv.
- Verified: `pnpm exec tsc --noEmit` passes 0 errors across the whole web app.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| migrate-auth-slice | Umakhi | Umakhi | COMPLETED | 3/3 | Native data layer + auth cutover, typecheck green |

## Blockers / Next Steps
- PlanetScale not yet provisioned. Once it is: set DATABASE_URL, run `pnpm --filter web db:pull` to introspect the full schema (callouts, quotes, invoices, finance, tasks, safety, files, audit) into schema.ts.
- Phase 2: port remaining ~29 PHP endpoints, one group at a time (dashboard → clients/users → callouts → quotes/invoices/payments → finance → tasks/tracker → safety → files/uploads/signatures → audit/admin/enquiries). Each: Zod-validate → Drizzle query → RBAC → same JSON contract (@blackfire/types unchanged).
- Local MySQL is not installed/running — Phase 2 dev needs PlanetScale or a local MySQL instance.
- Runtime smoke test of login/me/logout not yet performed (needs a reachable DB).

## Learnings
- pnpm v11 ignores the `pnpm.onlyBuiltDependencies` field in package.json; build approvals must go in pnpm-workspace.yaml under `allowBuilds:`.
- Drizzle mysql datetime columns (mode date) require `Date` objects on insert/update — passing formatted strings is a type error. Keep date→string formatting only for API output.
- Local MySQL was not running and no mysqld on PATH; hand-authoring the Drizzle schema from a prod CREATE TABLE backup was faster than restoring the DB just to introspect.
- Sandbox filesystem probe (bfscfg.exe) intermittently fails; pnpm/tsc/timestamp commands need requestUnsandboxedExecution.

## Goal Status
PENDING

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-06-29 17:24:19 (Claude Code / claude-sonnet-4-6)_
