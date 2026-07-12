# Session: BlackFire Portal three-layer QA (PHP / Next.js / mobile)
Date: 2026-07-12
Provider: Claude Code
Model: claude-fable-5
Project: BlackFire
Project Root: C:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding

## Goal
Run a report-only /portal-qa pass across all three BlackFire layers — PHP portal/API, Next.js web app (umlilo-portal/apps/web), and Expo mobile app (umlilo-portal/apps/mobile) — covering PHP input safety, RBAC, JS/CSS hygiene, SQL safety, session-log and backup compliance.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-fable-5  Status: over-powered (acceptable; user explicitly selected)

## Decisions
- No uncommitted code changes existed, so QA ran as a full-state audit rather than a diff review.
- Report-only per /portal-qa; no fixes applied.

## Work Done
- Scanned all portal PHP for echo $_GET/$_POST, eval(), raw superglobal SQL concatenation: none found; endpoints use clean()/int casts and require_auth().
- Verified all api/*.php endpoints call require_auth (86 occurrences across live + backup files).
- Checked portal.js: 116 innerHTML uses but esc()/escH() helpers present and no unescaped `${}` interpolation into innerHTML; zero console.log.
- Checked portal.php for inline onclick/onkeydown (CSP rule): none.
- Next.js web + Expo mobile src: no console.log, no dangerouslySetInnerHTML, no hardcoded secrets matched.
- SQL: DELETE-without-WHERE only in seed/migration scripts (blackfire_real_finance_data.sql, rbac_full_migration.sql, migration_finalize_person_cleanup.sql); DROP TABLE IF EXISTS in drop_safety_file_users.sql not wrapped in transaction.
- Flagged hardcoded dev key BHK_KEY 'Bhekani2026!@@' in dev-only/bhekani_bo.php (folder gitignored and not deployed, but violates §8.4).

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| qa-3layer-20260712 | uMcwaningi | Claude Code (as uMlawuli) | COMPLETED | 1 | Report-only QA, no fixes applied |

## Blockers / Next Steps
- User to decide whether to rotate/remove the BHK_KEY hardcoded dev key or move it to .env.
- Consider wrapping migration DELETE/DROP statements in transactions.

## Learnings
- Portal codebase consistently uses clean()/require_auth()/esc() conventions; QA greps can key on those helpers. Trust scores confirmed unchanged.

## Goal Status
PENDING


