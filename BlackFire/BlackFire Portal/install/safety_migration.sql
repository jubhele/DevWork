-- ============================================================
-- APS-EHS-FRM-010 Contractor Safety File Module
-- Migration: run once against the Umlilo Portal database
-- ============================================================

-- 1. Safety file header -----------------------------------------
CREATE TABLE IF NOT EXISTS bf_safety_files (
    id               INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    ref_id           VARCHAR(30)      NOT NULL,
    contractor       VARCHAR(255)     NOT NULL DEFAULT '',
    contractor_rep   VARCHAR(255)     NOT NULL DEFAULT '',
    appointee162     VARCHAR(255)     NOT NULL DEFAULT '',
    audit_date       DATE             DEFAULT NULL,
    region           VARCHAR(255)     NOT NULL DEFAULT '',
    audit_team       VARCHAR(255)     NOT NULL DEFAULT '',
    scope_of_work    TEXT,
    manpower         TINYINT UNSIGNED NOT NULL DEFAULT 0,
    supervisors      TINYINT UNSIGNED NOT NULL DEFAULT 0,
    she_reps         TINYINT UNSIGNED NOT NULL DEFAULT 0,
    first_aiders     TINYINT UNSIGNED NOT NULL DEFAULT 0,
    auditor_name     VARCHAR(255)     NOT NULL DEFAULT '',
    sign_off_date    DATE             DEFAULT NULL,
    status           ENUM('Draft','In Progress','Submitted','Approved')
                                      NOT NULL DEFAULT 'Draft',
    score            DECIMAL(5,2)     DEFAULT NULL,
    policy_email_sent   TINYINT(1)   NOT NULL DEFAULT 0,
    policy_email_date   DATE         DEFAULT NULL,
    policy_email_to     VARCHAR(255) NOT NULL DEFAULT '',
    created_by       VARCHAR(100)     NOT NULL DEFAULT '',
    updated_by       VARCHAR(100)     NOT NULL DEFAULT '',
    created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ref_id (ref_id),
    INDEX idx_status     (status),
    INDEX idx_audit_date (audit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. Per-item results -------------------------------------------
CREATE TABLE IF NOT EXISTS bf_safety_items (
    id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    file_ref     VARCHAR(30)   NOT NULL,
    section_key  CHAR(1)       NOT NULL,
    item_no      TINYINT UNSIGNED NOT NULL,
    result       ENUM('N/A','Not to Standard','To Standard') DEFAULT NULL,
    appointee    VARCHAR(255)  NOT NULL DEFAULT '',
    comments     TEXT,
    ap_status    ENUM('Open','In Progress','Resolved') NOT NULL DEFAULT 'Open',
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_item (file_ref, section_key, item_no),
    INDEX idx_file_ref (file_ref),
    CONSTRAINT fk_si_file
        FOREIGN KEY (file_ref) REFERENCES bf_safety_files(ref_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. Counter for ref IDs ----------------------------------------
INSERT INTO bf_counters (counter_type, current_value)
VALUES ('saf', 0)
ON DUPLICATE KEY UPDATE counter_type = counter_type;


-- 4. Grant files.php access for safety_file entity type ----------
-- (no schema change required — files.php allowlist updated in code)

-- End of migration
