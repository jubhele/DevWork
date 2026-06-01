-- ============================================================
-- Migration: Finalize all person text-column cleanup
--
-- Consolidates all outstanding schema changes:
--   • bf_safety_personnel  — drop full_name, id_number, role
--   • bf_safety_items      — drop appointee (text)
--   • bf_safety_files      — drop contractor_rep, appointee162 (text)
--   • bf_safety_compliance — drop created_by, updated_by (text)
--   • bf_attachments       — drop uploaded_by (text)
--   • bf_policy_acks       — backfill created_by_id, drop created_by (text)
--   • bf_callouts          — backfill logged_by_user_id, drop logged_by (text)
--   • bf_payments          — backfill logged_by_user_id, drop logged_by (text)
--   • bf_invoices          — backfill sent_by_user_id, drop sent_by (text)
--   • bf_statements        — add released_by_user_id, backfill, drop released_by (text)
--   • bf_users             — delete seed-only portal accounts
--
-- Safe to re-run: all DROPs use IF EXISTS.
-- Run AFTER: combined_migration.sql, migration_safety_files_user_fk.sql,
--            migration_all_person_fk.sql, blackfire_testdata_part3.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ════════════════════════════════════════════════════════════
-- 1. bf_safety_personnel
-- ════════════════════════════════════════════════════════════

-- Rows with no user_id have no portal identity; purge before
-- dropping the only identification columns.
DELETE FROM bf_safety_personnel WHERE user_id IS NULL;

-- Index references portal_user_id — must go before the column drop.
ALTER TABLE bf_safety_personnel DROP INDEX IF EXISTS uk_file_portal_user;

ALTER TABLE bf_safety_personnel
  DROP COLUMN IF EXISTS full_name,
  DROP COLUMN IF EXISTS id_number,
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS removed_by,
  DROP COLUMN IF EXISTS portal_user_id;

-- ════════════════════════════════════════════════════════════
-- 2. bf_safety_items
-- ════════════════════════════════════════════════════════════

ALTER TABLE bf_safety_items
  DROP COLUMN IF EXISTS appointee;

-- ════════════════════════════════════════════════════════════
-- 3. bf_safety_files
-- ════════════════════════════════════════════════════════════

ALTER TABLE bf_safety_files
  DROP COLUMN IF EXISTS contractor_rep,
  DROP COLUMN IF EXISTS appointee162,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS updated_by;

-- ════════════════════════════════════════════════════════════
-- 4. bf_safety_compliance
-- ════════════════════════════════════════════════════════════

ALTER TABLE bf_safety_compliance
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS updated_by;

-- ════════════════════════════════════════════════════════════
-- 5. bf_attachments
-- ════════════════════════════════════════════════════════════

ALTER TABLE bf_attachments
  DROP COLUMN IF EXISTS uploaded_by;

-- ════════════════════════════════════════════════════════════
-- 6. bf_policy_acks — purge seed data, add created_by_id FK, drop text col
--    (bf_safety_file_users already dropped — skip)
-- ════════════════════════════════════════════════════════════

-- All existing rows are seed/test data — clear before schema change.
DELETE FROM bf_policy_acks;

ALTER TABLE bf_policy_acks
  ADD COLUMN IF NOT EXISTS created_by_id  INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS recipient_id   INT UNSIGNED NULL;

ALTER TABLE bf_policy_acks
  DROP FOREIGN KEY IF EXISTS fk_pa_created_by,
  DROP FOREIGN KEY IF EXISTS fk_pa_recipient;

ALTER TABLE bf_policy_acks
  ADD CONSTRAINT fk_pa_created_by
    FOREIGN KEY (created_by_id) REFERENCES bf_users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_pa_recipient
    FOREIGN KEY (recipient_id)  REFERENCES bf_users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE bf_policy_acks
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS recipient_name,
  DROP COLUMN IF EXISTS recipient_email;

-- ════════════════════════════════════════════════════════════
-- 7. bf_callouts — backfill logged_by_user_id, drop text
--    logged_by_user_id column already exists
-- ════════════════════════════════════════════════════════════

SET @src7 = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bf_callouts' AND column_name = 'logged_by');
SET @sql7 = IF(@src7 > 0, 'UPDATE bf_callouts c JOIN bf_users u ON u.username = c.logged_by SET c.logged_by_user_id = u.id WHERE c.logged_by_user_id IS NULL AND c.logged_by IS NOT NULL', 'SELECT 1');
PREPARE _s FROM @sql7; EXECUTE _s; DEALLOCATE PREPARE _s;

ALTER TABLE bf_callouts
  DROP FOREIGN KEY IF EXISTS fk_co_logged_by;
ALTER TABLE bf_callouts
  ADD CONSTRAINT fk_co_logged_by
    FOREIGN KEY (logged_by_user_id) REFERENCES bf_users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE bf_callouts
  DROP COLUMN IF EXISTS logged_by;

