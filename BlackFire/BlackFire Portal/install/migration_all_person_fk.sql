-- ============================================================
-- Migration: Comprehensive person-text → user_id FK cleanup
-- All person references across ALL tables use user_id FK.
-- Free-text columns made nullable; FKs added where missing.
--
-- Run order: AFTER combined_migration.sql
--            AFTER migration_personnel_user_fk.sql
--            AFTER migration_safety_files_user_fk.sql
--            AFTER migration_drop_person_text_columns.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;   -- allow FK additions in any order

-- ════════════════════════════════════════════════════════════
-- 1. bf_safety_personnel — drop redundant text columns
-- ════════════════════════════════════════════════════════════

-- uk_file_portal_user is a composite UNIQUE KEY (file_ref, portal_user_id).
-- Must drop the index before dropping portal_user_id or MySQL errors with #1072.
ALTER TABLE bf_safety_personnel DROP INDEX uk_file_portal_user;

-- email/created_by/removed_by come from bf_users via JOIN; portal_user_id duplicates user_id
-- IF EXISTS guards against re-runs (email/created_by/removed_by already dropped in prior run)
ALTER TABLE bf_safety_personnel DROP COLUMN IF EXISTS email;
ALTER TABLE bf_safety_personnel DROP COLUMN IF EXISTS created_by;
ALTER TABLE bf_safety_personnel DROP COLUMN IF EXISTS removed_by;
ALTER TABLE bf_safety_personnel DROP COLUMN IF EXISTS portal_user_id;

-- ════════════════════════════════════════════════════════════
-- 2. bf_safety_files — drop text audit columns
-- ════════════════════════════════════════════════════════════

ALTER TABLE bf_safety_files DROP COLUMN created_by;
ALTER TABLE bf_safety_files DROP COLUMN updated_by;

-- ════════════════════════════════════════════════════════════
-- 3. bf_safety_compliance — add FK columns, backfill, then drop text
-- ════════════════════════════════════════════════════════════

ALTER TABLE `bf_safety_compliance`
  ADD COLUMN IF NOT EXISTS `created_by_id` INT UNSIGNED NULL AFTER `created_by`,
  ADD COLUMN IF NOT EXISTS `updated_by_id` INT UNSIGNED NULL AFTER `updated_by`;

UPDATE `bf_safety_compliance` sc
  JOIN `bf_users` u ON u.username = sc.created_by
   SET sc.created_by_id = u.id
 WHERE sc.created_by_id IS NULL AND sc.created_by IS NOT NULL;

UPDATE `bf_safety_compliance` sc
  JOIN `bf_users` u ON u.username = sc.updated_by
   SET sc.updated_by_id = u.id
 WHERE sc.updated_by_id IS NULL AND sc.updated_by IS NOT NULL;

ALTER TABLE `bf_safety_compliance`
  DROP FOREIGN KEY IF EXISTS `fk_sc_created_by`,
  DROP FOREIGN KEY IF EXISTS `fk_sc_updated_by`;
ALTER TABLE `bf_safety_compliance`
  ADD CONSTRAINT `fk_sc_created_by`
    FOREIGN KEY (`created_by_id`) REFERENCES `bf_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sc_updated_by`
    FOREIGN KEY (`updated_by_id`) REFERENCES `bf_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE bf_safety_compliance DROP COLUMN created_by;
ALTER TABLE bf_safety_compliance DROP COLUMN updated_by;

-- ════════════════════════════════════════════════════════════
-- 4. bf_attachments — add uploaded_by_id FK + backfill
-- ════════════════════════════════════════════════════════════

ALTER TABLE `bf_attachments`
  ADD COLUMN IF NOT EXISTS `uploaded_by_id` INT UNSIGNED NULL AFTER `uploaded_by`;

UPDATE `bf_attachments` a
  JOIN `bf_users` u ON u.username = a.uploaded_by
   SET a.uploaded_by_id = u.id
 WHERE a.uploaded_by_id IS NULL AND a.uploaded_by IS NOT NULL;

ALTER TABLE `bf_attachments`
  DROP FOREIGN KEY IF EXISTS `fk_att_uploaded_by`;
ALTER TABLE `bf_attachments`
  ADD CONSTRAINT `fk_att_uploaded_by`
    FOREIGN KEY (`uploaded_by_id`) REFERENCES `bf_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE bf_attachments DROP COLUMN uploaded_by;

-- ════════════════════════════════════════════════════════════
-- 5. bf_safety_file_users — add added_by_id FK + proper user FK
-- ════════════════════════════════════════════════════════════

ALTER TABLE `bf_safety_file_users`
  ADD COLUMN IF NOT EXISTS `added_by_id` INT UNSIGNED NULL AFTER `added_by`,
  MODIFY COLUMN `added_by` VARCHAR(50) NULL DEFAULT NULL;

UPDATE `bf_safety_file_users` sfu
  JOIN `bf_users` u ON u.username = sfu.added_by
   SET sfu.added_by_id = u.id
 WHERE sfu.added_by_id IS NULL AND sfu.added_by IS NOT NULL;

-- Add FK on user_id (was INT with no constraint)
ALTER TABLE `bf_safety_file_users`
  DROP FOREIGN KEY IF EXISTS `fk_sfu_user`,
  DROP FOREIGN KEY IF EXISTS `fk_sfu_added_by`;
