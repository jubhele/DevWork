-- ============================================================
-- BlackFire Solutions — Remove Duplicate Records (All Tables)
-- File: install/deduplicate_all_tables.sql
-- Purpose: Scan every table in the current database and delete
--          duplicate rows, keeping the one with the lowest PK.
--
-- Strategy per table:
--   DELETE t1 FROM tbl t1
--   INNER JOIN tbl t2
--     ON t1.pk > t2.pk
--     AND t1.col1 = t2.col1 AND t1.col2 = t2.col2 ...
--
-- Tables with no AUTO_INCREMENT primary key are skipped safely.
-- Run inside a transaction so you can ROLLBACK if anything looks wrong.
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS bf_deduplicate_all$$

CREATE PROCEDURE bf_deduplicate_all()
BEGIN
    DECLARE done      INT DEFAULT 0;
    DECLARE tbl       VARCHAR(200);
    DECLARE pk_col    VARCHAR(200);
    DECLARE join_expr TEXT;
    DECLARE del_sql   TEXT;
    DECLARE row_count_val INT DEFAULT 0;
    DECLARE total_removed INT DEFAULT 0;

    -- Cursor: all base tables in the current database
    DECLARE tbl_cursor CURSOR FOR
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN tbl_cursor;

    scan_loop: LOOP
        FETCH tbl_cursor INTO tbl;
        IF done THEN LEAVE scan_loop; END IF;

        -- ── Locate an AUTO_INCREMENT primary-key column ──────────────────
        SET pk_col = NULL;
        SELECT COLUMN_NAME INTO pk_col
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = tbl
          AND COLUMN_KEY   = 'PRI'
          AND EXTRA        LIKE '%auto_increment%'
        LIMIT 1;

        IF pk_col IS NULL THEN
            SELECT CONCAT('[SKIP  ] ', tbl,
                          ' — no AUTO_INCREMENT PK; deduplicate manually if needed') AS status;
            ITERATE scan_loop;
        END IF;

        -- ── Build equality conditions for all non-PK columns ─────────────
        SET join_expr = NULL;
        SELECT GROUP_CONCAT(
                   CONCAT('t1.`', COLUMN_NAME, '` <=> t2.`', COLUMN_NAME, '`')
                   -- <=> is NULL-safe equality; handles nullable columns correctly
                   ORDER BY ORDINAL_POSITION
                   SEPARATOR ' AND '
               ) INTO join_expr
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = tbl
          AND COLUMN_NAME <> pk_col;

        IF join_expr IS NULL OR join_expr = '' THEN
            SELECT CONCAT('[SKIP  ] ', tbl,
                          ' — only one column (the PK); nothing to compare') AS status;
            ITERATE scan_loop;
        END IF;

        -- ── Execute delete ────────────────────────────────────────────────
        SET del_sql = CONCAT(
            'DELETE t1 FROM `', tbl, '` t1 ',
            'INNER JOIN `', tbl, '` t2 ',
            'ON t1.`', pk_col, '` > t2.`', pk_col, '` ',
            'AND ', join_expr
        );

        SET @_sql = del_sql;
        PREPARE _stmt FROM @_sql;
        EXECUTE _stmt;
        DEALLOCATE PREPARE _stmt;

        SET row_count_val = ROW_COUNT();
        SET total_removed  = total_removed + row_count_val;

        IF row_count_val > 0 THEN
            SELECT CONCAT('[DUPES ] ', tbl,
                          ' — removed ', row_count_val, ' duplicate row(s)') AS status;
        ELSE
            SELECT CONCAT('[CLEAN ] ', tbl) AS status;
        END IF;

    END LOOP;

    CLOSE tbl_cursor;

    SELECT CONCAT('[DONE  ] Total duplicate rows removed: ', total_removed) AS status;
END$$

DELIMITER ;

-- ============================================================
-- Run inside a transaction so you can ROLLBACK if needed
-- ============================================================
START TRANSACTION;

CALL bf_deduplicate_all();

-- Review the output above, then:
--   COMMIT;    ← keep the deletions
--   ROLLBACK;  ← undo everything if something looks wrong
COMMIT;

-- Clean up the procedure
DROP PROCEDURE IF EXISTS bf_deduplicate_all;
