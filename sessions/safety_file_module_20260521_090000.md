# Session: Contractor Safety File Module
Date: 2026-05-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Build a Contractor Safety File Management system inside the Umlilo Portal, replacing the manual Excel checklist (APS-EHS-FRM-010 Contractor Safety File Approval). The system tracks contractor EHS compliance across 8 sections (A–H), 76 checklist items, scores submissions 0–100% + up to 10% bonus, generates colour-coded compliance bands, sends policy acknowledgment emails, and produces a downloadable audit pack. Astute Insights (under BlackFire) is the prototype client.

## Model Recommendation
Task tier: 3-Complex
Recommended model: claude-opus-4-7  Trust score: 10/10
Active model: claude-sonnet-4-6  Status: slightly under-powered but acceptable for this scope

## Decisions
- Follow existing portal pattern: HTML pages in portal.php, JS in portal.js, CSS in portal.css
- Use same proxyDB/localStorage pattern as callouts/quotes — upgradeable to API later
- Three pages: p-safety (dashboard), p-safety-audit (create/edit form), p-safety-detail (view/report)
- Scoring: (To Standard items / Applicable items) × 100; N/A items excluded
- Colour bands: Green 90-100, Yellow 75-89, Orange 51-74, Red 0-50
- Full 76-item checklist hardcoded (Sections A–H from APS-EHS-FRM-010 Rev 02)
- Section I — 10 bonus items, contributes up to +10% on top of the main score
- Policy email acknowledgment modeled on quote approval flow
- Report generation via browser print (print-only CSS) — no server-side PDF needed for prototype
- New nav group "Safety / EHS" added to portal nav rail
- Personnel soft-delete only (is_active=0 with reason + date) — audit requirement
- Document naming convention: [SECTION][NN]_[doctype]_[description-kebab].[ext]

---

## Phase 1 — UI scaffolding (2026-05-21 AM)

### Work Done
- sessions/safety_file_module_20260521_090000.md — session log created
- BlackFire/BlackFire Portal/_backups/ — backups of portal.php, portal.js, portal.css created
- BlackFire/BlackFire Portal/portal.php — added p-safety, p-safety-audit, p-safety-detail pages
- BlackFire/BlackFire Portal/portal.js — added SAFETY_SECTIONS data (A–H, 76 items), safety module functions, nav config entry
- BlackFire/BlackFire Portal/portal.css — added safety module styles

---

## Phase 2 — Backend wire-up (2026-05-21 AM)

### Work Done
- BlackFire/BlackFire Portal/install/safety_migration.sql — CREATE TABLE bf_safety_files + bf_safety_items; INSERT saf counter
- BlackFire/BlackFire Portal/api/safety.php — full CRUD endpoint (GET list/single, POST create, PUT update+email+approve, DELETE)
- BlackFire/BlackFire Portal/api/files.php — added 'safety_file' to allowed entity_types + entity_table_map
- BlackFire/BlackFire Portal/includes/db.php — added 'saf' → 'SAF' to next_ref_id prefix map
- BlackFire/BlackFire Portal/includes/mailer.php — added send_safety_policy_email() function
- BlackFire/BlackFire Portal/portal.js — added normalizeSafetyFile(), refreshSafetyFiles(), proxyDB.safetyFiles getter, _safScore(), _safBuildApiBody(), _safMergeToDb(); rewrote saveSafetyDraft/submitSafetyAudit/editSafetyFile/safViewFile to be async+API-backed; safHandleUpload uses files.php; safSendPolicyEmailConfirm uses safety.php PUT

### Decisions
- Score calculated server-side and cached in bf_safety_files.score; used for list view since items not loaded
- Documents stored via existing bf_attachments with entity_type='safety_file' and entity_ref=SAF-xxx
- In-memory working copy (_new_ temp ID) created on first item change; real SAF ref assigned on first save
- Policy email calls safety.php PUT action=send_policy_email → send_safety_policy_email() via SMTP mailer

---

## Phase 3 — Bonus Section I (2026-05-21 AM)

### Work Done
- BlackFire/BlackFire Portal/portal.js — Added Section I (10 bonus items: ISO 45001, Toolbox Talks, Near Miss Register, BBS, EAP, Env Legal Register, Hazardous Waste, Digital Records, OHS Surveillance, Monthly Performance Report) with `bonus:true` flag
- BlackFire/BlackFire Portal/portal.js — Updated safCalcScore(): main (A-H) = (std/applicable)*100; bonus (I) = (bStd/bApplicable)*10; final = main + bonus (max 110%)
- BlackFire/BlackFire Portal/portal.js — Updated safUpdateScore(): sidebar shows main% + bonus breakdown in amber/gold; section I row shows +X%
- BlackFire/BlackFire Portal/portal.js — Updated safBuildSections(): Section I panel gets saf-section-bonus + saf-sec-hdr-bonus CSS classes
- BlackFire/BlackFire Portal/portal.js — Updated safViewFile(): subtitle and cover block show "X% main + Y% bonus"; summary table Bonus tag; report section amber left-border
- BlackFire/BlackFire Portal/portal.php — Added saf-bonus-score div in score sidebar
- BlackFire/BlackFire Portal/api/safety.php — Added 'I' => 10 to SECTION_COUNTS; BONUS_SECTIONS const; calc_score() split main/bonus
- BlackFire/BlackFire Portal/portal.css — Added .saf-section-bonus, .saf-bonus-gold, .saf-bonus-tag, .saf-bonus-score-row, .saf-sum-bonus-row, .saf-rpt-section-bonus, .saf-cover-breakdown

