# Session: BlackFire Mobile — Outstanding Roadmap Items
Date: 2026-06-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Complete the four items flagged as outstanding in BLACKFIRE_TECHNOLOGY_ROADMAP_2026.md v2.0:
1. Font TTF files into apps/mobile/assets/fonts/
2. Apple Developer + Google Play developer accounts (manual)
3. In-app consent screen on first mobile login
4. Account deletion path (DELETE /api/users.php?action=self_delete)

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Fonts: resolved correct gstatic.com URLs via CSS v1 API (User-Agent: MSIE 7.0) rather than guessing static paths — v24 BigShoulders and v4 InstrumentSans differ from guessed v23/v1
- Consent screen: implemented as a pre-navigator gate in App.tsx using SecureStore key `bf_consent_v1` — keeps auth and consent state separate; consent persists across reinstalls if SecureStore backup is enabled
- self_delete: soft-delete (anonymise PII + deactivate) rather than hard DELETE of the user row — preserves audit trail and avoids FK constraint issues; roles + sessions are hard-deleted
- require_auth() used (not require_perm) for self_delete — user deleting their own account doesn't need an admin permission

## Work Done
- `BlackFire/apps/mobile/assets/fonts/BigShouldersDisplay-Regular.ttf` — downloaded from Google Fonts (31 636 bytes)
- `BlackFire/apps/mobile/assets/fonts/BigShouldersDisplay-Bold.ttf` — downloaded from Google Fonts (31 608 bytes)
- `BlackFire/apps/mobile/assets/fonts/InstrumentSans-Regular.ttf` — downloaded from Google Fonts (37 032 bytes)
- `BlackFire/apps/mobile/assets/fonts/InstrumentSans-SemiBold.ttf` — downloaded from Google Fonts (37 128 bytes)
- `BlackFire/apps/mobile/assets/fonts/IBMPlexMono-Regular.ttf` — downloaded from Google Fonts (41 272 bytes)
- `BlackFire/apps/mobile/src/lib/consent.ts` — created: SecureStore wrapper for consent flag (key: bf_consent_v1)
- `BlackFire/apps/mobile/src/screens/ConsentScreen.tsx` — created: POPIA-compliant consent/ToU screen with scrollable body and accept button
- `BlackFire/apps/mobile/App.tsx` — updated: added consent gate in AppNavigator; shows ConsentScreen on first launch before Login
- `BlackFire/BlackFire Portal/api/users.php` — added DELETE ?action=self_delete handler (soft-delete with PII anonymisation)
- `BlackFire/BlackFire Portal/_backups/users_backup_20260621_153820.php` — backup of users.php

## Blockers / Next Steps
- Apple Developer + Google Play accounts: manual registration required; bundle IDs already set in app.json (co.za.blackfiresolutions.umlilo)
- Consent screen has placeholder email (privacy@blackfiresolutions.co.za) — confirm this address exists before shipping
- ~~bf_sessions table assumed to have a user_id column~~ — VERIFIED: bf_sessions uses `username` (no user_id); self_delete corrected. bf_mobile_tokens and bf_password_resets both use user_id — also cleared on self_delete.

## Learnings
- Google Fonts CSS v1 API (`fonts.googleapis.com/css?family=...`) with MSIE 7.0 user agent reliably returns TTF src URLs; CSS v2 API returns only woff2 references
- Expo font loading blocks splash screen — consent gate must not add another loading state that fights SplashScreen; resolved by checking consent in AppNavigator after fonts are loaded
_Session ended: 2026-06-21 15:39:12 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-21 15:44:14 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-21 15:49:30 (Claude Code / claude-sonnet-4-6)_
