-- ============================================================
-- Migration: bf_safety_files + bf_safety_items → user_id FKs
-- BlackFire Portal
-- Created: 2026-05-31
--
-- Adds user_id FK columns to replace plain-text person references:
--
--  bf_safety_files:
--    contractor_rep_id  → FK to bf_users (the contractor's named rep)
--    appointee162_id    → FK to bf_users (Sec 16.2 OHS Act appointee)
--    created_by_id      → FK to bf_users (who created the record)
--    updated_by_id      → FK to bf_users (who last updated)
--
--  bf_safety_items:
--    appointee_id       → FK to bf_users (person responsible for action item)
--
--  NOTE: auditor_name stays VARCHAR — the AECI auditor is an external
--        party, not a portal user.
--
-- Safe to re-run (IF NOT EXISTS / DROP IF EXISTS throughout).
-- ============================================================

SET NAMES utf8mb4;

-- ── 1. bf_safety_files: new FK columns ───────────────────────
ALTER TABLE `bf_safety_files`
  ADD COLUMN IF NOT EXISTS `contractor_rep_id` INT UNSIGNED NULL AFTER `contractor_rep`,
  ADD COLUMN IF NOT EXISTS `appointee162_id`   INT UNSIGNED NULL AFTER `appointee162`,
  ADD COLUMN IF NOT EXISTS `created_by_id`     INT UNSIGNED NULL AFTER `created_by`,
  ADD COLUMN IF NOT EXISTS `updated_by_id`     INT UNSIGNED NULL AFTER `updated_by`;

-- ── 2. Backfill created_by_id from username ───────────────────
UPDATE `bf_safety_files` sf
 INNER JOIN `bf_users` u ON u.username = sf.created_by
   SET sf.`created_by_id` = u.id
 WHERE sf.`created_by_id` IS NULL AND sf.`created_by` != '';

-- ── 3. Backfill updated_by_id from username ───────────────────
UPDATE `bf_safety_files` sf
 INNER JOIN `bf_users` u ON u.username = sf.updated_by
   SET sf.`updated_by_id` = u.id
 WHERE sf.`updated_by_id` IS NULL
   AND sf.`updated_by` IS NOT NULL AND sf.`updated_by` != '';

-- ── 4. Backfill contractor_rep_id from full name ──────────────
UPDATE `bf_safety_files` sf
 INNER JOIN `bf_users` u ON LOWER(TRIM(u.name)) = LOWER(TRIM(sf.contractor_rep))
   SET sf.`contractor_rep_id` = u.id
 WHERE sf.`contractor_rep_id` IS NULL
   AND sf.`contractor_rep` IS NOT NULL AND sf.`contractor_rep` != '';

-- ── 5. Backfill appointee162_id from full name ────────────────
UPDATE `bf_safety_files` sf
 INNER JOIN `bf_users` u ON LOWER(TRIM(u.name)) = LOWER(TRIM(sf.appointee162))
   SET sf.`appointee162_id` = u.id
 WHERE sf.`appointee162_id` IS NULL
   AND sf.`appointee162` IS NOT NULL AND sf.`appointee162` != '';

-- ── 6. FK constraints for bf_safety_files ────────────────────
ALTER TABLE `bf_safety_files`
  DROP FOREIGN KEY IF EXISTS `fk_sf_contractor_rep`,
  DROP FOREIGN KEY IF EXISTS `fk_sf_appointee162`,
  DROP FOREIGN KEY IF EXISTS `fk_sf_created_by`,
  DROP FOREIGN KEY IF EXISTS `fk_sf_updated_by`;

ALTER TABLE `bf_safety_files`
  ADD CONSTRAINT `fk_sf_contractor_rep`
    FOREIGN KEY (`contractor_rep_id`) REFERENCES `bf_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sf_appointee162`
    FOREIGN KEY (`appointee162_id`)   REFERENCES `bf_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sf_created_by`
    FOREIGN KEY (`created_by_id`)     REFERENCES `bf_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sf_updated_by`
    FOREIGN KEY (`updated_by_id`)     REFERENCES `bf_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 7. bf_safety_items: appointee_id column ──────────────────
ALTER TABLE `bf_safety_items`
  ADD COLUMN IF NOT EXISTS `appointee_id` INT UNSIGNED NULL AFTER `appointee`;

-- ── 8. Backfill appointee_id from full name ───────────────────
UPDATE `bf_safety_items` si
 INNER JOIN `bf_users` u ON LOWER(TRIM(u.name)) = LOWER(TRIM(si.appointee))
   SET si.`appointee_id` = u.id
 WHERE si.`appointee_id` IS NULL
   AND si.`appointee` IS NOT NULL AND si.`appointee` != '';

-- ── 9. FK constraint for bf_safety_items ─────────────────────
ALTER TABLE `bf_safety_items`
  DROP FOREIGN KEY IF EXISTS `fk_si_appointee`;

ALTER TABLE `bf_safety_items`
  ADD CONSTRAINT `fk_si_appointee`
    FOREIGN KEY (`appointee_id`) REFERENCES `bf_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Done ─────────────────────────────────────────────────────
SELECT
    COUNT(*)                                        AS total_files,
    SUM(contractor_rep_id IS NOT NULL)              AS files_with_rep_id,
    SUM(appointee162_id   IS NOT NULL)              AS files_with_appointee_id,
    SUM(created_by_id     IS NOT NULL)              AS files_with_created_by_id,
    SUM(updated_by_id     IS NOT NULL)              AS files_with_updated_by_id
FROM `bf_safety_files`;

SELECT
    COUNT(*)                                        AS total_items,
    SUM(appointee_id IS NOT NULL)                   AS items_with_appointee_id,
    SUM(appointee IS NOT NULL AND appointee != '')  AS items_with_appointee_text
FROM `bf_safety_items`;
