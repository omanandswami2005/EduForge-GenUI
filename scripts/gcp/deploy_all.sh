#!/bin/bash
# scripts/gcp/deploy_all.sh

set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/eduforge"
TAG="${1:-latest}"

API_SA="eduforge-api@${PROJECT_ID}.iam.gserviceaccount.com"
INGESTION_SA="eduforge-ingestion@${PROJECT_ID}.iam.gserviceaccount.com"
BKT_SA="eduforge-bkt@${PROJECT_ID}.iam.gserviceaccount.com"
GENUI_SA="eduforge-genui@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Deploying EduForge to GCP project: $PROJECT_ID"

# ── DEPLOY API SERVICE ────────────────────────────────────────────────────
echo "--- Deploying API Service ---"
gcloud run deploy eduforge-api \
  --image="${REGISTRY}/api:${TAG}" \
  --region=$REGION \
  --service-account=$API_SA \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
  --set-secrets="CLAUDE_API_KEY=CLAUDE_API_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,FIREBASE_SERVICE_ACCOUNT=FIREBASE_SERVICE_ACCOUNT:latest" \
  --project=$PROJECT_ID

API_URL=$(gcloud run services describe eduforge-api \
  --region=$REGION \
  --format="value(status.url)" \
  --project=$PROJECT_ID)
echo "✅ API Service: $API_URL"

# ── DEPLOY BKT SERVICE ────────────────────────────────────────────────────
echo "--- Deploying BKT Service ---"
gcloud run deploy eduforge-bkt \
  --image="${REGISTRY}/bkt-service:${TAG}" \
  --region=$REGION \
  --service-account=$BKT_SA \
  --no-allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=20 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
  --project=$PROJECT_ID

BKT_URL=$(gcloud run services describe eduforge-bkt \
  --region=$REGION \
  --format="value(status.url)" \
  --project=$PROJECT_ID)
echo "✅ BKT Service: $BKT_URL"

# ── DEPLOY GENUI SERVICE ──────────────────────────────────────────────────
echo "--- Deploying GenUI Service ---"
gcloud run deploy eduforge-genui \
  --image="${REGISTRY}/genui-service:${TAG}" \
  --region=$REGION \
  --service-account=$GENUI_SA \
  --no-allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --set-secrets="CLAUDE_API_KEY=CLAUDE_API_KEY:latest" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
  --project=$PROJECT_ID

GENUI_URL=$(gcloud run services describe eduforge-genui \
  --region=$REGION \
  --format="value(status.url)" \
  --project=$PROJECT_ID)
echo "✅ GenUI Service: $GENUI_URL"

# ── DEPLOY INGESTION TRIGGER SERVICE ─────────────────────────────────────
echo "--- Deploying Ingestion Trigger Service ---"
gcloud run deploy eduforge-ingestion \
  --image="${REGISTRY}/ingestion:${TAG}" \
  --region=$REGION \
  --service-account=$INGESTION_SA \
  --no-allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=3600 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --project=$PROJECT_ID

INGESTION_URL=$(gcloud run services describe eduforge-ingestion \
  --region=$REGION \
  --format="value(status.url)" \
  --project=$PROJECT_ID)
echo "✅ Ingestion Service: $INGESTION_URL"

# ── UPDATE PUB/SUB PUSH ENDPOINTS ────────────────────────────────────────
echo "--- Updating Pub/Sub push endpoints ---"
gcloud pubsub subscriptions modify-push-config lesson-ingestion-sub \
  --push-endpoint="${INGESTION_URL}/trigger" \
  --project=$PROJECT_ID

gcloud pubsub subscriptions modify-push-config lesson-complete-sub \
  --push-endpoint="${API_URL}/internal/lesson-complete" \
  --project=$PROJECT_ID

echo "✅ Pub/Sub endpoints updated"

# ── DEPLOY FRONTEND ───────────────────────────────────────────────────────
echo "--- Deploying Frontend to Firebase Hosting ---"
cd apps/web

NEXT_PUBLIC_API_URL=$API_URL \
NEXT_PUBLIC_BKT_URL=$BKT_URL \
NEXT_PUBLIC_GENUI_URL=$GENUI_URL \
pnpm run build

firebase deploy --only hosting --project=$PROJECT_ID

FRONTEND_URL="https://${PROJECT_ID}.web.app"
echo "✅ Frontend: $FRONTEND_URL"

cd ../..

# ── DEPLOY FIRESTORE RULES & INDEXES ─────────────────────────────────────
echo "--- Deploying Firestore security rules ---"
firebase deploy --only firestore --project=$PROJECT_ID
echo "✅ Firestore rules deployed"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║           EduForge Deployment Complete!                ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Frontend:   $FRONTEND_URL"
echo "║  API:        $API_URL"
echo "║  BKT:        $BKT_URL"
echo "║  GenUI:      $GENUI_URL"
echo "║  Ingestion:  $INGESTION_URL"
echo "╚════════════════════════════════════════════════════════╝"
