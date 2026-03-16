#!/bin/bash
# ──────────────────────────────────────────────────────────
# BookClubs — Restore Database from Backup
# Usage:  ./scripts/restore.sh <backup_file.tar.gz> [database_name]
# Examples:
#   ./scripts/restore.sh /backups/bookclubs/2026-03-16_02-00-00.tar.gz
#   ./scripts/restore.sh /backups/bookclubs/2026-03-16_02-00-00.tar.gz users_db
# ──────────────────────────────────────────────────────────
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load env
if [[ -f "${PROJECT_DIR}/.env.production" ]]; then
  source "${PROJECT_DIR}/.env.production"
elif [[ -f "${PROJECT_DIR}/.env" ]]; then
  source "${PROJECT_DIR}/.env"
fi

POSTGRES_USER="${POSTGRES_USER:-postgres}"

declare -A DATABASES=(
  ["users_db"]="postgres-users"
  ["collab_db"]="postgres-collab"
  ["books_db"]="postgres-books"
  ["notifications_db"]="postgres-notifications"
)

# ── Validate args ─────────────────────────────────────────
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup_file.tar.gz> [database_name]"
  echo ""
  echo "Available databases: ${!DATABASES[*]}"
  exit 1
fi

BACKUP_FILE="$1"
SPECIFIC_DB="${2:-}"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "ERROR: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# ── Extract backup ────────────────────────────────────────
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

echo "Extracting backup..."
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

BACKUP_DIR=$(ls "${TEMP_DIR}")

# ── Restore ───────────────────────────────────────────────
cd "${PROJECT_DIR}"

restore_db() {
  local DB_NAME="$1"
  local CONTAINER="${DATABASES[$DB_NAME]}"
  local DUMP_FILE="${TEMP_DIR}/${BACKUP_DIR}/${DB_NAME}.dump"

  if [[ ! -f "${DUMP_FILE}" ]]; then
    echo "  ⚠ Dump file not found for ${DB_NAME}, skipping"
    return 1
  fi

  echo "  Restoring ${DB_NAME} to ${CONTAINER}..."
  
  cat "${DUMP_FILE}" | docker compose -f "${COMPOSE_FILE}" exec -T "${CONTAINER}" \
    pg_restore -U "${POSTGRES_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner 2>/dev/null

  echo "  ✓ ${DB_NAME} restored"
}

echo ""
echo "⚠  WARNING: This will OVERWRITE existing data!"
echo "   Backup: ${BACKUP_FILE}"
if [[ -n "${SPECIFIC_DB}" ]]; then
  echo "   Database: ${SPECIFIC_DB}"
else
  echo "   Databases: ALL (${!DATABASES[*]})"
fi
echo ""
read -p "Are you sure? (yes/no): " CONFIRM
if [[ "${CONFIRM}" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
if [[ -n "${SPECIFIC_DB}" ]]; then
  if [[ -z "${DATABASES[$SPECIFIC_DB]+_}" ]]; then
    echo "ERROR: Unknown database '${SPECIFIC_DB}'"
    echo "Available: ${!DATABASES[*]}"
    exit 1
  fi
  restore_db "${SPECIFIC_DB}"
else
  for DB_NAME in "${!DATABASES[@]}"; do
    restore_db "${DB_NAME}" || true
  done
fi

echo ""
echo "✓ Restore completed. Restart services to pick up changes:"
echo "  docker compose -f ${COMPOSE_FILE} restart user-service collab-editor books-service notification-service"
