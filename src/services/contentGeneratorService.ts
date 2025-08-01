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
    level_1?: ImageControlSettings & { enabled: boolean };
    level_2?: Record<string, ImageControlSettings & { enabled: boolean }>;
  };
  platforms: Array<{
    platform: string;
    post_type: string;
    selected: boolean;
  }>;
}

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
  platformSettings: Record<string, { selected: boolean; postType: string }>
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

  // Prepare image control data
  const image_control: ContentGeneratorData['image_control'] = {};
  
  if (imageControlLevel1.enabled) {
    image_control.level_1 = { ...imageControlLevel1, enabled: true };
  }

  // Add level 2 controls for platforms that have image controls enabled
  const level2Controls: Record<string, ImageControlSettings & { enabled: boolean }> = {};
  Object.entries(imageControlLevel2).forEach(([platform, settings]) => {
    if (settings.enabled) {
      level2Controls[platform] = { ...settings, enabled: true };
    }
  });
  
  if (Object.keys(level2Controls).length > 0) {
    image_control.level_2 = level2Controls;
  }

  // Prepare platform data
  const platforms = Object.entries(platformSettings)
    .filter(([_, settings]) => settings.selected)
    .map(([platform, settings]) => ({
      platform,
      post_type: settings.postType,
      selected: true
    }));

  return {
    company,
    content,
    image_control,
    platforms
  };
};