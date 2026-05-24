# Session: Safety Upload Independence + One-Doc-Per-Compliance
Date: 2026-05-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Two UX improvements for the BlackFire Portal Safety module:
1. Allow save/upload to occur independently per section — add a "Save" button to each section header so auditors can save one section at a time without submitting the whole form, and without any page reload.
2. Enforce one document per compliance record (e.g. one medical certificate per person) — add upload capability directly on each compliance record row, with a one-file constraint enforced on both server and client.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6   Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- Section save sends only that section's items to safety.php PUT — API already supports partial upsert; no schema changes needed.
- New audits without a ref ID auto-create via POST on first section save (requires contractor name at minimum).
- Per-item upload file inputs: removed multiple attribute — one file per upload action.
- Compliance doc: entity_type='safety_compliance', entity_ref=<integer record id> stored as string in bf_attachments.
- One-file constraint enforced in files.php (server) — rejects upload if a doc already exists for that compliance ID.
- Replaced to upload: client calls DELETE then opens file picker; server never sees >1 file at once.
- safety_compliance.php GET: LEFT JOIN on bf_attachments so att_id/att_name/att_size come back with each record — no extra round-trips in JS.
- CSS: section save button styled muted/small to not dominate the section header chrome.

## Work Done
- BlackFire/BlackFire Portal/api/files.php — add safety_compliance entity type; one-file constraint before upload
- BlackFire/BlackFire Portal/api/safety_compliance.php — LEFT JOIN bf_attachments in GET response
- BlackFire/BlackFire Portal/portal.js — safSaveSection(), section header save button, remove multiple on per-item upload, compliance Doc column, safUploadComplianceDoc(), safReplaceComplianceDoc()
- BlackFire/BlackFire Portal/portal.css — .saf-sec-save-btn, .saf-doc-cell, .saf-doc-badge styles

## Blockers / Next Steps
- Need to verify IDOR on compliance attachment download — currently files.php allows admin/manager or uploader to download; compliance records should follow same rule (already covered).
- Consider: if a compliance record is deleted, its attached file is NOT auto-deleted (no CASCADE). A cleanup job or CASCADE DELETE via trigger may be warranted.
- Manual QA: test "Save Section A" on a new audit (auto-creates), then on an existing audit; test doc attach/replace cycle.

## Learnings
- safety_compliance table uses integer PK not ref_id — files.php entity validation needed a branch for this type.
- Partial section upsert via PUT already worked because _upsert_items only iterates what's in \['sections'].
- One-file constraint is purely server-side; client UX switches between "+ Doc" and "Replace" based on att_id presence in the GET response.
_Session ended: 2026-05-21 19:33:58 (Claude Code / claude-sonnet-4-6)_
