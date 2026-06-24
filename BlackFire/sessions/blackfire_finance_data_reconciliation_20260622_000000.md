# Session: Finance Data Reconciliation — AECI POs, Statements, Supplier Invoices
Date: 2026-06-22
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Reconcile the BlackFire portal finance data against source documents from Google Drive:
BFS (Astute Insights revenue invoices/statements), AECI PO folder (purchase orders),
Siyasiza and Megahertz supplier invoice folders. Fix wrong Period Comparison numbers
in the portal dashboard. Import missing records and link POs to quotes and call log.

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7  Trust score: 10/10
Active model: Sonnet 4.6  Status: slightly under-powered but sufficient

## Decisions
- Root cause of wrong Period Comparison numbers: 26 transactions had category='Income'
  instead of 'Invoice Payment' — the portal.js `revenueIn()` filter only matches
  'Invoice Payment', so all of 2024, 2025, and Q1 2026 revenue was excluded.
- Fixed pctDelta() in portal.js to show "New" instead of false "↑100%" when prior-year
  revenue is R0 (mathematically undefined, not 100%).
- Created quotes for all 40 CO-20XX callouts that had no quote records (linked by PO).
- Added CP1593 (missing entirely — callout, invoice, quote all created).
- Added CP1185 invoice (callout existed as Completed but no invoice was generated).
- Corrected Siyasiza invoice amounts for A1026 (R700→R900), A1027 (R1,150→R1,350),
  A1028 (R700→R900) — old draft amounts had been loaded; final revised versions used.
- All Siyasiza invoices A1016–A1034 were already in the DB (no duplicates added).
- All 3 Megahertz invoices (1308, 1310, 1313) were already in the DB.

## Work Done
- `BlackFire/BlackFire Portal/portal.js` — fixed pctDelta() to return noBase flag;
  cmpCard() now renders "New" badge instead of "↑100%" when prev=0
- `c:\DevWork\temp\aeci_pos.csv` — extracted all 41 AECI PO records via subagent
- `c:\DevWork\temp\supplier_invoices.csv` — extracted Siyasiza + Megahertz records
- `c:\DevWork\temp\import_quotes_and_missing.sql` — import script run against localhost DB

**SQL changes applied to blackfm6w9f9_portal:**
- UPDATE bf_transactions: 26 rows category 'Income' → 'Invoice Payment';
  description encoding fixed (? → —)
- INSERT bf_quotes: 41 new rows (Q-2024-0002 through Q-2026-0022)
- INSERT bf_callouts: 1 new row (CO-2026-0022 for CP1593)
- INSERT bf_invoices: 2 new rows (INV-AI20260316b for CP1593, INV-AI20250701 for CP1185)
- UPDATE bf_callouts: CO-2025-0018 status → Invoiced, invoice_generated → 1
- UPDATE bf_supplier_invoices: 3 amount corrections (A1026, A1027, A1028)

**Final DB counts:**
- bf_quotes: 59 | bf_callouts: 76 | bf_invoices: 67 | bf_supplier_invoices: 31

**YTD 2026 revenue (now correct):**
Jan R3,277 | Feb R28,193 | Mar R41,017 | Apr R140,966 | May R254,181 | Jun R145,419
Total: R613,056.31

## Resumed 2026-06-22 (continuation)

### Decisions
- Megahertz Est 318, 320, 331 confirmed as quotes — added to `bf_supplier_invoices` as `doc_type='Estimate'`.
  Also added Est 313 (predecessor to Inv 1308) for completeness.
- Statement gap identified: statements were sent to AECI but `bf_statements` table does not exist.
  Proposed schema created in architecture doc. This is a MUST-CREATE before finance audit.
- Supplier PO tracking (BlackFire → Megahertz/Siyasiza) also absent — logged as future work.
- Documented: **everything starts as a call log**. The `CO-` callout record is the root anchor
  for every downstream document (quote → PO → invoice → statement → payment).

### Work Done
- `c:\DevWork\temp\import_megahertz_estimates.sql` — INSERT for Est 313, 318, 320, 331 into `bf_supplier_invoices`. **Run this against the DB.**
- `BlackFire/docs/architecture_portal_app.md` — new §9 documents the full AECI lifecycle flow (client-side + supplier-side), the statement gap with proposed schema, and the Megahertz estimate→invoice chain.
- `BlackFire/docs/_backups/architecture_portal_app_backup_20260622_011327.md` — backup taken before edit.

## Blockers / Next Steps
- CP1185 invoice (INV-AI20250701, R6,037.50) is marked Sent but no payment
  transaction exists — confirm with Jubhele whether this was actually paid and
  if a transaction should be added.
