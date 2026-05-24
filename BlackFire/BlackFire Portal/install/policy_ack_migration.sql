-- ============================================================
-- Policy Acknowledgment Module Migration
-- Run AFTER safety_migration.sql
-- Tracks which employees have acknowledged H&S policies
-- ============================================================

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
    updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_file_ref (file_ref),
    UNIQUE KEY uq_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- End of migration
