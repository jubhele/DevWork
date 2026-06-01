-- ============================================================
-- Migration: Remove redundant free-text person columns
-- All person identity comes from bf_users via user_id / appointee_id FK.
--
-- bf_safety_items.appointee        → redundant; name read via JOIN bf_users
-- bf_safety_personnel.full_name    → redundant; name read via JOIN bf_users
--
-- KEPT (safety-file-specific, not in bf_users):
--   bf_safety_personnel.id_number  → SA ID / passport number (OHS Act compliance)
--   bf_safety_personnel.company    → employer on site (may differ from portal account)
--   bf_safety_files.auditor_name   → external AECI auditor — never a portal user
--   bf_safety_files.contractor_rep → text fallback while not all reps are portal users
--   bf_safety_files.appointee162   → same
--
-- Run order: AFTER migration_personnel_user_fk.sql
--            AFTER migration_safety_files_user_fk.sql
-- ============================================================

SET NAMES utf8mb4;

-- ── 1. bf_safety_items: make appointee nullable ──────────────
--    (PHP no longer writes it; existing rows kept for reference
--     until a future DROP COLUMN is confirmed safe in production)
ALTER TABLE `bf_safety_items`
  MODIFY COLUMN `appointee` VARCHAR(255) NULL DEFAULT NULL;

-- ── 2. bf_safety_personnel: make full_name nullable ──────────
--    (PHP reads u.name via JOIN; this column is no longer written
--     on new inserts or reinstates)
ALTER TABLE `bf_safety_personnel`
  MODIFY COLUMN `full_name` VARCHAR(255) NULL DEFAULT NULL;

-- ── Verify ───────────────────────────────────────────────────
SELECT
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name   = 'bf_safety_items'
  AND column_name  = 'appointee';

SELECT
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name   = 'bf_safety_personnel'
  AND column_name  = 'full_name';

-- End of migration
