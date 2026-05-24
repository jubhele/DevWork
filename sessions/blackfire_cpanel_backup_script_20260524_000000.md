# Session: BlackFire cPanel Backup Script
Date: 2026-05-24
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Write a cPanel/Linux bash script to back up the BlackFire portal website files (public_html) and MySQL database, storing everything in ~/tmp/backup/ on the cPanel server. User provided a screenshot showing the cPanel File Manager with tmp/backup as the target folder on host account blackfm6w9f9.

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: over-powered for this task

## Decisions
- Used bash (not PowerShell) since the target is a Linux cPanel server
- Timestamped backup folder per session so multiple backups don't overwrite each other
- Used mysqldump with --single-transaction for a hot backup (no table locks)
- DB credentials left as shell variables at top of script for easy substitution
- Separate tar.gz for files and .sql.gz for DB — smaller, faster, individually restorable

## Work Done
- BlackFire/BlackFire Portal/backup_portal.sh — new cPanel bash backup script

## Blockers / Next Steps
- User must fill in DB_NAME, DB_USER, DB_PASS variables before running
- Upload script to cPanel server and run: bash backup_portal.sh
- Optionally set up cPanel Cron Job to run on a schedule

## Learnings
- cPanel Linux account username visible in File Manager tree: blackfm6w9f9
- Target backup path on server: ~/tmp/backup/
- Portal is PHP/MySQL hosted on cPanel (confirmed from prior sessions)
## Resumed 2026-05-24

### Work Done
- backup_portal.sh — replaced thin 8-line header with a full 70-line guide covering: what it does, prerequisites, first-time setup (5 steps), scheduling the cron job, viewing logs, restoring files/DB, auto-pruning, and troubleshooting exit codes

### Decisions
- Added guide in-file as shell comments so it travels with the script (no separate doc to lose)
- Kept the guide in the comment header so `bash backup_portal.sh` still just runs normally

_Session ended: 2026-05-24 10:19 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-24 10:20:07 (Claude Code / claude-sonnet-4-6)_
