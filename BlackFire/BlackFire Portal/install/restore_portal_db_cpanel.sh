#!/bin/bash
# ================================================================
# BlackFire Portal - Afrihost DB Restore Script
# BLKFR - IZILO-RESTORE-001 - 2026-06-10
#
# Usage:
#   bash restore_portal_db_cpanel.sh
#   bash restore_portal_db_cpanel.sh /path/to/dump.sql.gz
#
# What it does:
#   1. Finds a local portal dump by common backup naming patterns
#   2. Reads DB password from ~/blackfire_secrets.php
#   3. Backs up current cPanel tables/triggers before restore
#   4. Imports the dump into the cPanel database
#
# Run from: /home/blackfm6w9f9/ via cPanel Terminal
#   bash restore_portal_db_cpanel.sh
#
# Upload the dump to one of these locations:
#   ~/portal_local_db_YYYYMMDD_HHMMSS.sql.gz
#   ~/blackfm6w9f9_portal_backup_YYYYMMDD_HHMMSS.sql.gz
#   ~/tmp/restore/portal_local_db_YYYYMMDD_HHMMSS.sql.gz
#   ~/tmp/restore/blackfm6w9f9_portal_backup_YYYYMMDD_HHMMSS.sql.gz
#   same folder as this script
# ================================================================

set -euo pipefail

DEFAULT_DB_NAME="blackfm6w9f9_portal"
DEFAULT_DB_USER="blackfm6w9f9_umlilo_admin"
RESTORE_DIR="${HOME}/tmp/restore"
SAFETY_BACKUP_DIR="${HOME}/tmp/backup/pre_restore"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; AMBER='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}>${RESET} $*"; }
ok()   { echo -e "${GREEN}[OK]${RESET} $*"; }
warn() { echo -e "${AMBER}[WARN]${RESET} $*"; }
fail() { echo -e "${RED}[ERROR]${RESET} $*"; exit 1; }

ASSUME_YES="no"
DUMP_FILE=""

for arg in "$@"; do
  case "$arg" in
    --yes|-y)
      ASSUME_YES="yes"
      ;;
    *)
      DUMP_FILE="$arg"
      ;;
  esac
done

echo ""
echo -e "${BOLD}BlackFire Portal - Database Restore${RESET}"
echo -e "${AMBER}BLKFR - $(date '+%Y-%m-%d %H:%M:%S')${RESET}"
echo "------------------------------------------------------"

command -v mysql >/dev/null 2>&1 || fail "mysql not found. Contact Afrihost support."
command -v mysqldump >/dev/null 2>&1 || fail "mysqldump not found. Contact Afrihost support."
command -v gzip >/dev/null 2>&1 || fail "gzip not found. Contact Afrihost support."
command -v gunzip >/dev/null 2>&1 || fail "gunzip not found. Contact Afrihost support."

mkdir -p "${RESTORE_DIR}" "${SAFETY_BACKUP_DIR}" "${HOME}/tmp"

if [[ -z "$DUMP_FILE" ]]; then
  log "Looking for the newest portal database dump..."
  DUMP_FILE=$(
    find "${SCRIPT_DIR}" "${HOME}" "${RESTORE_DIR}" -maxdepth 1 -type f \
      \( \
        -name 'portal_local_db*.sql.gz' -o \
        -name 'portal_local_db*.sql' -o \
        -name 'blackfm6w9f9_portal_backup_*.sql.gz' -o \
        -name 'blackfm6w9f9_portal_backup_*.sql' \
      \) \
      -printf '%T@ %p\n' 2>/dev/null |
    sort -nr |
    head -n 1 |
    cut -d' ' -f2-
  )
fi

[[ -n "$DUMP_FILE" ]] || fail "No dump found. Upload portal_local_db_*.sql.gz or blackfm6w9f9_portal_backup_*.sql.gz to ~ or ~/tmp/restore, then rerun."
[[ -f "$DUMP_FILE" ]] || fail "Dump file not found: $DUMP_FILE"

case "$DUMP_FILE" in
  *.sql|*.sql.gz) ;;
  *) fail "Unsupported dump type. Use .sql or .sql.gz." ;;
esac

