#!/usr/bin/env bash
# reset-db.sh — Drop and recreate the database, then re-run all migrations.
# Use for a clean dev state. DESTRUCTIVE — never run against production.
# Usage: ./scripts/reset-db.sh

set -euo pipefail

if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-govtender}
DB_NAME=${DB_NAME:-govtender}
export PGPASSWORD="${DB_PASSWORD:-govtender_dev}"

echo "==> WARNING: This will DROP and recreate the '${DB_NAME}' database."
echo "    Press Ctrl+C within 5 seconds to abort."
sleep 5

echo "==> Dropping database '${DB_NAME}'..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS ${DB_NAME};" -q

echo "==> Recreating database '${DB_NAME}'..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
  -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" -q

echo "==> Running migrations..."
bash "$(dirname "$0")/db-init.sh"

echo "==> Database reset complete."
