-- Migration: portal enquiries table
-- Stores enquiries submitted via the portal contact form (p-contact page)
-- Run once against the bf_ database.

CREATE TABLE IF NOT EXISTS bf_portal_enquiries (
  id           INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255)     NOT NULL,
  company      VARCHAR(255)     NOT NULL DEFAULT '',
  phone        VARCHAR(50)      NOT NULL DEFAULT '',
  email        VARCHAR(255)     NOT NULL,
  service      VARCHAR(100)     NOT NULL,
  message      TEXT             NOT NULL,
  submitted_by VARCHAR(100)     NOT NULL DEFAULT '',
  submitted_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status       ENUM('New','In Progress','Closed') NOT NULL DEFAULT 'New',
  notes        TEXT             NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