### Decisions
- bonus:true flag on the section object — all SAFETY_SECTIONS.forEach iterators pick it up automatically
- Combined final score drives the colour band; safBand() unchanged (>=90 = Green regardless of bonus)
- total/na/std/notStd in safCalcScore includes all 86 items for display; mainScore/bonusScore added for breakdown

---

## Phase 4 — Seed data, Approve flow, Attachments panel (2026-05-21 PM)

### Work Done
- BlackFire/BlackFire Portal/install/safety_seed_astute.sql — 86-item seed for Astute Insights (SAF-210526-0001); score 81.19% Yellow (76.19% main A-H + 5% bonus I); realistic mix of To Standard / NTS / N/A with comments; idempotent (DELETE + INSERT); mysqldump backup instruction in header; naming convention documented
- BlackFire/BlackFire Portal/api/safety.php — added action=approve to PUT handler (manager/admin only); transitions Submitted/In Progress → Approved; audit log entry
- BlackFire/BlackFire Portal/portal.js — added approveSafetyFile(), safLoadAttachments(), safRenderAttachments(), safDetailUpload(), safDeleteAttachment(), _safUpdateApproveBtn(); safViewFile() injects Supporting Documents panel (loads attachments async) + controls Approve button visibility
- BlackFire/BlackFire Portal/portal.php — added Approve button (id=saf-approve-btn, hidden by default, shown by JS for Submitted/In Progress status)
- BlackFire/BlackFire Portal/portal.css — added .saf-att-row, .saf-att-name, .saf-att-dl, .saf-att-del and related attachment panel styles

### Decisions
- Approve is manager/admin only (require_perm('security.users'))
- Downloads go directly via api/files.php?action=download&id=<att_id>; HTML download attribute preserves original filename
- Attachments panel loads async after page shown — non-blocking

---

## Phase 5 — Personnel, Induction & Compliance Tracking (2026-05-21 PM)

### Work Done
- BlackFire/BlackFire Portal/install/personnel_compliance_migration.sql — CREATE TABLE bf_safety_personnel (soft-delete via is_active) + bf_safety_compliance (person or company scope, expiry/renewal tracking)
- BlackFire/BlackFire Portal/api/safety_personnel.php — full CRUD: GET list, POST add, PUT update/remove/reinstate, DELETE hard-delete (admin only); soft-delete stores reason + timestamp for audit trail
- BlackFire/BlackFire Portal/api/safety_compliance.php — full CRUD + GET?action=due_soon cross-file query (items expiring within 60 days); LEFT JOINs personnel name/role for display
- BlackFire/BlackFire Portal/portal.js — added COMPLIANCE_TYPES (10 standard types incl. AECI Site Induction 12-month, COIDA, PLI, H&S Policy, Risk Assessment, First Aid); _complianceStatus() computes Overdue/Due Soon/Current; safLoadPersonnel, safRenderPersonnel, safAddPersonnel, safSavePersonnel, safRemovePerson, safConfirmRemovePerson, safReinstatePerson; safLoadCompliance, safRenderCompliance, safAddCompliance, safCmpTypeChanged, safCmpScopeChanged, safCmpCalcExpiry, safSaveCompliance, safEditCompliance, safCEditCalcExpiry, safSaveEditCompliance, safDeleteCompliance; safViewFile updated to inject Personnel + Compliance panels
- BlackFire/BlackFire Portal/portal.css — personnel table styles, compliance table styles, status badge classes (saf-cs-ok/soon/overdue/none)

### Decisions
- Personnel records NEVER deleted — soft-delete only (is_active=0 with reason + date); former personnel visible in collapsible section for audit trail
- Compliance scope='Person' (inductions, certs) or scope='Company' (COIDA, PLI, yearly submissions)
- Expiry auto-calculated from issue_date + renewal_months but can be overridden
- Status thresholds: Overdue = past expiry, Due Soon = within 30 days, Current = >30 days
- due_soon API endpoint exists for future dashboard widget (not yet wired to list view)

---

## Phase 6 — Placeholder docs + document staging script (2026-05-21 PM)

### Work Done
- BlackFire/BlackFire Portal/_sample_docs/safety/ — 30 placeholder PDFs (A01–I02) named to convention; each starts with %PDF- magic bytes so PHP finfo returns application/pdf on upload
- BlackFire/BlackFire Portal/_scripts/seed_safety_docs.ps1 — PowerShell script: reads supported docs from a source folder (-Source), copies each to uploads/attachments/ with a unique 32-char hex stored name (matching files.php bin2hex(random_bytes(16)) format), generates install/safety_attachments_seed.sql with DELETE + INSERT records; tested with 30 placeholder PDFs — all 30 processed successfully
- BlackFire/BlackFire Portal/install/safety_attachments_seed.sql — generated output; 30 bf_attachments INSERT records for SAF-210526-0001

