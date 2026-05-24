-- ============================================================
-- Safety File Soft Delete Migration
-- Run AFTER safety_migration.sql
-- Adds is_active flag so "deleted" files are hidden but retained
-- ============================================================

ALTER TABLE bf_safety_files
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1
  AFTER status;

ALTER TABLE bf_safety_files
  ADD INDEX idx_is_active (is_active);

-- End of migration
