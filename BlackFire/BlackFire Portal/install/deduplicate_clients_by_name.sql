-- ============================================================
-- BlackFire Solutions — Deduplicate bf_clients by name
-- File: install/deduplicate_clients_by_name.sql
--
-- Problem: bf_clients has INDEX (not UNIQUE) on `name`,
--          so two rows with the same client name can exist.
--
-- Strategy:
--   1. Show duplicates (read-only diagnostic)
--   2. Re-point all FK references from the higher-ID copy
--      to the canonical (lowest-ID) record
--   3. Delete the duplicate row(s)
--   4. Add UNIQUE constraint to prevent recurrence
--
-- Run inside a transaction. Review output, then COMMIT or ROLLBACK.
-- ============================================================

START TRANSACTION;

-- ── 1. Diagnostic: show duplicate client names ───────────────────
SELECT
    name,
    COUNT(*)        AS copies,
    MIN(id)         AS keep_id,
    MAX(id)         AS drop_id,
    GROUP_CONCAT(id ORDER BY id SEPARATOR ', ') AS all_ids
FROM bf_clients
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY name;

-- If the query above returns no rows, there are no name duplicates.
-- You can ROLLBACK immediately.

-- ── 2. Re-point FK references before deleting ────────────────────
-- For every pair (keep_id = MIN, drop_id = MAX) re-assign child rows.

-- bf_callouts.client_id
UPDATE bf_callouts co
    JOIN (
        SELECT MIN(id) AS keep_id, MAX(id) AS drop_id
        FROM bf_clients
        GROUP BY name
        HAVING COUNT(*) > 1
    ) dupes ON co.client_id = dupes.drop_id
SET co.client_id = dupes.keep_id;

-- bf_quotes.client_id
UPDATE bf_quotes q
    JOIN (
        SELECT MIN(id) AS keep_id, MAX(id) AS drop_id
        FROM bf_clients
        GROUP BY name
        HAVING COUNT(*) > 1
    ) dupes ON q.client_id = dupes.drop_id
SET q.client_id = dupes.keep_id;

-- bf_invoices.client_id
UPDATE bf_invoices inv
    JOIN (
        SELECT MIN(id) AS keep_id, MAX(id) AS drop_id
        FROM bf_clients
        GROUP BY name
        HAVING COUNT(*) > 1
    ) dupes ON inv.client_id = dupes.drop_id
SET inv.client_id = dupes.keep_id;

-- bf_users.client_id
UPDATE bf_users u
    JOIN (
        SELECT MIN(id) AS keep_id, MAX(id) AS drop_id
        FROM bf_clients
        GROUP BY name
        HAVING COUNT(*) > 1
    ) dupes ON u.client_id = dupes.drop_id
SET u.client_id = dupes.keep_id;

-- bf_payments.client_id
UPDATE bf_payments p
    JOIN (
        SELECT MIN(id) AS keep_id, MAX(id) AS drop_id
        FROM bf_clients
        GROUP BY name
        HAVING COUNT(*) > 1
    ) dupes ON p.client_id = dupes.drop_id
SET p.client_id = dupes.keep_id;

-- ── 3. Delete the duplicate (higher-ID) rows ─────────────────────
DELETE c
FROM bf_clients c
JOIN (
    SELECT MAX(id) AS drop_id
    FROM bf_clients
    GROUP BY name
    HAVING COUNT(*) > 1
) dupes ON c.id = dupes.drop_id;

SELECT ROW_COUNT() AS duplicate_rows_removed;

-- ── 4. Confirm no duplicates remain ──────────────────────────────
SELECT name, COUNT(*) AS copies
FROM bf_clients
GROUP BY name
HAVING COUNT(*) > 1;
-- Should return 0 rows.

-- ── Review output, then: ─────────────────────────────────────────
--   COMMIT;    ← apply all changes
--   ROLLBACK;  ← undo everything
COMMIT;

-- ── 5. Add UNIQUE constraint to prevent future duplicates ─────────
-- Run this AFTER committing the transaction above.
-- Safe to re-run (IF NOT EXISTS variant below).

-- Remove the old plain index first (it becomes redundant once UNIQUE exists)
ALTER TABLE bf_clients
    DROP INDEX IF EXISTS idx_cl_name;

-- Add the UNIQUE index
ALTER TABLE bf_clients
    ADD UNIQUE INDEX uq_cl_name (name);
