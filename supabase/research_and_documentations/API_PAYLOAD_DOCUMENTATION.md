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
    level_1: {               // General settings (applies to ALL platforms) - ALWAYS PRESENT
      enabled: boolean;      // Whether Level 1 is active
      style: string;         // Image style (e.g., "photorealistic", "minimalist")
      guidance: string;      // Visual guidance text
      caption: string;       // Text overlay (currently disabled)
      ratio: string;         // Aspect ratio (e.g., "16:9", "1:1", "9:16", "3:4", "4:3")
      starting_image_url: string | null;    // Uploaded image URL (or null)
    };

    level_2: {               // Platform-specific overrides - ALWAYS PRESENT
      [platform: string]: {  // Platform ID (e.g., "instagram", "linkedin") - includes ALL selected platforms
        enabled: boolean;    // Whether this platform override is active
        style: string;       // Platform-specific image style
        guidance: string;    // Platform-specific visual guidance
        caption: string;     // Platform-specific text overlay (currently disabled)
        ratio: string;       // Platform-specific aspect ratio (16:9, 1:1, 9:16, 3:4, 4:3)
        starting_image_url: string | null;    // Platform-specific uploaded image URL (or null)
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
      "ratio": "16:9",
      "starting_image_url": null
    },
    "level_2": {
      "instagram": {
        "enabled": false,
        "style": "",
        "guidance": "",
        "caption": "",
        "ratio": "16:9",
        "starting_image_url": null
      },
      "linkedin": {
        "enabled": false,
        "style": "",
        "guidance": "",
        "caption": "",
        "ratio": "16:9",
        "starting_image_url": null
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
      "ratio": "16:9",
      "starting_image_url": null
    },
    "level_2": {
      "instagram": {
        "enabled": true,
        "style": "vibrant",
        "guidance": "Colorful, energetic team photos with casual atmosphere",
        "caption": "",
        "ratio": "1:1",
        "starting_image_url": null
      },
      "linkedin": {
        "enabled": false,
        "style": "",
        "guidance": "",
        "caption": "",
        "ratio": "16:9",
        "starting_image_url": null
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
- LinkedIn: Corporate, professional office environment (16:9 ratio) - using Level 1

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
      "ratio": "16:9",
      "starting_image_url": null
    },
    "level_2": {
      "instagram": {
        "enabled": false,
        "style": "",
        "guidance": "",
        "caption": "",
        "ratio": "16:9",
        "starting_image_url": null
      },
      "twitter": {
        "enabled": false,
        "style": "",
        "guidance": "",
        "caption": "",
        "ratio": "16:9",
        "starting_image_url": null
      },
      "linkedin": {
        "enabled": false,
        "style": "",
        "guidance": "",
        "caption": "",
        "ratio": "16:9",
        "starting_image_url": null
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
| `style` | string | Yes | Image style preset (photorealistic, minimalist, artistic, etc.) - empty string if not set |
| `guidance` | string | Yes | Free-form visual guidance text - empty string if not set |
| `caption` | string | Yes | **DISABLED** - Text overlay functionality - empty string if not set |
| `ratio` | string | Yes | Aspect ratio (16:9, 1:1, 9:16, 3:4, 4:3) - **Must be numeric format, default: 16:9** |
| `starting_image_url` | string \| null | Yes | URL to uploaded base image, or null if not provided |

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
**IMPORTANT**: GCP API expects numeric aspect ratios only.

Valid values (ONLY these 5 are supported):
- `16:9` - Landscape/Widescreen (YouTube, Twitter, Facebook, LinkedIn) - **DEFAULT**
- `1:1` - Square (Instagram posts, LinkedIn posts)
- `9:16` - Portrait/Vertical (Instagram Stories, TikTok, Reels)
- `3:4` - Portrait (Traditional)
- `4:3` - Standard (Traditional landscape)

---

## Backend Implementation Notes

### Image Control Resolution Algorithm
The backend should implement the following logic when processing image generation:

```python
def resolve_image_control(platform_id, payload):
    """
    Resolve image control settings for a specific platform.
    Level 2 (platform-specific) overrides Level 1 (general).

    NOTE: image_control.level_1 and image_control.level_2 are ALWAYS present in the payload.
    The 'enabled' flag determines whether settings should be applied.
    """
    image_control = payload.get('image_control', {})

    # Check for platform-specific override (Level 2)
    # Level 2 will include an entry for each selected platform
    level_2 = image_control.get('level_2', {})
    if platform_id in level_2 and level_2[platform_id].get('enabled'):
        return level_2[platform_id]

    # Fall back to general settings (Level 1)
    level_1 = image_control.get('level_1', {})
    if level_1.get('enabled'):
        return level_1

    # No image control enabled - use AI defaults
    return None
```

### Important Considerations

1. **Image Control Structure (CRITICAL)**:
   - `image_control.level_1` and `image_control.level_2` are **ALWAYS PRESENT** in the payload
   - Even when disabled, the structure is included with `enabled: false` and default values
   - `level_2` includes an entry for **EVERY selected platform**, even if platform-specific settings are disabled
   - The backend should check the `enabled` flag to determine whether to apply the settings

2. **Caption/Text Overlay Status**:
   - Currently **DISABLED** in the UI
   - Field is greyed out with advisory message
   - Backend should ignore `caption` field until further notice
   - Feature pending visual model improvements

3. **Starting Image Handling**:
   - Files are uploaded to Supabase storage before API call
   - Frontend sends `starting_image_url` in payload (string | null, not the File object)
   - Backend should fetch image from URL if provided (when not null)

4. **Platform Post Types**:
   - Text: Generate only text content
   - Image: Generate text + image
   - Video: **COMING SOON** - currently disabled in UI

5. **Credit System**:
   - Text posts: 1 credit
   - Image posts: 3 credits
   - Video posts: 3 credits (when available)

---

## Version History
- **v1.0** (2025-10-02): Initial documentation with full payload structure and examples
