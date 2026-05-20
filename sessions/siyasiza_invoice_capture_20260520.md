# Session: Siyasiza Earlier Invoice Capture
Date: 2026-05-20
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Read all unread Siyasiza PDFs (AI001–A1025 and A1034+) and capture them into a new
migrate_v6_siyasiza.sql patch. A1026–A1033 are already in migrate_v5_suppliers.sql.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Files to Process
Earlier series: Astute INVAI001, AI002, AI004, A1003, A1008, A1011, A1016, A1019–A1021, A1024–A1025
Later series: A1034, A1035, A1037, A1039, A1040, A1040A, A1041
Missing from folder (no PDF present): A1017, A1018, A1022, A1023, A1036, A1038

## Decisions
- Supplier entity split: AI001 = Nqobanathi Holdings, A1002–A1004 = NkosinathiMajola (Pty) Ltd, A1008+ = Siyasiza Group. All kept under the same contract tracking.
- Duplicate invoice numbers (Siyasiza's admin error): A1039 issued twice (assessment + full repair), A1040 issued twice (fence job + NVR job). Used suffix a/b in ref_id: SYS-A1039a, SYS-A1039b, SYS-A1040a, SYS-A1040b.
- A1040 NVR work: 3 conflicting PDF versions (R7,500 / R11,200 / R13,150). Used A1040-2 (R11,200) as canonical — most specific breakdown. Flagged for Siyasiza verification.
- R6,138.90 accessories line appears in both A1039b and A1040a — flagged as potential double-billing. Do NOT pay both until verified.
- AI001–A1025 all marked 'paid': none appear as outstanding on Sep 2025 statement.
- A1034+ all marked 'outstanding': no payment evidence in hand.
- File naming unreliable: "A1019-1.pdf" contains A1017; "A1041.pdf" contains A1042.

## Work Done
- `BlackFire/BlackFire Portal/install/migrate_v6_siyasiza.sql` — CREATED
  - 20 new bf_supplier_invoices records
  - NkosinathiMajola/Nqobanathi era: AI001, A1002, A1003, A1004
  - Siyasiza early: A1008, A1011, A1016, A1017, A1020, A1021, A1024, A1025
  - Siyasiza later: A1034, A1035, A1037, A1039a, A1039b, A1040a, A1040b, A1042
  - sinv counter updated to 31

## Blockers / Next Steps
- ⚠ SYS-A1039b vs SYS-A1040a: R6,138.90 accessories appear in both — confirm with Siyasiza which (if not both) is payable
- ⚠ SYS-A1040b NVR amount: confirm R7,500 or R11,200 or R13,150 with Siyasiza before paying
- ⚠ SYS-A1039a: confirm whether the R1,150 assessment is payable in addition to the R20,388.90 repair, or was superseded
- Outstanding payables to clear: R47,027.80 across A1034, A1035, A1037, A1039a/b, A1040a/b, A1042 (subject to verification)
- Missing invoice PDFs to request from Siyasiza: A1005–A1007, A1009–A1010, A1012–A1015, A1018–A1019, A1022–A1023, A1036, A1038, A1041
- master_aeci_full.sql v6 bake-in still pending (v5 also not yet baked in)

## Learnings
- Siyasiza recycles invoice numbers — never assume a new PDF with an existing number is a duplicate; it may be a separate job billed under the same ref by mistake.
- Siyasiza file naming is unreliable — always read the invoice content, not the filename.
- The supplier entity changed from NkosinathiMajola/Nqobanathi Holdings to Siyasiza Group between Jan 2025 (A1004) and Mar 2025 (A1008). Same technician (Nathi Majola), different legal entity. Keep them separate in the DB for AP accuracy.
- A1021 noted "Awaiting 8 Port PoE Switch" — follow up to confirm the switch was eventually supplied (may be a separate outstanding materials invoice).
_Session ended: 2026-05-20 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 02:16:04 (Claude Code / claude-sonnet-4-6)_
