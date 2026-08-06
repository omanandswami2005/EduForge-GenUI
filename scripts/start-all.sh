#!/usr/bin/env bash
# ──────────────────────────────────────────────────────
# EduForge — Start all 3 backend services against the local
# Firebase emulators (run scripts/dev/start-emulators.sh first).
# No GCP service account or real Firebase project needed.
# ──────────────────────────────────────────────────────
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Locate the venv python for each service (Unix or Windows layout)
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

# Load .env.local
set -a
[ -f "$PROJECT_ROOT/.env.local" ] && source "$PROJECT_ROOT/.env.local"
set +a

# Point every service at the local Firebase emulators instead of real GCP
export GOOGLE_CLOUD_PROJECT="${GOOGLE_CLOUD_PROJECT:-demo-eduforge}"
export FIRESTORE_EMULATOR_HOST="${FIRESTORE_EMULATOR_HOST:-localhost:9090}"
export FIREBASE_AUTH_EMULATOR_HOST="${FIREBASE_AUTH_EMULATOR_HOST:-localhost:9099}"
unset GOOGLE_APPLICATION_CREDENTIALS

echo "=== EduForge Service Launcher (local emulators) ==="
echo "Project:    $GOOGLE_CLOUD_PROJECT"
echo "Firestore:  $FIRESTORE_EMULATOR_HOST"
echo "Auth:       $FIREBASE_AUTH_EMULATOR_HOST"
echo "Groq:       ${GROQ_API_KEY:0:10}..."
echo ""
echo "(Make sure scripts/dev/start-emulators.sh is running in another terminal)"
echo ""

# Start BKT Service (port 8001)
echo "[1/3] Starting BKT Service on :8001..."
cd "$PROJECT_ROOT/apps/bkt-service"
"$(venv_python "$PROJECT_ROOT/apps/bkt-service")" -m uvicorn main:app --host 0.0.0.0 --port 8001 &
BKT_PID=$!

# Start API Gateway (port 8000)
echo "[2/3] Starting API Gateway on :8000..."
cd "$PROJECT_ROOT/apps/api"
"$(venv_python "$PROJECT_ROOT/apps/api")" -m uvicorn main:app --host 0.0.0.0 --port 8000 &
API_PID=$!

# Start Ingestion Service (port 8003)
echo "[3/3] Starting Ingestion Service on :8003..."
cd "$PROJECT_ROOT/apps/ingestion"
"$(venv_python "$PROJECT_ROOT/apps/ingestion")" -m uvicorn main:app --host 0.0.0.0 --port 8003 &
INGESTION_PID=$!

echo ""
echo "All services starting..."
echo "  BKT:       http://localhost:8001 (PID: $BKT_PID)"
echo "  API:       http://localhost:8000 (PID: $API_PID)"
echo "  Ingestion: http://localhost:8003 (PID: $INGESTION_PID)"
echo ""
echo "Note: GenUI is handled by the Next.js app via Vercel AI SDK + Groq"
echo "Press Ctrl+C to stop all services"

# Trap SIGINT to kill all children
trap "echo 'Stopping...'; kill $BKT_PID $API_PID $INGESTION_PID 2>/dev/null; exit 0" INT TERM

wait
