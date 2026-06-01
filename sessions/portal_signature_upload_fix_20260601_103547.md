# Session: Portal Signature Upload CSP Fix
Date: 2026-06-01
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Fix the "Choose File" native file input showing visibly in the Edit User signature section,
and the preview wrap showing immediately on modal open. Both should be hidden until user
interacts with the upload flow.

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: over-powered for this task

## Decisions
- Root cause: CSP `style-src` in portal.php (line 98) does not include `'unsafe-inline'`,
  so all `style="display:none"` HTML attributes in JS template literals are silently ignored
  by the browser. The `.hidden { display:none!important }` CSS class is CSP-safe (it lives
  in portal.css served from 'self').
- Fix: replace all `style="display:none"` in the openEditUserModal HTML template with
  class `hidden`, and switch all JS `.style.display` toggles on those elements to
  `classList.add/remove('hidden')` so they remain consistent with the initial class state.

## Work Done
- `BlackFire/BlackFire Portal/portal.js` — 6 changes:
  1. `eu-sig-current` div: `style="${has?'':'display:none'}"` → `class="...${has?'':' hidden'}"`
  2. `eu-sig-file` input: `style="display:none"` → `class="hidden"`
  3. `eu-sig-new-wrap` div: `style="display:none"` → add `hidden` to class list
  4. `saveUserSignature`: `.style.display = ''` / `'none'` → `classList.remove/add('hidden')`
  5. `removeUserSignature`: `.style.display = 'none'` → `classList.add('hidden')`
  6. `clearSigPreview`: `.style.display = 'none'` → `classList.add('hidden')`
  7. `onSigFileSelected`: `.style.display = ''` → `classList.remove('hidden')`
- Backup: `BlackFire/BlackFire Portal/_backups/portal_js_backup_20260601_103547.js`

## Blockers / Next Steps
- Deploy updated portal.js to Afrihost live server

## Learnings
- The portal CSP (`style-src 'self'`) blocks all HTML inline styles. Any `style="..."` in
  JS-generated HTML templates is silently dropped. Always use CSS classes for initial
  hide/show state in dynamically inserted markup; use `classList` in JS to toggle them.
_Session ended: 2026-06-01 10:37:18 (Claude Code / claude-sonnet-4-6)_
