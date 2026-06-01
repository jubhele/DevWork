-- ============================================================
-- Fix: SAF-120326-0001 — Replace seed/test personnel with
--      real people from signed appointment letters (29/05/2026)
--
-- Source documents:
--   G:\My Drive\JS\Astute Insights\BlackFire\Admin Finance\
--   AECI\Safety File\NewFiles\
--
-- Real people and roles:
--   Jubhele Shange  (j.shange)        16.1 CEO appointment letter
--   Zanele Myeza    (z.myeza)         Safety Officer, Risk Assessor,
--                                     Incident Investigator, Fall
--                                     Protection Plan Developer
--   Sibulelo Mtolo  (sibu)            Construction Supervisor, Emergency
--                                     Co-ordinator, Hand Tools / Ladder /
--                                     Portable Electric Inspector
--   Penny Nzimande  (penny.nzimande)  SHE Rep
--
-- Previous occupants were seed/test data only:
--   Kitso Marupi, Thabo Mokoena, Maria Coetzee,
--   James Mthembu, Refilwe Khumalo
--
-- Safe to re-run (DELETE + INSERT replaces idempotently).
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

SET @jshange_id = (SELECT id FROM bf_users WHERE username = 'j.shange'       LIMIT 1);
SET @zmyeza_id  = (SELECT id FROM bf_users WHERE username = 'z.myeza'        LIMIT 1);
SET @sibu_id    = (SELECT id FROM bf_users WHERE username = 'sibu'           LIMIT 1);
SET @penny_id   = (SELECT id FROM bf_users WHERE username = 'penny.nzimande' LIMIT 1);

-- Verify all users exist before proceeding
SELECT
    CONCAT('j.shange       = ', IFNULL(@jshange_id, 'NOT FOUND')) AS jshange_check,
    CONCAT('z.myeza        = ', IFNULL(@zmyeza_id,  'NOT FOUND')) AS zmyeza_check,
    CONCAT('sibu           = ', IFNULL(@sibu_id,    'NOT FOUND')) AS sibu_check,
    CONCAT('penny.nzimande = ', IFNULL(@penny_id,   'NOT FOUND')) AS penny_check;

-- ── 1. Remove all current personnel for SAF-120326-0001 ───────────
--    All existing rows are seed/test data — no real-world records lost.
DELETE FROM bf_safety_personnel WHERE file_ref = 'SAF-120326-0001';

-- ── 2. Insert real appointment-letter personnel ────────────────────
INSERT INTO bf_safety_personnel
  (file_ref, user_id, full_name, role, company, is_active, created_by_id, created_at)
VALUES
  ('SAF-120326-0001', @jshange_id, 'Jubhele Shange', 'CEO',
   'Astute Insights (Pty) Ltd', 1, @jshange_id, '2026-05-29 08:00:00'),

  ('SAF-120326-0001', @zmyeza_id,  'Zanele Myeza',   'Safety Officer',
   'Astute Insights (Pty) Ltd', 1, @jshange_id, '2026-05-29 08:00:00'),

  ('SAF-120326-0001', @sibu_id,    'Sibulelo Mtolo', 'Construction Supervisor',
   'Astute Insights (Pty) Ltd', 1, @jshange_id, '2026-05-29 08:00:00'),

  ('SAF-120326-0001', @penny_id,   'Penny Nzimande', 'SHE Rep',
   'Astute Insights (Pty) Ltd', 1, @jshange_id, '2026-05-29 08:00:00');

SET FOREIGN_KEY_CHECKS = 1;

-- ── 3. Verify result ───────────────────────────────────────────────
SELECT
    sp.id,
    sp.file_ref,
    u.name    AS person,
    sp.role,
    sp.company,
    CASE WHEN sp.user_id IS NULL THEN 'NO USER_ID - CHECK' ELSE 'OK' END AS status
  FROM bf_safety_personnel sp
  LEFT JOIN bf_users u ON u.id = sp.user_id
 WHERE sp.file_ref = 'SAF-120326-0001'
 ORDER BY sp.id;
