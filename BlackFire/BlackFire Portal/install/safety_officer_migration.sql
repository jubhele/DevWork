-- ============================================================
-- BlackFire Solutions — Safety Officer Role Migration
-- File: install/safety_officer_migration.sql
-- Purpose: Additive migration — safe to run on a live database.
--          Adds safety.* permissions to all existing roles and
--          introduces the new safety_officer role.
--          Run AFTER rbac_full_migration.sql has been applied at
--          least once (bf_role_permissions table must exist).
-- ============================================================

-- ── 1. Add safety.* permissions to existing roles ──────────────────

INSERT IGNORE INTO bf_role_permissions (role, permission) VALUES
  -- sysadmin: full safety access (also bypasses check in PHP, but rows kept for audit)
  ('sysadmin',  'safety.view'),
  ('sysadmin',  'safety.create'),
  ('sysadmin',  'safety.update'),
  ('sysadmin',  'safety.delete'),
  ('sysadmin',  'safety.approve'),
  -- admin: full safety access
  ('admin',     'safety.view'),
  ('admin',     'safety.create'),
  ('admin',     'safety.update'),
  ('admin',     'safety.delete'),
  ('admin',     'safety.approve'),
  -- manager: full safety access
  ('manager',   'safety.view'),
  ('manager',   'safety.create'),
  ('manager',   'safety.update'),
  ('manager',   'safety.delete'),
  ('manager',   'safety.approve'),
  -- admin_clerk: view + create + update (no delete/approve)
  ('admin_clerk', 'safety.view'),
  ('admin_clerk', 'safety.create'),
  ('admin_clerk', 'safety.update'),
  -- senior_tech: can create and update safety files
  ('senior_tech', 'safety.view'),
  ('senior_tech', 'safety.create'),
  ('senior_tech', 'safety.update'),
  -- read-only safety access for field roles
  ('call_logger',     'safety.view'),
  ('junior_tech',     'safety.view'),
  ('client_support',  'safety.view'),
  ('viewer',          'safety.view');

-- ── 2. Create the safety_officer role ─────────────────────────────

INSERT IGNORE INTO bf_role_permissions (role, permission) VALUES
  ('safety_officer', 'safety.view'),
  ('safety_officer', 'safety.create'),
  ('safety_officer', 'safety.update');

-- safety_officer has NO access to: callouts, quotes, invoices, finance,
-- security, or user management.  The portal nav hides those sections
-- automatically for any role that lacks the relevant permissions.
-- Delete and approve remain restricted to admin / manager.

-- ── 3. Create user(s) with safety_officer role ────────────────────
--
-- Replace the placeholder values before running:
--   <full_name>    — e.g. 'Sipho Dlamini'
--   <username>     — e.g. 'sipho.safety'  (lowercase, no spaces)
--   <email>        — e.g. 'sipho@blackfiresolutions.co.za'
--   <bcrypt_hash>  — generate with:
--                      PHP: echo password_hash('MyP@ssw0rd!2026', PASSWORD_BCRYPT);
--                      CLI: php -r "echo password_hash('MyP@ssw0rd!2026', PASSWORD_BCRYPT);"
--
-- EXAMPLE (uncomment and edit to use):
-- INSERT INTO bf_users (name, username, email, password_hash, role, active, title)
-- VALUES (
--   '<full_name>',
--   '<username>',
--   '<email>',
--   '<bcrypt_hash>',
--   'safety_officer',
--   1,
--   'Safety Officer'
-- );
--
-- To create multiple users, repeat the INSERT for each one.
--
-- Alternatively, use the portal's Users & Roles page (as admin/manager)
-- to create the account — select "Safety Officer" from the role dropdown.

-- ── Verification query ─────────────────────────────────────────────
-- Run after the migration to confirm the role is correctly seeded:
-- SELECT role, GROUP_CONCAT(permission ORDER BY permission) AS permissions
-- FROM bf_role_permissions
-- WHERE role = 'safety_officer'
-- GROUP BY role;
