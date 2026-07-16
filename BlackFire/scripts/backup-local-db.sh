#!/usr/bin/env bash
# Backup the local BlackFire Portal MySQL database (gzipped, timestamped).
# Credentials come from the portal .env (BF_DB_*) — nothing hardcoded.
set -u

GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../BlackFire Portal/.env"
BACKUP_DIR="${SCRIPT_DIR}/../_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# mysqldump is not on PATH on this machine
MYSQLDUMP="/c/Program Files/MySQL/MySQL Server 8.4/bin/mysqldump.exe"
[ -x "$MYSQLDUMP" ] || MYSQLDUMP="mysqldump"

# ── 1. Load credentials from .env ────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}[ERROR]${NC} .env not found: ${ENV_FILE}"
    exit 1
fi
DB_HOST=$(grep -m1 '^BF_DB_HOST=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
DB_PORT=$(grep -m1 '^BF_DB_PORT=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
DB_NAME=$(grep -m1 '^BF_DB_NAME=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
DB_USER=$(grep -m1 '^BF_DB_USER=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
DB_PASS=$(grep -m1 '^BF_DB_PASS=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')

if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
    echo -e "${RED}[ERROR]${NC} BF_DB_NAME / BF_DB_USER / BF_DB_PASS missing in .env"
    exit 2
fi

# ── 2. Ensure backup directory ───────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── 3. Dump MySQL database ───────────────────────────────────────────────────
DB_DUMP="${BACKUP_DIR}/portal_db_${TIMESTAMP}.sql.gz"
echo ""
echo "Dumping database: ${DB_NAME} ..."
# MYSQL_PWD keeps the password off the process command line;
# --no-tablespaces: portal user lacks the PROCESS privilege
# sed: MySQL 8 utf8mb4_0900_* collations don't exist on the cPanel server (MariaDB) —
# map them to utf8mb4_unicode_ci / utf8mb4_bin so dumps restore cleanly there
MYSQL_PWD="$DB_PASS" "$MYSQLDUMP" \
    --host="${DB_HOST:-localhost}" \
    --port="${DB_PORT:-3306}" \
    --user="${DB_USER}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --add-drop-table \
    --no-tablespaces \
    "${DB_NAME}" \
    | sed -e 's/utf8mb4_0900_bin/utf8mb4_bin/g' -e 's/utf8mb4_0900_[a-z_]*/utf8mb4_unicode_ci/g' \
    | gzip > "${DB_DUMP}"

if [ "${PIPESTATUS[0]}" -eq 0 ]; then
    DB_SIZE=$(du -sh "${DB_DUMP}" | cut -f1)
    echo -e "${GREEN}[OK]${NC} Database dumped → $(basename "${DB_DUMP}")  (${DB_SIZE})"
else
    rm -f "${DB_DUMP}"
    echo -e "${RED}[ERROR]${NC} Database dump failed. Check DB_NAME / DB_USER / DB_PASS."
    exit 3
fi
