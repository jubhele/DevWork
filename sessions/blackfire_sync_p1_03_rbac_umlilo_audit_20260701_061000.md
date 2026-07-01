# Session: SYNC-P1-03 — RBAC admin bypass audit in umlilo-portal

Date: 2026-07-01
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal

Apply `rbac_task_permissions_20260701.sql` delta migration to the live MySQL instance, then execute
SYNC-P1-03: audit umlilo-portal's `can()` function and nav guards for the same permission string
drift identified and fixed in apps/web during SYNC-P1-02.

## Model Recommendation

Task tier: 2-Medium
Recommended model: claude-sonnet-4-6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Goal Status

ACHIEVED

## Decisions

- **Delta SQL (`rbac_task_permissions_20260701.sql`)**: Auto-classifier blocked the `mysql` CLI call.
  Provided the exact command to user to run manually. SQL is INSERT IGNORE in a transaction — safe
  to run at any time without risk of data loss.
- **`can()` admin bypass (auth.ts:74)**: Removed `|| user.role === 'admin'` from the sysadmin
  bypass. Admin is a standard role with explicit RBAC rows in `bf_role_permissions` — it should NOT
  auto-bypass all permission checks. Only `sysadmin` gets the universal bypass.
- **`canSee()` admin bypass (PortalShell.tsx:36)**: Same fix applied. `canSee()` was inconsistent
  with `Sidebar.tsx` (which already correctly only bypassed for `sysadmin`).
- **Permission strings**: Both `Sidebar.tsx` and `PortalShell.tsx` nav items already used correct
  canonical strings (`callout.view`, `task.view`, `quote.view`, `invoice.view`). No changes needed.
- **Pre-existing tsc error (dashboard/page.tsx)**: `DashboardKPIs` type was extended with
  `open_tasks`, `urgent_tasks`, `tasks_due_today` when the tracker was built, but `normalizeKPIs`
  was not updated. Fixed by adding the three fields (defaulting to 0 if not in API response).
- **tsconfig exclude `src/_backups`**: Backup files were being type-checked and failing. Added
  `src/_backups` to tsconfig exclude list.

## Work Done

- `umlilo-portal/apps/web/src/lib/auth.ts` — `can()`: removed `|| user.role === 'admin'` bypass; only `sysadmin` auto-passes
- `umlilo-portal/apps/web/src/components/PortalShell.tsx` — `canSee()`: removed `|| role === 'admin'` bypass; aligns with Sidebar.tsx
- `umlilo-portal/apps/web/src/app/(portal)/dashboard/page.tsx` — `normalizeKPIs()`: added `open_tasks`, `urgent_tasks`, `tasks_due_today` fields to satisfy updated `DashboardKPIs` type
- `umlilo-portal/apps/web/tsconfig.json` — added `src/_backups` to `exclude` list
- `umlilo-portal/apps/web/src/app/(portal)/dashboard/page.tsx` — added 3-column task KPI row (Open Tasks, Urgent Tasks, Due Today) as clickable links to /tracker; urgent shows fire-orange when >0, due-today shows info-blue when >0; added Open Tasks to Current Workload bar chart; included `open_tasks` in `workloadMax`

### Verification
- `npx tsc --noEmit` (umlilo-portal/apps/web): **PASS** (clean, no output, both passes)

## Blockers / Next Steps

- [x] **Apply `rbac_task_permissions_20260701.sql` to live DB** — APPLIED. 23 `task.*` rows confirmed
      in `bf_role_permissions` (DB client screenshot). Run manually:
      ```
      mysql -h localhost -P 3306 -u <BF_DB_USER> -p<BF_DB_PASS> <BF_DB_NAME> < "c:\DevWork\BlackFire\BlackFire Portal\install\rbac_task_permissions_20260701.sql"
      ```
      Verify: `SELECT role, permission FROM bf_role_permissions WHERE permission LIKE 'task.%' ORDER BY role, permission;`
- [ ] **SYNC-P1 gate**: P1-01 COMPLETE, P1-02 COMPLETE, P1-03 COMPLETE (this session).
- [x] **Dashboard task KPIs display**: Added 3-column task KPI row + workload bar row. Urgent Tasks highlights fire-orange when non-zero; Due Today highlights info-blue.
- [x] **`admin` bypass removal impact**: Verified 38 explicit admin permission rows in `rbac_full_migration.sql` covering all modules (callout.*, task.*, quote.*, invoice.*, finance.*, safety.*, security.*, user.*, capture.*). Safe.

## Learnings

- `can()` (server-side) and `useCan()` (client-side hook) were inconsistent: `can()` granted admin
  a full bypass, `useCan()` only bypassed sysadmin. This means admin users would see different
  behavior depending on whether a guard ran SSR or in the browser. Canonical rule: only `sysadmin`
  gets the universal bypass; all other roles rely on explicit RBAC rows.
- Backup files in `src/_backups/` will be type-checked by tsc if not excluded — always add the
  backup folder to tsconfig `exclude` when creating backups inside the src tree.
- When a shared type (`DashboardKPIs`) is extended with new fields, all `normalizeKPIs`-style
  mapping functions that construct that type must be updated in the same commit. A tsc pass would
  have caught this immediately — worth running tsc after every contract/type change.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| SYNC-P1-03-Mhloli | Mhloli (Inspector) | Claude Code as Mlawuli | COMPLETED | 1 | Audited can(), useCan(), canSee(), nav strings in umlilo-portal; verified admin permissions |
| SYNC-P1-03-Umakhi | Umakhi (Builder) | Claude Code as Mlawuli | COMPLETED | 2 | Fixed 2 admin bypasses + dashboard KPIs type gap + tsconfig exclude + task KPI cards + workload row |

> Completed by: Umakhi (Claude Code as Mlawuli)  |  Task: SYNC-P1-03  |  Status: COMPLETED  |  Confirmed: User confirmed ACHIEVED  |  2026-07-01T06:20:00+02:00

```json
{
  "session_id": "20260701_061000",
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
_Session ended: 2026-07-01 06:16:42 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-01 06:22:14 (Claude Code / claude-sonnet-4-6)_