### Script Usage
```powershell
# Default — reads _sample_docs\safety\, targets SAF-210526-0001
.\_scripts\seed_safety_docs.ps1

# Custom inbox and ref
.\_scripts\seed_safety_docs.ps1 -Source "C:\Docs\Astute" -SafetyRef "SAF-210526-0002"
```

### Document Naming Convention (canonical)
Pattern: [SECTION][NN]_[doctype]_[description-kebab].[ext]
SECTION: A–I (uppercase)  NN: zero-padded item number (01, 09, 33)
doctypes: agreement | appointment | assessment | certificate | insurance | plan | policy | procedure | record | register | report | training
ext: pdf | docx | xlsx | jpg | png

Examples:
  A02_agreement_37-2-contractor-signed.pdf
  H03_appointment_she-rep-dlamini.pdf
  I01_certificate_iso-45001-sabs.pdf

### Deployment Order (Afrihost)
1. safety_migration.sql
2. personnel_compliance_migration.sql
3. safety_seed_astute.sql
4. Run .\_scripts\seed_safety_docs.ps1  (local — generates hex files + SQL)
5. FTP uploads/attachments/ hex files to Afrihost
6. safety_attachments_seed.sql

---

---

## Phase 7 — Real docs seeding + upload-time naming (2026-05-21 PM)

### Work Done
- BlackFire/BlackFire Portal/_scripts/seed_safety_docs.ps1 — rewritten to auto-detect STRUCTURED mode when source contains `Section X\` subfolders; walks `Section X\NN - full description\actual-files.ext`; derives canonical name from path (section letter + item no + doctype inferred from folder keywords + slug from filename); skips Not Applicable.docx / *_Template.* / *.md / *.gsheet / *.txt placeholders; flat mode (original behaviour) still works unchanged. Dry-run against real Google Drive path confirmed 59 evidence files → 0 templates/N-A markers processed.
- BlackFire/BlackFire Portal/portal.js — added `_safUploadFd(fd)` (correct multipart fetch, fixes bug where `api()` was sending JSON instead of FormData); added `_safSlugifyName(filename)` and `_safCanonicalName(sec, idx, filename)` helpers; added `safRenameModal(suggested, originalName)` Promise-based modal; rewrote `safHandleUpload` and `safDetailUpload` to show rename dialog before each upload and rename file via `new File([f], finalName)` — canonical name recorded as `original_name` in bf_attachments
- BlackFire/BlackFire Portal/portal.css — added `.saf-rename-overlay`, `.saf-rename-box`, and supporting rename modal styles

### Decisions
- Seed script: doctype inferred from FOLDER description (not filename) so it's based on the checklist item intent, not arbitrary original filename
- Skip list uses glob patterns — `Not Applicable*` covers all variants; `*_Template.*` covers CSV/MD templates created in the audit sorting session
- Upload rename modal: per-item uploads pre-fill `SECTION + NN + photo/document + slug`; detail-view uploads pre-fill just the slugified filename (no section context); user can always edit before confirming
- `new File([f], finalName)` technique renames in the browser before the bytes leave the client — no changes needed in files.php
- Real folder path: `G:\.shortcut-targets-by-id\19jPRakzdBBQgK_LaHiAtGZiEm-A3fXb3\Astute Insight\`

### Zip Deployment Workflow (canonical going forward)
1. Zip the Google Drive `Astute Insight\` folder preserving structure
2. Extract locally to any staging folder
3. Run: `.\_scripts\seed_safety_docs.ps1 -Source "C:\Temp\astute_unzipped\Astute Insight"` (or point directly at Google Drive path — both work)
4. Script processes 59 files → generates hex copies in `uploads\attachments\` + `install\safety_attachments_seed.sql`
5. FTP hex files to Afrihost `uploads/attachments/`
6. Run `safety_attachments_seed.sql` on Afrihost MySQL

---

---

## Phase 10 — 3 Priority-1/2 Outstanding Features (2026-05-21 PM)

### Work Done
- `BlackFire/BlackFire Portal/api/safety.php` — Added `action=update_ap_status` sub-action to PUT handler: validates section_key/item_no/ap_status, updates `bf_safety_items.ap_status`, audit logs the change. Returns new ap_status.
- `BlackFire/BlackFire Portal/api/safety_compliance.php` — Fixed cascade delete in DELETE handler: queries `bf_attachments WHERE entity_type='safety_compliance' AND entity_ref=<id>`, deletes the physical hex file from `uploads/attachments/`, deletes the `bf_attachments` row, then deletes the compliance record. No orphaned files after record deletion.
- `BlackFire/BlackFire Portal/portal.js` — `safApSetStatus()` made async; now calls `api('PUT','safety.php?id='+fileId, {action:'update_ap_status',...})` after local save; shows toast on API failure so user knows to retry.
- `BlackFire/BlackFire Portal/portal.js` — Added `safLoadDashCompliance()`: calls `safety_compliance.php?action=due_soon`, injects Overdue/Due Soon alert cards into the `dash-alerts` strip, renders a details table in `#dash-comp-widget` (capped at 15 rows + "N more" footer), hides widget if no alerts, silently fails on API error.
- `BlackFire/BlackFire Portal/portal.js` — `p-dashboard` render handler updated to call `safLoadDashCompliance()` after `refreshAll()`.
- `BlackFire/BlackFire Portal/portal.php` — Added `<div class="panel mt2" id="dash-comp-widget">` with "Compliance Alerts" heading and "View Safety Files" nav button; hidden by default, shown by JS when data arrives.

