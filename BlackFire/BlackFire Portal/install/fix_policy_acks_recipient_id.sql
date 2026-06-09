-- Fix bf_policy_acks: add recipient_id and created_by_id columns
ALTER TABLE bf_policy_acks ADD COLUMN IF NOT EXISTS recipient_id   INT UNSIGNED NULL;
ALTER TABLE bf_policy_acks ADD COLUMN IF NOT EXISTS created_by_id  INT UNSIGNED NULL;
