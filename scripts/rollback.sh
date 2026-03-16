#!/bin/bash
# ──────────────────────────────────────────────────────────
# BookClubs — Rollback to a Previous Deployment
# Usage:  ./scripts/rollback.sh <commit_sha>
# Example: ./scripts/rollback.sh abc1234
#
# This script rolls back all services to images tagged with
# a specific commit SHA from GHCR (GitHub Container Registry).
# ──────────────────────────────────────────────────────────
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REGISTRY="${REGISTRY:-ghcr.io}"
REPO="${GITHUB_REPOSITORY:-}"

# ── Services to roll back ─────────────────────────────────
SERVICES=(
  "frontend"
  "api-gateway"
  "user-service"
  "collab-editor"
  "books-service"
  "notification-service"
)

# ── Validate args ─────────────────────────────────────────
if [[ $# -lt 1 ]]; then
  echo "BookClubs Rollback Script"
  echo ""
  echo "Usage: $0 <commit_sha>"
  echo ""
  echo "Options:"
  echo "  commit_sha   The Git commit SHA to roll back to (images must exist in GHCR)"
  echo ""
  echo "Examples:"
  echo "  $0 abc1234                                # Roll back to specific commit"
  echo "  REGISTRY=ghcr.io GITHUB_REPOSITORY=user/repo $0 abc1234"
  echo ""
  echo "To see recent deployments:"
  echo "  git log --oneline -10 main"
  exit 1
fi

COMMIT_SHA="$1"

if [[ -z "${REPO}" ]]; then
  # Try to detect from git remote
  REPO=$(git -C "${PROJECT_DIR}" remote get-url origin 2>/dev/null | sed 's|.*github.com[:/]||;s|\.git$||' || true)
  if [[ -z "${REPO}" ]]; then
    echo "ERROR: Cannot determine GitHub repository."
    echo "Set GITHUB_REPOSITORY=owner/repo and try again."
    exit 1
  fi
fi

echo "╔══════════════════════════════════════════╗"
echo "║        BookClubs Rollback                ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Commit:  ${COMMIT_SHA}"
echo "║  Registry: ${REGISTRY}/${REPO}"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Verify images exist ───────────────────────────────────
echo "Verifying images exist for commit ${COMMIT_SHA}..."
MISSING=0
for SERVICE in "${SERVICES[@]}"; do
  IMAGE="${REGISTRY}/${REPO}/${SERVICE}:${COMMIT_SHA}"
  if docker manifest inspect "${IMAGE}" > /dev/null 2>&1; then
    echo "  ✓ ${SERVICE}"
  else
    echo "  ✗ ${SERVICE} — image not found: ${IMAGE}"
    MISSING=$((MISSING + 1))
  fi
done

if [[ ${MISSING} -gt 0 ]]; then
  echo ""
  echo "ERROR: ${MISSING} image(s) not found. Cannot roll back."
  echo "Ensure all images were built and pushed for commit ${COMMIT_SHA}."
  exit 1
fi

echo ""
echo "⚠  This will replace all running services with version ${COMMIT_SHA}"
read -p "Continue? (yes/no): " CONFIRM
if [[ "${CONFIRM}" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

# ── Record current state for undo ─────────────────────────
echo ""
CURRENT_SHA=$(git -C "${PROJECT_DIR}" rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "Current deployment: ${CURRENT_SHA}"
echo "  (To undo this rollback, run: $0 ${CURRENT_SHA})"
echo ""

# ── Pull and deploy ───────────────────────────────────────
cd "${PROJECT_DIR}"

for SERVICE in "${SERVICES[@]}"; do
  IMAGE="${REGISTRY}/${REPO}/${SERVICE}:${COMMIT_SHA}"
  echo "Pulling ${SERVICE}..."
  docker pull "${IMAGE}"
done

echo ""
echo "Deploying rolled-back services..."

# Create override compose with pinned image tags
OVERRIDE_FILE="${PROJECT_DIR}/docker-compose.rollback.yml"
cat > "${OVERRIDE_FILE}" << EOF
# Auto-generated rollback override — commit ${COMMIT_SHA}
# Generated at $(date -u +"%Y-%m-%dT%H:%M:%SZ")
services:
EOF

for SERVICE in "${SERVICES[@]}"; do
  IMAGE="${REGISTRY}/${REPO}/${SERVICE}:${COMMIT_SHA}"
  # Map container names back to compose service names
  COMPOSE_SERVICE="${SERVICE}"
  [[ "${SERVICE}" == "api-gateway" ]] && COMPOSE_SERVICE="gateway"
  
  cat >> "${OVERRIDE_FILE}" << EOF
  ${COMPOSE_SERVICE}:
    image: ${IMAGE}
EOF
done

docker compose -f "${COMPOSE_FILE}" -f "${OVERRIDE_FILE}" up -d --no-build

echo ""
echo "Waiting for services to become healthy..."
sleep 10

# ── Health check ──────────────────────────────────────────
HEALTHY=true
for SERVICE in "${SERVICES[@]}"; do
  STATUS=$(docker inspect --format='{{.State.Status}}' "${SERVICE}" 2>/dev/null || echo "not found")
  if [[ "${STATUS}" == "running" ]]; then
    echo "  ✓ ${SERVICE}: running"
  else
    echo "  ✗ ${SERVICE}: ${STATUS}"
    HEALTHY=false
  fi
done

echo ""
if [[ "${HEALTHY}" == true ]]; then
  echo "✓ Rollback to ${COMMIT_SHA} completed successfully!"
else
  echo "⚠ Rollback deployed but some services may not be healthy."
  echo "  Check logs: docker compose -f ${COMPOSE_FILE} logs -f"
fi

echo ""
echo "Rollback override saved: ${OVERRIDE_FILE}"
echo "To return to latest, remove the override and redeploy:"
echo "  rm ${OVERRIDE_FILE} && docker compose -f ${COMPOSE_FILE} up -d --build"
