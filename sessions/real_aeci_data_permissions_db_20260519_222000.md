# Session: Real AECI Data Import + DB-Driven Permissions
Date: 2026-05-19
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Wire the portal's permission system to read from the `bf_role_permissions` database table instead
of the hardcoded PHP PERMS constant. Simultaneously replace all generic seed data with real AECI
Chempark transaction data extracted from Astute Insights account statements (Nov 2024 – Apr 2026).
Also answered a file attachment design question and added the `bf_attachments` table.

## Model Recommendation
Task tier: 3-Complex
Recommended model: claude-sonnet-4-6   Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Option 2 chosen (DB-driven permissions): `includes/auth.php` now loads permissions from
  `bf_role_permissions` via `_load_role_perms()` with a static cache per request. The hardcoded
  PERMS constant was removed entirely.
- Permission strings in DB match the fine-grained dot-notation used by all API callers
  (e.g. `callout.view`, `quote.approve`, `security.audit`). Total: 103 rows across 9 roles.
- Real AECI data: 41 invoices extracted from all BFS account statements in
  `G:\My Drive\JS\Astute Insights\BlackFire\Admin Finance\Lelo Upload\BFS\`
- Table strategy: RENAME existing tables to `*_seed_bak` (backup), recreate fresh,
  insert real data. Script is re-runnable (drops old backups before renaming).
- File attachments: chose filesystem storage over MySQL BLOB. Added `bf_attachments` table
  with entity_type/entity_id linking to callout/invoice/quote. Files stored under `uploads/`.
- Invoice ref_ids preserve real Astute Insights reference numbers (INV-AI20241014 etc).
  AECI PO numbers (CPxxxx) go in the `po` column.

## Work Done
- `BlackFire/BlackFire Portal/includes/auth.php` — removed hardcoded PERMS constant;
  added `_load_role_perms()` (static-cached DB read); updated `can()` to use it.
- `BlackFire/BlackFire Portal/install/load_real_aeci_data.sql` — new file; renames old tables
  to `*_seed_bak`, recreates them, inserts: 1 client, 103 role permissions, 41 callouts,
  41 invoices, 26 payments, 26 income transactions, and the bf_attachments DDL.
- Backup: `_backups/includes_auth_backup_20260519_221958.php`

## Blockers / Next Steps
- Run `load_real_aeci_data.sql` on the live DB to create the `bf_attachments` table and load real data.
- Create the `uploads/attachments/` directory on the live server (it is gitignored so won't deploy automatically). Set ownership to the web server user (`chown www-data`).
- The `install/import_seed_data.sql` is now superseded by `load_real_aeci_data.sql` for AECI deployments. The seed file can be kept for demo/dev environments.
- Other clients (Sapref, Sasol, etc.) are not in the fresh data — add if needed.

## Resumed 2026-05-19 (context continued)
- `api/files.php` — COMPLETED (upload POST, download GET, delete DELETE, list GET)
- `portal.php` — COMPLETED all attachment UI:
  - Added JS helpers: `apiUpload`, `openAttachmentsModal`, `loadAttachments`, `uploadAttachment`, `deleteAttachment`
  - Added "Files" button to every callout row action group
  - Added `#attach-modal-area` + `loadAttachments()` call to `previewInvoice()`
  - Added `#attach-modal-area` + `loadAttachments()` call to `previewQuote()`
- `uploads/attachments/.htaccess` — CREATED (Deny from all)
- `uploads/attachments/.gitkeep` — CREATED (so empty dir is tracked)
- `.htaccess` — UPDATED to block `^uploads/attachments/` via RewriteRule
- `install/load_real_aeci_data.sql` — FIXED `bf_attachments` DDL: `entity_id INT UNSIGNED` → `entity_ref VARCHAR(30)` (matches PHP/JS code)
  - Backup: `_backups/load_real_aeci_data_backup_20260519_223246.sql`

## Learnings
- The `bf_role_permissions` DB table existed but was completely unused — code had a hardcoded
  PERMS constant. The permission strings in the table (manage_callouts) didn't match the code
  strings (callout.view) — a silent mismatch that would have caused all permissions to fail
  if DB-driven was activated without fixing the seed data.
- MySQL BLOB storage for files is technically possible but wrong for a hosted PHP app —
  filesystem + path reference is the correct pattern for production.
- RENAME TABLE in MySQL atomically updates FK constraints to the new table name, so
  `bf_callouts_seed_bak.client_id` correctly points to `bf_clients_seed_bak` after rename.
- Real AECI data spans Nov 2024 – Apr 2026: 41 jobs, R192,855.31 outstanding as of Apr 2026.
- When designing linked tables that reference string IDs (CO-2024-0001 etc.), use VARCHAR not INT
  for the FK-equivalent column — INT entity_id would require a separate lookup join; VARCHAR
  entity_ref lets you filter directly.
- Always add a per-directory `.htaccess` with `Deny from all` inside upload folders AND block
  the path in the root `.htaccess` RewriteRule as a belt-and-suspenders defence.
- IDE SQL linters (VS Code) often default to SQL Server dialect and flag valid MySQL syntax like
  `VARCHAR(30)` as an error — these are false positives, not actual MySQL errors.
_Session ended: 2026-05-19 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-19 22:33:57 (Claude Code / claude-sonnet-4-6)_
