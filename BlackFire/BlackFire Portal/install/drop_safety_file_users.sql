-- Drop bf_safety_file_users
--
-- This table was the original join table between safety files and portal users.
-- It has been superseded by bf_safety_personnel.portal_user_id, which is now
-- the single source of truth for portal-user links.
--
-- Safe to run AFTER deploying:
--   api/safety_personnel.php  (no longer references this table)
--   portal.js                 (UI merged people lists, no longer calls linked_users endpoint)
--
-- Run this script once on the live database. There is no rollback — take a
-- full database backup before executing.

DROP TABLE IF EXISTS bf_safety_file_users;
