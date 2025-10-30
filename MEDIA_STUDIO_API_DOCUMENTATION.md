# Media Studio Image Generation API Documentation

This document outlines the API payload structures and integration requirements for implementing image generation in Media Studio using **Nano Banana (Google Gemini 2.5 Flash Image)** and **ChatGPT Image (OpenAI gpt-image-1)** models.

---

## Table of Contents

1. [Overview](#overview)
2. [Frontend Request Structure](#frontend-request-structure)
3. [Nano Banana Integration](#nano-banana-integration)
4. [ChatGPT Image Integration](#chatgpt-image-integration)
5. [Response Format](#response-format)
6. [Reference Image Handling](#reference-image-handling)
7. [Error Handling](#error-handling)
8. [Credits & Billing](#credits--billing)

---

## Overview

### Supported Models

| Model ID | Provider | Model Name | Description |
|----------|----------|------------|-------------|
| `nano-banana` | Google | `google/gemini-2.5-flash-image-preview` | Fast & creative image generation via Lovable AI Gateway |
| `chatgpt-image` | OpenAI | `gpt-image-1` | High quality & precise generation via OpenAI API |

### Key Features
- **Direct generation**: No company context, purely prompt-based
- **Reference image support**: Both models support reference images
- **Flexible aspect ratios**: `1:1`, `16:9`, `9:16`, `4:5`, `3:2`
- **Quality tiers**: Standard, High, Ultra

---

## Frontend Request Structure

The frontend sends the following payload to the backend:

```typescript
interface MediaGenerationRequest {
  prompt: string;                    // User's text description
  model: 'nano-banana' | 'chatgpt-image';
  aspect_ratio: '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
  quality: 'standard' | 'high' | 'ultra';
  reference_image_url?: string;      // Optional: URL to reference image in Supabase storage
}
```

### Example Request

```json
{
  "prompt": "A majestic eagle soaring over snow-capped mountains at sunset, photorealistic style with dramatic lighting",
  "model": "nano-banana",
  "aspect_ratio": "16:9",
  "quality": "high",
  "reference_image_url": "https://vcgaqikuaaazjpwyzvwb.supabase.co/storage/v1/object/public/media-studio-references/user123/ref_image_001.jpg"
}
```

---

## Nano Banana Integration

### API Endpoint
```
POST https://ai.gateway.lovable.dev/v1/chat/completions
```

### Authentication
```
Authorization: Bearer ${LOVABLE_API_KEY}
```

### Request Payload

```json
{
  "model": "google/gemini-2.5-flash-image-preview",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "<USER_PROMPT>"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "<REFERENCE_IMAGE_URL_OR_BASE64>"
          }
        }
      ]
    }
  ],
  "modalities": ["image", "text"]
}
```

### Without Reference Image

```json
{
  "model": "google/gemini-2.5-flash-image-preview",
  "messages": [
    {
      "role": "user",
      "content": "A majestic eagle soaring over snow-capped mountains at sunset"
    }
  ],
  "modalities": ["image", "text"]
}
```

### Response Format

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "I've generated an image for you.",
        "images": [
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
            }
          }
        ]
      }
    }
  ]
}
```

### Processing Steps

1. **Construct prompt** - Use user's prompt directly
2. **Add reference image** (if provided):
   - Include as `image_url` in content array
   - Can be public URL or base64 data URL
3. **Call API** with `modalities: ["image", "text"]`
4. **Extract base64 image** from `choices[0].message.images[0].image_url.url`
5. **Upload to Supabase Storage** (`media-studio-images` bucket)
6. **Save metadata** to `media_files` table

### Important Notes
- **Base64 output**: Always returns base64, do NOT pass it back to agent
- **Fast generation**: Typically 3-8 seconds
- **No aspect ratio control**: Gemini model doesn't support explicit aspect ratios via API parameters
- **Quality**: Controlled by backend processing, not API parameters

---

## ChatGPT Image Integration

### API Endpoint
```
POST https://api.openai.com/v1/images/generations
```

### Authentication
```
Authorization: Bearer ${OPENAI_API_KEY}
Content-Type: application/json
```

### Request Payload

```json
{
  "model": "gpt-image-1",
  "prompt": "<USER_PROMPT>",
  "size": "1024x1024",
  "quality": "high",
  "output_format": "png",
  "output_compression": 100,
  "background": "auto",
  "moderation": "auto"
}
```

### Size Mapping

Map frontend `aspect_ratio` to OpenAI's `size` parameter:

| Frontend Aspect Ratio | OpenAI Size Parameter |
|-----------------------|-----------------------|
| `1:1` | `1024x1024` |
| `16:9` | `1536x1024` (landscape) |
| `9:16` | `1024x1536` (portrait) |
| `4:5` | `1024x1280` (portrait) |
| `3:2` | `1536x1024` (landscape) |

### Quality Mapping

| Frontend Quality | OpenAI Parameter |
|------------------|------------------|
| `standard` | `quality: "auto"` |
| `high` | `quality: "high"` |
| `ultra` | `quality: "high"` |

### With Reference Image (Edit Mode)

OpenAI doesn't support reference images in the same way. For editing functionality, you would need to use the **Edit endpoint** which is separate:

```
POST https://api.openai.com/v1/images/edits
```

```json
{
  "model": "gpt-image-1",
  "prompt": "Apply the style of the reference image",
  "image": "<BASE64_REFERENCE_IMAGE>",
  "size": "1024x1024",
  "quality": "high"
}
```

**Note**: For MVP, if a reference image is provided with `chatgpt-image` model, you could:
- **Option A**: Ignore reference and generate from prompt only
- **Option B**: Prepend prompt with: `"In the style of the provided image: {original_prompt}"`
- **Option C**: Return error requesting user to use `nano-banana` for reference images

### Response Format

```json
{
  "created": 1677825464,
  "data": [
    {
      "url": "https://oaidalleapiprodscus.blob.core.windows.net/private/...",
      "revised_prompt": "A majestic eagle..."
    }
  ]
}
```

OR with base64 (if `response_format: "b64_json"`):

```json
{
  "created": 1677825464,
  "data": [
    {
      "b64_json": "iVBORw0KGgoAAAANSUhEUg..."
    }
  ]
}
```

### Processing Steps

1. **Map parameters**:
   - Convert `aspect_ratio` → `size`
   - Convert `quality` → OpenAI quality parameter
2. **Construct request** with mapped parameters
3. **Call API**
4. **Download image** from returned URL OR decode base64
5. **Upload to Supabase Storage**
6. **Save metadata** to `media_files` table

### Important Notes
- **60-minute URLs**: If using URL response, download immediately
- **Precise generation**: Better at following exact prompts
- **Slower**: Typically 10-20 seconds
- **Background control**: Supports `transparent` background with PNG/WebP

---

## Response Format

Backend should return consistent format regardless of model:

```typescript
interface MediaGenerationResponse {
  success: boolean;
  media_url: string;           // Public URL in Supabase Storage
  thumbnail_url?: string;      // Optional thumbnail
  model_used: string;          // 'nano-banana' or 'chatgpt-image'
  credits_used: number;
  generation_time_ms: number;
  metadata?: {
    revised_prompt?: string;   // OpenAI may revise prompts
    dimensions: {
      width: number;
      height: number;
    };
  };
}
```

### Example Response

```json
{
  "success": true,
  "media_url": "https://vcgaqikuaaazjpwyzvwb.supabase.co/storage/v1/object/public/media-studio-images/user123/gen_1234567890.png",
  "thumbnail_url": "https://vcgaqikuaaazjpwyzvwb.supabase.co/storage/v1/object/public/media-studio-images/user123/gen_1234567890_thumb.png",
  "model_used": "nano-banana",
  "credits_used": 2,
  "generation_time_ms": 5432,
  "metadata": {
    "dimensions": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

---

## Reference Image Handling

### Upload Flow

1. **Frontend uploads to Supabase**:
   - Bucket: `media-studio-references`
   - Path: `{user_id}/{timestamp}_{random}.{ext}`
   - Max size: 10MB
   - Formats: PNG, JPG, WEBP

2. **Frontend sends URL** in generation request

3. **Backend processes**:
   - **Nano Banana**: Pass URL directly or convert to base64
   - **ChatGPT**: Download image, convert to base64 for edit endpoint

### Reference Image Guidelines

**Best practices to include in frontend UI:**
- Use for style transfer or composition guidance
- Works best with clear, high-quality images
- Reference affects overall aesthetic, not exact reproduction
- Combine with detailed prompt for best results

---

## Error Handling

### Common Error Scenarios

#### 1. Content Policy Violation

```json
{
  "success": false,
  "error": {
    "code": "CONTENT_POLICY_VIOLATION",
    "message": "Your prompt contains restricted content. Please revise.",
    "details": "Detected content: violence"
  }
}
```

#### 2. Invalid Aspect Ratio

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ASPECT_RATIO",
    "message": "Aspect ratio '21:9' is not supported. Supported: 1:1, 16:9, 9:16, 4:5, 3:2"
  }
}
```

#### 3. Insufficient Credits

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Generation requires 2 credits. Current balance: 1",
    "required_credits": 2,
    "current_balance": 1
  }
}
```

#### 4. API Timeout

```json
{
  "success": false,
  "error": {
    "code": "GENERATION_TIMEOUT",
    "message": "Image generation took too long. Please try again.",
    "retry_able": true
  }
}
```

#### 5. Rate Limit (Lovable AI)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please wait before trying again.",
    "retry_after_seconds": 30
  }
}
```

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Invalid request parameters |
| 402 | Insufficient credits |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## Credits & Billing

### Credit Cost Structure

| Quality | Credits per Image |
|---------|-------------------|
| Standard | 1 credit |
| High | 2 credits |
| Ultra | 3 credits |

### Model-Specific Costs

**Note**: Both models use the same credit structure from user perspective. Backend can adjust actual API costs internally.

### Credit Deduction Flow

1. **Pre-check**: Verify user has sufficient credits
2. **Deduct immediately**: When generation starts
3. **Refund on failure**: If generation fails (API error, not content policy)
4. **Log transaction**: Record in `credit_transactions` table

### Example Credit Transaction

```sql
INSERT INTO credit_transactions (
  user_id,
  amount,
  transaction_type,
  description,
  metadata
) VALUES (
  'user123',
  -2,
  'media_generation',
  'Image generation - nano-banana - high quality',
  '{"model": "nano-banana", "quality": "high", "aspect_ratio": "16:9"}'::jsonb
);
```

---

## Database Schema

### media_files Table

```sql
-- Already exists, ensure these fields are populated:
{
  id: UUID,
  user_id: UUID,
  company_id: UUID | null,        -- Always null for Media Studio
  file_name: string,
  file_type: 'image',              -- Always 'image'
  file_format: 'png',              -- Always 'png' for now
  file_size: number | null,
  storage_path: string,
  public_url: string,
  thumbnail_url: string | null,
  prompt: string,                  -- User's original prompt
  model_used: string,              -- 'nano-banana' or 'chatgpt-image'
  aspect_ratio: string,
  quality: string,
  duration: null,                  -- Always null for images
  reference_image_url: string | null,
  tags: string[],
  is_favorite: boolean,
  custom_title: string | null,
  notes: string | null,
  download_count: number,
  view_count: number,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## Progress Updates

Frontend expects real-time progress updates. Implement using one of:

### Option A: Server-Sent Events (SSE)

```typescript
// Backend
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
});

// Stage 1
res.write(`data: ${JSON.stringify({ stage: 'Analyzing prompt...', progress: 20 })}\n\n`);

// Stage 2
res.write(`data: ${JSON.stringify({ stage: 'Generating image...', progress: 60 })}\n\n`);

// Stage 3
res.write(`data: ${JSON.stringify({ stage: 'Finalizing...', progress: 90 })}\n\n`);

// Complete
res.write(`data: ${JSON.stringify({ stage: 'Complete!', progress: 100, result: {...} })}\n\n`);
res.end();
```

### Option B: WebSocket

```typescript
// Backend
socket.emit('progress', { stage: 'Analyzing prompt...', progress: 20 });
socket.emit('progress', { stage: 'Generating image...', progress: 60 });
socket.emit('progress', { stage: 'Finalizing...', progress: 90 });
socket.emit('complete', { result: {...} });
```

### Progress Stages

Recommended stages for UX:

| Progress % | Stage Message |
|------------|---------------|
| 0-20% | "Analyzing your prompt..." |
| 20-40% | "Preparing image generation..." |
| 40-70% | "Generating image..." |
| 70-90% | "Refining details..." |
| 90-100% | "Finalizing and uploading..." |

---

## Testing Checklist

- [ ] **Nano Banana**: Generate without reference image
- [ ] **Nano Banana**: Generate with reference image
- [ ] **ChatGPT**: Generate without reference image
- [ ] **ChatGPT**: Handle reference image (decide on approach)
- [ ] **All aspect ratios**: Test each aspect ratio works correctly
- [ ] **All quality tiers**: Verify credit deduction is correct
- [ ] **Error handling**: Test content policy, insufficient credits, timeouts
- [ ] **Rate limiting**: Verify 429 errors are handled gracefully
- [ ] **Storage upload**: Confirm images are uploaded to correct bucket
- [ ] **Database records**: Verify all metadata is saved correctly
- [ ] **Credit transactions**: Check transactions are logged
- [ ] **Progress updates**: Verify real-time progress works
- [ ] **Large prompts**: Test with 2000 character prompts
- [ ] **Special characters**: Test prompts with emojis, unicode, etc.

---

## API Keys Required

### Production

```env
LOVABLE_API_KEY=<auto-provisioned-by-lovable>
OPENAI_API_KEY=<must-be-added-to-supabase-secrets>
```

### Lovable AI Key
- **Auto-provisioned**: Available in Supabase Edge Function secrets
- **No user action needed**
- **Endpoint**: https://ai.gateway.lovable.dev

### OpenAI Key
- **Must be added**: Via Supabase dashboard → Edge Functions → Secrets
- **User must provide**: Or use project-level key
- **Test in dashboard**: Before deploying

---

## Performance Considerations

### Expected Generation Times

| Model | Average Time | P95 Time |
|-------|--------------|----------|
| Nano Banana | 3-8 seconds | 12 seconds |
| ChatGPT Image | 10-20 seconds | 30 seconds |

### Optimization Tips

1. **Parallel uploads**: Upload image to storage while generating thumbnail
2. **Lazy database writes**: Don't block response on metadata save
3. **CDN caching**: Serve generated images from CDN
4. **Thumbnail generation**: Create thumbnails asynchronously
5. **Rate limiting**: Implement per-user rate limits to prevent abuse

---

## Support & Troubleshooting

### Common Issues

**Issue**: Nano Banana returns "Model not found"
- **Solution**: Verify `LOVABLE_API_KEY` is set in Edge Function secrets

**Issue**: ChatGPT returns 401 Unauthorized
- **Solution**: Check `OPENAI_API_KEY` is correctly set

**Issue**: Base64 images too large for response
- **Solution**: Never return base64 to frontend - upload to storage first

**Issue**: Images have wrong aspect ratio
- **Solution**: Verify aspect ratio mapping is correct for each model

**Issue**: Content policy violations too frequent
- **Solution**: Implement pre-check with content filter before API call

---

## Additional Resources

- **Lovable AI Docs**: https://docs.lovable.dev/features/ai
- **OpenAI Image API**: https://platform.openai.com/docs/api-reference/images
- **Gemini API**: https://ai.google.dev/gemini-api/docs/vision
- **Supabase Storage**: https://supabase.com/docs/guides/storage

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-30 | Initial documentation |

---

**End of Documentation**
