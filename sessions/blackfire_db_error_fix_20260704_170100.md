# Goal
Fix the BlackFire portal login error that showed `Database connection failed` on `localhost:8080`.

## Decisions
- Root cause was the MySQL DSN charset parameter in `includes/db.php`, not the login form or credentials.
- Replaced `charset=utf8mb4` in the DSN with an explicit post-connect `SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci`.
- Verified the fix by restarting the local PHP server and rerunning the local DB smoke test.

## Work Done
- Traced the login path from `api/auth.php` into `includes/db.php`.
- Confirmed direct PDO connection worked, then reproduced the HTTP 503 in the live login endpoint.
- Added a temporary probe to capture the actual PDO exception from the HTTP runtime.
- Patched `includes/db.php` to avoid the DSN charset parse failure.
- Removed the temporary probe after verification.
- Ran `tests/start-local-db-smoke.ps1` successfully after the patch.

## Agent Accountability
| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| db-login-503 | Codex | Codex | COMPLETED | 1 | Fixed local auth DB connection failure and verified with smoke test |

| blackfire_db_error_fix_20260704_170100 | Mlawuli | Claude Code (Mlawuli) | COMPLETED | - | User confirmed ACHIEVED -- 2026-07-04 17:00:41 |

## Blockers / Next Steps
- No blockers remain for this issue.
- If the portal server was already running before the patch, restart it so it picks up the updated `includes/db.php`.

## Learnings
- On this local Windows/PHP stack, `charset=utf8mb4` in the PDO DSN can fail with `SQLSTATE[HY000] [2019] Unknown character set` even when the server accepts `SET NAMES utf8mb4` after connecting.
- The portal’s generic `Database connection failed` banner can hide that charset-level failure unless the request is reproduced in the live HTTP runtime.

## Goal Status
ACHIEVED

> Completed by: Claude Code (Mlawuli)  |  Task: blackfire_db_error_fix_20260704_170100  |  Status: COMPLETED  |  Confirmed: User confirmed ACHIEVED  |  2026-07-04 17:00:41
_Session ended: 2026-07-04 17:00:41 (Claude Code / claude-sonnet-4-6)_
