-- ============================================================
-- BlackFire Portal — Client Contacts (multi-contact per client)
-- BLKFR · IZILO-MIGRATE-CLIENT-CONTACTS-001 · 2026-05-31
--
-- Safe to re-run: IF NOT EXISTS guards on table; INSERT uses
-- NOT EXISTS check so migrated rows are not duplicated.
--
-- Run AFTER: clients_migration.sql
-- ============================================================

-- 1. Multi-contact table ----------------------------------------
CREATE TABLE IF NOT EXISTS bf_client_contacts (
    id           INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    client_id    INT UNSIGNED    NOT NULL,
    contact_name VARCHAR(255)    NOT NULL DEFAULT '',
    email        VARCHAR(150)    NOT NULL DEFAULT '',
    phone        VARCHAR(50)     NOT NULL DEFAULT '',
    title        VARCHAR(100)    NOT NULL DEFAULT '',
    is_primary   TINYINT(1)      NOT NULL DEFAULT 0,
    created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cc_client_id  (client_id),
    INDEX idx_cc_is_primary (client_id, is_primary),
    CONSTRAINT fk_cc_client
        FOREIGN KEY (client_id) REFERENCES bf_clients(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. Migrate legacy contact_person + email into bf_client_contacts
--    Runs only for clients that have no contacts yet.
INSERT INTO bf_client_contacts (client_id, contact_name, email, phone, is_primary)
SELECT
    id,
    CASE WHEN contact_person <> '' THEN contact_person ELSE 'Primary Contact' END,
    email,
    phone,
    1
FROM bf_clients
WHERE (contact_person <> '' OR email <> '')
  AND NOT EXISTS (
      SELECT 1 FROM bf_client_contacts cc WHERE cc.client_id = bf_clients.id
  );


-- 3. Confirm table exists
SELECT 'bf_client_contacts ready' AS status;
