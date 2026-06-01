# Session: BlackFire — Multi-Contact per Client

Date: 2026-05-31
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Clients need to support multiple named contacts (name, email, phone, title). When displaying a client — in the clients table, in quote/callout/invoice dropdowns — the primary contact's email must be shown alongside the client name. The existing single `email` and `contact_person` columns on `bf_clients` are replaced by a new `bf_client_contacts` join table.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6   Trust score: 9/10
Active model: claude-sonnet-4-6   Status: correct

## Decisions
- Add `bf_client_contacts` table: id, client_id, contact_name, email, phone, title, is_primary
- Existing `bf_clients.email` is synced from primary contact on save (backward compat for FK refs in other tables)
- Migrate existing `contact_person + email` rows into `bf_client_contacts` via migration SQL
- Remove `cm-email`, `cm-contact`, `cm-contact-details` from client modal; replace with contacts sub-section
- Dropdowns show `Client Name — primary@email.com`
- Client table header: "Primary Contact" column (replaces separate Email + Contact Person columns)

## Work Done
- install/migration_client_contacts.sql — new table + data migration from legacy columns
- api/clients.php — GET loads contacts[], POST/PUT saves contacts[], syncs bf_clients.email
- portal.php — client modal HTML: contacts sub-section with + Add Contact button
- portal.js — populateClientDropdowns, renderClients, openClientModal, saveClient, new contact helpers

## Blockers / Next Steps
- Run migration_client_contacts.sql on the database
- Test: add a new client with 2 contacts, verify dropdown shows primary email
- Test: edit existing AECI Chempark client — should pre-populate from migrated contact_person

## Resumed 2026-05-31 — SQL dedup audit

### Goal
Audit all SQL INSERT statements across install/*.sql to ensure no file can insert duplicate records on re-run.

### Findings
All files were already protected except one:

| File | Mechanism | Status |
|------|-----------|--------|
| `migration_client_contacts.sql` | `WHERE NOT EXISTS` subquery | ✅ |
| `clients_migration.sql` | `ON DUPLICATE KEY UPDATE` | ✅ |
| `safety_migration.sql` | `ON DUPLICATE KEY UPDATE` | ✅ |
| `add_pay_counter.sql` | `ON DUPLICATE KEY UPDATE` | ✅ |
| `combined_migration.sql` | `ON DUPLICATE KEY UPDATE` | ✅ |
| `rbac_full_migration.sql` | `DELETE FROM` all rows then INSERT | ✅ |
| `safety_seed_astute.sql` | `DELETE WHERE ref_id` + INSERT (CASCADE) | ✅ |
| `safety_attachments_seed.sql` | `DELETE WHERE entity_type+entity_ref` + INSERT | ✅ |
| `blackfire_testdata_part1.sql` | `INSERT IGNORE`; `DELETE WHERE file_ref` for items | ✅ |
| `blackfire_testdata_part2.sql` | `INSERT IGNORE`; `DELETE WHERE file_ref` for items | ✅ |
| `blackfire_testdata_part3.sql` | Mix of IGNORE, ON DUPLICATE KEY, DELETE+INSERT | ✅ |
| `update_saf_120326_0001_may2026.sql` | `INSERT IGNORE` — **NO UNIQUE KEY on bf_safety_personnel** | ❌ → fixed |

### Fix applied
`update_saf_120326_0001_may2026.sql` line 5 (step 5): Changed `INSERT IGNORE INTO bf_safety_personnel` to `INSERT ... FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM bf_safety_personnel WHERE file_ref=... AND full_name=...)`.

`bf_safety_personnel` has no UNIQUE constraint on (file_ref, full_name), so INSERT IGNORE would not prevent duplicates. `WHERE NOT EXISTS` is the correct guard.

## Learnings
- `INSERT IGNORE` is a no-op dedup guard on tables without a UNIQUE KEY — always verify the target table has the matching constraint
- `FROM DUAL` is the MySQL-standard way to supply a constant row in an INSERT...SELECT...WHERE NOT EXISTS pattern; bare `SELECT ... WHERE` works in MySQL but trips linters
_Session ended: 2026-05-31 20:08:52 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 20:15:25 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 20:20:38 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 20:36:11 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 20:57:07 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 21:04:00 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 21:05:08 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 21:08:03 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 21:36:04 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 21:36:07 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 21:36:31 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 21:44:30 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 22:27:16 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 22:28:34 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 22:35:05 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 22:51:21 (Claude Code / claude-sonnet-4-6)_
