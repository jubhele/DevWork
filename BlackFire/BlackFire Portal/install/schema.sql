-- ═══════════════════════════════════════════════════════
-- BlackFire Solutions Portal — Database Schema v1.0
-- MySQL 5.7+ / 8.0+  ·  UTF-8 MB4
-- ═══════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_users` (
  `id`            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(50)      NOT NULL UNIQUE,
  `password_hash` VARCHAR(255)     NOT NULL,
  `name`          VARCHAR(100)     NOT NULL,
  `role`          ENUM('admin','manager','call_logger','junior_tech','senior_tech','client_support','admin_clerk','viewer','client') NOT NULL DEFAULT 'viewer',
  `title`         VARCHAR(100)     NOT NULL DEFAULT '',
  `email`         VARCHAR(150)     NOT NULL DEFAULT '',
  `active`        TINYINT(1)       NOT NULL DEFAULT 1,
  `last_login`    DATETIME         NULL,
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_role`     (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Clients ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_clients` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150) NOT NULL,
  `contact`     VARCHAR(100) NOT NULL DEFAULT '',
  `email`       VARCHAR(150) NOT NULL DEFAULT '',
  `phone`       VARCHAR(50)  NOT NULL DEFAULT '',
  `address`     VARCHAR(255) NOT NULL DEFAULT '',
  `active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Counters (auto-ref generation) ────────────────────
CREATE TABLE IF NOT EXISTS `bf_counters` (
  `counter_type`  VARCHAR(20)  NOT NULL,
  `current_value` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`counter_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Callouts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_callouts` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ref_id`        VARCHAR(20)  NOT NULL UNIQUE,
  `client_name`   VARCHAR(150) NOT NULL,
  `client_id`     INT UNSIGNED NULL,
  `client_email`  VARCHAR(150) NOT NULL DEFAULT '',
  `service`       VARCHAR(255) NOT NULL,
  `location`      VARCHAR(255) NOT NULL DEFAULT '',
  `tech`          VARCHAR(100) NOT NULL DEFAULT '',
  `assigned_to`   VARCHAR(50)  NOT NULL DEFAULT '',
  `priority`      ENUM('Normal','Urgent','Emergency') NOT NULL DEFAULT 'Normal',
  `status`        ENUM('Open','In Progress','Completed','Invoiced','Cancelled') NOT NULL DEFAULT 'Open',
  `approval_status` ENUM('not_required','pending','approved','rejected') NOT NULL DEFAULT 'not_required',
  `approval_token` VARCHAR(64) NULL,
  `approval_token_expires` DATETIME NULL,
  `callout_date`  DATE         NOT NULL,
  `callout_time`  TIME         NOT NULL DEFAULT '08:00:00',
  `notes`         TEXT         NULL,
  `logged_by`     VARCHAR(50)  NOT NULL DEFAULT '',
  `po`            VARCHAR(50)  NOT NULL DEFAULT '',
  `approved_at`   DATETIME     NULL,
  `approved_by`   VARCHAR(100) NOT NULL DEFAULT '',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ref`    (`ref_id`),
  KEY `idx_status` (`status`),
  KEY `idx_approval` (`approval_status`),
  KEY `idx_token` (`approval_token`),
  KEY `idx_date`   (`callout_date`),
  CONSTRAINT `fk_callout_client` FOREIGN KEY (`client_id`) REFERENCES `bf_clients`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Quotes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_quotes` (
  `id`                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ref_id`                VARCHAR(20)  NOT NULL UNIQUE,
  `client_name`           VARCHAR(150) NOT NULL,
  `client_id`             INT UNSIGNED NULL,
  `client_email`          VARCHAR(150) NOT NULL DEFAULT '',
  `status`                ENUM('Draft','Sent','Approved','Rejected','Pending Approval','Expired') NOT NULL DEFAULT 'Draft',
  `valid_until`           DATE         NULL,
  `quote_date`            DATE         NOT NULL,
  `submitted_by`          VARCHAR(50)  NOT NULL DEFAULT '',
  `source`                VARCHAR(50)  NOT NULL DEFAULT 'staff',
  `approval_status`       ENUM('pending','approved','rejected') NULL,
  `approval_token`        VARCHAR(64)  NULL,
  `approval_token_expires` DATETIME    NULL,
  `notes`                 TEXT         NULL,
  `total_amount`          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `approved_at`           DATETIME     NULL,
  `approved_by`           VARCHAR(100) NOT NULL DEFAULT '',
  `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ref`           (`ref_id`),
  KEY `idx_status`        (`status`),
  KEY `idx_approval`      (`approval_status`),
  KEY `idx_token`         (`approval_token`),
  CONSTRAINT `fk_quote_client` FOREIGN KEY (`client_id`) REFERENCES `bf_clients`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Quote Line Items ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_quote_items` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `quote_id`    INT UNSIGNED  NOT NULL,
  `description` VARCHAR(255)  NOT NULL,
  `qty`         DECIMAL(10,2) NOT NULL DEFAULT 1,
  `unit_price`  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `line_total`  DECIMAL(12,2) GENERATED ALWAYS AS (`qty` * `unit_price`) STORED,
  PRIMARY KEY (`id`),
  KEY `idx_quote` (`quote_id`),
  CONSTRAINT `fk_qi_quote` FOREIGN KEY (`quote_id`) REFERENCES `bf_quotes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Invoices ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_invoices` (
  `id`            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `ref_id`        VARCHAR(20)   NOT NULL UNIQUE,
  `client_name`   VARCHAR(150)  NOT NULL,
  `amount`        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `due_date`      DATE          NOT NULL,
  `status`        ENUM('Draft','Sent','Paid','Overdue','Cancelled') NOT NULL DEFAULT 'Draft',
  `quote_ref`     VARCHAR(20)   NOT NULL DEFAULT '',
  `callout_ref`   VARCHAR(20)   NOT NULL DEFAULT '',
  `po`            VARCHAR(50)   NOT NULL DEFAULT '',
  `invoice_date`  DATE          NOT NULL,
  `paid_date`     DATE          NULL,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ref`    (`ref_id`),
  KEY `idx_status` (`status`),
  KEY `idx_date`   (`invoice_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Bank / Transactions ────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_transactions` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `trans_date`  DATE          NOT NULL,
  `description` VARCHAR(255)  NOT NULL,
  `category`    VARCHAR(100)  NOT NULL DEFAULT 'General',
  `reference`   VARCHAR(50)   NOT NULL DEFAULT '',
  `credit`      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `debit`       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`trans_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Role Permissions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_role_permissions` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role`       VARCHAR(30)  NOT NULL,
  `permission` VARCHAR(60)  NOT NULL,
  UNIQUE KEY `uq_role_perm` (`role`, `permission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Service Categories ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_service_categories` (
  `id`    INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `name`  VARCHAR(80)      NOT NULL,
  `icon`  VARCHAR(10)      NOT NULL,
  `count` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cat_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Services ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_services` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(120) NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `active`      TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_svc_name` (`name`),
  KEY `idx_category` (`category_id`),
  CONSTRAINT `fk_svc_cat` FOREIGN KEY (`category_id`) REFERENCES `bf_service_categories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Payments ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_payments` (
  `id`           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `invoice_ref`  VARCHAR(20)   NOT NULL,
  `client_name`  VARCHAR(150)  NOT NULL DEFAULT '',
  `amount`       DECIMAL(12,2) NOT NULL,
  `payment_date` DATE          NOT NULL,
  `notes`        VARCHAR(255)  NOT NULL DEFAULT '',
  `logged_by`    VARCHAR(50)   NOT NULL DEFAULT '',
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inv` (`invoice_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Password Resets ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_password_resets` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `token`      VARCHAR(64)  NOT NULL,
  `expires_at` DATETIME     NOT NULL,
  `used`       TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`),
  KEY `idx_user`  (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Audit Log ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bf_audit_log` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(50)  NOT NULL,
  `action`     VARCHAR(50)  NOT NULL,
  `detail`     VARCHAR(500) NOT NULL DEFAULT '',
  `ip_address` VARCHAR(45)  NOT NULL DEFAULT '',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user`   (`username`),
  KEY `idx_action` (`action`),
  KEY `idx_time`   (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Sessions table (optional — file sessions work too) ─
CREATE TABLE IF NOT EXISTS `bf_sessions` (
  `session_id`  VARCHAR(128) NOT NULL,
  `username`    VARCHAR(50)  NOT NULL,
  `data`        TEXT         NOT NULL,
  `last_active` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ── Seed: Counters ─────────────────────────────────────
INSERT IGNORE INTO `bf_counters` (`counter_type`, `current_value`) VALUES
  ('co',  4),
  ('q',   3),
  ('inv', 3);

-- ── Seed: Default Client ───────────────────────────────
INSERT IGNORE INTO `bf_clients` (`id`, `name`, `contact`, `email`, `phone`, `address`) VALUES
  (1, 'AECI Chempark', 'Site Manager', 'manager@aeci.co.za', '011 000 0000', 'AECI Chempark, Modderfontein, Gauteng');

-- ── Seed: Sample Callouts (relative dates via stored proc) ─
-- (Seeded by installer PHP — dates calculated at runtime)

-- ── Seed: Default Users (passwords seeded by installer) ─
-- (Seeded by installer PHP using password_hash)
