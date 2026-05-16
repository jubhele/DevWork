# Session: AECI Comparison — Cost Verification & Corrections
Date: 2026-05-16
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Review and verify all financial figures in AECI_Current_vs_Proposed_Comparison.md before client presentation. Correct calculation errors, strip existing BlackFire maintenance contract figures from the cost comparison, reflect the R6,000 flat-fee structure accurately (no per-dispatch charges), update the 4-vendor fragmented model narrative, replace "NOC" with "Control Room" across all AECI .md files, and add a formal estimate disclaimer throughout.

## Model Recommendation
Task tier: 2-Medium (multi-file document review, cost analysis, terminology replacement)
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Existing BlackFire services (R45k fence + R35k NOC + R25k access = R105k/month) removed from both cost sections — baseline contract; not relevant to the new proposal discussion.
- R6,000/month is an all-inclusive flat fee to the current tactical reaction provider covering ALL dispatches regardless of volume — no per-dispatch charges. Redirected to drone under proposed model; net new spend is R40,000/month.
- Per-dispatch cost savings (R14,400/month) removed throughout — these do not exist under a flat fee model.
- Specific overhead figures (R8k config, R5k fatigue, R156k/year) removed from the client-facing document — these are internal estimates AECI may dispute. Replaced with qualitative descriptions.
- Financial case reframed: primary value is operational capability uplift, not direct cost savings.
- AECI uses 4 separate vendors (not 3): BlackFire monitoring + physical guard company + tactical reaction provider + ad-hoc drone. Document updated throughout to reflect this.
- "NOC" replaced with "Control Room" across all 8 active AECI .md files — client-friendly terminology.
- Estimate disclaimer added after document header in AECI_Current_vs_Proposed_Comparison.md.

## Work Done
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Added estimate disclaimer block after document header
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Section 1: Removed R105,000 existing services block; corrected for flat-fee model (no per-dispatch savings); removed specific overhead estimates
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Cost-Benefit Summary: Restructured around capability uplift; removed disputed overhead figures
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Section 6: Removed per-dispatch cost calculations; replaced with qualitative overhead description
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Section 8 command diagram: Updated from 2-party to 4-vendor diagram (BlackFire + physical guards + tactical + drone)
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Section 9 training block: Added physical guard company as separate vendor
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Section 10: Replaced Monthly/Annual Spend rows; removed specific overhead savings figures
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — SLA table, technology section, subtitle: Updated vendor count from 3 to 4
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — All 63 instances of "NOC" replaced with "Control Room"
- `BlackFire/AECI_Security_Model_Comparison_Matrix.md` — 13 instances of "NOC" replaced with "Control Room"
- `BlackFire/Clients/AECI/AECI_Executive_Summary.md` — 9 instances replaced
- `BlackFire/Clients/AECI/AECI_Drone_Strategic_Value_Proposition.md` — 8 instances replaced
- `BlackFire/Clients/AECI/AECI_Tactical_Operations_Manual.md` — 36 instances replaced
- `BlackFire/Clients/AECI/AECI_Drone_Surveillance_Addendum.md` — 14 instances replaced
- `BlackFire/Clients/AECI/AECI_Proposal_Letter.md` — 4 instances replaced
- `BlackFire/Clients/AECI/AECI_Tactical_Armed_Guard_Portfolio_Pack.md` — 17 instances replaced
- `memory/project_aeci_vendors.md` — Created; documents 4-vendor structure with R6k flat fee detail
- `chatsessions/README.md` — Session index updated

## Blockers / Next Steps
- [ ] Confirm the R35,000/month tactical unit rate is accurate for AECI site scope before final presentation
- [ ] Confirm R5,000/month enhanced NOC integration pricing (included in subscription or separate)
- [ ] Confirm physical guard company's role in the proposed model — are they retained, replaced, or phased out?
- [ ] Client presentation scheduled — verify AECI contact name and meeting date
- [ ] **BACKUP COMPLIANCE GAP**: The 7 NOC→Control Room file replacements were made without creating timestamped backups first (CLAUDE.md §7a). Backups from 09:15–09:19 today predate these edits. Create backups of current file states if another editing pass is expected.
- [ ] Session log filename format was wrong: used `YYYY-MM-DD_topic.md` instead of `<chat-name>_YYYYMMDD_HHmmss.md` per CLAUDE.md §1. Correct format for future sessions.

## Learnings
- **"Control Room" is the correct client-facing term** — "NOC" is internal jargon unfamiliar to non-technical clients. Apply this to all future AECI documents from the start.
- **Flat-fee contracts kill per-dispatch savings arguments** — always confirm pricing model before building a cost savings case. The value case shifted entirely to capability uplift once this was confirmed.
- **Never attribute internal cost estimates to the client without confirmation** — figures like R8k/month config overhead and R5k/month fatigue were our estimates; a client can reject them and undermine the whole proposal. Qualitative framing is safer until the client confirms their own numbers.
- **4 vendors, not 3** — AECI's fragmented structure is even stronger than initially documented. Physical guard company is a separate vendor from the tactical reaction provider. This strengthens the consolidation case.
- **Backup compliance**: CLAUDE.md §7a requires a timestamped backup before ANY file modification. This was missed for all 7 NOC→Control Room replacements this session. Must become automatic — run backup step before every `Edit` call on client documents.
- **Session log structure**: Must include `## Model Recommendation` and `## Learnings` sections from the start, not as afterthoughts. The model was correctly matched (Sonnet 4.6, Tier 2) — no score update needed.
_Session ended: 2026-05-16 17:02:27 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-16 17:35:36 (Claude Code / claude-sonnet-4-6)_
