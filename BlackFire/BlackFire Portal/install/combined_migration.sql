-- ================================================================
-- BlackFire Portal — Combined Idempotent Migration
-- BLKFR · IZILO-MIGRATE-COMBINED-001 · 2026-05-24
--
-- Safe to run on a database in ANY state:
--   • Tables that exist are left untouched
--   • Columns that exist are skipped
--   • Rows that exist are skipped (INSERT IGNORE / ON DUPLICATE KEY)
--   • Run this once or a hundred times — same result
--
-- Order: schema first, then data, then permissions
-- ================================================================

-- ── 0. Confirm we're on the right database ──────────────────────
SELECT DATABASE() AS running_on;

-- ================================================================
-- BLOCK 1 — TABLE CREATION (all IF NOT EXISTS)
-- ================================================================

-- 1A. Personnel per safety file
CREATE TABLE IF NOT EXISTS bf_safety_personnel (
    id              INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    file_ref        VARCHAR(30)      NOT NULL,
    full_name       VARCHAR(255)     NOT NULL,
    id_number       VARCHAR(30)      NOT NULL DEFAULT '',
    role            ENUM('Employee','Subcontractor','Supervisor','SHE Rep','First Aider','Other')
                                     NOT NULL DEFAULT 'Employee',
    company         VARCHAR(255)     NOT NULL DEFAULT '',
    is_active       TINYINT(1)       NOT NULL DEFAULT 1,
    removed_at      DATE             DEFAULT NULL,
    removed_reason  VARCHAR(500)     NOT NULL DEFAULT '',
    removed_by      VARCHAR(100)     NOT NULL DEFAULT '',
    created_by      VARCHAR(100)     NOT NULL DEFAULT '',
    created_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sp_file_ref  (file_ref),
    INDEX idx_sp_is_active (is_active),
    CONSTRAINT fk_sp_file
        FOREIGN KEY (file_ref) REFERENCES bf_safety_files(ref_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1B. Compliance records per safety file
CREATE TABLE IF NOT EXISTS bf_safety_compliance (
    id                   INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    file_ref             VARCHAR(30)      NOT NULL,
    personnel_id         INT UNSIGNED     DEFAULT NULL,
    compliance_type      VARCHAR(100)     NOT NULL,
    category             ENUM('Induction','Certification','Submission','Permit','Policy','Other')
                                          NOT NULL DEFAULT 'Other',
    scope                ENUM('Person','Company') NOT NULL DEFAULT 'Person',
    issue_date           DATE             DEFAULT NULL,
    expiry_date          DATE             DEFAULT NULL,
    renewal_months       TINYINT UNSIGNED NOT NULL DEFAULT 12,
    document_ref         VARCHAR(255)     NOT NULL DEFAULT '',
    notes                TEXT,
    created_by           VARCHAR(100)     NOT NULL DEFAULT '',
    updated_by           VARCHAR(100)     NOT NULL DEFAULT '',
    created_at           TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sc_file_ref     (file_ref),
    INDEX idx_sc_personnel_id (personnel_id),
    INDEX idx_sc_expiry_date  (expiry_date),
    CONSTRAINT fk_sc_file
        FOREIGN KEY (file_ref) REFERENCES bf_safety_files(ref_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sc_person
        FOREIGN KEY (personnel_id) REFERENCES bf_safety_personnel(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1C. Generic file attachments
CREATE TABLE IF NOT EXISTS bf_attachments (
    id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    entity_type   VARCHAR(30)   NOT NULL,
    entity_ref    VARCHAR(50)   NOT NULL,
    original_name VARCHAR(255)  NOT NULL,
    stored_name   VARCHAR(255)  NOT NULL,
    file_size     INT UNSIGNED  NOT NULL DEFAULT 0,
    mime_type     VARCHAR(100)  NOT NULL DEFAULT '',
    uploaded_by   VARCHAR(100)  NOT NULL DEFAULT '',
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_att_entity (entity_type, entity_ref),
    UNIQUE KEY uq_stored_name (stored_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1D. Portal user ↔ safety file join table
CREATE TABLE IF NOT EXISTS bf_safety_file_users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    file_ref   VARCHAR(30)  NOT NULL,
    user_id    INT          NOT NULL,
    added_by   VARCHAR(50)  NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_file_user (file_ref, user_id),
    KEY idx_file_ref (file_ref),
    KEY idx_user_id  (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1E. Policy acknowledgements
CREATE TABLE IF NOT EXISTS bf_policy_acks (
    id               INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    file_ref         VARCHAR(30)      NOT NULL,
    policy_title     VARCHAR(255)     NOT NULL DEFAULT '',
    policy_body      TEXT,
    recipient_name   VARCHAR(255)     NOT NULL DEFAULT '',
    recipient_email  VARCHAR(255)     NOT NULL DEFAULT '',
    token            CHAR(64)         NOT NULL DEFAULT '',
    status           ENUM('Pending','Sent','Acknowledged','Declined')
                                      NOT NULL DEFAULT 'Pending',
    sent_at          DATETIME         DEFAULT NULL,
    acked_at         DATETIME         DEFAULT NULL,
    acked_ip         VARCHAR(45)      NOT NULL DEFAULT '',
    created_by       VARCHAR(100)     NOT NULL DEFAULT '',
    created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_file_ref (file_ref),
    UNIQUE KEY uq_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- BLOCK 2 — COLUMN ADDITIONS (all checked before adding)
-- ================================================================

-- 2A. bf_safety_files — soft delete flag
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'bf_safety_files'
      AND COLUMN_NAME  = 'is_active'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE bf_safety_files ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER status',
    'SELECT ''bf_safety_files.is_active already exists — skipped'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2A index — only add if column was just created or index missing
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'bf_safety_files'
      AND INDEX_NAME   = 'idx_is_active'
);
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE bf_safety_files ADD INDEX idx_is_active (is_active)',
    'SELECT ''idx_is_active already exists — skipped'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2B. bf_safety_personnel — email column
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'bf_safety_personnel'
      AND COLUMN_NAME  = 'email'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE bf_safety_personnel ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT '''' AFTER company',
    'SELECT ''bf_safety_personnel.email already exists — skipped'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2C. bf_safety_personnel — portal_user_id column
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'bf_safety_personnel'
      AND COLUMN_NAME  = 'portal_user_id'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE bf_safety_personnel ADD COLUMN portal_user_id INT NULL DEFAULT NULL',
    'SELECT ''bf_safety_personnel.portal_user_id already exists — skipped'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2C unique key for portal_user_id
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'bf_safety_personnel'
      AND INDEX_NAME   = 'uk_file_portal_user'
);
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE bf_safety_personnel ADD UNIQUE KEY uk_file_portal_user (file_ref, portal_user_id)',
    'SELECT ''uk_file_portal_user already exists — skipped'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ================================================================
-- BLOCK 3 — COUNTER / REFERENCE DATA
-- ================================================================

-- 3A. Payment batch counter (PAY-YYYYMMDD-NNNN)
INSERT INTO bf_counters (counter_type, current_value)
VALUES ('pay', 0)
ON DUPLICATE KEY UPDATE counter_type = counter_type;

-- ================================================================
-- BLOCK 4 — RBAC PERMISSIONS (all INSERT IGNORE)
-- ================================================================

-- 4A. clients.* permissions
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

-- 4B. safety.* permissions for all existing roles
INSERT IGNORE INTO bf_role_permissions (role, permission) VALUES
    ('sysadmin',       'safety.view'),
    ('sysadmin',       'safety.create'),
    ('sysadmin',       'safety.update'),
    ('sysadmin',       'safety.delete'),
    ('sysadmin',       'safety.approve'),
    ('admin',          'safety.view'),
    ('admin',          'safety.create'),
    ('admin',          'safety.update'),
    ('admin',          'safety.delete'),
    ('admin',          'safety.approve'),
    ('manager',        'safety.view'),
    ('manager',        'safety.create'),
    ('manager',        'safety.update'),
    ('manager',        'safety.delete'),
    ('manager',        'safety.approve'),
    ('admin_clerk',    'safety.view'),
    ('admin_clerk',    'safety.create'),
    ('admin_clerk',    'safety.update'),
    ('senior_tech',    'safety.view'),
    ('senior_tech',    'safety.create'),
    ('senior_tech',    'safety.update'),
    ('call_logger',    'safety.view'),
    ('junior_tech',    'safety.view'),
    ('client_support', 'safety.view'),
    ('viewer',         'safety.view');

-- 4C. safety_officer role
INSERT IGNORE INTO bf_role_permissions (role, permission) VALUES
    ('safety_officer', 'safety.view'),
    ('safety_officer', 'safety.create'),
    ('safety_officer', 'safety.update');

-- ================================================================
-- BLOCK 5 — VERIFICATION
-- Show current state of everything touched above.
-- ================================================================

SELECT '── TABLES ──' AS check_section, '' AS detail, '' AS status
UNION ALL
SELECT 'bf_safety_personnel',  '',
    IF(COUNT(*) > 0, '✓ exists', '✗ MISSING')
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_safety_personnel'
UNION ALL
SELECT 'bf_safety_compliance',  '',
    IF(COUNT(*) > 0, '✓ exists', '✗ MISSING')
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_safety_compliance'
UNION ALL
SELECT 'bf_attachments', '',
    IF(COUNT(*) > 0, '✓ exists', '✗ MISSING')
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_attachments'
UNION ALL
SELECT 'bf_safety_file_users', '',
    IF(COUNT(*) > 0, '✓ exists', '✗ MISSING')
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_safety_file_users'
UNION ALL
SELECT 'bf_policy_acks', '',
    IF(COUNT(*) > 0, '✓ exists', '✗ MISSING')
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_policy_acks'
UNION ALL

SELECT '── COLUMNS ──', '', ''
UNION ALL
SELECT 'bf_safety_files.is_active', '',
    IF(COUNT(*) > 0, '✓ exists', '✗ MISSING')
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_safety_files' AND COLUMN_NAME = 'is_active'
UNION ALL
SELECT 'bf_safety_personnel.email', '',
    IF(COUNT(*) > 0, '✓ exists', '✗ MISSING')
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_safety_personnel' AND COLUMN_NAME = 'email'
UNION ALL
SELECT 'bf_safety_personnel.portal_user_id', '',
    IF(COUNT(*) > 0, '✓ exists', '✗ MISSING')
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bf_safety_personnel' AND COLUMN_NAME = 'portal_user_id'
UNION ALL

SELECT '── COUNTERS ──', '', ''
UNION ALL
SELECT 'bf_counters pay row', CAST(current_value AS CHAR),
    '✓ exists'
FROM bf_counters WHERE counter_type = 'pay'
UNION ALL

SELECT '── PERMISSIONS ──', '', ''
UNION ALL
SELECT CONCAT(role, ' — ', permission), '',
    '✓ seeded'
FROM bf_role_permissions
WHERE permission LIKE 'clients.%' OR permission LIKE 'safety.%'
ORDER BY 1;
