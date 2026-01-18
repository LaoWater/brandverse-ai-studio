# Sora 2 Pro Video Generation Setup

This directory contains a production-ready implementation for generating videos using OpenAI's Sora 2 and Sora 2 Pro models.

## 📋 Overview

- **`video_generation.py`**: Core module with `SoraVideoGenerator` class
- **`example_video_generation.py`**: Usage examples and test scripts
- **Generated videos**: Saved to `generated_videos/`, `therapy_videos/`, or `wellness_videos/`

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up API Key

Your `.env` file already contains `OPENAI_API_KEY`. Ensure it's valid and has access to Sora API.

**Note**: As of November 2025, Sora API access requires explicit invitation from OpenAI's developer relations team. ChatGPT Pro subscribers can use Sora 2 via web/mobile apps.

### 3. Run a Quick Test

```bash
# Quick test with Sora 2 (faster, 20s max)
python example_video_generation.py test

# Generate therapy intro video
python example_video_generation.py therapy

# Generate multiple wellness videos
python example_video_generation.py wellness
```

## 📚 Usage Examples

### Basic Usage

```python
from video_generation import SoraVideoGenerator

# Initialize generator
generator = SoraVideoGenerator(default_model="sora-2-pro")

# Generate and download video
video_path = generator.generate_and_download(
    prompt="A peaceful sunset over calm ocean waters",
    duration=15,
    resolution="1920x1080"
)

print(f"Video saved to: {video_path}")
```

### Step-by-Step Workflow

```python
# Step 1: Generate video
job = generator.generate_video(
    prompt="Futuristic city with flying cars",
    model="sora-2-pro",
    duration=30,
    resolution="1920x1080"
)

# Step 2: Wait for completion
result = generator.wait_for_completion(job["job_id"])

# Step 3: Download video
video_path = generator.download_video(
    video_url=result["video_url"],
    output_dir="my_videos"
)
```

### Image-to-Video (i2v) Generation

```python
# Animate a static image with AI-generated motion
video_path = generator.generate_and_download(
    prompt="Gentle camera zoom with soft lighting, plants swaying",
    image_url="https://your-server.com/starting-image.jpg",
    duration=15,
    resolution="1920x1080"
)
```

**Important**: The `image_url` must be publicly accessible. For local images:
1. Upload to Supabase Storage, Imgur, or similar hosting
2. Get the public URL
3. Pass it to the `image_url` parameter

See `example_image_to_video.py` for complete i2v examples.

### Custom Configuration

```python
generator = SoraVideoGenerator(
    api_key="your-api-key",           # Optional, defaults to env var
    organization="your-org-id",       # Optional
    default_model="sora-2-pro",       # 'sora-2' or 'sora-2-pro'
    max_retries=3,                    # Retry attempts
    poll_interval=5                   # Initial polling interval
)
```

## 🎬 Model Specifications

### Sora 2
- **Max Duration**: 20 seconds
- **Use Case**: Fast prototyping, quick iterations
- **Pricing**: ~$0.10-$0.20 per second
- **Features**: Text-to-video generation

### Sora 2 Pro
- **Max Duration**: 90 seconds
- **Use Case**: High-quality professional content
- **Pricing**: ~$0.20-$0.50 per second
- **Features**: Text-to-video with **synced audio generation**

## 📐 Supported Resolutions

- `1280x720` (720p HD) - Default, fastest
- `1920x1080` (1080p Full HD) - Recommended
- `2560x1440` (1440p 2K) - High quality
- `3840x2160` (2160p 4K) - Pro tier only

## 💰 Pricing Estimate

| Model | Resolution | Duration | Est. Cost |
|-------|-----------|----------|-----------|
| Sora 2 | 1280x720 | 10s | $1-2 |
| Sora 2 | 1920x1080 | 20s | $3-4 |
| Sora 2 Pro | 1920x1080 | 30s | $6-15 |
| Sora 2 Pro | 3840x2160 | 60s | $12-30 |

*Actual costs may vary. Check OpenAI pricing page for current rates.*

## 🔧 API Features

### Automatic Status Polling
The generator automatically polls job status with exponential backoff:
- Initial interval: 5 seconds
- Max interval: 30 seconds
- Default timeout: 10 minutes

### Error Handling
- Retries transient failures (network issues, rate limits)
- Distinguishes client errors (non-retryable) from server errors
- Comprehensive error messages with troubleshooting hints

### Streaming Downloads
Large videos are downloaded in chunks to minimize memory usage.

## 📝 Prompt Guidelines

