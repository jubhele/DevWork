-- ============================================================
-- Migration: bf_safety_personnel → user_id FK
-- BlackFire Portal
-- Created: 2026-05-31
--
-- All personnel on a safety file must now be portal users.
-- Adds user_id (FK to bf_users), backfills from portal_user_id,
-- and enforces a UNIQUE constraint (one user per file).
--
-- Existing standalone records (portal_user_id IS NULL) are left
-- untouched — they remain as historical audit data with user_id NULL.
--
-- Safe to re-run (IF NOT EXISTS guards throughout).
-- ============================================================

SET NAMES utf8mb4;

-- 1. Add user_id column (nullable — historical standalone rows stay NULL)
ALTER TABLE `bf_safety_personnel`
  ADD COLUMN IF NOT EXISTS `user_id` INT UNSIGNED NULL AFTER `file_ref`;

-- 2. Back-fill from portal_user_id where not yet set
UPDATE `bf_safety_personnel`
   SET `user_id` = `portal_user_id`
 WHERE `portal_user_id` IS NOT NULL
   AND `user_id` IS NULL;

-- 3. Unique constraint: one portal user per file (NULLs are excluded by MySQL UNIQUE)
ALTER TABLE `bf_safety_personnel`
  ADD UNIQUE KEY IF NOT EXISTS `uk_sp_file_user` (`file_ref`, `user_id`);

-- 4. Foreign key to bf_users
--    DROP first in case of re-run (IF EXISTS not supported for FK names in all versions)
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'bf_safety_personnel'
    AND CONSTRAINT_NAME = 'fk_sp_user'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `bf_safety_personnel`
     ADD CONSTRAINT `fk_sp_user`
     FOREIGN KEY (`user_id`) REFERENCES `bf_users`(`id`)
     ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT ''fk_sp_user already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
