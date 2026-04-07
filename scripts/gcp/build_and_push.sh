#!/bin/bash
# scripts/gcp/build_and_push.sh
# Build all Docker images using Cloud Build (no local Docker needed)
# and push them to Artifact Registry.

set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/eduforge"
TAG="${1:-latest}"

echo "Building and pushing images via Cloud Build (tag: $TAG)"
echo "Project: $PROJECT_ID"
echo "Registry: $REGISTRY"
echo ""

# Ensure Artifact Registry repo exists
gcloud artifacts repositories describe eduforge \
  --location=$REGION --project=$PROJECT_ID >/dev/null 2>&1 || \
gcloud artifacts repositories create eduforge \
  --repository-format=docker \
  --location=$REGION \
  --description="EduForge container images" \
  --project=$PROJECT_ID

# Build and push Python backend services via Cloud Build
services=("api" "bkt-service" "ingestion")

for service in "${services[@]}"; do
  echo "--- Building ${service} via Cloud Build ---"
  gcloud builds submit "apps/${service}" \
    --tag="${REGISTRY}/${service}:${TAG}" \
    --project=$PROJECT_ID \
    --quiet
  echo "✅ ${service} pushed"
done

# Build and push Next.js frontend via Cloud Build (with build args for NEXT_PUBLIC_ vars)
# Load .env.local for NEXT_PUBLIC_ values
echo "--- Building web (Next.js) via Cloud Build ---"
set -a
source ".env.local" 2>/dev/null || true
set +a

# Get API URL if already deployed (for the frontend to call)
API_URL="${NEXT_PUBLIC_API_URL:-}"
if [ -z "$API_URL" ]; then
  API_URL=$(gcloud run services describe eduforge-api \
    --region=$REGION \
    --format="value(status.url)" \
    --project=$PROJECT_ID 2>/dev/null || echo "http://localhost:8000")
fi

gcloud builds submit "apps/web" \
  --config="apps/web/cloudbuild.yaml" \
  --substitutions="_IMAGE_TAG=${REGISTRY}/web:${TAG},_NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY},_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-${PROJECT_ID}.firebaseapp.com},_NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-${PROJECT_ID}},_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:-${PROJECT_ID}.firebasestorage.app},_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID},_NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID},_NEXT_PUBLIC_API_URL=${API_URL}" \
  --project=$PROJECT_ID \
  --quiet
echo "✅ web pushed"

echo ""
echo "=== All images pushed to ${REGISTRY} ==="

echo "=== All images pushed to ${REGISTRY} ==="
