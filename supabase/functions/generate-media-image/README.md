# Generate Media Image - Supabase Edge Function

This edge function handles AI image generation for the Media Studio feature, supporting multiple AI models.

## Supported Models

1. **Gemini 2.5 Flash Image (Nano Banana)** - `gemini-2.5-flash-image`
   - Fast & creative generation
   - 2 credits per image
   - Uses Google AI API

2. **Google Imagen 4** - `imagen-4.0-generate-001`
   - Advanced high-quality generation
   - Standard (1K): 3 credits
   - High (2K): 4 credits
   - Uses Google Vertex AI

3. **GPT-Image-1.5** - `gpt-image-1.5`
   - Best instruction following & realism
   - Standard: 3 credits
   - HD: 5 credits
   - Uses OpenAI API

## Environment Variables Required

Set these in your Supabase project settings (Dashboard → Project Settings → Edge Functions → Secrets):

```bash
OPENAI_API_KEY=sk-...           # OpenAI API key for GPT-image-1.5
GOOGLE_API_KEY=AIza...          # Google AI API key for Gemini
GCP_PROJECT_ID=your-project-id  # Google Cloud Project ID for Imagen 4
SUPABASE_URL=https://...        # Auto-provided by Supabase
SUPABASE_SERVICE_ROLE_KEY=...   # Auto-provided by Supabase
```

### Setting Secrets via CLI

```bash
# Set OpenAI API Key
supabase secrets set OPENAI_API_KEY=sk-your-key-here

# Set Google API Key
supabase secrets set GOOGLE_API_KEY=AIza-your-key-here

# Set GCP Project ID (for Imagen)
supabase secrets set GCP_PROJECT_ID=your-gcp-project
```

## API Request Format

```typescript
{
  "prompt": "A beautiful sunset over mountains",
  "model": "gemini-2.5-flash-image" | "imagen-4.0-generate-001" | "gpt-image-1.5",
  "aspect_ratio": "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2",
  "number_of_images": 1,          // Optional, default 1
  "image_size": "1K" | "2K",      // Optional, default "1K"
  "seed": 12345,                  // Optional, for reproducible generation
  "negative_prompt": "blurry",    // Optional, Imagen only
  "enhance_prompt": true,         // Optional, Imagen only
  "reference_image_url": "...",   // Optional, for image-to-image
  "user_id": "...",               // Auto-filled from auth
  "company_id": "..."             // Optional
}
```

## API Response Format

### Success Response
```typescript
{
  "success": true,
  "image_url": "https://...supabase.co/storage/v1/object/public/media-studio-images/...",
  "thumbnail_url": "https://...",
  "storage_path": "user_id/company_id/timestamp_model_id.png",
  "metadata": {
    "model": "gpt-image-1.5",
    "prompt": "A beautiful sunset...",
    "aspect_ratio": "16:9",
    "image_size": "2K",
    "seed": 12345
  }
}
```

### Error Response
```typescript
{
  "success": false,
  "error": "Error message here"
}
```

## Storage Structure

Images are stored in the `media-studio-images` bucket with the following path structure:

```
media-studio-images/
  └── {user_id}/
      └── {company_id}/
          └── {timestamp}_{model}_{random_id}.png
```

Example: `abc123/company456/1704123456789_gpt-image-1.5_a1b2c3d4.png`

## Deployment

1. **Deploy the function:**
   ```bash
   supabase functions deploy generate-media-image
   ```

2. **Set environment variables** (see above)

3. **Test the function:**
   ```bash
   curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/generate-media-image' \
     --header 'Authorization: Bearer YOUR_ANON_KEY' \
     --header 'Content-Type: application/json' \
     --data '{"prompt":"test","model":"gemini-2.5-flash-image","aspect_ratio":"1:1"}'
   ```

## Error Handling

The function includes comprehensive error handling for:

- Authentication failures
- Missing required parameters
- API key configuration issues
- Model API errors
- Storage upload failures

All errors are logged with the `[GENERATE-MEDIA-IMAGE]` prefix for easy debugging.

## Performance Notes

- **Gemini 2.5 Flash**: ~3-5 seconds average
- **Imagen 4**: ~8-12 seconds average
- **GPT-Image-1.5**: ~10-15 seconds average

HD/2K quality adds ~2-3 seconds to generation time.

## Monitoring

Check function logs:
```bash
supabase functions logs generate-media-image
```

Monitor in Supabase Dashboard:
- Edge Functions → generate-media-image → Logs
- Storage → media-studio-images (check uploads)

## Future Enhancements

- [ ] Thumbnail generation (resized versions)
- [ ] Batch generation support
- [ ] Image editing capabilities
- [ ] Style transfer
- [ ] Upscaling/enhancement
