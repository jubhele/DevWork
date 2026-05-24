# Session: Info Mode — Page How-To Guide
Date: 2026-05-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Add an info/guide toggle button to the BlackFire Portal (Umlilo Portal) that works like the theme toggle. When switched on it shows a slide-in right panel for the current page with: a how-to guide explaining what the page is for, what it links to, who has access, and a suggestion/comment box that logs to the audit trail.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Panel is a fixed right-side drawer (340px), overlays content — no layout shift needed
- Panel top aligns to bottom of sub-nav bar (152px from top: 68 topbar + 46 primary nav + 38 sub-nav)
- State persisted in localStorage as 'bf-info' ('on'/'off')
- Suggestion box posts to api/audit.php via new POST handler; any authenticated user can submit
- PAGE_INFO definitions written as step-by-step how-to guides, not just metadata
- CSRF not enforced on existing API POST endpoints so not added here (consistent with codebase pattern)

## Work Done
- `api/audit.php` — added POST handler; any authenticated user can submit a PAGE_SUGGESTION entry to the audit log
- `portal.php` — added `.info-btn#info-mode-btn` in the portal topbar (portal-only, hidden on public site); added `#info-panel` fixed drawer div before the modal
- `portal.css` — added `.info-btn` styles (mirrors `.theme-btn`, active state uses accent colour); added `#info-panel` right-side drawer (340px, fixed top:152px to clear all nav bars, transform slide-in/out)
- `portal.js` — added `PAGE_INFO` object with step-by-step how-to guides for all 20 portal pages; `toggleInfoMode()`, `renderInfoPanel()`, `submitInfoSuggestion()`; wired `data-action="toggleInfoMode"` into the click dispatcher; `showPortalPage` now calls `renderInfoPanel(id)` on every navigation; DOMContentLoaded restores persisted info mode state

## Blockers / Next Steps
- None. Guide text can be iteratively improved as the team uses it.

## Learnings
- The portal topbar is hidden via `display:none` until `[data-state="portal"]`, so the info button naturally doesn't appear on the public site — no extra logic needed.
- `color-mix(in srgb, ...)` is used for tinted backgrounds; requires a modern browser (all current browsers support it).
- Suggestion submissions go to `audit.php` POST which requires only `require_auth()` (no role restriction), consistent with the spirit that any user can provide feedback.
_Session ended: 2026-05-21 23:08:51 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-21 23:14:34 (Claude Code / claude-sonnet-4-6)_
