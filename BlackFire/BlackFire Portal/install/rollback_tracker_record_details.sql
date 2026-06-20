-- Clear schedule values introduced by migration_tracker_record_details.sql.
-- History tables and columns remain in place so later user activity is never destroyed.

START TRANSACTION;

UPDATE bf_tasks t
JOIN bf_tasks_backup_20260620_record_details b ON b.id = t.id
SET t.start_at = NULL, t.end_at = NULL, t.due_at = NULL;

UPDATE bf_callouts c
JOIN bf_callouts_backup_20260620_record_details b ON b.id = c.id
SET c.start_at = NULL, c.end_at = NULL, c.due_at = NULL;

COMMIT;
