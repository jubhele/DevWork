#!/bin/bash
# ================================================================
# BlackFire Portal — Afrihost Deploy Script
# BLKFR · IZILO-DEPLOY-001 · 2026-05-24
#
# Usage:
#   bash deploy.sh
#
# What it does:
#   1. Clones the GitHub repo (master branch) to a temp dir
#   2. Rsyncs the portal source directory → public_html/
#   3. Sets correct file permissions
#   4. Cleans up the temp clone
#
# Run from: /home/blackfm6w9f9/ via SSH
#   ssh blackfm6w9f9@blackfiresolutions.co.za
#   bash deploy.sh
# ================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────
# Read PAT from blackfire_secrets.php
GITHUB_PAT=$(php -r "
  \$s = dirname(getenv('HOME')).'/blackfire_secrets.php';
  if (!file_exists(\$s)) \$s = getenv('HOME').'/blackfire_secrets.php';
  if (file_exists(\$s)) { require_once \$s; echo defined('BF_GITHUB_PAT') ? BF_GITHUB_PAT : ''; }
" 2>/dev/null)
if [[ -z "$GITHUB_PAT" && -f "${HOME}/.bf_pat" ]]; then
  GITHUB_PAT=$(tr -d '[:space:]' < "${HOME}/.bf_pat")
fi
REPO_URL="https://github.com/jubhele/BlackFire.git"
BRANCH="master"
REPO_SUBDIR="BlackFire Portal"             # path inside repo to deploy
DEPLOY_TARGET="${HOME}/public_html"         # Afrihost web root
TEMP_BASE_DIR="${HOME}/.blackfire_tmp"
mkdir -p "$TEMP_BASE_DIR"
TEMP_DIR="$(mktemp -d "${TEMP_BASE_DIR}/blackfire_deploy.XXXXXX")"
CLONE_LOG="${TEMP_DIR}/clone.log"
RELEASE_DIR="${TEMP_DIR}/release"
GIT_ASKPASS_SCRIPT="${TEMP_DIR}/git-askpass.sh"
BACKUP_RETENTION="${BACKUP_RETENTION:-3}"

# ── Colours ───────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; AMBER='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}▸${RESET} $*"; }
ok()   { echo -e "${GREEN}✓${RESET} $*"; }
warn() { echo -e "${AMBER}⚠${RESET} $*"; }
fail() { echo -e "${RED}✗${RESET} $*"; exit 1; }

cleanup() { rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

pruneDeployArtifacts() {
  mkdir -p "$TEMP_BASE_DIR" "${HOME}/deploy_backups"
  find "$TEMP_BASE_DIR" -mindepth 1 -maxdepth 1 -type d -name 'blackfire_deploy.*' -mtime +1 -exec rm -rf {} + 2>/dev/null || true

  local cutoff=$((BACKUP_RETENTION + 1))
  local old_backups
  old_backups=$(ls -1dt "${HOME}"/deploy_backups/backup_* 2>/dev/null | tail -n +"${cutoff}" || true)
  if [[ -n "$old_backups" ]]; then
    while IFS= read -r dir; do
      [[ -n "$dir" ]] && rm -rf "$dir"
    done <<< "$old_backups"
  fi
}

freeSpaceKb() {
  df -Pk "$HOME" 2>/dev/null | awk 'NR==2{print $4}'
}

# ── Pre-flight checks ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}BlackFire Portal — Deploy Script${RESET}"
echo -e "${AMBER}BLKFR · $(date '+%Y-%m-%d %H:%M:%S')${RESET}"
echo "────────────────────────────────────────"

[[ -z "$GITHUB_PAT" ]] && \
  fail "PAT not found. Add BF_GITHUB_PAT to ~/blackfire_secrets.php or run: echo 'YOUR_PAT' > ~/.bf_pat"

command -v git  >/dev/null 2>&1 || fail "git not found. Contact Afrihost support."
command -v rsync >/dev/null 2>&1 || fail "rsync is required for a safe production-only deploy."

[[ -d "$DEPLOY_TARGET" ]] || fail "Deploy target not found: $DEPLOY_TARGET"

pruneDeployArtifacts
FREE_KB="$(freeSpaceKb)"
if [[ "$FREE_KB" =~ ^[0-9]+$ ]] && (( FREE_KB < 150000 )); then
  fail "Low disk space (${FREE_KB} KB free). Free space in home/deploy_backups then re-run deploy."
fi

# ── Safety check: secrets file must exist ────────────────────────
SECRETS="${HOME}/blackfire_secrets.php"
if [[ ! -f "$SECRETS" ]]; then
  warn "blackfire_secrets.php not found at ${HOME}/"
  warn "The portal will return HTTP 500 without it."
  read -rp "Continue anyway? (y/N) " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || fail "Aborted."
fi

# ── Clone ─────────────────────────────────────────────────────────
log "Cloning branch '${BRANCH}' to temp dir..."
mkdir -p "$TEMP_DIR"
printf '%s\n' \
  '#!/bin/sh' \
  'case "$1" in' \
  '  *Username*) printf "%s\n" "x-access-token" ;;' \
  '  *) printf "%s\n" "$BF_GITHUB_PAT" ;;' \
  'esac' > "$GIT_ASKPASS_SCRIPT"
chmod 700 "$GIT_ASKPASS_SCRIPT"
gitauth() {
  BF_GITHUB_PAT="$GITHUB_PAT" GIT_ASKPASS="$GIT_ASKPASS_SCRIPT" GIT_TERMINAL_PROMPT=0 git "$@"
}

if ! (
  mkdir -p "$TEMP_DIR/repo" &&
  gitauth -C "$TEMP_DIR/repo" init -q &&
  gitauth -C "$TEMP_DIR/repo" remote add origin "$REPO_URL" &&
  gitauth -C "$TEMP_DIR/repo" config core.sparseCheckout true &&
  mkdir -p "$TEMP_DIR/repo/.git/info" &&
  printf '%s\n' 'BlackFire Portal/' 'BlackFire/BlackFire Portal/' > "$TEMP_DIR/repo/.git/info/sparse-checkout" &&
  gitauth -C "$TEMP_DIR/repo" -c protocol.version=2 fetch --depth=1 --filter=blob:none origin "$BRANCH" &&
  gitauth -C "$TEMP_DIR/repo" checkout -q FETCH_HEAD
) >"$CLONE_LOG" 2>&1; then
  warn "Sparse fetch failed; retrying with shallow clone..."
  rm -rf "$TEMP_DIR/repo"
  if ! gitauth clone --depth=1 --single-branch --no-tags --branch "$BRANCH" "$REPO_URL" "$TEMP_DIR/repo" >>"$CLONE_LOG" 2>&1; then
    grep -v "Cloning\|remote:" "$CLONE_LOG" || true
    rm -rf "$TEMP_DIR"
    fail "Clone failed for branch '${BRANCH}'."
  fi
fi
ok "Clone complete"

SOURCE=""
for CANDIDATE in \
  "${TEMP_DIR}/repo/BlackFire Portal" \
  "${TEMP_DIR}/repo/BlackFire/BlackFire Portal" \
  "${TEMP_DIR}/repo/BlackFire-Portal"; do
  if [[ -d "$CANDIDATE" ]]; then
    SOURCE="$CANDIDATE"
    break
  fi
done

[[ -n "$SOURCE" ]] || fail "Source dir not found in repo: BlackFire Portal / BlackFire/BlackFire Portal"
log "Using source dir: ${SOURCE#${TEMP_DIR}/repo/}"

# The production allowlist is intentionally stricter than .gitignore because
# ignored files can still exist in old commits or remain tracked in the repo.
log "Building production-only release..."
mkdir -p "$RELEASE_DIR"

rsync -a --prune-empty-dirs \
  --include='/.htaccess' \
  --include='/index.php' \
  --include='/portal.php' \
  --include='/portal.js' \
  --include='/portal.css' \
  --include='/approve.php' \
  --include='/external_upload.php' \
  --include='/policy_ack.php' \
  --include='/reports.php' \
  --include='/sign.php' \
  --include='/robots.txt' \
  --include='/sitemap.xml' \
  --include='/favicon.ico' \
  --include='/favicon-16x16.png' \
  --include='/favicon-32x32.png' \
  --include='/favicon-512x512.png' \
  --include='/apple-touch-icon.png' \
  --include='/blackfire_icon_transparent.png' \
  --include='/blackfire_logo_transparent.png' \
  --include='/assets/' \
  --include='/assets/brand/' \
  --include='/assets/brand/astute-insights-wordmark.svg' \
  --include='/assets/brand/blackfire-logo.png' \
  --include='/api/' \
  --include='/api/.htaccess' \
  --exclude='/api/approve.php' \
  --include='/api/*.php' \
  --include='/config/' \
  --include='/config/.htaccess' \
  --include='/config/config.php' \
  --include='/includes/' \
  --include='/includes/.htaccess' \
  --include='/includes/*.php' \
  --include='/images/' \
  --include='/images/services/' \
  --include='/images/services/*.jpg' \
  --include='/images/services/*.png' \
  --include='/images/services/*.svg' \
  --include='/images/services/*.webp' \
  --exclude='*' \
  "${SOURCE}/" \
  "${RELEASE_DIR}/"

REQUIRED_FILES=(
  ".htaccess"
  "index.php"
  "portal.php"
  "portal.js"
  "portal.css"
  "assets/brand/astute-insights-wordmark.svg"
  "assets/brand/blackfire-logo.png"
  "api/.htaccess"
  "api/index.php"
  "config/.htaccess"
  "config/config.php"
  "includes/.htaccess"
  "includes/db.php"
  "includes/auth.php"
)
for required in "${REQUIRED_FILES[@]}"; do
  [[ -f "${RELEASE_DIR}/${required}" ]] || fail "Required production file missing: ${required}"
done

FORBIDDEN_FILE=$(find "$RELEASE_DIR" -type f \( \
  -iname '.env' -o -iname '.env.*' -o -iname '*.env' -o \
  -iname '*secret*' -o -iname '*backup*' -o -iname 'error_log' -o \
  -iname '*.sql' -o -iname '*.log' -o -iname '*.md' -o \
  -iname '*.pdf' -o -iname '*.sh' -o -iname '*.ps1' -o -iname '*.py' \
  \) -print -quit)
[[ -z "$FORBIDDEN_FILE" ]] || fail "Forbidden file entered release: ${FORBIDDEN_FILE#${RELEASE_DIR}/}"

ok "Production release validated"

# ── Backup current public_html (safety net) ───────────────────────
BACKUP_TS=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="${HOME}/deploy_backups/backup_${BACKUP_TS}"
log "Backing up current public_html → deploy_backups/backup_${BACKUP_TS}..."
mkdir -p "$BACKUP_DIR"
cp -r "${DEPLOY_TARGET}/." "$BACKUP_DIR/" 2>/dev/null || true
ok "Backup complete"

# ── Sync files ────────────────────────────────────────────────────
log "Syncing files to ${DEPLOY_TARGET}..."

rsync -av --checksum --delete-delay --delete-excluded \
  --filter='protect /uploads/***' \
  --filter='protect /.well-known/***' \
  --filter='protect /cgi-bin/***' \
  "${RELEASE_DIR}/" \
  "${DEPLOY_TARGET}/"

UNEXPECTED_FILE=$(find "$DEPLOY_TARGET" \
  -path "${DEPLOY_TARGET}/uploads" -prune -o \
  -path "${DEPLOY_TARGET}/.well-known" -prune -o \
  -path "${DEPLOY_TARGET}/cgi-bin" -prune -o \
  -type f \( \
    -iname '.env' -o -iname '.env.*' -o -iname '*.env' -o \
    -iname '*secret*' -o -iname '*backup*' -o -iname 'error_log' -o \
    -iname '*.sql' -o -iname '*.log' -o -iname '*.md' -o \
    -iname '*.pdf' -o -iname '*.sh' -o -iname '*.ps1' -o -iname '*.py' \
  \) -print -quit)
[[ -z "$UNEXPECTED_FILE" ]] || fail "Non-production file remains in public_html: ${UNEXPECTED_FILE#${DEPLOY_TARGET}/}"

mkdir -p "${DEPLOY_TARGET}/uploads/attachments"
if [[ -f "${SOURCE}/uploads/attachments/.htaccess" ]]; then
  cp "${SOURCE}/uploads/attachments/.htaccess" "${DEPLOY_TARGET}/uploads/attachments/.htaccess"
fi

QA_UPLOAD_COUNT=$(find "${DEPLOY_TARGET}/uploads" -type f -iname 'qa_*' -print | wc -l)
if (( QA_UPLOAD_COUNT > 0 )); then
  find "${DEPLOY_TARGET}/uploads" -type f -iname 'qa_*' -delete
  warn "Removed ${QA_UPLOAD_COUNT} QA upload artifact(s)"
fi
QA_UPLOAD_REMAINS=$(find "${DEPLOY_TARGET}/uploads" -type f -iname 'qa_*' -print -quit)
[[ -z "$QA_UPLOAD_REMAINS" ]] || fail "QA upload artifact remains: ${QA_UPLOAD_REMAINS#${DEPLOY_TARGET}/}"

ok "Sync complete"

# ── Permissions ───────────────────────────────────────────────────
log "Setting permissions..."

find "${DEPLOY_TARGET}" -type d -exec chmod 755 {} \;
find "${DEPLOY_TARGET}" -type f -exec chmod 644 {} \;

# PHP files — no execute bit needed on shared hosting
find "${DEPLOY_TARGET}" -name "*.php" -exec chmod 644 {} \;

# uploads dir — needs write permission for file uploads
if [[ -d "${DEPLOY_TARGET}/uploads" ]]; then
  find "${DEPLOY_TARGET}/uploads" -type d -exec chmod 755 {} \;
  find "${DEPLOY_TARGET}/uploads" -type f -exec chmod 640 {} \;
  [[ ! -f "${DEPLOY_TARGET}/uploads/attachments/.htaccess" ]] || chmod 644 "${DEPLOY_TARGET}/uploads/attachments/.htaccess"
  ok "uploads/ directories set to 755 and files to 640"
else
  warn "uploads/ directory not found — create it if file upload is needed"
  mkdir -p "${DEPLOY_TARGET}/uploads/attachments"
  ok "Created uploads/attachments/ (755)"
fi

ok "Permissions set"

# ── Clean up ──────────────────────────────────────────────────────
log "Cleaning up temp files..."
cleanup
trap - EXIT
ok "Temp dir removed"

# ── Summary ───────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────"
echo -e "${GREEN}${BOLD}Deploy complete.${RESET}"
echo ""
echo "  Branch:   ${BRANCH}"
echo "  Target:   ${DEPLOY_TARGET}"
echo "  Backup:   ~/deploy_backups/backup_${BACKUP_TS}/"
echo ""

# Quick file count
PHP_COUNT=$(find "${DEPLOY_TARGET}" -name "*.php" | wc -l)
JS_COUNT=$(find "${DEPLOY_TARGET}" -name "*.js" | wc -l)
CSS_COUNT=$(find "${DEPLOY_TARGET}" -name "*.css" | wc -l)
echo "  Deployed: ${PHP_COUNT} PHP · ${JS_COUNT} JS · ${CSS_COUNT} CSS"
echo ""

# Remind about secrets
if [[ ! -f "$SECRETS" ]]; then
  echo -e "${RED}⚠  blackfire_secrets.php is missing — portal will 500 until it's created.${RESET}"
fi

echo -e "${AMBER}  Verify:${RESET} https://blackfiresolutions.co.za"
echo ""
