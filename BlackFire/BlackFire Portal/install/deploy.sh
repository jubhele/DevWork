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
REPO_URL="https://${GITHUB_PAT}@github.com/jubhele/BlackFire.git"
BRANCH="master"
REPO_SUBDIR="BlackFire Portal"             # path inside repo to deploy
DEPLOY_TARGET="${HOME}/public_html"         # Afrihost web root
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/blackfire_deploy.XXXXXX")"
CLONE_LOG="${TEMP_DIR}/clone.log"

# ── Colours ───────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; AMBER='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}▸${RESET} $*"; }
ok()   { echo -e "${GREEN}✓${RESET} $*"; }
warn() { echo -e "${AMBER}⚠${RESET} $*"; }
fail() { echo -e "${RED}✗${RESET} $*"; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}BlackFire Portal — Deploy Script${RESET}"
echo -e "${AMBER}BLKFR · $(date '+%Y-%m-%d %H:%M:%S')${RESET}"
echo "────────────────────────────────────────"

[[ -z "$GITHUB_PAT" ]] && \
  fail "PAT not found. Add BF_GITHUB_PAT to ~/blackfire_secrets.php or run: echo 'YOUR_PAT' > ~/.bf_pat"

command -v git  >/dev/null 2>&1 || fail "git not found. Contact Afrihost support."
command -v rsync >/dev/null 2>&1 || { warn "rsync not found — using cp instead"; USE_CP=1; }

[[ -d "$DEPLOY_TARGET" ]] || fail "Deploy target not found: $DEPLOY_TARGET"

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
if ! git clone --depth=1 --single-branch --no-tags --branch "$BRANCH" "$REPO_URL" "$TEMP_DIR/repo" >"$CLONE_LOG" 2>&1; then
  grep -v "Cloning\|remote:" "$CLONE_LOG" || true
  rm -rf "$TEMP_DIR"
  fail "Clone failed for branch '${BRANCH}'."
fi
ok "Clone complete"

SOURCE=""
for CANDIDATE in \
  "${TEMP_DIR}/repo/BlackFire Portal" \
  "${TEMP_DIR}/repo/BlackFire/BlackFire Portal" \
  "${TEMP_DIR}/repo/BlackFire-Portal" \
  "${TEMP_DIR}/repo"; do
  if [[ -d "$CANDIDATE" ]]; then
    SOURCE="$CANDIDATE"
    break
  fi
done

[[ -n "$SOURCE" ]] || fail "Source dir not found in repo: BlackFire Portal / BlackFire/BlackFire Portal"
log "Using source dir: ${SOURCE#${TEMP_DIR}/repo/}"

# ── Backup current public_html (safety net) ───────────────────────
BACKUP_TS=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="${HOME}/deploy_backups/backup_${BACKUP_TS}"
log "Backing up current public_html → deploy_backups/backup_${BACKUP_TS}..."
mkdir -p "$BACKUP_DIR"
cp -r "${DEPLOY_TARGET}/." "$BACKUP_DIR/" 2>/dev/null || true
ok "Backup complete"

# ── Sync files ────────────────────────────────────────────────────
log "Syncing files to ${DEPLOY_TARGET}..."

# Files/dirs to EXCLUDE from deployment
EXCLUDES=(
  "_backups/"          # development backups
  "_archive/"          # archived monolith files
  "dev-only/"          # dev tools
  "bhekani_bo.php"     # DB viewer — deploy manually if needed
  "encrypt_secrets.php" # one-time setup tool — never on live server
  "DEPLOY_CHECKLIST.md" # docs only
  "backup_portal.sh"   # this script's cousin
  ".git/"
  "*.sh"
)

if [[ -z "${USE_CP:-}" ]]; then
  # Build rsync exclude args
  EXCLUDE_ARGS=()
  for ex in "${EXCLUDES[@]}"; do
    EXCLUDE_ARGS+=("--exclude=${ex}")
  done

  rsync -av --checksum \
    "${EXCLUDE_ARGS[@]}" \
    "${SOURCE}/" \
    "${DEPLOY_TARGET}/" \
    2>&1 | grep -E "^(sending|>f|created|deleting)" | head -60

else
  # Fallback: cp
  warn "Using cp (no rsync). All files will be overwritten."
  cp -r "${SOURCE}/." "${DEPLOY_TARGET}/"

  # Remove excluded files if they were copied
  for ex in bhekani_bo.php encrypt_secrets.php DEPLOY_CHECKLIST.md backup_portal.sh; do
    [[ -f "${DEPLOY_TARGET}/${ex}" ]] && rm -f "${DEPLOY_TARGET}/${ex}" && \
      warn "Removed ${ex} from deploy target"
  done
  for ex in _backups _archive dev-only; do
    [[ -d "${DEPLOY_TARGET}/${ex}" ]] && rm -rf "${DEPLOY_TARGET}/${ex}" && \
      warn "Removed ${ex}/ from deploy target"
  done
fi

ok "Sync complete"

# ── Permissions ───────────────────────────────────────────────────
log "Setting permissions..."

find "${DEPLOY_TARGET}" -type d -exec chmod 755 {} \;
find "${DEPLOY_TARGET}" -type f -exec chmod 644 {} \;

# PHP files — no execute bit needed on shared hosting
find "${DEPLOY_TARGET}" -name "*.php" -exec chmod 644 {} \;

# uploads dir — needs write permission for file uploads
if [[ -d "${DEPLOY_TARGET}/uploads" ]]; then
  chmod -R 755 "${DEPLOY_TARGET}/uploads"
  ok "uploads/ set to 755"
else
  warn "uploads/ directory not found — create it if file upload is needed"
  mkdir -p "${DEPLOY_TARGET}/uploads/attachments"
  chmod -R 755 "${DEPLOY_TARGET}/uploads"
  ok "Created uploads/attachments/ (755)"
fi

ok "Permissions set"

# ── Clean up ──────────────────────────────────────────────────────
log "Cleaning up temp files..."
rm -rf "$TEMP_DIR"
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
  echo "   See: ~/public_html/DEPLOY_CHECKLIST.md"
fi

echo -e "${AMBER}  Verify:${RESET} https://blackfiresolutions.co.za"
echo ""
