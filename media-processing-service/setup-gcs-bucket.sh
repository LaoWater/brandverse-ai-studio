#!/bin/bash
# GCS Bucket Setup for Large Video Exports
# Run this ONCE before deploying the updated service
set -e

PROJECT_ID="creators-multi-verse"
REGION="europe-central2"
BUCKET_NAME="brandverse-media-exports"
SERVICE_NAME="media-processing-svc"

echo "========================================"
echo "GCS Bucket Setup for Large Video Exports"
echo "========================================"
echo "Project: $PROJECT_ID"
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"
echo "========================================"

# Step 1: Create the bucket (if it doesn't exist)
echo ""
echo "Step 1: Creating GCS bucket..."
if gcloud storage buckets describe gs://$BUCKET_NAME --project $PROJECT_ID &>/dev/null; then
    echo "Bucket gs://$BUCKET_NAME already exists, skipping creation."
else
    gcloud storage buckets create gs://$BUCKET_NAME \
        --project $PROJECT_ID \
        --location $REGION \
        --uniform-bucket-level-access
    echo "Bucket gs://$BUCKET_NAME created."
fi

# Step 2: Get the Cloud Run service account
echo ""
echo "Step 2: Getting Cloud Run service account..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
echo "Service account: $SERVICE_ACCOUNT"

# Step 3: Grant storage permissions to the service account
echo ""
echo "Step 3: Granting storage permissions..."
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.objectAdmin" \
    --project $PROJECT_ID

echo "Granted storage.objectAdmin to $SERVICE_ACCOUNT"

# Step 4: Allow public access on the bucket (for public URLs)
echo ""
echo "Step 4: Enabling public access on bucket..."
gcloud storage buckets update gs://$BUCKET_NAME \
    --no-public-access-prevention \
    --project $PROJECT_ID

# Grant allUsers read access (objects made public individually via blob.make_public())
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME \
    --member="allUsers" \
    --role="roles/storage.objectViewer" \
    --project $PROJECT_ID

echo "Public access enabled on bucket"

# Step 5: Set lifecycle rule to auto-delete old exports (optional but recommended)
echo ""
echo "Step 5: Setting lifecycle rule (auto-delete after 30 days)..."
cat > /tmp/lifecycle.json << 'EOF'
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 30}
    }
  ]
}
EOF

gcloud storage buckets update gs://$BUCKET_NAME \
    --lifecycle-file=/tmp/lifecycle.json \
    --project $PROJECT_ID

rm /tmp/lifecycle.json
echo "Lifecycle rule set: files auto-delete after 30 days"

# Step 6: Set CORS for browser downloads (if needed)
echo ""
echo "Step 6: Setting CORS policy..."
cat > /tmp/cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Content-Disposition"],
    "maxAgeSeconds": 3600
  }
]
EOF

gcloud storage buckets update gs://$BUCKET_NAME \
    --cors-file=/tmp/cors.json \
    --project $PROJECT_ID

rm /tmp/cors.json
echo "CORS policy set"

echo ""
echo "========================================"
echo "GCS Bucket Setup Complete!"
echo "========================================"
echo ""
echo "Bucket URL: gs://$BUCKET_NAME"
echo ""
echo "Next steps:"
echo "1. Run ./deploy.sh to deploy the updated service"
echo "2. The service will automatically use GCS for files > 50MB"
echo ""
echo "Note: Files in this bucket auto-delete after 30 days."
echo "      Signed URLs expire after 7 days."
echo "========================================"
