# Session: Portal Document Numbering — External Ref Fields
Date: 2026-06-03
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Add user-editable display/document number fields (`quote_no`, `invoice_no`, `job_no`) to all workflow documents in the BlackFire Portal. Each document keeps its immutable system-generated `ref_id` for internal linking, but gains a second editable field that defaults to the same value and can be overridden to match external numbering (e.g. `AI20042026` from a physical quote document). Also fix the missing quote/callout/invoice linkage for PO CP1590 (panic button job, 20 Apr 2026).

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Trigger
- Real document: `Quote_AI20042026.xlsx` — Quote No. shown as `AI20042026`
- Real document: `Order CP1590 (AECI Property Services).pdf`
- Portal had no quote record for callout CO-200426-0001; invoice INV-AI20042026 had empty quote_ref
- Portal's internal quote numbering (Q-DDMMYY-NNNN) doesn't match Astute Insights format (AIDDMMYYYY)
- User wants this pattern applied to all workflow documents: quotes, invoices, call logs

## Decisions
- Add `quote_no VARCHAR(50)`, `invoice_no VARCHAR(50)`, `job_no VARCHAR(50)` columns to respective tables
- Backfill: default = ref_id value for all existing records
- User can override via portal UI or API; system ref_id never changes
- Quote for CO-200426-0001: ref_id=Q-200426-0001, quote_no=AI20042026, amount R3,500 ex-VAT
- Quote items: panic button supply R2,800 + install R700 = R3,500

## Work Done
- _backups/ — backups of quotes.php, invoices.php, callouts.php, portal.php, portal.js, blackfire_real_finance_data.sql
- install/migration_doc_numbers.sql — new migration
- install/blackfire_real_finance_data.sql — add missing quote, fix invoice quote_ref
- api/quotes.php — quote_no in POST/PUT/GET search
- api/invoices.php — invoice_no in POST/PUT/GET search
- api/callouts.php — job_no in POST/PUT/GET search
- portal.php — nq-quote-no, ni-invoice-no, nc-job-no form fields
- portal.js — normalizeQuote/Invoice/Callout + render + save

## Blockers / Next Steps
- Run migration_doc_numbers.sql on the live DB before next session
- The run order: migration_doc_numbers.sql → then re-run blackfire_real_finance_data.sql to seed the new quote

## Learnings
- TBD
_Session ended: 2026-06-03 06:24:23 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 06:33:43 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-03 06:35:37 (Claude Code / claude-sonnet-4-6)_
