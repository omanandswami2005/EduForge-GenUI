#!/bin/bash
# scripts/gcp/05_create_pubsub.sh

set -e
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"

# Topic: lesson ingestion requests
gcloud pubsub topics create lesson-ingestion-requests --project=$PROJECT_ID

# Topic: ingestion completion notifications
gcloud pubsub topics create lesson-ingestion-complete --project=$PROJECT_ID

# Topic: BKT update events (for analytics aggregation)
gcloud pubsub topics create bkt-state-updates --project=$PROJECT_ID

# Subscription for ingestion worker (push to Cloud Run)
# NOTE: Update INGESTION_JOB_URL after deploying ingestion service
INGESTION_SA="eduforge-ingestion@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud pubsub subscriptions create lesson-ingestion-sub \
  --topic=lesson-ingestion-requests \
  --push-endpoint="https://eduforge-ingestion-${PROJECT_ID}-uc.a.run.app/trigger" \
  --push-auth-service-account=$INGESTION_SA \
  --ack-deadline=600 \
  --project=$PROJECT_ID

# Subscription for completion notifications (push to API service)
gcloud pubsub subscriptions create lesson-complete-sub \
  --topic=lesson-ingestion-complete \
  --push-endpoint="https://eduforge-api-${PROJECT_ID}-uc.a.run.app/internal/lesson-complete" \
  --push-auth-service-account="eduforge-api@${PROJECT_ID}.iam.gserviceaccount.com" \
  --ack-deadline=60 \
  --project=$PROJECT_ID

echo "✅ Pub/Sub topics and subscriptions created"
