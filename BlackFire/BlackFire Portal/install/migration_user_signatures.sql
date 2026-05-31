-- ============================================================
-- Migration: User Signature Storage
-- BlackFire Portal
-- Created: 2026-05-31
--
-- Adds signature_image, signature_updated_by, signature_updated_at
-- to bf_users. Signature is stored as a base64 PNG data-URI with
-- the background already removed (processed server-side on upload).
--
-- Safe to re-run (ADD COLUMN IF NOT EXISTS).
-- ============================================================

SET NAMES utf8mb4;

ALTER TABLE `bf_users`
  ADD COLUMN IF NOT EXISTS `signature_image`      MEDIUMTEXT   NULL AFTER `email`,
  ADD COLUMN IF NOT EXISTS `signature_updated_by` VARCHAR(100) NULL AFTER `signature_image`,
  ADD COLUMN IF NOT EXISTS `signature_updated_at` DATETIME     NULL AFTER `signature_updated_by`;