### Decisions
- `safApSetStatus` stays fire-and-forget from the UI perspective — local save happens immediately; toast only shown on API failure (no blocking spinner)
- Cascade delete uses `dirname(__DIR__) . '/uploads/attachments/'` inline (same logic as `attach_dir()` in files.php) to avoid cross-file dependency
- Dashboard widget prepends compliance cards to the existing `dash-alerts` strip so Overdue items surface at the same visual level as invoice/callout alerts
- Widget is non-critical — silently suppressed on API failure; never breaks dashboard load

## Blockers / Next Steps
- Run all 4 migration/seed SQLs on Afrihost MySQL (see deployment order above)
- Run seed_safety_docs.ps1 against real Google Drive folder (or extracted zip) to generate final SQL
- PDF pack generation relies on browser print; Puppeteer/wkhtmltopdf can replace later

## Learnings
- `bonus:true` flag on the data object is cleaner than a separate const — all existing forEach iterators pick it up without modification
- Returning both combined display totals AND the split scores from safCalcScore avoids updating all display callers while still exposing the breakdown where needed
- PS5.1 reads UTF-8 files without BOM as Windows-1252; UTF-8 multi-byte chars in string literals (not comments) cause parse errors — use ASCII-only in Write-Host strings
- mysqldump is the correct backup mechanism for database seeds; CREATE TABLE ... LIKE / SELECT is MySQL DDL that T-SQL linters reject and shouldn't live inside a seed file
- `api()` always sets `Content-Type: application/json` — file uploads must use direct `fetch()` with raw FormData (no Content-Type header so browser sets multipart boundary); both safHandleUpload and safDetailUpload were silently broken before this fix
- `new File([f], newName, {type})` is the clean browser-side rename trick — canonical name is stored as original_name without any server changes

_Session resumed: 2026-05-21 (Phase 7 — real docs + upload rename)_
_Session ended: 2026-05-21 19:21:37 (Claude Code / claude-sonnet-4-6)_

---

## Phase 8 — Compliance Health Block (2026-05-21 PM)

### Goal
The cover score block (overall audit score) must automatically reflect live compliance status — flagging NON-COMPLIANT or ACTION REQUIRED when certificates expire, AECI inductions are missing, or renewals are due within 30 days.

### Work Done
- `BlackFire/BlackFire Portal/portal.js`
  - Added `_safComplianceCache` / `_safPersonnelCache` module-level vars; reset to `null` each time a file is opened in `safShowDetail` (prevents stale data from a prior file leaking)
  - Added `_calcComplianceHealth(records, people)` — pure function; returns `{status, blockers, critical, warnings}`. Triggers: expired compliance record, due_soon record (≤30 days), active person missing AECI Site Induction
  - Added `safUpdateComplianceHealth()` — no-ops until both caches are loaded (two-async-load coordination); writes to `#saf-comp-health-block` with coloured status title + per-issue blocker list
  - `safRenderPersonnel()` — stores people in `_safPersonnelCache`; calls `safUpdateComplianceHealth()`
  - `safRenderCompliance()` — stores records in `_safComplianceCache` at the top (covers both empty and populated paths); calls `safUpdateComplianceHealth()`
  - `safShowDetail()` — added `<div id="saf-comp-health-block" class="saf-ch-loading">` inside cover score block
- `BlackFire/BlackFire Portal/portal.css`
  - Added: `.saf-ch-loading`, `.saf-ch-block`, `.saf-ch-compliant`, `.saf-ch-warning`, `.saf-ch-non-compliant`, `.saf-ch-title`, `.saf-ch-item`, `.saf-ch-item-detail`
- Backups: `_backups/portal_backup_20260521_193522.js` / `.css`

### Decisions
- Health block lives **inside** the cover score panel — co-located with the score it modifies
- "Employee not removed from safety file" is a process gap, not detectable from data; AECI induction check is the functional substitute
- `expired` + `missing` → NON-COMPLIANT; `due_soon` only → ACTION REQUIRED; clean → COMPLIANT
- Two-cache coordination: `safUpdateComplianceHealth` checks both caches are non-null before running — whichever async load finishes second triggers the render

### Learnings
- The two-cache coordination pattern avoids Promise.all when two independent async loads must both complete before a derived view updates
- Cover score block is synchronously rendered into `content.innerHTML`; widgets depending on async data must use placeholder + post-load update
- `_safComplianceCache` must be set BEFORE the early `return` in `safRenderCompliance` (empty-records path) — otherwise the empty-list case never populates the cache and the health check never fires

_Session resumed: 2026-05-21 (Phase 8 — compliance health block)_

---

## Phase 9 — Extended compliance triggers + portal user linking (2026-05-21 PM)

