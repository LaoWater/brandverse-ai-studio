# Content Generator API Payload Documentation

## Overview
This document describes the complete structure of the payload sent to the content generation API endpoint: `/generate-posts-enhanced`

## Complete Payload Structure

```typescript
{
  company: {
    id: string;              // Unique company identifier
    name: string;            // Company name
    mission: string;         // Company mission statement
    tone_of_voice: string;   // Default brand tone of voice
    primary_color_1: string; // Primary brand color (hex)
    primary_color_2: string; // Secondary brand color (hex)
    logo_path?: string;      // URL to company logo
  };

  content: {
    topic: string;           // Main topic/subject of the content
    description: string;     // Additional context or tone for this specific post
    hashtags: string[];      // Array of hashtags to include
    call_to_action: string;  // Call to action text
  };

  image_control: {
    level_1?: {              // General settings (applies to ALL platforms)
      enabled: boolean;      // Whether Level 1 is active
      style: string;         // Image style (e.g., "photorealistic", "minimalist")
      guidance: string;      // Visual guidance text
      caption: string;       // Text overlay (currently disabled)
      ratio: string;         // Aspect ratio (e.g., "auto", "square", "landscape")
      startingImage: File | null;     // Base image file
      starting_image_url?: string;    // Uploaded image URL
    };

    level_2?: {              // Platform-specific overrides
      [platform: string]: {  // Platform ID (e.g., "instagram", "linkedin")
        enabled: boolean;    // Whether this platform override is active
        style: string;       // Platform-specific image style
        guidance: string;    // Platform-specific visual guidance
        caption: string;     // Platform-specific text overlay (currently disabled)
        ratio: string;       // Platform-specific aspect ratio
        startingImage: File | null;     // Platform-specific base image
        starting_image_url?: string;    // Platform-specific uploaded image URL
      };
    };
  };

  platforms: [
    {
      platform: string;      // Platform ID (e.g., "instagram", "linkedin", "twitter", "facebook")
      post_type: string;     // Type of post: "Text", "Image", or "Video"
      selected: boolean;     // Always true for included platforms
    }
  ];
}
```

## Image Control Hierarchy

### Level 1 (General Settings)
- **Purpose**: Baseline image generation settings applied to all platforms
- **When Applied**: When `level_1.enabled = true`
- **Scope**: All selected platforms, unless overridden by Level 2

### Level 2 (Platform-Specific Settings)
- **Purpose**: Platform-specific overrides for tailored image generation
- **When Applied**: When `level_2[platform].enabled = true` for a specific platform
- **Scope**: Only the specific platform
- **Priority**: **OVERRIDES Level 1 completely** for that platform

### Resolution Logic (Backend Should Implement)
```
For each selected platform:
  1. Check if level_2[platform].enabled exists and is true
     → YES: Use level_2[platform] settings exclusively
     → NO: Continue to step 2

  2. Check if level_1.enabled is true
     → YES: Use level_1 settings
     → NO: Use AI default generation (no image control)
```

## Example Payloads

### Example 1: Only General Image Control
```json
{
  "company": {
    "id": "comp-123",
    "name": "TechCorp",
    "mission": "Innovation for everyone",
    "tone_of_voice": "Professional yet approachable",
    "primary_color_1": "#1E40AF",
    "primary_color_2": "#60A5FA",
    "logo_path": "https://storage.example.com/logo.png"
  },
  "content": {
    "topic": "New Product Launch",
    "description": "Inspirational",
    "hashtags": [],
    "call_to_action": ""
  },
  "image_control": {
    "level_1": {
      "enabled": true,
      "style": "modern",
      "guidance": "Clean, professional technology imagery with blue accents",
      "caption": "",
      "ratio": "auto",
      "startingImage": null,
      "starting_image_url": null
    }
  },
  "platforms": [
    {
      "platform": "instagram",
      "post_type": "Image",
      "selected": true
    },
    {
      "platform": "linkedin",
      "post_type": "Image",
      "selected": true
    }
  ]
}
```
**Result**: Both Instagram and LinkedIn will use the modern, professional style with blue accents.

---

### Example 2: Platform-Specific Override
```json
{
  "company": {
    "id": "comp-123",
    "name": "TechCorp",
    "mission": "Innovation for everyone",
    "tone_of_voice": "Professional yet approachable",
    "primary_color_1": "#1E40AF",
    "primary_color_2": "#60A5FA"
  },
  "content": {
    "topic": "Team Building Event",
    "description": "Casual & Friendly",
    "hashtags": [],
    "call_to_action": ""
  },
  "image_control": {
    "level_1": {
      "enabled": true,
      "style": "corporate",
      "guidance": "Professional office environment",
      "caption": "",
      "ratio": "auto",
      "startingImage": null
    },
    "level_2": {
      "instagram": {
        "enabled": true,
        "style": "vibrant",
        "guidance": "Colorful, energetic team photos with casual atmosphere",
        "caption": "",
        "ratio": "square",
        "startingImage": null
      }
    }
  },
  "platforms": [
    {
      "platform": "instagram",
      "post_type": "Image",
      "selected": true
    },
    {
      "platform": "linkedin",
      "post_type": "Image",
      "selected": true
    }
  ]
}
```
**Result**:
- Instagram: Vibrant, colorful, energetic (1:1 square) - using Level 2
- LinkedIn: Corporate, professional office environment (auto ratio) - using Level 1

