#!/usr/bin/env bash
# ──────────────────────────────────────────────────────
# EduForge — one command to start the whole local stack:
# Firebase emulators (Auth + Firestore), all 3 Python backend
# services, and the Next.js frontend. No GCP project, no real
# Google login, no service account key required.
#
# Usage: bash scripts/dev/start-everything.sh
# Stop:  Ctrl+C (cleans up every child process it started)
#
# Logs for each service are written to /tmp/eduforge-*.log so this
# terminal only shows high-level status — tail a log directly if you
# need to debug one service, e.g.: tail -f /tmp/eduforge-web.log
# ──────────────────────────────────────────────────────
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

LOG_DIR="/tmp"
PIDS=()

cleanup() {
    echo ""
    echo "Stopping all EduForge services..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    wait 2>/dev/null || true
    echo "Stopped."
    exit 0
}
trap cleanup INT TERM

venv_python() {
    local service_dir="$1"
    if [ -f "$service_dir/.venv/bin/python" ]; then
        echo "$service_dir/.venv/bin/python"
    elif [ -f "$service_dir/.venv/Scripts/python.exe" ]; then
        echo "$service_dir/.venv/Scripts/python.exe"
    else
        echo "python3"
    fi
}

wait_for_http() {
    local url="$1"
    local label="$2"
    local timeout="${3:-60}"
    for ((i = 0; i < timeout; i++)); do
        if curl -s -o /dev/null "$url" 2>/dev/null; then
            echo "  $label ready"
            return 0
        fi
        sleep 1
    done
    echo "  WARNING: $label did not respond within ${timeout}s (check its log) — continuing anyway"
}

if [ ! -f .env.local ]; then
    echo "ERROR: .env.local not found. Copy .env.example to .env.local and fill in GROQ_API_KEY first."
    echo "  cp .env.example .env.local"
    exit 1
fi

echo "=== 1/4  Firebase emulators (Auth + Firestore) ==="
bash scripts/dev/start-emulators.sh > "$LOG_DIR/eduforge-emulators.log" 2>&1 &
PIDS+=($!)
wait_for_http "http://localhost:9099" "Auth emulator" 60
wait_for_http "http://localhost:9090" "Firestore emulator" 30

set -a
source .env.local
set +a
export GOOGLE_CLOUD_PROJECT="${GOOGLE_CLOUD_PROJECT:-demo-eduforge}"
export FIRESTORE_EMULATOR_HOST="${FIRESTORE_EMULATOR_HOST:-localhost:9090}"
export FIREBASE_AUTH_EMULATOR_HOST="${FIREBASE_AUTH_EMULATOR_HOST:-localhost:9099}"
unset GOOGLE_APPLICATION_CREDENTIALS

echo "=== 2/4  Backend services (BKT, API gateway, ingestion) ==="
cd "$PROJECT_ROOT/apps/bkt-service"
"$(venv_python "$PROJECT_ROOT/apps/bkt-service")" -m uvicorn main:app --host 0.0.0.0 --port 8001 > "$LOG_DIR/eduforge-bkt.log" 2>&1 &
PIDS+=($!)

cd "$PROJECT_ROOT/apps/api"
"$(venv_python "$PROJECT_ROOT/apps/api")" -m uvicorn main:app --host 0.0.0.0 --port 8000 > "$LOG_DIR/eduforge-api.log" 2>&1 &
PIDS+=($!)

cd "$PROJECT_ROOT/apps/ingestion"
"$(venv_python "$PROJECT_ROOT/apps/ingestion")" -m uvicorn main:app --host 0.0.0.0 --port 8003 > "$LOG_DIR/eduforge-ingestion.log" 2>&1 &
PIDS+=($!)

wait_for_http "http://localhost:8001/health" "BKT service" 30
wait_for_http "http://localhost:8000/health" "API gateway" 30
wait_for_http "http://localhost:8003/health" "Ingestion service" 30

echo "=== 3/4  Frontend (Next.js) ==="
cd "$PROJECT_ROOT/apps/web"
if [ ! -L .env.local ] && [ ! -f .env.local ]; then
    ln -sf ../../.env.local .env.local
fi
pnpm dev > "$LOG_DIR/eduforge-web.log" 2>&1 &
PIDS+=($!)
wait_for_http "http://localhost:3000" "Frontend" 60

cd "$PROJECT_ROOT"
echo ""
echo "=== 4/4  All services up ==="
echo "  Frontend       http://localhost:3000"
echo "  API gateway    http://localhost:8000"
echo "  BKT service    http://localhost:8001"
echo "  Ingestion      http://localhost:8003"
echo "  Emulator UI    http://localhost:4000"
echo ""
echo "Logs: $LOG_DIR/eduforge-{emulators,bkt,api,ingestion,web}.log"
echo "Press Ctrl+C to stop everything."
echo ""

wait
