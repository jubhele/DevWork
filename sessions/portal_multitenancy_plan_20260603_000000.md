# Session: Multi-Tenancy Architecture Plan
Date: 2026-06-03
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Capture the idea of making the portal support multiple host companies (not just BlackFire Solutions)
and produce a living plan document that is reviewed weekly as the system matures. No implementation
this session — planning and documentation only.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Plan approach: single DB with `host_company_id` FK on all tables (rejected: separate DB per tenant — schema migration overhead not justified at current scale)
- Phased rollout: Phase 0 (mindset rules now) → Phase 1 (bf_host_companies table) → Phase 2 (data scoping) → Phase 3 (branding) → Phase 4 (provisioning UI)
- Phase 0 is effective immediately: all new tables get `host_company_id INT DEFAULT 1`, no new hardcoded 'BlackFire' strings in PHP
- BlackFire Solutions will always be `host_company_id = 1` — existing data rows never need updating

## Work Done

### Planning
- `BlackFire/BlackFire Portal/docs/plan_multi_tenancy.md` — living plan document created with phased roadmap, open questions, weekly review log, Phase 0 rules, Phase 3 branding upload flow, Phase 4 sysadmin-only onboarding wizard (7 steps), and Secrets & Encryption strategy section

### Phase 0 implementation (same session)
- `config/config.php` — added `cfg_env()` helper (getenv → $_ENV → $_SERVER → defined() → fallback); all `company_*` fields read via cfg_env(); added `company_tagline`, `company_logo`; `session_name` and `mail_from_name` also cfg_env-driven; removed unused `aeci_*` block; fixed `error_log('[Portal]')` prefix
- `portal.php` — computed `$companyLogoUrl`; title, meta author, og:title/site_name, twitter:title, JSON-LD name/url, hero eyebrow, section copy, all 3 footer copyrights, all 12 logo src/OG/JSON-LD refs — all dynamic via `$cfg`
- `api/auth.php` — password reset email subject and body read from `$cfg`
- `reports.php` — title tag and header attribution read from `$cfg`
- `policy_ack.php`, `sign.php`, `api/digital_signatures.php`, `api/safety_policy.php` — fallback strings cleaned up
- `install/migration_dashboard_layout.sql` — `bf_settings` PK changed from `(setting_key)` to `(host_company_id, setting_key)` before first deployment
- `blackfire_secrets.php.example` — created (was missing; referenced in config.php comments but didn't exist); documents all keys including new company identity constants, multi-tenancy note, why `define()` over `putenv()`
- `.env` — updated with all new `COMPANY_*` vars for local dev

### Backups created (server-side, pre-deployment)
- `/home/blackfm6w9f9/tmp/backup/20260603_071424/portal_files_20260603_071424.tar.gz` — 1.7M
- `/home/blackfm6w9f9/tmp/backup/20260603_071424/portal_db_20260603_071424.sql.gz` — 224K

### Backups created (local, pre-edit)
- `_backups/config_backup_20260603_065525.php` and `config_backup_20260603_07xxxx.php`
- `_backups/auth_backup_20260603_065525.php`
- `_backups/portal_backup_20260603_065525.php`
- `_backups/reports_backup_20260603_065525.php`
- `_backups/policy_ack_backup_20260603_065525.php`
- `_backups/sign_backup_20260603_065525.php`
- `_backups/digital_signatures_backup_20260603_065525.php`
- `_backups/safety_policy_backup_20260603_065525.php`

## Blockers / Next Steps
- Deploy Phase 0 changes to production (upload changed files via cPanel File Manager or git pull)
- Set `COMPANY_*` env vars in cPanel → Software → PHP → Environment Variables (or add to `~/blackfire_secrets.php` using the example as template)
- Run `migration_dashboard_layout.sql` and `migration_doc_numbers.sql` on live DB
- Fix `backup_portal.sh` shebang: change `#!/bin/bash` → `#!/usr/bin/bash` on the server
- Weekly review on 2026-06-10 — update open questions in `docs/plan_multi_tenancy.md`
- Every future PR reviewed against the Phase 0 checklist in the plan

## Pre-implementation Server Backup — 2026-06-03 07:14:24
Server-side backup taken before deploying Phase 0 changes.
Location: `/home/blackfm6w9f9/tmp/backup/20260603_071424`
- Files: `portal_files_20260603_071424.tar.gz` — 1.7M
- DB:    `portal_db_20260603_071424.sql.gz` — 224K (blackfm6w9f9_portal)
- Total: 1.9M

Known warnings (non-blocking):
- `mysqldump` insufficient privileges on `SHOW CREATE PROCEDURE 'bf_drop_everything'` — stored procedure excluded from dump; all table data exported successfully
- `backup_portal.sh` shebang `#!/bin/bash` is wrong on this server (bash lives at `/usr/bin/bash`) — must invoke as `bash /home/.../backup_portal.sh`; fix shebang next time the script is edited

## Resumed 2026-06-03 — Phase 0 Implementation

### Additional decisions
- All company_* config values moved to env vars (getenv() with hardcoded fallbacks) — values no longer sit plain-text in committed config.php
- company_tagline and company_logo added as new config keys (also env-var driven)
- company_logo drives all <img src> in portal.php; computed $companyLogoUrl drives OG/Twitter/JSON-LD absolute URL refs
- session_name and mail_from_name also moved to env vars
- aeci_* config block removed (was unused — client data belongs in bf_clients)
- error_log('BlackFire: ...') prefixes changed to '[Portal]' throughout config.php
- bf_settings table in migration_dashboard_layout.sql: primary key changed from (setting_key) to (host_company_id, setting_key) — tenant-aware from day one
- Phase 3 plan updated with branding upload flow detail (upload endpoint, CSS var injection, favicon)

### Files changed
- config/config.php — env vars for all company_* fields, removed aeci_*, fixed error_log prefixes
- portal.php — $companyLogoUrl helper var; all hardcoded BlackFire strings → $cfg reads; all logo paths → $cfg['company_logo']
- api/auth.php — password reset email subject and body use $cfg
- reports.php — title and header line use $cfg
- policy_ack.php, sign.php, api/digital_signatures.php, api/safety_policy.php — fallback strings cleaned up
- install/migration_dashboard_layout.sql — bf_settings PK now (host_company_id, setting_key)
- docs/plan_multi_tenancy.md — Phase 3 branding upload detail added

## Learnings
- `cfg_env()` helper is the right abstraction for shared-hosting PHP — putenv() is unreliable on Afrihost; checking all four sources (getenv/env/server/defined) makes the portal work in cPanel env vars, .env file, AND blackfire_secrets.php constants without code changes
- `$companyLogoUrl` computed at the top of portal.php is cleaner than inline computation in every meta tag
- `bf_settings` needed `host_company_id` in its PK from day one — easy fix before first deployment, painful retrofit after
- `blackfire_secrets.php.example` was referenced in config.php comments but never created — always create the example file alongside the feature that needs it
- IDE linter reports MySQL syntax as T-SQL errors on .sql files — false positives, not real errors
- For multi-tenancy: secrets file stays unchanged; per-tenant sensitive data (SMTP password, VAT) lives encrypted in `bf_host_companies` using the same BF_APP_KEY — one master key, all tenant data in the DB
- Server backup script (`backup_portal.sh`) has wrong shebang (`#!/bin/bash` → should be `#!/usr/bin/bash` on Afrihost); invoke with `bash /path/script.sh` until fixed
_Session ended: 2026-06-03 07:10:00 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 07:01:19 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 07:10:50 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 07:15:41 (Claude Code / claude-sonnet-4-6)_
