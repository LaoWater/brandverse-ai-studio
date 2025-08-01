import { supabase } from "@/integrations/supabase/client";

export interface ImageControlSettings {
  enabled: boolean;
  style: string;
  guidance: string;
  caption: string;
  ratio: string;
  startingImage: File | null;
}

export interface ImageControlData {
  id?: string;
  user_id: string;
  company_id: string;
  level: 1 | 2;
  platform_type?: string;
  enabled: boolean;
  image_style?: string;
  image_ratio?: string;
  visual_guidance?: string;
  caption_guidance?: string;
  starting_image_url?: string;
}

// Save image control settings to database
export const saveImageControlSettings = async (
  userId: string,
  companyId: string,
  level: 1 | 2,
  settings: ImageControlSettings,
  platformType?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const data = {
      user_id: userId,
      company_id: companyId,
      level,
      platform_type: (platformType as any) || null,
      enabled: settings.enabled,
      image_style: settings.style || null,
      image_ratio: settings.ratio || null,
      visual_guidance: settings.guidance || null,
      caption_guidance: settings.caption || null,
      starting_image_url: null // TODO: Implement file upload
    };

    const { error } = await supabase
      .from('image_control')
      .upsert(data, {
        onConflict: 'user_id,company_id,level,platform_type'
      });

    if (error) {
      console.error('Error saving image control settings:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error saving image control settings:', error);
    return { success: false, error: error.message };
  }
};

// Load image control settings from database
export const loadImageControlSettings = async (
  userId: string,
  companyId: string,
  level: 1 | 2,
  platformType?: string
): Promise<ImageControlSettings | null> => {
  try {
    let query = supabase
      .from('image_control')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('level', level);

    if (level === 2 && platformType) {
      query = query.eq('platform_type', platformType as any);
    } else if (level === 1) {
      query = query.is('platform_type', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error loading image control settings:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      enabled: data.enabled,
      style: data.image_style || "",
      guidance: data.visual_guidance || "",
      caption: data.caption_guidance || "",
      ratio: data.image_ratio || "auto",
      startingImage: null // TODO: Load from URL
    };
  } catch (error) {
    console.error('Error loading image control settings:', error);
    return null;
  }
};

// Get all image control settings for a company
export const getAllImageControlSettings = async (
  userId: string,
  companyId: string
): Promise<{ level1?: ImageControlSettings; level2: Record<string, ImageControlSettings> }> => {
  try {
    const { data, error } = await supabase
      .from('image_control')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error loading all image control settings:', error);
      return { level2: {} };
    }

    const result: { level1?: ImageControlSettings; level2: Record<string, ImageControlSettings> } = {
      level2: {}
    };

    data?.forEach(item => {
      const settings: ImageControlSettings = {
        enabled: item.enabled,
        style: item.image_style || "",
        guidance: item.visual_guidance || "",
        caption: item.caption_guidance || "",
        ratio: item.image_ratio || "auto",
        startingImage: null
      };

      if (item.level === 1) {
        result.level1 = settings;
      } else if (item.level === 2 && item.platform_type) {
        result.level2[item.platform_type] = settings;
      }
    });

    return result;
  } catch (error) {
    console.error('Error loading all image control settings:', error);
    return { level2: {} };
  }
};