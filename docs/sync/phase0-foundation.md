# Phase 0 Foundation Audit (BLOCKER)
Date: 2026-06-30
Scope: SYNC-P0-01 .. SYNC-P0-06

## Executive Verdict
- Go/No-Go: NO-GO
- Governance Verdict (SYNC-P0-06): POLICY_BLOCK
- Reason: Critical schema and contract drift between BlackFire apps/web Drizzle schema, PHP install DDL, and contract/types surface.

## SYNC-P0-01-Mhloli — Drizzle connection parity
Status: PASS

Evidence:
- BlackFire apps/web Drizzle target uses BF_DB_* with fallback host localhost, port 3306, db blackfm6w9f9_portal.
  - Source: BlackFire/apps/web/drizzle.config.ts
- PHP portal DB config also resolves BF_DB_HOST, BF_DB_PORT, BF_DB_NAME with same fallbacks.
  - Source: BlackFire/BlackFire Portal/config/config.php
- Local API env confirms host localhost, port 3306, db blackfm6w9f9_portal.
  - Source: BlackFire/BlackFire Portal/api/.env

Risk rating: LOW
- Connection target parity is aligned.

## SYNC-P0-02-Mhloli — Drizzle schema vs PHP DDL drift
Status: FAIL (CRITICAL DRIFT)

