# Session: Umlilo Portal — Local Dev Pages Not Working
Date: 2026-05-18
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Fix pages not working correctly at http://127.0.0.1:8080/. All API calls were failing and session cookies were not being sent.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- Changed API_BASE in portal.php from hardcoded production URL to a dynamic relative path derived from window.location.pathname — works both locally and in production without any env config.
- Changed session.cookie_path in auth.php from hardcoded `/portal/` to dynamically derived from `$_SERVER['SCRIPT_NAME']` so it resolves to `/` locally and `/portal/` in production.

## Work Done
- `BlackFire/BlackFire Portal/portal.php:1147` — replaced `const API_BASE = '<?php echo ...>/api'` with a JS IIFE that derives the path from `window.location.pathname`
- `BlackFire/BlackFire Portal/includes/auth.php:56` — replaced hardcoded `/portal/` cookie path with dynamic `dirname(SCRIPT_NAME)`

## Blockers / Next Steps
- Test login flow at http://127.0.0.1:8080/ to confirm both fixes work end-to-end
- Verify production still works after deploy (the dynamic path should resolve to `/portal/` there)

## Learnings
- The portal was built with production paths hardcoded in two places that break local dev: the JS API_BASE and the PHP session cookie path. Both should always be derived dynamically.
_Session ended: 2026-05-18 21:30:30 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-18 21:35:33 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-18 21:37:05 (Claude Code / claude-sonnet-4-6)_
