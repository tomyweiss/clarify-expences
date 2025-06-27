#!/bin/bash

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-clarify_expenses}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Database Migration Runner ===${NC}"

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME; do
  echo "Database is not ready yet. Waiting..."
  sleep 2
done

echo -e "${GREEN}✓ Database is ready!${NC}"

# Create migrations tracking table if it doesn't exist
echo -e "${YELLOW}Setting up migration tracking...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64)
);" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration tracking table ready${NC}"
else
    echo -e "${RED}✗ Failed to create migration tracking table${NC}"
    exit 1
fi

# Function to check if migration has been applied
migration_applied() {
    local filename=$1
    local result=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM migrations WHERE filename = '$filename';" 2>/dev/null | tr -d ' ')
    [ "$result" = "1" ]
}

# Function to mark migration as applied
mark_migration_applied() {
    local filename=$1
    local checksum=$2
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "INSERT INTO migrations (filename, checksum) VALUES ('$filename', '$checksum');" 2>/dev/null
}

# Function to calculate file checksum
get_file_checksum() {
    local file=$1
    sha256sum "$file" | cut -d' ' -f1
}

# Run migrations in order
MIGRATIONS_DIR="/docker-entrypoint-initdb.d/migrations"
if [ -d "$MIGRATIONS_DIR" ]; then
    echo -e "${YELLOW}Looking for migration files in $MIGRATIONS_DIR...${NC}"
    
    # Get all .sql files and sort them
    migration_files=($(ls $MIGRATIONS_DIR/*.sql 2>/dev/null | sort))
    
    if [ ${#migration_files[@]} -eq 0 ]; then
        echo -e "${YELLOW}No migration files found${NC}"
    else
        echo -e "${BLUE}Found ${#migration_files[@]} migration file(s)${NC}"
        
        for migration_file in "${migration_files[@]}"; do
            filename=$(basename "$migration_file")
            checksum=$(get_file_checksum "$migration_file")
            
            if migration_applied "$filename"; then
                echo -e "${YELLOW}⏭️  Migration $filename already applied, skipping...${NC}"
            else
                echo -e "${BLUE}🔄 Applying migration: $filename${NC}"
                
                if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration_file"; then
                    mark_migration_applied "$filename" "$checksum"
                    echo -e "${GREEN}✓ Migration $filename applied successfully${NC}"
                else
                    echo -e "${RED}✗ Failed to apply migration $filename${NC}"
                    exit 1
                fi
            fi
        done
    fi
else
    echo -e "${YELLOW}No migrations directory found at $MIGRATIONS_DIR${NC}"
fi

echo -e "${GREEN}🎉 All migrations completed successfully!${NC}" 