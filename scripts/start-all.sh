#!/usr/bin/env bash
# ──────────────────────────────────────────────────────
# EduForge — Start all 4 backend services with real GCP creds
# ──────────────────────────────────────────────────────
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV_PYTHON="$PROJECT_ROOT/apps/bkt-service/.venv/Scripts/python.exe"

# Load .env.local
set -a
source "$PROJECT_ROOT/.env.local"
set +a

# Fix relative SA key path to absolute
export GOOGLE_APPLICATION_CREDENTIALS="$PROJECT_ROOT/.secrets/sa-key.json"

echo "=== EduForge Service Launcher ==="
echo "Project: $GOOGLE_CLOUD_PROJECT"
echo "SA Key:  $GOOGLE_APPLICATION_CREDENTIALS"
echo "Gemini:  ${GEMINI_API_KEY:0:10}..."
echo ""

# Start BKT Service (port 8001)
echo "[1/4] Starting BKT Service on :8001..."
cd "$PROJECT_ROOT/apps/bkt-service"
"$VENV_PYTHON" -m uvicorn main:app --host 0.0.0.0 --port 8001 &
BKT_PID=$!

# Start API Gateway (port 8000)
echo "[2/4] Starting API Gateway on :8000..."
cd "$PROJECT_ROOT/apps/api"
"$VENV_PYTHON" -m uvicorn main:app --host 0.0.0.0 --port 8000 &
API_PID=$!

# Start GenUI Service (port 8002)
echo "[3/4] Starting GenUI Service on :8002..."
cd "$PROJECT_ROOT/apps/genui-service"
"$VENV_PYTHON" -m uvicorn main:app --host 0.0.0.0 --port 8002 &
GENUI_PID=$!

# Start Ingestion Service (port 8003)
echo "[4/4] Starting Ingestion Service on :8003..."
cd "$PROJECT_ROOT/apps/ingestion"
"$VENV_PYTHON" -m uvicorn main:app --host 0.0.0.0 --port 8003 &
INGESTION_PID=$!

echo ""
echo "All services starting..."
echo "  BKT:       http://localhost:8001 (PID: $BKT_PID)"
echo "  API:       http://localhost:8000 (PID: $API_PID)"
echo "  GenUI:     http://localhost:8002 (PID: $GENUI_PID)"
echo "  Ingestion: http://localhost:8003 (PID: $INGESTION_PID)"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap SIGINT to kill all children
trap "echo 'Stopping...'; kill $BKT_PID $API_PID $GENUI_PID $INGESTION_PID 2>/dev/null; exit 0" INT TERM

wait
