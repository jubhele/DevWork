# Session: BlackFire Portal — Guide Panel Restyle (tracker-style)
Date: 2026-05-24
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Apply the Action Tracker's guide panel design (orange sticky header, dark overlay backdrop, accent section labels, amber tip boxes) to the main portal's info/guide panel — unifying the guide UX across the entire portal.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Moved the page title + subtitle out of the scrollable panel body and into a new sticky orange header (#info-panel-hdr), matching the tracker's design.
- Added a dark overlay (#info-overlay) behind the panel; clicking it closes the guide — matches tracker UX.
- Changed the GUIDE button (SVG + text pill) to a simple round "?" button to match the tracker's control.
- Upgraded `z-index` from 98 → 500 (overlay 499) so the panel sits above all portal content.
- Panel now starts from `top:0` (was `top:152px`) — full-height slide-in, same as tracker.
- Kept all existing content: role capabilities, quick actions, steps, tips, FAQs, suggestion form.
- Section labels changed from gray IBM Plex Mono to orange accent + border-bottom.
- Tips changed from left-border strip to rounded amber box (same `.g-tip` visual).
- Quick-action buttons changed from monospace pill to `Instrument Sans` rounded-rectangle.

## Work Done
- `BlackFire/BlackFire Portal/portal.php` — 2 edits:
  1. Info button changed to single `?` character in a round button
  2. Info panel restructured: added `#info-overlay` div, added sticky `#info-panel-hdr` with title/sub/close ×
- `BlackFire/BlackFire Portal/portal.css` — 5 edits:
  1. `.info-btn` restyled to round `?` button
  2. `#info-panel` restructured: full-height, flex-column, z-index 500, `border-left: 2px solid accent`; added `#info-overlay`, `#info-panel-hdr`, `#info-panel-close` styles
  3. `.ipanel-badge`, `.ipanel-title`, `.ipanel-sub` → `display:none` (moved to header)
  4. `.ipanel-section-lbl` → orange accent + border-bottom
  5. `.ipanel-tip` → rounded amber box; `.ipanel-tip-icon` → hidden
  6. `.ipanel-suggest-lbl` → matches section label style
  7. `.ipanel-action-btn` → `Instrument Sans` rounded-rectangle button
- `BlackFire/BlackFire Portal/portal.js` — 2 edits:
  1. `renderInfoPanel`: populates `#info-panel-hdr-title` and `#info-panel-hdr-sub` dynamically per page
  2. Removed badge/title/sub from `panel.innerHTML` (now in sticky header)
- Backups: `_backups/portal.css_backup_20260524_144511.css`, `portal.php_backup_20260524_144511.php`, `portal.js_backup2_20260524_144511.js`

## Blockers / Next Steps
- Needs live test: open portal → click "?" → verify orange header shows page title, overlay present, × closes, overlay click closes, all sections render correctly.

## Learnings
- The portal guide system uses a `data-state` + `data-info` CSS attribute approach for showing/hiding the panel — this is clean and only needed two new selector lines for the overlay.
- Moving title/sub to a sticky header requires both a PHP structural change (the header HTML) and a JS change (populating it at render time). The content in `panel.innerHTML` is wiped on every page change, but the header HTML is static and only its text content changes.
_Session ended: 2026-05-24 14:45:11 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-24 14:52:14 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-24 15:15:15 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-24 15:17:44 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-24 15:18:26 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-24 15:22:53 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-24 15:26:36 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-24 15:27:08 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-24 15:33:11 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-24 15:34:28 (Claude Code / claude-sonnet-4-6)_
