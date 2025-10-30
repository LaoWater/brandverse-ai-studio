interface Company {
  id: string;
  name: string;
  mission?: string;
  tone_of_voice?: string;
  primary_color_1: string;
  primary_color_2: string;
  logo_path?: string;
  other_info?: any;
}
import { ImageControlSettings } from "./imageControlService";

// Validate and normalize aspect ratio (convert old "auto" values to "16:9")
const normalizeAspectRatio = (ratio: string | null | undefined): string => {
  const validRatios = ["1:1", "9:16", "16:9", "4:3", "3:4"];

  // Convert null/undefined or old "auto" value to default
  if (!ratio || ratio === "auto") {
    return "16:9";
  }

  // Validate it's a supported ratio
  if (validRatios.includes(ratio)) {
    return ratio;
  }

  // If it's an unsupported ratio (like "4:5"), default to "16:9"
  return "16:9";
};

// API payload version of ImageControlSettings (without File object)
export interface ImageControlAPIPayload {
  enabled: boolean;
  style: string;
  guidance: string;
  caption: string;
  ratio: string;
  starting_image_url: string | null;
}

export interface ContentGeneratorData {
  company: {
    id: string;
    name: string;
    mission: string;
    tone_of_voice: string;
    primary_color_1: string;
    primary_color_2: string;
    logo_path?: string;
  };
  content: {
    topic: string;
    description: string;
    hashtags: string[];
    call_to_action: string;
  };
  image_control: {
    level_1: ImageControlAPIPayload;
    level_2: Record<string, ImageControlAPIPayload>;
  };
  platforms: Array<{
    platform: string;
    post_type: string;
    selected: boolean;
  }>;
  language?: string;
  upload_to_cloud?: boolean;
  image_generation_model?: string;
}

/**
 * Prepares the complete API payload for content generation
 *
 * PAYLOAD MERGE LOGIC:
 * - Level 1 (General): Applied to all platforms unless overridden
 * - Level 2 (Platform-specific): Overrides Level 1 for specific platforms when enabled
 *
 * HIERARCHY:
 * 1. If a platform has Level 2 enabled -> Use Level 2 settings exclusively
 * 2. If Level 2 is not enabled for a platform -> Fall back to Level 1 (if enabled)
 * 3. If neither enabled -> AI uses default generation
 *
 * @param selectedCompany - The company for which content is being generated
 * @param contentData - Topic, description, hashtags, and call-to-action
 * @param imageControlLevel1 - General image control settings (applies to all platforms)
 * @param imageControlLevel2 - Platform-specific image controls (overrides Level 1)
 * @param platformSettings - Selected platforms and their post types
 * @returns Complete API payload or null if company not selected
 */
export const prepareAPIPayload = (
  selectedCompany: Company | null,
  contentData: {
    topic: string;
    description: string;
    hashtags: string[];
    callToAction: string;
  },
  imageControlLevel1: ImageControlSettings,
  imageControlLevel2: Record<string, ImageControlSettings>,
  platformSettings: Record<string, { selected: boolean; postType: string }>,
  imageGenerationModel?: string,
  language?: string
): ContentGeneratorData | null => {
  if (!selectedCompany) return null;

  // Prepare company data
  const company = {
    id: selectedCompany.id,
    name: selectedCompany.name,
    mission: selectedCompany.mission || "",
    tone_of_voice: selectedCompany.tone_of_voice || "",
    primary_color_1: selectedCompany.primary_color_1,
    primary_color_2: selectedCompany.primary_color_2,
    logo_path: selectedCompany.logo_path
  };

  // Prepare content data
  const content = {
    topic: contentData.topic,
    description: contentData.description,
    hashtags: contentData.hashtags,
    call_to_action: contentData.callToAction
  };

  // Prepare image control data with proper hierarchy
  // ALWAYS include level_1 and level_2 structure, even when disabled
  const image_control: ContentGeneratorData['image_control'] = {};

  // Level 1: General settings (baseline for all platforms)
  // Always include level_1, with enabled flag indicating if settings should be used
  image_control.level_1 = {
    enabled: imageControlLevel1.enabled || false,
    style: imageControlLevel1.style || "",
    guidance: imageControlLevel1.guidance || "",
    caption: imageControlLevel1.caption || "",
    ratio: normalizeAspectRatio(imageControlLevel1.ratio),
    starting_image_url: imageControlLevel1.starting_image_url || null
  };

  // Level 2: Platform-specific overrides
  // Always include level_2 with entries for all selected platforms
  const level2Controls: Record<string, ImageControlAPIPayload> = {};

  // Get all selected platforms from platformSettings
  const selectedPlatforms = Object.keys(platformSettings).filter(
    platform => platformSettings[platform].selected
  );

  // For each selected platform, include its level_2 settings (enabled or disabled)
  selectedPlatforms.forEach(platform => {
    const platformSettings = imageControlLevel2[platform];
    if (platformSettings) {
      // Platform has custom settings defined
      level2Controls[platform] = {
        enabled: platformSettings.enabled || false,
        style: platformSettings.style || "",
        guidance: platformSettings.guidance || "",
        caption: platformSettings.caption || "",
        ratio: normalizeAspectRatio(platformSettings.ratio),
        starting_image_url: platformSettings.starting_image_url || null
      };
    } else {
      // Platform doesn't have custom settings, include default disabled entry
      level2Controls[platform] = {
        enabled: false,
        style: "",
        guidance: "",
        caption: "",
        ratio: "16:9",
        starting_image_url: null
      };
    }
  });

  image_control.level_2 = level2Controls;

  // Prepare platform data
  const platforms = Object.entries(platformSettings)
    .filter(([_, settings]) => settings.selected)
    .map(([platform, settings]) => ({
      platform,
      post_type: settings.postType,
      selected: true
    }));

  const payload: ContentGeneratorData = {
    company,
    content,
    image_control,
    platforms
  };

  // Add optional fields if specified
  if (language) {
    payload.language = language;
  }

  // Always upload to cloud by default
  payload.upload_to_cloud = true;

  if (imageGenerationModel) {
    payload.image_generation_model = imageGenerationModel;
  }

  return payload;
};