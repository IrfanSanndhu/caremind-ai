#!/bin/sh
# Runs on stack startup (db-migrate service). Requires CENTRAL_DB_* in the environment.
set -eu

cd /app

: "${CENTRAL_DB_HOST:?CENTRAL_DB_HOST is required}"
: "${CENTRAL_DB_USER:?CENTRAL_DB_USER is required}"
: "${CENTRAL_DB_PASSWORD:?CENTRAL_DB_PASSWORD is required}"
: "${CENTRAL_DB_NAME:?CENTRAL_DB_NAME is required}"
CENTRAL_DB_PORT="${CENTRAL_DB_PORT:-5432}"

ENCODED_PASSWORD=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$CENTRAL_DB_PASSWORD")
export CENTRAL_DATABASE_URL="postgresql://${CENTRAL_DB_USER}:${ENCODED_PASSWORD}@${CENTRAL_DB_HOST}:${CENTRAL_DB_PORT}/${CENTRAL_DB_NAME}"

echo "[db-migrate] Generating Prisma clients..."
npx prisma generate --schema=prisma/central/schema.prisma
npx prisma generate --schema=prisma/tenant/schema.prisma

echo "[db-migrate] Applying central migrations..."
npx prisma migrate deploy --schema=prisma/central/schema.prisma

echo "[db-migrate] Done."
