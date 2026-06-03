# Session: Portal How-To Guide Expansion
Date: 2026-06-02
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Expand all how-to guide content in the BlackFire Portal (`PAGE_INFO` object in portal.js). Every page guide needed richer steps, more actionable tips, additional FAQs, and field-level guidance. Two pages (`p-home`, `p-services`) had no guide at all.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- Expanded every guide's `steps` array with field-by-field and workflow-level detail rather than high-level summaries.
- Added 2–4 FAQs per page (up from 1–3), focusing on common confusion points and edge cases.
- Added `p-home` and `p-services` guides which were missing entirely — the portal returned "No guide available for this screen yet" for these pages.
- Kept the existing `PAGE_INFO` schema unchanged (title, sub, purpose, steps, tips, faqs, linked, access) — no structural changes needed.
- Backed up portal.js to `_backups/portal_backup_20260602_224451.js` before editing.

## Work Done
- `BlackFire/BlackFire Portal/portal.js` — replaced PAGE_INFO object (lines 1165–1660) with expanded version. All 24 page guides updated or added. Guide count went from 21 to 24 (added p-home, p-services; p-reconcile was already present).
- `BlackFire/BlackFire Portal/_backups/portal_backup_20260602_224451.js` — timestamped backup created.

## Blockers / Next Steps
- None. All existing guides expanded; missing guides added.
- The `p-reconcile` guide was already in the original but was not in `PAGE_ACTIONS` — could add quick-action links for it if desired.
- Consider adding guides for any future pages as they are built.

## Learnings
- The portal `PAGE_INFO` object is the single source of truth for all how-to guide content. It is completely JS-side — no server-side changes required to update guides.
- `p-home` and `p-services` page IDs exist in the router but had no PAGE_INFO entries; the panel rendered a "No guide available" fallback for these pages.
- Guide quality is highest when steps are field-level (what to select, what to type, what to look for) rather than just feature-level summaries.
_Session ended: 2026-06-02 22:53:55 (Claude Code / claude-sonnet-4-6)_
