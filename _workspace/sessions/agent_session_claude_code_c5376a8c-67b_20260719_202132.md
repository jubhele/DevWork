# Session: BlackFire Portal — P&L Ledger tab + table readability fixes
Date: 2026-07-19
Provider: Claude Code
Model: claude-fable-5
Project: blackfire
Project Root: C:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding
Detail: user screenshots matched the BlackFire Portal P&L Ledger; bound via ProjectBind (-SessionId c5376a8c-67b5-4dd9-ba7b-800fe22b8041) to C:\DevWork\BlackFire. Detailed project log: C:\DevWork\BlackFire\sessions\blackfire_pll_tab_buttons_fix_20260719_214700.md

## Goal
Fix the BlackFire Portal P&L Ledger: (1) tab buttons (Remittances/Bank Statement/Sales Invoices/Supplier Costs/Monthly P&L) did nothing when clicked; (2) Remittances table Notes/Flags text overlapped the Invoices Covered column making it unreadable; audit similar areas portal-wide.

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: claude-fable-5  Status: over-powered (session already active; proceeded)

## Decisions
- Tab bug was CSS, not JS: `.pll-tab{display:block}` defeated the `hidden` attribute. Fixed with a global `[hidden]{display:none!important}` reset (supersedes the earlier one-off `.calllog-detail[hidden]` patch).
- Overlap bug: `.tw > table td{white-space:nowrap}` outweighed `.td-inv-covered`/`.td-notes`; raised their specificity to `.tw > table td.<class>` and added min-widths. Also fixes Bank Statement tab (shared class).
- `???` strings in remittance notes are corrupted characters in the live DB, not a rendering bug — left for a data cleanup pass.
- Siyasiza deactivation: created a `bf_suppliers` registry (active flag, host_company_id DEFAULT 1) instead of deleting data; Monthly P&L hides inactive suppliers' columns but historical costs stay in Total Costs so margins remain truthful. Supplier Costs tab keeps historical tables.
- API falls back to all-suppliers-active when `bf_suppliers` is absent, so production is safe until the migration is deployed.

## Work Done
- `BlackFire/BlackFire Portal/portal.css` — global `[hidden]` reset; specificity fix + min-widths for `.td-inv-covered`/`.td-notes`. Backup: `_backups/portal_backup_20260719_214648.css`.
- `BlackFire/BlackFire Portal/install/suppliers_registry_migration.sql` — new bf_suppliers registry; applied to local DB (Siyasiza active=0 verified).
- `BlackFire/BlackFire Portal/api/pl_ledger.php` — ledger_supplier_flags() + suppliers_active in monthly_pl. Backup: `_backups/pl_ledger_backup_20260719_215953.php`.
- `BlackFire/BlackFire Portal/portal.php` + `portal.js` — dynamic Monthly P&L supplier columns/KPI/legend. Backups: `_backups/portal_backup_20260719_215953.{php,js}`.
- Project session log written and mirrored to G:\My Drive\JS\Agentic AI\sessions\blackfire\.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| pll-css-fixes-20260719 | uMakhi | uMakhi (Claude Code as uMlawuli) | COMPLETED | 1 | Two CSS root causes fixed; portal-wide audit done; awaiting user visual confirmation |
| siyasiza-deactivate-20260719 | uMakhi | uMakhi (Claude Code as uMlawuli) | COMPLETED | 1 | bf_suppliers registry created (Siyasiza inactive); Monthly P&L columns now dynamic; local DB migrated, prod migration pending |

## Blockers / Next Steps
- User to reload portal and confirm fixes visually.
- Run `install/suppliers_registry_migration.sql` on production (Afrihost) DB.
- DB cleanup for `???` mojibake in remittance `invoices_covered`/`notes` values.

## Learnings
- The `hidden` attribute is defeated by any explicit `display` rule; a global `[hidden]{display:none!important}` reset prevents the whole bug class.
- `.tw > table td` (0,1,2) silently outweighs single-class td styles (0,1,0); td classes needing `white-space:normal` must use the `.tw > table td.<class>` form.
- Trust scores confirmed unchanged (Tier 1–2 tasks executed on Fable 5 without divergence; no §11 matrix update needed).
- Suppliers were hardcoded strings across API/UI with no registry; any future supplier lifecycle change should go through `bf_suppliers` rather than more name lists.
- Migration comment lines containing semicolons break naive `explode(';')` SQL runners — strip `--` comments before splitting.

## Goal Status
PENDING
