# Session: CSP Violations — Full Proper Fix
Date: 2026-05-28
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Fix all CSP violations in the BlackFire portal. The CSP header is in enforcement mode and
blocking inline event handlers (onclick, onkeydown, oninput, onchange) and inline styles.
This breaks login Enter-key, nav buttons, search filters, and all table action buttons.
Full proper fix requested: no 'unsafe-inline' added, all inline handlers converted to
data-action / addEventListener, all inline styles moved to CSS classes or data attrs.

## Model Recommendation
Task tier: 2-Medium (multi-file refactor)
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Scope
- portal.php: 62 inline event handlers
- portal.js: 100+ inline onclick handlers in template literals
- portal.js: 100+ inline style= attributes in template literals

## Decisions
- Full proper fix chosen (no 'unsafe-inline' added at all)
- Blob HTML inside _buildTrackerHTML and downloadStatement (lines 4769–5414 and 2894–2901) left as-is — those run under the blob: origin, not the portal CSP
- Dynamic styles (chart bar heights, progress fill widths/colors) handled with data-* attributes + post-render JS (applyProgFills, querySelectorAll('.cbar[data-h]'))
- Visibility toggling switched from style.display to classList.add/remove('d-none') throughout
- Existing dispatcher extended from ~30 to ~100+ actions; split into input/change delegation layers

## Work Done
- portal.php: removed all 62 inline event handlers and 1 inline style; converted to data-action or IDs+JS
- portal.js dispatcher: added ~70 new cases, 3 new event delegation listeners (input, change, DOMContentLoaded keydown)
- portal.js: replaced all template-literal onclick/oninput/onchange handlers with data-action + data-* attributes
- portal.js: replaced all portal-context inline style="" attributes with CSS classes
- portal.css: added ~150 utility classes and component classes for the removed inline styles
- Added applyProgFills() helper for dynamic progress bar width/color post-render

## Blockers / Next Steps
- Test the portal end-to-end (login, nav, callouts, quotes, invoices, safety) to catch any missed data-action wires
- The CSP on portal.php still has no 'unsafe-inline' — if any new JS features use inline styles they must use CSS classes or post-render JS

## Learnings
- CSP inline style violations in Chrome come from style="" HTML attributes injected via innerHTML, NOT from el.style.xxx = value JS assignments (those are CSSOM and allowed)
- Blob URLs opened with window.open() run under blob: origin with no CSP — safe to leave inline handlers inside those HTML strings
- Converting 100+ template-literal onclick handlers to data-action is mechanical but doable; the dispatcher switch-table approach scales well
- The existing data-action dispatcher pattern was already in place — extending it was clean
_Session ended: 2026-05-28 07:14:22 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 07:20:26 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 07:51:49 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 07:59:58 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-29 12:06:14 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-29 12:21:14 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-29 12:23:41 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-29 12:24:05 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-29 12:24:41 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-29 12:26:00 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-29 12:28:41 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-29 12:35:27 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-29 15:35:44 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-29 18:57:36 (Claude Code / claude-sonnet-4-6)_
