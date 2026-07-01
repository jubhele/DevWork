# SYNC-P0-03-Mhloli — portal.contract.json Verification (Re-check post P0-02)

**Date:** 2026-06-30
**Source of truth:** live MySQL `blackfm6w9f9_portal` enum columns (`information_schema.COLUMNS`, captured in `temp/bf_columns.tsv`) + PHP API source (`BlackFire Portal/api/*.php`)
**Contract under test:** `BlackFire/contracts/portal.contract.json` (generated_at 2026-06-30T20:45:00+02:00)

## Why this re-check happened

`docs/sync/phase0-foundation.md` marked SYNC-P0-03 `PASS_AFTER_REMEDIATION` earlier today. That remediation pass compared the contract against **table-name presence**, not live enum values. SYNC-P0-02-Mhloli's deeper column-level diff (done immediately after) proved the same shallow-comparison method had missed 8 entire tables and 116 column mismatches in Drizzle. This task re-verifies the contract the same way — enum-by-enum against live `information_schema` — rather than trusting the earlier pass.

## Verdict

**Status: FAIL (STALE) — same conclusion as the original P0-03 finding, contradicting today's "RESOLVED" remediation note.**

Role enum is genuinely fixed. Five other enums are still wrong, including one (QuoteStatus) that is missing two live values outright and uses a value (`Accepted`) that does not exist in the DB.

## Enum-by-enum results

