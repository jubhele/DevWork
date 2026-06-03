# Session: Callout Quote Button — View Linked Quote
Date: 2026-06-02
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
When a callout already has a linked quote (and subsequently an invoice), clicking the QUOTE button in the Callouts table should display the existing quote sent to the client — not open a new quote form.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6   Trust score: 9/10
Active model: Sonnet 4.6   Status: correct

## Decisions
- `normalizeQuote` was missing `calloutRef` — added `calloutRef: q.callout_ref || ''` so quote objects carry their linked callout ID
- QUOTE button logic in `renderCallouts` now checks `proxyDB.quotes.find(q => q.calloutRef === c.id)`:
  - If a linked quote exists: button fires `previewQuote(linkedQuote.id)` — opens the quote preview modal
  - If no linked quote and user can create quotes: button fires `prefillQuoteFromJob(c.id)` — opens new quote form (unchanged behaviour)
  - Users with only `quote.view` (not `capture.new_quote`) can still see the View Quote button when a quote exists
- `previewQuote` was already wired in the click dispatcher — no dispatcher changes needed

## Work Done
- BlackFire/BlackFire Portal/portal.js — `normalizeQuote`: added `calloutRef` field
- BlackFire/BlackFire Portal/portal.js — `renderCallouts`: QUOTE button now branches on linked-quote existence

## Blockers / Next Steps
- Deploy portal.js to live server
- Verify with a callout that has a linked quote (e.g. CO-200426-0001) that clicking QUOTE shows the quote modal correctly

## Learnings
- Quote → callout linkage lives in `bf_quotes.callout_ref` (DB) / `q.callout_ref` (API raw) — the normalizer must expose it for JS logic to use it
- `previewQuote` renders a full-fidelity quote modal (logo, line items, totals) — suitable as the "view sent quote" experience without additional work
_Session ended: 2026-06-02 08:47:30 (Claude Code / claude-sonnet-4-6)_