### Goal
Extend the compliance health block to cover all detectable compliant→non-compliant transitions, and add portal user (technician/supervisor) awareness so that assigning a new portal user to a site automatically triggers the AECI induction requirement.

### Work Done
- `BlackFire/BlackFire Portal/install/link_users_migration.sql` — NEW: `ALTER TABLE bf_safety_personnel ADD portal_user_id`; `CREATE TABLE bf_safety_file_users (file_ref, user_id, added_by)`
- `BlackFire/BlackFire Portal/api/safety_personnel.php` — added:
  - `GET ?action=linked_users&file_ref=X` → list portal users linked to this file
  - `POST {action:'link_user', file_ref, user_id}` → inserts `bf_safety_file_users` + auto-creates/reactivates `bf_safety_personnel` entry with `portal_user_id`
  - `DELETE ?action=unlink_user&file_ref=X&user_id=N` → removes link + soft-deletes the personnel entry
- `BlackFire/BlackFire Portal/portal.js` — added:
  - `_safLinkedUsersCache` module var (reset on file open; gate updated to require all 3 caches)
  - `safLoadLinkedUsers`, `safRenderLinkedUsers`, `safLinkPortalUser`, `safConfirmLinkUser`, `safUnlinkUser`
  - "Portal Users on File" panel in `safShowDetail` HTML + async load
  - `_calcComplianceHealth` extended to `(records, people, linkedUsers, file)` with 6 new triggers:
    1. Linked portal user not yet on active roster
    2. Manpower count > active roster count
    3. SHE Rep declared but no SHE Rep in personnel
    4. First Aider declared but no First Aider in personnel
    5. Required company records missing (COIDA Good Standing, PLI, H&S Policy Review)
    6. Audit date > 12 months → re-audit due
    7. Audit date within 30 days of 12-month mark → due soon warning
    8. Action plan items Open past the band deadline
- `BlackFire/BlackFire Portal/portal.css` — `.saf-linked-users-section` width fix
- Backups: `safety_personnel_backup_20260521_194625.php`, `portal_backup_20260521_194625.js/.css`

### Decisions
- Portal user link auto-creates a personnel entry — keeps the AECI induction check unified (all personnel need it; linked users become personnel automatically)
- `portal_user_id` on `bf_safety_personnel` is the foreign key back to `bf_users`, used for sync (reactivate vs re-insert)
- `_safLinkedUsersCache = []` (empty array, not null) is the resolved state for files with no linked users; the gate check distinguishes `null` (not loaded) from `[]` (loaded, empty)
- Required company records check is for ABSENCE only — expiry is covered by trigger #1 (expired certificates)
- Action plan overdue uses `band.actionDays` from `safBand()` to compute the deadline; only fires if the band carries a deadline (Yellow/Orange/Red)

### Deployment
Run `link_users_migration.sql` AFTER `personnel_compliance_migration.sql` (it adds a column + creates a new table)

_Session resumed: 2026-05-21 (Phase 9 — extended triggers + portal user linking)_
_Session ended: 2026-05-21 19:37:35 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 19:49:38 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 19:59:54 (Claude Code / claude-sonnet-4-6)_

---

## Integration Plan — Full System Overview (updated 2026-05-21)

### Current State

Nine build phases complete. Module fully coded, **not yet deployed** to Afrihost.

| Layer | Status |
|---|---|
| Database schema | 5 SQL files written, none run on production |
| API endpoints | 3 new files + 2 extended — untracked in git |
| Portal UI (PHP/JS/CSS) | Modified and staged — nav, 3 pages, scoring, panels |
| Seed data (Astute) | SQL + hex attachment files generated locally |
| Document seeding script | Complete — handles real Google Drive structure |
| **RBAC permissions** | **MISSING — safety.\* permissions not in rbac_full_migration.sql; APIs use `security.users` proxy (wrong)** |

---

### RBAC Gap (must be fixed before deploy)

`rbac_full_migration.sql` has no `safety.*` permissions. The current code gates Approve on `security.users`, which incorrectly gives admin clerks approve rights and denies EHS-only users access.

**Proposed safety permission set:**

| Permission | Purpose |
|---|---|
| `safety.view` | View safety files dashboard and detail |
| `safety.create` | Create / edit audit forms, save sections |
| `safety.approve` | Approve a submitted safety file |
| `safety.manage` | Manage personnel, compliance records, linked users |
| `safety.delete` | Delete safety files (hard delete) |

**Role assignment:**

| Role | safety.view | safety.create | safety.approve | safety.manage | safety.delete |
|---|---|---|---|---|---|
| sysadmin | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| manager | ✓ | ✓ | ✓ | ✓ | — |
| admin_clerk | ✓ | ✓ | — | — | — |
| call_logger | ✓ | — | — | — | — |
| junior_tech | ✓ | — | — | — | — |
| senior_tech | ✓ | ✓ | — | — | — |
| client_support | ✓ | — | — | — | — |
| viewer | ✓ | — | — | — | — |

**API changes required after RBAC update:**

