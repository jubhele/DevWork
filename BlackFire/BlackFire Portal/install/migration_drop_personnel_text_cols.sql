-- ============================================================
-- Migration: Drop redundant text columns from bf_safety_personnel
--
--   full_name  — redundant; name read via JOIN bf_users
--   id_number  — not required for portal use
--   role       — OHS appointment role; derived from appointment
--                letter context, not stored in the portal DB
--
-- Run order: AFTER migration_personnel_user_fk.sql
--            AFTER fix_remove_nonfile_personnel.sql
--            (fictional rows with no user_id must be removed first
--             or they become unidentifiable once full_name is gone)
-- ============================================================

SET NAMES utf8mb4;

-- ── 1. Purge any remaining rows with no user_id ───────────────
-- After fix_remove_nonfile_personnel.sql these should be 0 rows.
-- Guard here in case that script has not been run yet.
DELETE FROM bf_safety_personnel WHERE user_id IS NULL;

-- ── 2. Drop the columns ───────────────────────────────────────
ALTER TABLE `bf_safety_personnel`
  DROP COLUMN IF EXISTS `full_name`,
  DROP COLUMN IF EXISTS `id_number`,
  DROP COLUMN IF EXISTS `role`;

-- ── 3. Verify ─────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = DATABASE()
   AND table_name   = 'bf_safety_personnel'
 ORDER BY ordinal_position;
