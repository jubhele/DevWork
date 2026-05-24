-- ============================================================
-- BlackFire Portal — Patch: clients.* RBAC permissions
-- Run against the production DB if clients_migration.sql was
-- applied before this block existed in it.
-- Safe to re-run (INSERT IGNORE skips existing rows).
-- ============================================================

INSERT IGNORE INTO bf_role_permissions (role, permission) VALUES
    ('sysadmin',       'clients.view'),
    ('sysadmin',       'clients.create'),
    ('sysadmin',       'clients.update'),
    ('admin',          'clients.view'),
    ('admin',          'clients.create'),
    ('admin',          'clients.update'),
    ('manager',        'clients.view'),
    ('manager',        'clients.create'),
    ('manager',        'clients.update'),
    ('admin_clerk',    'clients.view'),
    ('client_support', 'clients.view');