-- ════════════════════════════════════════════════════════════
-- 8. bf_payments — backfill logged_by_user_id, drop text
--    logged_by_user_id column already exists
-- ════════════════════════════════════════════════════════════

SET @src8 = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bf_payments' AND column_name = 'logged_by');
SET @sql8 = IF(@src8 > 0, 'UPDATE bf_payments p JOIN bf_users u ON u.username = p.logged_by SET p.logged_by_user_id = u.id WHERE p.logged_by_user_id IS NULL AND p.logged_by IS NOT NULL', 'SELECT 1');
PREPARE _s FROM @sql8; EXECUTE _s; DEALLOCATE PREPARE _s;

ALTER TABLE bf_payments
  DROP FOREIGN KEY IF EXISTS fk_pay_logged_by;
ALTER TABLE bf_payments
  ADD CONSTRAINT fk_pay_logged_by
    FOREIGN KEY (logged_by_user_id) REFERENCES bf_users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE bf_payments
  DROP COLUMN IF EXISTS logged_by;

-- ════════════════════════════════════════════════════════════
-- 9. bf_invoices — backfill sent_by_user_id, drop text
--    sent_by_user_id column already exists
-- ════════════════════════════════════════════════════════════

SET @src9 = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bf_invoices' AND column_name = 'sent_by');
SET @sql9 = IF(@src9 > 0, 'UPDATE bf_invoices i JOIN bf_users u ON u.username = i.sent_by SET i.sent_by_user_id = u.id WHERE i.sent_by_user_id IS NULL AND i.sent_by IS NOT NULL', 'SELECT 1');
PREPARE _s FROM @sql9; EXECUTE _s; DEALLOCATE PREPARE _s;

ALTER TABLE bf_invoices
  DROP FOREIGN KEY IF EXISTS fk_inv_sent_by;
ALTER TABLE bf_invoices
  ADD CONSTRAINT fk_inv_sent_by
    FOREIGN KEY (sent_by_user_id) REFERENCES bf_users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE bf_invoices
  DROP COLUMN IF EXISTS sent_by;

-- ════════════════════════════════════════════════════════════
-- 10. bf_statements — add released_by_user_id, backfill, drop text
-- ════════════════════════════════════════════════════════════

ALTER TABLE bf_statements
  ADD COLUMN IF NOT EXISTS released_by_user_id INT UNSIGNED NULL AFTER released_by;

SET @src10 = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bf_statements' AND column_name = 'released_by');
SET @sql10 = IF(@src10 > 0, 'UPDATE bf_statements s JOIN bf_users u ON u.username = s.released_by SET s.released_by_user_id = u.id WHERE s.released_by_user_id IS NULL AND s.released_by IS NOT NULL', 'SELECT 1');
PREPARE _s FROM @sql10; EXECUTE _s; DEALLOCATE PREPARE _s;

ALTER TABLE bf_statements
  DROP FOREIGN KEY IF EXISTS fk_stmt_released_by;
ALTER TABLE bf_statements
  ADD CONSTRAINT fk_stmt_released_by
    FOREIGN KEY (released_by_user_id) REFERENCES bf_users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE bf_statements
  DROP COLUMN IF EXISTS released_by;

-- ════════════════════════════════════════════════════════════
-- 11. Remove seed-only portal accounts
--     FK ON DELETE CASCADE / SET NULL handles child rows.
-- ════════════════════════════════════════════════════════════

DELETE FROM bf_users
 WHERE username IN (
   'kitso.marupi',
   'j.mthembu',
   'r.khumalo',
   'l.sithole',
   'n.sithole'
 );

-- ════════════════════════════════════════════════════════════
-- 12. Verify — expected 0 rows (all text cols gone)
-- ════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 1;

SELECT table_name, column_name
  FROM information_schema.columns
 WHERE table_schema = DATABASE()
   AND (
       (table_name = 'bf_safety_personnel'  AND column_name IN ('full_name','id_number','role','email','created_by','removed_by','portal_user_id'))
    OR (table_name = 'bf_safety_items'      AND column_name = 'appointee')
    OR (table_name = 'bf_safety_files'      AND column_name IN ('contractor_rep','appointee162','created_by','updated_by'))
    OR (table_name = 'bf_safety_compliance' AND column_name IN ('created_by','updated_by'))
    OR (table_name = 'bf_attachments'       AND column_name = 'uploaded_by')
    OR (table_name = 'bf_policy_acks'       AND column_name = 'created_by')
    OR (table_name = 'bf_callouts'          AND column_name = 'logged_by')
    OR (table_name = 'bf_payments'          AND column_name = 'logged_by')
    OR (table_name = 'bf_invoices'          AND column_name = 'sent_by')
    OR (table_name = 'bf_statements'        AND column_name = 'released_by')
   )
 ORDER BY table_name, column_name;

-- Confirm confirmed portal users still present:
SELECT username, name, role, active
  FROM bf_users
 WHERE username IN ('j.shange','z.myeza','sibu','penny.nzimande')
 ORDER BY username;
