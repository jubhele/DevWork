# Session: RBAC Definition, Sysadmin God-Mode, Finance Data Fix
Date: 2026-05-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Define and implement a comprehensive role-based access control (RBAC) matrix across the BlackFire portal. System administrator role must have god-like permissions over the entire system. Investigate and fix why finance module data is not visible.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6   Trust score: 9/10
Active model: claude-sonnet-4-6   Status: correct

## Root Cause Analysis
1. **`p-income` page has no data refresh** — handler calls `renderIncome()` directly without first calling `refreshInvoices()` or `refreshTransactions()`. If the user navigates there after session startup or the data cache is stale, the income statement shows R 0 across the board. This is the primary reason finance data does not appear.
2. **`sysadmin` missing from `renderUsers()` matrix** — the display matrix in the Users page has no sysadmin entry, so any sysadmin account shows all dashes (no permissions visible).
3. **`sysadmin` not in `openCreateUserModal` roles list** — cannot create a sysadmin user through the UI.
4. **`bf_role_permissions` DB table has no `sysadmin` rows** — the PHP `can()` bypass handles runtime auth correctly, but the table should be authoritative for audit purposes.

## Decisions
- Keep the `SESSION?.role==='sysadmin'` bypass in JS `can()` and the PHP `can()` bypass — these are the god-mode guards
- Add sysadmin explicitly to the finance entries in PERMS for self-documentation
- Fix `p-income` handler to call `refreshInvoices()` + `refreshTransactions()` before rendering
- Add sysadmin row to `renderUsers()` matrix with full permissions
- Add sysadmin to create-user modal roles list but only render that option when current user IS sysadmin
- Create `install/rbac_full_migration.sql` as the authoritative source for all role permissions

## Work Done
- portal.js — fixed p-income handler, updated PERMS, updated renderUsers matrix, updated create-user modal
- install/rbac_full_migration.sql — new: complete bf_role_permissions seeding for all roles

## Blockers / Next Steps
- Run the SQL migration against the live database to populate bf_role_permissions
- Verify finance data appears after fix by logging in and navigating to Income Statement

## Learnings
- `renderIncome()` reads only from cached proxyDB — never make a page handler that renders purely from cache without a prior refresh
- The PHP `can()` sysadmin bypass works correctly; the finance data gap was a JS rendering issue, not a server permissions issue
_Session ended: 2026-05-21 20:16:27 (Claude Code / claude-sonnet-4-6)_
