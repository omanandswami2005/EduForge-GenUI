#!/bin/bash
# scripts/gcp/03_create_service_accounts.sh

set -e
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# API Service Account
gcloud iam service-accounts create eduforge-api \
  --display-name="EduForge API Service" \
  --project=$PROJECT_ID

# Ingestion Job Service Account
gcloud iam service-accounts create eduforge-ingestion \
  --display-name="EduForge Ingestion Job" \
  --project=$PROJECT_ID

# BKT Service Account
gcloud iam service-accounts create eduforge-bkt \
  --display-name="EduForge BKT Service" \
  --project=$PROJECT_ID

# GenUI Service Account
gcloud iam service-accounts create eduforge-genui \
  --display-name="EduForge GenUI Service" \
  --project=$PROJECT_ID

API_SA="eduforge-api@${PROJECT_ID}.iam.gserviceaccount.com"
INGESTION_SA="eduforge-ingestion@${PROJECT_ID}.iam.gserviceaccount.com"
BKT_SA="eduforge-bkt@${PROJECT_ID}.iam.gserviceaccount.com"
GENUI_SA="eduforge-genui@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant roles to API service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${API_SA}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${API_SA}" \
  --role="roles/pubsub.publisher"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${API_SA}" \
  --role="roles/storage.objectCreator"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${API_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${API_SA}" \
  --role="roles/cloudtasks.enqueuer"

# Grant roles to Ingestion service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${INGESTION_SA}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${INGESTION_SA}" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${INGESTION_SA}" \
  --role="roles/documentai.apiUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${INGESTION_SA}" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${INGESTION_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${INGESTION_SA}" \
  --role="roles/pubsub.publisher"

# BKT service - Firestore read/write only
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${BKT_SA}" \
  --role="roles/datastore.user"

# GenUI service - Secret Manager for API keys
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${GENUI_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${GENUI_SA}" \
  --role="roles/datastore.viewer"

echo "✅ Service accounts created and roles assigned"
