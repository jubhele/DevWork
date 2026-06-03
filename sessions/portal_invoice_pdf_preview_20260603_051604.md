# Session: Portal Invoice PDF Preview Fix
Date: 2026-06-03
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Fix the invoice attachment PDF preview modal showing "blackfiresolutions.co.za refused to connect" instead of displaying the PDF file.

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: over-powered for this task

## Decisions
- Root cause: `api_headers()` in `helpers.php` unconditionally sets `X-Frame-Options: DENY` and `Content-Security-Policy: default-src 'none'`. These headers are emitted at the top of `files.php` before the action is known, and the `action=view` success path never overrides them — so the browser blocks the iframe.
- Fix: Override `X-Frame-Options` to `SAMEORIGIN` and loosen CSP to `default-src 'self'` only when streaming an inline view response.
- Chose server-side fix over client-side blob URL approach (simpler, targeted).

## Work Done
- `BlackFire/BlackFire Portal/api/files.php` — Added header overrides (`X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy: default-src 'self'`) for `action=view` responses only, placed just before `readfile()`.

## Blockers / Next Steps
- Deploy to production server and verify PDF preview works in the invoice attachments modal.

## Learnings
- `api_headers()` sets blanket `X-Frame-Options: DENY` which breaks any iframe-based file viewer. File streaming endpoints that serve inline content must override this for same-origin embeds.
_Session ended: 2026-06-03 05:16:42 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 05:20:53 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 05:35:25 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 05:43:16 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 05:57:14 (Claude Code / claude-sonnet-4-6)_
