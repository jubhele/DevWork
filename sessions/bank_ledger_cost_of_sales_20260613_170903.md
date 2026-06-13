# Session: Bank Ledger Cost of Sales
Date: 2026-06-13
Provider: OpenAI Codex
Model: GPT-5

## Goal
Investigate and fix missing cost-of-sales records in Transactions - BANK LEDGER, applying the existing default 30% invoice margin when true quoted costs have not been entered.

## Model Recommendation
Task tier: 2-Medium
Recommended model: GPT-4o  Trust score: 8/10
Active model: GPT-5  Status: over-powered

## Decisions
- Confirmed the documented markup rule: estimated internal cost is invoice amount divided by 1.30.
- Preserve manually entered Cost of Sales records; use the 30% rule only when no matching real cost exists.
- No separate true-cost field currently exists on quote items, so manual ledger costs are the available override.

## Work Done
- Confirmed the ledger UI and transactions API already display Cost of Sales rows.
- Reviewed the existing local fix that creates and synchronizes Cost of Sales entries during invoice creation, quote conversion, invoice edits, and invoice deletion.
- Confirmed the idempotent backfill SQL covers existing invoices without replacing manual costs.
- Re-ran PHP syntax checks and `git diff --check`; all passed.
- Backed up the local `bf_transactions` and `bf_invoices` tables as `bf_transactions_backup_20260613_151226` and `bf_invoices_backup_20260613_151226`.
- Ran the Cost of Sales backfill against the local database; 54 missing rows were inserted and verification returned 0 uncovered invoices.
- Tested the documented Afrihost SSH deployment route and alternate authenticated browser route.

## Blockers / Next Steps
- Hosted deployment is blocked because Afrihost SSH port 22 times out, no FTP/cPanel deployment credentials are configured in the workspace, and no authenticated cPanel browser session is available.
- Production was not partially modified. Host deployment still requires working SSH/SFTP access or an authenticated cPanel session.

## Learnings
- Missing ledger rows are caused by the deployed invoice workflow not yet creating them, rather than a BANK LEDGER display filter.
- Quote items currently contain selling price fields only; real costs must presently be represented by manual Cost of Sales transactions.
- Model trust score remains unchanged.
- Local backfill result: 56 positive invoices, 58 Cost of Sales rows including preserved manual entries, 0 invoices missing Cost of Sales coverage.

```json
{"session_id":"20260613_170903","agent":"Umakhi","model_endpoint":"gpt-5","token_metrics":{"tokens_in":0,"tokens_out":0,"iteration_count":1},"outcome":{"status":"SUCCESS","cost_category":"TIER_2_MED"},"optimization":{"action_taken":"Trimmed payload"}}
```

## âš  Session Log Incomplete
The following mandatory sections were empty when this session ended: ## Learnings
Action required: fill these in before running /learn or starting the next session.

_Session ended: 2026-06-13 17:09:38 (Claude Code / claude-sonnet-4-6)_
