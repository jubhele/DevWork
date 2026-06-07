# Session: Dashboard Draggable Cards + Admin Default Layout
Date: 2026-06-02
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Add two capabilities to the BlackFire portal dashboard: (1) users can drag-and-drop widget sections to reorder them, (2) admins can save a default layout that applies to all users who haven't customised their own layout, without overriding users who have.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- Phase 1: Changed pref storage format from flat `{w-ops: true}` to structured `{enabled:{}, order:[], customized:bool}` with backward-compat migration
- Phase 1: Admin default stored under `bf_dash_default` localStorage key; only applied to users without `customized:true`
- Phase 1: `isWidgetOn(id, prefs)` updated to accept optional prefs arg (no extra localStorage reads in render loop)
- Phase 2: Refactored renderDashboard to iterate widget order via per-widget block builder functions (_dashBlockOps, _dashBlockFin, _dashBlockAlerts, _dashBlockCompliance, _dashBlockCompare) — ops and fin KPIs now each in their own kgrid (cleaner, reorderable)
- Phase 3: Drag-and-drop in Edit Layout modal uses HTML5 drag API (no library); each row has a grip handle SVG
- Phase 3: Admin section in modal (visible to admin/sysadmin roles) with "Set as Default for All Users" button

## Work Done
- portal.js — updated getDashPrefs/isWidgetOn/getDashWidgetOrder, refactored renderDashboard with helpers, updated showDashEditor with drag, updated saveDashEditorPrefs, added setDashDefaultForAll, added dispatcher case
- portal.css — added .dwt-row, .dwt-drag-handle, .dw-dragging, .dw-drag-over, .dash-editor-admin-section

## Blockers / Next Steps
- Run `install/migration_dashboard_layout.sql` on production DB before deploying.
- Browser test: login, save layout, logout, login from a different browser — layout should follow.

## Resumed 2026-06-03

### Additional Work Done
- `api/dashboard_prefs.php` — new endpoint: GET (user layout + admin default), PUT (save personal), PUT `?action=set_default` (admin default), PUT `?action=reset_all` (null all non-self layouts)
- `install/migration_dashboard_layout.sql` — updated `bf_settings` table to include `host_company_id INT DEFAULT 1` as primary key prefix for Phase 1 multi-tenancy readiness
- `portal.js` — added `_dashPrefsCache`, `loadDashPrefsFromAPI()`, updated `saveDashPrefs()` to fire-and-forget API PUT, wired `loadDashPrefsFromAPI` into both login paths (interactive + session-restore) in parallel with `refreshAll()`, cleared cache on logout; `resetDashLayoutForAll` made async and API-driven; `setDashDefaultForAll` calls API alongside localStorage

### Decisions
- `bf_settings` keyed by `(host_company_id, setting_key)` not just `setting_key` — zero extra cost now, avoids a table migration later when multi-tenant is activated
- `reset_all` preserves the triggering admin's own layout (`WHERE id != :me`) — admin who triggers the reset doesn't lose their own prefs
- `loadDashPrefsFromAPI` auto-migrates localStorage prefs to DB on first login post-deploy (detects `customized:true` in localStorage, saves to DB, transparent to user)

## Learnings
- Refactoring renderDashboard into per-widget block builders (_dashBlockOps, _dashBlockFin, etc.) is the right pattern for any future widget additions — each widget is self-contained and the render loop is trivial
- HTML5 drag API works without libraries; the key is setTimeout on dragstart to avoid the dragging element itself being styled before the browser captures the drag image
- Admin default layout stored in localStorage (bf_dash_default) is the right scope for this portal — all users on the same device share it, which matches the intended AECI admin workstation pattern; a DB-persisted default would be needed for multi-device deployments
- `isWidgetOn(id, prefs)` accepting an optional prefs arg avoids repeated localStorage reads in tight loops — pass pre-fetched prefs from the caller
_Session ended: 2026-06-02 08:42:16 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-02 08:42:37 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-02 08:56:37 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-02 09:05:09 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 07:19:36 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 07:19:39 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 07:19:47 (Claude Code / claude-sonnet-4-6)_
