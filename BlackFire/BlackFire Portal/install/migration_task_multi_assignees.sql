-- Task Multi-Assignees: junction table so a task can have 2+ assignees.
-- Keeps bf_tasks.assigned_to_user_id / assigned_to as the primary (first) assignee
-- for backward compat with existing filter/display code.
-- Run once. Safe to re-run (CREATE TABLE IF NOT EXISTS).

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS bf_task_assignees (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_ref         VARCHAR(20)  NOT NULL,
  user_id          INT UNSIGNED NOT NULL,
  username         VARCHAR(100) NOT NULL,
  name             VARCHAR(100) NOT NULL,
  assigned_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by_uid  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_task_user (task_ref, user_id),
  KEY idx_ta_task_ref (task_ref),
  KEY idx_ta_user_id  (user_id),
  CONSTRAINT fk_ta_task FOREIGN KEY (task_ref)        REFERENCES bf_tasks (ref_id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_user FOREIGN KEY (user_id)         REFERENCES bf_users (id)     ON DELETE CASCADE,
  CONSTRAINT fk_ta_assigner FOREIGN KEY (assigned_by_uid) REFERENCES bf_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backfill: migrate any existing single-assignee tasks into the junction table
INSERT IGNORE INTO bf_task_assignees (task_ref, user_id, username, name, assigned_by_uid)
SELECT t.ref_id,
       t.assigned_to_user_id,
       u.username,
       u.name,
       t.created_by_user_id
  FROM bf_tasks t
  JOIN bf_users u ON u.id = t.assigned_to_user_id
 WHERE t.assigned_to_user_id IS NOT NULL;
