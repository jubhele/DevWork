# Session: Portal — Reconciliation Feature + Transaction Diagnostic
Date: 2026-05-28
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Investigate the discrepancy between the portal dashboard Net Balance (R918,304.52) and an external account/client statement in Google Drive. Build tooling to surface the discrepancy and allow reconciliation.

## Model Recommendation
Task tier: 2-Medium (multi-file, investigation + build)
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- No DQ agent exists anywhere in the workspace — confirmed by checking gstack agents/openai.yaml (5-line registration wrapper only)
- Net Balance is computed as SUM(credit)−SUM(debit) from bf_transactions table via transactions.php API
- Seed data (blackfire_testdata_part3.sql) only has 11 transactions = R315,416.83; production DB has R918,304.52 — gap of R602,887.69
- Seed DELETE only removes rows by specific reference values; any portal-logged payments with different refs accumulate — likely cause of inflated balance
- Cannot query production DB directly (encrypted creds on Afrihost); diagnostic script approach chosen
- Reconciliation view added to Finance nav rather than a separate admin tool — keeps it accessible to Admin/Manager roles in normal workflow

## Work Done
- `BlackFire/BlackFire Portal/dev-only/diag_transactions.php` — created: token-gated diagnostic script; upload to server, open once, shows all rows + running balance + duplicate detection, then delete
- `BlackFire/BlackFire Portal/portal.php` — added `<div id="p-reconcile">` page shell between p-income and p-statement
- `BlackFire/BlackFire Portal/portal.js` — added:
  - Nav item `p-reconcile` under Finance group (requires finance.transactions perm)
  - Page handler in renders map
  - Info panel entry
  - `renderReconcile()` function: portal net balance, external statement input field (persisted in localStorage), live difference calculator with direction hint, duplicate transaction highlighter, running balance table
- `BlackFire/BlackFire Portal/_backups/portal_backup_20260528_084829.php` — backup
- `BlackFire/BlackFire Portal/_backups/portal_backup_20260528_084829.js` — backup

## Blockers / Next Steps
1. Upload diag_transactions.php to server (set BF_DIAG_TOKEN env var in cPanel first), run it, then delete it — this will reveal exactly which transactions are stray/duplicate
2. Once root cause is known: either add a DELETE SQL to the seed for stray refs, or add admin delete capability to the Transactions page
3. The Transactions page currently has no delete button — only Admins can manage data integrity via SQL; consider adding a delete row action gated to sysadmin/admin

## Learnings
- The portal's bf_transactions seed uses targeted DELETEs by reference — not a full table truncate. Cumulative manual entries via the portal UI are NOT cleared by re-running the seed. This is the likely cause of inflated balances.
- There is no DQ agent — the gstack openai.yaml is purely a registration wrapper.
- The Google Drive "statement" for AECI is the account/client statement view (not a bank statement); closest match found is the remittance advice (R140,966.83 for April 2026 batch).
_Session ended: 2026-05-28 08:54:16 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 09:07:20 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 09:08:56 (Claude Code / claude-sonnet-4-6)_
