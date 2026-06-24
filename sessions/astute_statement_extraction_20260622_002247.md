# Session: Astute Insights — Statement Extraction & Consolidation
Date: 2026-06-22
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Read all 14 Excel account statement files from G:\My Drive\JS\Astute Insights\BlackFire\Admin Finance\Lelo Upload\BFS and extract a complete, deduplicated list of all invoice and payment transactions. Produce consolidated invoice list, payment list, and monthly revenue summary.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Used Excel COM automation in PowerShell 5.1 to read xlsx files without any third-party libraries
- Dedup key for invoices: Date+Reference+PO+DebitAmount (same invoice appears in multiple cumulative statements)
- Dedup key for payments: Date+PO+CreditAmount (Payment Received rows lack unique invoice ref)
- Date format in these files is yyyy/MM/dd — used ParseExact to avoid culture issues

## Work Done
- Extracted 270 raw rows from 14 statement files
- Deduplicated to 43 unique invoice rows and 26 unique payment rows
- Saved raw data to C:\DevWork\temp\astute_raw_rows.csv
- Saved deduped invoices to C:\DevWork\temp\astute_invoices.csv
- Saved deduped payments to C:\DevWork\temp\astute_payments.csv

## Key Findings
- Total invoiced (unique): R 633,571.76
- Total received (unique): R 348,706.46
- Outstanding / unpaid: R 284,865.30 (by debit/credit delta)
- Unpaid by PO match: R 307,492.30 (18 invoices with no payment row)

## Data Quality Issues Found
1. AI20250106 ref used for TWO different invoices (CP0934 electrical fence + CP0975 access control)
2. INV-AI20250718 ref used for TWO different invoices (CP1205 camera repairs 2025-05 + CP0974 energiser 2025-10)
3. AI20250106 also appears with PO "Emergecy Call" (typo) in early statement — likely pre-formal-PO entry
4. AI20250203 appears with PO "Emergecy Call" — same issue
5. NV-AI20250909 and NV-AI20251001 appear to have typos (missing leading I)

## Blockers / Next Steps
- INV-AI20250326 (CP1028 Energizer, R22,627) shows no payment — but CP1029 payment received — confirm if CP1028/CP1029 are same job
- INV-AI20251031 (CP1301 R33,919) outstanding — confirm with Chemhold
- All 2026 invoices from March onward are outstanding

## Learnings
- Statement files are cumulative — earlier invoices repeat in later statements; dedup is essential
- Payment rows use "Payment Received" as reference in older statements; newer ones reference the inv ref directly
- PO numbers are the most reliable join key between invoices and payments (more consistent than reference)
- Two reference number collisions found (AI20250106 and INV-AI20250718) — flag to Astute for reference system fix
_Session ended: 2026-06-22 00:33:16 (Claude Code / claude-sonnet-4-6)_