SECRET_B64=$(php -r "
  function secret_value(\$key) {
    if (getenv(\$key)) return getenv(\$key);
    if (isset(\$_ENV[\$key]) && \$_ENV[\$key] !== '') return \$_ENV[\$key];
    if (isset(\$_SERVER[\$key]) && \$_SERVER[\$key] !== '') return \$_SERVER[\$key];
    if (defined(\$key)) return constant(\$key);
    return '';
  }

  \$files = [getenv('HOME').'/blackfire_secrets.php', dirname(getenv('HOME')).'/blackfire_secrets.php'];
  foreach (\$files as \$s) {
    if (file_exists(\$s)) {
      require_once \$s;
      \$name = secret_value('BF_DB_NAME') ?: '${DEFAULT_DB_NAME}';
      \$user = secret_value('BF_DB_USER') ?: '${DEFAULT_DB_USER}';
      \$plain = secret_value('BF_DB_PASS');
      if (\$plain !== '') {
        echo base64_encode(\$name).PHP_EOL.base64_encode(\$user).PHP_EOL.base64_encode(\$plain);
        exit;
      }
      \$encrypted = secret_value('BF_DB_PASS_ENC');
      \$key = secret_value('BF_APP_KEY');
      if (\$encrypted !== '' && \$key !== '') {
        \$raw = base64_decode(\$encrypted);
        if (\$raw && strlen(\$raw) > 16) {
          \$iv = substr(\$raw, 0, 16);
          \$data = substr(\$raw, 16);
          \$pass = openssl_decrypt(\$data, 'AES-256-CBC', hex2bin(\$key), OPENSSL_RAW_DATA, \$iv);
          if (\$pass !== false) {
            echo base64_encode(\$name).PHP_EOL.base64_encode(\$user).PHP_EOL.base64_encode(\$pass);
            exit;
          }
        }
      }
    }
  }
" 2>/dev/null || true)

[[ -n "$SECRET_B64" ]] || fail "BF_DB_PASS not found in ~/blackfire_secrets.php. Restore stopped before touching the database."

DB_NAME_B64=$(printf '%s\n' "$SECRET_B64" | sed -n '1p')
DB_USER_B64=$(printf '%s\n' "$SECRET_B64" | sed -n '2p')
DB_PASS_B64=$(printf '%s\n' "$SECRET_B64" | sed -n '3p')
DB_NAME=$(php -r "echo base64_decode(\$argv[1]);" "$DB_NAME_B64")
DB_USER=$(php -r "echo base64_decode(\$argv[1]);" "$DB_USER_B64")
DB_PASS=$(php -r "echo base64_decode(\$argv[1]);" "$DB_PASS_B64")

[[ -n "$DB_NAME" ]] || fail "BF_DB_NAME is empty after reading secrets."
[[ -n "$DB_USER" ]] || fail "BF_DB_USER is empty after reading secrets."
[[ -n "$DB_PASS" ]] || fail "BF_DB_PASS is empty after reading secrets."

MYSQL_DEFAULTS=$(mktemp "${HOME}/tmp/restore_mysql_XXXXXX.cnf")
chmod 600 "${MYSQL_DEFAULTS}"
cat > "${MYSQL_DEFAULTS}" <<EOF
[client]
user=${DB_USER}
password=${DB_PASS}
EOF
trap 'rm -f "${MYSQL_DEFAULTS}"' EXIT

echo ""
echo "  Database : ${DB_NAME}"
echo "  User     : ${DB_USER}"
echo "  Dump     : ${DUMP_FILE}"
echo ""

if [[ "$ASSUME_YES" != "yes" ]]; then
  warn "This will import into ${DB_NAME} and may replace existing table data."
  read -r -p "Type RESTORE to continue: " CONFIRM
  [[ "$CONFIRM" == "RESTORE" ]] || fail "Restore cancelled."
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PRE_RESTORE_DUMP="${SAFETY_BACKUP_DIR}/portal_pre_restore_${TIMESTAMP}.sql.gz"

sanitize_dump() {
  sed -E 's#/\\*![0-9]+[[:space:]]+DEFINER=`[^`]+`@`[^`]+`[[:space:]]*\\*/##g; s#[[:space:]]+DEFINER=`[^`]+`@`[^`]+`##g'
}

log "Backing up current database..."
mysqldump \
  --defaults-extra-file="${MYSQL_DEFAULTS}" \
  --single-transaction \
  --triggers \
  --skip-routines \
  --skip-events \
  --add-drop-table \
  "${DB_NAME}" | gzip > "${PRE_RESTORE_DUMP}"
ok "Safety backup created: ${PRE_RESTORE_DUMP}"

log "Restoring database..."
case "$DUMP_FILE" in
  *.sql.gz)
    gunzip -c "$DUMP_FILE" | sanitize_dump | mysql --defaults-extra-file="${MYSQL_DEFAULTS}" "${DB_NAME}"
    ;;
  *.sql)
    sanitize_dump < "$DUMP_FILE" | mysql --defaults-extra-file="${MYSQL_DEFAULTS}" "${DB_NAME}"
    ;;
esac
ok "Import complete"

TABLE_COUNT=$(mysql --defaults-extra-file="${MYSQL_DEFAULTS}" --batch --skip-column-names \
  --execute="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" 2>/dev/null || true)

echo ""
echo "------------------------------------------------------"
echo -e "${GREEN}${BOLD}Restore complete.${RESET}"
echo ""
echo "  Database:      ${DB_NAME}"
echo "  Restored from: ${DUMP_FILE}"
echo "  Safety backup: ${PRE_RESTORE_DUMP}"
echo "  Table count:   ${TABLE_COUNT:-unknown}"
echo ""
echo -e "${AMBER}  Verify:${RESET} https://blackfiresolutions.co.za"
echo ""
