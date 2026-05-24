-- ============================================================
-- bf_attachments — Generic File Attachment Store
-- Migration: run after safety_migration.sql
-- Used by: files.php, safety_compliance.php, and any future
-- entity that needs document attachments.
-- ============================================================

CREATE TABLE IF NOT EXISTS bf_attachments (
    id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    entity_type   VARCHAR(30)   NOT NULL,           -- 'callout','invoice','quote','payment','safety_file','safety_compliance'
    entity_ref    VARCHAR(50)   NOT NULL,           -- ref_id string OR numeric PK (as char) for compliance records
    original_name VARCHAR(255)  NOT NULL,
    stored_name   VARCHAR(255)  NOT NULL,           -- random hex filename on disk
    file_size     INT UNSIGNED  NOT NULL DEFAULT 0, -- bytes
    mime_type     VARCHAR(100)  NOT NULL DEFAULT '',
    uploaded_by   VARCHAR(100)  NOT NULL DEFAULT '',
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_att_entity (entity_type, entity_ref),
    UNIQUE KEY uq_stored_name (stored_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- End of migration
