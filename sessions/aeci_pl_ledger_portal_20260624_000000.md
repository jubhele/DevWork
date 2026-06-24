# Session: AECI P&L Ledger Portal
Date: 2026-06-24
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Seed the AECI workflow database (quotes, callouts, remittance attachments) from aeci_workflow_seed.sql. Replicate all views from BF_AECI_Full_PL_Ledger_20260624.xlsx into the BlackFire portal: Remittances, Bank Statement, Sales Invoices, Supplier Costs (Siyasiza + Megahertz), and Monthly P&L. Update the Finance Dashboard to reflect the aligned data.

## Goal Status
PENDING

## Model Recommendation
Task tier: 3-Complex
Recommended model: claude-opus-4-8   Trust score: 10/10
Active model: claude-sonnet-4-6   Status: slightly under-powered but acceptable

## Decisions
- Replace `p-income` (Income Statement) with `p-pl-ledger` (Full P&L Ledger) — the old view was a simplified single-table; the new view matches the 5-tab Excel structure
- Finance dashboard KPIs updated to show bank-confirmed receipts vs outstanding remittances vs total outstanding invoices
- Seed SQL uses INSERT IGNORE to be safe; a pre-seed TRUNCATE block added for quotes + attachments only (callouts are updated not replaced)
- Supplier costs (Siyasiza + Megahertz) stored in new bf_supplier_costs table seeded via migration

## Work Done
- `temp/aeci_workflow_seed.sql` — run on local MySQL: 41 quotes seeded (IDs 100–140), 48 attachments total, 66 callouts marked Invoiced
- `install/migration_remittances_20260624.sql` — created `bf_remittances` table + seeded 21 remittances from Excel; totals: R633,727.36 (bank confirmed R600,991.39, unreconciled R32,735.97)
- `api/pl_ledger.php` — new API serving 5 actions: remittances, bank_statement, invoices, supplier_costs, monthly_pl, summary
- `portal.php` — added `p-pl-ledger` page with 5 tabs (Remittances, Bank Statement, Sales Invoices, Supplier Costs, Monthly P&L)
- `portal.js` — added P&L Ledger to Finance nav; added `renderPLLedger()` and `_pllRenderTab()`; replaced `renderFinDashboard()` with async version pulling real remittance/cost KPIs from DB; added info guide + PAGE_PERMS entry
- `portal.css` — added P&L ledger CSS (pl-legend, tfoot-total, tr-flag, badge-warn, kgrid--3/4, cbar-cost, legend-dot, td-inv-covered)

## Blockers / Next Steps
- Actual remittance PDF files (e.g. `Account Statement20250617.pdf`) referenced in bf_attachments need to be in the server uploads folder — currently they're just records; upload the PDFs from Drive to the portal's upload path
- Invoice total in DB (R1,103,136 across 69 invoices) exceeds Excel total (R657,926 across 47 invoices) — DB has additional retainer/other invoices the Excel excludes; consider adding a `po IS NOT NULL` filter or date range in the P&L Ledger invoices tab if needed
- Run `install/migration_remittances_20260624.sql` on Afrihost production via phpMyAdmin (same SQL used locally)

## Learnings
- `bf_supplier_invoices` already existed with Siyasiza + Megahertz data; no new table needed for costs
- MySQL not on PATH — found at `C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe`; use stdin pipe (`Get-Content | & mysql`) not file argument
- Finance Dashboard now async (`await renderFinDashboard()`) — page activation handler updated accordingly

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-06-24 22:50:45 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-06-24 22:52:02 (Claude Code / claude-sonnet-4-6)_
