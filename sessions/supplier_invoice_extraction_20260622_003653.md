# Session: Supplier Invoice Extraction - Siyasiza & Megahertz
Date: 2026-06-22
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Extract invoice data from two supplier PDF folders (Siyasiza Group and Megahertz Systems) located in Google Drive. For each invoice/estimate, capture supplier name, invoice number, date, total amount (ZAR), description of work, PO reference, and payment status. Produce a clean table and save to C:\DevWork\temp\supplier_invoices.csv.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Siyasiza invoices are all billed to AECI Chempark (not directly to Astute Insights) - included as they are in the Astute/BlackFire admin folder indicating they flow through Astute to AECI
- Excluded: Statement files (Statement 1.pdf, Statement 1-1.pdf, Statement 1-3.pdf, Statement 2.xlsx, etc.), Payment_Notification, SQ_TA15384231, K8 document, CHEMPARK FENCE (non-invoice format)
- Multiple revised versions of same invoice noted in CSV with version guidance on which to use as final
- MEGAHERTZ quote-41932.pdf is a Boomgate Systems quote TO Megahertz (not Astute) - included with flag
- Siyasiza invoices have no PO references (CPxxxx) visible on any document; VAT field is blank (prices stated as VAT-inclusive per some invoices)
- A1031.pdf is a duplicate of A1030 repair version (same content, different file name)
- A1025 and A1025 2.pdf are identical duplicates
- A1019-1.pdf contains invoice A1017 (filename mismatch)
- A1041.pdf contains invoice A1042 (filename mismatch)

## Work Done
- Read all Megahertz PDFs (19 files): 3 tax invoices (1308, 1310, 1313) + 6 estimates (311, 313, 318 x2, 320 x2, 331) + 1 Boomgate pass-through quote + multiple duplicate copies
- Read all Siyasiza PDFs (approx 30 files): invoices A1016-A1042 with various revisions
- C:\DevWork\temp\supplier_invoices.csv created with 35 rows covering all unique documents

## Blockers / Next Steps
- No CPxxxx PO references found on any Siyasiza invoices - may be managed separately
- A1036, A1038 not found in folder (gap in sequence) - may not have been uploaded
- Siyasiza A1030 has two conflicting versions (initial R1150 callout vs full repair R2920) - confirm which amount was approved for payment
- A1040 has 4 versions (R7288.90 / R7500 / R11200 / R13150) for different scopes - needs clarification on which version was approved
- Payment status for most Siyasiza invoices is unknown (no payment confirmation visible)
- Megahertz Invoice 1313 appears partially paid (R2234 of R8888)

## Learnings
- Siyasiza uses a simple handwritten-style invoice template with no formal VAT registration number shown; prices appear VAT-inclusive per footer note on A1025
- Megahertz uses Wave accounting software; all three tax invoices show partial payments recorded in Wave
- Invoice number mismatches between filename and document content occur (A1019-1 = A1017; A1041 = A1042)
- A1030 and A1031 filenames both contain the A1030 invoice in different versions (initial assessment vs full repair)
- Revision pattern for Siyasiza: earlier versions have lower travel cost (R250); revised versions increase travel to R450
_Session ended: 2026-06-22 00:43:11 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-22 01:15:20 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-22 01:28:44 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-22 02:11:45 (Claude Code / claude-sonnet-4-6)_
