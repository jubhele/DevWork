-- ============================================================
-- BlackFire Solutions — Full RBAC Migration
-- File: install/rbac_full_migration.sql
-- Purpose: Authoritative bf_role_permissions seeding for all roles.
--          Run against the live database after any role/permission changes.
--          Safe to re-run (REPLACE INTO is idempotent).
-- ============================================================

-- Ensure the table exists (in case this runs before the main schema)
CREATE TABLE IF NOT EXISTS bf_role_permissions (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role       VARCHAR(50)  NOT NULL,
  permission VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_role_perm (role, permission)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Clear existing rows and re-seed cleanly
-- The DELETE + re-seed runs inside a single transaction so a
-- failure mid-script cannot leave the permissions table empty.
-- (QA 2026-06-10: bare DELETE without WHERE was a BLOCK.)
-- ============================================================
START TRANSACTION;

DELETE FROM bf_role_permissions;

-- ============================================================
-- ROLE: sysadmin  (God mode — all permissions)
-- Note: PHP can() also bypasses the table for sysadmin unconditionally.
-- These rows exist for audit trail and documentation purposes.
-- ============================================================
INSERT INTO bf_role_permissions (role, permission) VALUES
  ('sysadmin', 'callout.view'),
  ('sysadmin', 'callout.create'),
  ('sysadmin', 'callout.update'),
  ('sysadmin', 'callout.update_status'),
  ('sysadmin', 'callout.assign_po'),
  ('sysadmin', 'callout.assign_tech'),
  ('sysadmin', 'callout.delete'),
  ('sysadmin', 'callout.confirm_closure'),
  ('sysadmin', 'quote.view'),
  ('sysadmin', 'quote.create'),
  ('sysadmin', 'quote.approve'),
  ('sysadmin', 'quote.convert'),
  ('sysadmin', 'quote.delete'),
  ('sysadmin', 'invoice.view'),
  ('sysadmin', 'invoice.create'),
  ('sysadmin', 'invoice.mark_paid'),
  ('sysadmin', 'invoice.delete'),
  ('sysadmin', 'invoice.send'),
  ('sysadmin', 'finance.transactions'),
  ('sysadmin', 'finance.statement'),
  ('sysadmin', 'finance.income'),
  ('sysadmin', 'finance.statement.release'),
  ('sysadmin', 'finance.statement.generate'),
  ('sysadmin', 'capture.new_callout'),
  ('sysadmin', 'capture.new_quote'),
  ('sysadmin', 'capture.new_invoice'),
  ('sysadmin', 'capture.log_payment'),
  ('sysadmin', 'security.audit'),
  ('sysadmin', 'security.users'),
  ('sysadmin', 'user.create'),
  ('sysadmin', 'user.update'),
  ('sysadmin', 'safety.view'),
  ('sysadmin', 'safety.create'),
  ('sysadmin', 'safety.update'),
  ('sysadmin', 'safety.delete'),
  ('sysadmin', 'safety.approve');

-- ============================================================
-- ROLE: admin  (Full operations — no system-level user management edge cases)
-- ============================================================
INSERT INTO bf_role_permissions (role, permission) VALUES
  ('admin', 'callout.view'),
  ('admin', 'callout.create'),
  ('admin', 'callout.update'),
  ('admin', 'callout.update_status'),
  ('admin', 'callout.assign_po'),
  ('admin', 'callout.assign_tech'),
  ('admin', 'callout.delete'),
  ('admin', 'callout.confirm_closure'),
  ('admin', 'quote.view'),
  ('admin', 'quote.create'),
  ('admin', 'quote.approve'),
  ('admin', 'quote.convert'),
  ('admin', 'quote.delete'),
  ('admin', 'invoice.view'),
  ('admin', 'invoice.create'),
  ('admin', 'invoice.mark_paid'),
  ('admin', 'invoice.delete'),
  ('admin', 'invoice.send'),
  ('admin', 'finance.transactions'),
  ('admin', 'finance.statement'),
  ('admin', 'finance.income'),
  ('admin', 'finance.statement.release'),
  ('admin', 'finance.statement.generate'),
  ('admin', 'capture.new_callout'),
  ('admin', 'capture.new_quote'),
  ('admin', 'capture.new_invoice'),
  ('admin', 'capture.log_payment'),
  ('admin', 'security.audit'),
  ('admin', 'security.users'),
  ('admin', 'user.create'),
  ('admin', 'user.update'),
  ('admin', 'safety.view'),
  ('admin', 'safety.create'),
  ('admin', 'safety.update'),
  ('admin', 'safety.delete'),
  ('admin', 'safety.approve');

-- ============================================================
-- ROLE: manager  (Operational oversight — finance full, no audit log, no user.update)
-- ============================================================
INSERT INTO bf_role_permissions (role, permission) VALUES
  ('manager', 'callout.view'),
  ('manager', 'callout.create'),
  ('manager', 'callout.update'),
  ('manager', 'callout.update_status'),
  ('manager', 'callout.assign_po'),
  ('manager', 'callout.assign_tech'),
  ('manager', 'callout.delete'),
  ('manager', 'callout.confirm_closure'),
  ('manager', 'quote.view'),
  ('manager', 'quote.create'),
  ('manager', 'quote.approve'),
  ('manager', 'quote.convert'),
  ('manager', 'quote.delete'),
  ('manager', 'invoice.view'),
  ('manager', 'invoice.create'),
  ('manager', 'invoice.mark_paid'),
  ('manager', 'invoice.delete'),
  ('manager', 'invoice.send'),
  ('manager', 'finance.transactions'),
  ('manager', 'finance.statement'),
  ('manager', 'finance.income'),
  ('manager', 'finance.statement.release'),
  ('manager', 'capture.new_callout'),
  ('manager', 'capture.new_quote'),
  ('manager', 'capture.new_invoice'),
  ('manager', 'capture.log_payment'),
  ('manager', 'security.users'),
  ('manager', 'user.create'),
  ('manager', 'safety.view'),
  ('manager', 'safety.create'),
  ('manager', 'safety.update'),
  ('manager', 'safety.delete'),
  ('manager', 'safety.approve');

-- ============================================================
-- ROLE: admin_clerk  (Admin support — finance & invoicing, no approvals/deletes)
-- ============================================================
INSERT INTO bf_role_permissions (role, permission) VALUES
  ('admin_clerk', 'callout.view'),
  ('admin_clerk', 'callout.update'),
  ('admin_clerk', 'callout.update_status'),
  ('admin_clerk', 'callout.assign_po'),
  ('admin_clerk', 'callout.assign_tech'),
  ('admin_clerk', 'quote.view'),
  ('admin_clerk', 'quote.convert'),
  ('admin_clerk', 'invoice.view'),
  ('admin_clerk', 'invoice.create'),
  ('admin_clerk', 'invoice.mark_paid'),
  ('admin_clerk', 'invoice.send'),
  ('admin_clerk', 'finance.transactions'),
  ('admin_clerk', 'finance.statement'),
  ('admin_clerk', 'finance.income'),
  ('admin_clerk', 'finance.statement.release'),
  ('admin_clerk', 'capture.new_invoice'),
  ('admin_clerk', 'capture.log_payment'),
  ('admin_clerk', 'security.users'),
  ('admin_clerk', 'user.create'),
  ('admin_clerk', 'safety.view'),
  ('admin_clerk', 'safety.create'),
  ('admin_clerk', 'safety.update');

-- ============================================================
-- ROLE: call_logger  (Field operations — create & status callouts, no finance)
-- ============================================================
INSERT INTO bf_role_permissions (role, permission) VALUES
  ('call_logger', 'callout.view'),
  ('call_logger', 'callout.create'),
  ('call_logger', 'callout.update'),
  ('call_logger', 'callout.update_status'),
  ('call_logger', 'capture.new_callout'),
  ('call_logger', 'safety.view');

-- ============================================================
-- ROLE: junior_tech  (Technician — view & update callout status only)
-- ============================================================
INSERT INTO bf_role_permissions (role, permission) VALUES
  ('junior_tech', 'callout.view'),
  ('junior_tech', 'callout.update'),
  ('junior_tech', 'callout.update_status'),
  ('junior_tech', 'safety.view');

-- ============================================================
-- ROLE: senior_tech  (Senior field tech — can submit quotes)
-- ============================================================
INSERT INTO bf_role_permissions (role, permission) VALUES
  ('senior_tech', 'callout.view'),
  ('senior_tech', 'callout.update'),
  ('senior_tech', 'callout.update_status'),
  ('senior_tech', 'quote.view'),
  ('senior_tech', 'quote.create'),
  ('senior_tech', 'capture.new_quote'),
  ('senior_tech', 'safety.view'),
  ('senior_tech', 'safety.create'),
  ('senior_tech', 'safety.update');

-- ============================================================
-- ROLE: client_support  (Client-facing — create callouts, view invoices/statements)
-- ============================================================
INSERT INTO bf_role_permissions (role, permission) VALUES
  ('client_support', 'callout.view'),
  ('client_support', 'callout.create'),
  ('client_support', 'invoice.view'),
  ('client_support', 'finance.statement'),
  ('client_support', 'capture.new_callout'),
  ('client_support', 'safety.view');

-- ============================================================
-- ROLE: viewer  (Read-only — view callouts, quotes, invoices, statement)
-- ============================================================
INSERT INTO bf_role_permissions (role, permission) VALUES
  ('viewer', 'callout.view'),
  ('viewer', 'quote.view'),
  ('viewer', 'invoice.view'),
  ('viewer', 'finance.statement'),
  ('viewer', 'safety.view');

-- ============================================================
-- ROLE: safety_officer  (Safety-module only — manage contractor safety files)
-- ============================================================
INSERT INTO bf_role_permissions (role, permission) VALUES
  ('safety_officer', 'safety.view'),
  ('safety_officer', 'safety.create'),
  ('safety_officer', 'safety.update');

-- ============================================================
-- ROLE: inspector  (Quality/Compliance — read-only access to operations)
-- ============================================================
INSERT INTO bf_role_permissions (role, permission) VALUES
  ('inspector', 'callout.view'),
  ('inspector', 'quote.view'),
  ('inspector', 'invoice.view'),
  ('inspector', 'safety.view');

COMMIT;

-- ============================================================
-- Summary: Role capability matrix
-- ============================================================
-- Permission              | sysadmin | admin | manager | admin_clerk | call_logger | junior_tech | senior_tech | client_support | viewer | safety_officer | inspector
-- callout.view            |    ✓     |   ✓   |    ✓    |      ✓      |      ✓      |      ✓      |      ✓      |       ✓        |   ✓    |      -       |     ✓
-- callout.create          |    ✓     |   ✓   |    ✓    |      -      |      ✓      |      -      |      -      |       ✓        |   -    |      -       |     -
-- callout.update          |    ✓     |   ✓   |    ✓    |      ✓      |      ✓      |      ✓      |      ✓      |       -        |   -    |      -       |     -
-- callout.update_status   |    ✓     |   ✓   |    ✓    |      ✓      |      ✓      |      ✓      |      ✓      |       -        |   -    |      -       |     -
-- callout.assign_po       |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- callout.assign_tech     |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- callout.delete          |    ✓     |   ✓   |    ✓    |      -      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- callout.confirm_closure |    ✓     |   ✓   |    ✓    |      -      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- quote.view              |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      ✓      |       ✓        |   ✓    |      -       |     ✓
-- quote.create            |    ✓     |   ✓   |    ✓    |      -      |      -      |      -      |      ✓      |       -        |   -    |      -       |     -
-- quote.approve           |    ✓     |   ✓   |    ✓    |      -      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- quote.convert           |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- quote.delete            |    ✓     |   ✓   |    ✓    |      -      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- invoice.view            |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       ✓        |   ✓    |      -       |     ✓
-- invoice.create          |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- invoice.mark_paid       |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- invoice.delete          |    ✓     |   ✓   |    ✓    |      -      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- invoice.send            |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- finance.transactions    |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- finance.statement       |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       ✓        |   ✓    |      -       |     -
-- finance.income          |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- finance.stmt.release    |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- finance.stmt.generate   |    ✓     |   ✓   |    -    |      -      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- capture.new_callout     |    ✓     |   ✓   |    ✓    |      -      |      ✓      |      -      |      -      |       ✓        |   -    |      -       |     -
-- capture.new_quote       |    ✓     |   ✓   |    ✓    |      -      |      -      |      -      |      ✓      |       -        |   -    |      -       |     -
-- capture.new_invoice     |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- capture.log_payment     |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- security.audit          |    ✓     |   ✓   |    -    |      -      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- security.users          |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- user.create             |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- user.update             |    ✓     |   ✓   |    -    |      -      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- safety.view             |    ✓     |   ✓   |    ✓    |      ✓      |      ✓      |      ✓      |      ✓      |       ✓        |   ✓    |      ✓       |     ✓
-- safety.create           |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      ✓      |       -        |   -    |      ✓       |     -
-- safety.update           |    ✓     |   ✓   |    ✓    |      ✓      |      -      |      -      |      ✓      |       -        |   -    |      ✓       |     -
-- safety.delete           |    ✓     |   ✓   |    ✓    |      -      |      -      |      -      |      -      |       -        |   -    |      -       |     -
-- safety.approve          |    ✓     |   ✓   |    ✓    |      -      |      -      |      -      |      -      |       -        |   -    |      -       |     -
