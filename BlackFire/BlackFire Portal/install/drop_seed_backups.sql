-- ============================================================
-- Seed backup table cleanup (Dynamic with FK Hierarchy)
-- Finds every table ending with _seed_bak_YYYYMMDD_HHMMSS
-- Orders drops: deepest children first so no FK bypass is needed.
-- ============================================================

-- Increase max length just in case there are many backup tables to concatenate
SET SESSION group_concat_max_len = 100000;

-- Step 1 — review what will be dropped and verify the drop priority (1 drops first, 7 drops last):
SELECT TABLE_NAME,
       CASE
           WHEN TABLE_NAME LIKE 'bf_role_permissions_%' THEN 1
           WHEN TABLE_NAME LIKE 'bf_counters_%' THEN 1
           WHEN TABLE_NAME LIKE 'bf_attachments_%' THEN 1
           WHEN TABLE_NAME LIKE 'bf_quote_items_%' THEN 2
           WHEN TABLE_NAME LIKE 'bf_payments_%' THEN 2
           WHEN TABLE_NAME LIKE 'bf_invoices_%' THEN 3
           WHEN TABLE_NAME LIKE 'bf_quotes_%' THEN 3
           WHEN TABLE_NAME LIKE 'bf_callouts_%' THEN 4
           WHEN TABLE_NAME LIKE 'bf_transactions_%' THEN 5
           WHEN TABLE_NAME LIKE 'bf_statements_%' THEN 6
           WHEN TABLE_NAME LIKE 'bf_clients_%' THEN 7
           ELSE 99
       END AS drop_priority,
       CREATE_TIME
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME REGEXP '_seed_bak_[0-9]{8}_[0-9]{6}$'
 ORDER BY drop_priority, TABLE_NAME;


-- Step 2 — dynamically build and execute the DROP statement in that exact hierarchical order:
SET @tables = NULL;

SELECT GROUP_CONCAT(TABLE_NAME
         ORDER BY CASE
           WHEN TABLE_NAME LIKE 'bf_role_permissions_%' THEN 1
           WHEN TABLE_NAME LIKE 'bf_counters_%' THEN 1
           WHEN TABLE_NAME LIKE 'bf_attachments_%' THEN 1
           WHEN TABLE_NAME LIKE 'bf_quote_items_%' THEN 2
           WHEN TABLE_NAME LIKE 'bf_payments_%' THEN 2
           WHEN TABLE_NAME LIKE 'bf_invoices_%' THEN 3
           WHEN TABLE_NAME LIKE 'bf_quotes_%' THEN 3
           WHEN TABLE_NAME LIKE 'bf_callouts_%' THEN 4
           WHEN TABLE_NAME LIKE 'bf_transactions_%' THEN 5
           WHEN TABLE_NAME LIKE 'bf_statements_%' THEN 6
           WHEN TABLE_NAME LIKE 'bf_clients_%' THEN 7
           ELSE 99
         END, TABLE_NAME SEPARATOR ', ')
  INTO @tables
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME REGEXP '_seed_bak_[0-9]{8}_[0-9]{6}$';

SET @sql = IF(
  @tables IS NOT NULL,
  CONCAT('DROP TABLE IF EXISTS ', @tables),
  'SELECT ''No seed backup tables found'' AS result'
);

SELECT @sql AS generated_drop_statement;

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3 — verify cleanup: should return 0 rows if all seed backup tables were dropped:
SELECT TABLE_NAME, CREATE_TIME
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME REGEXP '_seed_bak_[0-9]{8}_[0-9]{6}$'
 ORDER BY TABLE_NAME;