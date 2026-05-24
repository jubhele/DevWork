# Session: Safety Officer Role — Safety-Only User Access
Date: 2026-05-24
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Create a new `safety_officer` role and user(s) that have access ONLY to the Safety File module in the Umlilo Portal. This requires adding the role to the frontend PERMS map, gating safety API endpoints with explicit safety.* permissions, updating the RBAC migration file, and providing SQL to create user(s).

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6   Trust score: 9/10
Active model: claude-sonnet-4-6   Status: correct

## Decisions
- Added explicit safety.* permissions (safety.view, safety.create, safety.update, safety.delete, safety.approve) rather than leaving safety as perm:null (open to all). Reason: safety_policy.php already used safety.create, and explicit gating is more secure.
- safety_officer role gets: safety.view + safety.create + safety.update (no delete/approve — those stay admin/manager only).
- Changed safety.php DELETE from security.users → safety.delete; approve sub-action from security.users → safety.approve.
- Changed safety nav perm from null → 'safety.view' so only roles with that permission see it in nav.
- Added safety_officer to firstPage map → p-safety (landing page after login).
- Added safety.view to junior_tech, senior_tech, call_logger, client_support, viewer to preserve existing access (those roles could previously see safety since perm was null).

## Work Done
- portal.js — added safety_officer to ROLE_LABELS/ROLE_COLORS/firstPage, added safety.* to PERMS map, changed safety nav perm: null → perm: 'safety.view'
- api/safety.php — added safety.view gate on all requests, safety.create on POST, safety.update on PUT, safety.delete on DELETE, safety.approve on approve sub-action
- api/safety_compliance.php — added safety.view gate
- api/safety_personnel.php — added safety.view gate
- api/safety_doc_gen.php — added safety.view gate
- install/rbac_full_migration.sql — added safety_officer role block and safety.* permissions to all roles
- install/safety_officer_migration.sql — new additive migration (safe to run on live server, adds permissions + sample user INSERT)

## Blockers / Next Steps
- Run install/safety_officer_migration.sql on the live database to activate the new permissions.
- Create actual user(s) by adapting the sample INSERT in safety_officer_migration.sql with real names/passwords.
- If using phpMyAdmin: run the migration SQL, then use the portal's Users page (as admin) to create the user with role 'safety_officer'.

## Learnings
- The frontend PERMS map and the backend bf_role_permissions table must be kept in sync — if you add a permission to one, you must add it to both.
- safety_policy.php DELETE already used require_perm('safety.create') before this change — a sign the permission schema was partially conceived but never fully implemented.
- The nav's perm:null pattern means "visible to all authenticated users" — changing it to a real permission is a one-line nav change but requires seeding all existing roles with that permission to avoid breaking them.
