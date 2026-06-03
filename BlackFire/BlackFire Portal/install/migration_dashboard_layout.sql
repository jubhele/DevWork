-- ============================================================
-- Migration: Dashboard Layout Persistence
-- BlackFire Portal
-- Created: 2026-06-02
--
-- 1. Adds dashboard_layout JSON column to bf_users so each user's
--    widget order/visibility follows them across devices and browsers.
-- 2. Creates bf_settings (key-value) for admin-level settings such
--    as the shared dashboard default layout.
--
-- Safe to re-run (IF NOT EXISTS / IF NOT EXISTS guards throughout).
-- ============================================================

SET NAMES utf8mb4;

-- 1. Per-user layout column
ALTER TABLE `bf_users`
  ADD COLUMN IF NOT EXISTS `dashboard_layout` JSON NULL DEFAULT NULL
    COMMENT 'Dashboard widget prefs: {enabled:{}, order:[], customized:bool, savedAt:ms}'
  AFTER `active`;

-- 2. Global settings store (tenant-aware from day one)
CREATE TABLE IF NOT EXISTS `bf_settings` (
  `host_company_id` INT          NOT NULL DEFAULT 1 COMMENT 'FK bf_host_companies.id — Phase 1 multi-tenancy',
  `setting_key`     VARCHAR(100) NOT NULL,
  `setting_value`   LONGTEXT     NULL,
  `updated_by`      VARCHAR(100) NOT NULL DEFAULT '',
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`host_company_id`, `setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Portal settings key-value store — scoped per host company';
