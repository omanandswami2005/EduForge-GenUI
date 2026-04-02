#!/bin/bash
# scripts/gcp/01_enable_apis.sh

set -e
PROJECT_ID=$(gcloud config get-value project)

echo "Enabling APIs for project: $PROJECT_ID"

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  cloudtasks.googleapis.com \
  pubsub.googleapis.com \
  storage.googleapis.com \
  documentai.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  aiplatform.googleapis.com \
  iam.googleapis.com \
  --project=$PROJECT_ID

echo "✅ All APIs enabled"
