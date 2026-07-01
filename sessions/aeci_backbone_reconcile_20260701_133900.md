# Session: AECI P&L Backbone Reconciliation & Workflow Linkage
Date: 2026-07-01
Provider: GitHub Copilot
Model: Claude Opus 4.8

## Goal
Seed/reconcile the BlackFire portal database against BF_AECI_Full_PL_Ledger_20260624.xlsx (the
authoritative "backbone" ledger) and enforce the workflow rule: no invoice without a callout log,
an approved quote, and a link to a physical file (remittance PDF). Build on and perfect the prior
2026-06-24 pl_ledger/remittance work.

## Goal Status
PENDING

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7/4.8   Trust score: 10/10
Active model: Claude Opus 4.8   Status: correct

## Decisions
- **Excel = source of truth**, keyed on PO number (CP####) — the stable join key across invoice ↔
  remittance ↔ callout (invoice refs have typos/dupes; PO is reliable).
- **Hard-delete 24 non-backbone invoices** (user chose hard-delete): 7 duplicate-PO rows
  (INV-060326/090326/120326 series), 15 fabricated retainer/placeholder rows (INV-090626-01xx,
  R12,750×7 + R0 placeholders), and 2 non-backbone POs (CP0847, CP1044, AECI-PO-2025-003/045,
  CP1593). Backed up all touched tables first.
- **Create 5 missing backbone invoices** (CP1710–1713 outstanding, CP1723 paid) each with a
  reconstructed callout (CO-BF-*) + Approved quote (Q-BF-*).
- **New FK linkage** `bf_invoices.remittance_id` replaces the old fragile fuzzy text match
  (`invoices_covered LIKE '%ref%'`). This is the "perfect it" improvement over the 2026-06-24 build.
- **Physical file** = remittance PDF, modelled as bf_attachments(entity_type='remittance',
  entity_ref=control_no). Created 23 PLACEHOLDER stubs + a backfill checklist (user chose this option).
- **Hard DB enforcement**: trigger `trg_invoice_require_chain` blocks any future invoice lacking
  callout_id + Approved/Converted quote_id (bypass via `SET @bypass_workflow_check=1`). Mirrored by
  an app-layer guard in invoices.php.
- **Value alignment**: corrected 4 kept invoice amounts that drifted from the Excel backbone
  (CP1532, CP1485, CP1469, CP1630).
- Remittance id17 had a blank control_no → set to 121872 (CP1447); added 2 new remittances
  (123179 CP1630, 123293 CP1723).

## Work Done
- `install/migration_backbone_reconcile_20260701.sql` — full idempotent migration (Phases 0–10):
  backups, remittance corrections + 2 new, delete 24 non-backbone invoices (+11 orphan payments +
  attachments + orphan callouts), add remittance_id column, backfill 45 remittance links, create 5
  missing backbone invoices w/ callout+approved quote, repair keep linkages, 3 reconstructed approved
  quotes (CP1631/CP1643/CP1630), 23 remittance file placeholders, integrity view, enforcement trigger,
  value alignment. Applied to local MySQL (trigger created as root due to log_bin_trust_function_creators).
- `install/remittance_file_backfill_checklist_20260701.md` — 23-row PDF upload checklist.
- `api/invoices.php` — app-layer workflow guard (requires callout + approved quote before invoice
  create); backup at api/_backups/invoices_backup_20260701_133855.php.
- New DB objects: view `vw_invoice_workflow_integrity`, trigger `trg_invoice_require_chain`,
  column `bf_invoices.remittance_id`.

## Verification
- Invoices: 50 (backbone), total R692,951.37. Workflow integrity view: **50/50 OK**, zero violations.
- 0 paid invoices missing a remittance; 23 remittances ↔ 23 file stubs.
- Full chain traced for CP1723: CO-BF-CP1723 → Q-BF-CP1723 (Approved) → INV-AI20260629 →
  remittance 123293 → Remittance_123293_20260630.pdf.
- Trigger rejects a callout-less invoice (SQLSTATE 45000 confirmed).

## Resumed 2026-07-01 — Finance dashboard numbers wrong
User flagged dashboard tiles as wrong (Net Balance R1,043,695.45, YTD Revenue R613,056.31).
**Root cause:** finance tiles in portal.js read the bank ledger `bf_transactions`, not
`bf_invoices`. The backbone migration deleted 24 fabricated/duplicate invoices but left their
21 Invoice Payment rows in the ledger (R457,329.11 phantom credits — "Chempark" backups,
duplicate-PO INV-060326/090326/120326 series, R12,750 retainer placeholders).
**Fix:** `install/migration_ledger_reconcile_20260701.sql` — backs up bf_transactions, deletes
Invoice Payment rows matching no backbone invoice by ref_id OR po. Applied to local DB.
- Net Balance: R1,043,695.45 -> R586,366.34
- YTD Revenue: R613,056.31 -> R330,177.20 (crosscheck vs backbone invoices YTD R329,451.24; R726 gap = trans_date vs paid_date boundary)
- Ledger rows: 67 -> 46

## Resumed 2026-07-01 (2) — May R254K revenue spike wrong
User: "we did not invoice/get paid 250k in May." Root cause: 15 paid invoices carried
batch-default paid_date (all 2026-05-26 / 05-21) instead of the real bank-confirmed
remittance dates. Dashboard chart reads bf_transactions.trans_date.
**Fix:** `install/migration_paiddate_fix_20260701.sql` — set bf_invoices.paid_date and
bf_transactions.trans_date = linked bf_remittances.remittance_date. Backed up + applied local.
- May 2026: R253,455 -> R69,550 (invoices) / R66,602 (ledger chart)
- Redistributed: Nov-2025 R61,326, Apr-2026 R122,580, Jun-2026 R35,153
- Residual: ledger vs invoice per-month totals differ slightly (e.g. CP1723 June remittance
  R31,645 has no Invoice Payment ledger row) — finer ledger-completeness sync still pending.

## Resumed 2026-07-01 (3) — Ledger completeness sync
`install/migration_ledger_sync_20260701.sql`: aligned 3 stale Invoice Payment credits
(CP1469/CP1485/CP1532, left behind by backbone value alignment) to invoice amounts, and
inserted the missing CP1723 payment row (R31,645.14, 2026-06-30). Backed up + applied local.
Ledger Invoice Payment now equals invoice paid totals per month (0 mismatches).
Final dashboard: Net Balance R617,285.52 | YTD 2026 R299,770.46 | May 2026 R69,549.50.

## Blockers / Next Steps
- Upload the 23 actual remittance PDFs from Drive folder 1LhxPrGfJsdWYyI3a-Qkj4kuwiPzHcZBc and
  replace PENDING_UPLOAD_<ctrl>.pdf stored_names (see checklist).
- 3 unreconciled remittances (120884, 120978, 121317 = R32,735.97) still flagged — follow up with AECI.
- Run migration on Afrihost production via phpMyAdmin. Trigger needs log_bin_trust_function_creators
  (or DEFINER with SUPER) on prod — coordinate with hosting.
- Consider reconstructed callouts/quotes (CO-BF-/Q-BF-) may want real service descriptions from source docs.

## Agent Accountability
| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| BF-BACKBONE-001 | Umakhi (Code) | GitHub Copilot (Mlawuli) | COMPLETED | 1 | Migration + linkage + trigger |
| BF-RECONCILE-001 | Mhloli (Research) | GitHub Copilot (Mlawuli) | COMPLETED | 1 | Excel↔DB PO reconciliation |

## Learnings
- PO number (CP####) is the only reliable join key for AECI data — invoice refs contain typos and
  duplicates (e.g. two rows both "AI20250106" with different POs).
- Local MySQL 8.4 app user lacks SUPER; triggers/functions fail with error 1419 under binary logging.
  Fix: `SET GLOBAL log_bin_trust_function_creators=1` as root (root has no password locally), then
  create the trigger. Production needs the same or a DEFINER with privilege.
- The prior 2026-06-24 build linked invoices→remittances by fuzzy `invoices_covered LIKE` text match;
  replaced with a proper remittance_id FK for auditability.
- mysql CLI: use `-N -B -e "SELECT JSON_ARRAYAGG(...)"` piped to a file (utf-8-sig on read) to move
  data into Python reliably.
