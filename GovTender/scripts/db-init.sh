#!/usr/bin/env bash
# db-init.sh — Run all migrations in order against a running PostgreSQL container.
# Usage: ./scripts/db-init.sh
# Requires: PGPASSWORD, DB_HOST, DB_PORT, DB_USER, DB_NAME (read from .env if present)

set -euo pipefail

# Load .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-govtender}
DB_NAME=${DB_NAME:-govtender}
export PGPASSWORD="${DB_PASSWORD:-govtender_dev}"

MIGRATIONS_DIR="./shared/db/migrations"

echo "==> Running GovTender migrations against ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

for sql_file in $(ls "${MIGRATIONS_DIR}"/*.sql | sort); do
  echo "    Applying: $(basename "$sql_file")"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file" -q
done

echo "==> All migrations applied."
