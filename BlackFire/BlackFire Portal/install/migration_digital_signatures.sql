-- ============================================================
-- Migration: Digital Signatures
-- BlackFire Portal — Astute Insights
-- Created: 2026-05-27
--
-- Adds bf_digital_signatures table supporting two methods:
--   1. email_link  — one-time token sent by email; signer clicks to sign
--   2. digital_certificate — X.509 or PDF digital cert upload
--
-- Each signed document gets a SHA-256 document hash stored so
-- tampering can be detected after the fact.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS bf_digital_signatures (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  entity_type      VARCHAR(30)  NOT NULL COMMENT 'safety_file | policy_ack | quote | invoice | callout',
  entity_ref       VARCHAR(50)  NOT NULL COMMENT 'ref_id of the linked record',
  document_label   VARCHAR(255) NOT NULL COMMENT 'human-readable description of what is being signed',
  signer_name      VARCHAR(255) NOT NULL,
  signer_email     VARCHAR(255) NOT NULL,
  signer_role      VARCHAR(100) DEFAULT NULL COMMENT 'role or title of the signer',
  signer_company   VARCHAR(255) DEFAULT NULL,
  signature_method ENUM('email_link','digital_certificate') NOT NULL DEFAULT 'email_link',
  -- Email-link method
  token            CHAR(64)     UNIQUE DEFAULT NULL COMMENT 'one-time signing token (email_link method)',
  token_expires_at DATETIME     DEFAULT NULL,
  -- Digital certificate method
  certificate_serial  VARCHAR(255) DEFAULT NULL,
  certificate_issuer  VARCHAR(255) DEFAULT NULL,
  certificate_subject VARCHAR(500) DEFAULT NULL,
  -- Signature payload
  signature_image  MEDIUMTEXT   DEFAULT NULL COMMENT 'base64 PNG of drawn/scanned signature',
  document_hash    CHAR(64)     DEFAULT NULL COMMENT 'SHA-256 of the document at time of signing',
  signed_document_ref VARCHAR(255) DEFAULT NULL COMMENT 'path or attachment ref of signed document',
  -- Status
  status           ENUM('Pending','Sent','Signed','Declined','Expired') NOT NULL DEFAULT 'Pending',
  sent_at          DATETIME     DEFAULT NULL,
  signed_at        DATETIME     DEFAULT NULL,
  declined_at      DATETIME     DEFAULT NULL,
  declined_reason  TEXT         DEFAULT NULL,
  signer_ip        VARCHAR(45)  DEFAULT NULL,
  -- Audit
  created_by       VARCHAR(100) NOT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_entity   (entity_type, entity_ref),
  INDEX idx_token    (token),
  INDEX idx_status   (status),
  INDEX idx_signer   (signer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── DEMO DATA: Digital Signatures ────────────────────────────
-- Shows the variety of signing scenarios in the safety lifecycle
INSERT IGNORE INTO bf_digital_signatures
  (entity_type, entity_ref, document_label, signer_name, signer_email, signer_role, signer_company,
   signature_method, token, token_expires_at, status, sent_at, signed_at, signer_ip, created_by, created_at)
VALUES
  -- Quote approval (email-link, client signed)
  ('quote','Q-140724-0001','Quote Q-140724-0001 — Site Security Assessment',
   'Yolanda Herbst','yolanda.herbst@aeciworld.com','Procurement Officer','AECI Chempark',
   'email_link','a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
   '2024-07-28 23:59:00','Signed','2024-07-18 09:00:00','2024-07-21 11:34:22','41.175.220.18',
   'j.shange','2024-07-18 09:00:00'),

  -- H&S Policy acknowledgment by James Mthembu
  ('safety_file','SAF-140724-0001','Health & Safety Policy Acknowledgment — James Mthembu',
   'James Mthembu','j.mthembu@astuteinsights.co.za','Junior Technician','Astute Insights Pty Ltd',
   'email_link','b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
   '2024-07-21 23:59:00','Signed','2024-07-15 08:00:00','2024-07-15 09:12:44','196.6.14.55',
   'kitso.marupi','2024-07-15 08:00:00'),

  -- H&S Policy acknowledgment by Refilwe Khumalo
  ('safety_file','SAF-140724-0001','Health & Safety Policy Acknowledgment — Refilwe Khumalo',
   'Refilwe Khumalo','r.khumalo@astuteinsights.co.za','Senior Technician','Astute Insights Pty Ltd',
   'email_link','c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
   '2024-07-21 23:59:00','Signed','2024-07-15 08:00:00','2024-07-15 10:05:31','196.6.14.55',
   'kitso.marupi','2024-07-15 08:00:00'),

  -- Quote approval for CCTV upgrade (email-link)
  ('quote','Q-041124-0001','Quote Q-041124-0001 — CCTV System Upgrade Chempark Section A',
   'Yolanda Herbst','yolanda.herbst@aeciworld.com','Procurement Officer','AECI Chempark',
   'email_link','d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
   '2024-11-18 23:59:00','Signed','2024-11-05 09:00:00','2024-11-07 14:22:09','41.175.220.18',
   'j.shange','2024-11-05 09:00:00'),

  -- Safety file sign-off by safety officer (Kitso)
  ('safety_file','SAF-120325-0001','Safety File Review Sign-Off — March 2025 Audit',
   'Kitso Marupi','kitso.marupi@astuteinsights.co.za','SHE Representative','Astute Insights Pty Ltd',
   'email_link','e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
   '2025-03-19 23:59:00','Signed','2025-03-13 08:00:00','2025-03-13 11:47:58','196.6.14.55',
   'kitso.marupi','2025-03-13 08:00:00'),

  -- Invoice approval (email-link, client confirms receipt)
  ('invoice','INV-090326-0001','Invoice INV-090326-0001 — Proface Palm Reader Supply & Install',
   'Yolanda Herbst','yolanda.herbst@aeciworld.com','Procurement Officer','AECI Chempark',
   'email_link','f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
   '2026-03-23 23:59:00','Signed','2026-03-10 09:00:00','2026-03-12 10:18:03','41.175.220.18',
   'j.shange','2026-03-10 09:00:00'),

  -- Job completion sign-off by client (callout approval)
  ('callout','CO-120326-0001','Job Completion Approval — Camera Outage Restoration',
   'Simphiwe Ndevu','simphiwe.ndevu@aeciworld.com','Site Manager','AECI Chempark',
   'email_link','a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
   '2026-03-19 23:59:00','Signed','2026-03-13 12:00:00','2026-03-14 09:55:17','41.175.220.18',
   'n.sithole','2026-03-13 12:00:00'),

  -- Pending digital cert signing (to show mixed states)
  ('safety_file','SAF-101025-0001','Annual Safety Review Sign-Off — October 2025',
   'Johann van der Berg','j.vdberg@auditors.co.za','Lead Auditor','External Audit Services',
   'digital_certificate',NULL,NULL,
   'Pending',NULL,NULL,NULL,
   'kitso.marupi','2025-10-12 08:00:00');
