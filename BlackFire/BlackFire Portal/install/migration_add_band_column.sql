-- ============================================================
-- Migration: Add band column to bf_safety_files
-- BlackFire Portal — Astute Insights
-- Created: 2026-05-28
--
-- Run order: AFTER safety_migration.sql and safety_soft_delete_migration.sql,
--            BEFORE blackfire_testdata_part1/2/3.sql
-- ============================================================

SET NAMES utf8mb4;

ALTER TABLE `bf_safety_files`
  ADD COLUMN IF NOT EXISTS `band`
    ENUM('RED','ORANGE','YELLOW','GREEN') DEFAULT NULL
  AFTER `score`;

-- Backfill band from stored score for all existing rows
UPDATE `bf_safety_files` SET `band` =
  CASE
    WHEN score >= 89 THEN 'GREEN'
    WHEN score >= 74 THEN 'YELLOW'
    WHEN score >= 50 THEN 'ORANGE'
    ELSE 'RED'
  END
WHERE score IS NOT NULL;
