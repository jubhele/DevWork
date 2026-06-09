-- Fix bf_statements: add DEFAULT '' to NOT NULL columns excluded from INSERT
ALTER TABLE bf_statements ALTER COLUMN from_email SET DEFAULT '';
ALTER TABLE bf_statements ALTER COLUMN to_emails  SET DEFAULT '';
