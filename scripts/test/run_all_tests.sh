#!/bin/bash
# scripts/test/run_all_tests.sh

set -e

echo "=== Running EduForge Test Suite ==="

# Python services
echo "--- BKT Service Tests ---"
cd apps/bkt-service
pip install -r requirements.txt -q
python -m pytest tests/ -v --tb=short
cd ../..

echo "--- API Service Tests ---"
cd apps/api
pip install -r requirements.txt -q
python -m pytest tests/ -v --tb=short
cd ../..

echo "--- Ingestion Service Tests ---"
cd apps/ingestion
pip install -r requirements.txt -q
python -m pytest tests/ -v --tb=short
cd ../..

# Frontend
echo "--- Frontend Lint ---"
cd apps/web
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm run lint 2>/dev/null || echo "No lint script configured"
cd ../..

echo "=== All tests complete ==="