| Contract enum | Contract values | Live DB enum (authoritative) | Result |
|---|---|---|---|
| `Role` | 13 values incl. finance/inspector | `bf_users.role`: 13 values, same set | ✅ MATCH |
| `CalloutPriority` | Normal/Urgent/Emergency | `bf_callouts.priority`: Normal/Urgent/Emergency | ✅ MATCH |
| `CalloutStatus` | Open/In Progress/Completed/Invoiced/Cancelled | `bf_callouts.status`: same | ✅ MATCH |
| — (no enum) | `Callout` interface has no `approval_status` field | `bf_callouts.approval_status`: not_required/pending/approved/rejected | ❌ MISSING — contract doesn't model approval workflow at all (also confirmed missing in Drizzle per P0-02) |
| `QuoteStatus` | Draft/Sent/**Accepted**/Rejected/Expired (5) | `bf_quotes.status`: Draft/Sent/**Approved**/Rejected/**Pending Approval**/Expired/**Converted** (7) | ❌ FAIL — `Accepted` is not a real value (live uses `Approved`); `Pending Approval` and `Converted` are missing entirely |
| — (no enum) | `Quote` interface has no `approval_status` field | `bf_quotes.approval_status`: pending/approved/rejected | ❌ MISSING |
| `InvoiceStatus` | Unpaid/Draft/Sent/Paid/Overdue/Cancelled | `bf_invoices.status`: Draft/Sent/Paid/Overdue/Cancelled (no `Unpaid`) | ❌ FAIL — `Unpaid` does not exist as a stored enum value anywhere in PHP API or DB; only appears in legacy `portal.js` frontend display logic. Contract should not expose it as an API-returned status. |
| `SafetyFileStatus` | Draft/In Progress/Submitted/Approved/**Rejected** | `bf_safety_files.status`: Draft/In Progress/Submitted/Approved (4 — no Rejected) | ❌ FAIL — same finding as original P0-03 audit; NOT actually resolved despite remediation note |
| `SafetyItemStatus` | To Standard/**Pass**/**Fail**/Not to Standard/N/A/**Pending** | `bf_safety_items.result`: N/A/Not to Standard/To Standard (3); `ap_status`: Open/In Progress/Resolved (separate column, not modeled) | ❌ FAIL — contract conflates two different live columns into one enum and invents 3 values (`Pass`, `Fail`, `Pending`) that exist in neither |
| `TaskCategory` | admin/sales/general | `bf_tasks.category`: admin/sales/general (the `finance`/`operations` migration file exists but is **not applied** to live DB) | ✅ MATCH (correctly reflects live, not the unapplied migration) |
| `TaskStatus` | Open/In Progress/Done/Cancelled | `bf_tasks.status`: same | ✅ MATCH |
| `TaskPriority` | Low/Normal/High/Urgent | `bf_tasks.priority`: same | ✅ MATCH |
| `ComplianceLevel` | RED/ORANGE/YELLOW/GREEN | `bf_safety_files.band`: same | ✅ MATCH |
| `TransactionType` | credit/debit | not independently re-verified this pass (low risk, unchanged since original audit) | — |

## Additional staleness: missing interfaces

The contract has no interface for `bf_digital_signatures`, despite P0-02 finding this is the most structurally broken table in the schema (18 columns missing from Drizzle, full token/approval workflow unrepresented). If umlilo or apps/web build the `/sign/[token]` flow against this contract, there is nothing to generate types from. Not a regression from today, but worth flagging as a gap alongside the enum failures.

## Root cause

Today's earlier P0-03 remediation pass fixed only the `Role` enum (the one explicitly called out in the original phase0-foundation.md finding) and stopped there, marking the whole task "PASS_AFTER_REMEDIATION." It did not re-derive the other five enums from `information_schema` — it appears to have trusted the contract's existing shape for everything except `Role`.

## Recommendation

Reopen `SYNC-P0-05-Mbhali` synthesis and `SYNC-P0-06-Umlindi` governance verdict — both currently say `COMPLIANT`/`GO` based on the false "PASS_AFTER_REMEDIATION." That verdict is not supportable; QuoteStatus and InvoiceStatus errors mean apps/web or umlilo code generated from this contract today would misclassify real DB rows (an `Approved` quote would not match any of the contract's `QuoteStatus` members, and `Pending Approval`/`Converted` quotes would not type-check).

Concrete fixes needed in `BlackFire/contracts/portal.contract.json`:
1. `QuoteStatus`: replace `Accepted` with `Approved`; add `Pending Approval`, `Converted`.
2. `InvoiceStatus`: remove `Unpaid` (not a real stored value) — or keep it only if explicitly documented as a computed/display-only value, not an API-returned one.
3. `SafetyFileStatus`: remove `Rejected` (not a live enum value).
4. `SafetyItemStatus`: split into two enums matching the two live columns — `bf_safety_items.result` (N/A/Not to Standard/To Standard) and `bf_safety_items.ap_status` (Open/In Progress/Resolved) — and add the missing `ap_status` field to the `SafetyItem` interface.
5. Add `approval_status` (+ related token/approval fields already flagged in P0-02) to the `Callout` and `Quote` interfaces.
6. Regenerate `BlackFire/packages/types/index.ts` and `umlilo-portal/packages/types/index.ts` via `scripts/sync-umlilo-contracts.ps1` after the JSON fix, then re-run type diagnostics.

## JSON Envelope

```json
{
  "task_id": "SYNC-P0-03-Mhloli",
  "agent": "Mhloli",
  "supervisor": "Mlawuli",
  "cost_clearance": { "by": "Sibali", "tier": "2-Medium", "model": "Claude Sonnet 4.6", "trust": 9 },
  "status": "COMPLETED",
  "iterations": 1,
  "hard_cap": 5,
  "inputs": {
    "contract": "BlackFire/contracts/portal.contract.json",
    "live_enum_source": "temp/bf_columns.tsv (information_schema.COLUMNS, blackfm6w9f9_portal)",
    "api_source": "BlackFire/BlackFire Portal/api/*.php"
  },
  "artifacts": ["docs/sync/phase0-task03-contract-verify.md"],
  "result": "FAIL_STALE_CONTRACT",
  "findings": {
    "enums_checked": 9,
    "enums_match": 5,
    "enums_fail": 4,
    "missing_interface_fields": ["Callout.approval_status", "Quote.approval_status", "SafetyItem.ap_status"],
    "missing_interfaces": ["DigitalSignature"],
    "contradicts_prior_status": "phase0-foundation.md SYNC-P0-03 PASS_AFTER_REMEDIATION is not supportable"
  },
  "handoff": ["SYNC-P0-05-Mbhali (reopen synthesis)", "SYNC-P0-06-Umlindi (reopen governance verdict)"],
  "recommended_fix_owner": "Umakhi (contract + types regen)"
}
```
