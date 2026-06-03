-- Fix bf_attachments: ensure uploaded_by_id FK column exists.
-- Run this if files.php returns 500 on GET ?action=list or POST upload.
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE bf_attachments
  ADD COLUMN IF NOT EXISTS uploaded_by_id INT UNSIGNED NULL
    COMMENT 'FK bf_users.id — user who uploaded this file';

ALTER TABLE bf_attachments
  ADD INDEX IF NOT EXISTS idx_att_uploaded_by_id (uploaded_by_id);
