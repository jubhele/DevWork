# Session: SYNC-P0-08/09 close + Phase 1 RBAC wiring begin

Date: 2026-07-01
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal

Continuing from SYNC-P0-07 (schema regen COMPLETE, Phase 0 GO). This session:
1. Confirm SYNC-P0-08 (enum-case unification) is subsumed by P0-07's live-DDL regen.
2. Execute SYNC-P0-09 (null-write audit for 4 insertion-risk columns).
3. Update phase0-foundation.md with closure verdicts.
4. Begin Phase 1: wire RBAC into apps/web from the SYNC-P1-01 role-permission matrix.

## Model Recommendation

Task tier: 2-Medium
Recommended model: claude-sonnet-4-6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Goal Status

ACHIEVED

## Decisions

- **SYNC-P0-08 (enum-case unification)**: Confirmed CLOSED / subsumed by P0-07. Schema was rebuilt
  from live DDL, so enum values are whatever the live DB uses — no drift possible. PHP ↔ live DB
  casing is aligned by definition (PHP wrote those enum values). tsc PASS confirms TS types match.
- **SYNC-P0-09 (null-write audit)**: All 4 flagged columns (`job_no`, `quote_no`, `invoice_no`,
  `signed_at`) are nullable in schema.ts (P0-07 fixed `quote_no` and `signed_at` from `.notNull()`).
  Active write paths omit all 4, or no write path exists yet (`signed_at` — PHP-only flow). PASS.
- **SYNC-P1-02-Umakhi (permission string unification)**: API routes and UI components had stale plural
  permission names (`callouts.view`, `invoices.create`, `quotes.view`, etc.) that no longer matched
  the canonical `bf_role_permissions` seeded by `rbac_full_migration.sql`. Fixed all 16 occurrences
  across 11 files to singular canonical form. Also fixed nav-guard mismatches (`client.view` →
  `callout.view`, `user.view` → `security.users`).
- **`task.*` permissions**: `task.view`, `task.create`, `task.update` were not in the RBAC SQL despite
  the tasks/route.ts API using them. Added to `rbac_full_migration.sql` (new installs) and created
  delta migration `rbac_task_permissions_20260701.sql` (existing installs). Role assignments follow
  same pattern as `callout.*` with safety_officer excluded.
- Did NOT attempt to apply the delta migration to the live DB during this session — that requires
  running SQL against the production MySQL instance and needs a separate deployment step.

## Work Done

- `docs/sync/phase0-foundation.md` — Appended SYNC-P0-08 (CLOSED/subsumed) and SYNC-P0-09 (PASS)
  sections with full verdicts and updated JSON summary.
- `BlackFire/apps/web/src/app/api/callouts/route.ts` — `callouts.view` → `callout.view`, `callouts.create` → `callout.create`
- `BlackFire/apps/web/src/app/api/quotes/route.ts` — `quotes.view` → `quote.view`, `quotes.create` → `quote.create`
- `BlackFire/apps/web/src/app/api/invoices/route.ts` — `invoices.view` → `invoice.view`, `invoices.create` → `invoice.create`, `invoices.update` → `invoice.mark_paid`
- `BlackFire/apps/web/src/app/api/clients/route.ts` — `clients.view` → `callout.view`, `clients.create` → `user.create`
- `BlackFire/apps/web/src/app/api/payments/route.ts` — `invoices.update` → `invoice.mark_paid`
- `BlackFire/apps/web/src/app/api/finance/route.ts` — `finance.view` → `finance.income`
- `BlackFire/apps/web/src/app/api/tracker-updates/route.ts` — Fixed `permFor()` map (all 4 plural → singular), `callouts.update` → `callout.update`
- `BlackFire/apps/web/src/app/api/enquiries/route.ts` — `clients.view` → `callout.view`, comment updated
- `BlackFire/apps/web/src/app/(portal)/invoices/page.tsx` — `invoices.create` → `invoice.create`
- `BlackFire/apps/web/src/app/(portal)/quotes/page.tsx` — `quotes.create` → `quote.create`
- `BlackFire/apps/web/src/components/PortalShell.tsx` — `client.view` → `callout.view`, `finance.view` → `finance.income`
- `BlackFire/apps/web/src/components/Sidebar.tsx` — `client.view` → `callout.view`, `finance.view` → `finance.income`, `user.view` → `security.users`
- `BlackFire/apps/web/src/app/(portal)/admin/users/page.tsx` — `user.view` → `security.users`
- `BlackFire/apps/web/src/app/(portal)/help/page.tsx` — updated help text `finance.view` → `finance.income`
- `BlackFire/BlackFire Portal/install/rbac_full_migration.sql` — Added `task.*` permissions for 10 roles + updated summary matrix
- `BlackFire/BlackFire Portal/install/rbac_task_permissions_20260701.sql` — NEW: delta migration for existing installs