| File | Current gate | Correct gate |
|---|---|---|
| `safety.php` — approve action | `require_perm('security.users')` | `require_perm('safety.approve')` |
| `safety.php` — delete action | `require_perm('security.users')` | `require_perm('safety.delete')` |
| `safety.php` — create/update | *(open to any auth user)* | `require_perm('safety.create')` |
| `safety_personnel.php` — hard delete | `require_perm('security.users')` | `require_perm('safety.manage')` |
| `safety_compliance.php` — write actions | *(open to any auth user)* | `require_perm('safety.manage')` |
| all safety list/get | *(open to any auth user)* | `require_perm('safety.view')` |

---

### Database Migrations (run in this exact order)

| # | File | What it creates |
|---|---|---|
| 1 | `safety_migration.sql` | `bf_safety_files`, `bf_safety_items`, `saf` counter |
| 2 | `personnel_compliance_migration.sql` | `bf_safety_personnel` (soft-delete), `bf_safety_compliance` |
| 3 | `link_users_migration.sql` | `portal_user_id` column + `bf_safety_file_users` join table |
| 4 | `safety_seed_astute.sql` | Astute Insights SAF-210526-0001, 86 items, score 81.19% |
| 5 | `safety_attachments_seed.sql` | 30 `bf_attachments` rows (generated by seed script) |
| 6 | `rbac_full_migration.sql` | Re-seeds all role permissions incl. new `safety.*` rows |

---

### Deployment Pipeline (Afrihost)

```
Step 1 — Database migrations (MySQL on Afrihost)
  a. safety_migration.sql
  b. personnel_compliance_migration.sql
  c. link_users_migration.sql

Step 2 — Seed data
  a. safety_seed_astute.sql

Step 3 — Generate attachment hex files (local machine)
  cd "c:\DevWork\BlackFire\BlackFire Portal"
  .\_scripts\seed_safety_docs.ps1 -Source "G:\...\Astute Insight"
  # Outputs: uploads\attachments\<hex-files> + install\safety_attachments_seed.sql

Step 4 — FTP uploads\attachments\ hex files to Afrihost
  Target path: public_html/uploads/attachments/

Step 5 — Run generated seed on Afrihost MySQL
  safety_attachments_seed.sql

Step 6 — Re-seed RBAC (after safety.* permissions added to rbac_full_migration.sql)
  rbac_full_migration.sql
  NOTE: This does DELETE FROM bf_role_permissions then re-inserts all rows.
        Run it last to avoid wiping permissions before the portal files are deployed.

Step 7 — Deploy portal files via FTP/git
  api/safety.php            (updated permission gates)
  api/safety_compliance.php (updated permission gates)
  api/safety_personnel.php  (updated permission gates)
  api/files.php             (extended)
  portal.php / portal.js / portal.css
  includes/db.php           (saf prefix)
  includes/mailer.php       (send_safety_policy_email)
```

---

### Outstanding Features (4 items)

#### 0. RBAC safety.* permissions (Priority 0 — security gap, before deploy)
- **Gap:** `rbac_full_migration.sql` has no `safety.*` rows; APIs use wrong permission proxies.
- **Fix:** Add safety permission rows to `rbac_full_migration.sql` (see table above); update `require_perm()` gates in all 3 safety API files.

#### 1. Action Plan Status Persistence (Priority 1 — data loss risk)
- **Gap:** `ap_status` dropdown renders in detail view but change events are not wired to API — changes lost on reload.
- **Fix:** `safSaveApStatus()` in portal.js → `safety.php PUT action=update_ap_status` → `UPDATE bf_safety_items SET ap_status=? WHERE file_ref=? AND section=? AND item_idx=?`

#### 2. Compliance Attachment Cascade Delete (Priority 1 — orphaned files)
- **Gap:** `safety_compliance.php` DELETE removes the DB row but leaves the `bf_attachments` row and hex file on disk.
- **Fix:** In DELETE handler — query `bf_attachments` for `entity_type='safety_compliance' AND entity_ref=<id>`, delete physical file, then delete row.

#### 3. Dashboard Compliance Widget (Priority 2 — after deploy)
- **Gap:** `safety_compliance.php?action=due_soon` exists but no widget on `p-dashboard` consumes it.
- **Fix:** Add Compliance Alerts card to `p-dashboard` — calls `due_soon`, groups by file ref, shows Overdue/Due Soon count badges.

---

### QA Checklist

- [ ] RBAC: admin_clerk cannot approve a safety file (403 expected)
- [ ] RBAC: manager can approve; junior_tech/call_logger can only view
- [ ] RBAC: viewer can open p-safety dashboard but sees no edit/approve controls
- [ ] New audit → contractor name only → Save Section A → SAF ref auto-assigned
- [ ] Edit existing audit → save one section → reload → items persist
- [ ] Upload doc on audit item → rename modal → canonical name stored
- [ ] Compliance record → attach doc → Replace button replaces, not duplicates
- [ ] Remove person → soft-delete → visible in Former Personnel collapsible
- [ ] Link portal user → auto-creates personnel entry → AECI induction check fires
- [ ] Approve button visible for manager/admin only on Submitted status
- [ ] Policy email sends via SMTP on `action=send_policy_email`
- [ ] Compliance health block shows NON-COMPLIANT when a cert is expired
- [ ] Print report → print-only CSS hides nav and controls

---

### Recommended Build Sequence

