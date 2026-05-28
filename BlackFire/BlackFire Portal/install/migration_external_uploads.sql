-- ============================================================
-- Migration: External Document Upload Tokens
-- BlackFire Portal — Astute Insights
-- Created: 2026-05-27
--
-- Allows third-party (external) users to upload documents into
-- a specific safety file without needing a portal account.
--
-- USE CASES:
--   • Medical practitioner submits employee medical certificates
--   • Training provider uploads completed training records
--   • Sub-contractor submits their own SHE file documents
--   • Client uploads signed PO or approval letters
--
-- HOW IT WORKS:
--   1. Portal user generates an upload token linked to a safety
--      file section (e.g. Section C — Medical Fitness).
--   2. System sends email with a unique upload link to the
--      external party (e.g. doctor@medclinic.co.za).
--   3. External party opens link in browser — no login required.
--   4. They upload file(s) up to max_files; each upload creates
--      a record in bf_attachments with entity_type='safety_file'
--      and notes the external uploader's name/company.
--   5. Token auto-expires after expires_at or when max_files used.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS bf_external_upload_tokens (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  token            CHAR(64)     NOT NULL UNIQUE COMMENT 'URL-safe random token',
  entity_type      VARCHAR(30)  NOT NULL DEFAULT 'safety_file' COMMENT 'safety_file | callout',
  entity_ref       VARCHAR(50)  NOT NULL COMMENT 'ref_id of the linked safety file or callout',
  section_key      CHAR(1)      DEFAULT NULL COMMENT 'A-I — restrict uploads to this section',
  item_no          TINYINT      DEFAULT NULL COMMENT 'restrict to this item number within section',
  upload_purpose   VARCHAR(255) NOT NULL COMMENT 'instruction shown to the external uploader',
  allowed_mime_types VARCHAR(500) DEFAULT 'application/pdf,image/jpeg,image/png' COMMENT 'comma-separated MIME types',
  max_files        TINYINT      NOT NULL DEFAULT 5,
  files_uploaded   TINYINT      NOT NULL DEFAULT 0,
  -- External party details (self-reported on upload)
  uploader_name    VARCHAR(255) DEFAULT NULL,
  uploader_email   VARCHAR(255) DEFAULT NULL,
  uploader_company VARCHAR(255) DEFAULT NULL,
  uploader_phone   VARCHAR(50)  DEFAULT NULL,
  -- Status tracking
  status           ENUM('Active','Partially Used','Completed','Expired','Cancelled') NOT NULL DEFAULT 'Active',
  expires_at       DATETIME     NOT NULL,
  first_used_at    DATETIME     DEFAULT NULL,
  completed_at     DATETIME     DEFAULT NULL,
  -- Notification
  notify_email     VARCHAR(255) DEFAULT NULL COMMENT 'portal user to notify when uploads arrive',
  last_reminder_at DATETIME     DEFAULT NULL,
  -- Audit
  created_by       VARCHAR(100) NOT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_token      (token),
  INDEX idx_entity     (entity_type, entity_ref),
  INDEX idx_status     (status),
  INDEX idx_expires    (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed Data: External Upload Tokens ────────────────────────
INSERT IGNORE INTO bf_external_upload_tokens
  (token, entity_type, entity_ref, section_key, item_no,
   upload_purpose, allowed_mime_types, max_files, files_uploaded,
   uploader_name, uploader_email, uploader_company,
   status, expires_at, first_used_at, completed_at,
   notify_email, created_by, created_at)
VALUES
  -- Medical practitioner uploads staff medicals (Section C, Item 1)
  -- COMPLETED — used Jul 2024, three medicals submitted
  ('ext01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
   'safety_file','SAF-140724-0001','C',1,
   'Please upload the completed Certificates of Medical Fitness (Annexure 3 format) for all three Astute Insights site employees: James Mthembu, Refilwe Khumalo, and Kitso Marupi.',
   'application/pdf,image/jpeg,image/png',5,3,
   'Dr. Aisha Petersen','a.petersen@occupationalhealth.co.za','Occupational Health Solutions Pty Ltd',
   'Completed','2024-07-28 23:59:00','2024-07-16 10:14:00','2024-07-16 10:41:22',
   'kitso.marupi@astuteinsights.co.za','kitso.marupi','2024-07-14 14:00:00'),

  -- Training provider uploads PSIRA and fire training certificates (Section D)
  -- COMPLETED — used Nov 2024
  ('ext02b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
   'safety_file','SAF-151124-0001','D',4,
   'Upload fire extinguisher training completion certificates for: James Mthembu, Refilwe Khumalo. Each certificate must show trainee name, date of training, and trainer signature.',
   'application/pdf',5,2,
   'Pieter Joubert','p.joubert@firesafetytraining.co.za','FireSafe Training Academy',
   'Completed','2024-11-30 23:59:00','2024-11-20 09:33:00','2024-11-20 09:52:11',
   'kitso.marupi@astuteinsights.co.za','kitso.marupi','2024-11-15 10:00:00'),

  -- Medical practitioner uploads annual renewal medicals (Section C) — currently active
  ('ext03c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
   'safety_file','SAF-210526-0001','C',1,
   'Annual renewal of Certificates of Medical Fitness for all five site personnel. Please upload one certificate per person as a separate PDF. Certificates must be dated May 2026 and signed by the Occupational Health Practitioner.',
   'application/pdf',10,0,
   NULL,NULL,NULL,
   'Active','2026-06-10 23:59:00',NULL,NULL,
   'kitso.marupi@astuteinsights.co.za','kitso.marupi','2026-05-22 08:00:00');
