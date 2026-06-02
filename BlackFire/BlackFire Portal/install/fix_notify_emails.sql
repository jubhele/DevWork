-- ================================================================
-- Fix: update notify_email in bf_external_upload_tokens
-- Replace removed user kitso.marupi with j.shange (current admin)
-- Run once against the live database.
-- ================================================================

SET NAMES utf8mb4;

UPDATE bf_external_upload_tokens
SET notify_email = (SELECT email FROM bf_users WHERE username = 'j.shange' LIMIT 1)
WHERE notify_email = 'kitso.marupi@astuteinsights.co.za';

-- Verify
SELECT entity_ref, section_key, status, notify_email
FROM bf_external_upload_tokens
ORDER BY created_at;

-- ── End of fix_notify_emails.sql ─────────────────────────────────
