#!/usr/bin/env bash
# BlackFire Solutions — Afrihost deploy script
# Run this on the Afrihost terminal to pull the latest code.
# Usage: bash ~/scripts/deploy.sh

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
PORTAL_DIR="${PORTAL_DIR:-$HOME/public_html}"
BRANCH="${BRANCH:-Emzumbe}"

# ── Deploy ───────────────────────────────────────────────────────────────────
echo ""
echo "┌─ BlackFire Deploy ─────────────────────────────────────────┐"
echo "│  Dir:    $PORTAL_DIR"
echo "│  Branch: $BRANCH"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

cd "$PORTAL_DIR"

echo "── Git status before pull ───────────────────────────────────"
git status --short

echo ""
echo "── Pulling $BRANCH ──────────────────────────────────────────"
git pull origin "$BRANCH"

echo ""
echo "── Fixing file permissions ──────────────────────────────────"
find . -type f -name "*.php" -exec chmod 644 {} \;
find . -type f -name ".htaccess" -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

echo ""
echo "── Done ─────────────────────────────────────────────────────"
git log -1 --format="  Deployed: %h %s (%ar)"
echo ""
