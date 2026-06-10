# Session: qa_remediation_fixes
Date: 2026-06-09
Provider: Gemini Code Assist
Model: Gemini 1.5 Pro

## Goal
Implement fixes for the critical issues identified in the QA report, starting with adding the missing `inspector` role permissions to the database.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Gemini 1.5 Pro  Trust score: 8/10
Active model: Gemini 1.5 Pro  Status: correct

## Decisions
- Added the `inspector` role to the RBAC migration script with read-only permissions for callouts, quotes, invoices, and safety files. This addresses the login failure where the user existed but lacked access to the dashboard.

## Work Done
- Modified `c:\DevWork\BlackFire\BlackFire Portal\install\rbac_full_migration.sql` to include the `inspector` role.
- Updated the capability matrix documentation in `rbac_full_migration.sql` to include the `inspector` column.
- Verified documentation matrix alignment for the new inspector permissions.
- Prepared the PowerShell automation script to apply the RBAC migration to the local MySQL instance.
- Provided the execution script for local database synchronization.
- Created a timestamped backup of the RBAC file before modification.

## Blockers / Next Steps
- Apply the updated RBAC migration to the local MySQL database.
- Obtain the source code for `apps/web/src/app/(portal)/quotes/page.tsx` and `apps/web/src/app/(portal)/invoices/page.tsx` to implement null-safety for currency formatting.
- Rerun the QA suite to verify the login and page stability.

## Learnings
- Identifying missing role definitions in the authoritative RBAC seeding script is a prerequisite for resolving authentication/authorization failures in the automated test suite.