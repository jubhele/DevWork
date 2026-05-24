# Session: Rebrand Safety Form Number APS→BF / APS→AST
Date: 2026-05-22
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Remove all references to the third-party form number `APS-EHS-FRM-010` (belonging to APS / Astute Project Solutions) from the BlackFire Umlilo Portal safety module. Replace with BlackFire's own form reference `BF-SHE-FRM-010 Rev 01` and replace the company abbreviation `APS` with `AST` (Astute) throughout generated documents and UI.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Form number: `APS-EHS-FRM-010` → `BF-SHE-FRM-010` (BF = BlackFire, SHE = Safety Health Environment — SA standard term)
- Revision: `Rev 02` → `Rev 01` (new BlackFire form starts fresh)
- Company abbreviation: `APS` → `AST` everywhere in document text
- Full company name: `APS (Astute Project Solutions)` → `Astute`
- AECI references left unchanged — AECI is the client/site owner, not the form originator
- `refactored_portal/` and `portal - Copy.php` not updated — untracked stale copies, not live

## Work Done
- `BlackFire/BlackFire Portal/portal.php` — module comment + 2 subtitle labels
- `BlackFire/BlackFire Portal/portal.js` — module comment, 2 SAFETY_SECTIONS criteria strings, cover doc number, policy email modal default, fallback string in safSendPolicyEmailConfirm, Action Tracker page title + brand text, "File Submitted to AST", Submit button label (×2), table column header, rejection textarea placeholder, confirm dialog text, audit trail compliance note
- `BlackFire/BlackFire Portal/api/safety.php` — docblock + policy_ref default fallback
- `BlackFire/BlackFire Portal/api/safety_doc_gen.php` — item_type comment, A.3 ext guidance, A.7 ext guidance, D.6 ext guidance, H&S Plan principal contractor field + AST site contact + sig block, contractor mgmt procedure checklist reference, incident stats notification chains (×2), emergency procedure AST site contact + 5 scenario notification cells, cover page h2, footer generated-by line

## Blockers / Next Steps
- None

## Learnings
- "APS-EHS-FRM-010" was sourced from a different company (APS / Astute Project Solutions) and had been copy-pasted into the BlackFire portal without adjustment. The fix required touching 4 files and ~20 distinct string locations.
- BlackFire uses `BF-` prefix; SA standard is SHE (not EHS). When building future form references for this client use `BF-SHE-FRM-NNN` pattern.
- `AST` is Astute's short code in this portal context (replacing `APS`).
_Session ended: 2026-05-22 19:54:18 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 19:55:15 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 20:45:29 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 20:54:46 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 20:59:17 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 21:03:40 (Claude Code / claude-sonnet-4-6)_
