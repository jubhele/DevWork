-- Migration: seed bf_counters 'pay' row
-- Required by next_ref_id('pay') in api/payments.php (batch payment reference generation).
-- Without this row, every payment batch gets PAY-{date}-0001 regardless of volume.
-- Safe to run multiple times (ON DUPLICATE KEY is a no-op if row already exists).

INSERT INTO bf_counters (counter_type, current_value)
VALUES ('pay', 0)
ON DUPLICATE KEY UPDATE counter_type = counter_type;
