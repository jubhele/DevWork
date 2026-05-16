# Session: AECI Comparison — Cost Verification & Corrections
Date: 2026-05-16
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Review and verify all financial figures in the AECI_Current_vs_Proposed_Comparison.md document before client presentation. Correct any calculation errors, strip existing BlackFire maintenance contract figures from the cost comparison (as those are baseline and not part of the new proposal), and add a formal estimate disclaimer throughout.

## Decisions
- Existing BlackFire services (R45,000 fence + R35,000 NOC + R25,000 access = R105,000/month) removed from both cost sections — these are existing contract and not relevant to the new proposal discussion.
- R6,000/month is an all-inclusive flat fee to the current tactical reaction provider covering ALL dispatches regardless of volume — no per-dispatch charges. This R6,000 is redirected to fund the on-site drone; net new spend is R40,000/month (R35,000 tactical + R5,000 enhanced NOC).
- Per-dispatch cost savings (R14,400/month) removed throughout — these do not exist under a flat fee model.
- False alarm financial savings revised to R156,000/year (config overhead R8,000/month + team fatigue R5,000/month = R13,000/month × 12 only).
- Net annual investment revised to R324,000/year (R480,000 new − R156,000 savings).
- Total Annual Value revised to R281,000–R406,000/year.
- Financial case reframed: near breakeven financially; primary case is operational capability uplift (drone, thermal, SAPS evidence, single-vendor accountability).
- Disclaimer updated to reflect flat fee structure and corrected savings basis.
- Disclaimer added after document header covering all estimates, assumptions, and key cost basis items.

## Work Done
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Added estimate disclaimer block after document header
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Section 1 (Current Model): Removed R105,000 existing services block; kept only the additional/variable cost problem (dispatch, retainer, overhead, fatigue = R27,400+/month)
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Section 1 (Proposed Model): Removed "Existing BlackFire Services (unchanged)" block; showed only net new spend (R40,000/month after reallocation)
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Cost-Benefit Summary: Updated to use R328,800 false alarm base, R308,000 savings offset, net ~R172,000/year
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Section 10 table: Replaced Monthly/Annual Spend rows with False Alarm Cost + Net Programme Investment rows
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Section 10 Total Annual Benefit: Removed Direct Cost Savings line; recalculated total to R433,000–R564,000/year
- `BlackFire/Clients/AECI/AECI_Current_vs_Proposed_Comparison.md` — Confirmed 4-vendor structure: BlackFire + physical guard company + tactical reaction provider (R6k flat) + ad-hoc drone. Updated Section 8 command diagram, Section 9 training block, document subtitle, SLA table, and technology section to reflect all 4 vendors.

## Blockers / Next Steps
- [ ] Confirm the R35,000/month tactical unit rate is accurate for AECI site scope before final presentation
- [ ] Confirm R5,000/month enhanced NOC integration is included in proposed contract or priced separately
- [x] Conclusion table False Alarm Cost row updated from R268,800 to R328,800 (savings updated to R308k+)
- [ ] Client presentation scheduled — verify AECI contact name and meeting date

---
_Session ended: 2026-05-16 07:18:57 (Claude Code / claude-sonnet-4-6)_

---
_Session ended: 2026-05-16 07:20:24 (Claude Code / claude-sonnet-4-6)_

---
_Session ended: 2026-05-16 07:24:05 (Claude Code / claude-sonnet-4-6)_

---
_Session ended: 2026-05-16 08:33:25 (Claude Code / claude-sonnet-4-6)_

---
_Session ended: 2026-05-16 08:35:10 (Claude Code / claude-sonnet-4-6)_

---
_Session ended: 2026-05-16 08:37:39 (Claude Code / claude-sonnet-4-6)_
