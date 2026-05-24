# Session: BlackFire Portal — 403 clients.php + 401 auth session fix
Date: 2026-05-24
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Fix two groups of console errors in the BlackFire Portal:
1. Production (blackfiresolutions.co.za): 403 on /api/clients.php?active=1 for the admin account
2. Localhost dev: 401 on /api/auth.php?action=me + 403 on clients.php + 404 on files.php

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: Sonnet 4.6  Status: over-powered for this task

## Decisions
- Root cause of 403: `clients_migration.sql` (which seeds clients.* into bf_role_permissions)
  was never run on production. rbac_full_migration.sql has no clients.* entries.
  Fix: created install/fix_clients_permissions.sql with INSERT IGNORE — run against prod DB.
- Root cause of 401 (localhost): bf_session_start() derived cookie path from SCRIPT_NAME,
  giving path `/` for portal.php but `/api/` for api/*.php. The divergence means after a
  write/close cycle the browser could be handed a cookie with the wrong path.
  Fix: normalised cookie path to portal root by detecting and stripping the /api suffix.
- 404 on files.php (localhost): catch-all at end of files.php fires. Likely not deployed
  on localhost or a specific code path on localhost. Not seen in production.

## Work Done
- BlackFire/BlackFire Portal/install/fix_clients_permissions.sql — NEW: minimal SQL patch
  (INSERT IGNORE) for clients.* permissions; safe to re-run
- BlackFire/BlackFire Portal/includes/auth.php — fixed bf_session_start() cookie path
  normalisation (api/* scripts now map to portal root, not /api/)
- BlackFire/BlackFire Portal/_backups/auth_backup_20260524_094507.php — backup before edit

## Blockers / Next Steps
- Run fix_clients_permissions.sql on the production database (phpMyAdmin or SSH + mysql CLI)
  This is the only change needed to fix the 403 on production.
- Deploy updated includes/auth.php to production to fix the session path issue.
- Investigate localhost 404 on files.php if it persists after the above is deployed.

## Learnings
- When a migration is split across multiple SQL files (rbac_full_migration.sql then
  clients_migration.sql), the second file MUST be run on every environment including
  production — easy to miss. Consider a migration tracker (version table) for future.
- bf_session_start() must produce a consistent cookie path across all scripts in the
  portal; deriving it from SCRIPT_NAME creates divergent paths for portal root vs api/.
_Session ended: 2026-05-24 09:46:25 (Claude Code / claude-sonnet-4-6)_
