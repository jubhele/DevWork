# Session: blackfire_portal_layer_check
Date: 2026-07-08
Provider: OpenAI Codex
Model: GPT-5

## Goal
Check whether the BlackFire Portal three-layer environment changes landed on active pages or only on outdated copies.

## Model Recommendation
Task tier: 2-Medium
Recommended model: GPT-4o  Trust score: 8/10
Active model: GPT-5  Status: over-powered

## Decisions
- Traced the local launch path first instead of assuming the edited page was live.
- Treated `BlackFire Portal/portal.php` as the authoritative HTML shell because `index.php` requires it and `start-dev.ps1` serves the portal root.
- Distinguished the live root shell from `dev-only/` copies and `_backups/` snapshots, which are not the active surface.

## Work Done
- Read the workspace constitution and memory index.
- Read the investigate skill instructions.
- Inspected `BlackFire Portal/start-local.ps1`, `start-dev.ps1`, `index.php`, `portal.php`, and `dev-only/project_architecture.txt`.
- Checked git status and diffs for the currently modified files.
- Confirmed the only unstaged code changes are in `BlackFire Portal/config/config.php` and `memory/project_blackfire.md`.
- Read `BlackFire Portal/DEPLOY_CHECKLIST.md`, `BlackFire Portal/.htaccess`, and `docs/guide.md`.
- Confirmed production is intended to serve the root `public_html` set via `index.php -> portal.php`, while `dev-only/` and `_backups/` are excluded from deployment.

## Blockers / Next Steps
- No blocker.
- If you want, the next step is to trace the deployed cPanel copy versus the local root to confirm whether production is still behind the same config fix.

## Learnings
- The portal root is the live entrypoint for the PHP layer; `index.php` simply hands off to `portal.php`.
- `dev-only/` and `_backups/` contain many historical portal copies, so they can easily create the impression that work landed on the wrong page.
- The current change set is config-centric, not a page-shell rewrite.
- The deployment checklist explicitly says to upload the contents of `BlackFire Portal/` to `public_html/` and exclude `dev-only/` and `_backups/`, so stale pages are most likely a deployment drift issue rather than a routing issue.

## Goal Status
PENDING

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-08 22:21:17 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-08 22:28:06 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-08 22:29:00 (Claude Code / claude-sonnet-4-6)_

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-08 22:30:01 (Claude Code / claude-sonnet-4-6)_
