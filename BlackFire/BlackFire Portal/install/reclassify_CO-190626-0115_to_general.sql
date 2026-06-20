-- Move CO-190626-0115 (June 19 record, missed by the June 20 batch migration)
-- from bf_callouts into bf_tasks under the General stream.
-- Also handles the case where it is already in bf_tasks with the wrong category.
-- Safe to re-run (idempotent).

SET NAMES utf8mb4;

-- ── Backup ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bf_callouts_backup_20260620_0115 LIKE bf_callouts;
INSERT IGNORE INTO bf_callouts_backup_20260620_0115 SELECT * FROM bf_callouts;

CREATE TABLE IF NOT EXISTS bf_tasks_backup_20260620_0115 LIKE bf_tasks;
INSERT IGNORE INTO bf_tasks_backup_20260620_0115 SELECT * FROM bf_tasks;

-- ── Case 1: already in bf_tasks with wrong category → fix it ─────────────────
UPDATE bf_tasks
SET    category = 'general',
       updated_at = CURRENT_TIMESTAMP
WHERE  source_callout_ref = 'CO-190626-0115'
  AND  category <> 'general';

-- ── Case 2: still in bf_callouts → migrate to bf_tasks as general ────────────
INSERT INTO bf_tasks (
  ref_id, category, title, description, status, priority,
  assigned_to_user_id, assigned_to,
  created_by_user_id, created_by,
  source_callout_ref, due_date, completed_at, created_at, updated_at
)
SELECT
  'TK-GEN-CO0115',
  'general',
  c.service,
  CONCAT('Location: ', COALESCE(c.location, '—'), '\n\n', COALESCE(c.notes, '')),
  'Open',
  CASE WHEN c.priority IN ('Urgent','Emergency') THEN 'Urgent' ELSE 'Normal' END,
  c.logged_by_user_id,
  u.name,
  c.logged_by_user_id,
  u.name,
  c.ref_id,
  NULL,
  NULL,
  c.created_at,
  c.updated_at
FROM bf_callouts c
JOIN bf_users u ON u.id = c.logged_by_user_id
WHERE c.ref_id = 'CO-190626-0115'
  AND NOT EXISTS (
    SELECT 1 FROM bf_tasks t WHERE t.source_callout_ref = 'CO-190626-0115'
  );

-- If a row was inserted, remove the source callout
DELETE FROM bf_callouts
WHERE ref_id = 'CO-190626-0115'
  AND EXISTS (
    SELECT 1 FROM bf_tasks t WHERE t.source_callout_ref = 'CO-190626-0115'
  );

-- ── Confirm ───────────────────────────────────────────────────────────────────
SELECT
  t.ref_id,
  t.source_callout_ref,
  t.category,
  t.title,
  t.status
FROM bf_tasks t
WHERE t.source_callout_ref = 'CO-190626-0115';
