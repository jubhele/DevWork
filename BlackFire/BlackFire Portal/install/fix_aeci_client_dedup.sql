-- ============================================================
-- BlackFire Portal — Fix AECI Chempark duplicates + add UNIQUE
-- Run this INSTEAD of the final ALTER TABLE in deduplicate_clients_by_name.sql
-- when that script leaves residual duplicates (3+ rows case).
-- ============================================================

START TRANSACTION;

-- 1. Confirm what we're working with
SELECT id, name, email, contact_person, created_at
FROM bf_clients
WHERE name = 'AECI Chempark'
ORDER BY id;

-- 2. Keep the lowest-id row; re-point all FK children away from the others
--    Using a session variable so MySQL doesn't choke on same-table subqueries.
SET @keep_id = (SELECT MIN(id) FROM bf_clients WHERE name = 'AECI Chempark');
SELECT @keep_id AS canonical_id;

-- bf_callouts
UPDATE bf_callouts co
    JOIN bf_clients c ON co.client_id = c.id
SET co.client_id = @keep_id
WHERE c.name = 'AECI Chempark'
  AND c.id  <> @keep_id;

-- bf_quotes
UPDATE bf_quotes q
    JOIN bf_clients c ON q.client_id = c.id
SET q.client_id = @keep_id
WHERE c.name = 'AECI Chempark'
  AND c.id  <> @keep_id;

-- bf_invoices
UPDATE bf_invoices inv
    JOIN bf_clients c ON inv.client_id = c.id
SET inv.client_id = @keep_id
WHERE c.name = 'AECI Chempark'
  AND c.id  <> @keep_id;

-- bf_users
UPDATE bf_users u
    JOIN bf_clients c ON u.client_id = c.id
SET u.client_id = @keep_id
WHERE c.name = 'AECI Chempark'
  AND c.id  <> @keep_id;

-- bf_client_contacts (migrated from this session)
UPDATE bf_client_contacts cc
    JOIN bf_clients c ON cc.client_id = c.id
SET cc.client_id = @keep_id
WHERE c.name = 'AECI Chempark'
  AND c.id  <> @keep_id;

-- 3. Delete all duplicate rows (all but the canonical id)
DELETE c
FROM bf_clients c
WHERE c.name = 'AECI Chempark'
  AND c.id  <> @keep_id;

SELECT ROW_COUNT() AS duplicate_rows_removed;

-- 4. Verify clean
SELECT id, name, email FROM bf_clients WHERE name = 'AECI Chempark';
-- Should show exactly 1 row.

COMMIT;

-- ── Run this block separately AFTER the COMMIT above ─────────────
-- Remove old plain index, add UNIQUE
ALTER TABLE bf_clients
    DROP INDEX IF EXISTS idx_cl_name;

ALTER TABLE bf_clients
    ADD UNIQUE INDEX uq_cl_name (name);

SELECT 'UNIQUE index added — duplicate client names are now prevented' AS status;
