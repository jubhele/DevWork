# Session: Safety File Item-Level Evidence
Date: 2026-05-28
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Enforce evidence-backed "To Standard" ratings in the safety file checklist. Currently, any item can be marked "To Standard" with no supporting document — the system happily accepts it and inflates the score. The fix wires up per-item evidence uploads (entity_type=safety_item, entity_ref={file_ref}:{section}:{item_no}), loads them from the DB when the safety file is opened, shows a visual warning when a TS item has no evidence attached, and adds a bhekani_bo integrity check to surface the gap in dev.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- entity_ref format: `{file_ref}:{section_key}:{item_no}` (e.g. `SAF-001:H:34`) — compact compound key, fits VARCHAR(50)
- File-level "Supporting Documents" panel stays untouched — that's for general attachments (contracts, policies); item-level evidence is a separate concern
- Visual warning: orange upload button with ⚠ symbol when result=TS and upCount=0 — actionable, not just a passive indicator
- Evidence viewer: small modal popup reusing the existing rename-overlay CSS; shows per-item files with view/download
- bhekani_bo check queries bf_attachments LEFT JOIN on the compound key pattern

## Work Done
- `api/files.php` — added `safety_item` entity_type; validation parses compound key `{file_ref}:{sec}:{item_no}` and verifies both the safety file and the specific item exist; increased entity_ref clean() limit from 30 → 50 in GET list and POST
- `api/safety.php` — `build_sections()` now queries `bf_attachments WHERE entity_type='safety_item' AND entity_ref LIKE '{ref_id}:%'`, parses compound keys, and distributes attachment objects into the correct item's `uploads` array; removed the old no-op `attach_uploads()` stub
- `portal.js` — `safHandleUpload()` now uploads to `entity_type='safety_item'`, `entity_ref={ref}:{sec}:{item_no}`, and stores the full attachment object (with id) from the API response instead of just the filename; added `_safUploadCellInner()` helper that renders the upload cell with: orange ⚠+ button when result=TS and upCount=0, a 👁 view button when evidence exists; updated item row render to use `_safUploadCellInner`; `safItemChanged()` now refreshes the upload cell immediately when result changes; added `safShowItemDocs()` modal that lists per-item evidence files with view/download; wired `safShowItemDocs` into click event delegation
- `dev-only/bhekani_bo.php` — added DB integrity check #9 that LEFT JOINs `bf_safety_items WHERE result='To Standard'` against `bf_attachments` on the compound key and flags all unevidenced items by file_ref/section/item_no

## Blockers / Next Steps
- No DB schema change required — `bf_attachments` already has `entity_type VARCHAR(30)` and `entity_ref VARCHAR(50)` which accommodate `safety_item` and the compound key format
- Existing TS items marked before this fix will show as unevidenced in bhekani_bo — teams should retroactively upload evidence for those items
- Consider enforcing evidence as a hard block on the Approve action in a future iteration (currently it's a visible warning, not a gate)

## Learnings
- The `attach_uploads()` no-op stub in safety.php was the root cause — it had a comment "individual item grouping can be added in a future iteration" but was never implemented, making every reload wipe the in-memory upload counts
- Per-item evidence binding uses a compound key `{file_ref}:{sec}:{item_no}` stored in the existing `entity_ref VARCHAR(50)` column — no schema migration needed
- `json_ok()` merges the data array at the top level (not nested under `data`), so upload response is `r.attachment` not `r.data.attachment`
_Session ended: 2026-05-28 10:28:59 (Claude Code / claude-sonnet-4-6)_
