#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
#  BlackFire Portal — cPanel Full Backup Script
#  Version: 1.0   Last updated: 2026-05-24
# ══════════════════════════════════════════════════════════════════════════════
#
#  WHAT IT DOES
#  ─────────────────────────────────────────────────────────────────────────────
#  1. Creates a timestamped folder under ~/tmp/backup/<YYYYMMDD_HHMMSS>/
#  2. Archives all files in public_html into a .tar.gz
#  3. Dumps the MySQL database into a compressed .sql.gz
#  4. Writes a MANIFEST.txt summarising the backup contents
#
#  PREREQUISITES
#  ─────────────────────────────────────────────────────────────────────────────
#  • cPanel shared hosting account (blackfm6w9f9)
#  • MySQL user with SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER privileges
#  • mysqldump available on the server PATH (standard on cPanel hosts)
#  • ~/tmp/backup/ directory writable by your cPanel user
#
#  FIRST-TIME SETUP  (do this once, then forget it)
#  ─────────────────────────────────────────────────────────────────────────────
#  Step 1 — Upload this script to your home directory via cPanel File Manager
#            or SFTP:
#              /home/blackfm6w9f9/backup_portal.sh
#
#  Step 2 — Set the DB password in the CONFIG section below:
#              DB_PASS="your-actual-password"
#
#  Step 3 — Make the script executable (SSH or cPanel Terminal):
#              chmod +x /home/blackfm6w9f9/backup_portal.sh
#
#  Step 4 — Create the backup log directory:
#              mkdir -p /home/blackfm6w9f9/tmp/backup
#
#  Step 5 — Test a manual run before scheduling:
#              bash /home/blackfm6w9f9/backup_portal.sh
#            Expect to see green [OK] lines and a "Backup complete!" message.
#            Verify the folder was created:
#              ls -lh ~/tmp/backup/
#
#  SCHEDULING (cPanel Cron Jobs)
#  ─────────────────────────────────────────────────────────────────────────────
#  In cPanel → Cron Jobs → Add New Cron Job, enter:
#
#    Minute : 0      Hour : 2    Day/Month/Weekday : * (every day)
#    Command:
#      bash /home/blackfm6w9f9/backup_portal.sh >> /home/blackfm6w9f9/tmp/backup/backup.log 2>&1
#
#  This runs the backup every day at 02:00 server time and appends all output
#  (including errors) to backup.log.
#
#  VIEWING LOGS
#  ─────────────────────────────────────────────────────────────────────────────
#  Tail the live log after a scheduled run:
#    tail -n 50 /home/blackfm6w9f9/tmp/backup/backup.log
#
#  RESTORING A BACKUP
#  ─────────────────────────────────────────────────────────────────────────────
#  Files:
#    tar -xzf /home/blackfm6w9f9/tmp/backup/<TIMESTAMP>/portal_files_<TIMESTAMP>.tar.gz \
#        -C /home/blackfm6w9f9/
#
#  Database:
#    gunzip < /home/blackfm6w9f9/tmp/backup/<TIMESTAMP>/portal_db_<TIMESTAMP>.sql.gz \
#        | mysql --user=blackfm6_bfuser --password blackfm6_portal
#
#  AUTO-PRUNING OLD BACKUPS
#  ─────────────────────────────────────────────────────────────────────────────
#  By default backups accumulate indefinitely.  To auto-delete backups older
#  than 7 days, uncomment the six lines near the bottom of this script
#  (search for "Optional: prune backups").
#
#  TROUBLESHOOTING
#  ─────────────────────────────────────────────────────────────────────────────
#  Exit 1 — Cannot create backup directory (check disk quota / permissions)
#  Exit 2 — tar failed (check that public_html exists and is readable)
#  Exit 3 — mysqldump failed (wrong DB_NAME / DB_USER / DB_PASS in CONFIG)
#
# ══════════════════════════════════════════════════════════════════════════════

