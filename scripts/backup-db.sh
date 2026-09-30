#!/usr/bin/env bash
# Dumps the MongoDB database running in the "mongodb" compose service to a local, timestamped
# gzipped archive. Run this from the project root: ./scripts/backup-db.sh
#
# The data only lives in a Docker volume (see docker/docker-compose.yml) — if that volume is ever
# removed (docker compose down -v, a volume prune, disk loss), everything in it is gone for good.
# This script is the only thing standing between that and losing real data, so run it before any
# risky operation and keep a copy of the backups directory somewhere off this machine.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "No .env file found. Run: node scripts/generate-env.js" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

CONTAINER="${MONGODB_CONTAINER:-docker-mongodb-1}"
DB_NAME="${MONGODB_DATABASE:-intellibiz}"
ROOT_USER="${MONGODB_ROOT_USER:-root}"

if [ -z "${MONGODB_ROOT_PASSWORD:-}" ]; then
  echo "MONGODB_ROOT_PASSWORD is not set in .env" >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Container '$CONTAINER' is not running. Start the stack first: docker compose --env-file .env -f docker/docker-compose.yml up -d" >&2
  exit 1
fi

mkdir -p backups
OUT="backups/${DB_NAME}-$(date +%Y%m%d-%H%M%S).archive.gz"

docker exec "$CONTAINER" mongodump \
  --username "$ROOT_USER" \
  --password "$MONGODB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --db "$DB_NAME" \
  --archive --gzip > "$OUT"

echo "Backed up '$DB_NAME' to $OUT ($(du -h "$OUT" | cut -f1))"
