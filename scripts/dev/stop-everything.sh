#!/usr/bin/env bash
# Kills any EduForge local dev processes left running — useful if a
# terminal running start-everything.sh was closed without Ctrl+C, or a
# previous run left stray processes on the usual ports.
set -e

echo "Stopping any running EduForge processes..."

pkill -f "firebase-tools emulators:start" 2>/dev/null && echo "  stopped Firebase emulators" || true
pkill -f "uvicorn main:app --host 0.0.0.0 --port 8001" 2>/dev/null && echo "  stopped BKT service" || true
pkill -f "uvicorn main:app --host 0.0.0.0 --port 8000" 2>/dev/null && echo "  stopped API gateway" || true
pkill -f "uvicorn main:app --host 0.0.0.0 --port 8003" 2>/dev/null && echo "  stopped ingestion service" || true
pkill -f "next dev" 2>/dev/null && echo "  stopped Next.js frontend" || true

echo "Done. (Ports free up within a few seconds.)"
