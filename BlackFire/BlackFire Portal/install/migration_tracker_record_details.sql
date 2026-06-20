-- Tracker record detail model: schedule timestamps, description history, and revisions.
-- Applies to task streams and the Call Log stream. Safe to re-run.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS bf_tasks_backup_20260620_record_details LIKE bf_tasks;
INSERT IGNORE INTO bf_tasks_backup_20260620_record_details SELECT * FROM bf_tasks;

CREATE TABLE IF NOT EXISTS bf_callouts_backup_20260620_record_details LIKE bf_callouts;
INSERT IGNORE INTO bf_callouts_backup_20260620_record_details SELECT * FROM bf_callouts;

DROP PROCEDURE IF EXISTS add_tracker_record_columns;
DELIMITER //
CREATE PROCEDURE add_tracker_record_columns()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_tasks' AND COLUMN_NAME = 'start_at'
  ) THEN
    ALTER TABLE bf_tasks ADD COLUMN start_at DATETIME NULL AFTER source_callout_ref;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_tasks' AND COLUMN_NAME = 'end_at'
  ) THEN
    ALTER TABLE bf_tasks ADD COLUMN end_at DATETIME NULL AFTER start_at;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_tasks' AND COLUMN_NAME = 'due_at'
  ) THEN
    ALTER TABLE bf_tasks ADD COLUMN due_at DATETIME NULL AFTER end_at;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_callouts' AND COLUMN_NAME = 'start_at'
  ) THEN
    ALTER TABLE bf_callouts ADD COLUMN start_at DATETIME NULL AFTER callout_time;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_callouts' AND COLUMN_NAME = 'end_at'
  ) THEN
    ALTER TABLE bf_callouts ADD COLUMN end_at DATETIME NULL AFTER start_at;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_callouts' AND COLUMN_NAME = 'due_at'
  ) THEN
    ALTER TABLE bf_callouts ADD COLUMN due_at DATETIME NULL AFTER end_at;
  END IF;
END//
DELIMITER ;

CALL add_tracker_record_columns();
DROP PROCEDURE add_tracker_record_columns;

UPDATE bf_tasks
SET due_at = CONCAT(due_date, ' 17:00:00')
WHERE due_at IS NULL AND due_date IS NOT NULL;

UPDATE bf_tasks
SET end_at = completed_at
WHERE end_at IS NULL AND completed_at IS NOT NULL;

UPDATE bf_callouts
SET start_at = TIMESTAMP(callout_date, callout_time)
WHERE start_at IS NULL;

UPDATE bf_callouts
SET end_at = closure_confirmed_at
WHERE end_at IS NULL AND closure_confirmed_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS bf_tracker_updates (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  host_company_id     INT UNSIGNED NOT NULL DEFAULT 1,
  entity_type         VARCHAR(20) NOT NULL,
  entity_ref          VARCHAR(50) NOT NULL,
  label               VARCHAR(120) NOT NULL,
  content             TEXT NOT NULL,
  source_kind         VARCHAR(40) NULL,
  created_by_user_id  INT UNSIGNED NOT NULL,
  created_by          VARCHAR(100) NOT NULL,
  updated_by_user_id  INT UNSIGNED NULL,
  updated_by          VARCHAR(100) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tracker_source (entity_type, entity_ref, source_kind),
  KEY idx_tracker_updates_entity (entity_type, entity_ref, created_at),
  KEY idx_tracker_updates_company (host_company_id),
  CONSTRAINT fk_tracker_update_creator FOREIGN KEY (created_by_user_id) REFERENCES bf_users (id),
  CONSTRAINT fk_tracker_update_editor FOREIGN KEY (updated_by_user_id) REFERENCES bf_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bf_tracker_update_revisions (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  host_company_id     INT UNSIGNED NOT NULL DEFAULT 1,
  tracker_update_id   BIGINT UNSIGNED NOT NULL,
  old_label           VARCHAR(120) NOT NULL,
  old_content         TEXT NOT NULL,
  new_label           VARCHAR(120) NOT NULL,
  new_content         TEXT NOT NULL,
  edited_by_user_id   INT UNSIGNED NOT NULL,
  edited_by           VARCHAR(100) NOT NULL,
  edited_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tracker_revision_update (tracker_update_id, edited_at),
  KEY idx_tracker_revision_company (host_company_id),
  CONSTRAINT fk_tracker_revision_update FOREIGN KEY (tracker_update_id) REFERENCES bf_tracker_updates (id),
  CONSTRAINT fk_tracker_revision_editor FOREIGN KEY (edited_by_user_id) REFERENCES bf_users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO bf_tracker_updates (
  entity_type, entity_ref, label, content, source_kind,
  created_by_user_id, created_by, created_at, updated_at
)
SELECT
  'task', t.ref_id, 'Original description', t.description, 'initial_description',
  t.created_by_user_id, t.created_by, t.created_at, t.created_at
FROM bf_tasks t
WHERE t.description IS NOT NULL AND TRIM(t.description) <> '';

INSERT IGNORE INTO bf_tracker_updates (
  entity_type, entity_ref, label, content, source_kind,
  created_by_user_id, created_by, created_at, updated_at
)
SELECT
  'callout', c.ref_id, 'Original description', c.notes, 'initial_description',
  c.logged_by_user_id, u.name, c.created_at, c.created_at
FROM bf_callouts c
JOIN bf_users u ON u.id = c.logged_by_user_id
WHERE c.notes IS NOT NULL AND TRIM(c.notes) <> '';

