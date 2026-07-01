# SYNC-P0-02-Mhloli — Column-Level Drizzle vs Live bf_* Diff

**Date:** 2026-06-30
**Source of truth:** live MySQL `blackfm6w9f9_portal` (information_schema)
**Drizzle file:** `BlackFire/apps/web/src/db/schema.ts` (579 lines)
**Raw column dump:** `temp/bf_columns.tsv`
**Raw diff:** `temp/schema_diff_report.txt`
**Diff script:** `temp/diff_schema.py`

## Headline

The v2 plan claimed Drizzle was "ALREADY COMPLETE" with all 47 `bf_*` tables modelled. **That is wrong.** Live DB has 39 non-backup `bf_*` tables; Drizzle has 31. **8 tables are missing entirely** and **20 columns exist only in Drizzle** (will throw at first SELECT). Plus 116 column-level type/width mismatches and ~25 substantive nullable mismatches.

> Phase 5 of the plan ("schema is done, only wiring needed") must be re-scoped — schema work is required first.

## Severity totals

| Severity | Count | Meaning |
|---|---|---|
| CRITICAL | 20 | Drizzle defines a column the live DB does not have → query will fail at runtime. |
| HIGH | 116 | Column type or width mismatch, or column missing from Drizzle (data will silently fail to map). |
| MEDIUM | 47 | Nullable mismatch (mostly noise — see false-positive note below). |
| LOW | 0 | — |

### Parser caveat (false positives)

- Every `id` column shows `[MEDIUM] nullable live=False drizzle=True` — false positive. Drizzle's `.primaryKey().autoincrement()` implies NOT NULL; my parser only detected `.notNull()`. Ignore all `id: nullable` rows (~25 of the 47 MEDIUM count). True nullable diffs are ~22.
- `bf_users.role` shows `drizzle=enum()` (empty) — false positive. Drizzle uses external `userRole` const array which my regex couldn't follow; actual values match the live enum exactly (13 values including `inspector`). No action.

## CRITICAL — tables missing from Drizzle (8)

These exist in live but have **zero** Drizzle definition. apps/web cannot read or write them.

1. `bf_error_log`
2. `bf_password_resets`
3. `bf_safety_file_users`
4. `bf_service_categories`
5. `bf_services`
6. `bf_sessions`
7. `bf_settings`
8. `bf_supplier_invoices`

**Impact:** Phase 4e (Services catalog), Phase 4f (forgot-password), Phase 4b (supplier invoices), and Phase 5 (admin settings, error log surfacing) all depend on schema that does not exist in Drizzle yet.

## CRITICAL — columns in Drizzle but NOT in live (20)

Each of these is a runtime ticking bomb — a `SELECT col FROM table` will throw `Unknown column`.

| Table | Phantom column in Drizzle |
|---|---|
| bf_attachments | `uploaded_by` (live has only `uploaded_by_id`) |
| bf_callouts | `is_active` |
| bf_clients | `updated_at` |
| bf_digital_signatures | `signature_data` (live calls it `signature_image`) |
| bf_external_upload_tokens | `created_by_id` (live has `created_by` string) |
| bf_mobile_rate_limits | `updated_at` |
| bf_safety_compliance | `created_by`, `updated_by` |
| bf_safety_files | `appointee162`, `contractor_rep`, `created_by`, `updated_by` (live uses `*_id` FK columns) |
| bf_safety_items | `appointee` (live: `appointee_id`) |
| bf_safety_personnel | `created_by`, `email`, `full_name`, `id_number`, `name`, `removed_by`, `role` |

**Root cause pattern:** Drizzle was hand-authored from old PHP schema before live DB migrated string columns → FK ID columns. Safety files / personnel are the worst — they need a full rewrite, not a patch.

## HIGH — Drizzle missing live columns (workflow-relevant)

The approval/token workflow is completely unrepresented in Drizzle for callouts, quotes, and digital signatures:

**bf_callouts** (8 missing): `approval_token`, `approval_token_expires`, `approved_at`, `approved_by`, `closure_confirmed`, `closure_confirmed_by`, `closure_notes`, `invoice_generated`

**bf_quotes** (5 missing): `approval_token`, `approval_token_expires`, `approved_at`, `approved_by`, `submitted_by`

