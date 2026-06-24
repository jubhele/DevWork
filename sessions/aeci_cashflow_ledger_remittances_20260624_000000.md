# Session: AECI Cash Flow Ledger & Payment Remittance Reconciliation
Date: 2026-06-24
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Build a comprehensive Excel P&L ledger for BlackFire / Astute Insights covering all AECI (Chemhold Investments Pty Ltd) transactions — money in and out — by combining sales invoices, supplier costs (Siyasiza Group and Megahertz Systems), payment remittance PDFs from Google Drive, and the authoritative FNB *8644 bank statement CSV. Also add a stock/service catalogue sheet as the foundation for a future quote system.

## Goal Status
PENDING

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7   Trust score: 10/10
Active model: Sonnet 4.6      Status: under-powered for this tier but performed adequately

## Decisions
- **Bank CSV as ground truth for income**: The FNB *8644 export (`transactions_2026-06-24.csv`, 3547 rows, 18 Chemhold entries) is the authoritative payment record. Old filtered CSV (`AECI PO/transactions_2026-06-24.csv`, 15 rows) was incomplete — missing May and June 2026 payments.
- **R12,750 × 7 retainer records excluded**: These 7 portal invoice records (INV-090626-01xx) were created via a bulk statement import and have no corresponding bank entries or remittance PDFs. Confirmed fabricated/reconstruction records — excluded from the ledger.
- **Remittances sourced from two places**: Google Drive folder `1LhxPrGfJsdWYyI3a-Qkj4kuwiPzHcZBc` (21 PDFs uploaded by Sibulelo) and Afrihost IMAP (`accounts@astuteinsights.co.za`, `jubhele@astuteinsights.co.za`). Google Drive was the complete source.
- **Jan/Feb 2026 gap flagged as unreconciled**: Three remittances (Ctrl 120884, 120978, 121317) total R32,735.97 — AECI issued them but money never arrived in FNB *8644 even in the full bank export. Requires official FNB statements and follow-up with Yolanda Herbst at AECI.
- **Mar 27 bank entry (R33,752.50) has no remittance PDF**: CP1447 tree-damage fence repairs is bank-confirmed but remittance PDF not yet uploaded to the Drive folder.
- **P&L uses bank-confirmed amounts only**: The 3 unreconciled Jan/Feb remittances are excluded from the Monthly P&L income figures to avoid overstating revenue.
- **Stock catalogue derived from actual invoices**: All 33 items priced from real Siyasiza/Megahertz costs and actual AECI billing history.

## Work Done
- `c:\DevWork\temp\build_bf_cashflow.py` — v1 script (revenue only, 48 hard-coded invoice rows)
- `c:\DevWork\temp\build_bf_cashflow_v2.py` — v2 script added Siyasiza/Megahertz costs, fixed bank entries
- `c:\DevWork\temp\build_bf_cashflow_v3.py` — v3 final script with full remittance data, corrected bank confirmation flags
- `C:\DevWork\temp\BF_AECI_Full_PL_Ledger_20260624.xlsx` — **Final output**, 7 sheets:
  1. **Remittances (All)** — 21 remittances, Control No + Cheque/Payment No on every row; flags for 4 items needing action
  2. **Bank Statement (8644)** — 18 raw bank entries matched to remittances; R32,735.97 gap flagged
  3. **Sales Invoices** — 49 invoices with remittance cross-reference columns
  4. **Costs – Siyasiza** — 22 supplier charges Dec 2024–Feb 2026
  5. **Costs – Megahertz** — 3 equipment invoices Feb–Mar 2026
  6. **Monthly P&L** — bank-confirmed income vs supplier costs vs gross margin by month
  7. **Stock Catalogue** — 33 items (8 categories) with SKU, cost, sell price excl/incl VAT, markup %, supplier
