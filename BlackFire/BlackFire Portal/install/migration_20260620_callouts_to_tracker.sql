-- Reclassify the 14 internal-work records logged on 2026-06-20.
-- Admin: 8 | Sales: 3 | General: 3 | Call Log: 0
-- Safe to re-run after a complete migration. Partial states stop with an error.

SET NAMES utf8mb4;

SET @has_source_ref = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bf_tasks'
    AND COLUMN_NAME = 'source_callout_ref'
);
SET @sql = IF(
  @has_source_ref = 0,
  'ALTER TABLE bf_tasks ADD COLUMN source_callout_ref VARCHAR(20) NULL AFTER created_by',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_source_index = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bf_tasks'
    AND INDEX_NAME = 'uq_task_source_callout'
);
SET @sql = IF(
  @has_source_index = 0,
  'ALTER TABLE bf_tasks ADD UNIQUE KEY uq_task_source_callout (source_callout_ref)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS bf_callouts_backup_20260620_tracker LIKE bf_callouts;

DROP PROCEDURE IF EXISTS migrate_20260620_callouts_to_tracker;
DELIMITER //
CREATE PROCEDURE migrate_20260620_callouts_to_tracker()
BEGIN
  DECLARE source_count INT DEFAULT 0;
  DECLARE task_count INT DEFAULT 0;
  DECLARE backup_count INT DEFAULT 0;

  SELECT COUNT(*) INTO source_count
  FROM bf_callouts
  WHERE ref_id IN (
    'CO-200626-0116','CO-200626-0117','CO-200626-0118','CO-200626-0119',
    'CO-200626-0120','CO-200626-0121','CO-200626-0122','CO-200626-0123',
    'CO-200626-0124','CO-200626-0125','CO-200626-0126','CO-200626-0127',
    'CO-200626-0128','CO-200626-0129'
  );

  SELECT COUNT(*) INTO task_count
  FROM bf_tasks
  WHERE source_callout_ref IN (
    'CO-200626-0116','CO-200626-0117','CO-200626-0118','CO-200626-0119',
    'CO-200626-0120','CO-200626-0121','CO-200626-0122','CO-200626-0123',
    'CO-200626-0124','CO-200626-0125','CO-200626-0126','CO-200626-0127',
    'CO-200626-0128','CO-200626-0129'
  );

  IF source_count = 0 AND task_count = 14 THEN
    SELECT 'Already migrated' AS migration_status;
  ELSEIF source_count = 14 AND task_count = 0 THEN
    START TRANSACTION;

    INSERT IGNORE INTO bf_callouts_backup_20260620_tracker
    SELECT * FROM bf_callouts
    WHERE ref_id IN (
      'CO-200626-0116','CO-200626-0117','CO-200626-0118','CO-200626-0119',
      'CO-200626-0120','CO-200626-0121','CO-200626-0122','CO-200626-0123',
      'CO-200626-0124','CO-200626-0125','CO-200626-0126','CO-200626-0127',
      'CO-200626-0128','CO-200626-0129'
    );

    SELECT COUNT(*) INTO backup_count
    FROM bf_callouts_backup_20260620_tracker
    WHERE ref_id IN (
      'CO-200626-0116','CO-200626-0117','CO-200626-0118','CO-200626-0119',
      'CO-200626-0120','CO-200626-0121','CO-200626-0122','CO-200626-0123',
      'CO-200626-0124','CO-200626-0125','CO-200626-0126','CO-200626-0127',
      'CO-200626-0128','CO-200626-0129'
    );
    IF backup_count <> 14 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Callout backup is incomplete';
    END IF;

    INSERT INTO bf_tasks (
      ref_id, category, title, description, status, priority,
      assigned_to_user_id, assigned_to, created_by_user_id, created_by,
      source_callout_ref, due_date, completed_at, created_at, updated_at
    )
    SELECT
      CASE c.ref_id
        WHEN 'CO-200626-0116' THEN 'TK-ADMIN-CO0116'
        WHEN 'CO-200626-0117' THEN 'TK-ADMIN-CO0117'
        WHEN 'CO-200626-0118' THEN 'TK-ADMIN-CO0118'
        WHEN 'CO-200626-0119' THEN 'TK-ADMIN-CO0119'
        WHEN 'CO-200626-0120' THEN 'TK-GEN-CO0120'
        WHEN 'CO-200626-0121' THEN 'TK-SALES-CO0121'
        WHEN 'CO-200626-0122' THEN 'TK-ADMIN-CO0122'
        WHEN 'CO-200626-0123' THEN 'TK-ADMIN-CO0123'
        WHEN 'CO-200626-0124' THEN 'TK-GEN-CO0124'
        WHEN 'CO-200626-0125' THEN 'TK-GEN-CO0125'
        WHEN 'CO-200626-0126' THEN 'TK-SALES-CO0126'
        WHEN 'CO-200626-0127' THEN 'TK-SALES-CO0127'
        WHEN 'CO-200626-0128' THEN 'TK-ADMIN-CO0128'
        WHEN 'CO-200626-0129' THEN 'TK-ADMIN-CO0129'
      END,
      CASE
        WHEN c.ref_id IN ('CO-200626-0121','CO-200626-0126','CO-200626-0127') THEN 'sales'
        WHEN c.ref_id IN ('CO-200626-0120','CO-200626-0124','CO-200626-0125') THEN 'general'
        ELSE 'admin'
      END,
      CASE WHEN c.ref_id = 'CO-200626-0121' THEN 'Drone capability planning session' ELSE c.service END,
      CONCAT('Location: ', c.location, '\n\n', COALESCE(c.notes, '')),
      'Open',
      CASE WHEN c.priority IN ('Urgent','Emergency') THEN 'Urgent' ELSE 'Normal' END,
      CASE
        WHEN c.ref_id IN ('CO-200626-0116','CO-200626-0117','CO-200626-0118','CO-200626-0119','CO-200626-0122','CO-200626-0124','CO-200626-0129') THEN 13
        WHEN c.ref_id IN ('CO-200626-0123','CO-200626-0126','CO-200626-0127') THEN 12
        WHEN c.ref_id IN ('CO-200626-0125','CO-200626-0128') THEN 2
        ELSE NULL
      END,
      CASE
        WHEN c.ref_id IN ('CO-200626-0116','CO-200626-0117','CO-200626-0118','CO-200626-0119','CO-200626-0122','CO-200626-0124','CO-200626-0129') THEN 'Jubhele Shange'
        WHEN c.ref_id IN ('CO-200626-0123','CO-200626-0126','CO-200626-0127') THEN 'Sibulelo Mtolo'
        WHEN c.ref_id IN ('CO-200626-0125','CO-200626-0128') THEN 'Nontokozo Mtolo'
        WHEN c.ref_id IN ('CO-200626-0120','CO-200626-0121') THEN 'Sibulelo Mtolo & Jubhele Shange'
        ELSE NULL
      END,
      c.logged_by_user_id,
      creator.name,
      c.ref_id,
      NULL,
      NULL,
      c.created_at,
      c.updated_at
    FROM bf_callouts c
    JOIN bf_users creator ON creator.id = c.logged_by_user_id
    WHERE c.ref_id IN (
      'CO-200626-0116','CO-200626-0117','CO-200626-0118','CO-200626-0119',
      'CO-200626-0120','CO-200626-0121','CO-200626-0122','CO-200626-0123',
      'CO-200626-0124','CO-200626-0125','CO-200626-0126','CO-200626-0127',
      'CO-200626-0128','CO-200626-0129'
    );

    IF ROW_COUNT() <> 14 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Expected 14 tracker tasks to be created';
    END IF;

    DELETE FROM bf_callouts
    WHERE ref_id IN (
      'CO-200626-0116','CO-200626-0117','CO-200626-0118','CO-200626-0119',
      'CO-200626-0120','CO-200626-0121','CO-200626-0122','CO-200626-0123',
      'CO-200626-0124','CO-200626-0125','CO-200626-0126','CO-200626-0127',
      'CO-200626-0128','CO-200626-0129'
    );

    IF ROW_COUNT() <> 14 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Expected 14 call-log records to be removed';
    END IF;

    COMMIT;
    SELECT 'Migrated 14 records: Admin 8, Sales 3, General 3' AS migration_status;
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Partial migration state detected; restore before retrying';
  END IF;
END//
DELIMITER ;

CALL migrate_20260620_callouts_to_tracker();
UPDATE bf_tasks
SET title = 'Drone capability planning session'
WHERE source_callout_ref = 'CO-200626-0121';
DROP PROCEDURE migrate_20260620_callouts_to_tracker;
