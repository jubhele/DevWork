# Session: Portal — Client Legal Name + AECI Chempark PO Details
Date: 2026-06-03
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Add a `legal_name` column to `bf_clients` to store the registered legal entity name separately from the trading/site name. Update AECI Chempark record with verified details from Purchase Order CP1590 (Chemhold Investments Pty Ltd, PO issued by AECI Property Services / Chemhold).

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: Sonnet 4.6  Status: over-powered

## Decisions
- `legal_name` stored as a separate column (not replacing `name`) — portal uses trading name everywhere; legal name appears on invoices and formal documents only
- Source of truth: Order CP1590 — Chemhold Investments Pty Ltd, VAT 4200104349, 200 Bergrivier Drive, Chloorkop Ext. 24, Kempton Park 1619
- Contact email confirmed: quotes.modderfontein@aeciworld.com
- Migration is idempotent (`ADD COLUMN IF NOT EXISTS`, `UPDATE ... LIMIT 1`)

## Work Done
- `install/migration_client_legal_name.sql` — adds `legal_name` column to `bf_clients`; updates AECI Chempark row with PO CP1590 details

## Blockers / Next Steps
- Run migration on live server
- Surface `legal_name` on invoice PDF / quote PDF header if required
- Confirm whether other clients need `legal_name` populated

## Learnings
- AECI's legal contracting entity is Chemhold Investments Pty Ltd, not "AECI Chempark" — this distinction matters for VAT-compliant tax invoices; the `legal_name` column makes this explicit without breaking existing UI references to the trading name
_Session ended: 2026-06-03 07:20:22 (Claude Code / claude-sonnet-4-6)_
