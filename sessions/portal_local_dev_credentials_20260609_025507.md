# Session: Portal Local Dev Credentials
Date: 2026-06-09
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Add named `DEV_ADMIN_USER` / `DEV_ADMIN_PASS` variables (and one per role) to the local `.env` so
the test admin credentials are documented in a single place. Test data should read as real.

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: Sonnet 4.6  Status: over-powered for this task

## Decisions
- Added four named credential pairs to `.env` (one per seeded role: admin, safety_officer,
  safety_officer/manager, admin/safety_officer) — all share password `BlackFire@2026!` from
  `blackfire_testdata_part1.sql`. Variables are reference-only; no auth bypass code added.
- Did not recreate `blackfire_secrets.php.example` (staged for deletion — intentional).
- No CAPTCHA bypass added — out of scope; credentials in `.env` are sufficient for local testing.

## Work Done
- `BlackFire/BlackFire Portal/.env` — added `DEV_ADMIN_USER`, `DEV_ADMIN_PASS`,
  `DEV_SAFETY_USER`, `DEV_SAFETY_PASS`, `DEV_COMPLIANCE_USER`, `DEV_COMPLIANCE_PASS`,
  `DEV_INSPECTOR_USER`, `DEV_INSPECTOR_PASS`
- `BlackFire/BlackFire Portal/_backups/.env_backup_20260609_025507` — pre-change backup

## Blockers / Next Steps
- None. Login with `j.shange` / `BlackFire@2026!` at localhost to test as full admin.
- CAPTCHA is still active; answer the math question to proceed — this is intentional.

## Learnings
- All four seeded users share one bcrypt hash (`BlackFire@2026!`) in `blackfire_testdata_part1.sql`.
- Test data (finance figures, names, company details) is already real-looking — no faker needed.
- `.env` is the right home for dev credential references; never expose in committed files.
_Session ended: 2026-06-09 02:55:54 (Claude Code / claude-sonnet-4-6)_