**bf_invoices** (1 missing): `sent_at`

**bf_digital_signatures** (18 missing — biggest gap): `certificate_issuer`, `certificate_serial`, `certificate_subject`, `declined_at`, `declined_reason`, `document_hash`, `document_label`, `sent_at`, `signature_image`, `signature_method`, `signed_document_ref`, `signer_company`, `signer_ip`, `signer_role`, `status`, `token`, `token_expires_at`, `updated_at`

**bf_external_upload_tokens** (2): `allowed_mime_types`, `created_by`

**bf_quote_items** (1): `line_total`

**bf_safety_files** (5): `appointee162_id`, `band`, `contractor_rep_id`, `created_by_id`, `updated_by_id`

**bf_safety_items** (1): `appointee_id`

**bf_safety_personnel** (3): `created_by_id`, `removed_by_id`, `updated_by_id`

> **Phase 3** (token-gated flows) is blocked by `bf_digital_signatures` divergence. Drizzle needs full re-derivation from live DDL, not patching.

## HIGH — type / width mismatches (recurring patterns)

### Enum case (whole-DB pattern)
Live MySQL stores enums lowercase, Drizzle uses TitleCase. MySQL enum comparison is case-insensitive for storage but values returned to Node will not match string-literal TS unions.

Affected: `bf_external_upload_tokens.status`, `bf_policy_acks.status`, `bf_portal_enquiries.status`, `bf_remittances.status`, `bf_safety_compliance.category` & `scope`, `bf_safety_files.status`, `bf_safety_items.ap_status` & `result`, `bf_safety_personnel.role`, `bf_tasks.priority` & `status`.

**Recommendation:** standardise on lowercase across all three platforms (PHP, apps/web, umlilo). Cheaper to change Drizzle + JSON contracts than alter the DB.

### Enum vs varchar
Live uses native enum, Drizzle declares varchar:
`bf_callouts.{approval_status, priority, status}`, `bf_invoices.status`, `bf_quotes.{approval_status, status}`, `bf_statements.status`.

### Width mismatches
Live=150/50/20, Drizzle=255/100/30 on `client_name`, `assigned_to`, `ref_id`, `job_no`, `invoice_no`, `quote_no` across callouts/quotes/invoices/statements. Drizzle wider — INSERTs from apps/web will fit live, but SELECTed strings may be unexpectedly truncated by middleware assuming 255.

### Type mismatches
- `bf_callouts.callout_time`: live=`time`, Drizzle=`varchar(10)` — TS would receive string anyway, but inserts of non-time strings will fail.
- `bf_safety_files.{manpower, supervisors, she_reps, first_aiders}`: live=`tinyint`, Drizzle=`int`. Drizzle inserts >255 will fail in DB.
- `bf_safety_items.item_no`: live=`tinyint`, Drizzle=`int`.
- `bf_users.dashboard_layout`: live=`longtext`, Drizzle=`json`. Acceptable runtime — JSON.parse will work — but should be `mediumtext` for honesty.
- `bf_digital_signatures.signer_email`: live=`varchar(255)`, Drizzle=`varchar(150)`.
- `bf_attachments.entity_ref`: live=`varchar(30)`, Drizzle=`varchar(50)`.
- `bf_payments.notes`: live=`varchar(255)`, Drizzle=`text`.
- `bf_statements.to_emails`: live=`text`, Drizzle=`varchar(500)`.

### timestamp vs datetime (whole-DB pattern)
Drizzle uses `timestamp().defaultNow()` for `created_at`/`updated_at` on many tables where live uses `datetime`. Functionally fine for read; insertions may need a literal `NOW()` instead of relying on `CURRENT_TIMESTAMP`.

Affected: `bf_attachments`, `bf_callouts`, `bf_clients`, `bf_invoices`, `bf_payments`, `bf_quotes`, `bf_statements`, `bf_transactions` (created_at and/or updated_at).

## MEDIUM — true nullable mismatches (post-FP filter)

