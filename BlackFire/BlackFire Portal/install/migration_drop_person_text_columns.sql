-- ============================================================
-- Migration: Drop all remaining free-text person columns
-- All person identity comes from bf_users via user_id / _id FKs.
--
--  bf_safety_items.appointee           → DROP (replaced by appointee_id)
--  bf_safety_files.contractor_rep      → DROP (replaced by contractor_rep_id)
--  bf_safety_files.appointee162        → DROP (replaced by appointee162_id)
--
--  bf_safety_personnel (full_name, id_number, role) are handled
--  separately in migration_drop_personnel_text_cols.sql.
--
-- Run order: AFTER migration_safety_files_user_fk.sql
--            AFTER migration_all_person_fk.sql
-- ============================================================

SET NAMES utf8mb4;

-- ── 1. bf_safety_items: drop appointee text column ───────────
ALTER TABLE `bf_safety_items`
  DROP COLUMN IF EXISTS `appointee`;

-- ── 2. bf_safety_files: drop text fallback columns ───────────
--    contractor_rep_id and appointee162_id carry the FK values;
--    the text columns are no longer written or read by PHP.
ALTER TABLE `bf_safety_files`
  DROP COLUMN IF EXISTS `contractor_rep`,
  DROP COLUMN IF EXISTS `appointee162`;

-- ── Verify ───────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = DATABASE()
   AND table_name   IN ('bf_safety_items', 'bf_safety_files')
   AND column_name  IN ('appointee', 'contractor_rep', 'appointee162')
 ORDER BY table_name, column_name;
-- Expected: 0 rows (all text columns gone)
