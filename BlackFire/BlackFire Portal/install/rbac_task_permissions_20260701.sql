-- ============================================================
-- Delta migration: task.* permissions (SYNC-P1-02, 2026-07-01)
-- Apply this to any install that already has rbac_full_migration.sql applied.
-- Adds task.view / task.create / task.update permissions for all operational
-- roles so the tracker (admin/sales/general) is correctly gated in apps/web.
-- safety_officer is excluded intentionally — safety module only.
-- inspector gets task.view only (read-only compliance access).
-- ============================================================
START TRANSACTION;

INSERT IGNORE INTO bf_role_permissions (role, permission) VALUES
  ('sysadmin',      'task.view'),
  ('sysadmin',      'task.create'),
  ('sysadmin',      'task.update'),
  ('admin',         'task.view'),
  ('admin',         'task.create'),
  ('admin',         'task.update'),
  ('manager',       'task.view'),
  ('manager',       'task.create'),
  ('manager',       'task.update'),
  ('admin_clerk',   'task.view'),
  ('admin_clerk',   'task.create'),
  ('admin_clerk',   'task.update'),
  ('call_logger',   'task.view'),
  ('call_logger',   'task.create'),
  ('call_logger',   'task.update'),
  ('junior_tech',   'task.view'),
  ('junior_tech',   'task.update'),
  ('senior_tech',   'task.view'),
  ('senior_tech',   'task.create'),
  ('senior_tech',   'task.update'),
  ('client_support','task.view'),
  ('viewer',        'task.view'),
  ('inspector',     'task.view');

COMMIT;
