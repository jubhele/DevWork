-- ============================================================
-- BlackFire / Astute Insights — Safety Digitisation Demo
-- Test Data PART 3: Personnel, Compliance, Policy Acks,
--   Full Business Workflow (Callouts → Quotes → Invoices →
--   Payments → Statements) + Before/After Job Attachments
--
-- CALLOUT CHAIN OVERVIEW (11 jobs, 4 eras):
--   Jul 2024  — CO-140724-0001  Site security assessment (R35,000)
--   Nov 2024  — CO-041124-0001  CCTV upgrade Section A   (R65,500)
--   Jan 2025  — CO-150125-0001  CCTV annual service      (R28,750)
--   Jun 2025  — CO-150625-0001  NOC upgrade & perimeter  (R45,200)
--   Feb–Mar 2026 (7 jobs) — paid together 24 Apr 2026
--     CP1492  INV-060326-0001   R18,986.27
--     CP1469  INV-060326-0002   R28,163.16
--     CP1550  INV-060326-0003   R12,190.00
--     CP1527  INV-090326-0001   R42,308.90  [digital sig ref]
--     CP1551  INV-120326-0001   R27,358.50
--     CP1535  INV-120326-0002    R9,947.50  [emergency callout]
--     CP1536  INV-120326-0003    R2,012.50
--   Total batch = R140,966.83 (Remittance #122202, 24 Apr 2026)
--
-- DIGITAL SIGNATURE CROSS-REFS (already seeded):
--   Q-140724-0001  ← bf_digital_signatures quote approval
--   Q-041124-0001  ← bf_digital_signatures quote approval
--   INV-090326-0001 ← bf_digital_signatures invoice sign-off
--   CO-120326-0001  ← bf_digital_signatures job completion
--
-- Run AFTER all migrations AND parts 1 & 2.
-- Email format: first-initial.surname@domain (e.g. j.shange, y.herbst)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Safety ensure: bf_statements table + invoice_generated col ──
CREATE TABLE IF NOT EXISTS `bf_statements` (
  `id`                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `ref_id`            VARCHAR(20)   NOT NULL UNIQUE,
  `scheduled_for`     DATE          NOT NULL,
  `status`            ENUM('pending_approval','released') NOT NULL DEFAULT 'pending_approval',
  `invoice_refs`      TEXT,
  `total_outstanding` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `released_by`       VARCHAR(100)  NOT NULL DEFAULT '',
  `released_at`       DATETIME      DEFAULT NULL,
  `from_email`        VARCHAR(150)  NOT NULL DEFAULT '',
  `to_emails`         VARCHAR(500)  NOT NULL DEFAULT '',
  `created_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stmt_date`   (`scheduled_for`),
  KEY `idx_stmt_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `bf_callouts`
  ADD COLUMN IF NOT EXISTS `invoice_generated` TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE `bf_invoices`
  ADD COLUMN IF NOT EXISTS `sent_at`           DATETIME     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `sent_by`           VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `sent_by_user_id`   INT UNSIGNED DEFAULT NULL;

ALTER TABLE `bf_payments`
  ADD COLUMN IF NOT EXISTS `payment_ref`       VARCHAR(20)  NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `invoice_id`        INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `client_id`         INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `logged_by_user_id` INT UNSIGNED DEFAULT NULL;

-- Ensure stmt counter exists
INSERT INTO bf_counters (counter_type, current_value)
VALUES ('stmt', 0)
ON DUPLICATE KEY UPDATE counter_type = counter_type;

-- ── Session variables ─────────────────────────────────────
SET @aeci_id   = (SELECT id FROM bf_clients WHERE name = 'AECI Chempark' LIMIT 1);
SET @uid_kitso   = (SELECT id FROM bf_users WHERE username = 'kitso.marupi' LIMIT 1);
SET @uid_james   = (SELECT id FROM bf_users WHERE username = 'j.mthembu'    LIMIT 1);
SET @uid_refilwe = (SELECT id FROM bf_users WHERE username = 'r.khumalo'    LIMIT 1);
SET @uid_lelo    = (SELECT id FROM bf_users WHERE username = 'l.sithole'    LIMIT 1);
SET @uid_nomvula = (SELECT id FROM bf_users WHERE username = 'n.sithole'    LIMIT 1);
SET @uid_jshange = (SELECT id FROM bf_users WHERE username = 'j.shange'     LIMIT 1);

-- ═══════════════════════════════════════════════════════════
-- 1. SAFETY PERSONNEL
-- ═══════════════════════════════════════════════════════════

-- SAF-150125-0001 — 3 staff (Jan 2025 baseline)
DELETE FROM bf_safety_personnel WHERE file_ref = 'SAF-150125-0001';
INSERT INTO bf_safety_personnel
  (file_ref, full_name, id_number, role, company, is_active, created_by, created_at)
VALUES
('SAF-150125-0001','Kitso Marupi',    '8612055XXX083','SHE Rep',    'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-01-15 10:00:00'),
('SAF-150125-0001','James Mthembu',   '9503075XXX082','Employee',   'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-01-15 10:00:00'),
('SAF-150125-0001','Refilwe Khumalo', '9207195XXX085','Employee',   'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-01-15 10:00:00');

-- SAF-120625-0001 — 4 staff (+Thabo hired Jun 2025)
DELETE FROM bf_safety_personnel WHERE file_ref = 'SAF-120625-0001';
INSERT INTO bf_safety_personnel
  (file_ref, full_name, id_number, role, company, is_active, created_by, created_at)
VALUES
('SAF-120625-0001','Kitso Marupi',    '8612055XXX083','SHE Rep',    'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-06-12 10:00:00'),
('SAF-120625-0001','James Mthembu',   '9503075XXX082','Employee',   'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-06-12 10:00:00'),
('SAF-120625-0001','Refilwe Khumalo', '9207195XXX085','Employee',   'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-06-12 10:00:00'),
('SAF-120625-0001','Thabo Mokoena',   '9804125XXX084','Supervisor', 'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-06-12 10:00:00');

-- SAF-150925-0001 — 5 staff (+Maria as First Aider)
DELETE FROM bf_safety_personnel WHERE file_ref = 'SAF-150925-0001';
INSERT INTO bf_safety_personnel
  (file_ref, full_name, id_number, role, company, is_active, created_by, created_at)
VALUES
('SAF-150925-0001','Kitso Marupi',    '8612055XXX083','SHE Rep',     'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-09-15 10:00:00'),
('SAF-150925-0001','James Mthembu',   '9503075XXX082','Employee',    'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-09-15 10:00:00'),
('SAF-150925-0001','Refilwe Khumalo', '9207195XXX085','Employee',    'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-09-15 10:00:00'),
('SAF-150925-0001','Thabo Mokoena',   '9804125XXX084','Supervisor',  'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-09-15 10:00:00'),
('SAF-150925-0001','Maria Coetzee',   '8905225XXX085','First Aider', 'Astute Insights (Pty) Ltd',1,'kitso.marupi','2025-09-15 10:00:00');

-- SAF-150126-0001, SAF-120326-0001, SAF-210526-0001 — same 5 staff
DELETE FROM bf_safety_personnel WHERE file_ref IN ('SAF-150126-0001','SAF-120326-0001','SAF-210526-0001');
INSERT INTO bf_safety_personnel
  (file_ref, full_name, id_number, role, company, is_active, created_by, created_at)
VALUES
('SAF-150126-0001','Kitso Marupi',    '8612055XXX083','SHE Rep',     'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-01-15 10:00:00'),
('SAF-150126-0001','James Mthembu',   '9503075XXX082','Employee',    'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-01-15 10:00:00'),
('SAF-150126-0001','Refilwe Khumalo', '9207195XXX085','Employee',    'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-01-15 10:00:00'),
('SAF-150126-0001','Thabo Mokoena',   '9804125XXX084','Supervisor',  'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-01-15 10:00:00'),
('SAF-150126-0001','Maria Coetzee',   '8905225XXX085','First Aider', 'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-01-15 10:00:00'),
('SAF-120326-0001','Kitso Marupi',    '8612055XXX083','SHE Rep',     'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-03-12 10:00:00'),
('SAF-120326-0001','James Mthembu',   '9503075XXX082','Employee',    'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-03-12 10:00:00'),
('SAF-120326-0001','Refilwe Khumalo', '9207195XXX085','Employee',    'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-03-12 10:00:00'),
('SAF-120326-0001','Thabo Mokoena',   '9804125XXX084','Supervisor',  'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-03-12 10:00:00'),
('SAF-120326-0001','Maria Coetzee',   '8905225XXX085','First Aider', 'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-03-12 10:00:00'),
('SAF-210526-0001','Kitso Marupi',    '8612055XXX083','SHE Rep',     'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','James Mthembu',   '9503075XXX082','Employee',    'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Refilwe Khumalo', '9207195XXX085','Employee',    'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Thabo Mokoena',   '9804125XXX084','Supervisor',  'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Maria Coetzee',   '8905225XXX085','First Aider', 'Astute Insights (Pty) Ltd',1,'kitso.marupi','2026-05-21 10:00:00');

-- ═══════════════════════════════════════════════════════════
-- 2. SAFETY COMPLIANCE
-- ═══════════════════════════════════════════════════════════
-- Initial state at Jan 2025 baseline
DELETE FROM bf_safety_compliance WHERE file_ref = 'SAF-150125-0001';
INSERT INTO bf_safety_compliance
  (file_ref, compliance_type, category, scope, issue_date, expiry_date, renewal_months,
   document_ref, notes, created_by, updated_by, created_at)
VALUES
-- Company-level
('SAF-150125-0001','Letter of Good Standing (COID)','Submission','Company',
 '2024-11-01','2025-10-31',12,'A04_record_coid-good-standing.pdf',
 'Compensation Fund clearance. Annual renewal due Oct 2025.','kitso.marupi','kitso.marupi','2025-01-15 10:00:00'),
('SAF-150125-0001','Public Liability Insurance — R10M','Submission','Company',
 '2024-07-01','2025-06-30',12,'A07_insurance_public-liability-r10m.pdf',
 'PLI valid to Jun 2025. Renew before expiry.','kitso.marupi','kitso.marupi','2025-01-15 10:00:00'),
('SAF-150125-0001','NOSA Grading Certificate','Certification','Company',
 '2024-01-15','2026-01-14',24,'A01_certificate_nosa-grade-c.pdf',
 'NOSA Grade C. Two-year cycle. Valid Jan 2024 – Jan 2026.','kitso.marupi','kitso.marupi','2025-01-15 10:00:00'),
-- James Mthembu
('SAF-150125-0001','PSIRA Certificate — Grade C','Certification','Person',
 '2024-01-15','2025-01-14',12,'D03_certificate_psira-c-mthembu-2024.pdf',
 'PSIRA Grade C. James Mthembu. Annual renewal due Jan 2025.','kitso.marupi','kitso.marupi','2025-01-15 10:00:00'),
('SAF-150125-0001','AECI Site Induction','Induction','Person',
 '2024-01-20','2025-01-19',12,'D06_record_aeci-induction-2024-mthembu.pdf',
 'AECI Chempark annual induction. James Mthembu.','kitso.marupi','kitso.marupi','2025-01-15 10:00:00'),
-- Refilwe Khumalo
('SAF-150125-0001','PSIRA Certificate — Grade B','Certification','Person',
 '2024-05-01','2025-04-30',12,'D03_certificate_psira-b-khumalo-2024.pdf',
 'PSIRA Grade B. Refilwe Khumalo. Renewal due Apr 2025.','kitso.marupi','kitso.marupi','2025-01-15 10:00:00'),
('SAF-150125-0001','First Aid Certificate Level 2','Certification','Person',
 '2023-07-01','2026-06-30',36,'H33_certificate_first-aid-l2-khumalo.pdf',
 'Level 2 First Aid. Refilwe Khumalo. Valid 3 years.','kitso.marupi','kitso.marupi','2025-01-15 10:00:00'),
('SAF-150125-0001','AECI Site Induction','Induction','Person',
 '2024-01-20','2025-01-19',12,'D06_record_aeci-induction-2024-khumalo.pdf',
 'AECI Chempark annual induction. Refilwe Khumalo.','kitso.marupi','kitso.marupi','2025-01-15 10:00:00'),
-- Kitso Marupi
('SAF-150125-0001','PSIRA Certificate — Grade B','Certification','Person',
 '2024-06-01','2025-05-31',12,'D03_certificate_psira-b-marupi-2024.pdf',
 'PSIRA Grade B. Kitso Marupi. Renewal due May 2025.','kitso.marupi','kitso.marupi','2025-01-15 10:00:00'),
('SAF-150125-0001','First Aid Certificate Level 2','Certification','Person',
 '2024-01-10','2027-01-09',36,'H33_certificate_first-aid-l2-marupi.pdf',
 'Level 2 First Aid. Kitso Marupi. Valid 3 years.','kitso.marupi','kitso.marupi','2025-01-15 10:00:00'),
('SAF-150125-0001','AECI Site Induction','Induction','Person',
 '2024-01-20','2025-01-19',12,'D06_record_aeci-induction-2024-marupi.pdf',
 'AECI Chempark annual induction. Kitso Marupi.','kitso.marupi','kitso.marupi','2025-01-15 10:00:00');

-- Current compliance state (SAF-210526-0001) — full picture
DELETE FROM bf_safety_compliance WHERE file_ref = 'SAF-210526-0001';
INSERT INTO bf_safety_compliance
  (file_ref, compliance_type, category, scope, issue_date, expiry_date, renewal_months,
   document_ref, notes, created_by, updated_by, created_at)
VALUES
-- ── Company ──
('SAF-210526-0001','Letter of Good Standing (COID)','Submission','Company',
 '2025-11-01','2026-10-31',12,'A04_record_coid-good-standing-2026.pdf',
 'Renewed Nov 2025. Valid to Oct 2026.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Public Liability Insurance — R15M','Submission','Company',
 '2025-07-01','2026-06-30',12,'A07_insurance_public-liability-r15m.pdf',
 'R15M cover renewed Jul 2025. Renew Jun 2026.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','NOSA Grading Certificate','Certification','Company',
 '2026-01-15','2028-01-14',24,'A01_certificate_nosa-grade-c.pdf',
 'NOSA Grade C renewed Jan 2026. Two-year cycle.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','ISO 9001:2015 Certification','Certification','Company',
 '2023-03-01','2026-02-28',36,'I01_certificate_iso-9001.pdf',
 'ISO 9001:2015. Surveillance audit passed Dec 2025. Recertification Mar 2026.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Fire Extinguisher Annual Service','Certification','Company',
 '2026-04-15','2027-04-14',12,'G03_certificate_fire-ext-service.pdf',
 'Annual service by Bongani Zulu Fire Protection. Valid to Apr 2027.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
-- ── James Mthembu ──
('SAF-210526-0001','PSIRA Certificate — Grade C','Certification','Person',
 '2026-01-15','2027-01-14',12,'D03_certificate_psira-c-mthembu-2026.pdf',
 'PSIRA Grade C renewed Jan 2026. James Mthembu.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','First Aid Certificate Level 1','Certification','Person',
 '2024-03-01','2027-02-28',36,'H33_certificate_first-aid-l1-mthembu.pdf',
 'Level 1 First Aid. 3-year cert valid to Feb 2027. James Mthembu.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Fire Extinguisher Training','Certification','Person',
 '2025-11-01','2027-10-31',24,'D04_certificate_fire-ext-mthembu.pdf',
 'FireSafe Training Academy. 2-year cert. James Mthembu.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Working at Heights','Certification','Person',
 '2025-05-10','2028-05-09',36,'D05_certificate_wah-mthembu.pdf',
 'SETA accredited WaH training. 3-year cert. James Mthembu.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','AECI Site Induction — 2026','Induction','Person',
 '2026-01-20','2027-01-19',12,'D06_record_aeci-induction-2026-mthembu.pdf',
 'Annual AECI Chempark induction. James Mthembu.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Medical Certificate of Fitness (Annexure 3)','Certification','Person',
 '2026-01-20','2027-01-19',12,'C01_certificate_medical-mthembu-2026.pdf',
 'Issued by Dr. A. Petersen — Occupational Health Solutions. James Mthembu.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
-- ── Refilwe Khumalo ──
('SAF-210526-0001','PSIRA Certificate — Grade B','Certification','Person',
 '2025-05-01','2026-04-30',12,'D03_certificate_psira-b-khumalo-2025.pdf',
 'PSIRA Grade B. Refilwe Khumalo. Renewal due Apr 2026 — action required.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','First Aid Certificate Level 2','Certification','Person',
 '2023-07-01','2026-06-30',36,'H33_certificate_first-aid-l2-khumalo.pdf',
 'Level 2 First Aid. Refilwe Khumalo. Renewal due Jun 2026.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Fire Extinguisher Training','Certification','Person',
 '2025-11-20','2027-11-19',24,'D04_certificate_fire-ext-khumalo.pdf',
 'FireSafe Training Academy. 2-year cert. Refilwe Khumalo.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Working at Heights','Certification','Person',
 '2025-05-10','2028-05-09',36,'D05_certificate_wah-khumalo.pdf',
 'SETA accredited WaH training. 3-year cert. Refilwe Khumalo.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','AECI Site Induction — 2026','Induction','Person',
 '2026-01-20','2027-01-19',12,'D06_record_aeci-induction-2026-khumalo.pdf',
 'Annual AECI Chempark induction. Refilwe Khumalo.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Medical Certificate of Fitness (Annexure 3)','Certification','Person',
 '2025-12-15','2026-12-14',12,'C01_certificate_medical-khumalo-2025.pdf',
 'Issued by Dr. A. Petersen. Refilwe Khumalo.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
-- ── Kitso Marupi ──
('SAF-210526-0001','PSIRA Certificate — Grade B','Certification','Person',
 '2025-06-01','2026-05-31',12,'D03_certificate_psira-b-marupi-2025.pdf',
 'PSIRA Grade B. Kitso Marupi. Renewal due May 2026 — action required.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','First Aid Certificate Level 2','Certification','Person',
 '2024-01-10','2027-01-09',36,'H33_certificate_first-aid-l2-marupi.pdf',
 'Level 2 First Aid. 3-year cert. Kitso Marupi.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','SAMTRAC Level 1','Certification','Person',
 '2025-07-15','2028-07-14',36,'H03_certificate_samtrac-l1-marupi.pdf',
 'SAMTRAC Level 1 — Safety Management Training Course. Kitso Marupi.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','IRCA Risk Assessor','Certification','Person',
 '2026-02-01','2029-01-31',36,'H11_certificate_irca-risk-assessor-marupi.pdf',
 'IRCA Certified Risk Assessor (CRA). Kitso Marupi. Feb 2026.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Working at Heights','Certification','Person',
 '2025-05-10','2028-05-09',36,'D05_certificate_wah-marupi.pdf',
 'SETA accredited WaH training. 3-year cert. Kitso Marupi.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','AECI Site Induction — 2026','Induction','Person',
 '2026-01-20','2027-01-19',12,'D06_record_aeci-induction-2026-marupi.pdf',
 'Annual AECI Chempark induction. Kitso Marupi.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Medical Certificate of Fitness (Annexure 3)','Certification','Person',
 '2026-01-22','2027-01-21',12,'C01_certificate_medical-marupi-2026.pdf',
 'Issued by Dr. A. Petersen. Kitso Marupi.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
-- ── Thabo Mokoena ──
('SAF-210526-0001','PSIRA Certificate — Grade B','Certification','Person',
 '2025-07-01','2026-06-30',12,'D03_certificate_psira-b-mokoena-2025.pdf',
 'PSIRA Grade B. Thabo Mokoena. Renewal due Jun 2026.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','First Aid Certificate Level 1','Certification','Person',
 '2025-06-15','2028-06-14',36,'H33_certificate_first-aid-l1-mokoena.pdf',
 'Level 1 First Aid. 3-year cert. Thabo Mokoena.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Working at Heights','Certification','Person',
 '2025-05-10','2028-05-09',36,'D05_certificate_wah-mokoena.pdf',
 'SETA accredited WaH training. 3-year cert. Thabo Mokoena.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Fire Extinguisher Training','Certification','Person',
 '2025-11-01','2027-10-31',24,'D04_certificate_fire-ext-mokoena.pdf',
 'FireSafe Training Academy. 2-year cert. Thabo Mokoena.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','AECI Site Induction — 2026','Induction','Person',
 '2026-01-20','2027-01-19',12,'D06_record_aeci-induction-2026-mokoena.pdf',
 'Annual AECI Chempark induction. Thabo Mokoena.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Medical Certificate of Fitness (Annexure 3)','Certification','Person',
 '2026-01-25','2027-01-24',12,'C01_certificate_medical-mokoena-2026.pdf',
 'Issued by Dr. A. Petersen. Thabo Mokoena.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
-- ── Maria Coetzee ──
('SAF-210526-0001','PSIRA Certificate — Grade D','Certification','Person',
 '2025-03-01','2026-02-28',12,'D03_certificate_psira-d-coetzee-2025.pdf',
 'PSIRA Grade D. Maria Coetzee. Renewal overdue — Feb 2026. ACTION REQUIRED.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','First Aid Certificate Level 2','Certification','Person',
 '2023-10-01','2026-09-30',36,'H33_certificate_first-aid-l2-coetzee.pdf',
 'Level 2 First Aid. Valid to Sep 2026. Maria Coetzee.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','AECI Site Induction — 2026','Induction','Person',
 '2026-01-20','2027-01-19',12,'D06_record_aeci-induction-2026-coetzee.pdf',
 'Annual AECI Chempark induction. Maria Coetzee.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00'),
('SAF-210526-0001','Medical Certificate of Fitness (Annexure 3)','Certification','Person',
 '2026-01-28','2027-01-27',12,'C01_certificate_medical-coetzee-2026.pdf',
 'Issued by Dr. A. Petersen. Maria Coetzee.','kitso.marupi','kitso.marupi','2026-05-21 10:00:00');

-- ═══════════════════════════════════════════════════════════
-- 3. POLICY ACKNOWLEDGMENTS
-- ═══════════════════════════════════════════════════════════
-- Jan 2025: 3 staff acknowledge H&S Policy (SAF-150125-0001)
INSERT IGNORE INTO bf_policy_acks
  (file_ref, policy_title, recipient_name, recipient_email, token,
   status, sent_at, acked_at, acked_ip, created_by, created_at)
VALUES
('SAF-150125-0001','Health & Safety Policy — Astute Insights 2025',
 'James Mthembu','j.mthembu@astuteinsights.co.za',
 'pa0100000000000000000000000000000000000000000000000000000000000001',
 'Acknowledged','2025-01-15 08:00:00','2025-01-15 09:05:22','196.6.14.55','kitso.marupi','2025-01-15 08:00:00'),
('SAF-150125-0001','Health & Safety Policy — Astute Insights 2025',
 'Refilwe Khumalo','r.khumalo@astuteinsights.co.za',
 'pa0200000000000000000000000000000000000000000000000000000000000002',
 'Acknowledged','2025-01-15 08:00:00','2025-01-15 10:12:44','196.6.14.55','kitso.marupi','2025-01-15 08:00:00'),
('SAF-150125-0001','Health & Safety Policy — Astute Insights 2025',
 'Kitso Marupi','kitso.marupi@astuteinsights.co.za',
 'pa0300000000000000000000000000000000000000000000000000000000000003',
 'Acknowledged','2025-01-15 08:00:00','2025-01-15 10:45:09','196.6.14.55','kitso.marupi','2025-01-15 08:00:00');

-- Jan 2026: All 5 staff acknowledge updated H&S Policy (SAF-150126-0001)
INSERT IGNORE INTO bf_policy_acks
  (file_ref, policy_title, recipient_name, recipient_email, token,
   status, sent_at, acked_at, acked_ip, created_by, created_at)
VALUES
('SAF-150126-0001','Health & Safety Policy — Astute Insights 2026',
 'James Mthembu','j.mthembu@astuteinsights.co.za',
 'pa0400000000000000000000000000000000000000000000000000000000000004',
 'Acknowledged','2026-01-15 08:00:00','2026-01-15 09:18:33','196.6.14.55','kitso.marupi','2026-01-15 08:00:00'),
('SAF-150126-0001','Health & Safety Policy — Astute Insights 2026',
 'Refilwe Khumalo','r.khumalo@astuteinsights.co.za',
 'pa0500000000000000000000000000000000000000000000000000000000000005',
 'Acknowledged','2026-01-15 08:00:00','2026-01-15 10:22:15','196.6.14.55','kitso.marupi','2026-01-15 08:00:00'),
('SAF-150126-0001','Health & Safety Policy — Astute Insights 2026',
 'Kitso Marupi','kitso.marupi@astuteinsights.co.za',
 'pa0600000000000000000000000000000000000000000000000000000000000006',
 'Acknowledged','2026-01-15 08:00:00','2026-01-15 11:05:44','196.6.14.55','kitso.marupi','2026-01-15 08:00:00'),
('SAF-150126-0001','Health & Safety Policy — Astute Insights 2026',
 'Thabo Mokoena','t.mokoena@astuteinsights.co.za',
 'pa0700000000000000000000000000000000000000000000000000000000000007',
 'Acknowledged','2026-01-15 08:00:00','2026-01-15 11:38:02','196.6.14.55','kitso.marupi','2026-01-15 08:00:00'),
('SAF-150126-0001','Health & Safety Policy — Astute Insights 2026',
 'Maria Coetzee','m.coetzee@astuteinsights.co.za',
 'pa0800000000000000000000000000000000000000000000000000000000000008',
 'Acknowledged','2026-01-15 08:00:00','2026-01-15 14:22:55','196.6.14.55','kitso.marupi','2026-01-15 08:00:00');

-- ═══════════════════════════════════════════════════════════
-- 4. COUNTERS
-- ═══════════════════════════════════════════════════════════
-- Set to 100+ so portal-generated refs don't collide with seeded data
INSERT INTO bf_counters (counter_type, current_value) VALUES
  ('co',   100),
  ('q',    100),
  ('inv',  100),
  ('pay',  100),
  ('stmt',  10),
  ('saf',   10)
ON DUPLICATE KEY UPDATE current_value = GREATEST(current_value, VALUES(current_value));

-- ═══════════════════════════════════════════════════════════
-- 5. CALLOUTS (11 jobs)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO bf_callouts
  (ref_id, client_id, client_name, client_email, service, location, tech,
   assigned_to, assigned_to_user_id, priority, status, approval_status,
   callout_date, callout_time, notes, logged_by, logged_by_user_id, po,
   invoice_generated, created_at, updated_at)
VALUES

-- ── Jul 2024 ─────────────────────────────────────────────
('CO-140724-0001', @aeci_id, 'AECI Chempark', 'procurement@aeci.co.za',
 'Site security assessment & gap analysis — perimeter, CCTV, access control',
 'AECI Chempark, Modderfontein, Gauteng',
 'R. Khumalo', 'r.khumalo', @uid_refilwe,
 'Normal','Invoiced','approved',
 '2024-07-14','08:00:00',
 'Comprehensive security audit commissioned by AECI Chempark. Gap analysis across all systems. Quote Q-140724-0001 submitted same day, signed by Y. Herbst 21 Jul.',
 'j.shange', @uid_jshange, 'CP0847',
 1,'2024-07-14 08:30:00','2024-07-21 14:00:00'),

-- ── Nov 2024 ─────────────────────────────────────────────
('CO-041124-0001', @aeci_id, 'AECI Chempark', 'procurement@aeci.co.za',
 'CCTV system upgrade — Section A camera replacement & DVR commissioning',
 'AECI Chempark Section A — main gate approach',
 'R. Khumalo; J. Mthembu', 'r.khumalo', @uid_refilwe,
 'Normal','Invoiced','approved',
 '2024-11-04','07:30:00',
 '6× Hikvision 4MP turret cameras replaced. 32-channel DVR with remote access commissioned. Quote Q-041124-0001 signed by Y. Herbst 7 Nov. Work completed 18 Nov.',
 'n.sithole', @uid_nomvula, 'CP1044',
 1,'2024-11-04 07:00:00','2024-11-18 17:00:00'),

-- ── Jan 2025 ─────────────────────────────────────────────
('CO-150125-0001', @aeci_id, 'AECI Chempark', 'procurement@aeci.co.za',
 'CCTV & access control annual preventative maintenance',
 'AECI Chempark — all sections',
 'R. Khumalo; J. Mthembu', 'r.khumalo', @uid_refilwe,
 'Normal','Invoiced','approved',
 '2025-01-15','07:30:00',
 'Annual service: lens cleaning, PTZ calibration, access control DB backup, panic station testing. All 42 cameras operational post-service.',
 'n.sithole', @uid_nomvula, 'AECI-PO-2025-003',
 1,'2025-01-15 07:00:00','2025-01-28 17:00:00'),

-- ── Jun 2025 ─────────────────────────────────────────────
('CO-150625-0001', @aeci_id, 'AECI Chempark', 'procurement@aeci.co.za',
 'NOC alarm monitoring upgrade & perimeter electric fence servicing',
 'AECI Chempark — NOC room + perimeter full run',
 'R. Khumalo; T. Mokoena', 'r.khumalo', @uid_refilwe,
 'Normal','Invoiced','approved',
 '2025-06-15','07:30:00',
 'NOC workstation upgrade: dual 27" monitors, alarm receiver software v4.2. Perimeter fence energiser replacement Zones 3 & 4. Signal wire repair after storm damage. All zones commissioned.',
 'n.sithole', @uid_nomvula, 'AECI-PO-2025-045',
 1,'2025-06-15 07:00:00','2025-06-26 17:00:00'),

-- ── Feb 2026 — 4 jobs ────────────────────────────────────
('CO-040226-0001', @aeci_id, 'AECI Chempark', 'procurement@aeci.co.za',
 'CCTV camera replacement — 8× cameras Sections B & D perimeter',
 'AECI Chempark Sections B & D',
 'J. Mthembu; T. Mokoena', 'j.mthembu', @uid_james,
 'Normal','Invoiced','approved',
 '2026-02-04','07:30:00',
 '8× aged Dahua cameras replaced with Uniview 5MP starlight models. Conduit repair at 3 runs. NVR firmware upgraded. All cameras online and tested. PO CP1492.',
 'n.sithole', @uid_nomvula, 'CP1492',
 1,'2026-02-04 07:00:00','2026-02-14 17:00:00'),

('CO-050226-0001', @aeci_id, 'AECI Chempark', 'procurement@aeci.co.za',
 'Perimeter security alarm upgrade — PIR beams & siren replacement',
 'AECI Chempark — north & west perimeter',
 'R. Khumalo; T. Mokoena', 'r.khumalo', @uid_refilwe,
 'Normal','Invoiced','approved',
 '2026-02-05','07:30:00',
 '12× Paradox DG85 PIR outdoor beams installed. 3× corroded sirens replaced. Alarm panel zone expansion card installed. Full perimeter test passed. PO CP1469.',
 'n.sithole', @uid_nomvula, 'CP1469',
 1,'2026-02-05 07:00:00','2026-02-19 17:00:00'),

('CO-100226-0001', @aeci_id, 'AECI Chempark', 'procurement@aeci.co.za',
 'Access control system maintenance — reader replacement & database update',
 'AECI Chempark main gate & admin block',
 'J. Mthembu', 'j.mthembu', @uid_james,
 'Normal','Invoiced','approved',
 '2026-02-10','08:00:00',
 '2× HID Multiclass SE readers replaced at main gate. 3 new staff cards issued. Visitor management DB backup and clean-up. Door controller firmware updated. PO CP1550.',
 'n.sithole', @uid_nomvula, 'CP1550',
 1,'2026-02-10 07:00:00','2026-02-12 17:00:00'),

('CO-230226-0001', @aeci_id, 'AECI Chempark', 'procurement@aeci.co.za',
 'Proface palm reader supply & installation — restricted access zones',
 'AECI Chempark — Restricted Zone entrance (4 access points)',
 'R. Khumalo; J. Mthembu; T. Mokoena', 'r.khumalo', @uid_refilwe,
 'Urgent','Invoiced','approved',
 '2026-02-23','07:00:00',
 '4× Suprema BioEntry W3 palm vein readers installed. Integration with Honeywell Pro-Watch. Staff biometric enrollment: 47 personnel. Tested and signed off by AECI HSE Manager. PO CP1527.',
 'j.shange', @uid_jshange, 'CP1527',
 1,'2026-02-23 07:00:00','2026-03-07 17:00:00'),

-- ── Mar 2026 — 3 jobs ────────────────────────────────────
('CO-040326-0001', @aeci_id, 'AECI Chempark', 'procurement@aeci.co.za',
 'CCTV recording server & UPS supply — NOC room infrastructure upgrade',
 'AECI Chempark NOC room',
 'R. Khumalo; J. Mthembu', 'r.khumalo', @uid_refilwe,
 'Normal','Invoiced','approved',
 '2026-03-04','08:00:00',
 'Dell PowerEdge 32TB NVR server + APC Smart-UPS 3000VA installed. 90-day CCTV archive migrated. RAID6 configured. Remote monitoring setup. PO CP1551.',
 'j.shange', @uid_jshange, 'CP1551',
 1,'2026-03-04 07:00:00','2026-03-11 17:00:00'),

-- CO-120326-0001 cross-referenced in bf_digital_signatures (job completion sign-off)
('CO-120326-0001', @aeci_id, 'AECI Chempark', 'procurement@aeci.co.za',
 'Emergency call — camera outage restoration after power surge',
 'AECI Chempark — Section C perimeter & gate cameras',
 'R. Khumalo; J. Mthembu', 'r.khumalo', @uid_refilwe,
 'Emergency','Invoiced','approved',
 '2026-03-12','03:30:00',
 'Emergency: lightning-induced power surge damaged 4× cameras and DVR PSU. Response by 03:30. Fault isolated 05:00. Parts sourced and system restored by 14:00. Signed off by S. Ndevu (AECI Site Manager). PO CP1535.',
 'n.sithole', @uid_nomvula, 'CP1535',
 1,'2026-03-12 03:30:00','2026-03-14 14:00:00'),

('CO-180326-0001', @aeci_id, 'AECI Chempark', 'procurement@aeci.co.za',
 'Electrical materials & consumables supply',
 'AECI Chempark — site stores delivery',
 'J. Mthembu', 'j.mthembu', @uid_james,
 'Normal','Invoiced','not_required',
 '2026-03-18','09:00:00',
 'Supply of cable conduit, connectors, junction boxes, and electrical consumables for site maintenance. No installation. Delivered directly to AECI site stores. PO CP1536.',
 'l.sithole', @uid_lelo, 'CP1536',
 1,'2026-03-18 09:00:00','2026-03-18 16:00:00');

-- ═══════════════════════════════════════════════════════════
-- 6. QUOTES (9 — CO-120326-0001 is emergency, CO-180326-0001 is direct supply)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO bf_quotes
  (ref_id, client_id, client_name, client_email, status, valid_until, quote_date,
   submitted_by, submitted_by_user_id, source, approval_status,
   callout_ref, notes, total_amount, approved_at, approved_by, created_at, updated_at)
VALUES
('Q-140724-0001', @aeci_id, 'AECI Chempark', 'yolanda.herbst@aeciworld.com',
 'Approved','2024-08-14','2024-07-14',
 'j.shange',@uid_jshange,'staff','approved','CO-140724-0001',
 'Site security assessment & gap analysis. Based on site visit 14 Jul 2024.',
 35000.00,'2024-07-21 11:34:22','Y. Herbst','2024-07-14 14:00:00','2024-07-21 11:34:22'),

('Q-041124-0001', @aeci_id, 'AECI Chempark', 'yolanda.herbst@aeciworld.com',
 'Approved','2024-12-04','2024-11-04',
 'r.khumalo',@uid_refilwe,'staff','approved','CO-041124-0001',
 'CCTV upgrade: 6× cameras, 32-ch DVR, cabling. Section A main gate approach.',
 65500.00,'2024-11-07 14:22:09','Y. Herbst','2024-11-04 10:00:00','2024-11-07 14:22:09'),

('Q-150125-0001', @aeci_id, 'AECI Chempark', 'yolanda.herbst@aeciworld.com',
 'Approved','2025-02-15','2025-01-15',
 'r.khumalo',@uid_refilwe,'staff','approved','CO-150125-0001',
 'Annual preventative maintenance: 42 cameras, 6 access control points, panic stations.',
 28750.00,'2025-01-20 09:15:00','Y. Herbst','2025-01-15 12:00:00','2025-01-20 09:15:00'),

('Q-150625-0001', @aeci_id, 'AECI Chempark', 'yolanda.herbst@aeciworld.com',
 'Approved','2025-07-15','2025-06-15',
 'r.khumalo',@uid_refilwe,'staff','approved','CO-150625-0001',
 'NOC workstation upgrade + perimeter fence energiser replacement Zones 3 & 4.',
 45200.00,'2025-06-19 10:45:00','Y. Herbst','2025-06-15 14:00:00','2025-06-19 10:45:00'),

('Q-040226-0001', @aeci_id, 'AECI Chempark', 'yolanda.herbst@aeciworld.com',
 'Approved','2026-03-06','2026-02-04',
 'r.khumalo',@uid_refilwe,'staff','approved','CO-040226-0001',
 '8× Uniview 5MP starlight cameras, conduit repair, NVR firmware upgrade. Sections B & D.',
 18986.27,'2026-02-07 11:00:00','Y. Herbst','2026-02-04 15:00:00','2026-02-07 11:00:00'),

('Q-050226-0001', @aeci_id, 'AECI Chempark', 'yolanda.herbst@aeciworld.com',
 'Approved','2026-03-07','2026-02-05',
 'r.khumalo',@uid_refilwe,'staff','approved','CO-050226-0001',
 '12× PIR beams, 3× sirens, alarm panel zone expansion. North & west perimeter.',
 28163.16,'2026-02-09 09:30:00','Y. Herbst','2026-02-05 16:00:00','2026-02-09 09:30:00'),

('Q-100226-0001', @aeci_id, 'AECI Chempark', 'yolanda.herbst@aeciworld.com',
 'Approved','2026-03-12','2026-02-10',
 'j.mthembu',@uid_james,'staff','approved','CO-100226-0001',
 '2× HID readers, 3× staff card re-issue, firmware update, database cleanup.',
 12190.00,'2026-02-11 10:15:00','Y. Herbst','2026-02-10 14:00:00','2026-02-11 10:15:00'),

('Q-230226-0001', @aeci_id, 'AECI Chempark', 'yolanda.herbst@aeciworld.com',
 'Approved','2026-03-25','2026-02-23',
 'r.khumalo',@uid_refilwe,'staff','approved','CO-230226-0001',
 '4× Suprema BioEntry W3 palm readers, Pro-Watch integration, enrollment 47 staff.',
 42308.90,'2026-02-26 11:45:00','Y. Herbst','2026-02-23 16:00:00','2026-02-26 11:45:00'),

('Q-040326-0001', @aeci_id, 'AECI Chempark', 'yolanda.herbst@aeciworld.com',
 'Approved','2026-04-04','2026-03-04',
 'j.shange',@uid_jshange,'staff','approved','CO-040326-0001',
 'Dell PowerEdge 32TB NVR server, APC Smart-UPS 3000VA, RAID6 config, footage migration.',
 27358.50,'2026-03-06 14:30:00','Y. Herbst','2026-03-04 16:00:00','2026-03-06 14:30:00');

-- ── Quote items (DELETE + INSERT for idempotency) ─────────
DELETE qi FROM bf_quote_items qi
  JOIN bf_quotes q ON q.id = qi.quote_id
  WHERE q.ref_id IN (
    'Q-140724-0001','Q-041124-0001','Q-150125-0001','Q-150625-0001',
    'Q-040226-0001','Q-050226-0001','Q-100226-0001','Q-230226-0001','Q-040326-0001'
  );

INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Site security audit & gap analysis (all sections)',      1.00, 28000.00 FROM bf_quotes WHERE ref_id='Q-140724-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Comprehensive security report & recommendations',        1.00,  7000.00 FROM bf_quotes WHERE ref_id='Q-140724-0001' LIMIT 1;

INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Hikvision DS-2CD2143G2-IU 4MP camera',                  6.00,  4800.00 FROM bf_quotes WHERE ref_id='Q-041124-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Hikvision DS-7732NI-I4 32-ch NVR',                      1.00, 14500.00 FROM bf_quotes WHERE ref_id='Q-041124-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Cabling, conduit & installation labour',                 1.00, 22200.00 FROM bf_quotes WHERE ref_id='Q-041124-0001' LIMIT 1;

INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'CCTV preventative maintenance — 42 cameras',            1.00, 18500.00 FROM bf_quotes WHERE ref_id='Q-150125-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Access control service & database backup',               1.00,  6250.00 FROM bf_quotes WHERE ref_id='Q-150125-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Panic station test & certification',                     1.00,  4000.00 FROM bf_quotes WHERE ref_id='Q-150125-0001' LIMIT 1;

INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'NOC workstation hardware (dual 27" + PC)',               1.00, 22000.00 FROM bf_quotes WHERE ref_id='Q-150625-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'AlarmSoft v4.2 alarm receiver software licence',         1.00,  8500.00 FROM bf_quotes WHERE ref_id='Q-150625-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Fence energiser replacement & commissioning — 2 zones',  1.00, 14700.00 FROM bf_quotes WHERE ref_id='Q-150625-0001' LIMIT 1;

INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Uniview IPC3615SB 5MP starlight camera',                 8.00,  1450.00 FROM bf_quotes WHERE ref_id='Q-040226-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Conduit repair, cable management & labour',              1.00,  7586.27 FROM bf_quotes WHERE ref_id='Q-040226-0001' LIMIT 1;

INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Paradox DG85 outdoor PIR beam',                         12.00,   950.00 FROM bf_quotes WHERE ref_id='Q-050226-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Texecom Grade 3 surface siren',                          3.00,  1350.00 FROM bf_quotes WHERE ref_id='Q-050226-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Alarm panel zone expansion card & commissioning',        1.00,  4963.16 FROM bf_quotes WHERE ref_id='Q-050226-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Installation labour & cable runs',                       1.00,  8600.00 FROM bf_quotes WHERE ref_id='Q-050226-0001' LIMIT 1;

INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'HID Multiclass SE reader replacement',                   2.00,  2800.00 FROM bf_quotes WHERE ref_id='Q-100226-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Access control card re-issue',                           3.00,   210.00 FROM bf_quotes WHERE ref_id='Q-100226-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Firmware update, database cleanup & labour',             1.00,  5760.00 FROM bf_quotes WHERE ref_id='Q-100226-0001' LIMIT 1;

INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Suprema BioEntry W3 palm vein reader',                   4.00,  6500.00 FROM bf_quotes WHERE ref_id='Q-230226-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Honeywell Pro-Watch integration & software setup',       1.00,  9500.00 FROM bf_quotes WHERE ref_id='Q-230226-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Staff biometric enrollment (47 personnel)',             47.00,   100.00 FROM bf_quotes WHERE ref_id='Q-230226-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Installation, cabling & commissioning',                  1.00,  7108.90 FROM bf_quotes WHERE ref_id='Q-230226-0001' LIMIT 1;

INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Dell PowerEdge R350 32TB NVR server',                    1.00, 14500.00 FROM bf_quotes WHERE ref_id='Q-040326-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'APC Smart-UPS 3000VA (SMT3000I)',                        1.00,  7200.00 FROM bf_quotes WHERE ref_id='Q-040326-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'CCTV archive migration (90-day footage)',                1.00,  3500.00 FROM bf_quotes WHERE ref_id='Q-040326-0001' LIMIT 1;
INSERT INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'RAID6 configuration, setup & remote monitoring',         1.00,  2158.50 FROM bf_quotes WHERE ref_id='Q-040326-0001' LIMIT 1;

-- Backfill callout_id FK on quotes
UPDATE bf_quotes q
  JOIN bf_callouts c ON c.ref_id = q.callout_ref
  SET q.callout_id = c.id
  WHERE q.callout_id IS NULL AND q.callout_ref != '';

-- ═══════════════════════════════════════════════════════════
-- 7. INVOICES (11)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO bf_invoices
  (ref_id, client_id, client_name, client_email, amount, due_date, status,
   quote_ref, callout_ref, po, invoice_date, paid_date, sent_by, created_at, updated_at)
VALUES
-- 2024
('INV-210724-0001', @aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  35000.00,'2024-08-21','Paid','Q-140724-0001','CO-140724-0001','CP0847',
  '2024-07-21','2024-08-10','j.shange','2024-07-21 12:00:00','2024-08-10 15:00:00'),
('INV-041124-0001', @aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  65500.00,'2024-12-04','Paid','Q-041124-0001','CO-041124-0001','CP1044',
  '2024-11-04','2024-12-10','j.shange','2024-11-04 16:00:00','2024-12-10 15:00:00'),
-- 2025
('INV-150125-0001', @aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  28750.00,'2025-02-15','Paid','Q-150125-0001','CO-150125-0001','AECI-PO-2025-003',
  '2025-01-28','2025-02-20','l.sithole','2025-01-28 10:00:00','2025-02-20 15:00:00'),
('INV-150625-0001', @aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  45200.00,'2025-07-15','Paid','Q-150625-0001','CO-150625-0001','AECI-PO-2025-045',
  '2025-06-26','2025-07-16','l.sithole','2025-06-26 10:00:00','2025-07-16 15:00:00'),
-- March 2026 batch (all paid 24 Apr 2026 — Remittance #122202)
('INV-060326-0001', @aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  18986.27,'2026-04-06','Paid','Q-040226-0001','CO-040226-0001','CP1492',
  '2026-03-06','2026-04-24','l.sithole','2026-03-06 09:00:00','2026-04-24 15:00:00'),
('INV-060326-0002', @aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  28163.16,'2026-04-06','Paid','Q-050226-0001','CO-050226-0001','CP1469',
  '2026-03-06','2026-04-24','l.sithole','2026-03-06 09:30:00','2026-04-24 15:00:00'),
('INV-060326-0003', @aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  12190.00,'2026-04-06','Paid','Q-100226-0001','CO-100226-0001','CP1550',
  '2026-03-06','2026-04-24','l.sithole','2026-03-06 10:00:00','2026-04-24 15:00:00'),
-- INV-090326-0001 cross-referenced in bf_digital_signatures
('INV-090326-0001', @aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  42308.90,'2026-04-09','Paid','Q-230226-0001','CO-230226-0001','CP1527',
  '2026-03-09','2026-04-24','l.sithole','2026-03-09 10:00:00','2026-04-24 15:00:00'),
('INV-120326-0001', @aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  27358.50,'2026-04-12','Paid','Q-040326-0001','CO-040326-0001','CP1551',
  '2026-03-12','2026-04-24','l.sithole','2026-03-12 08:00:00','2026-04-24 15:00:00'),
-- Emergency callout — no quote
('INV-120326-0002', @aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
   9947.50,'2026-04-12','Paid','','CO-120326-0001','CP1535',
  '2026-03-12','2026-04-24','l.sithole','2026-03-12 17:00:00','2026-04-24 15:00:00'),
-- Direct materials supply — no quote
('INV-120326-0003', @aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   2012.50,'2026-04-12','Paid','','CO-180326-0001','CP1536',
  '2026-03-12','2026-04-24','l.sithole','2026-03-12 17:30:00','2026-04-24 15:00:00');

-- Backfill FK columns on invoices
UPDATE bf_invoices i
  JOIN bf_quotes q ON q.ref_id = i.quote_ref
  SET i.quote_id = q.id
  WHERE i.quote_id IS NULL AND i.quote_ref != '';

UPDATE bf_invoices i
  JOIN bf_callouts c ON c.ref_id = i.callout_ref
  SET i.callout_id = c.id
  WHERE i.callout_id IS NULL AND i.callout_ref != '';

-- ═══════════════════════════════════════════════════════════
-- 8. TRANSACTIONS (credit entries per payment)
-- ═══════════════════════════════════════════════════════════
DELETE FROM bf_transactions
  WHERE reference IN (
    'INV-210724-0001','INV-041124-0001','INV-150125-0001','INV-150625-0001',
    'INV-060326-0001','INV-060326-0002','INV-060326-0003',
    'INV-090326-0001','INV-120326-0001','INV-120326-0002','INV-120326-0003'
  );
INSERT INTO bf_transactions (trans_date, description, category, reference, credit, debit, created_at) VALUES
('2024-08-10','Payment received — AECI Chempark','Invoice Payment','INV-210724-0001', 35000.00,0.00,'2024-08-10 15:00:00'),
('2024-12-10','Payment received — AECI Chempark','Invoice Payment','INV-041124-0001', 65500.00,0.00,'2024-12-10 15:00:00'),
('2025-02-20','Payment received — AECI Chempark','Invoice Payment','INV-150125-0001', 28750.00,0.00,'2025-02-20 15:00:00'),
('2025-07-16','Payment received — AECI Chempark','Invoice Payment','INV-150625-0001', 45200.00,0.00,'2025-07-16 15:00:00'),
('2026-04-24','Payment received — AECI Chempark','Invoice Payment','INV-060326-0001', 18986.27,0.00,'2026-04-24 15:00:00'),
('2026-04-24','Payment received — AECI Chempark','Invoice Payment','INV-060326-0002', 28163.16,0.00,'2026-04-24 15:00:00'),
('2026-04-24','Payment received — AECI Chempark','Invoice Payment','INV-060326-0003', 12190.00,0.00,'2026-04-24 15:00:00'),
('2026-04-24','Payment received — AECI Chempark','Invoice Payment','INV-090326-0001', 42308.90,0.00,'2026-04-24 15:00:00'),
('2026-04-24','Payment received — AECI Chempark','Invoice Payment','INV-120326-0001', 27358.50,0.00,'2026-04-24 15:00:00'),
('2026-04-24','Payment received — AECI Chempark','Invoice Payment','INV-120326-0002',  9947.50,0.00,'2026-04-24 15:00:00'),
('2026-04-24','Payment received — AECI Chempark','Invoice Payment','INV-120326-0003',  2012.50,0.00,'2026-04-24 15:00:00');

-- ═══════════════════════════════════════════════════════════
-- 9. PAYMENTS
-- ═══════════════════════════════════════════════════════════
DELETE FROM bf_payments
  WHERE payment_ref IN (
    'PAY-100824-0001','PAY-101224-0001','PAY-200225-0001','PAY-160725-0001','PAY-240426-0001'
  );
INSERT INTO bf_payments
  (payment_ref, invoice_ref, invoice_id, client_id, client_name, amount,
   payment_date, notes, logged_by, logged_by_user_id, created_at)
VALUES
('PAY-100824-0001','INV-210724-0001',
 (SELECT id FROM bf_invoices WHERE ref_id='INV-210724-0001' LIMIT 1),
 @aeci_id,'AECI Chempark',35000.00,'2024-08-10',
 'EFT payment. AECI Chempark. Ref: ASTUTEINS/AUG2024.',
 'l.sithole',@uid_lelo,'2024-08-10 15:00:00'),

('PAY-101224-0001','INV-041124-0001',
 (SELECT id FROM bf_invoices WHERE ref_id='INV-041124-0001' LIMIT 1),
 @aeci_id,'AECI Chempark',65500.00,'2024-12-10',
 'EFT payment. AECI Chempark. Ref: ASTUTEINS/DEC2024.',
 'l.sithole',@uid_lelo,'2024-12-10 15:00:00'),

('PAY-200225-0001','INV-150125-0001',
 (SELECT id FROM bf_invoices WHERE ref_id='INV-150125-0001' LIMIT 1),
 @aeci_id,'AECI Chempark',28750.00,'2025-02-20',
 'EFT payment. AECI Chempark. Ref: ASTUTEINS/FEB2025.',
 'l.sithole',@uid_lelo,'2025-02-20 15:00:00'),

('PAY-160725-0001','INV-150625-0001',
 (SELECT id FROM bf_invoices WHERE ref_id='INV-150625-0001' LIMIT 1),
 @aeci_id,'AECI Chempark',45200.00,'2025-07-16',
 'EFT payment. AECI Chempark. Ref: ASTUTEINS/JUL2025.',
 'l.sithole',@uid_lelo,'2025-07-16 15:00:00'),

-- PAY-240426-0001: Batch EFT — Remittance #122202 — R140,966.83 across 7 invoices
('PAY-240426-0001','INV-060326-0001',
 (SELECT id FROM bf_invoices WHERE ref_id='INV-060326-0001' LIMIT 1),
 @aeci_id,'AECI Chempark',18986.27,'2026-04-24',
 'Batch EFT — Remittance #122202. Total R140,966.83 across 7 invoices.',
 'l.sithole',@uid_lelo,'2026-04-24 15:00:00'),

('PAY-240426-0001','INV-060326-0002',
 (SELECT id FROM bf_invoices WHERE ref_id='INV-060326-0002' LIMIT 1),
 @aeci_id,'AECI Chempark',28163.16,'2026-04-24',
 'Batch EFT — Remittance #122202. Total R140,966.83 across 7 invoices.',
 'l.sithole',@uid_lelo,'2026-04-24 15:00:00'),

('PAY-240426-0001','INV-060326-0003',
 (SELECT id FROM bf_invoices WHERE ref_id='INV-060326-0003' LIMIT 1),
 @aeci_id,'AECI Chempark',12190.00,'2026-04-24',
 'Batch EFT — Remittance #122202. Total R140,966.83 across 7 invoices.',
 'l.sithole',@uid_lelo,'2026-04-24 15:00:00'),

('PAY-240426-0001','INV-090326-0001',
 (SELECT id FROM bf_invoices WHERE ref_id='INV-090326-0001' LIMIT 1),
 @aeci_id,'AECI Chempark',42308.90,'2026-04-24',
 'Batch EFT — Remittance #122202. Total R140,966.83 across 7 invoices.',
 'l.sithole',@uid_lelo,'2026-04-24 15:00:00'),

('PAY-240426-0001','INV-120326-0001',
 (SELECT id FROM bf_invoices WHERE ref_id='INV-120326-0001' LIMIT 1),
 @aeci_id,'AECI Chempark',27358.50,'2026-04-24',
 'Batch EFT — Remittance #122202. Total R140,966.83 across 7 invoices.',
 'l.sithole',@uid_lelo,'2026-04-24 15:00:00'),

('PAY-240426-0001','INV-120326-0002',
 (SELECT id FROM bf_invoices WHERE ref_id='INV-120326-0002' LIMIT 1),
 @aeci_id,'AECI Chempark',9947.50,'2026-04-24',
 'Batch EFT — Remittance #122202. Total R140,966.83 across 7 invoices.',
 'l.sithole',@uid_lelo,'2026-04-24 15:00:00'),

('PAY-240426-0001','INV-120326-0003',
 (SELECT id FROM bf_invoices WHERE ref_id='INV-120326-0003' LIMIT 1),
 @aeci_id,'AECI Chempark',2012.50,'2026-04-24',
 'Batch EFT — Remittance #122202. Total R140,966.83 across 7 invoices.',
 'l.sithole',@uid_lelo,'2026-04-24 15:00:00');

-- ═══════════════════════════════════════════════════════════
-- 10. STATEMENTS
-- ═══════════════════════════════════════════════════════════
DELETE FROM bf_statements WHERE ref_id IN ('STMT-060326-0001','STMT-130326-0001');
INSERT INTO bf_statements
  (ref_id, scheduled_for, status, invoice_refs, total_outstanding,
   released_by, released_at, from_email, to_emails, created_at)
VALUES
-- First statement: 3 invoices raised on 6 Mar
('STMT-060326-0001','2026-03-06','released',
 'INV-060326-0001,INV-060326-0002,INV-060326-0003',
 59339.43,
 'l.sithole','2026-03-06 10:30:00',
 'l.sithole@astuteinsights.co.za',
 'yolanda.herbst@aeciworld.com',
 '2026-03-06 10:00:00'),
-- Full March statement: all 7 invoices
('STMT-130326-0001','2026-03-13','released',
 'INV-060326-0001,INV-060326-0002,INV-060326-0003,INV-090326-0001,INV-120326-0001,INV-120326-0002,INV-120326-0003',
 140966.83,
 'l.sithole','2026-03-13 09:30:00',
 'l.sithole@astuteinsights.co.za',
 'yolanda.herbst@aeciworld.com,procurement@aeci.co.za',
 '2026-03-13 09:00:00');

-- ═══════════════════════════════════════════════════════════
-- 11. ATTACHMENTS (before/after photos + remittance)
-- ═══════════════════════════════════════════════════════════
DELETE FROM bf_attachments
  WHERE entity_type = 'callout' AND entity_ref IN (
    'CO-140724-0001','CO-041124-0001','CO-150125-0001','CO-150625-0001',
    'CO-040226-0001','CO-050226-0001','CO-100226-0001','CO-230226-0001',
    'CO-040326-0001','CO-120326-0001','CO-180326-0001'
  );
DELETE FROM bf_attachments
  WHERE entity_type = 'payment' AND entity_ref = 'PAY-240426-0001';

INSERT INTO bf_attachments
  (entity_type, entity_ref, original_name, stored_name, file_size, mime_type, uploaded_by, created_at)
VALUES
-- CO-140724-0001: Site security assessment
('callout','CO-140724-0001','before_site_overview_sections_abc.jpg',  'c1a4b7d2e3f5a8b9c0d1e4f2a5b8c9d0e1f4a7.jpg',245120,'image/jpeg','r.khumalo','2024-07-14 10:00:00'),
('callout','CO-140724-0001','before_cctv_section_a_gap_analysis.jpg', 'd2b5e8a3f6c9b0d4e7a2b5f8c1d4e7a0b3f6a9.jpg',198144,'image/jpeg','r.khumalo','2024-07-14 10:30:00'),
('callout','CO-140724-0001','after_audit_report_final.pdf',           'e3c6f9d2a5b8c1d4e7f0a3b6d9e2f5a8b1c4d7.pdf', 89600,'application/pdf','r.khumalo','2024-07-21 14:00:00'),
-- CO-041124-0001: CCTV upgrade
('callout','CO-041124-0001','before_section_a_old_cameras.jpg',       'f4d7a0e3b6c9f2a5b8d1e4a7b0c3f6e9d2a5b8.jpg',312320,'image/jpeg','r.khumalo','2024-11-04 08:00:00'),
('callout','CO-041124-0001','before_dvr_old_unit_corrosion.jpg',      'a5e8b1f4c7d0a3e6b9c2f5d8a1e4b7c0f3d6a9.jpg',278528,'image/jpeg','r.khumalo','2024-11-04 08:30:00'),
('callout','CO-041124-0001','after_new_hikvision_cameras.jpg',        'b6f9c2a5d8e1b4f7a0c3e6b9d2f5a8c1e4b7f0.jpg',334848,'image/jpeg','r.khumalo','2024-11-18 16:00:00'),
('callout','CO-041124-0001','after_dvr_commissioned_screenshot.jpg',  'c7a0d3b6e9c2f5d8a1e4b7c0f3d6a9e2b5f8c1.jpg',187392,'image/jpeg','r.khumalo','2024-11-18 16:30:00'),
-- CO-150125-0001: Annual service
('callout','CO-150125-0001','before_camera_lens_fouling.jpg',         'd8b1e4c7f0d3a6e9b2c5f8d1a4e7b0c3f6a9d2.jpg',145408,'image/jpeg','j.mthembu','2025-01-15 08:00:00'),
('callout','CO-150125-0001','after_service_checklist_signed.pdf',     'e9c2f5d8a1e4b7f0c3d6a9e2b5f8c1d4a7e0b3.pdf', 67584,'application/pdf','r.khumalo','2025-01-28 17:00:00'),
-- CO-150625-0001: NOC upgrade
('callout','CO-150625-0001','before_noc_old_workstation.jpg',         'f0d3a6e9b2c5f8d1a4e7b0c3f6a9d2b5e8c1f4.jpg',289792,'image/jpeg','r.khumalo','2025-06-15 09:00:00'),
('callout','CO-150625-0001','before_fence_zone3_energiser.jpg',       'a1e4b7f0c3d6a9b2f5e8a1c4d7f0b3e6a9c2d5.jpg',256000,'image/jpeg','r.khumalo','2025-06-15 10:00:00'),
('callout','CO-150625-0001','after_noc_dual_monitor_setup.jpg',       'b2f5c8a1d4e7b0c3f6d9a2e5b8c1f4d7a0e3b6.jpg',312320,'image/jpeg','r.khumalo','2025-06-26 16:00:00'),
('callout','CO-150625-0001','after_new_energiser_zone3_zone4.jpg',    'c3a6d9b2e5c8f1d4a7e0b3f6a9c2d5e8b1f4c7.jpg',198144,'image/jpeg','t.mokoena','2025-06-26 16:30:00'),
-- CO-040226-0001: Camera replacement
('callout','CO-040226-0001','before_section_b_aged_cameras.jpg',      'd4b7e0c3f6a9d2b5e8c1f4a7d0b3e6c9f2a5b8.jpg',334848,'image/jpeg','j.mthembu','2026-02-04 08:00:00'),
('callout','CO-040226-0001','before_conduit_damage_detail.jpg',       'e5c8f1a4d7e0b3f6c9d2a5e8b1c4f7a0d3e6b9.jpg',222208,'image/jpeg','j.mthembu','2026-02-04 09:00:00'),
('callout','CO-040226-0001','after_uniview_cameras_section_b.jpg',    'f6d9a2b5e8c1f4d7a0e3b6f9c2d5a8e1b4f7c0.jpg',378880,'image/jpeg','j.mthembu','2026-02-14 16:00:00'),
('callout','CO-040226-0001','after_nvr_firmware_version_screen.jpg',  'a7e0b3c6f9d2a5e8b1c4f7d0a3b6e9c2f5d8a1.jpg',145408,'image/jpeg','j.mthembu','2026-02-14 16:30:00'),
-- CO-050226-0001: Perimeter alarm upgrade
('callout','CO-050226-0001','before_corroded_sirens_north_wall.jpg',  'b8f1c4d7a0e3b6f9c2d5a8e1b4c7f0d3a6e9b2.jpg',187392,'image/jpeg','r.khumalo','2026-02-05 08:00:00'),
('callout','CO-050226-0001','after_new_pir_beams_installed.jpg',      'c9a2d5b8f1c4e7a0d3b6f9c2e5d8a1b4e7f0c3.jpg',290816,'image/jpeg','r.khumalo','2026-02-19 16:00:00'),
('callout','CO-050226-0001','after_alarm_panel_zone_test.jpg',        'd0b3e6c9f2d5a8b1e4c7f0d3a6e9b2c5f8d1a4.jpg',145408,'image/jpeg','t.mokoena','2026-02-19 16:30:00'),
-- CO-100226-0001: Access control maintenance
('callout','CO-100226-0001','before_faulty_hid_reader_gate.jpg',      'e1c4f7a0d3e6b9c2f5d8a1e4b7c0f3d6a9e2b5.jpg',165888,'image/jpeg','j.mthembu','2026-02-10 08:30:00'),
('callout','CO-100226-0001','after_new_hid_readers_installed.jpg',    'f2d5a8b1e4c7f0d3a6e9b2c5f8d1a4b7e0c3f6.jpg',201728,'image/jpeg','j.mthembu','2026-02-12 16:00:00'),
-- CO-230226-0001: Proface palm readers (larger project — more photos)
('callout','CO-230226-0001','before_old_keypad_restricted_zone.jpg',  'a3b6e9c2f5d8a1b4e7c0f3d6a9b2e5c8f1d4a7.jpg',289792,'image/jpeg','r.khumalo','2026-02-23 07:30:00'),
('callout','CO-230226-0001','before_restricted_zone_entrance.jpg',    'b4c7f0d3a6e9b2c5f8d1a4b7e0c3f6d9a2b5e8.jpg',256000,'image/jpeg','r.khumalo','2026-02-23 07:45:00'),
('callout','CO-230226-0001','during_palm_reader_installation.jpg',    'c5d8a1e4b7c0f3d6a9e2b5f8c1d4a7e0b3f6c9.jpg',198144,'image/jpeg','j.mthembu','2026-02-24 10:00:00'),
('callout','CO-230226-0001','after_all_4_palm_readers_live.jpg',      'd6e9b2f5c8d1a4e7b0c3f6d9a2b5f8e1c4d7a0.jpg',401408,'image/jpeg','r.khumalo','2026-03-07 16:00:00'),
('callout','CO-230226-0001','after_staff_enrollment_register.pdf',    'e7f0c3a6d9e2b5f8c1d4a7e0b3f6c9d2a5e8b1.pdf',125952,'application/pdf','r.khumalo','2026-03-07 16:30:00'),
('callout','CO-230226-0001','after_client_signoff_photo.jpg',         'f8a1d4b7e0f3a6d9b2e5c8f1d4a7b0e3c6f9d2.jpg',145408,'image/jpeg','r.khumalo','2026-03-07 17:00:00'),
-- CO-040326-0001: CCTV server & UPS
('callout','CO-040326-0001','before_noc_old_server_rack.jpg',         'a9b2e5c8f1d4a7b0e3c6f9d2a5e8b1c4f7d0a3.jpg',245120,'image/jpeg','r.khumalo','2026-03-04 08:00:00'),
('callout','CO-040326-0001','after_dell_poweredge_installed.jpg',     'b0c3f6d9a2b5e8c1f4d7a0e3b6c9f2d5a8b1e4.jpg',312320,'image/jpeg','r.khumalo','2026-03-11 16:00:00'),
('callout','CO-040326-0001','after_apc_ups_wired_running.jpg',        'c1d4a7e0b3c6f9d2a5e8b1c4f7d0a3b6e9c2f5.jpg',278528,'image/jpeg','j.mthembu','2026-03-11 16:30:00'),
-- CO-120326-0001: Emergency camera outage restoration
('callout','CO-120326-0001','before_surge_damaged_camera.jpg',        'd2e5b8c1f4d7a0e3b6c9f2d5a8e1b4c7f0d3a6.jpg',222208,'image/jpeg','r.khumalo','2026-03-12 04:00:00'),
('callout','CO-120326-0001','before_dvr_burnt_psu_closeup.jpg',       'e3f6c9a2d5e8b1c4f7d0a3e6b9c2f5d8a1e4b7.jpg',189440,'image/jpeg','r.khumalo','2026-03-12 04:15:00'),
('callout','CO-120326-0001','after_cameras_restored_live_feed.jpg',   'f4a7d0b3e6f9c2d5a8e1b4f7c0d3a6e9b2f5c8.jpg',267264,'image/jpeg','r.khumalo','2026-03-12 14:00:00'),
('callout','CO-120326-0001','after_client_signoff_s_ndevu.pdf',       'a5b8e1c4f7a0d3e6b9c2f5d8a1e4b7f0c3d6a9.pdf', 89600,'application/pdf','r.khumalo','2026-03-14 09:55:00'),
-- CO-180326-0001: Electrical materials delivery
('callout','CO-180326-0001','delivery_note_cp1536_materials.pdf',     'b6c9f2d5a8b1e4c7f0d3a6e9b2c5f8d1a4e7b0.pdf', 45056,'application/pdf','j.mthembu','2026-03-18 15:00:00'),
-- Payment remittance for PAY-240426-0001 (Remittance #122202)
('payment','PAY-240426-0001','AECI_Remittance_122202_24Apr2026.pdf',  'c7d0a3e6b9c2f5d8a1e4b7f0c3d6a9b2e5f8c1.pdf',156672,'application/pdf','l.sithole','2026-04-24 16:00:00');

SET FOREIGN_KEY_CHECKS = 1;
-- ── End of Part 3 ─────────────────────────────────────────
