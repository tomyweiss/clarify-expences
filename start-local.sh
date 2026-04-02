#!/bin/bash

# Navigate to the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
    echo -e "\nStopping local development environment..."
    cd "$ROOT_DIR"
    docker-compose stop clarify-db
    echo "Goodbye!"
}

# Run cleanup on script exit
trap cleanup EXIT SIGINT SIGTERM

# Load environment variables from the root .env file
if [ -f "$ROOT_DIR/.env" ]; then
    echo "Loading environment variables from $ROOT_DIR/.env"
    export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

echo "Starting database container (clarify-db)..."
cd "$ROOT_DIR"
# Start only the database service, since we will run the app locally
docker-compose up -d clarify-db

echo "Starting Next.js development server..."
cd "$ROOT_DIR/app"

# Override DB host for local Next.js instance, since DB is exposed to host on localhost
export CLARIFY_DB_HOST=localhost

npm run dev
