# Session: Install folder — align all tables to bf_ prefix
Date: 2026-05-18
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Update the install folder so `blackfire_aeci_seed.sql` uses the same `bf_` prefixed table names
and column names as the live portal schema (`schema.sql` and the portal PHP APIs).
Previously the seed SQL used un-prefixed legacy names (`callouts`, `quotes`, `bank_transactions`,
`id_counters`, etc.) that would create orphaned tables not recognised by the portal runtime.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Renamed every table in `blackfire_aeci_seed.sql` to match `schema.sql` — `bf_` prefix throughout.
- Fixed column renames: `id`→`ref_id`, `client`→`client_name`, `tech_name`→`tech`, `po_number`→`po`,
  `tx_date`→`trans_date`, `ref`→`reference`, `entity`→`counter_type`, `current`→`current_value`,
  `quote_ref`/`callout_ref` split from single `ref` column.
- Seeded `bf_quotes` with explicit INT ids (1,2,3) so `bf_quote_items.quote_id` (INT FK) resolves correctly.
- Added `total_amount` to quote seed rows to match schema column.
- Added `paid_date` to INV-003 invoice row.
- Added `bf_clients` seed row (AECI Chempark) and `bf_clients` table definition to seed SQL.
- Added `bf_payments`, `bf_audit_log`, `bf_sessions` table definitions to seed SQL for completeness.
- Added three missing tables to `schema.sql`: `bf_role_permissions`, `bf_service_categories`, `bf_services`.
- IDE SQL diagnostics are T-SQL false positives — both files are valid MySQL 8.x syntax.

## Work Done
- `install/_backups/blackfire_aeci_seed_backup_20260518_152914.sql` — pre-edit backup
- `install/_backups/schema_backup_20260518_152914.sql` — pre-edit backup
- `install/blackfire_aeci_seed.sql` — full rewrite: all tables now `bf_` prefixed, column names
  aligned to schema.sql, quote_items uses INT FK, verification comments updated
- `install/schema.sql` — added `bf_role_permissions`, `bf_service_categories`, `bf_services`

## Blockers / Next Steps
- [ ] Run seed against a live MySQL 8.4 instance to confirm no FK/column errors
- [ ] Portal auth.php uses hardcoded PERMS constant — `bf_role_permissions` table is seeded but
      not yet wired up to the runtime; future enhancement to load from DB

## Learnings
- The seed SQL was a parallel "all-in-one" script that had drifted from the portal's bf_ schema;
  keeping a single source of truth (schema.sql) and making the seed SQL reference the same names
  prevents silent table-mismatch bugs on fresh installs.
- VS Code's built-in SQL linter defaults to T-SQL dialect — MySQL-specific syntax (`CREATE DATABASE IF NOT EXISTS`,
  backtick identifiers, `COLLATE`, `GENERATED ALWAYS AS`) all show false errors. Not a real issue.
_Session ended: 2026-05-18 15:31:22 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-18 15:40:02 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-18 15:53:58 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-18 15:55:55 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-18 16:12:01 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-18 16:33:07 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-18 19:36:20 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-18 19:40:19 (Claude Code / claude-sonnet-4-6)_
