# Session: Portal Invoice PDF Preview Fix
Date: 2026-06-03
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Fix the invoice attachment PDF preview modal — initially showing "blackfiresolutions.co.za refused to connect", then after first fix showing a blank PDF. Also audited all other file upload/access paths in the portal for the same class of issue.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions

### Phase 1 — Server-side header fix
- Root cause: `api_headers()` in `helpers.php` sets `X-Frame-Options: DENY` and `Content-Security-Policy: default-src 'none'` on every request. `files.php?action=view` never overrode these, so the browser blocked the iframe.
- Fix: Added `X-Frame-Options: SAMEORIGIN` + `Content-Security-Policy: default-src 'self'` overrides in `files.php` just before `readfile()` for the `action=view` path.

### Phase 2 — Full file-access audit
- Audited all endpoints: `files.php`, `external_upload.php`, `safety_doc_gen.php`, `admin.php`.
- Found `safety_doc_gen.php` also serves interactive HTML inline (`Content-Disposition: inline`) without overriding the blanket CSP/XFO from `api_headers()` — inline scripts/styles in the generated document would be blocked.
- Fixed `safety_doc_gen.php` with same pattern: override XFO to `SAMEORIGIN` and CSP to permissive HTML-safe policy before HTML output.

### Phase 3 — Blob URL approach (production server still blocked)
- After deploying Phase 1, production still blocked because Afrihost Apache likely sets `X-Frame-Options: DENY` at server level — PHP `header()` cannot override server-level headers in some Apache configs.
- Switched to client-side blob fetch: `openDocViewer` now fetches the file via `fetch()` (same-origin session cookie), creates a `blob:` URL, and uses that as the iframe/img `src`. Blob URLs have no server headers and bypass all X-Frame-Options restrictions.
- Added `_dvBlobUrl` module variable; `closeModalDirect` revokes it on modal close (no memory leak).
- Updated portal.php CSP: added `blob:` to `img-src` (was missing — would have blocked image previews) and added explicit `frame-src 'self' blob:` (previously absent, relied on browser interpretation of default-src).
- Confirmed working: PDF viewer opened with Chrome PDF toolbar visible and file content rendered.
- Blank PDF content on first test = the actual uploaded file was blank, not a code issue.

## Work Done
- `api/files.php` — Added `X-Frame-Options: SAMEORIGIN` + CSP override for `action=view` (defence-in-depth, still useful for direct links)
- `api/safety_doc_gen.php` — Added `X-Frame-Options: SAMEORIGIN` + permissive CSP before HTML output to unblock inline scripts/styles in generated remediation pack
- `portal.js` — Rewrote `openDocViewer` as `async`, fetch-as-blob, `_dvBlobUrl` tracker; modified `closeModalDirect` to revoke blob URL on close
- `portal.php` — CSP updated: `img-src 'self' data: blob:` + explicit `frame-src 'self' blob:`

## Blockers / Next Steps
- None — viewer confirmed working in production.
- Monitor for any other inline-served content that may hit the same `api_headers()` CSP bleed pattern.

## Learnings
- `api_headers()` blanket CSP/XFO pattern bleeds into any non-JSON response that calls it early. File streaming and HTML generation endpoints must explicitly override headers before emitting content.
- Server-level Apache `X-Frame-Options: DENY` cannot be overridden by PHP headers — client-side blob URL fetch is the robust cross-environment solution.
- CSP `img-src` must explicitly include `blob:` if images are ever loaded from `createObjectURL()` — it does not fall through from `default-src`.
- `frame-src` should be explicit; don't rely on `default-src` fallback for blob: iframe support across all browser versions.
_Session ended: 2026-06-03 07:17:54 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 07:18:05 (Claude Code / claude-sonnet-4-6)_
