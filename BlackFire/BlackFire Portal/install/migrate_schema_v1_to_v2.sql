-- ═══════════════════════════════════════════════════════════════════
--  BlackFire Solutions Portal — Schema Migration v1 → v2
--  Run this if your database was created from schema v1.0 (pre-2026-05-18)
--  All statements use IF NOT EXISTS / IGNORE — safe to re-run.
-- ═══════════════════════════════════════════════════════════════════

USE blackfire_aeci;

-- ── bf_users: add email column if missing ──
ALTER TABLE `bf_users`
  ADD COLUMN IF NOT EXISTS `email` VARCHAR(150) NOT NULL DEFAULT '' AFTER `name`;

-- ── bf_callouts: add client_email and approval columns if missing ──
ALTER TABLE `bf_callouts`
  ADD COLUMN IF NOT EXISTS `client_email`             VARCHAR(150) NOT NULL DEFAULT '' AFTER `client_name`,
  ADD COLUMN IF NOT EXISTS `approval_status`          ENUM('not_required','pending','approved','rejected') NOT NULL DEFAULT 'not_required' AFTER `status`,
  ADD COLUMN IF NOT EXISTS `approval_token`           VARCHAR(64) NULL AFTER `approval_status`,
  ADD COLUMN IF NOT EXISTS `approval_token_expires`   DATETIME NULL AFTER `approval_token`,
  ADD COLUMN IF NOT EXISTS `approved_at`              DATETIME NULL AFTER `po`,
  ADD COLUMN IF NOT EXISTS `approved_by`              VARCHAR(100) NOT NULL DEFAULT '' AFTER `approved_at`;

-- ── bf_quotes: add client_email and approval token columns if missing ──
ALTER TABLE `bf_quotes`
  ADD COLUMN IF NOT EXISTS `client_email`             VARCHAR(150) NOT NULL DEFAULT '' AFTER `client_name`,
  ADD COLUMN IF NOT EXISTS `approval_token`           VARCHAR(64) NULL AFTER `approval_status`,
  ADD COLUMN IF NOT EXISTS `approval_token_expires`   DATETIME NULL AFTER `approval_token`,
  ADD COLUMN IF NOT EXISTS `approved_at`              DATETIME NULL AFTER `total_amount`,
  ADD COLUMN IF NOT EXISTS `approved_by`              VARCHAR(100) NOT NULL DEFAULT '' AFTER `approved_at`;

-- ── bf_password_resets: create if missing ──
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
