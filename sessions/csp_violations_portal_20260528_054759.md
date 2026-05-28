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

## Work Done

## Blockers / Next Steps

## Learnings
_Session ended: 2026-05-28 07:14:22 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 07:20:26 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 07:51:49 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 07:59:58 (Claude Code / claude-sonnet-4-6)_