# ─── CONFIGURE THESE ──────────────────────────────────────────────────────────
DB_NAME="blackfm6w9f9_portal"       # cPanel DB name
DB_USER="blackfm6w9f9_umlilo_admin"  # cPanel DB user
DB_PASS="1?SKM(zCz5Y])!*s"             # DB user password
# ─── END CONFIG ───────────────────────────────────────────────────────────────

CPANEL_USER="blackfm6w9f9"
HOME_DIR="/home/${CPANEL_USER}"
WEB_ROOT="${HOME_DIR}/public_html"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${HOME_DIR}/tmp/backup/${TIMESTAMP}"

# Colours for terminal output
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo ""
echo "======================================================"
echo "  BlackFire Portal Backup — ${TIMESTAMP}"
echo "======================================================"

# ── 1. Create backup directory ──────────────────────────────────────────────
mkdir -p "${BACKUP_DIR}"
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Could not create backup directory: ${BACKUP_DIR}"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Backup folder: ${BACKUP_DIR}"

# ── 2. Archive website files ─────────────────────────────────────────────────
FILES_ARCHIVE="${BACKUP_DIR}/portal_files_${TIMESTAMP}.tar.gz"
echo ""
echo "Archiving website files from ${WEB_ROOT} ..."
tar -czf "${FILES_ARCHIVE}" \
    --exclude="${WEB_ROOT}/error_log" \
    --exclude="${WEB_ROOT}/*.log" \
    -C "${HOME_DIR}" public_html

if [ $? -eq 0 ]; then
    FILES_SIZE=$(du -sh "${FILES_ARCHIVE}" | cut -f1)
    echo -e "${GREEN}[OK]${NC} Files archived → portal_files_${TIMESTAMP}.tar.gz  (${FILES_SIZE})"
else
    echo -e "${RED}[ERROR]${NC} File archive failed."
    exit 2
fi

# ── 3. Dump MySQL database ────────────────────────────────────────────────────
DB_DUMP="${BACKUP_DIR}/portal_db_${TIMESTAMP}.sql.gz"
echo ""
echo "Dumping database: ${DB_NAME} ..."
mysqldump \
    --user="${DB_USER}" \
    --password="${DB_PASS}" \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-table \
    "${DB_NAME}" | gzip > "${DB_DUMP}"

if [ $? -eq 0 ]; then
    DB_SIZE=$(du -sh "${DB_DUMP}" | cut -f1)
    echo -e "${GREEN}[OK]${NC} Database dumped → portal_db_${TIMESTAMP}.sql.gz  (${DB_SIZE})"
else
    echo -e "${RED}[ERROR]${NC} Database dump failed. Check DB_NAME / DB_USER / DB_PASS."
    exit 3
fi

# ── 4. Write manifest ─────────────────────────────────────────────────────────
MANIFEST="${BACKUP_DIR}/MANIFEST.txt"
{
    echo "BlackFire Portal Backup Manifest"
    echo "================================="
    echo "Timestamp : ${TIMESTAMP}"
    echo "Host      : ${CPANEL_USER}"
    echo "Web root  : ${WEB_ROOT}"
    echo "Database  : ${DB_NAME}"
    echo ""
    echo "Contents:"
    ls -lh "${BACKUP_DIR}"
    echo ""
    echo "File count in public_html:"
    tar -tzf "${FILES_ARCHIVE}" | wc -l
} > "${MANIFEST}"
echo -e "${GREEN}[OK]${NC} Manifest written → MANIFEST.txt"

# ── 5. Summary ────────────────────────────────────────────────────────────────
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo ""
echo "======================================================"
echo -e "  ${GREEN}Backup complete!${NC}"
echo "  Location : ${BACKUP_DIR}"
echo "  Total    : ${TOTAL_SIZE}"
echo "======================================================"
echo ""

# ── 6. Optional: prune backups older than 7 days ─────────────────────────────
# Uncomment the lines below to auto-delete backups older than 7 days:
# echo "Pruning backups older than 7 days..."
# find "${HOME_DIR}/tmp/backup" -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \;
# echo -e "${GREEN}[OK]${NC} Old backups pruned."
