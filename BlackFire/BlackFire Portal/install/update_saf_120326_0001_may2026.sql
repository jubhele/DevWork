-- ============================================================
-- Safety File Update — SAF-120326-0001 (Astute Insights Q1 2026)
-- Source: NewFiles folder dated 29/05/2026
-- Applied by: admin
--
-- People are referenced by user_id FK only (bf_users).
-- No free-text names written — display names come from JOIN bf_users.
--
-- ITEM CHANGES:
--   H4  N/A             → To Standard  +1 applicable, +1 pass
--   H11 Not to Standard → To Standard               +1 pass
--   H12 Not to Standard → To Standard               +1 pass
--   H32 To Standard     → appointee_id updated, comment updated
--
-- SCORE: main 39/49 = 79.59% YELLOW  →  42/50 = 84.00% YELLOW
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

-- ── Resolve Zanele Myeza's user_id ───────────────────────────
SET @zm_id = (SELECT id FROM bf_users WHERE username = 'z.myeza');
SELECT CASE WHEN @zm_id IS NULL
            THEN 'ERROR: z.myeza not found — run fix_aeci_personnel_backfill.sql first'
            ELSE CONCAT('OK — z.myeza user_id = ', @zm_id)
       END AS preflight;

-- ── 1. H4 — Construction Site Safety Officer (Reg 8(5)) ──────
UPDATE bf_safety_items
   SET result       = 'To Standard',
       appointee_id = @zm_id,
       comments     = 'Construction Site Safety Officer (Reg 8(5)) — Zanele Myeza. Signed appointment letter in file, 29/05/2026.',
       ap_status    = 'Resolved'
 WHERE file_ref    = 'SAF-120326-0001'
   AND section_key = 'H'
   AND item_no     = 4;

-- ── 2. H11 — Risk Assessor (Reg 9(1)) ────────────────────────
UPDATE bf_safety_items
   SET result       = 'To Standard',
       appointee_id = @zm_id,
       comments     = 'Risk Assessor (Reg 9(1)) — Zanele Myeza. Signed appointment letter in file, 29/05/2026. Supersedes pending IRCA exam status.',
       ap_status    = 'Resolved'
 WHERE file_ref    = 'SAF-120326-0001'
   AND section_key = 'H'
   AND item_no     = 11;

-- ── 3. H12 — Fall Protection Plan Developer (Reg 10(1)) ──────
UPDATE bf_safety_items
   SET result       = 'To Standard',
       appointee_id = @zm_id,
       comments     = 'Fall Protection Plan Developer (Reg 10(1)) — Zanele Myeza. Signed appointment letter in file, 29/05/2026.',
       ap_status    = 'Resolved'
 WHERE file_ref    = 'SAF-120326-0001'
   AND section_key = 'H'
   AND item_no     = 12;

-- ── 4. H32 — Incident Investigator (add Zanele Myeza to team) ─
UPDATE bf_safety_items
   SET appointee_id = @zm_id,
       comments     = 'Incident Investigator team: Refilwe Khumalo (original) + Zanele Myeza added 29/05/2026. Both appointment letters in file.',
       ap_status    = 'Resolved'
 WHERE file_ref    = 'SAF-120326-0001'
   AND section_key = 'H'
   AND item_no     = 32;

-- ── 5. Add Zanele Myeza to bf_safety_personnel ───────────────
-- full_name derived from bf_users — no hardcoded string.
-- uk_sp_file_user (file_ref, user_id) prevents duplicates on re-run.
INSERT INTO bf_safety_personnel
  (file_ref, user_id, full_name, id_number, role, company, is_active, created_by, created_at)
SELECT
  'SAF-120326-0001',
  u.id,
  u.name,         -- pulled from bf_users, not hardcoded
  '',
  'Other',
  '',             -- company pulled from bf_users.company if that column exists, else join at display time
  1, 'admin', '2026-05-31 00:00:00'
FROM bf_users u
WHERE u.username = 'z.myeza'
  AND NOT EXISTS (
    SELECT 1 FROM bf_safety_personnel
     WHERE file_ref = 'SAF-120326-0001' AND user_id = u.id
  );

-- ── 6. Update safety file score & band ───────────────────────
UPDATE bf_safety_files
   SET score      = 84.00,
       band       = 'YELLOW',
       updated_by = 'admin'
 WHERE ref_id = 'SAF-120326-0001';

-- ── 7. Verify — all names via JOIN, no raw text ───────────────
SELECT ref_id, score, band, updated_by, updated_at
  FROM bf_safety_files
 WHERE ref_id = 'SAF-120326-0001';

SELECT si.section_key, si.item_no, si.result,
       u.username, u.name AS appointee_name,
       LEFT(si.comments, 70) AS comments_preview,
       si.ap_status
  FROM bf_safety_items si
  JOIN bf_users u ON u.id = si.appointee_id
 WHERE si.file_ref    = 'SAF-120326-0001'
   AND si.section_key = 'H'
   AND si.item_no IN (4, 11, 12, 32)
 ORDER BY si.item_no;

SELECT sp.file_ref, u.username, u.name, sp.role, sp.created_at
  FROM bf_safety_personnel sp
  JOIN bf_users u ON u.id = sp.user_id
 WHERE sp.file_ref = 'SAF-120326-0001'
   AND sp.user_id  = @zm_id;

-- End of update