ALTER TABLE `bf_safety_file_users`
  ADD CONSTRAINT `fk_sfu_user`
    FOREIGN KEY (`user_id`) REFERENCES `bf_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sfu_added_by`
    FOREIGN KEY (`added_by_id`) REFERENCES `bf_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ════════════════════════════════════════════════════════════
-- 6. bf_policy_acks — add created_by_id FK + backfill
--    recipient_name / recipient_email kept as text (external)
-- ════════════════════════════════════════════════════════════

ALTER TABLE `bf_policy_acks`
  ADD COLUMN IF NOT EXISTS `created_by_id` INT UNSIGNED NULL AFTER `created_by`,
  MODIFY COLUMN `created_by` VARCHAR(100) NULL DEFAULT NULL;

UPDATE `bf_policy_acks` pa
  JOIN `bf_users` u ON u.username = pa.created_by
   SET pa.created_by_id = u.id
 WHERE pa.created_by_id IS NULL AND pa.created_by IS NOT NULL;

ALTER TABLE `bf_policy_acks`
  DROP FOREIGN KEY IF EXISTS `fk_pa_created_by`;
ALTER TABLE `bf_policy_acks`
  ADD CONSTRAINT `fk_pa_created_by`
    FOREIGN KEY (`created_by_id`) REFERENCES `bf_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ════════════════════════════════════════════════════════════
-- 7. Replace Kitso Marupi with Zanele Myeza across ALL tables
--    Zanele Myeza (z.myeza) takes over all of Kitso Marupi's
--    roles across every safety file.
-- ════════════════════════════════════════════════════════════

SET @km_id = (SELECT id FROM bf_users WHERE username = 'kitso.marupi');
SET @zm_id = (SELECT id FROM bf_users WHERE username = 'z.myeza');

SELECT
    CONCAT('Kitso Marupi user_id  = ', IFNULL(@km_id, 'NOT FOUND')) AS km_check,
    CONCAT('Zanele Myeza user_id  = ', IFNULL(@zm_id, 'NOT FOUND')) AS zm_check;

-- 7a. bf_safety_items: swap appointee_id everywhere
UPDATE bf_safety_items
   SET appointee_id = @zm_id
 WHERE appointee_id = @km_id;

-- 7b. bf_safety_files: swap header-level person FKs
UPDATE bf_safety_files
   SET contractor_rep_id = @zm_id
 WHERE contractor_rep_id = @km_id;

UPDATE bf_safety_files
   SET appointee162_id = @zm_id
 WHERE appointee162_id = @km_id;

-- 7c. bf_safety_personnel — two cases:
--
--   Case A: file already has Zanele Myeza → soft-delete Kitso Marupi's row
--           (unique key prevents two rows with the same user_id per file)
UPDATE bf_safety_personnel
   SET is_active      = 0,
       removed_at     = CURDATE(),
       removed_reason = 'Replaced by Zanele Myeza',
       removed_by_id  = @zm_id
 WHERE user_id = @km_id
   AND file_ref IN (
       SELECT file_ref FROM (
           SELECT file_ref FROM bf_safety_personnel WHERE user_id = @zm_id
       ) AS zm_files
   );

--   Case B: file has only Kitso Marupi → re-point user_id to Zanele Myeza
--   (portal_user_id dropped in section 1 — user_id only)
UPDATE bf_safety_personnel
   SET user_id = @zm_id
 WHERE user_id = @km_id
   AND file_ref NOT IN (
       SELECT file_ref FROM (
           SELECT file_ref FROM bf_safety_personnel WHERE user_id = @zm_id
       ) AS zm_files
   );

-- ════════════════════════════════════════════════════════════
-- 8. General backfill — any other NULL user_id rows
-- ════════════════════════════════════════════════════════════

UPDATE bf_safety_personnel
   SET user_id = (SELECT MIN(id) FROM bf_users
                   WHERE LOWER(TRIM(bf_users.name))
                       = LOWER(TRIM(bf_safety_personnel.full_name)))
 WHERE user_id IS NULL
   AND full_name IS NOT NULL
   AND EXISTS (SELECT 1 FROM bf_users
                WHERE LOWER(TRIM(bf_users.name))
                    = LOWER(TRIM(bf_safety_personnel.full_name)));

-- Show any still-unresolved rows — each needs a portal user created
SELECT id, file_ref, full_name,
       'UNRESOLVED — create portal user then re-run' AS action_required
  FROM bf_safety_personnel
 WHERE user_id IS NULL;

-- ════════════════════════════════════════════════════════════
-- 8. Verify
-- ════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 1;

SELECT
    t.table_name,
    c.column_name,
    c.is_nullable,
    CASE WHEN fk.constraint_name IS NOT NULL THEN CONCAT('FK → ', fk.referenced_table_name, '.', fk.referenced_column_name)
         ELSE 'no FK'
    END AS fk_status
FROM information_schema.columns c
JOIN information_schema.tables  t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
LEFT JOIN information_schema.key_column_usage fk
       ON fk.table_schema    = c.table_schema
      AND fk.table_name      = c.table_name
      AND fk.column_name     = c.column_name
      AND fk.referenced_table_name IS NOT NULL
WHERE c.table_schema = DATABASE()
  AND c.table_name   IN ('bf_safety_personnel','bf_safety_compliance',
                         'bf_attachments','bf_safety_file_users',
                         'bf_policy_acks','bf_safety_files','bf_safety_items')
  AND c.column_name  REGEXP 'user_id|appointee_id|created_by_id|updated_by_id|removed_by_id|uploaded_by_id|added_by_id'
ORDER BY t.table_name, c.column_name;

-- End of migration
