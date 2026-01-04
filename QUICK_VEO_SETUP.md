# Quick Veo Setup Guide

You already have the service account (`creatorsmultiv-service@creators-multi-verse.iam.gserviceaccount.com`), so setup is simple!

## Step 1: Download Service Account Key (if you don't have it)

```bash
# Use your existing service account
gcloud iam service-accounts keys create veo-key.json \
  --iam-account=creatorsmultiv-service@creators-multi-verse.iam.gserviceaccount.com \
  --project=creators-multi-verse
```

## Step 2: Set Supabase Secrets

```bash
# Navigate to your brandverse-ai-studio project
cd /Users/neo/Neo/CreatorsM/brandverse-ai-studio

# Set the service account JSON (this is the key step!)
supabase secrets set GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY="$(cat veo-key.json)"

# Set project ID (already known)
supabase secrets set GOOGLE_CLOUD_PROJECT_ID="creators-multi-verse"

# Set GCS bucket name
supabase secrets set GCS_BUCKET_NAME="creatorsm-media-bucket"
```

## Step 3: Deploy the Updated Edge Function

```bash
supabase functions deploy generate-media-video
```

## Step 4: Verify GCS Bucket Permissions

Make sure your bucket allows the service account to write:

```bash
# Give service account storage admin role
gsutil iam ch serviceAccount:creatorsmultiv-service@creators-multi-verse.iam.gserviceaccount.com:roles/storage.objectAdmin \
  gs://creatorsm-media-bucket
```

## Step 5: Test!

Now try generating a video from the UI. It should:
1. Upload the request to Vertex AI
2. Poll for completion (~30-90 seconds)
3. Download the video from GCS
4. Upload to Supabase Storage
5. Display in your library

---

## Troubleshooting

### If you get "GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY not configured"
- Make sure you ran the `supabase secrets set` command
- Verify with: `supabase secrets list`

### If you get authentication errors
- Check that the service account has Vertex AI User role
- Verify with: `gcloud projects get-iam-policy creators-multi-verse`

### If videos don't appear
- Check Supabase Edge Function logs
- Verify GCS bucket permissions
- Check that `media-studio-videos` bucket exists in Supabase

---

## Quick Test Command

After setup, test the API directly:

```bash
# Get your Supabase function URL
FUNCTION_URL="https://vcgaqikuaaazjpwyzvwb.supabase.co/functions/v1/generate-media-video"

# Get your access token
ACCESS_TOKEN=$(supabase auth token)

# Test text-to-video
curl -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A calm ocean wave rolling onto a beach at sunset",
    "model": "veo-3.1-fast-generate-001",
    "mode": "text-to-video",
    "aspect_ratio": "9:16",
    "duration": 8
  }'
```

That's it! 🚀
