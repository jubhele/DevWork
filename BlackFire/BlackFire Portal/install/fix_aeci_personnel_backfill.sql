-- ============================================================
-- Fix: AECI Personnel Backfill — Kitso, Thabo, Maria
-- BlackFire Portal
-- Created: 2026-05-31
--
-- Resolves the 15 UNRESOLVED rows from migration_personnel_user_fk.sql.
--
-- Root cause:
--   - Kitso Marupi:    portal user kitso.marupi exists but the original
--                      test data INSERT never set portal_user_id, so the
--                      email/name backfill passes in the migration missed them.
--   - Thabo Mokoena:   no portal user existed. Supervisor / Section 16.2
--                      appointee → mapped to role='manager'.
--   - Maria Coetzee:   no portal user existed. First Aider / PSIRA D →
--                      mapped to role='junior_tech'.
--
-- Role mapping used (bf_safety_personnel.role → bf_users.role):
--   SHE Rep     → safety_officer  (Kitso — already exists)
--   Supervisor  → manager         (Thabo — created here)
--   First Aider → junior_tech     (Maria — created here)
--
-- Run AFTER migration_personnel_user_fk.sql.
-- Safe to re-run (INSERT IGNORE + WHERE user_id IS NULL guards).
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Create portal users for Thabo and Maria ────────────────
-- Password: BlackFire@2026! (same as Astute test users)
INSERT IGNORE INTO `bf_users`
  (username, password_hash, name, email, role, title, active, created_at)
VALUES
  ('t.mokoena',
   '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
   'Thabo Mokoena',
   't.mokoena@astuteinsights.co.za',
   'manager',
   'Operations Supervisor',
   1, NOW()),

  ('m.coetzee',
   '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
   'Maria Coetzee',
   'm.coetzee@astuteinsights.co.za',
   'junior_tech',
   'First Aider',
   1, NOW());

-- ── 2. Backfill user_id for Kitso Marupi ──────────────────────
-- Portal user kitso.marupi exists; just needs the link set.
UPDATE `bf_safety_personnel` sp
 INNER JOIN `bf_users` u ON u.username = 'kitso.marupi'
   SET sp.`user_id`        = u.id,
       sp.`portal_user_id` = u.id
 WHERE sp.`full_name` = 'Kitso Marupi'
   AND sp.`user_id` IS NULL;

-- ── 3. Backfill user_id for Thabo Mokoena ─────────────────────
UPDATE `bf_safety_personnel` sp
 INNER JOIN `bf_users` u ON u.username = 't.mokoena'
   SET sp.`user_id`        = u.id,
       sp.`portal_user_id` = u.id
 WHERE sp.`full_name` = 'Thabo Mokoena'
   AND sp.`user_id` IS NULL;

-- ── 4. Backfill user_id for Maria Coetzee ─────────────────────
UPDATE `bf_safety_personnel` sp
 INNER JOIN `bf_users` u ON u.username = 'm.coetzee'
   SET sp.`user_id`        = u.id,
       sp.`portal_user_id` = u.id
 WHERE sp.`full_name` = 'Maria Coetzee'
   AND sp.`user_id` IS NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- ── 5. Verify — should show 0 unresolved rows ─────────────────
SELECT
    sp.id, sp.file_ref, sp.full_name, sp.user_id,
    u.username, u.role AS portal_role,
    CASE WHEN sp.user_id IS NULL THEN 'STILL UNRESOLVED' ELSE 'OK' END AS status
FROM `bf_safety_personnel` sp
LEFT JOIN `bf_users` u ON u.id = sp.user_id
ORDER BY sp.full_name, sp.file_ref;
