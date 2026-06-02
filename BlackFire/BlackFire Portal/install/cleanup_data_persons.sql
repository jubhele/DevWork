-- ================================================================
-- Data Cleanup: Replace all removed-user references across ALL tables
-- with confirmed real portal users.
--
-- Confirmed real users: j.shange, z.myeza, sibu, penny.nzimande
-- Removed:  kitso.marupi, j.mthembu, r.khumalo, l.sithole, n.sithole
--           (plus Thabo Mokoena, Maria Coetzee — never had portal accounts)
--
-- Run AFTER migration_finalize_person_cleanup.sql
-- (all text person columns already dropped before this runs)
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Session variables ─────────────────────────────────────────────
SET @uid_jshange    = (SELECT id FROM bf_users WHERE username = 'j.shange'       LIMIT 1);
SET @uid_zmyeza     = (SELECT id FROM bf_users WHERE username = 'z.myeza'        LIMIT 1);
SET @uid_sibu       = (SELECT id FROM bf_users WHERE username = 'sibu'           LIMIT 1);
SET @uid_penny      = (SELECT id FROM bf_users WHERE username = 'penny.nzimande' LIMIT 1);
SET @aeci_id        = (SELECT id FROM bf_clients WHERE name = 'AECI Chempark'    LIMIT 1);
SET @jshange_email  = (SELECT email FROM bf_users WHERE username = 'j.shange'    LIMIT 1);

SELECT
  CONCAT('j.shange id  = ', IFNULL(@uid_jshange,'NOT FOUND')) AS v1,
  CONCAT('z.myeza id   = ', IFNULL(@uid_zmyeza, 'NOT FOUND')) AS v2,
  CONCAT('sibu id      = ', IFNULL(@uid_sibu,   'NOT FOUND')) AS v3,
  CONCAT('penny id     = ', IFNULL(@uid_penny,  'NOT FOUND')) AS v4;

-- ════════════════════════════════════════════════════════════
-- 1. bf_digital_signatures
--    Remove records where internal removed staff were the SIGNERS.
--    Client signers (Yolanda Herbst, Simphiwe Ndevu) are external — keep.
-- ════════════════════════════════════════════════════════════

DELETE FROM bf_digital_signatures
 WHERE signer_name IN ('James Mthembu','Refilwe Khumalo','Kitso Marupi')
   AND signer_company = 'Astute Insights Pty Ltd';

-- Update created_by (still a text column — not yet migrated to FK)
UPDATE bf_digital_signatures SET created_by = 'j.shange' WHERE created_by IN ('n.sithole','l.sithole');
UPDATE bf_digital_signatures SET created_by = 'z.myeza'  WHERE created_by = 'kitso.marupi';

-- ════════════════════════════════════════════════════════════
-- 2. bf_safety_personnel
--    §1 of finalize migration purged all rows with user_id IS NULL.
--    Re-insert with user_id FK for files still in scope.
--    SAF-150125-0001 and SAF-120625-0001 removed — not in scope.
--    (SAF-120326-0001 already handled by fix_saf_120326_0001_personnel.sql)
-- ════════════════════════════════════════════════════════════

-- Only delete for files that actually exist (avoids phantom FK errors)
DELETE sp FROM bf_safety_personnel sp
  JOIN bf_safety_files sf ON sf.ref_id = sp.file_ref
 WHERE sp.file_ref IN (
   'SAF-150925-0001','SAF-150126-0001','SAF-210526-0001'
 );

-- INSERT ... SELECT: only inserts a row when the file_ref exists in bf_safety_files.
-- If a safety file hasn't been seeded yet the row is silently skipped.

INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_jshange,'Astute Insights (Pty) Ltd', 1, '2025-09-15 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-150925-0001' LIMIT 1;
INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_zmyeza, 'Astute Insights (Pty) Ltd', 1, '2025-09-15 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-150925-0001' LIMIT 1;
INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_sibu,   'Astute Insights (Pty) Ltd', 1, '2025-09-15 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-150925-0001' LIMIT 1;
INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_penny,  'Astute Insights (Pty) Ltd', 1, '2025-09-15 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-150925-0001' LIMIT 1;

INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_jshange,'Astute Insights (Pty) Ltd', 1, '2026-01-15 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-150126-0001' LIMIT 1;
INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_zmyeza, 'Astute Insights (Pty) Ltd', 1, '2026-01-15 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-150126-0001' LIMIT 1;
INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_sibu,   'Astute Insights (Pty) Ltd', 1, '2026-01-15 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-150126-0001' LIMIT 1;
INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_penny,  'Astute Insights (Pty) Ltd', 1, '2026-01-15 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-150126-0001' LIMIT 1;

INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_jshange,'Astute Insights (Pty) Ltd', 1, '2026-05-21 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-210526-0001' LIMIT 1;
INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_zmyeza, 'Astute Insights (Pty) Ltd', 1, '2026-05-21 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-210526-0001' LIMIT 1;
INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_sibu,   'Astute Insights (Pty) Ltd', 1, '2026-05-21 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-210526-0001' LIMIT 1;
INSERT INTO bf_safety_personnel (file_ref, user_id, company, is_active, created_at)
SELECT f.ref_id, @uid_penny,  'Astute Insights (Pty) Ltd', 1, '2026-05-21 10:00:00' FROM bf_safety_files f WHERE f.ref_id = 'SAF-210526-0001' LIMIT 1;

-- ════════════════════════════════════════════════════════════
-- 3. bf_safety_compliance — add created_by_id / updated_by_id if missing,
--    then set to z.myeza (safety officer owns all compliance records).
-- ════════════════════════════════════════════════════════════

ALTER TABLE bf_safety_compliance
  ADD COLUMN IF NOT EXISTS created_by_id INT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN IF NOT EXISTS updated_by_id INT UNSIGNED NULL AFTER created_by_id;

ALTER TABLE bf_safety_compliance
  DROP FOREIGN KEY IF EXISTS fk_sc_created_by,
  DROP FOREIGN KEY IF EXISTS fk_sc_updated_by;

ALTER TABLE bf_safety_compliance
  ADD CONSTRAINT fk_sc_created_by
    FOREIGN KEY (created_by_id) REFERENCES bf_users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_sc_updated_by
    FOREIGN KEY (updated_by_id) REFERENCES bf_users(id) ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE bf_safety_compliance SET created_by_id = @uid_zmyeza WHERE created_by_id IS NULL;
UPDATE bf_safety_compliance SET updated_by_id = @uid_zmyeza WHERE updated_by_id IS NULL;

-- ════════════════════════════════════════════════════════════
-- 4. bf_callouts — fix logged_by_user_id + assigned_to_user_id
--    logged_by text col dropped; NULL rows = previously n.sithole or l.sithole.
-- ════════════════════════════════════════════════════════════

-- Callouts logged by n.sithole / l.sithole → j.shange (admin)
UPDATE bf_callouts SET logged_by_user_id = @uid_jshange WHERE logged_by_user_id IS NULL;

-- Re-map assigned_to (username field) and tech (display name)
UPDATE bf_callouts
   SET assigned_to = 'z.myeza',
       tech        = 'Z. Myeza',
       assigned_to_user_id = @uid_zmyeza
 WHERE assigned_to = 'r.khumalo';

UPDATE bf_callouts
   SET assigned_to = 'sibu',
       tech        = 'S. Mtolo',
       assigned_to_user_id = @uid_sibu
 WHERE assigned_to IN ('j.mthembu','t.mokoena');

-- Any remaining NULL assigned_to_user_id → sibu (field technician)
UPDATE bf_callouts
   SET assigned_to_user_id = @uid_sibu,
       assigned_to         = 'sibu',
       tech                = 'S. Mtolo'
 WHERE assigned_to_user_id IS NULL;

-- ════════════════════════════════════════════════════════════
-- 5. bf_quotes — fix submitted_by_user_id + submitted_by text
-- ════════════════════════════════════════════════════════════

-- r.khumalo / j.mthembu submitted quotes → sibu
UPDATE bf_quotes
   SET submitted_by         = 'sibu',
       submitted_by_user_id = @uid_sibu
 WHERE submitted_by IN ('r.khumalo','j.mthembu')
    OR submitted_by_user_id IS NULL;

-- Ensure j.shange keeps his own submissions
UPDATE bf_quotes
   SET submitted_by_user_id = @uid_jshange
 WHERE submitted_by = 'j.shange';

-- ════════════════════════════════════════════════════════════
-- 6. bf_invoices — fix sent_by_user_id
--    sent_by text col dropped; NULL = was l.sithole → j.shange (billing)
-- ════════════════════════════════════════════════════════════

UPDATE bf_invoices SET sent_by_user_id = @uid_jshange WHERE sent_by_user_id IS NULL;

-- ════════════════════════════════════════════════════════════
-- 7. bf_payments — fix logged_by_user_id
--    logged_by text col dropped; NULL = was l.sithole → j.shange
-- ════════════════════════════════════════════════════════════

UPDATE bf_payments SET logged_by_user_id = @uid_jshange WHERE logged_by_user_id IS NULL;

-- ════════════════════════════════════════════════════════════
-- 8. bf_statements — fix released_by_user_id + from_email
--    released_by text col dropped; NULL = was l.sithole → j.shange
-- ════════════════════════════════════════════════════════════

UPDATE bf_statements
   SET released_by_user_id = @uid_jshange,
       from_email          = @jshange_email
 WHERE released_by_user_id IS NULL;

-- ════════════════════════════════════════════════════════════
-- 9. bf_attachments — add uploaded_by_id if missing, then populate
-- ════════════════════════════════════════════════════════════

ALTER TABLE bf_attachments
  ADD COLUMN IF NOT EXISTS uploaded_by_id INT UNSIGNED NULL AFTER uploaded_by;

ALTER TABLE bf_attachments
  DROP FOREIGN KEY IF EXISTS fk_att_uploaded_by;