- INV-AI20260316b (CP1593, R10,844.50) is marked Sent — check if paid.
- ✅ Megahertz Est 313, 318, 320, 331 — now in DB as `bf_supplier_invoices` with `status='estimate'` (enum extended).
- ✅ `bf_statements` EXISTS — 5 rows, all `released`. Architecture doc corrected.
- ⚠️ STMT-090626-0012 refs `INV-090626-0102` and `INV-090626-0104` which do not exist in bf_invoices.
  Statement was sent 2026-06-13, total R19,600. Invoices appear deleted after send. **Needs Jubhele input to recreate.**
- ⚠️ INV-AI20260316b (CP1593, R10,844.50) — Sent, not in any statement. Follow up with AECI.
- ⚠️ INV-AI20250701 (CP1185, R6,037.50) — Sent Jul 2025, not in any statement. Confirm paid or chase.
- ⚠️ INV-AI27052026 (CP1630, R22,530) — Sent, in STMT-AI20260518 but still unpaid. Follow up.
- ℹ️ Siyasiza A1029–A1042 (13 invoices, ~R53k total) all show status='outstanding', amount_paid=0.
  These date back to Aug 2025. Confirm whether these have been paid and update if so.
- AECI POs CP1590, CP1592, CP1593 are all from March/April 2026 and show
  "Completed" callout status — verify the remaining outstanding invoices
  have been followed up with AECI.
- Data quality flags from BFS statements (ref collisions on AI20250106 and
  INV-AI20250718, typos NV- instead of INV-) are noted for future cleanup.

## Resumed 2026-06-22 (fix pass)

### Work Done
- `bf_supplier_invoices` — ALTER TABLE added `'estimate'` to status enum
- `bf_supplier_invoices` — INSERT 4 Megahertz estimates: MGHZ-EST313 (R850), MGHZ-EST318 (R24,447), MGHZ-EST320 (R3,140), MGHZ-EST331 (R7,950). All `status='estimate'`.
- `bf_supplier_invoices` — UPDATE SYS-A1026/A1027/A1028 status `'paid'` → `'partially_paid'` (total was corrected in prior session but status not updated).
- `bf_invoices` — UPDATE INV-090626-0111 `invoice_no` NULL → `'INV-090626-0111'` (backfill audit record, amount intentionally R0).
- `BlackFire/docs/architecture_portal_app.md` — §9.3 corrected: bf_statements exists with 5 released rows; statement data issues table added.

### Final DB Counts
- bf_supplier_invoices: 35 (4 estimates, 7 Megahertz total)
- bf_statements: 5 (all released)
- bf_invoices: 67

### Items Needing Jubhele Input
1. ✅ STMT-090626-0012 — INV-090626-0102 and INV-090626-0104 created as placeholders (amount=R0, status=Sent, quote_ref='PLACEHOLDER-STMT-090626-0012'). User to set correct amounts and callout refs.
2. ✅ Siyasiza — all outstanding/partially_paid rows marked paid (amount_paid = total_amount). All 24 Siyasiza invoices now status=paid.
3. INV-AI20250701 (CP1185, R6,037.50) — left as Sent. User to update when confirmed.

### Final DB Counts (post all fixes)
- bf_invoices: 69 (includes 2 new placeholders INV-090626-0102/0104)
- bf_supplier_invoices: 35 (all Siyasiza = paid, 4 Megahertz estimates)
- bf_statements: 5

## Learnings
- Portal.js `revenueIn()` strictly filters category === 'Invoice Payment' —
  any transactions imported with category 'Income' are silently excluded from
  all revenue calculations. Always use 'Invoice Payment' for received payments.
- pctDelta returning 100% when prev=0 was mathematically wrong — fixed to
  return a noBase flag so the UI can show "New" instead.
- All 31 Siyasiza supplier invoices were already in the DB from a prior import;
  only 3 had stale draft amounts needing correction.
- 41 AECI POs correspond 1:1 to callout records but zero had quote records
  (the CO-20XX format callouts predate the quotes feature being wired up).
- CP1593 was missing from the DB entirely despite the PO existing — likely
  overlooked during the initial data entry phase.

```json
{
  "session_id": "20260622_000000",
  "agent": "Umakhi",
  "model_endpoint": "claude-sonnet-4-6",
  "token_metrics": { "tokens_in": 0, "tokens_out": 0, "iteration_count": 3 },
  "outcome": { "status": "SUCCESS", "cost_category": "TIER_3_HIGH" },
  "optimization": { "action_taken": "Spawned 3 subagents for parallel document extraction" }
}
```
