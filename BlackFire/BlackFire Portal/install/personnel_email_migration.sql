-- ============================================================
-- Personnel Email Field
-- Migration: adds email column to bf_safety_personnel
-- Run after personnel_compliance_migration.sql
-- ============================================================

ALTER TABLE bf_safety_personnel
  ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT '' AFTER company;

-- End of migration
