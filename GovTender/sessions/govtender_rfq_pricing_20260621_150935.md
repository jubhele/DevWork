# Session: GovTender RFQ Pricing Module
Date: 2026-06-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Add RFQ (Request for Quote) capability to the GovTender proposal generator. When a tender includes
an RFQ, the system should identify industry-standard line items for that tender category, price
them at market rates, apply a 40% markup, and include the itemised schedule in the proposal document.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- Created `proposal/rfq.py` — standalone RFQ module using Claude to identify standard items + apply markup
- Updated `proposal/generator.py` to call RFQ generator and inject pricing into the proposal prompt
- 40% markup applied to all cost items as instructed (industry practice for contingency + profit)
- RFQ section added as "## RFQ / PRICING SCHEDULE" in proposal structure

## Work Done
- `proposal/rfq.py` (new) — RFQ module: calls Claude to identify standard line items for tender category, prices at market rates, applies 40% markup, returns structured dict
- `proposal/generator.py` — updated `generate()` to call `build_rfq()` before `_call_sonnet()`; updated `_call_sonnet()` to inject RFQ table into prompt; updated `_render_docx()` to render structured table via `_insert_rfq_table()`; added `_insert_rfq_table()` helper for docx table with totals row and markup note
- 40% markup applied as: `marked_up_rate = market_rate × 1.40` on each line item; cited in document as NT SCM-aligned overhead/contingency/profit

## Blockers / Next Steps
- Phase 2 items: register/onboarding wizard, profile + document upload, billing page, eTenders form-fill automation (`automation/portals/etenders.py`)

## Learnings
- RFQ table needs section-scoped skip logic in docx renderer — a global flag would incorrectly suppress all subsequent markdown tables; use `_in_rfq_section` that resets on next `## ` heading
- 40% is standard for SA government RFQ markup covering overhead, contingency, and profit per NT SCM guidelines
