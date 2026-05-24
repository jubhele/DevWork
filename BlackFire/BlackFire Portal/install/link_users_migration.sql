-- ============================================================
-- Migration: Portal user → Safety file linking
-- Run AFTER: personnel_compliance_migration.sql
-- ============================================================

-- Add portal_user_id to personnel so we can track which
-- personnel entries were auto-created from portal users.
ALTER TABLE bf_safety_personnel
  ADD COLUMN IF NOT EXISTS portal_user_id INT NULL DEFAULT NULL,
  ADD UNIQUE KEY IF NOT EXISTS uk_file_portal_user (file_ref, portal_user_id);

-- Join table: many-to-many between files and portal users
CREATE TABLE IF NOT EXISTS bf_safety_file_users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  file_ref   VARCHAR(30)  NOT NULL,
  user_id    INT          NOT NULL,
  added_by   VARCHAR(50)  NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_file_user (file_ref, user_id),
  KEY idx_file_ref (file_ref),
  KEY idx_user_id  (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
