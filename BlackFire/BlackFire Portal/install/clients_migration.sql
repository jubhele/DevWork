-- ============================================================
-- BlackFire Solutions — Clients Master Table + FK Wiring
-- Migration: run once against the Umlilo Portal database
-- Safe to re-run (IF NOT EXISTS / IF NOT EXISTS guards)
-- Run AFTER: rbac_full_migration.sql, safety_migration.sql
-- ============================================================

-- 1. Master clients table ----------------------------------------
CREATE TABLE IF NOT EXISTS bf_clients (
    id               INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(255)     NOT NULL,
    email            VARCHAR(150)     NOT NULL DEFAULT '',
    phone            VARCHAR(50)      NOT NULL DEFAULT '',
    vat_number       VARCHAR(50)      NOT NULL DEFAULT '',
    address          TEXT,
    contact_person   VARCHAR(255)     NOT NULL DEFAULT '',
    contact_details  TEXT,
    notes            TEXT,
    is_active        TINYINT(1)       NOT NULL DEFAULT 1,
    created_by       VARCHAR(100)     NOT NULL DEFAULT '',
    created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cl_name      (name),
    INDEX idx_cl_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure all columns exist if the table was created by an earlier schema version
ALTER TABLE bf_clients
    ADD COLUMN IF NOT EXISTS phone           VARCHAR(50)  NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS vat_number      VARCHAR(50)  NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS address         TEXT,
    ADD COLUMN IF NOT EXISTS contact_person  VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS contact_details TEXT,
    ADD COLUMN IF NOT EXISTS notes           TEXT,
    ADD COLUMN IF NOT EXISTS created_by      VARCHAR(100) NOT NULL DEFAULT '';


-- 2. Seed known clients -----------------------------------------
INSERT INTO bf_clients (name, email, phone, vat_number, address, contact_person, notes, created_by)
VALUES (
    'AECI Chempark',
    'procurement@aeci.co.za',
    '+27 11 806 9111',
    '',
    'Modderfontein, Gauteng / Somerset West, Western Cape',
    '',
    'Primary client. AECI Group industrial chemical manufacturing park.',
    'system'
)
ON DUPLICATE KEY UPDATE name = name;


-- 3. Add client_id FK columns to transactional tables -----------
ALTER TABLE bf_callouts
    ADD COLUMN IF NOT EXISTS client_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK to bf_clients.id',
    ADD INDEX IF NOT EXISTS idx_co_client_id (client_id);

ALTER TABLE bf_quotes
    ADD COLUMN IF NOT EXISTS client_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK to bf_clients.id',
    ADD INDEX IF NOT EXISTS idx_q_client_id (client_id);

ALTER TABLE bf_invoices
    ADD COLUMN IF NOT EXISTS client_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK to bf_clients.id',
    ADD INDEX IF NOT EXISTS idx_inv_client_id (client_id);


-- 4. Link portal users to clients --------------------------------
-- NULL = internal staff user; non-null = client portal user scoped to that client
ALTER TABLE bf_users
    ADD COLUMN IF NOT EXISTS client_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'NULL = internal staff. Non-null = client portal user linked to this client.',
    ADD INDEX IF NOT EXISTS idx_us_client_id (client_id);


-- 5. Back-fill: link existing AECI rows to the seeded client ----
UPDATE bf_callouts
    SET client_id = (SELECT id FROM bf_clients WHERE name = 'AECI Chempark' LIMIT 1)
    WHERE LOWER(client_name) LIKE '%aeci%'
      AND client_id IS NULL;

UPDATE bf_quotes
    SET client_id = (SELECT id FROM bf_clients WHERE name = 'AECI Chempark' LIMIT 1)
    WHERE LOWER(client_name) LIKE '%aeci%'
      AND client_id IS NULL;

UPDATE bf_invoices
    SET client_id = (SELECT id FROM bf_clients WHERE name = 'AECI Chempark' LIMIT 1)
    WHERE LOWER(client_name) LIKE '%aeci%'
      AND client_id IS NULL;


-- 6. RBAC: client management permissions ------------------------
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

-- End of migration
