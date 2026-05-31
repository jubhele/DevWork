-- ============================================================
-- Migration: bf_safety_personnel → user_id FK + audit FKs
-- BlackFire Portal
-- Created: 2026-05-31
--
-- 1. Adds user_id (FK → bf_users) as the authoritative personnel link.
-- 2. Backfills ALL rows — portal_user_id first, then email match,
--    then name match. Unresolvable rows are surfaced at the end.
-- 3. Adds created_by_id, updated_by_id, removed_by_id (FK → bf_users)
--    backfilled from the existing VARCHAR username columns.
--
-- Safe to re-run (IF NOT EXISTS / DROP IF EXISTS guards throughout).
-- ============================================================

SET NAMES utf8mb4;

-- ── 1. user_id column ─────────────────────────────────────────
ALTER TABLE `bf_safety_personnel`
  ADD COLUMN IF NOT EXISTS `user_id` INT UNSIGNED NULL AFTER `file_ref`;

-- ── 2a. Backfill from portal_user_id (exact, most reliable) ───
UPDATE `bf_safety_personnel`
   SET `user_id` = `portal_user_id`
 WHERE `portal_user_id` IS NOT NULL
   AND `user_id` IS NULL;

-- ── 2b. Backfill standalone rows → match by email ─────────────
UPDATE `bf_safety_personnel` sp
 INNER JOIN `bf_users` u
         ON LOWER(TRIM(u.email)) = LOWER(TRIM(sp.email))
        AND sp.email IS NOT NULL AND TRIM(sp.email) != ''
   SET sp.`user_id` = u.id,
       sp.`portal_user_id` = u.id   -- keep in sync for legacy queries
 WHERE sp.`user_id` IS NULL;

-- ── 2c. Backfill remaining → match by full name ───────────────
UPDATE `bf_safety_personnel` sp
 INNER JOIN `bf_users` u
         ON LOWER(TRIM(u.name)) = LOWER(TRIM(sp.full_name))
   SET sp.`user_id` = u.id,
       sp.`portal_user_id` = u.id
 WHERE sp.`user_id` IS NULL;

-- ── 2d. Surface unresolvable rows for manual review ───────────
-- (These must be resolved before the NOT NULL constraint can be added)
SELECT
    sp.id,
    sp.file_ref,
    sp.full_name,
    sp.email,
    sp.portal_user_id,
    'UNRESOLVED — no matching portal user' AS status
FROM `bf_safety_personnel` sp
WHERE sp.user_id IS NULL;

-- ── 3. UNIQUE constraint (one user per file) ──────────────────
ALTER TABLE `bf_safety_personnel`
  ADD UNIQUE KEY IF NOT EXISTS `uk_sp_file_user` (`file_ref`, `user_id`);

-- ── 4. FK: user_id → bf_users ─────────────────────────────────
ALTER TABLE `bf_safety_personnel`
  DROP FOREIGN KEY IF EXISTS `fk_sp_user`;
ALTER TABLE `bf_safety_personnel`
  ADD CONSTRAINT `fk_sp_user`
  FOREIGN KEY (`user_id`) REFERENCES `bf_users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── 5. Audit FK columns ───────────────────────────────────────
ALTER TABLE `bf_safety_personnel`
  ADD COLUMN IF NOT EXISTS `created_by_id` INT UNSIGNED NULL AFTER `created_by`,
  ADD COLUMN IF NOT EXISTS `updated_by_id` INT UNSIGNED NULL AFTER `updated_at`,
  ADD COLUMN IF NOT EXISTS `removed_by_id` INT UNSIGNED NULL AFTER `removed_by`;

-- ── 5a. Backfill created_by_id from username ──────────────────
UPDATE `bf_safety_personnel` sp
 INNER JOIN `bf_users` u ON u.username = sp.created_by
   SET sp.`created_by_id` = u.id
 WHERE sp.`created_by_id` IS NULL AND sp.`created_by` != '';

-- ── 5b. Backfill removed_by_id from username ──────────────────
UPDATE `bf_safety_personnel` sp
 INNER JOIN `bf_users` u ON u.username = sp.removed_by
   SET sp.`removed_by_id` = u.id
 WHERE sp.`removed_by_id` IS NULL
   AND sp.`removed_by` IS NOT NULL
   AND sp.`removed_by` != '';

-- ── 6. FK constraints for audit columns ───────────────────────
ALTER TABLE `bf_safety_personnel`
  DROP FOREIGN KEY IF EXISTS `fk_sp_created_by`,
  DROP FOREIGN KEY IF EXISTS `fk_sp_updated_by`,
  DROP FOREIGN KEY IF EXISTS `fk_sp_removed_by`;

ALTER TABLE `bf_safety_personnel`
  ADD CONSTRAINT `fk_sp_created_by`
  FOREIGN KEY (`created_by_id`) REFERENCES `bf_users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sp_updated_by`
  FOREIGN KEY (`updated_by_id`) REFERENCES `bf_users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sp_removed_by`
  FOREIGN KEY (`removed_by_id`) REFERENCES `bf_users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Done ──────────────────────────────────────────────────────
SELECT
    COUNT(*)                                          AS total_rows,
    SUM(user_id IS NOT NULL)                          AS rows_with_user_id,
    SUM(user_id IS NULL)                              AS rows_unresolved,
    SUM(created_by_id IS NOT NULL)                    AS rows_with_created_by_id,
    SUM(removed_by_id IS NOT NULL AND removed_at IS NOT NULL) AS rows_with_removed_by_id
FROM `bf_safety_personnel`;
