#!/bin/bash
set -euo pipefail

# Navigate to the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  docker_compose() { docker compose "$@"; }
else
  docker_compose() { docker-compose "$@"; }
fi

cleanup() {
    echo -e "\nStopping local development environment..."
    cd "$ROOT_DIR"
    docker_compose stop clarify-db 2>/dev/null || true
    echo "Goodbye!"
}

# Run cleanup on script exit
trap cleanup EXIT SIGINT SIGTERM

if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "Error: $ROOT_DIR/.env not found. Copy .env_example to .env and set database credentials."
    exit 1
fi

# Load variables for this shell (Next.js dev inherits them). Prefer sourcing over
# export $(grep|xargs), which breaks on spaces and many special characters in values.
set -a
# shellcheck source=/dev/null
source "$ROOT_DIR/.env"
set +a

echo "Starting database container (clarify-db)..."
cd "$ROOT_DIR"
docker_compose up -d clarify-db

echo "Waiting for PostgreSQL to accept connections..."
READY=0
for _ in {1..60}; do
    if docker_compose exec -T clarify-db pg_isready -U "${CLARIFY_DB_USER}" -d "${CLARIFY_DB_NAME}" >/dev/null 2>&1; then
        READY=1
        break
    fi
    sleep 1
done
if [ "$READY" != 1 ]; then
    echo "Timed out waiting for the database. Recent logs:"
    docker_compose logs --tail 50 clarify-db
    exit 1
fi

echo "Starting Next.js development server..."
cd "$ROOT_DIR/app"

# Override DB host for local Next.js; from the host, Postgres is on localhost, not the Docker service name.
export CLARIFY_DB_HOST=localhost

npm run dev
