#!/bin/bash
# scripts/dev/start_local.sh
# Starts all services locally with docker-compose

set -e

echo "Starting EduForge local development environment..."

# Copy environment template if .env.local doesn't exist
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "⚠️  Created .env.local from template. Fill in your API keys before proceeding."
  exit 1
fi

# Start all services
docker-compose up --build

echo "✅ All services started"
echo "  Frontend: http://localhost:3000"
echo "  API:      http://localhost:8000"
echo "  BKT:      http://localhost:8001"
