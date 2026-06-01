-- ============================================================
-- Fix: role column ENUM → VARCHAR(50), create z.myeza,
--      correct rows 33-35, delete all non-SAF-120326-0001 data
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. role column: ENUM → VARCHAR(50) ────────────────────────────
--    ENUM only allowed Employee/Subcontractor/Supervisor/SHE Rep/
--    First Aider/Other — CEO, Safety Officer, Construction Supervisor
--    all truncated to '' on insert.
ALTER TABLE bf_safety_personnel
  MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'Other';

-- ── 2. Create Zanele Myeza portal user (z.myeza) ──────────────────
--    She appears as user_id=NULL on row 34 because she didn't exist.
--    Password: BlackFire@2026! (must change on first login)
INSERT IGNORE INTO bf_users
  (username, password_hash, name, email, role, title, active, created_at)
VALUES
  ('z.myeza',
   '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
   'Zanele Myeza',
   'z.myeza@astuteinsights.co.za',
   'safety_officer',
   'Safety Officer',
   1, '2026-05-29 08:00:00');

-- ── 3. Fix rows 33, 34, 35 — set correct roles and user_id ────────
UPDATE bf_safety_personnel SET role = 'CEO'                    WHERE id = 33;

UPDATE bf_safety_personnel
   SET user_id = (SELECT id FROM bf_users WHERE username = 'z.myeza' LIMIT 1),
       role    = 'Safety Officer'
 WHERE id = 34;

UPDATE bf_safety_personnel SET role = 'Construction Supervisor' WHERE id = 35;

-- ── 4. Delete ALL safety file data except SAF-120326-0001 ─────────
--    These are seed/test files only. SAF-120326-0001 is production.

DELETE FROM bf_safety_personnel WHERE file_ref != 'SAF-120326-0001';
DELETE FROM bf_safety_items     WHERE file_ref != 'SAF-120326-0001';
DELETE FROM bf_safety_compliance WHERE file_ref != 'SAF-120326-0001';

DELETE FROM bf_attachments
 WHERE entity_type = 'safety_file'
   AND entity_ref  != 'SAF-120326-0001';

DELETE FROM bf_safety_files WHERE ref_id != 'SAF-120326-0001';

SET FOREIGN_KEY_CHECKS = 1;

-- ── 5. Verify ──────────────────────────────────────────────────────
SELECT sp.id, sp.file_ref, u.name AS person, sp.role,
       CASE WHEN sp.user_id IS NULL THEN 'NO USER_ID' ELSE 'OK' END AS status
  FROM bf_safety_personnel sp
  LEFT JOIN bf_users u ON u.id = sp.user_id
 ORDER BY sp.file_ref, sp.id;

SELECT COUNT(*) AS remaining_files FROM bf_safety_files;
SELECT COUNT(*) AS remaining_items FROM bf_safety_items;