ALTER TABLE bf_attachments
  ADD CONSTRAINT fk_att_uploaded_by
    FOREIGN KEY (uploaded_by_id) REFERENCES bf_users(id) ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE bf_attachments SET uploaded_by_id = @uid_sibu    WHERE uploaded_by_id IS NULL AND entity_type = 'callout';
UPDATE bf_attachments SET uploaded_by_id = @uid_jshange WHERE uploaded_by_id IS NULL AND entity_type = 'payment';
UPDATE bf_attachments SET uploaded_by_id = @uid_zmyeza  WHERE uploaded_by_id IS NULL;

-- ════════════════════════════════════════════════════════════
-- 10. bf_policy_acks
--     Table was cleared in §6 of finalize migration.
--     Re-seed using recipient_id FK (no text cols).
-- ════════════════════════════════════════════════════════════

INSERT IGNORE INTO bf_policy_acks
  (file_ref, policy_title, token, recipient_id, created_by_id,
   status, sent_at, acked_at, acked_ip, created_at)
VALUES
-- SAF-150126-0001 — Jan 2026: all 4 real users acknowledge updated policy
('SAF-150126-0001','Health & Safety Policy — Astute Insights 2026',
 'pa0300000000000000000000000000000000000000000000000000000000000003',
 @uid_zmyeza, @uid_jshange,
 'Acknowledged','2026-01-15 08:00:00','2026-01-15 09:18:33','196.6.14.55','2026-01-15 08:00:00'),

('SAF-150126-0001','Health & Safety Policy — Astute Insights 2026',
 'pa0400000000000000000000000000000000000000000000000000000000000004',
 @uid_sibu, @uid_jshange,
 'Acknowledged','2026-01-15 08:00:00','2026-01-15 10:22:15','196.6.14.55','2026-01-15 08:00:00'),

('SAF-150126-0001','Health & Safety Policy — Astute Insights 2026',
 'pa0500000000000000000000000000000000000000000000000000000000000005',
 @uid_penny, @uid_jshange,
 'Acknowledged','2026-01-15 08:00:00','2026-01-15 11:05:44','196.6.14.55','2026-01-15 08:00:00'),

('SAF-150126-0001','Health & Safety Policy — Astute Insights 2026',
 'pa0600000000000000000000000000000000000000000000000000000000000006',
 @uid_jshange, @uid_jshange,
 'Acknowledged','2026-01-15 08:00:00','2026-01-15 11:38:02','196.6.14.55','2026-01-15 08:00:00');

-- ════════════════════════════════════════════════════════════
-- 11. Verify — all counts should be 0
-- ════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'bf_safety_compliance created_by_id NULL' AS check_name, COUNT(*) AS cnt
  FROM bf_safety_compliance WHERE created_by_id IS NULL
UNION ALL
SELECT 'bf_safety_compliance updated_by_id NULL', COUNT(*)
  FROM bf_safety_compliance WHERE updated_by_id IS NULL
UNION ALL
SELECT 'bf_callouts logged_by_user_id NULL', COUNT(*)
  FROM bf_callouts WHERE logged_by_user_id IS NULL
UNION ALL
SELECT 'bf_callouts assigned_to_user_id NULL', COUNT(*)
  FROM bf_callouts WHERE assigned_to_user_id IS NULL
UNION ALL
SELECT 'bf_quotes submitted_by_user_id NULL', COUNT(*)
  FROM bf_quotes WHERE submitted_by_user_id IS NULL
UNION ALL
SELECT 'bf_invoices sent_by_user_id NULL', COUNT(*)
  FROM bf_invoices WHERE sent_by_user_id IS NULL
UNION ALL
SELECT 'bf_payments logged_by_user_id NULL', COUNT(*)
  FROM bf_payments WHERE logged_by_user_id IS NULL
UNION ALL
SELECT 'bf_statements released_by_user_id NULL', COUNT(*)
  FROM bf_statements WHERE released_by_user_id IS NULL
UNION ALL
SELECT 'bf_attachments uploaded_by_id NULL', COUNT(*)
  FROM bf_attachments WHERE uploaded_by_id IS NULL
UNION ALL
SELECT 'bf_safety_personnel user_id NULL', COUNT(*)
  FROM bf_safety_personnel WHERE user_id IS NULL
UNION ALL
SELECT 'bf_digital_signatures removed-user created_by', COUNT(*)
  FROM bf_digital_signatures WHERE created_by IN ('kitso.marupi','j.mthembu','r.khumalo','l.sithole','n.sithole')
ORDER BY cnt DESC, check_name;

-- Confirm real users present
SELECT username, name, role, active
  FROM bf_users
 WHERE username IN ('j.shange','z.myeza','sibu','penny.nzimande')
 ORDER BY username;

-- Digital signatures remaining (should show only valid external-signer + real-user records)
SELECT entity_type, entity_ref, document_label, signer_name, signer_company, status, created_by
  FROM bf_digital_signatures
 ORDER BY created_at;

-- ── End of cleanup_data_persons.sql ──────────────────────────────
