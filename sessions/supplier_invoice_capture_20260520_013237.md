# Session: Supplier Invoice Capture + Missing Callouts
Date: 2026-05-20
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Analyse the Lelo Upload folder structure (AECI PO, BFS, Megahertz, Siyasiza) to understand
what data is missing from master_aeci_full.sql. Capture missing callouts, a draft invoice,
supplier invoice schema, and seed data for Megahertz and Siyasiza.

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7   Trust score: 10/10
Active model: Sonnet 4.6      Status: under-powered for tier 3, but adequate for structured SQL work

## Folder Structure Discovered
```
G:\My Drive\JS\Astute Insights\BlackFire\Admin Finance\Lelo Upload\
├── AECI PO\        41 PDFs  — AECI purchase orders TO Astute/BlackFire
├── BFS\            68 files — Our (BlackFire/Astute) quotes + statements TO AECI
│   ├── 14 Account Statement*.xlsx
│   ├── 54 Quote_AI*.xlsx
│   └── 2  Tax Invoice*.xlsx
├── Megahertz\      20 files — Supplier invoices FROM Megahertz Systems (Farai's company)
│   ├── Invoice_1308, 1310, 1313 (PDFs, fully read)
│   ├── Estimate_311, 313, 318, 320, 331 (PDFs)
│   └── MEGAHERTZ quote-41932.pdf (Boomgate Systems quote TO Megahertz)
└── Siyasiza\       59 files — Supplier invoices FROM Siyasiza Group
    ├── A1016–A1041 (PDFs)
    ├── Astute INVAI001–AI004 (earlier series PDFs)
    └── Statement_2[1].xlsx (Sep 2025 statement, fully read)
```

## Key Findings

### Missing AECI Callouts
| PO     | Date       | Service                        | Amount        | Status     |
|--------|------------|--------------------------------|---------------|------------|
| CP1185 | 2025-07-01 | Biometric + Boomgate repairs   | R5,250 quoted | Never invoiced ⚠ |
| CP1593 | 2026-03-31 | Security fence repairs Mar 10  | R9,430 excl VAT | Draft invoice added |

- CP1185 references quote AI250529 (`Quote_AI20250529.xlsx` exists in BFS folder)
- CP1593 references quote AI20260316 (`Quote_AI16032026.xlsx` exists in BFS folder)

### Megahertz Supplier Invoices (all from Feb-Mar 2026)
| Inv  | Date       | Description                         | Total     | Paid      | Balance   |
|------|------------|-------------------------------------|-----------|-----------|-----------|
| 1308 | 2026-02-27 | 2× Call Out & Fault Finding         | R1,700    | R450 cash | R1,250    |
| 1310 | 2026-03-04 | ProFaceXP + cameras + cable + labour| R26,657   | R26,657   | R0 PAID   |
| 1313 | 2026-03-11 | Fence materials + labour + HT cable | R8,888    | R2,234    | R6,654    |

### Siyasiza Supplier Invoices (Aug-Sep 2025, from statement)
A1026-A1028 paid via batch INV27&8 (R2,550 on 2025-08-29).
A1029-A1033 outstanding as at Sep 2025.
Earlier invoices AI001-A1025 and A1034+ not yet captured — need to read individual PDFs.

### Statement Data Confirmed
- Feb 2025 statement (AI20250203-002): shows Nov 2024–Jan 2025 invoices ✓
- Jun 2025 statement (AI20250617): shows through CP1112/CP1126 ✓
- Apr 2026 statement (AI20260330): confirms R192,855.31 outstanding, CP1593 NOT present ✓

### BFS Quotes Not Yet Captured
54 quote files exist in BFS folder. Currently only 1 benchmark quote in bf_quotes.
These represent the quote step of each callout→quote→invoice chain.
Deferred: requires reading each xlsx and extracting line items — separate task.

## Decisions
- Created new `bf_supplier_invoices` table rather than adding debit rows to `bf_transactions`
  (structured AP tracking is more useful than raw ledger entries)
- Added CO-2025-0018 with status Completed (no invoice) — flagged as potential uncollected revenue
- Added CO-2026-0022 with status Invoiced + Draft invoice INV-AI20260316 (R10,844.50 inc VAT)
- Siyasiza callout_refs left blank where job-to-callout mapping is ambiguous
- Megahertz MGHZ-1310 linked to CO-2026-0016 (ProFaceXP, main material match)
- Did NOT update master_aeci_full.sql — migration file is the patch for existing DBs

## Work Done
- `BlackFire/BlackFire Portal/install/migrate_v5_suppliers.sql` — created
  - bf_supplier_invoices table (new)
  - sinv counter
  - supplier.invoice.* role permissions
  - CO-2025-0018 (CP1185) and CO-2026-0022 (CP1593) callouts
  - INV-AI20260316 draft invoice
  - MGHZ-1308, MGHZ-1310, MGHZ-1313 Megahertz invoices
  - SYS-A1026 through SYS-A1033 Siyasiza invoices

## Blockers / Next Steps
1. ⚠ CO-2025-0018 (CP1185): R5,250 potentially uncollected — decide: invoice AECI or write off
2. INV-AI20260316 (CP1593): status Draft — raise and send to AECI (R10,844.50 owed)
3. Megahertz MGHZ-1308 (R1,250) and MGHZ-1313 (R6,654): outstanding supplier balances to pay
4. Siyasiza A1029-A1033: R9,920 in outstanding payables — settle
5. Siyasiza earlier invoices (AI001-A1025, A1034+): read PDFs and capture
6. BFS Quotes (54 files): read and add to bf_quotes with line items — deferred separate task
7. master_aeci_full.sql: needs updating to bake in v5 schema for fresh installs

## Learnings
- Megahertz Systems = Farai Mujere's subcontractor company (same contact email megahertzglobal@icloud.com)
- Siyasiza holds a separate "Astute/AECI Service & Maintenance" contract — invoices go to Astute, not BlackFire directly
- AECI PO text contains the quote ref (QT No.) and excl-VAT amount — reliable for deriving invoice amounts
- Statement files are cumulative running-balance documents — reading latest + earliest is usually sufficient
- Some Siyasiza items were "AWAITING PO" (large items: ZKTeco R18,976, UPS R4,599, Cameras R138,000) — these have no PO yet, not captured
- CP1185 gap: job done Jul 1, 2025 but completely absent from all account statements through Apr 2026
_Session ended: 2026-05-20 01:51:12 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 01:57:13 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 02:00:19 (Claude Code / claude-sonnet-4-6)_
