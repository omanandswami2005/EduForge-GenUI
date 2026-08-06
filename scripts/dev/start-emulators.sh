#!/usr/bin/env bash
# Starts the Firebase Local Emulator Suite (Auth + Firestore) for fully
# offline local dev — no GCP project, no service account key, no real
# Google login required. Ports come from firebase.json.
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

FIREBASE_PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-demo-eduforge}"
DATA_DIR="$PROJECT_ROOT/.firebase-emulator-data"

echo "=== EduForge Firebase Emulators ==="
echo "Project:   $FIREBASE_PROJECT_ID (fake id — emulators don't touch real GCP)"
echo "Auth:      http://localhost:9099"
echo "Firestore: http://localhost:9090"
echo "UI:        http://localhost:4000"
echo ""

mkdir -p "$DATA_DIR"

npx --yes firebase-tools emulators:start \
    --project "$FIREBASE_PROJECT_ID" \
    --config firebase.emulator.json \
    --only auth,firestore \
    --import="$DATA_DIR" \
    --export-on-exit="$DATA_DIR"
