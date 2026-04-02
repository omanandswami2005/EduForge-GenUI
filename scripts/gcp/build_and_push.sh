#!/bin/bash
# scripts/gcp/build_and_push.sh

set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/eduforge"
TAG="${1:-latest}"

echo "Building and pushing images with tag: $TAG"

# Configure Docker auth
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Build and push each service
services=("api" "bkt-service" "ingestion" "genui-service")

for service in "${services[@]}"; do
  echo "--- Building ${service} ---"
  docker build \
    --platform linux/amd64 \
    -t "${REGISTRY}/${service}:${TAG}" \
    -f "apps/${service}/Dockerfile" \
    "apps/${service}"
  
  docker push "${REGISTRY}/${service}:${TAG}"
  echo "✅ ${service} pushed"
done

echo "=== All images pushed to ${REGISTRY} ==="
