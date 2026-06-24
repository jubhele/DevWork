# Session: AECI Workflow Seed — Call to Quote to PO to Invoice to Remittance to Payment
Date: 2026-06-24
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Build the full procurement workflow seed (Call → Quote → PO → Invoice → Remittance → Payment) for the BlackFire / AECI Chempark client, using the 48 real transactions in BF_AECI_Transaction_Ledger_20260624.xlsx as the backbone data source.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Scoped to the 41 primary invoices with CO-YYYY-NNNN callout refs (structured records); 29 supplementary invoices excluded from quote seeding as they're test/manual entries
- Quote date = invoice date - 14 days (14-day scope-to-quote lead time)
- Quote ref format: Q-DDMMYY-{seq:04d} (matches existing portal convention)
- Quote IDs start at 100 to avoid collision with existing 18 quote records
- All 41 outstanding invoices show status 'Approved' on quote (PO issued = approval); paid invoices show 'Converted'
- Service category derived from real description text (from Excel), not from invoice ref
- Remittance attachments linked to specific invoice refs using real filenames from email extracts
- All callout records already exist (43 in DB vs 41 needed) — no new callouts required
- bf_attachments.INSERT IGNORE used throughout for idempotency

## Work Done
- `temp/generate_aeci_workflow_seed.py` — seed generator script (reads Excel + portal_restore.sql, outputs SQL)
- `temp/aeci_workflow_seed.sql` — 285 lines; ready to apply to portal DB
  - 41 `bf_quotes` INSERT IGNORE (Q-191024-0001 through Q-170326-0041)
  - 41 `bf_quote_items` INSERT IGNORE (single line item per quote, excl-VAT unit price)
  - 41 `bf_invoices` UPDATE (backfill quote_ref + quote_id)
  - 41 `bf_callouts` UPDATE (invoice_generated=1, status=Invoiced)
  - 7 `bf_attachments` INSERT IGNORE (real remittance PDFs from 4 AECI email batches)
- `temp/check_missing_callouts.py` — verification script (confirmed 0 missing callouts)

## Blockers / Next Steps
- Apply `temp/aeci_workflow_seed.sql` to the live portal MySQL database
- Verify portal UI shows full workflow chain: Callout → Quote (Converted/Approved) → Invoice → Payment
- The 7 remaining outstanding invoices (Oct 2025, Mar–Jun 2026) need quotes with status 'Approved' (already included in seed — INV-AI20251001 through INV-AI20260606)
- Future: add a `bf_remittances` table to track remittance advice documents as first-class entities rather than as generic attachments

## Learnings
- All 43 callout records (CO-YYYY-NNNN) were pre-existing in portal_restore.sql — no gaps to fill
- The portal had 0 quotes linked to real CO-YYYY-NNNN callouts; 18 existing quote records are test/benchmark entries with different ref formats
- Remittance emails come in 3 flavours: AECI Chempark (Yolanda Herbst), FNB Payment Notifications (Sibulelo Mtolo personal), and account statement PDFs — only AECI Chempark remittances are client-facing
- Quote ID collision risk: existing quotes use IDs 1–74 (quote_items auto_increment up to 74); safe starting offset is 100+

## Goal Status
PENDING

## Agent Accountability
| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| workflow-seed-sql | Umakhi | Claude Code | COMPLETED | 1 | Generator + SQL output written |

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-06-24 22:19:35 (Claude Code / claude-sonnet-4-6)_
