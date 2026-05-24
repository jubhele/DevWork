# Session: Safety Portal Snag List
Date: 2026-05-22
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Address 5 snag list items on the BlackFire Portal safety module:
1. Delete safety card = soft delete (is_active = 0), hidden from list but retained for audit
2. Policies & Procedures — page sent to employees, they accept, records saved to system
3. Section upload = single combined link per section (all-employee sign-off as one document)
4. Score clarity — audit points score (main) vs completion percentage (secondary) must be clearly distinct
5. Combobox dropdowns everywhere — input+datalist pattern for employee/client linking with auto-create for new records

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7  Trust score: 10/10
Active model: claude-sonnet-4-6  Status: under-powered but proceeding

## Decisions
- Soft delete: `is_active TINYINT(1) DEFAULT 1` on `bf_safety_files`; DELETE handler sets 0; list queries filter `is_active=1`; "Deactivate" wording (not Delete) since record is retained
- Policy acks: new `bf_policy_acks` table + `api/safety_policy.php` API; public `policy_ack.php` page with token-based acknowledgment; panel in safety file detail view
- Section document: naming convention `[SECTION]00_record_*` = section-level combined sign-off; upload button per section in summary table; shown as single link
- Score display: audit score labeled "Audit Score" with "X pts" display; completion % ("X/Y items assessed") shown separately below with distinct styling
- Combobox: `<input list="...">` + `<datalist>` pattern for contractor, personnel name, and compliance person; compliance person auto-creates personnel record if name not found on file

## Work Done
- sessions/safety_portal_snaglist_20260522_185642.md — session log created
- _backups: api/safety_backup_20260522_185642.php, portal_backup_20260522_185642.php/.js/.css
- install/safety_soft_delete_migration.sql — adds is_active to bf_safety_files
- install/policy_ack_migration.sql — creates bf_policy_acks table
- api/safety.php — soft delete (DELETE → UPDATE is_active=0), filter is_active=1 in GET
- api/safety_policy.php — NEW: full CRUD for policy acknowledgments + email send
- policy_ack.php — NEW: public token-based acknowledgment page (no portal login required)
- portal.php — delete button in saf-detail-actions, contractor datalist, policy ack panel placeholder
- portal.js — deleteSafetyFile, completion %, combobox dropdowns, section doc upload, policy ack panel
- portal.css — styles for completion bar, deactivate button, policy ack panel, section doc cell

## Blockers / Next Steps
- Run install/safety_soft_delete_migration.sql + install/policy_ack_migration.sql on Afrihost
- Set PORTAL_BASE_URL in config.php (used in policy_ack.php email links)
- Test policy_ack.php public page on Afrihost (needs public web access)

## Learnings
- Soft delete on safety files: `is_active` flag on `bf_safety_files`; DELETE handler now sets `is_active=0` with audit log; GET queries filter `f.is_active = 1`. The "Deactivate" button (not "Delete") is shown only to admin/manager via PERMS check.
- Score vs completion: `safCalcScore` now returns `allFilled/allTotal/completionPct` separately from the audit score. The audit score is labeled "Audit Score" with "pts" suffix; completion is a secondary bar showing "X/Y items rated". The old bare "76%" display was ambiguous.
- Combobox pattern: `<input list="...">` + `<datalist>` is the right HTML5 pattern for "suggest existing but allow new". For compliance person, resolves name → personnel_id at save time; creates a new personnel record if not found. No schema change needed.
- Section sign-off: naming convention `[SECTION]00_record_*` identifies the combined sign-off document. `safRenderAttachments` now separates `00`-keyed attachments into `secRecords` and fills per-section cells in the summary table instead of showing them in the grouped list.
- Policy acks: public `policy_ack.php` is stateless (token-based, no portal login). API `safety_policy.php` handles all CRUD + email. Portal panel loads async like the compliance panel. The `portal_base_url` config key is used to build the acknowledgment link in emails — must be set in config.php before deploy.
- `esc()` must not be applied inside `onchange` attribute string literals that concatenate JS function arguments — the quotes get double-escaped. Use plain string interpolation for event handler arguments that are already sanitized.
_Session ended: 2026-05-22 19:23:06 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 19:33:14 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 19:36:48 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 19:38:08 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 19:45:02 (Claude Code / claude-sonnet-4-6)_
