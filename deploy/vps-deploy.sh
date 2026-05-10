#!/usr/bin/env bash
# Run on the VPS from the repository root after cloning (see README.md).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or not in PATH."
  echo "On Ubuntu/Debian, install Docker Engine + Compose plugin, then log out and back in if you were added to the docker group:"
  echo "  https://docs.docker.com/engine/install/ubuntu/"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is missing. Install docker-compose-plugin for your distribution."
  exit 1
fi

ENV_FILE="${ANN_DEPLOY_ENV_FILE:-deploy.env}"

if [[ ! -f "${ENV_FILE}" ]]; then
  cp deploy.env.example "${ENV_FILE}"
  echo "Created ${ENV_FILE} from deploy.env.example."
  echo "Edit ${ENV_FILE}: set APP_DOMAIN, API_DOMAIN, JWT_SECRET, DATABASE_PASSWORD, CORS_ORIGINS, FRONTEND_URL, NEXT_PUBLIC_* URLs, then run this script again."
  exit 1
fi

echo "Building and starting stack (using ${ENV_FILE})..."
docker compose --env-file "${ENV_FILE}" up -d --build

echo "Done. Nginx should listen on port 80."
echo "Check: docker compose --env-file ${ENV_FILE} ps"
echo "Logs: docker compose --env-file ${ENV_FILE} logs -f --tail=100"
