#!/bin/bash
# scripts/gcp/02_create_registry.sh

set -e
export REGION="us-central1"
export PROJECT_ID=$(gcloud config get-value project)

gcloud artifacts repositories create eduforge \
  --repository-format=docker \
  --location=$REGION \
  --description="EduForge container images" \
  --project=$PROJECT_ID

# Configure Docker to authenticate with the registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev

echo "✅ Artifact Registry created: ${REGION}-docker.pkg.dev/${PROJECT_ID}/eduforge"
