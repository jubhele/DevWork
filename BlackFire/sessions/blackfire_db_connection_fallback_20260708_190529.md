# BlackFire DB Connection Fallback - 2026-07-08 19:05:29

## Goal
Fix the portal login error that surfaced as `Database connection failed` on `localhost:8080`.

## Decisions
- Treated the problem as a config-loading issue, not a database schema issue.
- Kept production `blackfire_secrets.php` as the highest-priority source.
- Allowed local `.env` values to override placeholder secret mirrors when no real production secret file is present.
- Added plaintext DB password fallback when encrypted password loading fails locally.

## Work Done
- Updated `BlackFire Portal/config/config.php` to:
  - load both production and local `blackfire_secrets.php` sources,
  - ignore empty placeholder values instead of treating them as real secrets,
  - let local `.env` stay authoritative when production secrets are absent,
  - fall back to plaintext `BF_DB_PASS` when encryption is unavailable or invalid.
- Added `tests/config-secret-fallback-regression.ps1` to simulate the placeholder-secret case.
- Restarted the local PHP dev server on `localhost:8080` so the live smoke test used the patched code.
- Verified the live login endpoint again with the smoke test.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| BF-DB-001 | Codex / Umakhi | Codex | COMPLETED | 2 | Fixed secret precedence and verified with regression + live smoke test |

## Blockers / Next Steps
- No blocking issues remain.
- If the hosted cPanel instance is still using a stale copy, redeploy the patched config so the same fallback rules apply there too.

## Learnings
- Empty secret placeholders can silently block `.env` fallback if the loader treats defined-but-empty values as valid.
- For BlackFire portal local dev, `.env` must outrank repo-local secret mirrors unless a real production secret file is present.
- Restarting the PHP built-in server is sometimes necessary before browser QA reflects config changes.

## Goal Status
ACHIEVED