**Best Practices**:
- Keep prompts under 500 characters
- Be specific about visual details, camera movements, lighting
- Mention desired atmosphere and mood
- For Sora 2 Pro, you can reference audio elements (they'll be generated)

**Example Good Prompts**:
```python
# Detailed scene description
"A serene therapy room with soft natural lighting streaming through
large windows. Two comfortable chairs face each other, surrounded by
lush indoor plants. Gentle camera pan revealing the peaceful space."

# Action and movement
"Time-lapse of a sunrise over mountain peaks, clouds moving swiftly,
golden light gradually illuminating a tranquil valley below."

# Emotional tone
"A cozy coffee shop on a rainy day, warm interior lighting, people
chatting softly, raindrops visible on windows, creating a peaceful
and inviting atmosphere."
```

**Example Image-to-Video Prompts**:
```python
# Animate a static therapy room photo
"Gentle camera zoom into the room, soft sunlight gradually brightening,
plants swaying from a subtle breeze, creating warmth and invitation"

# Animate a landscape for meditation background
"Slow motion ripple effects spreading across the water surface,
clouds drifting peacefully, colors shifting from cool to warm tones"

# Animate a wellness space
"Camera panning smoothly across the zen garden, gentle water flowing,
bamboo leaves rustling, peaceful morning atmosphere"
```

## 🛠️ Troubleshooting

### API Key Not Found
```
ValueError: OpenAI API key not found
```
**Solution**: Ensure `OPENAI_API_KEY` is set in `.env` file

### Access Denied (403)
```
OpenAIError: You do not have access to the Sora API
```
**Solution**: Sora API requires explicit invitation. Request access through OpenAI's developer portal.

### Job Timeout
```
TimeoutError: Job did not complete within 600 seconds
```
**Solution**: Increase `max_wait_time` parameter or check OpenAI status page for service issues.

### Invalid Resolution
```
ValueError: Invalid resolution
```
**Solution**: Use one of the supported resolutions: `1280x720`, `1920x1080`, `2560x1440`, `3840x2160`

### Rate Limit Exceeded
```
OpenAIError: Rate limit exceeded
```
**Solution**: Wait and retry. Preview access typically limited to 50 requests/minute.

### Image URL Not Accessible
```
OpenAIError: Unable to access image_url
```
**Solution**:
- Ensure the image URL is publicly accessible (no authentication required)
- Verify the URL returns the actual image file (not an HTML page)
- For local images, upload to Supabase Storage, Imgur, or similar hosting first
- Test the URL by pasting it in a browser - it should display the image directly

### Image Dimensions Mismatch
```
ValueError: Image dimensions don't match video resolution
```
**Solution**: Ensure your input image aspect ratio matches the requested video resolution. For example, use 16:9 aspect ratio images for 1920x1080 video output.

## 🔐 Security Notes

- **Never commit** `.env` file to version control
- API keys are loaded from environment variables
- Use organization ID for team billing tracking
- Monitor usage via OpenAI dashboard

## 📊 Integration with Terapie Acasa

Potential use cases for the platform:

1. **Therapy Session Intros**: Generate calming intro videos for video sessions
2. **Wellness Content**: Create guided meditation or breathing exercise backgrounds
3. **Marketing**: Generate promotional content showcasing therapy environments
4. **Educational**: Create visual aids for therapy techniques or mental health topics

Example integration:

```python
from video_generation import SoraVideoGenerator

def generate_session_intro(therapist_name, therapy_type):
    generator = SoraVideoGenerator()

    prompt = f"""
    A peaceful and professional therapy room with soft lighting.
    Text overlay gently appears: 'Welcome to your session with {therapist_name}'.
    Calming colors, plants, and comfortable seating visible.
    Professional yet warm atmosphere for {therapy_type} therapy.
    """

    return generator.generate_and_download(
        prompt=prompt,
        duration=10,
        resolution="1920x1080",
        output_dir="session_intros"
    )
```

## 📚 Additional Resources

- [OpenAI Sora Documentation](https://platform.openai.com/docs/guides/video-generation)
- [OpenAI Sora 2 Models](https://platform.openai.com/docs/models/sora-2)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Sora Pricing](https://openai.com/pricing)

## 🤝 Support

For issues or questions:
1. Check OpenAI's [status page](https://status.openai.com/)
2. Review [API documentation](https://platform.openai.com/docs)
3. Contact OpenAI support for API access issues

## 📄 License

This implementation follows OpenAI's terms of service. Generated videos are subject to OpenAI's usage policies.

---

**Status**: Ready for production use ✅
**Last Updated**: November 2025
**Minimum OpenAI SDK**: v1.51.0
