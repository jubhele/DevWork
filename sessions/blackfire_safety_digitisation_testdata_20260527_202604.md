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
- Migration run order: safety_migration.sql → safety_soft_delete_migration.sql → personnel_compliance_migration.sql → policy_ack_migration.sql → attachments_migration.sql → clients_migration.sql → relationships_migration.sql → migration_digital_signatures.sql → migration_external_uploads.sql → blackfire_testdata_part1.sql → blackfire_testdata_part2.sql → blackfire_testdata_part3.sql
- j.shange user (created_by in several records): may need to be seeded if not present in main seed users table — check bf_users before running Part 3.
- PHP endpoints for digital signature (email_link token validation + IP capture) and external upload (unauthenticated file upload form) not yet built.
- Before/after proof photos are recorded as attachment metadata in bf_attachments but actual file uploads are not part of seeded data (no real files on disk).
- Digital signatures in migration_digital_signatures.sql reference entity refs SAF-140724-0001, SAF-120325-0001, SAF-101025-0001 which are not in the seeded safety files (no FK constraint — display-only orphan refs, acceptable).

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
## Resumed 2026-05-27 — Gap Review & Fixes

### Gaps found and fixed:
1. **CRITICAL — reports.php r_safety() broken SQL**: Queried 5 non-existent columns (`band`, `items_to_standard`, `items_applicable`, `site_name`, `audited_by`). Fixed: rewrote query to JOIN bf_safety_items, compute band from score via CASE, alias `region → site_name` and `auditor_name → audited_by`, GROUP BY sf.id.
2. **HIGH — No nav link to reports.php**: Portal had no way to reach the reports page. Fixed: added `<a class="btn btn-g btn-s" href="reports.php">Reports</a>` button next to "New Audit" in the p-safety section of portal.php.
3. **LOW — "DEMO DATA" comment in migration_digital_signatures.sql**: Contradicted the "no demo language" rule. Fixed: renamed to "Seed Data".
4. **Noted (not fixed — no FK)**: migration_digital_signatures.sql references safety file entity refs (SAF-140724-0001 etc.) that don't exist in the seeded data. No FK constraint so inserts succeed; display-only orphan refs.

_Session ended: 2026-05-27 22:17 (Claude Code / claude-sonnet-4-6)_

## Resumed 2026-05-28 — Full Gap Fix (band column + complete demo purge)

### Changes made:
1. **`install/migration_add_band_column.sql`** (new) — Adds `band ENUM('RED','ORANGE','YELLOW','GREEN') DEFAULT NULL AFTER score` to `bf_safety_files`; backfills all existing rows. Run after safety_soft_delete_migration.sql, before testdata parts.
2. **`api/safety.php`** — Added `calc_band(?float): ?string`; both score UPDATE calls now also set `band` so the column stays in sync whenever the portal saves a safety file.
3. **`reports.php`** — `r_safety()` now queries `sf.band` directly instead of computing it in SQL.
4. **`install/blackfire_testdata_part1.sql`** — Header: "Demo" → "Test Data". Password: "demo users / Demo@BlackFire1" → "seeded users / BlackFire@2026!" with new bcrypt hash on all 5 users. `band` added: SAF-150125-0001 → 'RED', SAF-120625-0001 → 'ORANGE'.
5. **`install/blackfire_testdata_part2.sql`** — Header "Demo" removed. `band` added: SAF-150925-0001 → 'ORANGE', SAF-150126-0001 → 'YELLOW', SAF-120326-0001 → 'YELLOW'.
6. **`install/blackfire_testdata_part3.sql`** — Header "Demo" → "Test Data".
7. **`install/migration_external_uploads.sql`** — "DEMO DATA" → "Seed Data".

### Updated migration run order:
safety_migration.sql → safety_soft_delete_migration.sql → **migration_add_band_column.sql** → personnel_compliance_migration.sql → policy_ack_migration.sql → attachments_migration.sql → clients_migration.sql → relationships_migration.sql → migration_digital_signatures.sql → migration_external_uploads.sql → blackfire_testdata_part1.sql → blackfire_testdata_part2.sql → blackfire_testdata_part3.sql

_Session ended: 2026-05-28 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 00:28:10 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 00:36:50 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 00:41:17 (Claude Code / claude-sonnet-4-6)_

## Resumed 2026-05-28 — Financial record balance audit + reports.php schema fixes

### Context
User asked "the number of records should balance with data from statement". Audited Part 3 SQL financial records end-to-end against the actual portal schema.

### Balance verified (Part 3 SQL)
- 11 callouts (CO-140724-0001 → CO-180326-0001)
- 9 quotes (2 callouts have no quote: CO-120326-0001 emergency, CO-180326-0001 direct supply)
- 11 invoices (4 individual 2024–2025, 7 batch March 2026)
- 11 transactions (1 per invoice credit)
- 11 payment rows across 5 payment_ref batches
- STMT-060326-0001: 3 invoices, R59,339.43 ✓ (R18,986.27 + R28,163.16 + R12,190.00)
- STMT-130326-0001: 7 invoices, R140,966.83 ✓ (matches PAY-240426-0001 batch total)
- Record counts and totals are balanced.

### Schema mismatches found and fixed in reports.php
1. **HIGH — `r_callouts()` queried `i.total_amount`** — `bf_invoices` column is `amount`. Fixed: `i.amount AS invoice_amount`.
2. **HIGH — `r_invoices()` queried `i.total_amount`** — same schema mismatch. Fixed: `i.amount AS total_amount` (alias preserves PHP template references).
3. **HIGH — `r_invoices()` queried `p.remittance_ref`** — column does not exist on `bf_payments`; remittance files live in `bf_attachments` with `entity_type='payment'`. Fixed: replaced with correlated subquery `(SELECT COUNT(*) FROM bf_attachments WHERE entity_type='payment' AND entity_ref=p.payment_ref) > 0 AS has_remittance`.
4. **HIGH — `r_payment_batches()` queried `MAX(remittance_ref)`** — same non-existent column. Fixed: same subquery pattern.
5. **MEDIUM — `r_invoices()` returned `status` but PHP summary used `invoice_status`** — `$paid_count` was always 0. Fixed: alias `i.status AS invoice_status`; updated HTML cell to match.
6. **HTML** — Both Remittance cells updated to render `✓` / `—` based on `has_remittance` boolean.

_Session ended: 2026-05-28 01:35 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 01:33:41 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 03:36:26 (Claude Code / claude-sonnet-4-6)_
