# Session: Portal Document Numbering — External Ref Fields & Company Profile
Date: 2026-06-03
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Add user-editable display/document number fields (`quote_no`, `invoice_no`, `job_no`) to all workflow documents in the BlackFire Portal. Each document keeps its immutable system-generated `ref_id` for internal linking, but gains a second editable field that defaults to the same value and can be overridden to match external numbering (e.g. `AI20042026` from a physical quote document). Also fix the missing quote/callout/invoice linkage for PO CP1590 (panic button job, 20 Apr 2026). Also wire up correct company (Astute Insights) and client (AECI / Chemhold Investments) details for document generation.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Trigger
- Real document: `Quote_AI20042026.xlsx` — Quote No. shown as `AI20042026`
- Real document: `Order CP1590 (AECI Property Services / Chemhold Investments Pty Ltd).pdf` — dated 27/03/2026
- Portal had no quote record for callout CO-200426-0001; invoice INV-AI20042026 had empty quote_ref
- Portal's internal quote numbering (Q-DDMMYY-NNNN) doesn't match Astute Insights format (AIDDMMYYYY)
- User wants this pattern applied to all workflow documents: quotes, invoices, call logs
- Company details (phone, email, VAT, address) on generated documents were wrong (showed BlackFire, should show Astute Insights)
- AECI client record had incorrect phone, email, address, missing VAT and legal entity name

## Decisions
- Add `quote_no VARCHAR(50)`, `invoice_no VARCHAR(50)`, `job_no VARCHAR(50)` columns to respective tables
- Backfill: default = ref_id value for all existing records; user can override at any time
- System ref_id is immutable; doc number is the user-facing editable identifier
- Quote for CO-200426-0001: ref_id=Q-200426-0001, quote_no=AI20042026, amount R3,500 ex-VAT (×1.15 = R4,025 invoice)
- Quote items: panic button supply (Texecom FP-W) R2,800 + install R700 = R3,500
- Portal branding stays BlackFire; legal details on issued documents use Astute Insights Pty Ltd
- Company phone: 073 693 8446 only (061 161 1616 removed per user instruction)
- config.php values now read from env vars via cfg_env() with hardcoded fallbacks (user enhancement)
- AECI legal entity: Chemhold Investments Pty Ltd; trading/site name "AECI Chempark" kept for record consistency
- Added `legal_name` column to bf_clients to hold registered entity name separately from trading name

## Work Done

### Schema / Migrations
- `install/migration_doc_numbers.sql` — adds quote_no, invoice_no, job_no; backfills; inserts missing quote Q-200426-0001 (quote_no=AI20042026); links INV-AI20042026 to that quote
- `install/migration_client_legal_name.sql` — adds legal_name to bf_clients; updates AECI Chempark with Chemhold Investments details, correct phone/email/VAT/address from PO

### Seed Data
- `install/blackfire_real_finance_data.sql` — new section 3b adds quote + line items for CO-200426-0001; INV-AI20042026 quote_ref fixed to Q-200426-0001

### API
- `api/quotes.php` — POST inserts quote_no (defaults to ref_id); PUT allows quote_no edit; GET search includes quote_no
- `api/invoices.php` — same pattern with invoice_no
- `api/callouts.php` — same pattern with job_no

### Config
- `config/config.php` — company details updated to Astute Insights Pty Ltd; all business config values now read via cfg_env() helper (user added); added company_tagline, company_logo keys; phone = 073 693 8446

### Portal PHP
- `portal.php` — added nq-quote-no, ni-invoice-no, nc-job-no form fields (full-width, with hint text); injected `const COMPANY = {...}` from PHP config before portal.js; meta tags, OG, JSON-LD now dynamic from config (user enhancement); added $companyLogoUrl computed from config

### Portal JS
- `portal.js` — normalizeQuote/Invoice/Callout: added quoteNo/invoiceNo/jobNo fields; renderQuotes/Invoices/Callouts: display doc number (show system ref below in grey if different); previewQuote + previewInvoice: contact block and footer now read from COMPANY constant; invoice linked-quote dropdown shows quoteNo; saveQuote/Invoice/Callout: pass doc number to API

## Blockers / Next Steps
- Run `migration_doc_numbers.sql` on live DB
- Run `migration_client_legal_name.sql` on live DB
- Run order for fresh install: all migrations → blackfire_aeci_seed.sql → testdata → blackfire_real_finance_data.sql
- Future: bf_host_companies table (Phase 1 per config comment) to allow multi-entity company profiles without config file edits

## Learnings
- External document numbering (Astute Insights AI-format) is fundamentally different from the portal's internal Q-DDMMYY-NNNN scheme — these are two parallel identifiers and must be stored separately; conflating them breaks the paper trail
- PO date (27/03/2026) precedes the callout date (20/04/2026) — this is the correct workflow: PO issued → work done → invoice issued; seed data callout date was correct, PO date on the PO doc was just context
- Company profile details should flow from config (or DB) → PHP → JS constant → document previews; hardcoding in JS is fragile and creates config/display drift
- cfg_env() pattern (getenv → $_ENV → $_SERVER → define() → fallback) is the right approach for shared-host PHP where putenv() may be disabled
- legal_name vs name on bf_clients is an important distinction for SA compliance: the entity on a tax invoice must match CIPC registration, which may differ from the site/trading name used throughout the portal
_Session ended: 2026-06-03 07:17:42 (Claude Code / claude-sonnet-4-6)_
