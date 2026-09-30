#!/usr/bin/env bash
# Restores a MongoDB backup created by scripts/backup-db.sh into the running "mongodb" compose
# service. This OVERWRITES existing collections in the target database with the backup's contents.
# Usage: ./scripts/restore-db.sh backups/intellibiz-20260101-120000.archive.gz
set -euo pipefail
cd "$(dirname "$0")/.."

ARCHIVE="${1:-}"
if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; then
  echo "Usage: $0 <path-to-backup.archive.gz>" >&2
  echo "Available backups:" >&2
  ls -1 backups/*.archive.gz 2>/dev/null >&2 || echo "  (none found in ./backups)" >&2
  exit 1
fi

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

read -r -p "This will overwrite the '$DB_NAME' database with $ARCHIVE. Continue? [y/N] " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "Cancelled."
  exit 0
fi

docker exec -i "$CONTAINER" mongorestore \
  --username "$ROOT_USER" \
  --password "$MONGODB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --drop \
  --archive --gzip < "$ARCHIVE"

echo "Restored '$DB_NAME' from $ARCHIVE"
