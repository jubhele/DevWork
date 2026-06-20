-- Company Tracker: bf_tasks table and RBAC permissions
-- Adds a multi-category internal task tracker alongside existing bf_callouts.
-- Categories: admin | sales | general
-- Each category is visible only to roles in the visibility matrix enforced in api/tasks.php.
-- Run once. Safe to re-run (CREATE TABLE IF NOT EXISTS, INSERT IGNORE).

SET NAMES utf8mb4;

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bf_tasks (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  ref_id              VARCHAR(20)   NOT NULL,
  category            ENUM('admin','sales','general') NOT NULL,
  title               VARCHAR(255)  NOT NULL,
  description         TEXT          NULL,
  status              ENUM('Open','In Progress','Done','Cancelled') NOT NULL DEFAULT 'Open',
  priority            ENUM('Low','Normal','High','Urgent')          NOT NULL DEFAULT 'Normal',
  assigned_to_user_id INT UNSIGNED  NULL,
  assigned_to         VARCHAR(100)  NULL,
  created_by_user_id  INT UNSIGNED  NOT NULL,
  created_by          VARCHAR(100)  NOT NULL,
  source_callout_ref  VARCHAR(20)   NULL,
  due_date            DATE          NULL,
  completed_at        DATETIME      NULL,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE  KEY uq_task_ref    (ref_id),
  UNIQUE  KEY uq_task_source_callout (source_callout_ref),
  KEY     idx_task_category  (category),
  KEY     idx_task_status    (status),
  KEY     idx_task_assigned  (assigned_to_user_id),
  KEY     idx_task_created   (created_by_user_id),
  KEY     idx_task_due       (due_date),

  CONSTRAINT fk_task_assigned  FOREIGN KEY (assigned_to_user_id) REFERENCES bf_users (id) ON DELETE SET NULL,
  CONSTRAINT fk_task_creator   FOREIGN KEY (created_by_user_id)  REFERENCES bf_users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Per-category ref_id sequence tracker ─────────────────────────────────────
-- Stores the last used sequence number for each category so we can generate
-- TK-ADMIN-001, TK-SALES-001, TK-GEN-001 without table-wide locking.

CREATE TABLE IF NOT EXISTS bf_task_sequences (
  category  VARCHAR(20) NOT NULL,
  last_seq  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO bf_task_sequences (category, last_seq) VALUES
  ('admin',   0),
  ('sales',   0),
  ('general', 0);

-- ── RBAC permissions ──────────────────────────────────────────────────────────
-- task.view   → can see the Tracker section (category filter applied server-side)
-- task.create → can create new tasks in accessible categories
-- task.update → can update any task in accessible categories
-- task.delete → sysadmin / admin only

INSERT IGNORE INTO bf_role_permissions (role, permission) VALUES
  -- task.view
  ('sysadmin',      'task.view'),
  ('admin',         'task.view'),
  ('manager',       'task.view'),
  ('admin_clerk',   'task.view'),
  ('finance',       'task.view'),
  ('safety_officer','task.view'),
  ('call_logger',   'task.view'),
  ('junior_tech',   'task.view'),
  ('senior_tech',   'task.view'),
  ('viewer',        'task.view'),

  -- task.create
  ('sysadmin',      'task.create'),
  ('admin',         'task.create'),
  ('manager',       'task.create'),
  ('admin_clerk',   'task.create'),
  ('call_logger',   'task.create'),
  ('junior_tech',   'task.create'),
  ('senior_tech',   'task.create'),

  -- task.update
  ('sysadmin',      'task.update'),
  ('admin',         'task.update'),
  ('manager',       'task.update'),
  ('admin_clerk',   'task.update'),

  -- task.delete
  ('sysadmin',      'task.delete'),
  ('admin',         'task.delete');
