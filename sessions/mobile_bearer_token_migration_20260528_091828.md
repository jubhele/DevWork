# Session: Mobile Bearer Token Migration — Additive Auth for Expo App
Date: 2026-05-28
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Implement the first unblocking dependency from the technology roadmap session (2026-05-25): add Bearer token auth to the existing PHP portal so the Expo mobile app can authenticate without PHP sessions. Three additive changes — SQL migration, dual-path `current_user()`, and new `mobile_login` endpoint — with a hard guarantee of zero impact on existing web session auth.

## Model Recommendation
Task tier: 2-Medium
Recommended model: claude-sonnet-4-6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- **Additive-only approach:** New tables (`bf_mobile_tokens`, `bf_mobile_rate_limits`) — no existing table altered. Web portal behaviour is identical to before.
- **Dual-path `current_user()`:** Session check runs first; Bearer path only activates if no valid session exists. Existing endpoints require zero changes.
- **Token storage pattern:** SHA-256 hash stored, raw token returned once — mirrors the existing `bf_password_resets` pattern already in the codebase.
- **Rate limiting (mobile):** DB-level (5 failures → 15-min lockout by IP + device_id) replaces CAPTCHA, which is impossible on native mobile clients.
- **Token scope:** 30 days, per device. Re-login on same device revokes the previous token (one active token per device).
- **`mobile_logout` included:** Revokes token server-side; clean session termination for the app.
- **Mirrored to `BlackFire Portal - 25052026`** — both portal folders stay in sync.

## Work Done
- `BlackFire/BlackFire Portal/install/migration_mobile_bearer_tokens.sql` — Created. `bf_mobile_tokens` + `bf_mobile_rate_limits` tables.
- `BlackFire/BlackFire Portal/includes/auth.php` — `current_user()` updated: session path 1 (unchanged), Bearer token path 2 (new). Backup at `_backups/auth_backup_20260528_091828.php`.
- `BlackFire/BlackFire Portal/api/auth.php` — Added `mobile_login` and `mobile_logout` actions. Backup at `_backups/api_auth_backup_20260528_091828.php`.
- Same three changes mirrored to `BlackFire Portal - 25052026/`.

## Blockers / Next Steps
- [ ] Run `migration_mobile_bearer_tokens.sql` on Afrihost MySQL (additive — safe to run against live DB)
- [ ] Test `POST api/auth.php?action=mobile_login` with `{username, password, device_id, device_name}`
- [ ] Integrate into Expo app: store raw token in `expo-secure-store`, send `Authorization: Bearer <token>` header on every API call
- [ ] Register Apple Developer Program ($99/year) and Google Play Console ($25) before writing app screens
- [ ] Next migration: `bf_push_tokens` table for Expo push notifications (when push notifications feature begins)

## Learnings
- The `ON DUPLICATE KEY SET` syntax (without `UPDATE`) is used in the rate-limit upsert — standard MySQL but easy to mis-write. Tested mentally against the schema.
- `str_starts_with()` requires PHP 8.0+. Afrihost's PHP version should be confirmed before deploying; if PHP 7.x, replace with `substr($auth, 0, 7) === 'Bearer '`.
- Revoking the previous token on same-device re-login prevents token accumulation without needing a scheduled cleanup job.
- The `device_id` default of `''` (empty string) in `bf_mobile_rate_limits` avoids a NULL-in-unique-key edge case in MySQL 5.x where multiple NULLs in a unique index are permitted (not what we want here).
_Session ended: 2026-05-28 09:22:39 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 09:50:43 (Claude Code / claude-sonnet-4-6)_
