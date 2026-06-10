# backup_restore_cpanel_20260610_062713

## Goal
Back up the existing local BlackFire Portal database and create a shell restore script usable in cPanel Terminal.

## Decisions
- Classified as Tier 2: small implementation plus local database backup and deployment handoff.
- Used local MySQL root account for the dump because the `.env` cPanel-style user was denied by local MySQL.
- Created a cPanel restore script that prompts for the DB password instead of hardcoding it.
- Restore script creates a pre-restore safety backup on cPanel before importing the uploaded dump.
- Revised restore script to behave like `deploy.sh`: run from cPanel home, auto-find newest `portal_local_db*.sql(.gz)` dump, read DB secret from `~/blackfire_secrets.php` when available, and use the same concise terminal style.
- Removed interactive DB password prompt. Restore now requires `BF_DB_PASS` or `BF_DB_PASS_ENC` in `~/blackfire_secrets.php` and stops before touching the database if the secret cannot be read.
- Restore now reads `BF_DB_NAME` and `BF_DB_USER` from `~/blackfire_secrets.php` too, with cPanel defaults only as fallback.
- Removed `--routines` and `--events` from cPanel safety backup because the hosting DB user lacks privileges to inspect stored procedures.
- Created a new cPanel-safe local dump without routines/events:
  - `BlackFire/BlackFire Portal/install/_backups/portal_local_db_cpanel_safe_20260610_065842.sql`
  - `BlackFire/BlackFire Portal/install/_backups/portal_local_db_cpanel_safe_20260610_065842.sql.gz`

## Work Done
- Read workspace memory and inspected the existing `install/backup_portal.sh` script.
- Backed up local database `blackfm6w9f9_portal` to:
  - `BlackFire/BlackFire Portal/install/_backups/portal_local_db_20260610_063001.sql`
  - `BlackFire/BlackFire Portal/install/_backups/portal_local_db_20260610_063001.sql.gz`
- Created `BlackFire/BlackFire Portal/install/restore_portal_db_cpanel.sh`.
- Updated `restore_portal_db_cpanel.sh` after cPanel test showed the old fixed dump path was too brittle.
- Updated `restore_portal_db_cpanel.sh` after cPanel test showed it was still prompting for a password and hardcoding the DB user.
- Updated `restore_portal_db_cpanel.sh` after cPanel test failed on `SHOW CREATE PROCEDURE` for `bf_drop_everything`.
- Verified the new cPanel-safe dump contains no `CREATE PROCEDURE`, `CREATE FUNCTION`, `CREATE EVENT`, `CREATE DEFINER`, or routine dump markers.
- SHA256 for new compressed dump: `96130E874323B3F82C2EC88133BAC8B4CD9ECD4448B9FFF712E9BB81F8CCB428`.
- Calculated SHA256 for the compressed dump: `C0E2D8353DE44D2DE46BA94C3A95650029B15AFCA1358FFB0612DAFF5A0DF27C`.

## Blockers / Next Steps
- Local PowerShell environment does not have `bash`, so `bash -n` syntax validation could not be run locally.
- On cPanel, upload the `.sql.gz` dump either to `/home/blackfm6w9f9/` or `/home/blackfm6w9f9/tmp/restore/`, upload the restore script to `/home/blackfm6w9f9/restore_portal_db_cpanel.sh`, then run it in cPanel Terminal.
- Rotate the GitHub PAT found in the local `.env`; treat it as exposed.

## Learnings
- Do not print raw `.env` lines even with partial redaction logic; redact all token-like values including PATs before display.
- For local MySQL on this machine, root without a password can read `blackfm6w9f9_portal`; the cPanel-style app user may not be valid locally.