- `bf_callouts.callout_date` live=NOT NULL, Drizzle=nullable
- `bf_callouts.job_no` live=nullable, Drizzle=NOT NULL  ⚠ INSERT from apps/web requires `job_no`; PHP doesn't always set it
- `bf_clients.address` live=NOT NULL, Drizzle=nullable
- `bf_counters.counter_type` live=NOT NULL (PK), Drizzle=nullable (no `.notNull()` shown — needs investigation)
- `bf_digital_signatures.signed_at` live=nullable, Drizzle=NOT NULL  ⚠ INSERT must include signed_at
- `bf_invoices.callout_ref`, `due_date`, `invoice_date`, `quote_ref` — Drizzle nullable, live NOT NULL
- `bf_invoices.invoice_no` Drizzle NOT NULL, live nullable  ⚠ INSERT must include
- `bf_payments.notes`, `payment_date` — Drizzle nullable, live NOT NULL
- `bf_quotes.approval_status` Drizzle NOT NULL, live nullable
- `bf_quotes.callout_ref`, `quote_date` — Drizzle nullable, live NOT NULL
- `bf_quotes.quote_no` Drizzle NOT NULL, live nullable  ⚠ INSERT must include
- `bf_statements.scheduled_for` Drizzle nullable, live NOT NULL
- `bf_task_sequences.category` Drizzle nullable, live NOT NULL (PK)

The four ⚠ rows are the highest insertion-failure risk: apps/web INSERTs will throw if those columns are missing, even though PHP allows nulls.

## What this means for the plan

| Plan claim (v2) | Reality |
|---|---|
| "Drizzle schema is ALREADY COMPLETE — 47 bf_ tables modelled" | 31 tables modelled, 8 missing entirely, 20 phantom columns. |
| "Phase 5 is REDUCED — only UI + data layer wiring needed" | Phase 5 must add: schema-rebuild for ~10 tables, regen for 8 missing tables, enum-case unification, type/width corrections. Will likely match Phase 1's effort. |
| "Phase 3 schemas exist: bfExternalUploadTokens, bfDigitalSignatures, bfPolicyAcks" | They exist but `bf_digital_signatures` is missing 18 columns including the entire token workflow. Cannot proceed with Phase 3 until rebuilt. |

## Recommended next actions (for SYNC-P0-05/06 gate)

1. **Block** Phase 5's "schema is done" assumption — update plan to add **SYNC-P0-07-Umakhi**: regenerate `schema.ts` from live DB via `drizzle-kit introspect:mysql` (or hand-rebuild). Backup current file. Verify all 39 non-backup tables present, no phantom columns.
2. **Block** Phase 3 — add prerequisite: Phase 0 schema regen must complete first. The current `bfDigitalSignatures` cannot serve `/sign/[token]`.
3. **Add task SYNC-P0-08-Umakhi**: enum-case unification (lowercase wins) — coordinate with umlilo TS types and PHP constants.
4. **Add task SYNC-P0-09-Mhloli**: confirm which platforms write nulls for the four ⚠ insertion-risk columns; decide whether to make Drizzle match live or make live match Drizzle.

## JSON Envelope

```json
{
  "task_id": "SYNC-P0-02-Mhloli",
  "agent": "Mhloli",
  "supervisor": "Mlawuli",
  "cost_clearance": { "by": "Sibali", "tier": "2-Medium", "model": "Claude Opus 4.7", "trust": 10 },
  "status": "COMPLETED",
  "iterations": 1,
  "hard_cap": 5,
  "inputs": {
    "live_db": "blackfm6w9f9_portal",
    "drizzle_schema": "BlackFire/apps/web/src/db/schema.ts"
  },
  "artifacts": [
    "docs/sync/phase0-task02-column-diff.md",
    "temp/bf_columns.tsv",
    "temp/schema_diff_report.txt",
    "temp/diff_schema.py"
  ],
  "findings": {
    "live_tables": 39,
    "drizzle_tables": 31,
    "missing_tables_in_drizzle": 8,
    "phantom_columns_in_drizzle": 20,
    "type_mismatches_high": 116,
    "true_nullable_mismatches": 22,
    "plan_v2_invalidated": ["Phase 3 prerequisite", "Phase 5 scope"]
  },
  "handoff": ["SYNC-P0-05-Mbhali", "SYNC-P0-06-Umlindi"],
  "recommended_new_tasks": ["SYNC-P0-07-Umakhi (schema regen)", "SYNC-P0-08-Umakhi (enum-case unify)", "SYNC-P0-09-Mhloli (null-write audit)"]
}
```
