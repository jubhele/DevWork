-- ============================================================
-- Personnel & Compliance Tracking
-- Migration: run against the Umlilo Portal database after safety_migration.sql
-- ============================================================

-- 1. Personnel (employees / subcontractors per safety file) ---------
CREATE TABLE IF NOT EXISTS bf_safety_personnel (
    id              INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    file_ref        VARCHAR(30)      NOT NULL,
    full_name       VARCHAR(255)     NOT NULL,
    id_number       VARCHAR(30)      NOT NULL DEFAULT '',
    role            ENUM('Employee','Subcontractor','Supervisor','SHE Rep','First Aider','Other')
                                     NOT NULL DEFAULT 'Employee',
    company         VARCHAR(255)     NOT NULL DEFAULT '',
    -- Soft delete: records are never physically removed (audit requirement)
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


-- 2. Compliance records (training, certifications, annual submissions) ---
CREATE TABLE IF NOT EXISTS bf_safety_compliance (
    id                   INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    file_ref             VARCHAR(30)      NOT NULL,
    personnel_id         INT UNSIGNED     DEFAULT NULL,    -- NULL = company/file level
    compliance_type      VARCHAR(100)     NOT NULL,        -- e.g. 'AECI Site Induction'
    category             ENUM('Induction','Certification','Submission','Permit','Policy','Other')
                                          NOT NULL DEFAULT 'Other',
    scope                ENUM('Person','Company') NOT NULL DEFAULT 'Person',
    issue_date           DATE             DEFAULT NULL,
    expiry_date          DATE             DEFAULT NULL,
    renewal_months       TINYINT UNSIGNED NOT NULL DEFAULT 12,  -- 0 = does not expire
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

-- End of migration
