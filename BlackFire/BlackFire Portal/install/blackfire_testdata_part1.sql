-- ============================================================
-- BlackFire / Astute Insights — Safety Digitisation Test Data
-- Test Data PART 1: Users + Multi-role Assignments
-- Safety files SAF-150125-0001 and SAF-120625-0001 removed —
-- only SAF-120326-0001 (current focus file) is in scope.
-- Seeded user password: BlackFire@2026!
-- Run AFTER all migrations AND blackfire_aeci_seed.sql
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. USERS ─────────────────────────────────────────────────
-- Confirmed portal users only.
-- j.shange and penny.nzimande seeded here as INSERT IGNORE safety
-- net in case the main portal seed has not been run.
-- Seeded password: BlackFire@2026!
INSERT IGNORE INTO bf_users
  (username,password_hash,name,email,role,title,active,created_at)
VALUES
('j.shange',
 '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
 'Jubhele Shange','j.shange@astuteinsights.co.za',
 'admin','CEO / Director',1,'2025-01-01 08:00:00'),
('penny.nzimande',
 '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
 'Penny Nzimande','penny.nzimande@astuteinsights.co.za',
 'safety_officer','SHE Representative',1,'2025-01-01 08:00:00'),
-- Zanele Myeza — Safety & Compliance Officer (appointed 29/05/2026)
-- OHS appointments: Safety Officer, Incident Investigator, Risk Assessor, Fall Protection Plan Developer
-- Multi-role: safety_officer + manager (see bf_user_roles block below)
('z.myeza',
 '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
 'Zanele Myeza','z.myeza@astuteinsights.co.za',
 'safety_officer','Safety & Compliance Officer',1,'2026-05-29 08:00:00'),
-- Sibulelo Mtolo — Admin & Site Safety Inspector (confirmed portal user)
-- OHS appointments: Construction Supervisor, Emergency Co-ordinator,
--   Hand Tools / Ladder / Portable Electric Inspector
-- Multi-role: admin + safety_officer (see bf_user_roles block below)
('sibu',
 '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
 'Sibulelo Mtolo','sibu@astuteinsights.co.za',
 'admin','Admin & Site Safety Inspector',1,'2026-05-29 08:00:00');

-- ── 1b. MULTI-ROLE ASSIGNMENTS ────────────────────────────────
-- Run migration_user_roles.sql first to create bf_user_roles table.
-- Single-role users are backfilled by that migration automatically.
-- Entries below add ADDITIONAL roles beyond the primary bf_users.role.

-- Zanele Myeza: primary safety_officer + management oversight
INSERT IGNORE INTO bf_user_roles (user_id, role)
SELECT id, 'safety_officer' FROM bf_users WHERE username = 'z.myeza'
UNION ALL
SELECT id, 'manager'        FROM bf_users WHERE username = 'z.myeza';

-- Sibulelo Mtolo (sibu): primary admin + site safety inspection roles
INSERT IGNORE INTO bf_user_roles (user_id, role)
SELECT id, 'admin'          FROM bf_users WHERE username = 'sibu'
UNION ALL
SELECT id, 'safety_officer' FROM bf_users WHERE username = 'sibu';

-- ── 1c. ENSURE TEST PASSWORDS ARE ALWAYS CORRECT ────────────────
-- INSERT IGNORE above skips rows that already exist (e.g. sibu seeded
-- by an earlier migration with a different hash). This UPDATE always
-- resets passwords to the shared dev test value so re-runs are safe.
-- Hash = bcrypt(BlackFire@2026!, cost=12)
UPDATE bf_users
SET password_hash = '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe'
WHERE username IN ('j.shange','penny.nzimande','z.myeza','sibu');

SET FOREIGN_KEY_CHECKS = 1;
-- End Part 1
