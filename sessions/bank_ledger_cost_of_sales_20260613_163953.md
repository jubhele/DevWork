# Session: Bank Ledger Cost of Sales
Date: 2026-06-13
Provider: OpenAI Codex
Model: GPT-5

## Goal
Investigate and fix missing cost-of-sales records in Transactions - Bank Ledger, applying the documented default 30% margin when true quoted costs have not been entered.

## Model Recommendation
Task tier: 2-Medium
Recommended model: GPT-4o  Trust score: 8/10
Active model: GPT-5  Status: over-powered

## Decisions
- Use the documented markup rule exactly: estimated internal cost equals invoice amount divided by 1.30.
- Create cost of sales on the invoice date, including draft and outstanding invoices.
- Preserve manually entered true costs and make generated `COST-*` records idempotent and recalculable.

## Work Done
- Added a shared server-side cost-of-sales recorder.
- Updated direct invoice creation and quote conversion to create the ledger debit atomically.
- Updated unpaid invoice edits and deletion to keep generated costs synchronized.
- Added an idempotent backfill SQL migration for existing invoices.
- Verified changed PHP files with `php -l` and ran `git diff --check`.

## Blockers / Next Steps
- Run the backfill SQL against the deployed portal database, then deploy the PHP changes.
- Live database execution was not performed from this workspace session.

## Learnings
- The 30% rule existed only in historical import SQL and was absent from the live invoice workflow.
- The ledger UI/API already displays cost-of-sales rows; transaction creation was the missing behavior.
- Model trust score remains unchanged.

```json
{"session_id":"20260613_163953","agent":"Umakhi","model_endpoint":"gpt-5","token_metrics":{"tokens_in":0,"tokens_out":0,"iteration_count":2},"outcome":{"status":"SUCCESS","cost_category":"TIER_2_MED"},"optimization":{"action_taken":"Trimmed payload"}}
```
_Session ended: 2026-06-13 16:42:20 (Claude Code / claude-sonnet-4-6)_

## Resumed 2026-06-13
- Investigated the dashboard's March `R311K` revenue bar.
- Confirmed the frontend summed all invoices by invoice date, including unpaid invoices, instead of paid invoices by payment date.
- Added `paidDate` to normalized invoice data and corrected dashboard, finance dashboard, YTD, MTD, QTD, and comparison revenue calculations.
- Recorded March receipts in the source data total `R41,017.50`, not `R311K`.
- Verified `portal.js` with `node --check` and `git diff --check`.
_Session ended: 2026-06-13 16:52:56 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-13 17:00:31 (Claude Code / claude-sonnet-4-6)_
