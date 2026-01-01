# Media Studio Deployment Guide

## Overview

The Media Studio feature enables AI-powered image generation using three different models:
- **Gemini 2.5 Flash (Nano Banana)** - Fast & creative
- **Google Imagen 4** - High quality, advanced features
- **GPT-Image-1.5** - Best instruction following & realism

## Prerequisites

1. Supabase project set up
2. API keys for:
   - OpenAI (for GPT-Image-1.5)
   - Google AI (for Gemini 2.5 Flash)
   - Google Cloud Project with Vertex AI enabled (for Imagen 4)

## Step 1: Get API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### Google AI API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy the key (starts with `AIza`)

### Google Cloud Setup (for Imagen 4)
1. Go to https://console.cloud.google.com/
2. Create or select a project
3. Enable Vertex AI API
4. Note your Project ID

## Step 2: Configure Supabase Storage

The storage buckets should already be created. Verify in Supabase Dashboard → Storage:

- `media-studio-images` (PUBLIC) - For generated images
- `media-studio-videos` (PUBLIC) - For future video support
- `starting-images` (PUBLIC) - For reference images

### If buckets don't exist, create them:

```sql
-- Create media-studio-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-studio-images', 'media-studio-images', true);

-- Set upload policy
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media-studio-images');

-- Set read policy
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media-studio-images');
```

## Step 3: Set Environment Variables

### Via Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Add secrets:
   - `OPENAI_API_KEY` = your OpenAI key
   - `GOOGLE_API_KEY` = your Google AI key
   - `GCP_PROJECT_ID` = your GCP project ID

### Via CLI:
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
supabase secrets set GOOGLE_API_KEY=AIza-your-key-here
supabase secrets set GCP_PROJECT_ID=your-gcp-project-id
```

## Step 4: Deploy Edge Function

```bash
# Navigate to project root
cd /Users/neo/Neo/CreatorsM/brandverse-ai-studio

# Deploy the function
supabase functions deploy generate-media-image

# Verify deployment
supabase functions list
```

## Step 5: Test the Function

### Test with curl:
```bash
# Get your anon key from Supabase Dashboard → Settings → API
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Test Gemini
curl -i --location --request POST "$SUPABASE_URL/functions/v1/generate-media-image" \
  --header "Authorization: Bearer $SUPABASE_ANON_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
    "prompt": "A beautiful sunset over mountains",
    "model": "gemini-2.5-flash-image",
    "aspect_ratio": "16:9"
  }'
```

### Test from Frontend:
1. Start the dev server: `npm run dev`
2. Navigate to Media Studio
3. Enter a prompt
4. Select a model
5. Click "Generate Image"
6. Check browser console for logs
7. Check Supabase logs: `supabase functions logs generate-media-image`

## Step 6: Verify Storage

After successful generation:

1. Go to Supabase Dashboard → Storage → media-studio-images
2. You should see a folder structure: `{user_id}/{company_id}/`
3. Images should be accessible via public URL

## Troubleshooting

### Function not found
```bash
# Redeploy
supabase functions deploy generate-media-image
```

### API Key errors
```bash
# Verify secrets are set
supabase secrets list

# Re-set if needed
supabase secrets set OPENAI_API_KEY=sk-...
```

### Storage permission errors
```sql
-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'media-studio-images';

-- Re-create if needed (see Step 2)
```

### Check function logs
```bash
# Real-time logs
supabase functions logs generate-media-image --tail

# Last 100 logs
supabase functions logs generate-media-image
```

### Common Error Messages

**"GOOGLE_API_KEY not configured"**
- Set the environment variable in Supabase

**"Authentication error"**
- User not logged in on frontend
- Check token is being sent correctly

**"No image data in response"**
- API may have changed format
- Check function logs for actual response structure
- May need to update parsing logic

**"Storage upload failed"**
- Check bucket permissions
- Verify service role key is set
- Check storage quota

## Monitoring

### Check Generation Costs
```sql
-- Count generations by model (if you track in DB)
SELECT model_used, COUNT(*) as total_generations
FROM media_files
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY model_used;
```

### Check Storage Usage
```sql
-- Check storage size
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size_bytes
FROM storage.objects
WHERE bucket_id = 'media-studio-images'
GROUP BY bucket_id;
```

## Cost Estimates

### Per Image Generation:
- **Gemini 2.5 Flash**: ~$0.039 (2 credits)
- **Imagen 4 Standard**: ~$0.058 (3 credits)
- **Imagen 4 High**: ~$0.078 (4 credits)
- **GPT Standard**: ~$0.058 (3 credits)
- **GPT HD**: ~$0.097 (5 credits)

### Storage Costs:
- Supabase: First 1GB free, then $0.021/GB/month
- Typical image: 500KB - 2MB

## Next Steps

1. Monitor function logs for errors
2. Set up alerts for high usage
3. Implement rate limiting if needed
4. Add analytics tracking
5. Consider caching for duplicate prompts
6. Set up CDN for image delivery

## Support

- Supabase Docs: https://supabase.com/docs/guides/functions
- OpenAI Docs: https://platform.openai.com/docs/guides/image-generation
- Google AI Docs: https://ai.google.dev/gemini-api/docs/image-generation
- Vertex AI Docs: https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview
