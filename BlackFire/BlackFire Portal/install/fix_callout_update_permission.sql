-- Fix: add missing callout.update permission to bf_role_permissions
-- callouts.php:208 calls require_perm('callout.update') as a broad gate before
-- granular field checks. This permission was never seeded, causing all non-sysadmin
-- roles (including admin) to receive a 403 when attempting any callout update.
-- Run once on the live server. Safe to re-run (INSERT IGNORE).

INSERT IGNORE INTO bf_role_permissions (role, permission) VALUES
  ('sysadmin',   'callout.update'),
  ('admin',      'callout.update'),
  ('manager',    'callout.update'),
  ('admin_clerk','callout.update'),
  ('call_logger','callout.update'),
  ('junior_tech','callout.update'),
  ('senior_tech','callout.update');