```
Priority 0 (security — before any deploy)
  └─ Add safety.* to rbac_full_migration.sql + fix API permission gates

Priority 1 (before deploy)
  ├─ Action plan status persistence
  └─ Compliance cascade delete

Priority 2 (after initial deploy)
  └─ Dashboard compliance widget

Priority 3 (future)
  ├─ Email reminders for expiring certs (cron + mailer)
  ├─ Multi-contractor expansion (new SAF refs per contractor)
  └─ PDF pack — replace browser print with Puppeteer/wkhtmltopdf
```

_Integration plan drafted: 2026-05-21 (Claude Code / claude-sonnet-4-6)_
_Integration plan updated with RBAC gap: 2026-05-21 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 20:02:37 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 20:10:19 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 20:21:38 (Claude Code / claude-sonnet-4-6)_

---

## Phase 11 — Submission view + Tracker generator (2026-05-21)

### Work Done
**Standalone tracker** (`Astute/safety-file-tracker.html`):
- Submission banner (green), `submitFile()`, `renderSubmission()`, `fmtDate()` added
- Submission stored in `state._submission` (localStorage); persists across reloads
- Score meta shows "Submitted: X% (BAND) on date" line when submitted
- Button changes to "Re-Submit" after first submission

**Portal** (`portal.js` + `portal.css` + `portal.php`):
- `fmtDT(dt)` datetime helper added
- Card view: Submitted/Approved files show green "✓ Submitted [datetime] · Score: X%" bar
- Detail view: Submitted/Approved opens with green `saf-submission-banner` block
- "↓ Tracker" button added to detail header actions
- `safGenerateTracker(id)` — extracts Not-to-Standard items, calculates baseline, calls builder, downloads HTML
- `_buildTrackerHTML(opts)` — generates fully self-contained HTML tracker (CSS+JS inline); localStorage key `bf_tracker_<fileId>`; "Submit to APS" button; only sections A–H (bonus I excluded)

### Decisions
- Submission timestamp sourced from `updated_at` (set on status change to Submitted/Approved)
- Tracker generation is pure client-side — no server endpoint needed
- Priority mapping: A/B/D/E/G → high; C/F/H → med
- Generated tracker localStorage key scoped to file ref to avoid cross-file collisions

_Session resumed: 2026-05-21 (Phase 11)_
_Session ended: 2026-05-21 22:49:28 (Claude Code / claude-sonnet-4-6)_

---

## Phase 12 — Docs per section + APS rejection notes in tracker (2026-05-21)

### Work Done
- `BlackFire/BlackFire Portal/portal.js` — `safRenderAttachments()` rewritten: groups docs by section (parses first char A-I + digit from `original_name`); shows section title headers; unclassified docs fall under "General / Unclassified"
- `BlackFire/BlackFire Portal/portal.css` — added `.saf-att-sec-hdr`, `.saf-att-sec-count` for attachment section group headers
- `BlackFire/BlackFire Portal/portal.js` — tracker (`_buildTrackerHTML`): added "APS Rejection Note" column between Audit Finding and Status; per-item textarea saved to localStorage under `state[id].rejection`; `getRejection` / `setRejection` / `rejectionChanged` helpers added; rejection cell styled red-tinted when populated
- `BlackFire/BlackFire Portal/api/safety.php` — list query changed to LEFT JOIN `bf_safety_items` with aggregate counts (`to_std_count`, `not_std_count`, `na_count`); `normalizeSafetyFile` maps them; `_safScore` uses them so list cards show real counts instead of 0

### Decisions
- Section grouping uses naming convention already in place (`[SECTION][NN]_…`) — no schema change
- Rejection note is a free-text field per tracker item; persists in localStorage with rest of tracker state
- Rejection column prints when printing the tracker (not hidden by print CSS)

_Session resumed: 2026-05-21 (Phase 12)_
_Session ended: 2026-05-21 23:24:00 (Claude Code / claude-sonnet-4-6)_

---

## Phase 13 — Safety Files filter reset on navigation (2026-05-22)

### Work Done
- `BlackFire/BlackFire Portal/portal.js` — `renders['p-safety']` now resets `#sf-filter-status` to `""` (All Files) before calling `renderSafetyFiles()`; fixes stale filter causing the list to appear empty after navigating away and back

### Decisions
- Filter resets on every navigation to p-safety — "All Files" is the correct landing state; user sets a filter during a session, it doesn't persist across navigations
- Backup: `_backups/portal_backup_20260522_053026.js`

_Session resumed: 2026-05-22 (Phase 13 — filter reset fix)_
_Session ended: 2026-05-22 05:31:40 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 06:20:29 (Claude Code / claude-sonnet-4-6)_

---

## Phase 14 — Safety card click bug (2026-05-22)

### Goal
Clicking a safety file card (SAF-210526-0001) in production did nothing — no detail view, no toast, no navigation. The bug was missed across multiple sessions because previous debug focused on logic/CSS rather than script load order and DOM timing.

### Root Cause (three-layer cascade)