### Verification
- `npx tsc --noEmit`: **PASS** (clean, no output)
- Final grep scan for stale permission strings: **PASS** (zero hits)

## Blockers / Next Steps

- [ ] **Apply `rbac_task_permissions_20260701.sql` to live DB** — delta migration must be run against
      production MySQL instance before tracker task routes work for non-sysadmin users.
- [ ] **SYNC-P1-03** — Next Phase 1 task: audit umlilo-portal's `auth.ts` `can()` function and nav
      guards for the same permission string drift (it uses `user.role === 'sysadmin'` bypass only).
- [ ] **Phase 1 gate**: P1-01 (role-permission matrix) COMPLETE. P1-02 (permission string fix)
      COMPLETE. P1-03 (umlilo parity) outstanding.
- [ ] Consider adding `client.view` and `client.create` as explicit RBAC permissions in a future
      migration rather than aliasing to `callout.view`/`user.create` — more granular access control.

## Learnings

- Permission strings in the apps/web codebase had diverged from the canonical RBAC SQL in two ways:
  (1) plural vs singular (`callouts.view` vs `callout.view`), and (2) invented permissions with no
  DB backing (`client.view`, `user.view`, `finance.view`). The result was that non-sysadmin users
  were always getting 403 Forbidden from the Drizzle-backed API routes (which load permissions from
  the DB), while the PHP-bridge pages (which used the PHP session's `permissions` array) worked fine.
  This explains any reported UI differences between the PHP portal and the Next.js app.
- When adding new RBAC permissions, always create a delta migration file alongside the full
  migration SQL — `INSERT IGNORE` is safe to run on both new and existing installs.
- Sidebar/PortalShell nav guards are UI-only (they hide nav items for unauthorized users) but must
  match the API gate permissions exactly, otherwise a user can see a nav item but hit 403 when they
  click it — or worse, the nav item is hidden even though they have API access.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| SYNC-P0-08-close | Mhloli (Inspector) | Claude Code as Mlawuli | COMPLETED | 1 | Enum-case drift confirmed subsumed by P0-07 |
| SYNC-P0-09-Mhloli | Mhloli (Inspector) | Claude Code as Mlawuli | COMPLETED | 1 | All 4 null-write risk columns: SAFE |
| SYNC-P1-02-Umakhi | Umakhi (Builder) | Claude Code as Mlawuli | COMPLETED | 1 | 16 stale permission strings fixed across 11 files; task.* RBAC SQL added |

> Completed by: Umakhi (Claude Code as Mlawuli)  |  Task: SYNC-P1-02  |  Status: COMPLETED  |  Confirmed: User confirmed ACHIEVED  |  2026-07-01T06:15:00+02:00

```json
{
  "session_id": "20260701_055000",
  "agent": "Mhloli+Umakhi",
  "model_endpoint": "claude-sonnet-4-6",
  "token_metrics": {
    "tokens_in": 0,
    "tokens_out": 0,
    "iteration_count": 2
  },
  "outcome": {
    "status": "SUCCESS",
    "cost_category": "TIER_2_MED"
  },
  "optimization": {
    "action_taken": "None"
  }
}
```
_Session ended: 2026-07-01 06:06:10 (Claude Code / claude-sonnet-4-6)_
