-- ================================================================
-- Drop retired safety files SAF-150125-0001 and SAF-120625-0001
-- from the live database. Run once against the live DB.
-- These files are no longer seeded — this removes any existing rows.
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM bf_safety_items      WHERE file_ref IN ('SAF-150125-0001','SAF-120625-0001');
DELETE FROM bf_safety_personnel  WHERE file_ref IN ('SAF-150125-0001','SAF-120625-0001');
DELETE FROM bf_safety_compliance WHERE file_ref IN ('SAF-150125-0001','SAF-120625-0001');
DELETE FROM bf_policy_acks       WHERE file_ref IN ('SAF-150125-0001','SAF-120625-0001');
DELETE FROM bf_attachments       WHERE entity_ref IN ('SAF-150125-0001','SAF-120625-0001') AND entity_type = 'safety_file';
DELETE FROM bf_safety_files      WHERE ref_id    IN ('SAF-150125-0001','SAF-120625-0001');

SET FOREIGN_KEY_CHECKS = 1;

-- Verify — both counts should be 0
SELECT 'SAF-150125-0001' AS ref_id, COUNT(*) AS remaining FROM bf_safety_files WHERE ref_id = 'SAF-150125-0001'
UNION ALL
SELECT 'SAF-120625-0001',            COUNT(*) FROM bf_safety_files WHERE ref_id = 'SAF-120625-0001';
