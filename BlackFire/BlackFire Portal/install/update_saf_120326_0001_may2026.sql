-- ============================================================
-- Safety File Update — SAF-120326-0001 (Astute Insights Q1 2026)
-- Source: NewFiles folder — G:\My Drive\JS\Astute Insights\BlackFire\
--           Admin Finance\AECI\Safety File\NewFiles
-- Date applied: 2026-05-31
-- Applied by: Jubhele Shange / admin
--
-- DOCUMENTS RECEIVED (18 files, all dated 29/05/2026 unless noted):
-- ─ Appointment letters (PDFs — signed by Zanele Myeza):
--   • SAFETY OFFICER - COMPANY REPRESENTATIVE-4.pdf    → H4
--   • RISK ASSESSORS APOINTMENT REG 9 (1) --5.pdf      → H11
--   • FALL PROTECTION PLAN DEVELOPER-2.pdf             → H12
--   • INCIDENT INVESTIGATOR - TEAM-2.pdf               → H32
-- ─ Supporting documents (confirm already-passing items):
--   • BRA-AI-00_ HIRA (Baseline) - Rev 00.pdf          → B3 (already TS)
--   • Fall protection plan-2.pdf                       → E3 (already TS)
--   • Training registers.pdf                           → D2/D3 (already TS)
--   • Organogram.docx                                  → A9 (already TS)
--   • Risk_Review_and_Monitoring_Plan_...docx           → B5 (already TS)
--   • PPE Policy.doc                                   → E9 (already TS)
--   • Portable electrical tools- SWP.doc               → B6 (already TS)
--   • CONSTRUCTION SUPERVISOR.doc                      → H5 (N/A, .doc unreadable)
--   • 16.1 CHIEF EXECUTIVE OFFICER (1).doc             → CEO 16.1 appointment
--   • EMERGENCY CO-ORDINATOR - TEAM.doc                → G section support
--   • HAND TOOLS INSPECTOR - Copy (3).doc              → equipment support
--   • LADDER INSPECTOR.doc                             → equipment support
--   • PORTABLE ELECTRIC EQUIPMENT INSPECTOR.doc        → F section support
--   • Penny Nzimande - sign.png                        → signature asset
--
-- ITEM CHANGES (main sections only):
--   H4  N/A           → To Standard  +1 applicable, +1 pass
--   H11 Not to Standard → To Standard               +1 pass
--   H12 Not to Standard → To Standard               +1 pass
--   H32 To Standard   → (unchanged, comment updated only)
--
-- SCORE:
--   Before: main 39/49 = 79.59%  band YELLOW
--   After:  main 42/50 = 84.00%  band YELLOW
--   (Portal live view includes I-section bonus: +10% → ~94% GREEN)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

-- ── 1. H4 — Construction Site Safety Officer (Reg 8(5)) ──────
--    Was: N/A  →  Now: To Standard (Zanele Myeza, 29/05/2026)
UPDATE bf_safety_items
   SET result    = 'To Standard',
       appointee = 'Zanele Myeza',
       comments  = 'Construction Site Safety Officer (Reg 8(5)) appointed — Zanele Myeza. Signed appointment letter in file, 29/05/2026.',
       ap_status = 'Resolved'
 WHERE file_ref    = 'SAF-120326-0001'
   AND section_key = 'H'
   AND item_no     = 4;

-- ── 2. H11 — Risk Assessor (Reg 9(1)) ────────────────────────
--    Was: Not to Standard (exam pending Mar 2026)
--    Now: To Standard (Zanele Myeza appointment letter in file)
UPDATE bf_safety_items
   SET result    = 'To Standard',
       appointee = 'Zanele Myeza',
       comments  = 'Risk Assessor (Reg 9(1)) appointed — Zanele Myeza. Signed appointment letter in file, 29/05/2026. Supersedes pending IRCA exam status.',
       ap_status = 'Resolved'
 WHERE file_ref    = 'SAF-120326-0001'
   AND section_key = 'H'
   AND item_no     = 11;

-- ── 3. H12 — Fall Protection Plan Developer (Reg 10(1)) ──────
--    Was: Not to Standard (appointment letter being drafted)
--    Now: To Standard (Zanele Myeza appointment letter in file)
UPDATE bf_safety_items
   SET result    = 'To Standard',
       appointee = 'Zanele Myeza',
       comments  = 'Fall Protection Plan Developer (Reg 10(1)) appointed — Zanele Myeza. Signed appointment letter in file, 29/05/2026.',
       ap_status = 'Resolved'
 WHERE file_ref    = 'SAF-120326-0001'
   AND section_key = 'H'
   AND item_no     = 12;

-- ── 4. H32 — Incident Investigator (comment update only) ─────
--    Refilwe Khumalo remains the original appointee.
--    Zanele Myeza added to investigation team 29/05/2026.
UPDATE bf_safety_items
   SET comments  = 'Incident Investigator — Refilwe Khumalo (original, current) + Zanele Myeza added to team 29/05/2026. Both appointment letters in file.',
       ap_status = 'Resolved'
 WHERE file_ref    = 'SAF-120326-0001'
   AND section_key = 'H'
   AND item_no     = 32;

-- ── 5. Add Zanele Myeza to personnel ─────────────────────────
--    role = 'Other' (Safety Officer / Risk Assessor / FPP Developer
--    are not in the Employee/Supervisor/SHE Rep/First Aider ENUM)
--    bf_safety_personnel has no UNIQUE key — use WHERE NOT EXISTS to prevent
--    duplicates on re-run instead of INSERT IGNORE (which only silences key conflicts).
INSERT INTO bf_safety_personnel
  (file_ref, full_name, id_number, role, company, is_active, created_by, created_at)
SELECT 'SAF-120326-0001', 'Zanele Myeza', '', 'Other', 'Astute Insights (Pty) Ltd', 1, 'admin', '2026-05-31 00:00:00'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM bf_safety_personnel
    WHERE file_ref = 'SAF-120326-0001' AND full_name = 'Zanele Myeza'
);

-- ── 6. Update safety file header score & band ────────────────
--    main 42/50 = 84.00%  YELLOW
--    Note: portal live score includes I-section bonus (+10%)
UPDATE bf_safety_files
   SET score      = 84.00,
       band       = 'YELLOW',
       updated_by = 'admin'
 WHERE ref_id = 'SAF-120326-0001';

-- ── 7. Verify ────────────────────────────────────────────────
SELECT ref_id, score, band, updated_by, updated_at
  FROM bf_safety_files
 WHERE ref_id = 'SAF-120326-0001';

SELECT section_key, item_no, result, appointee, LEFT(comments,80) AS comments_preview, ap_status
  FROM bf_safety_items
 WHERE file_ref = 'SAF-120326-0001'
   AND section_key = 'H'
   AND item_no IN (4,11,12,32)
 ORDER BY item_no;

SELECT full_name, role, company, created_at
  FROM bf_safety_personnel
 WHERE file_ref = 'SAF-120326-0001'
   AND full_name = 'Zanele Myeza';

-- End of update
