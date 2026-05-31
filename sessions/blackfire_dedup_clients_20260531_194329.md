# Session: BlackFire — Deduplicate Client by Name
Date: 2026-05-31
Provider: Claude Code
Model: Claude Sonnet 4.6

## Goal
User discovered a duplicate client by name in the bf_clients table. The generic `deduplicate_all_tables.sql` only removes rows that are identical across ALL columns, so a name-only duplicate (different IDs, possibly different emails) would survive it. Need a targeted script that re-points FK references then deletes the duplicate, plus adds a UNIQUE constraint to prevent recurrence.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- Keep the lowest-ID record as canonical (first inserted = intended record)
- Re-point bf_callouts, bf_quotes, bf_invoices, bf_users FK columns before deleting
- Add UNIQUE INDEX on bf_clients.name after cleanup to prevent recurrence
- Script runs inside a transaction; user must explicitly COMMIT or ROLLBACK

## Work Done
- `BlackFire/BlackFire Portal/install/deduplicate_clients_by_name.sql` — created targeted client dedup script with FK re-pointing and UNIQUE constraint

## Blockers / Next Steps
- User must run the diagnostic SELECT first and confirm which duplicate is found
- If more than one duplicate exists, the multi-pair JOIN logic handles all pairs
- After COMMIT, run the ALTER TABLE statements to add the UNIQUE constraint

## Learnings
- bf_clients had INDEX (not UNIQUE) on name — the ON DUPLICATE KEY UPDATE in clients_migration.sql was silently a no-op because ODKU requires a UNIQUE key to trigger
- Future seeds/inserts should rely on the UNIQUE index rather than INSERT IGNORE or ODKU guards
_Session ended: 2026-05-31 19:44:22 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 19:47:26 (Claude Code / claude-sonnet-4-6)_
