-- ============================================================
-- Fix: Remove internal BlackFire staff from bf_safety_personnel
--
-- These are real portal users but they are BlackFire internal
-- staff (Junior Tech, Senior Tech, Admin Clerk, Call Logger).
-- They were added via seed/test data and should not appear as
-- People on File on any safety file.
--
-- Portal users removed from personnel (NOT deleted from bf_users):
--   j.mthembu  James Mthembu    JUNIOR TECH
--   r.khumalo  Refilwe Khumalo  SENIOR TECH
--   l.sithole  Lelo Sithole     ADMIN CLERK
--   n.sithole  Nomvula Sithole  CALL LOGGER
--
-- Also removes Thabo Mokoena and Maria Coetzee who are fictional
-- test-data-only names (no portal users exist for them).
--
-- Safe to re-run (DELETE is idempotent when rows are already gone).
-- ============================================================

SET NAMES utf8mb4;

SET @jmthembu_id = (SELECT id FROM bf_users WHERE username = 'j.mthembu' LIMIT 1);
SET @rkhumalo_id = (SELECT id FROM bf_users WHERE username = 'r.khumalo'  LIMIT 1);
SET @lsithole_id = (SELECT id FROM bf_users WHERE username = 'l.sithole'  LIMIT 1);
SET @nsithole_id = (SELECT id FROM bf_users WHERE username = 'n.sithole'  LIMIT 1);

SELECT
    CONCAT('j.mthembu = ', IFNULL(@jmthembu_id, 'NOT FOUND')) AS jmthembu_check,
    CONCAT('r.khumalo = ', IFNULL(@rkhumalo_id, 'NOT FOUND')) AS rkhumalo_check,
    CONCAT('l.sithole = ', IFNULL(@lsithole_id, 'NOT FOUND')) AS lsithole_check,
    CONCAT('n.sithole = ', IFNULL(@nsithole_id, 'NOT FOUND')) AS nsithole_check;

-- ── 1. Remove by user_id FK (rows already backfilled) ─────────────
DELETE FROM bf_safety_personnel
 WHERE user_id IN (@jmthembu_id, @rkhumalo_id, @lsithole_id, @nsithole_id);

-- ── 2. Remove any remaining rows by full_name (user_id still NULL) ─
DELETE FROM bf_safety_personnel
 WHERE user_id IS NULL
   AND full_name IN ('James Mthembu', 'Refilwe Khumalo',
                     'Lelo Sithole',  'Nomvula Sithole');

-- ── 3. Also remove Thabo Mokoena and Maria Coetzee (no portal user,
--       fictional test data across all files) ────────────────────────
DELETE FROM bf_safety_personnel
 WHERE user_id IS NULL
   AND full_name IN ('Thabo Mokoena', 'Maria Coetzee');

-- ── 4. Verify — confirm none remain ───────────────────────────────
SELECT sp.id, sp.file_ref, IFNULL(u.name, sp.full_name) AS person, sp.role
  FROM bf_safety_personnel sp
  LEFT JOIN bf_users u ON u.id = sp.user_id
 WHERE (sp.user_id IN (@jmthembu_id, @rkhumalo_id, @lsithole_id, @nsithole_id)
        OR sp.full_name IN ('James Mthembu', 'Refilwe Khumalo',
                            'Lelo Sithole',  'Nomvula Sithole',
                            'Thabo Mokoena', 'Maria Coetzee'));
-- Expected: 0 rows
