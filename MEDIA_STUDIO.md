# Media Studio - Technical Documentation

## Overview
Media Studio is a unified AI creative platform for image and video generation using Google and OpenAI models.

**Current Capabilities**: Image generation via Gemini, Imagen 4, and GPT-Image models
**In Development**: Video generation via Google Veo 3.1

---

## Image Generation

### Models Summary

| Model | ID | Quality | Cost | Key Features |
|-------|-----|---------|------|--------------|
| **Nano Banana** | `gemini-2.5-flash-image` | 1K-2K | 2 credits | Fast, 1 reference image |
| **Nano Banana Pro** | `gemini-3-pro-image-preview` | 1K-4K | 3-8 credits | **14 reference images**, advanced reasoning |
| **Imagen 4** | `imagen-4.0-generate-001` / `ultra` | 1K-2K | 3-4 credits | **Auto prompt enhancement**, negative prompts, seed |
| **GPT-Image 1.5** | `gpt-image-1.5` | 1K-2K HD | 3-5 credits | Best instruction following, realism |

### Implementation Details

**API**: `supabase/functions/generate-media-image/index.ts`
**Storage**: Supabase Storage bucket `media-studio-images`
**Aspect Ratios**: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2

**Model Selection** (src/components/media/ModelSelector.tsx:20):
- Gemini models support reference images via multimodal input
- Imagen 4 auto-enhances prompts <30 words ([docs](https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images#prompt-rewriter))
- All models use Google AI API (`generativelanguage.googleapis.com`)

---

## Video Generation (In Development)

### Veo 3.1 Models

| Model | ID | Use Case |
|-------|-----|----------|
| **Veo 3.1 Standard** | `veo-3.1-generate-001` | High-quality production videos with advanced physics |
| **Veo 3.1 Fast** | `veo-3.1-fast-generate-001` | Rapid iterations, A/B testing, cost-effective |

**Specifications**: 8s clips, 1080p, 24/30fps, MP4 format, aspect ratios: 16:9, 9:16, 1:1

### Generation Techniques

#### 1. Text-to-Video
[Google Docs](https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-text)

```typescript
{
  prompt: "Close-up of coffee steaming, camera slowly pulls back revealing cafe",
  model: "veo-3.1-generate-001",
  duration: 8,
  aspect_ratio: "16:9"
}
```

#### 2. Image-to-Video
[Google Docs](https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-an-image)

```typescript
{
  prompt: "Camera pans right across the landscape",
  model: "veo-3.1-generate-001",
  input_image_url: "https://...",
  duration: 8
}
```

#### 3. Keyframe-to-Video (First & Last Frame)
[Google Docs](https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-first-and-last-frames)

```typescript
{
  prompt: "Smooth cinematic transition from day to night",
  model: "veo-3.1-generate-001",
  first_frame_url: "https://...",
  last_frame_url: "https://...",
  duration: 8
}
```

### Prompt Best Practices

**Essential Elements** ([Full Guide](https://cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide)):
1. **Camera Movement**: "tracking shot", "aerial view", "dolly zoom", "handheld"
2. **Subject Action**: "walking slowly", "gentle rotation", "rapid motion"
3. **Environment**: "golden hour lighting", "neon-lit street", "soft diffused light"
4. **Timing**: Plan actions within 8-second constraint

**Do's & Don'ts** ([Best Practices](https://cloud.google.com/vertex-ai/generative-ai/docs/video/best-practice)):
- ✅ Single focused action per clip
- ✅ Realistic physics and motion
- ✅ Concise prompts (<100 words)
- ❌ Multiple simultaneous actions
- ❌ Physically impossible movements
- ❌ Abrupt scene changes

**Example**:
```
✅ "Aerial drone shot descending toward a mountain lake at sunrise, smooth and slow"
❌ "Mountain lake video"
```

---

## Architecture

### Backend
**Edge Function**: `supabase/functions/generate-media-image/index.ts` (will expand to `generate-media-video`)
- Authentication via Supabase session token
- Storage buckets: `media-studio-images`, `media-studio-videos` (coming soon)

### Frontend
**Context**: `src/contexts/MediaStudioContext.tsx`
**Key Components**:
- `ModelSelector.tsx` - Model/variant selection
- `FormatControls.tsx` - Aspect ratio, quality settings
- `ReferenceImageUpload.tsx` - Multi-image reference support
- `MediaLibrary.tsx` - Generated media gallery

**Credits**: `creditsService.ts` with Supabase Realtime subscriptions for live updates

---

## Quick Selection Guide

### Image Models
| Use Case | Recommended Model | Why |
|----------|-------------------|-----|
| Quick iterations, social media | **Nano Banana** (2 credits) | Fast, creative, cost-effective |
| Style transfer, 4K outputs | **Nano Banana Pro** (3-8 credits) | 14 reference images, high-res |
| Photorealism, auto-enhanced prompts | **Imagen 4** (3-4 credits) | Prompt rewriter, negative prompts |
| Instruction precision, text in images | **GPT-Image 1.5** (3-5 credits) | Best instruction following |

### Video Models (Coming Soon)
| Use Case | Recommended Model |
|----------|-------------------|
| Production-quality, complex motion | **Veo 3.1 Standard** |
| Rapid prototyping, A/B testing | **Veo 3.1 Fast** |

---

## Implementation Roadmap

**Phase 1 - Video Foundation** (Next)
- [ ] Text-to-video API integration (Veo 3.1)
- [ ] Image-to-video support
- [ ] Keyframe-to-video (first/last frame)
- [ ] User prompt guide integration
- [ ] Video storage & playback

**Phase 2 - Enhancement**
- [ ] Batch generation
- [ ] Video trimming/editing tools
- [ ] Animation sequences (clip chaining)
- [ ] Style presets

**Phase 3 - Advanced**
- [ ] Audio integration
- [ ] Video-to-video editing
- [ ] AI director assistant

---

## References

**Google AI/Vertex AI**
- [Veo 3.1 Models](https://cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate)
- [Text-to-Video](https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-text)
- [Image-to-Video](https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-an-image)
- [Keyframe-to-Video](https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-first-and-last-frames)
- [Video Prompt Guide](https://cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide)
- [Best Practices](https://cloud.google.com/vertex-ai/generative-ai/docs/video/best-practice)
- [Imagen 4](https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images)
- [Gemini Image API](https://ai.google.dev/gemini-api/docs/imagen)

**OpenAI**
- [GPT-Image 1.5](https://platform.openai.com/docs/guides/images)

---

**Last Updated**: January 2026 | **Maintained By**: Creators Multiverse Team
