# Session: Document View & Upload Association
Date: 2026-05-22
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Enhance the BlackFire Portal file/document system so that: (1) uploaded documents are clearly associated with their parent record at upload time, (2) users can view documents inline in the browser (not just download), (3) these capabilities apply to all entity types including safety files, compliance records, quotes, invoices, callouts, and system-generated policies (action tracker).

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Added `action=view` to files.php that serves files with `Content-Disposition: inline` for PDF and image types; other types fall back to attachment download.
- `openDocViewer()` added as a central viewer function: iframe for PDF, img tag for images, download-only message for Word/Excel.
- Added record context header to `openAttachmentsModal()` — shows service/client/date so the user knows exactly which record they are uploading to.
- Added "Files" button directly on quote and invoice table rows (in addition to existing access inside the View modal) for quicker access.
- Added "View" (👁) buttons next to "Download" in all three attachment panel locations: generic modal panel, safety file detail panel, and compliance document cells.
- Changed `safGenerateTracker()` from auto-download to a modal offering both "Preview in Browser" (new tab, blob URL) and "Download", so the generated action plan tracker can be read without downloading.

## Work Done
- `api/files.php` — added `action=view` GET handler (inline Content-Disposition for PDF/image)
- `portal.js` — `openAttachmentsModal()`: added record context header (service+location+date for callouts; client+date for quotes; client+amount for invoices)
- `portal.js` — `loadAttachments()`: added "👁 View" button for PDF/image attachments in generic attachment panel
- `portal.js` — added `openDocViewer(id, name, mime)` function after `deleteAttachment()`
- `portal.js` — `renderQuotes()`: added "Files" button to each quote row
- `portal.js` — `renderInvoices()`: added "Files" button to each invoice row
- `portal.js` — `safRenderAttachments()` `rowHtml`: added "👁 View" button for PDF/images
- `portal.js` — `safRenderCompliance()` `docCell`: added "👁" view button using `rec.att_mime` (already returned by the API)
- `portal.js` — `safGenerateTracker()`: replaced auto-download with a modal offering Preview + Download

## Blockers / Next Steps
- The IDOR check in files.php currently restricts download/view to uploader or admin/manager. Consider relaxing to allow any authenticated user who can see the parent entity.
- No server-side storage of generated tracker — it lives as a blob URL. If server-side storage is needed, files.php would need to accept text/html uploads via a server-side generation route.

## Learnings
- The compliance API already returns `att_mime` in the LEFT JOIN — no API change was needed for the compliance view button.
- Blob URLs in onclick attributes work but revoking them is tricky across event callbacks; the current approach uses `setTimeout` for the download case and immediate revocation for the preview case.
_Session ended: 2026-05-22 13:06:36 (Claude Code / claude-sonnet-4-6)_
