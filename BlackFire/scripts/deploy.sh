#!/usr/bin/env bash
# BlackFire Solutions — Afrihost deploy script
# Clones/pulls the repo into a staging folder, then rsyncs only the portal
# files the PHP site and website actually use. Git never runs inside public_html.
#
# First run:  bash ~/scripts/deploy.sh          (clones the repo)
# Every run after: same command — it just pulls + syncs.
#
# Usage:
#   bash ~/scripts/deploy.sh
#   BRANCH=master bash ~/scripts/deploy.sh      (override branch)

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
REPO_URL="https://github.com/jubhele/BlackFire.git"
BRANCH="${BRANCH:-Emzumbe}"
STAGING_DIR="$HOME/blackfire-staging"          # repo lives here — NOT in public_html
WEB_ROOT="$HOME/public_html"                   # adjust if your web root differs
SPARSE_PATHS=(
    "BlackFire Portal"
    "BlackFire/BlackFire Portal"
)
PORTAL_SRC=""

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo "┌─ BlackFire Deploy ──────────────────────────────────────────────┐"
echo "│  Repo:    $REPO_URL"
echo "│  Branch:  $BRANCH"
echo "│  Staging: $STAGING_DIR"
echo "│  Web:     $WEB_ROOT"
echo "└─────────────────────────────────────────────────────────────────┘"
echo ""

# ── Clone or pull ─────────────────────────────────────────────────────────────
if [ -d "$STAGING_DIR/.git" ]; then
    echo "── Pulling latest ────────────────────────────────────────────────"
    git -C "$STAGING_DIR" fetch origin
    git -C "$STAGING_DIR" checkout "$BRANCH"
    git -C "$STAGING_DIR" pull origin "$BRANCH"
else
    echo "── Cloning repo (first run) ──────────────────────────────────────"
    git clone --depth=1 --single-branch --no-tags --filter=blob:none --sparse --branch "$BRANCH" "$REPO_URL" "$STAGING_DIR"
fi

git -C "$STAGING_DIR" sparse-checkout init --cone >/dev/null 2>&1 || true
git -C "$STAGING_DIR" sparse-checkout set "${SPARSE_PATHS[@]}"

for candidate in \
    "$STAGING_DIR/BlackFire Portal" \
    "$STAGING_DIR/BlackFire/BlackFire Portal"; do
    if [ -d "$candidate" ]; then
        PORTAL_SRC="$candidate"
        break
    fi
done

[[ -n "$PORTAL_SRC" ]] || fail "Portal source not found in staging repo."

echo ""
echo "── Syncing PHP + config to web root ─────────────────────────────"
# rsync only the portal files the live site uses — skips install, docs,
# dev-only sources, backup folders, and repo metadata.
rsync -av --checksum \
    --include="*/" \
    --include="*.php" \
    --include="*.htaccess" \
    --include=".htaccess" \
    --include="*.html" \
    --include="*.css" \
    --include="*.js" \
    --include="*.json" \
    --include="*.png" \
    --include="*.jpg" \
    --include="*.jpeg" \
    --include="*.svg" \
    --include="*.ico" \
    --include="*.pdf" \
    --include="*.txt" \
    --include="*.xml" \
    --exclude="*" \
    "$PORTAL_SRC/" "$WEB_ROOT/"

echo ""
echo "── Fixing permissions ────────────────────────────────────────────"
find "$WEB_ROOT" -type f -name "*.php"      -exec chmod 644 {} \;
find "$WEB_ROOT" -type f -name ".htaccess"  -exec chmod 644 {} \;
find "$WEB_ROOT" -type d                    -exec chmod 755 {} \;

echo ""
echo "── Done ──────────────────────────────────────────────────────────"
git -C "$STAGING_DIR" log -1 --format="  Deployed: %h %s (%ar)"
echo ""
