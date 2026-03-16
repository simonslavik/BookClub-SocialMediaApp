#!/bin/bash
# ──────────────────────────────────────────────────────────
# BookClubs — Automated Database Backup Script
# Usage:  ./scripts/backup.sh
# Cron:   0 2 * * * /path/to/project/scripts/backup.sh >> /var/log/bookclubs-backup.log 2>&1
# ──────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration ──────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/backups/bookclubs}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
CURRENT_BACKUP_DIR="${BACKUP_DIR}/${TIMESTAMP}"

# Load env vars (for POSTGRES_USER)
if [[ -f "${PROJECT_DIR}/.env.production" ]]; then
  source "${PROJECT_DIR}/.env.production"
elif [[ -f "${PROJECT_DIR}/.env" ]]; then
  source "${PROJECT_DIR}/.env"
fi

POSTGRES_USER="${POSTGRES_USER:-postgres}"

# ── Databases to back up ──────────────────────────────────
declare -A DATABASES=(
  ["users_db"]="postgres-users"
  ["collab_db"]="postgres-collab"
  ["books_db"]="postgres-books"
  ["notifications_db"]="postgres-notifications"
)

# ── Functions ──────────────────────────────────────────────
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# ── Main ───────────────────────────────────────────────────
log "Starting database backup..."

mkdir -p "${CURRENT_BACKUP_DIR}"

cd "${PROJECT_DIR}"

FAILED=0

for DB_NAME in "${!DATABASES[@]}"; do
  CONTAINER="${DATABASES[$DB_NAME]}"
  DUMP_FILE="${CURRENT_BACKUP_DIR}/${DB_NAME}.dump"

  log "  Backing up ${DB_NAME} from ${CONTAINER}..."
  
  if docker compose -f "${COMPOSE_FILE}" exec -T "${CONTAINER}" \
    pg_dump -U "${POSTGRES_USER}" -d "${DB_NAME}" --format=custom \
    > "${DUMP_FILE}" 2>/dev/null; then
    
    SIZE=$(du -sh "${DUMP_FILE}" | cut -f1)
    log "  ✓ ${DB_NAME} backed up (${SIZE})"
  else
    error "  ✗ Failed to back up ${DB_NAME}"
    rm -f "${DUMP_FILE}"
    FAILED=$((FAILED + 1))
  fi
done

# ── Compress backup ───────────────────────────────────────
if [[ $(ls -A "${CURRENT_BACKUP_DIR}" 2>/dev/null) ]]; then
  log "Compressing backup..."
  tar -czf "${CURRENT_BACKUP_DIR}.tar.gz" -C "${BACKUP_DIR}" "${TIMESTAMP}"
  rm -rf "${CURRENT_BACKUP_DIR}"
  FINAL_SIZE=$(du -sh "${CURRENT_BACKUP_DIR}.tar.gz" | cut -f1)
  log "✓ Backup compressed: ${CURRENT_BACKUP_DIR}.tar.gz (${FINAL_SIZE})"
else
  error "No databases were backed up successfully"
  rmdir "${CURRENT_BACKUP_DIR}" 2>/dev/null || true
  exit 1
fi

# ── Retention — remove backups older than N days ──────────
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
DELETED=$(find "${BACKUP_DIR}" -name "*.tar.gz" -type f -mtime +${RETENTION_DAYS} -print -delete | wc -l)
log "  Removed ${DELETED} old backup(s)"

# ── Summary ────────────────────────────────────────────────
if [[ ${FAILED} -eq 0 ]]; then
  log "✓ Backup completed successfully: ${CURRENT_BACKUP_DIR}.tar.gz"
else
  error "Backup completed with ${FAILED} failure(s)"
  exit 1
fi
