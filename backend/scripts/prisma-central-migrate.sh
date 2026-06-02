#!/usr/bin/env bash
# Loads backend/.env and runs central Prisma migrations using CENTRAL_DB_* components.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${CENTRAL_DB_HOST:?CENTRAL_DB_HOST is required}"
: "${CENTRAL_DB_USER:?CENTRAL_DB_USER is required}"
: "${CENTRAL_DB_PASSWORD:?CENTRAL_DB_PASSWORD is required}"
: "${CENTRAL_DB_NAME:?CENTRAL_DB_NAME is required}"
CENTRAL_DB_PORT="${CENTRAL_DB_PORT:-5432}"

ENCODED_PASSWORD=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$CENTRAL_DB_PASSWORD")
export CENTRAL_DATABASE_URL="postgresql://${CENTRAL_DB_USER}:${ENCODED_PASSWORD}@${CENTRAL_DB_HOST}:${CENTRAL_DB_PORT}/${CENTRAL_DB_NAME}"

npx prisma migrate deploy --schema=prisma/central/schema.prisma
