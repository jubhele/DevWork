# Session: Combine SQL scripts into master_aeci_full.sql
Date: 2026-05-20
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Combine load_real_aeci_data.sql + migrate_v3_payments.sql + migrate_v4_statement.sql into a single
master installation script (master_aeci_full.sql) so there is one authoritative file to run after
install_fresh.sql on any fresh deployment.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Created new file `install/master_aeci_full.sql` — originals left intact as reference.
- Part A (existing-DB upgrade) is commented out by default; Part B is the fresh-install path.
- v3 changes (payment_ref, entity_type 'payment', pay counter) baked into CREATE TABLE DDL.
- v4 changes (closure columns on bf_callouts, client_email/sent_at/sent_by on bf_invoices,
  bf_statements table, stmt counter, 9 new permissions) baked into CREATE TABLE DDL.
- bf_invoices INSERT updated to include client_email = 'aeci@astuteinsights.co.za' for all 41 rows.
- bf_attachments + bf_statements renamed via stored procedure (_bf_rename_if_exists) because
  MySQL does not support RENAME TABLE IF EXISTS natively.
- Role permissions total updated to 112 (103 base + 9 v4 additions).
- Summary block at bottom documents all version additions clearly.

## Work Done
- `install/master_aeci_full.sql` — CREATED; absorbs all three predecessor scripts

## Blockers / Next Steps
- Run: install_fresh.sql → master_aeci_full.sql (two scripts, fresh deployment)
- For existing DBs: uncomment Part A only; do not run Part B.
- Consider archiving migrate_v3_payments.sql and migrate_v4_statement.sql once master is validated.

## Learnings
- load_real_aeci_data.sql already had v3 schema embedded in its CREATE TABLE DDL (it recreates
  tables fresh, so ALTER TABLE from migrate_v3 was redundant for the fresh-install path).
- migrate_v4_statement.sql used a stored procedure for conditional ADD COLUMN — for the master
  fresh-install script this is unnecessary (CREATE TABLE always starts clean), but the procedure
  pattern is preserved in Part A for existing-DB upgrades.
- RENAME TABLE in MySQL has no IF EXISTS variant — must check information_schema and build
  dynamic SQL inside a stored procedure for safe re-runs.
_Session ended: 2026-05-20 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 00:21:09 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 00:21:57 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 00:27:39 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 00:30:46 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 00:36:18 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 00:49:23 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 01:03:44 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 01:04:04 (Claude Code / claude-sonnet-4-6)_
