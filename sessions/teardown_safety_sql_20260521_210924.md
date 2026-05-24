# Session: Safety Module SQL Teardown Script
Date: 2026-05-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Generate a SQL teardown/rollback script to DROP all database objects created by the safety module migrations, plus a dynamic query to find and remove any mysqldump-style backup tables.

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: over-powered for this task

## Decisions
- Placed in `install/teardown_safety_module.sql` (legitimate deployment artifact — rollback of the migrations)
- DROP order respects FK dependencies: bf_safety_file_users → bf_safety_compliance → bf_safety_personnel → bf_safety_items → bf_safety_files → bf_counters row
- Wrapped in `SET FOREIGN_KEY_CHECKS = 0/1` so order doesn't matter if FKs block the drop
- Included a `SELECT` query to review backup-named tables before dropping; DROP generator is commented out for safety

## Work Done
- `BlackFire/BlackFire Portal/install/teardown_safety_module.sql` — new: drops all 5 safety tables + saf counter, includes backup-table finder

## Blockers / Next Steps
- Run only when a verified mysqldump backup exists
- Backup-table DROP block must be uncommented and run manually after reviewing the SELECT results

## Learnings
- Teardown scripts belong in `install/` alongside the migrations they reverse, not in `temp/`
- `SET FOREIGN_KEY_CHECKS = 0` before multi-table DROP avoids ordering constraints; reset to 1 immediately after
_Session ended: 2026-05-21 21:10:35 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:13:05 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:15:01 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:16:35 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:18:35 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:20:42 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:23:27 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:24:41 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:25:53 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:27:17 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:28:52 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:30:10 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 21:32:28 (Claude Code / claude-sonnet-4-6)_