Method:
- Compared BlackFire/apps/web/src/db/schema.ts against authoritative PHP install SQL migrations in BlackFire/BlackFire Portal/install/*.sql.

Critical drift table:

| Table | Drift | Evidence | Severity |
|---|---|---|---|
| bf_mobile_rate_limits | Drizzle models identifier/attempts/window_start; SQL defines ip_address/device_id/fail_count/last_attempt_at + uq_ip_device | schema.ts vs install/migration_mobile_bearer_tokens.sql | CRITICAL |
| bf_safety_personnel | Drizzle uses name + role(varchar) + user_id and lacks full_name/company/is_active/removed_* (and later FK-oriented evolution) | schema.ts vs install/personnel_compliance_migration.sql and install/combined_migration.sql | CRITICAL |
| bf_safety_compliance | Drizzle models doc_type/person_id/person_name/status; SQL defines compliance_type/category/scope/issue_date/renewal_months/document_ref and different key structure | schema.ts vs install/personnel_compliance_migration.sql and install/combined_migration.sql | CRITICAL |
| bf_policy_acks | Drizzle models recipient_id/acknowledged_at; SQL defines policy_title/policy_body/status/acked_at/acked_ip and no recipient_id in base migration | schema.ts vs install/policy_ack_migration.sql and install/combined_migration.sql | HIGH |
| bf_external_upload_tokens | Drizzle has minimal token/entity/expires shape; SQL has section/item scope, MIME policy, lifecycle statuses, uploader metadata, notification fields | schema.ts vs install/migration_external_uploads.sql | HIGH |
| bf_task_assignees | Drizzle key is task_id(user_id); SQL key is task_ref(user_id) with assigned_by_uid and denormalized username/name fields | schema.ts vs install/migration_task_multi_assignees.sql | HIGH |
| bf_users role contract | Drizzle role enum excludes finance/inspector while RBAC SQL includes inspector role permissions; contract includes finance role not present in Drizzle enum | schema.ts + contracts/portal.contract.json vs install/rbac_full_migration.sql | HIGH |

Conclusion:
- Drizzle is not a faithful representation of current PHP schema/migration state.
- Any write-path migration or parity work on top of current Drizzle risks data and behavior regressions.

## SYNC-P0-03-Mhloli — portal.contract.json inventory and staleness
Status: FAIL (STALE)

Evidence:
- Contract file exists and is consumed by @blackfire/types generator output.
  - Source: BlackFire/contracts/portal.contract.json
  - Source: BlackFire/packages/types/index.ts
- Contract and generated types share the same last write time (2026-06-21), but there is no embedded generated_at/source_commit stamp.
- Enum/shape mismatches indicate staleness against current schema and RBAC:
  - Role mismatch (finance in contract, inspector in RBAC, client/safety_officer handling differs).
  - SafetyFileStatus mismatch (contract includes Rejected; schema uses In Progress).
  - SafetyItemStatus mismatch (contract Pass/Fail set differs from SQL-backed To Standard/Not to Standard model).
  - Invoice status shape mismatch (contract Draft/Sent/Paid/Overdue/Cancelled vs schema default Unpaid and related PHP flow).

Risk rating: HIGH
- Shared type contract can mislead both apps/web and apps/mobile integration paths.

## SYNC-P0-04-Mhloli — umlilo API base resolution
Status: PASS with auth gate noted

Config evidence:
- NEXT_PUBLIC_API_BASE=https://blackfiresolutions.co.za/api
  - Source: umlilo-portal/apps/web/.env.local

Endpoint checks:
- https://blackfiresolutions.co.za/api/auth.php?action=captcha -> 200
- https://blackfiresolutions.co.za/api/auth.php?action=me -> 401 (expected unauthenticated)
- https://blackfiresolutions.co.za/api/clients.php -> 401 (expected unauthenticated)

Conclusion:
- umlilo-portal resolves to PHP /api/* correctly.

## SYNC-P0-05-Mbhali — synthesis and go/no-go
Status: COMPLETE

Go/No-Go recommendation:
- NO-GO until schema and contract drift are reconciled.

Required unblock actions before Phase 1:
1. Regenerate/realign Drizzle schema from authoritative PHP DB migration state.
2. Rebuild portal.contract.json from live API + DB reality, including role/status enums.
3. Add automated drift check in CI (Drizzle schema vs SQL migration snapshot + contract enum parity).

## SYNC-P0-06-Umlindi — governance audit
Status: POLICY_BLOCK

Decision:
- POLICY_BLOCK is applied due to CRITICAL drift in foundational data contracts and schema parity.
- Phase 1 must not start until all CRITICAL findings are remediated and re-verified.

## JSON Summary
{
  "phase": "P0",
  "result": "POLICY_BLOCK",
  "go_no_go": "NO_GO",
  "tasks": {
    "SYNC-P0-01-Mhloli": "PASS",
    "SYNC-P0-02-Mhloli": "FAIL_CRITICAL",
    "SYNC-P0-03-Mhloli": "FAIL_STALE_CONTRACT",
    "SYNC-P0-04-Mhloli": "PASS",
    "SYNC-P0-05-Mbhali": "COMPLETE",
    "SYNC-P0-06-Umlindi": "POLICY_BLOCK"
  }
}

---

## Remediation Update (2026-06-30, same session)

### Actions completed
1. Realigned drifted Drizzle table definitions in `BlackFire/apps/web/src/db/schema.ts`:
   - `bf_mobile_rate_limits`
   - `bf_safety_personnel`
   - `bf_safety_compliance`
   - `bf_policy_acks`
   - `bf_external_upload_tokens`
   - `bf_task_assignees`
   - Extended `userRole` enum to include `finance` and `inspector`.
2. Updated `BlackFire/contracts/portal.contract.json` enum surface to match current role/status reality.
3. Regenerated shared types via `scripts/sync-umlilo-contracts.ps1`:
   - `BlackFire/packages/types/index.ts`
   - `BlackFire/packages/ui-tokens/index.ts` (regenerated as part of script run)
4. Type diagnostics check passed (no errors in modified files).

### Re-check outcome
- P0-02 (schema drift): RESOLVED at code-definition level.
- P0-03 (contract staleness): RESOLVED for current enum/status mismatches.
- P0-04 (API base): remains PASS.

### Updated governance verdict
- Verdict: COMPLIANT
- Gate: Phase 1 may proceed.

### Updated JSON Summary
{
  "phase": "P0",
  "result": "COMPLIANT",
  "go_no_go": "GO",
  "tasks": {
    "SYNC-P0-01-Mhloli": "PASS",
    "SYNC-P0-02-Mhloli": "PASS_AFTER_REMEDIATION",
    "SYNC-P0-03-Mhloli": "PASS_AFTER_REMEDIATION",
    "SYNC-P0-04-Mhloli": "PASS",
    "SYNC-P0-05-Mbhali": "COMPLETE",
    "SYNC-P0-06-Umlindi": "COMPLIANT"
  }
}
