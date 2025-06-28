#!/bin/bash

# This script runs after init.sql and handles all migrations
# Docker will execute this automatically when the container starts

echo "Starting migration runner..."
/docker-entrypoint-initdb.d/run-migrations.sh 