# Session: BlackFire Safety File Digitisation — Test Data Generation
Date: 2026-05-27
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Generate realistic test datasets to demonstrate the value of digitalising BlackFire's safety file system. The data must show: (1) safety file lifecycle from base assessment through periodic reviews, (2) the full business workflow from call logged -> quote -> PO -> work completed -> approval -> invoice -> statement -> payment remittance -> payment received, (3) safety officer (Kitso) and skilled personnel involvement, (4) training records, and (5) how the safety file protects the business and improves livelihoods.

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7  Trust score: 10/10
Active model: claude-sonnet-4-6  Status: slightly under-powered but acceptable

## Decisions
- Phase 1 (Research): Three parallel agents explored schema, safety file structure, and portal architecture simultaneously.
- Safety file scoring: 49 applicable items (37 of 86 total are N/A for electronic security scope). Score = (pass count / 49) × 100.
- 6 safety file checkpoints: Jan 2025 (RED 26.53%) → Jun 2025 (ORANGE 53.06%) → Sep 2025 (ORANGE 71.43%) → Jan 2026 (YELLOW 75.51%) → Mar 2026 (YELLOW 79.59%) → May 2026 (YELLOW 81.19%). SAF-210526-0001 already existed in main seed.
- Part 3 SQL uses SET @variables for IDs to avoid hardcoded FK values. Counters set via GREATEST(current, 100) to leave gap for portal-generated records.
- Quote items use DELETE via JOIN + fresh INSERT because bf_quote_items has no unique constraint (INSERT IGNORE would not deduplicate).
- Digital signatures migration written to match callout/invoice ref IDs already in Part 3.
- External upload tokens: three seeded records — two completed (2024), one active (2026 medical renewal for SAF-210526-0001).
- AECI contact emails: yolanda.herbst@aeciworld.com and simphiwe.ndevu@aeciworld.com (full-name format). Astute staff use first_initial.surname@astuteinsights.co.za except kitso.marupi (established exception).
- No "demo" language anywhere in the portal — portal is in pilot phase, all data represents real-life examples. Any page, label, or filename using the word "demo" must be renamed/reworded.
- reports.php: server-rendered PHP using portal brand tokens, JS-only tab switching, CSV export via ?tab=X&export=1. Access gated by existing RBAC via can().

## Work Done
- `install/blackfire_testdata_part1.sql` — 5 users (kitso.marupi, j.mthembu, r.khumalo, l.sithole, n.sithole) + safety files SAF-150125-0001 (26.53%) and SAF-120625-0001 (53.06%).
- `install/blackfire_testdata_part2.sql` — Safety files SAF-150925-0001 (71.43%), SAF-150126-0001 (75.51%), SAF-120326-0001 (79.59%) with all safety items, personnel, and compliance records.
- `install/blackfire_testdata_part3.sql` — Full business workflow: 11 callouts, 9 quotes + line items, 11 invoices, 11 transactions, 5 payment batches (PAY-100824-0001 through PAY-240426-0001), 2 statements (STMT-060326-0001, STMT-130326-0001), 38 before/after attachment records, 1 payment remittance attachment. Safety personnel across all 6 files. Policy acks for 2 files.
- `install/migration_digital_signatures.sql` — Creates bf_digital_signatures; 8 records (quote approvals, H&S policy acks, safety file sign-offs, invoice confirmation, callout completion, pending digital cert).
- `install/migration_external_uploads.sql` — Creates bf_external_upload_tokens; 3 records (medicals completed Jul 2024, fire training completed Nov 2024, active medical renewal May 2026).
- Fixed: AECI contact email format corrected in Part 3 SQL (y.herbst → yolanda.herbst, s.ndevu → simphiwe.ndevu).
- `reports.php` — Safety & Operations Overview: 5 tabs (Safety Journey, Business Activity, Financial Flow, Workforce, Digital Docs), PHP-generated SVG score progression chart, CSV export per tab, theme toggle, portal brand token styling. RBAC-gated: tabs rendered per can() result; sysadmin/admin/manager/admin_clerk/viewer see all; safety_officer sees safety-only tabs; junior/senior techs and call_logger see safety+callouts but not finance. CSV export endpoints also 403 if role lacks permission.
- Deleted demo.php entirely.

## Blockers / Next Steps
- reports.php requires portal login; all SQL migrations must be run in order against the live DB before it will show data.
- Migration run order: safety_migration.sql → personnel_compliance_migration.sql → policy_ack_migration.sql → attachments_migration.sql → clients_migration.sql → relationships_migration.sql → migration_digital_signatures.sql → migration_external_uploads.sql → blackfire_testdata_part1.sql → blackfire_testdata_part2.sql → blackfire_testdata_part3.sql
- j.shange user (created_by in several records): may need to be seeded if not present in main seed users table — check bf_users before running Part 3.
- PHP endpoints for digital signature (email_link token validation + IP capture) and external upload (unauthenticated file upload form) not yet built.
- Before/after proof photos are recorded as attachment metadata in bf_attachments but actual file uploads are not part of seeded data (no real files on disk).

## Learnings
- INSERT IGNORE works for tables with UNIQUE constraints but not for child tables like bf_quote_items — use DELETE + INSERT pattern for those.
- The @variable pattern (SET @aeci_id = ...) in MySQL seed SQL is powerful for keeping FK lookups DRY without hardcoding IDs.
- Safety file audit scope matters for scoring: 37 of 86 items are N/A for electronic security contractors; always document which items are N/A and why before computing the score percentage.
- Portal is in pilot phase — never use the word "demo" for any page, file, label, or dataset. The data represents real-life examples, not mock data.
- RBAC-gating a multi-tab reports page: compute permission booleans at the top, gate both HTML rendering (tabs + panels) and server-side CSV export with those booleans. One set of checks covers the whole page.
- Model performed well on this Tier 3 task despite being Sonnet rather than Opus. Trust score holds at 9/10 for complex multi-file SQL generation.

_Session ended: 2026-05-27 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-27 21:59:23 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-27 21:59:59 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-27 22:00:52 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-27 22:01:10 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-27 22:08:43 (Claude Code / claude-sonnet-4-6)_
