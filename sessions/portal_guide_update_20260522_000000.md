# Session: Portal Guide Update — PAGE_INFO Refresh
Date: 2026-05-22
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Update the PAGE_INFO guide object in portal.js to reflect all new features added to the BlackFire Umlilo Portal since the info mode guide was originally written on 2026-05-21. Changes cover: Users Edit/Disable, document inline viewing, Safety Files soft-delete/combobox/score/policy-ack, Safety Audit remediation pack, and a new p-safety-detail page entry.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Add new p-safety-detail entry to PAGE_INFO — this page exists in portal.php but had no guide entry
- Update p-safety to reflect: Deactivate (soft delete), combobox dropdowns for contractor/personnel/compliance person, Audit Score vs Completion % distinction, section sign-off document upload per section, Policy Acknowledgements panel
- Update p-safety-audit to reflect: Generate Docs (Remediation Pack) button, Action Tracker now offers Preview + Download instead of auto-download
- Update p-users to reflect: Edit modal (name/role/title/password), Disable/Enable toggle, disabled users shown at reduced opacity
- Update p-invoices and p-quotes to reflect: Files quick-access button on each row, View (👁) button for PDF/image attachments
- Update p-callouts to reflect: View (👁) button on attachments in the panel, record context header on upload modal

## Work Done
- sessions/portal_guide_update_20260522_000000.md — session log created
- BlackFire/BlackFire Portal/_backups/ — portal.js backup
- BlackFire/BlackFire Portal/portal.js — PAGE_INFO updated

## Blockers / Next Steps
- None

## Learnings
- TBD
_Session ended: 2026-05-22 21:08:53 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-22 21:19:36 (Claude Code / claude-sonnet-4-6)_
