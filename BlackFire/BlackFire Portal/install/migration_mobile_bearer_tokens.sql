-- ============================================================
-- Migration: Mobile Bearer Token Authentication
-- BlackFire Portal — Umlilo Portal
-- Created: 2026-05-28
--
-- Adds two new tables to support the mobile app (Expo / React Native):
--
--   bf_mobile_tokens     — Bearer tokens issued on mobile_login.
--                          Completely separate from PHP session auth.
--                          Web portal sessions (bf_portal cookie) are
--                          NOT touched by this migration.
--
--   bf_mobile_rate_limits — DB-level brute-force protection for the
--                          mobile login endpoint. Replaces the CAPTCHA
--                          that guards the web login (mobile apps cannot
--                          display CAPTCHA). 5 failures → 15-min lockout
--                          keyed by IP + device_id.
--
-- SAFETY GUARANTEE:
--   All changes are purely additive. No existing table is altered.
--   The dual-path current_user() in includes/auth.php reads the
--   Bearer header only when no PHP session exists, so every web
--   page and API endpoint behaves identically to before.
-- ============================================================

SET NAMES utf8mb4;

-- ── bf_mobile_tokens ─────────────────────────────────────────────
-- One row per issued token. Tokens are random 256-bit values;
-- only their SHA-256 hash is stored here (same pattern as
-- bf_password_resets). The raw token is returned once on
-- mobile_login and never stored in plain text.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bf_mobile_tokens (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  token_hash    CHAR(64)      NOT NULL UNIQUE COMMENT 'SHA-256 of the raw 32-byte token',
  device_id     VARCHAR(255)  DEFAULT NULL  COMMENT 'client-supplied device fingerprint (expo-device id or UUID)',
  device_name   VARCHAR(255)  DEFAULT NULL  COMMENT 'human-readable label (e.g. "iPhone 15 Pro")',
  last_used_at  DATETIME      DEFAULT NULL,
  expires_at    DATETIME      NOT NULL      COMMENT 'default: 30 days from issue',
  revoked       TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mbt_user FOREIGN KEY (user_id) REFERENCES bf_users (id) ON DELETE CASCADE,
  INDEX idx_token_hash  (token_hash),
  INDEX idx_user        (user_id),
  INDEX idx_expires     (expires_at),
  INDEX idx_device      (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── bf_mobile_rate_limits ─────────────────────────────────────────
-- Tracks failed login attempts from mobile clients.
-- Key: (ip_address, device_id) — either alone is spoofable;
-- combined they raise the bar significantly.
-- A missing device_id falls back to ip-only keying.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bf_mobile_rate_limits (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  ip_address      VARCHAR(45)   NOT NULL,
  device_id       VARCHAR(255)  NOT NULL DEFAULT '' COMMENT 'empty string when device_id not supplied',
  fail_count      TINYINT       NOT NULL DEFAULT 0,
  locked_until    DATETIME      DEFAULT NULL COMMENT 'NULL = not locked',
  last_attempt_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ip_device (ip_address, device_id),
  INDEX idx_locked (locked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
