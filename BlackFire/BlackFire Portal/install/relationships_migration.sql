-- ============================================================
-- BlackFire Solutions — Full Relationship FK Wiring
-- Migration: run AFTER clients_migration.sql
-- Adds INT FK columns alongside existing VARCHAR string refs.
-- Safe to re-run (IF NOT EXISTS guards on all ALTER statements).
-- ============================================================

-- ── bf_callouts ─────────────────────────────────────────

-- Who logged the callout
ALTER TABLE bf_callouts
    ADD COLUMN IF NOT EXISTS logged_by_user_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK bf_users.id — user who logged this callout',
    ADD INDEX IF NOT EXISTS idx_co_logged_by_uid (logged_by_user_id);

-- Which technician is assigned
ALTER TABLE bf_callouts
    ADD COLUMN IF NOT EXISTS assigned_to_user_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK bf_users.id — technician assigned to this callout',
    ADD INDEX IF NOT EXISTS idx_co_assigned_uid (assigned_to_user_id);


-- ── bf_quotes ────────────────────────────────────────────

-- Who submitted the quote
ALTER TABLE bf_quotes
    ADD COLUMN IF NOT EXISTS submitted_by_user_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK bf_users.id — user who submitted this quote',
    ADD INDEX IF NOT EXISTS idx_q_submitted_uid (submitted_by_user_id);

-- Linked callout (new — the form had a callout link field but it was never persisted)
ALTER TABLE bf_quotes
    ADD COLUMN IF NOT EXISTS callout_ref VARCHAR(30) NOT NULL DEFAULT ''
        COMMENT 'Denormalized callout ref_id string for fast display',
    ADD COLUMN IF NOT EXISTS callout_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK bf_callouts.id — callout this quote was raised for',
    ADD INDEX IF NOT EXISTS idx_q_callout_id (callout_id);


-- ── bf_invoices ──────────────────────────────────────────

-- Linked quote (numeric FK alongside existing quote_ref string)
ALTER TABLE bf_invoices
    ADD COLUMN IF NOT EXISTS quote_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK bf_quotes.id — quote this invoice was converted from',
    ADD INDEX IF NOT EXISTS idx_inv_quote_id (quote_id);

-- Linked callout (numeric FK alongside existing callout_ref string)
ALTER TABLE bf_invoices
    ADD COLUMN IF NOT EXISTS callout_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK bf_callouts.id — callout this invoice covers',
    ADD INDEX IF NOT EXISTS idx_inv_callout_id (callout_id);

-- Who sent / raised the invoice
ALTER TABLE bf_invoices
    ADD COLUMN IF NOT EXISTS sent_by_user_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK bf_users.id — user who created/sent the invoice',
    ADD INDEX IF NOT EXISTS idx_inv_sent_by_uid (sent_by_user_id);


-- ── bf_payments ──────────────────────────────────────────

-- Numeric FK to the invoice being paid (invoice_ref is the string ref_id)
ALTER TABLE bf_payments
    ADD COLUMN IF NOT EXISTS invoice_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK bf_invoices.id — invoice record being paid',
    ADD INDEX IF NOT EXISTS idx_pay_invoice_id (invoice_id);

-- Client FK (denorm client_name already present)
ALTER TABLE bf_payments
    ADD COLUMN IF NOT EXISTS client_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK bf_clients.id',
    ADD INDEX IF NOT EXISTS idx_pay_client_id (client_id);

-- Who logged the payment
ALTER TABLE bf_payments
    ADD COLUMN IF NOT EXISTS logged_by_user_id INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'FK bf_users.id — user who logged this payment',
    ADD INDEX IF NOT EXISTS idx_pay_logged_uid (logged_by_user_id);


-- ════════════════════════════════════════════════════════
-- BACK-FILL: resolve existing string refs to numeric FKs
-- These UPDATEs are idempotent (only fill where NULL)
-- ════════════════════════════════════════════════════════

-- callouts: logged_by → user_id
UPDATE bf_callouts c
    JOIN bf_users u ON u.username = c.logged_by
    SET c.logged_by_user_id = u.id
    WHERE c.logged_by_user_id IS NULL AND c.logged_by != '';

-- callouts: assigned_to → user_id
UPDATE bf_callouts c
    JOIN bf_users u ON u.username = c.assigned_to
    SET c.assigned_to_user_id = u.id
    WHERE c.assigned_to_user_id IS NULL AND c.assigned_to != '';

-- quotes: submitted_by → user_id
UPDATE bf_quotes q
    JOIN bf_users u ON u.username = q.submitted_by
    SET q.submitted_by_user_id = u.id
    WHERE q.submitted_by_user_id IS NULL AND q.submitted_by != '';

-- invoices: quote_ref → quote_id
UPDATE bf_invoices i
    JOIN bf_quotes q ON q.ref_id = i.quote_ref
    SET i.quote_id = q.id
    WHERE i.quote_id IS NULL AND i.quote_ref != '';

-- invoices: callout_ref → callout_id
UPDATE bf_invoices i
    JOIN bf_callouts c ON c.ref_id = i.callout_ref
    SET i.callout_id = c.id
    WHERE i.callout_id IS NULL AND i.callout_ref != '';

-- invoices: sent_by → user_id
UPDATE bf_invoices i
    JOIN bf_users u ON u.username = i.sent_by
    SET i.sent_by_user_id = u.id
    WHERE i.sent_by_user_id IS NULL AND i.sent_by != '';

-- payments: invoice_ref → invoice_id
UPDATE bf_payments p
    JOIN bf_invoices i ON i.ref_id = p.invoice_ref
    SET p.invoice_id = i.id
    WHERE p.invoice_id IS NULL AND p.invoice_ref != '';

-- payments: client via invoice FK
UPDATE bf_payments p
    JOIN bf_invoices i ON i.ref_id = p.invoice_ref
    SET p.client_id = i.client_id
    WHERE p.client_id IS NULL AND i.client_id IS NOT NULL;

-- payments: logged_by → user_id
UPDATE bf_payments p
    JOIN bf_users u ON u.username = p.logged_by
    SET p.logged_by_user_id = u.id
    WHERE p.logged_by_user_id IS NULL AND p.logged_by != '';

-- End of migration
