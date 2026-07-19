# Session: P&L Ledger tab buttons not switching
Date: 2026-07-19
Provider: Claude Code
Model: claude-fable-5
Project: blackfire
Project Root: C:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding (screenshot matched BlackFire Portal P&L Ledger tabs)

## Goal
User reported the P&L Ledger tab buttons (Remittances / Bank Statement / Sales Invoices / Supplier Costs / Monthly P&L) in the BlackFire Portal do nothing when clicked. Diagnose and fix.

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: claude-fable-5  Status: over-powered (acceptable — session already active)

## Goal Status
PENDING

## Decisions
- Root cause is CSS, not JS: `.pll-tab{display:block}` in portal.css overrides the UA `display:none` for the `hidden` attribute, so all five tab panels stay visible and tab switching appears dead. JS delegation (`switchPLLedgerTab`) was correct.
- Fix by adding `.pll-tab[hidden]{display:none}` rather than removing the block rule (the block rule may be intentional for layout).

## Work Done
- `BlackFire Portal/portal.css` — added `.pll-tab[hidden]{display:none}` after line 2292; backup at `BlackFire Portal/_backups/portal_backup_20260719_214648.css`.

## Resumed 2026-07-19 (same session — second report)
User reported Remittances table unreadable: Notes/Flags text overlapping Invoices Covered column.
- Root cause: `.tw > table td{white-space:nowrap}` (specificity 0,1,2) beats `.td-inv-covered`/`.td-notes` (0,1,0), so their `white-space:normal` never applied; long nowrap text overflowed `max-width` and painted over adjacent cells.
- Fix: raised selectors to `.tw > table td.td-inv-covered` / `.td-notes` and added min-widths. Same rule also fixes the Bank Statement tab which reuses `.td-inv-covered`.
- Portal-wide audit: replaced the tab-specific `.pll-tab[hidden]` patch with a global `[hidden]{display:none!important}` reset; the pre-existing `.calllog-detail[hidden]{display:none}` patch at portal.css:590 confirms this bug class recurred before. No CSS reveals `[hidden]` elements, so the global reset is safe.
- NOTE: the `???` strings inside remittance notes/invoices_covered are corrupted characters in the live DB data (lost at import), not a rendering bug — needs a data cleanup pass.

## Resumed 2026-07-19 (third request — deactivate Siyasiza supplier)
User: Siyasiza is no longer a supplier; mark inactive and hide from the Monthly P&L view.
- No supplier registry existed (names were hardcoded strings). Created `bf_suppliers` table (name, active, host_company_id DEFAULT 1 per multi-tenancy Phase 0) via `install/suppliers_registry_migration.sql`; seeded Siyasiza active=0, Megahertz active=1. Applied to local DB and verified.
- `api/pl_ledger.php` — added `ledger_supplier_flags()` (falls back to all-active if table absent, so prod won't break before migration runs); `monthly_pl` response now includes `suppliers_active`.
- `portal.php` — Monthly P&L thead now dynamic (`pll-mpl-thead`); cost-source legend text wrapped in `pll-mpl-cost-src`.
- `portal.js` — Monthly P&L supplier columns (header/rows/tfoot), Total Costs KPI subtitle, and legend build dynamically from `suppliers_active`; inactive suppliers' columns are dropped. Historical Siyasiza costs remain inside Total Costs so margins stay truthful; the Supplier Costs tab keeps historical tables intact.
- Backups: `_backups/portal_backup_20260719_215953.{js,php}`, `_backups/pl_ledger_backup_20260719_215953.php`.

## Blockers / Next Steps
- Run `install/suppliers_registry_migration.sql` on the production (Afrihost) database — local DB is done.
- DB data cleanup: replace `???` mojibake in remittance `invoices_covered` / `notes` values (source character lost at import; not present in repo SQL files).

- User to reload portal and confirm tabs switch (cache-busted via filemtime query string).

## Learnings
- The `hidden` attribute is defeated by any explicit `display` rule on the same element; a global `[hidden]{display:none!important}` reset prevents the whole bug class (now in portal.css).
- `.tw > table td` (0,1,2) silently outweighs single-class td styles (0,1,0); any td class needing `white-space:normal` must use the `.tw > table td.<class>` form.