**Layer 1 — SyntaxError in portal_state.js**
`portal_state.js` was authored with the wrong content — it contained a verbatim copy of an older draft of `portal_api.js` (which itself declares `const API_BASE`). Since `portal_api.js` already declared `const API_BASE` in the global scope, loading `portal_state.js` threw:
```
SyntaxError: Identifier 'API_BASE' has already been declared (at portal_state.js:1:1)
```
portal_state.js was entirely inert as a result. However, `portal_main.js` already contained all the state layer code (PERMS, DB, SESSION, refresh functions, normalize functions, proxyDB, auth functions), so the portal's state layer was intact via portal_main.js alone. This was a misleading red herring.

**Layer 2 — backToTopBtn null crash (THE critical bug)**
In `portal_main.js`, at line 3162 (top-level, not inside any function):
```javascript
const backToTopBtn = document.getElementById('back-to-top');
```
And at line 3177:
```javascript
backToTopBtn.innerHTML = '↑';  // crashes if null
```
In `portal.php`, the `<script>` tags (lines 819–821) appeared BEFORE the `<button id="back-to-top">` (line 824). Scripts without `defer` block HTML parsing and execute immediately — the button didn't exist in the DOM yet. `document.getElementById` returned `null`. Line 3177 threw:
```
TypeError: Cannot set properties of null (setting 'innerHTML') at portal_main.js:3177
```
This halted portal_main.js execution at line 3177.

**Layer 3 — SAFETY_SECTIONS TDZ**
Because portal_main.js execution stopped at line 3177, `const SAFETY_SECTIONS` at line 3183 was never initialized. When a user clicked a safety file card, the click dispatcher called `newSafetyAudit()` → `safBuildSections()` → `safCalcScore()` → accessed `SAFETY_SECTIONS` → TDZ error:
```
ReferenceError: Cannot access 'SAFETY_SECTIONS' before initialization
```
The async `safViewFile()` had no try/catch so the error became an unhandled promise rejection — no toast, no navigation. User saw "nothing happens."

### Why not found earlier
All prior debug sessions inspected JS logic (function flow, RBAC, CSS). The actual bug was a DOM ordering error in `portal.php` — a non-JS file, not typically checked in a JS debug session.

### Fixes Applied

**Fix 1 — portal.php**: Moved `<button id="back-to-top">` to BEFORE the `<script>` tags so the element exists in the DOM when portal_main.js runs.

**Fix 2 — portal_main.js lines 3162–3177**: Wrapped backToTopBtn usage in a null guard:
```javascript
if (backToTopBtn) {
  backToTopBtn.innerHTML = '↑';
  window.addEventListener('scroll', () => { ... });
}
```

**Fix 3 — portal_state.js**: Replaced wrong API layer content with a stub comment. State layer stays in portal_main.js (already there and working).

### Work Done
- `refactored_portal/portal.php` — moved back-to-top button before script tags
- `refactored_portal/js/portal_main.js` — null guard around backToTopBtn (lines 3162-3177)
- `refactored_portal/js/portal_state.js` — replaced with stub (removes SyntaxError from console)
- `refactored_portal/_backups/portal_backup_20260522_070223.php` — backup created
- `refactored_portal/_backups/portal_main_backup_20260522_070223.js` — backup created
- `refactored_portal/_backups/portal_state_backup_20260522_070223.js` — backup created

### Decisions
- portal_state.js left as a stub rather than deleting its script tag — avoids portal.php changes beyond the button order fix, and can be populated later if the team wants a proper three-way split
- Null guard added defensively even after fixing DOM order — belt and suspenders against future HTML reordering

### Learnings
- **Script-before-element is silent until runtime**: top-level `document.getElementById` calls in script files always return null if the element appears LATER in the HTML. No lint tool catches this — you have to trace the exact execution order.
- **Any top-level throw stops the whole file**: `const SAFETY_SECTIONS` at line 3183 was 6 lines below the crash. One uncaught line prevents everything after it from initializing.
- **Unhandled promise rejections are invisible to users**: `async function safViewFile()` had no try/catch. Every error inside became a silent rejection — zero UI feedback. Always wrap async onclick handlers in try/catch.
- **Red herring errors obscure root causes**: the prominent `SyntaxError` on portal_state.js looked like the root cause but was irrelevant — portal_main.js had all the state code independently. The real crash was 3 script lines later.

**Note:** The refactored_portal files are not used in production. The same bug existed identically in the original `portal.php` (line 845 script, line 848 button) and `portal.js` (line 3216 crash, line 3222 SAFETY_SECTIONS). Fixes also applied to originals:
- `BlackFire/BlackFire Portal/portal.php` — moved button before script tag
- `BlackFire/BlackFire Portal/portal.js` — null guard around backToTopBtn
- `BlackFire/BlackFire Portal/_backups/portal_backup_20260522_070625.php` — backup
- `BlackFire/BlackFire Portal/_backups/portal_backup_20260522_070625.js` — backup

_Session resumed: 2026-05-22 (Phase 14 — safety card click bug)_
_Session ended: 2026-05-22 07:15:00 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 07:04:32 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 07:07:02 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 07:12:38 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 07:23:15 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 07:25:58 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 07:39:34 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 07:42:23 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 08:03:40 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 08:06:48 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 08:09:15 (Claude Code / claude-sonnet-4-6)_
