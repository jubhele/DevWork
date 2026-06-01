-- ============================================================
-- BlackFire Portal — Multi-Role Migration
-- File: install/migration_user_roles.sql
-- Purpose: Allow users to have more than one role.
--          Creates bf_user_roles junction table and backfills
--          from the existing bf_users.role column.
--          Safe to re-run (INSERT IGNORE is idempotent).
-- ============================================================

CREATE TABLE IF NOT EXISTS bf_user_roles (
  id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id  INT UNSIGNED NOT NULL,
  role     VARCHAR(50)  NOT NULL,
  UNIQUE KEY uq_user_role (user_id, role),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES bf_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Backfill: give every existing user at least their current primary role
INSERT IGNORE INTO bf_user_roles (user_id, role)
SELECT id, role FROM bf_users WHERE role IS NOT NULL AND role != '';
