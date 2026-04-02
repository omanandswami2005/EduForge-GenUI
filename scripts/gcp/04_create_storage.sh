#!/bin/bash
# scripts/gcp/04_create_storage.sh

set -e
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"

# Lesson uploads bucket (teacher PPTX uploads)
gsutil mb -p $PROJECT_ID -l $REGION gs://${PROJECT_ID}-lesson-uploads/
gsutil lifecycle set -l 30 gs://${PROJECT_ID}-lesson-uploads/

# Lesson assets bucket (extracted images, processed files)
gsutil mb -p $PROJECT_ID -l $REGION gs://${PROJECT_ID}-lesson-assets/

# Set CORS for uploads bucket (allow browser uploads via signed URLs)
cat > /tmp/cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["PUT", "GET"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set /tmp/cors.json gs://${PROJECT_ID}-lesson-uploads/

echo "✅ Storage buckets created"
echo "   Uploads: gs://${PROJECT_ID}-lesson-uploads/"
echo "   Assets:  gs://${PROJECT_ID}-lesson-assets/"
