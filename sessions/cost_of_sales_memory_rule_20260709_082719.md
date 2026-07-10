# Cost of Sales Memory Rule

## Goal
Record and apply the user's finance rule: when generated finance cost records are missing, create generated cost rows from the invoice/payment received amount.

## Goal Status
PENDING

## Decisions
- Treat the 2026-07-09 user instruction as superseding the earlier BlackFire portal finance default that used `invoice amount / 1.30`.
- Store the rule in shared workspace memory under the BlackFire/AECI project memory because it affects portal finance behavior.
- Expand the rule to three generated debit categories per invoice/payment: `Cost of Sales`, `Admin Costs`, and `Finance Costs`, each at 30%.
- Corrected by user: final generated rates are `Cost of Sales` at 30%, `Admin Costs` at 15%, and `Finance Costs` at 15%.
- Preserve manually entered true-cost entries by only updating generated prefixed rows and skipping existing category-specific cost records.

## Work Done
- Updated `C:\Users\Jughele Shange\.claude\projects\c--DevWork\memory\project_blackfire_aeci.md`.
- Replaced the older Portal Finance Rule default with: when generated finance cost records are missing for an invoice/payment received, generate `Cost of Sales`, `Admin Costs`, and `Finance Costs` at 30% each.
- Updated `BlackFire/BlackFire Portal/includes/helpers.php` so invoice creation/update generates the three 30% debit rows.
- Updated `BlackFire/BlackFire Portal/api/invoices.php` so deleting an invoice removes the generated `COST-`, `ADMIN-`, and `FIN-` rows for that invoice/callout reference.
- Updated `BlackFire/BlackFire Portal/api/finance.php` so PHP finance summary net balance includes all three generated cost categories.
- Updated `BlackFire/BlackFire Portal/install/backfill_invoice_cost_of_sales_20260613.sql` to use the three-category 30% model.
- Ran local DB migration `BlackFire/BlackFire Portal/install/migration_cost_of_sales_30pct_20260709.sql` against `BF_DB_HOST=localhost`.
- Migration effects: inserted 150 invoice-tied generated rows and 78 standalone payment/income-tied generated rows; verification found `missing_invoice_generated = 0`.
- Local verification totals after migration: credits R643,351.87; generated costs R957,520.99; net after generated costs R-314,169.12.
- Follow-up correction: changed admin/finance generated rates from 30% each to 15% each in helper/backfill/migration and reran the local migration.
- Corrected migration effects: adjusted 100 invoice-linked generated rows and 52 standalone payment/income generated rows.
- Corrected verification examples: CP1723 `Cost of Sales` R9,493.54, `Admin Costs` R4,746.77, `Finance Costs` R4,746.77; CP1711 `Cost of Sales` R828.00, `Admin Costs` R414.00, `Finance Costs` R414.00.
- Corrected local totals: credits R643,351.87; generated costs R645,023.85; net after generated costs R-1,671.98.
- Added explicit `callout_ref` to `bf_transactions` for grouping transaction rows by call-log number while retaining `trans_date` as the transaction date.
- Updated transaction creators in PHP APIs so invoice payments, batch payments, generated costs, and manual transactions carry `callout_ref`.
- Updated PHP transaction search/table display and Next.js transaction/finance data mappings to expose `callout_ref`.
- Ran local migration `migration_transactions_callout_ref_20260709.sql`; verification: `bf_transactions.callout_ref` exists as `varchar(30)`, 169 of 276 rows now carry a call-log number, and generated `CO-BF-*` cost rows missing callout grouping = 0.
- Verified CP1723 group now contains the invoice payment plus cost/admin/finance rows under `CO-BF-CP1723`, with transaction dates preserved.
- Tightened the transaction rule after user correction: every finance transaction must link to an existing call log; only task records may exist without a call-log link.
- Backfilled the remaining 107 legacy transaction rows by matching transaction references, including `COST-`, `ADMIN-`, and `FIN-` prefixed references, to existing `bf_callouts.po` values.
- Updated PHP manual transaction creation to require `callout_ref` and reject non-existent call logs.
- Updated the portal transaction modal so `Call Log Number` is required and the Save action uses the API-backed validation path.
- Updated the Next.js transactions API/data layer to require `callout_ref` and validate it against `bf_callouts`.
- Re-ran the local call-log audit; final verification found `missing_rows = 0` for `bf_transactions.callout_ref`.
- Verification passed: `php -l BlackFire/BlackFire Portal/api/transactions.php` and `pnpm --filter web typecheck`.
- Backfilled the historical invoiced callouts using the seed source-of-truth, restoring missing invoice rows and regenerating the 30/15/15 breakdown rows for the majority of legacy cases.
- Left only the oldest edge cases without a canonical invoice source in the current seed data for manual review rather than fabricating them.

## Agent Accountability
| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| finance-rule-memory | Sibali/Umakhi | Codex | COMPLETED | 1/3 | Memory updated with 30% generated finance-cost rule; awaiting user confirmation for ACHIEVED signature. |
| finance-cost-seed | Umakhi/Mvavanyi | Codex | COMPLETED | 2/3 | Local DB seed/migration run and corrected to 30/15/15; all invoices have generated cost/admin/finance rows. |
| transaction-callout-grouping | Umakhi/Mvavanyi | Codex | COMPLETED | 2/3 | Added/backfilled transaction `callout_ref`; final audit has zero unlinked transactions and new manual rows require an existing call log. |

| cost_of_sales_memory_rule_20260709_082719 | Mlawuli | Claude Code (Mlawuli) | COMPLETED [AUTOMATED] | - | AUTOMATED -- no user confirmation after 1.2h -- 2026-07-09 10:58:16 |

## Blockers / Next Steps
- `BlackFire/BlackFire Portal/install/` is ignored by workspace `.gitignore`; the one-off migration file exists locally and was executed, but will not appear in normal git status unless intentionally force-added.
- `migration_transactions_callout_ref_20260709.sql` is also under the ignored `install/` directory; it exists locally and was executed.
- User confirmation is still required before marking Goal Status as `ACHIEVED`.

## Learnings
- BlackFire portal finance should generate missing `Cost of Sales` at 30%, `Admin Costs` at 15%, and `Finance Costs` at 15% of invoice/payment received, not infer cost by dividing invoice amount by 1.30.
- This can still push finance reporting toward loss-level reporting when generated overhead costs exceed revenue; PHP finance summary must include all three categories in net balance.
- Ledger transaction grouping should use explicit `bf_transactions.callout_ref` plus `trans_date`, not derived parsing of `reference` or `description`.
- Transaction rows are part of the call-led workflow: if a ledger entry cannot link to a real call log, the data is incomplete and should be rejected or backfilled before reporting.
- Legacy breakdown repairs should use the invoice source-of-truth first; if no canonical invoice exists in the seed data, leave the callout flagged for review instead of inventing a row.

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 08:27:32 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 08:34:19 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 08:38:20 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 08:44:46 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 09:04:29 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 09:17:44 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 09:18:26 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 09:24:27 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 09:26:19 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 09:43:32 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 09:46:06 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-09 09:46:24 (Claude Code / claude-sonnet-4-6)_

> Completed by: Claude Code (Mlawuli)  |  Task: cost_of_sales_memory_rule_20260709_082719  |  Status: COMPLETED [AUTOMATED]  |  Confirmed: AUTOMATED -- no user confirmation after 1.2h  |  2026-07-09 10:58:16
_Session ended: 2026-07-09 10:58:16 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-09 11:02:07 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-09 11:03:52 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-07-09 11:10:04 (Claude Code / claude-sonnet-4-6)_
