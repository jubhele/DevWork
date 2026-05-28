# Session: BlackFire dev-only refactored portal sync
Date: 2026-05-28
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Understand the relationship between the dev-only folder and the live portal, then sync the refactored_portal structure in dev-only to reflect current live portal content.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- Confirmed refactored_portal was built on a stale snapshot; live portal moved ahead (mobile nav, bearer auth PHP side, DQ audit, print styles, kval--compact, etc.)
- Preserved the refactored split structure (header/footer includes, css split, js split) as the architecture is sound
- portal_state.js kept as intentional stub — state lives in portal_main.js as originally documented
- portal_footer.php updated to include 3 script tags (portal_api.js, portal_state.js, portal_main.js) with filemtime cache-busting
- portal_header.php updated with full live SEO meta, JSON-LD, nonce-based CSP — paths adjusted for includes/ subfolder (dirname(__DIR__))
- portal_variables.css updated with full dark + light theme tokens (original refactor only had :root{} stub)
- portal_api.js updated from 40 → 70 lines (added apiUpload() function added after original refactor)
- portal_main.js updated from stale 5343 → 6431 lines (all new features from live)
- Inline onclick= regression from original refactor was fixed — live uses data-action delegation (80 occurrences, 0 onclick)

## Work Done
- `dev-only/refactored_portal/includes/portal_header.php` — full live header with SEO, JSON-LD, nonce CSP, adapted paths
- `dev-only/refactored_portal/includes/portal_footer.php` — 3 split JS script tags + </body></html>
- `dev-only/refactored_portal/portal.php` — header/footer requires + full live body (851 lines)
- `dev-only/refactored_portal/css/portal_variables.css` — full dark+light theme tokens (44 lines)
- `dev-only/refactored_portal/css/portal_main.css` — @import + full live CSS (1625 lines)
- `dev-only/refactored_portal/js/portal_api.js` — API_BASE + api() + apiUpload() (70 lines)
- `dev-only/refactored_portal/js/portal_main.js` — full live JS minus API layer (6431 lines)
- Backups at `dev-only/_backups/refactored_portal_20260528_101229/`

## Blockers / Next Steps
- portal_state.js is intentionally a stub — state management is in portal_main.js
- To promote this refactor to production: copy the split structure into the live portal root, update script/CSS references in portal.php, test locally
- The config/ and api/ directories from the live portal are not in refactored_portal — they would be shared on deploy

## Learnings
- The refactored_portal in dev-only was built on an older snapshot and had a regression (inline onclick instead of data-action)
- The live portal's bearer token auth is entirely PHP-side (for Expo mobile app) — portal.js has no bearer references
- portal_variables.css in the original refactor only had :root{} — the dark/light [data-theme] blocks were missing
- Bearer auth was PHP-only; no portal.js changes needed for mobile auth feature
_Session ended: 2026-05-28 10:27:05 (Claude Code / claude-sonnet-4-6)_
