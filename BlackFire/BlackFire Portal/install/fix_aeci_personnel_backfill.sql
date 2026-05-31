-- ============================================================
-- Fix: AECI Personnel Backfill — real portal users only
-- BlackFire Portal
-- Created: 2026-05-31
--
-- Source of truth: G:\My Drive\JS\Astute Insights\BlackFire\
--                  Admin Finance\AECI\Safety File\NewFiles\
--
-- Real people confirmed from signed appointment letters (29/05/2026):
--   Jubhele Shange  → j.shange       (already in portal — CEO / 16.1)
--   Zanele Myeza    → z.myeza        (Safety Officer, Risk Assessor,
--                                     Incident Investigator, Fall Protection
--                                     Plan Developer)
--   Penny Nzimande  → penny.nzimande (already in portal — SHE Rep)
--
-- Historical test data (Kitso Marupi, Thabo Mokoena, Maria Coetzee) were
-- placeholder records. Kitso exists as portal user kitso.marupi and is
-- backfilled below. Thabo and Maria have no real-world portal equivalents —
-- their bf_safety_personnel rows remain as user_id=NULL legacy test records.
--
-- ALSO REMOVES: t.mokoena and m.coetzee portal accounts that were
-- incorrectly created by a previous version of this script.
--
-- Run AFTER migration_personnel_user_fk.sql.
-- Safe to re-run (INSERT IGNORE + WHERE guards throughout).
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Remove incorrectly created fictional portal users ──────
--    (created by previous version of this script — not real people)
DELETE FROM `bf_users` WHERE `username` IN ('t.mokoena', 'm.coetzee');

-- ── 2. Create Zanele Myeza as a portal user ───────────────────
--    Source: signed appointment letters dated 29/05/2026
--    Password: BlackFire@2026! — must be changed on first login
INSERT IGNORE INTO `bf_users`
  (username, password_hash, name, email, role, title, active, created_at)
VALUES
  ('z.myeza',
   '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
   'Zanele Myeza',
   'z.myeza@astuteinsights.co.za',
   'safety_officer',
   'Safety Officer & Risk Assessor',
   1, '2026-05-29 08:00:00');

-- ── 3. Backfill user_id for Kitso Marupi ──────────────────────
--    Portal user kitso.marupi exists — link his historical records.
UPDATE `bf_safety_personnel` sp
 INNER JOIN `bf_users` u ON u.username = 'kitso.marupi'
   SET sp.`user_id`        = u.id,
       sp.`portal_user_id` = u.id
 WHERE sp.`full_name` = 'Kitso Marupi'
   AND sp.`user_id` IS NULL;

-- ── 4. Thabo Mokoena and Maria Coetzee ────────────────────────
--    No real portal users exist for these names. They are historical
--    test data placeholder records. Their user_id stays NULL and they
--    are retained as legacy audit records only.
--    To clean them up, run: DELETE FROM bf_safety_personnel WHERE full_name IN
--    ('Thabo Mokoena', 'Maria Coetzee') AND user_id IS NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- ── 5. Verify ─────────────────────────────────────────────────
SELECT
    sp.id, sp.file_ref, sp.full_name, sp.user_id,
    u.username, u.role AS portal_role,
    CASE WHEN sp.user_id IS NULL THEN 'LEGACY / NO PORTAL USER' ELSE 'OK' END AS status
FROM `bf_safety_personnel` sp
LEFT JOIN `bf_users` u ON u.id = sp.user_id
ORDER BY status, sp.full_name, sp.file_ref;
