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
-- Rows with no user_id (Thabo Mokoena, Maria Coetzee — fictional,
-- no portal users) are purged in migration_drop_personnel_text_cols.sql §1
-- which removes all user_id IS NULL rows before dropping full_name.
-- Run that migration after this script.
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

-- ── 1. Remove by user_id FK ────────────────────────────────────
DELETE FROM bf_safety_personnel
 WHERE user_id IN (@jmthembu_id, @rkhumalo_id, @lsithole_id, @nsithole_id);

-- ── 2. Verify — confirm none remain ───────────────────────────
SELECT sp.id, sp.file_ref, u.name AS person, u.username
  FROM bf_safety_personnel sp
  JOIN bf_users u ON u.id = sp.user_id
 WHERE sp.user_id IN (@jmthembu_id, @rkhumalo_id, @lsithole_id, @nsithole_id);
-- Expected: 0 rows