- `c:\DevWork\temp\fetch_remittances.py` — IMAP scanner for Afrihost email accounts
- `c:\DevWork\temp\fetch_remittance_bodies.py` — IMAP full-body fetcher for payment emails
- `c:\DevWork\temp\fetch_remittance_attachments.py` — IMAP attachment downloader
- `c:\DevWork\temp\remittance_attachments\` — PDF attachments downloaded from email
- Cron job 4d36009e — recurring Tuesday 8 AM reminder for R32,735.97 gap follow-up

## Key Financial Summary
| Metric | Amount |
|--------|--------|
| Bank confirmed receipts (FNB *8644, 18 entries) | R600,991.39 |
| Total remittances issued by AECI (21) | R633,727.36 |
| Unreconciled gap (Jan/Feb 2026, 3 remittances) | **R32,735.97** ⚠ |
| Siyasiza supplier costs | R149,608.90 |
| Megahertz supplier costs | R38,742.00 |
| Gross margin (bank cash basis) | R412,640.49 |

## Blockers / Next Steps
- **R32,735.97 gap**: Request official FNB bank statement for Jan–Feb 2026 from FNB, and contact Yolanda Herbst (yolanda.herbst@aeciworld.com, +27 11 457-1700) to confirm which bank account the 3 EFTs were sent to. Controls: 120884, 120978, 121317.
- **Mar 27 remittance PDF missing**: CP1447 (R33,752.50, tree damage fence) — upload the remittance to the Google Drive folder `1LhxPrGfJsdWYyI3a-Qkj4kuwiPzHcZBc`.
- **Stock catalogue pricing**: Labour rates are estimated. Confirm actual cost-per-hour with Siyasiza for accurate margin calculation.
- **Quote system integration**: Stock Catalogue sheet (SKU + sell price incl VAT) is ready to import into a quote tool. Next step: decide on quote system platform (portal build vs existing tool).
- **R12,750×7 portal records**: Consider running a SQL DELETE against `bf_invoices` and `bf_callouts` for the 7 fabricated retainer records (INV-090626-01xx) to clean the portal data.

## Agent Accountability
| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| BF-LEDGER-001 | Umakhi (Code) | Claude Code (Mlawuli) | COMPLETED | 3 | v1→v2→v3 builds |
| BF-REMITTANCE-001 | Mhloli (Research) | Claude Code (Mlawuli) | COMPLETED | 2 | IMAP + Drive scan |
| BF-STOCK-001 | Umakhi (Code) | Claude Code (Mlawuli) | COMPLETED | 1 | 33-item catalogue |

## Learnings
- The older filtered AECI CSV (`AECI PO/transactions_2026-06-24.csv`) only had 15 rows — Chemhold payments up to April 2026. The complete bank export (`transactions_2026-06-24.csv` in the root Astute Insights folder) has 3547 rows across all accounts and shows 18 Chemhold entries including May and June 2026. Always use the full export.
- AECI remittance PDFs are sent by Yolanda Herbst (Cash Book Controller) via email with the remittance PDF attached, usually same day as the EFT. The bank credit typically lands the same day (not next day as initially assumed).
- Afrihost IMAP (`mail.astuteinsights.co.za:993`) works with SSL. Search results return UIDs. The `accounts@` and `jubhele@` mailboxes both receive remittances. Credentials are in `C:\DevWork\.env` under `AI_EMAIL_BILLING_*` and `AI_EMAIL_USER1_*`.
- The R12,750×7 retainer records were created by a June 2026 statement batch import into the portal — not real invoices sent to AECI. Portal workflow is callout-first; statement import bypasses this.
- openpyxl sheet names cannot contain `*` — use `(8644)` not `*8644`.
- Python 3.14 on Windows raises `UnicodeEncodeError` for box-drawing characters (`─`) in f-strings printed to a cp1252 terminal. Use `sys.stdout.reconfigure(encoding='utf-8')` or avoid the characters in print statements.

```json
{
  "session_id": "20260624_000000",
  "agent": "Umakhi",
  "model_endpoint": "claude-sonnet-4-6",
  "token_metrics": {
    "tokens_in": 0,
    "tokens_out": 0,
    "iteration_count": 3
  },
  "outcome": {
    "status": "SUCCESS",
    "cost_category": "TIER_3_HIGH"
  },
  "optimization": {
    "action_taken": "Summarised context — session resumed from prior conversation summary"
  }
}
```

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-06-24 21:52:28 (Claude Code / claude-sonnet-4-6)_
