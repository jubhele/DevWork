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
- `BlackFire/BlackFire Portal/docs/plan_multi_tenancy.md` — living plan document created
- Session log created

## Blockers / Next Steps
- No blockers. Plan is for review only.
- Weekly review on 2026-06-10 — update open questions section as system decisions become clear
- Every future PR should be reviewed against the "What to Keep in Mind" checklist in the plan

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
- Env var pattern (getenv() ?: fallback) is the right Phase 0 approach — no DB schema change needed, values stay out of git, same pattern as DB credentials already in place
- $companyLogoUrl computed variable is cleaner than computing absolute URL inline in meta tags
- bf_settings needed the host_company_id in its PK from day one — easy to do before first deployment
- IDE linter reports MySQL syntax as T-SQL errors on .sql files — these are false positives, not real errors
_Session ended: 2026-06-03 07:10:00 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 07:01:19 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 07:10:50 (Claude Code / claude-sonnet-4-6)_
