-- Migration: add created_by_id FK to bf_external_upload_tokens
-- created_by_id column already exists on this server; created_by text column already dropped.
-- This script only ensures the FK constraint is in place.
-- Safe to run multiple times.

ALTER TABLE bf_external_upload_tokens
  ADD COLUMN IF NOT EXISTS created_by_id INT UNSIGNED NULL
    COMMENT 'FK bf_users.id — portal user who created this token';

ALTER TABLE bf_external_upload_tokens
  DROP FOREIGN KEY IF EXISTS fk_ext_created_by;
ALTER TABLE bf_external_upload_tokens
  ADD CONSTRAINT fk_ext_created_by
    FOREIGN KEY (created_by_id) REFERENCES bf_users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE bf_external_upload_tokens
  DROP COLUMN IF EXISTS created_by;
