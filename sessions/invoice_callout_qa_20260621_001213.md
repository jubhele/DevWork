# Session: Invoice Callout QA
Date: 2026-06-21
Provider: OpenAI Codex
Model: GPT-5

## Goal
Reproduce the BlackFire Portal invoice Callout action that remains stuck on Loading, identify and fix the root cause, and verify the complete user flow in the browser at localhost:8080.

## Model Recommendation
Task tier: 2-Medium
Recommended model: GPT-4o  Trust score: 8/10
Active model: GPT-5  Status: over-powered

## Decisions
- Ghost callout CO-090626-0109 recreated rather than cleared — preserves audit trail (invoice already Paid, amount R0).
- 13 June 9 retainer/statement invoices got individual backfilled callouts (one per invoice) rather than a shared retainer callout — keeps each invoice clickable via the Callout button.
- Q-140125-0001 (Rejected competitor benchmark) left without a callout — it is a reference record, not an operational event.
- Q-120626-0109 (Draft camera quote, R22,266) got a backfilled callout CO-120626-0108 so the workflow chain is complete before the quote moves to Approved.

## Work Done
- CO-190626-0115 reclassified to General tracker stream via `install/reclassify_CO-190626-0115_to_general.sql` (task TK-GEN-CO0115, title: Safety File).
- Investigated all invoice → callout gaps: ran 5-query analysis revealing 13 orphaned invoices and 2 orphaned quotes.
- Created `install/fix_invoice_callout_linkage_20260621.sql`:
  - Recreated ghost CO-090626-0109 for INV-090626-0111 (R0, AECI).
  - Created 7 AECI monthly retainer callouts (CO-090626-0091..0097) → INV-090626-0101/0103/0105/0108/0112/0116/0120.
  - Created 5 Sasol monthly retainer callouts (CO-090626-0098..0102) → INV-090626-0107/0110/0114/0118/0122.
  - Created AECI Equipment Install callout (CO-090626-0102 conflict — patched below).
  - Created 6 quote callouts (CO-090626-0103/0105/0107/0111/0113) for Q-090626-0101..0106.
- Created `install/patch_invoice_callout_linkage_20260621.sql`:
  - Fixed ref conflict: INV-090626-0125 / Q-090626-0107 wrongly pointed to Sasol CO-090626-0102; reassigned to new CO-090626-0115.
  - Fixed missing callout for Q-090626-0104 (CO-090626-0116).
- Created `install/patch_quote_120626_0109_callout.sql`:
  - Created CO-120626-0108 (CCTV Camera Installation, 4 cameras) for Q-120626-0109.
- Final state: 70 invoices with direct callout ref, 0 invoices without callout path, 16+ quotes with callout ref, 1 Rejected benchmark quote intentionally unlinked.

## Blockers / Next Steps
- None for callout linkage — all gaps closed.
- The "Callout" button on INV-090626-0111 (R0, ghost recreated) will now open correctly in the portal.
- Monitor Q-120626-0109 Draft quote → should be linked through CO-120626-0108 when Approved.

## Learnings
- Statement-batch invoice imports bypass the callout-first workflow; any bulk import script must create the callout row first and populate callout_ref/callout_id before inserting the invoice.
- When ROW_NUMBER()-computed callout refs collide with existing refs, INSERT IGNORE silently skips and leaves the invoice/quote unlinked — always run a gap-check SELECT after a bulk migration.
- Q-140125-0001 is a competitor benchmark record and should remain callout-free; it is the only legitimate exception to the callout-first rule.