---

### Example 3: Mixed Platform Types
```json
{
  "company": {
    "id": "comp-456",
    "name": "Creative Studio",
    "mission": "Art meets technology",
    "tone_of_voice": "Creative and bold",
    "primary_color_1": "#EC4899",
    "primary_color_2": "#8B5CF6"
  },
  "content": {
    "topic": "Portfolio Showcase",
    "description": "Artistic",
    "hashtags": [],
    "call_to_action": ""
  },
  "image_control": {
    "level_1": {
      "enabled": true,
      "style": "artistic",
      "guidance": "Bold colors, creative composition, abstract elements",
      "caption": "",
      "ratio": "auto",
      "startingImage": null
    }
  },
  "platforms": [
    {
      "platform": "instagram",
      "post_type": "Image",
      "selected": true
    },
    {
      "platform": "twitter",
      "post_type": "Text",
      "selected": true
    },
    {
      "platform": "linkedin",
      "post_type": "Image",
      "selected": true
    }
  ]
}
```
**Result**:
- Instagram: Image with artistic style, bold colors
- Twitter: Text only (no image generation)
- LinkedIn: Image with artistic style, bold colors

---

## Field Descriptions

### Company Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier from database |
| `name` | string | Yes | Display name of the company |
| `mission` | string | No | Used to align content with brand values |
| `tone_of_voice` | string | No | Default brand communication style |
| `primary_color_1` | string | Yes | Primary brand color (hex format) |
| `primary_color_2` | string | Yes | Secondary brand color (hex format) |
| `logo_path` | string | No | URL to company logo for potential inclusion |

### Content Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `topic` | string | Yes | Main subject of the content |
| `description` | string | Yes | Additional context or specific tone override |
| `hashtags` | string[] | No | Hashtags to include (currently empty array) |
| `call_to_action` | string | No | CTA text (currently empty string) |

### Image Control Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | boolean | Yes | Whether this level of control is active |
| `style` | string | No | Image style preset (photorealistic, minimalist, artistic, etc.) |
| `guidance` | string | No | Free-form visual guidance text |
| `caption` | string | No | **DISABLED** - Text overlay functionality |
| `ratio` | string | No | Aspect ratio (auto, square, landscape, portrait, story, cover) |
| `startingImage` | File \| null | No | Base image to modify/enhance |
| `starting_image_url` | string | No | URL after uploading startingImage |

### Platform Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | string | Yes | Platform identifier: "instagram", "linkedin", "twitter", "facebook" |
| `post_type` | string | Yes | Content type: "Text", "Image", or "Video" |
| `selected` | boolean | Yes | Always `true` for included platforms |

---

## Image Style Options
- `photorealistic` - Realistic photographic imagery
- `minimalist` - Clean, simple design
- `artistic` - Creative, expressive visuals
- `corporate` - Professional business imagery
- `vibrant` - Colorful, energetic
- `monochrome` - Black and white or single color
- `modern` - Contemporary, sleek design
- `vintage` - Retro, nostalgic aesthetic

## Aspect Ratio Options
- `auto` - Platform-optimized (AI decides based on platform best practices)
- `square` - 1:1 (Instagram posts, LinkedIn posts)
- `landscape` - 16:9 (Twitter, Facebook, LinkedIn)
- `portrait` - 9:16 (Instagram stories, vertical video)
- `story` - 9:16 (Optimized for story formats)
- `cover` - 16:9 (Cover images, banners)

---

## Backend Implementation Notes

### Image Control Resolution Algorithm
The backend should implement the following logic when processing image generation:

```python
def resolve_image_control(platform_id, payload):
    """
    Resolve image control settings for a specific platform.
    Level 2 (platform-specific) overrides Level 1 (general).
    """
    image_control = payload.get('image_control', {})

    # Check for platform-specific override (Level 2)
    level_2 = image_control.get('level_2', {})
    if platform_id in level_2 and level_2[platform_id].get('enabled'):
        return level_2[platform_id]

    # Fall back to general settings (Level 1)
    level_1 = image_control.get('level_1', {})
    if level_1.get('enabled'):
        return level_1

    # No image control - use AI defaults
    return None
```

### Important Considerations

1. **Caption/Text Overlay Status**:
   - Currently **DISABLED** in the UI
   - Field is greyed out with advisory message
   - Backend should ignore `caption` field until further notice
   - Feature pending visual model improvements

2. **Starting Image Handling**:
   - Files are uploaded to Supabase storage before API call
   - Frontend sends `starting_image_url` in payload (not the File object)
   - Backend should fetch image from URL if provided

3. **Platform Post Types**:
   - Text: Generate only text content
   - Image: Generate text + image
   - Video: **COMING SOON** - currently disabled in UI

4. **Credit System**:
   - Text posts: 1 credit
   - Image posts: 3 credits
   - Video posts: 3 credits (when available)

---

## Version History
- **v1.0** (2025-10-02): Initial documentation with full payload structure and examples
