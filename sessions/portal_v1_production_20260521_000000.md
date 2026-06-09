# Session: BlackFire Portal — v1.0 Production Release
Date: 2026-05-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Tag and commit the first production-ready version of the BlackFire Portal. This release incorporates all portal UI fixes accumulated across multiple sessions: nav logo sizing, footer consistency across all pages, vertical portal nav rail, background watermark sizing, and CTA layout improvements.

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: over-powered (but appropriate for production release tagging with full context awareness)

## Decisions
- Tagged as v1.0.0 — first stable, production-deployable version of the portal
- Commit includes all pending portal changes (logo height, footer on all pages, nav rail, background watermark, CTA layout)
- Session logs for prior fix sessions included in the same commit

## Work Done
- `BlackFire/BlackFire Portal/portal.php` — logo height=60 in nav, height=62 in footer; footer block added to services section
- `BlackFire/BlackFire Portal/portal.css` — logo max-height:80px; watermark background-size:280px auto; pub-section gets background:var(--bg); portal nav redesigned as vertical rail; theme-btn compact style for rail
- `BlackFire/BlackFire Portal/api/portal.php` — same logo/footer/CTA fixes as portal.php
- `BlackFire/BlackFire Portal/api/portal.css` — mirrors portal.css changes
- `sessions/portal_button_fixes_20260520_214409.md` — updated session log
- `sessions/portal_footer_all_pages_20260521_011207.md` — new session log
- `sessions/portal_nav_wider_20260521_014433.md` — new session log
- Git tag `v1.0.0` created and pushed

## Blockers / Next Steps
- Deploy to live server (copy files to web host)
- Monitor for any visual regressions in production environment

## Learnings
- First production version milestone reached — portal has consistent logo sizing, footer on all pages, working vertical nav rail
- Background watermark needed explicit 280px width to prevent it stretching full viewport
- Adding `background:var(--bg)` to `.pub-section` prevents grid lines from bleeding through section backgrounds
_Session ended: 2026-05-21 02:00:51 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 18:48:37 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 18:49:24 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 18:52:54 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 18:58:41 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 19:01:17 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 22:55:44 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 22:57:14 (Claude Code / claude-sonnet-4-6)_

## Resumed 2026-06-09

### Goal
Debug and fix local development environment issues on the BlackFire portal (localhost:8080 / MySQL 8.4) and investigate a portal.js bug where the New Quote form fails to pre-populate the client when launched from the callout list.

### Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

### Decisions
- Local `.env` restructured: removed `BF_APP_KEY` + `BF_DB_PASS_ENC` so `bf_decrypt()` uses its plaintext `BF_DB_PASS` fallback — designed for local dev. Production reads from `~/blackfire_secrets.php` (two levels above public_html) unchanged.
- MySQL user `blackfm6w9f9_umlilo_admin`@`localhost` created (password in `.env` only) and granted ALL on `blackfm6w9f9_portal.*`. Production credentials untouched.
- `ADD COLUMN IF NOT EXISTS` (MariaDB syntax) in migration files replaced with MySQL-compatible `PREPARE/EXECUTE IF()` pattern for `migration_dashboard_layout.sql` and `migration_doc_numbers.sql`. 14 other migrations still use MariaDB syntax — flagged but not changed (safe on Afrihost, only breaks fresh MySQL installs).
- RBAC re-seeded by re-running `rbac_full_migration.sql` — `callout.update` had 0 rows locally (partial dump predated the row). All 160 canonical permission rows restored.

### Work Done
- `BlackFire/BlackFire Portal/.env` — removed prod-only `BF_APP_KEY` + `BF_DB_PASS_ENC`; added plaintext `BF_DB_PASS` for local dev fallback; added LOCAL DEV ONLY header comment
- `BlackFire/BlackFire Portal/install/migration_dashboard_layout.sql` — replaced `ADD COLUMN IF NOT EXISTS` with MySQL-compatible conditional via PREPARE/EXECUTE
- `BlackFire/BlackFire Portal/install/migration_doc_numbers.sql` — same fix for `quote_no`, `invoice_no`, `job_no` columns
- Local MySQL: ran `migration_dashboard_layout.sql` (added `bf_users.dashboard_layout` + `bf_settings` table)
- Local MySQL: ran `migration_doc_numbers.sql` (added `job_no`, `quote_no`, `invoice_no` columns)
- Local MySQL: re-ran `rbac_full_migration.sql` to restore all 160 RBAC permission rows including `callout.update`

### Blockers / Next Steps
- `prefillQuoteFromJob(id)` in `portal.js` (line 2981): client dropdown not pre-populated when opening New Quote from callout list. Root cause partially identified — need to confirm whether `proxyDB` is a camelCase-remapping proxy (which changes fix direction). Three potential bugs: `x.id === id` strict equality (string vs int), `c.clientId` vs `c.client_id`, and option value mismatch on `nq-callout-ref`.
- Audit similar "open form from list item" functions for the same camelCase/snake_case mismatch pattern (user requested).
- Investigate `proxyDB` definition — `const proxyDB` not found in portal.js grep; may be an alias or Proxy object elsewhere in the file.

### Learnings
- Production Afrihost uses MariaDB; local dev uses MySQL 8.4 — `ADD COLUMN IF NOT EXISTS` is MariaDB-only and will silently fail on MySQL. Pattern: use `PREPARE/EXECUTE` with `IF()` for portable migrations.
- `bf_decrypt()` has a local-dev plaintext fallback activated by removing `BF_APP_KEY` from env — this was designed for exactly this scenario.
- RBAC table should be re-seeded from `rbac_full_migration.sql` whenever a local DB is restored from a partial dump — missing permission rows produce silent 403s that look like RBAC bugs.
_Session ended: 2026-06-09 03:02:00 (Claude Code / claude-sonnet-4-6)_
