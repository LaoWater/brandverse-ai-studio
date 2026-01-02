
import { supabase } from '@/integrations/supabase/client';

export interface UserCredits {
  id: string;
  user_id: string;
  available_credits: number;
  updated_at: string;
  created_at: string;
}

export const getUserCredits = async (): Promise<UserCredits | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('available_credits')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user credits:', error);
    return null;
  }

  return data;
};

export const deductCredits = async (creditsToDeduct: number): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc('deduct_credits', {
    _user_id: user.id,
    _credits_to_deduct: creditsToDeduct
  });

  if (error) {
    console.error('Error deducting credits:', error);
    return false;
  }

  return data;
};

export const calculateCreditsNeeded = (
  platforms: string[],
  platformMedia: Record<string, string>,
  imageQuality?: 'balanced' | 'ultra'
): number => {
  let totalCredits = 0;

  // Base credits per media type
  const TEXT_CREDITS = 1;
  const IMAGE_BASE_CREDITS = 3;

  // Quality multiplier - ultra adds +1 credit per image
  const qualityMultiplier = imageQuality === 'ultra' ? 1 : 0;

  platforms.forEach(platform => {
    const mediaType = platformMedia[platform];
    if (mediaType === 'text') {
      totalCredits += TEXT_CREDITS;
    } else if (mediaType === 'image' || mediaType === 'video' || mediaType === 'auto') {
      totalCredits += IMAGE_BASE_CREDITS + qualityMultiplier;
    }
  });

  return totalCredits;
};

/**
 * Calculate credits needed for Media Studio generation
 * Based on model, quality/size, and number of images
 */
export const calculateMediaStudioCredits = (
  model: string,
  imageSize: '1K' | '2K' | '4K' = '1K',
  numberOfImages: number = 1
): number => {
  let creditsPerImage = 3; // Default

  if (model === 'gemini-2.5-flash-image') {
    creditsPerImage = 2; // Nano Banana Standard: always 2 credits (no quality options)
  } else if (model === 'gemini-3-pro-image-preview') {
    // Nano Banana Pro: varies by quality
    if (imageSize === '4K') {
      creditsPerImage = 8;
    } else if (imageSize === '2K') {
      creditsPerImage = 5;
    } else {
      creditsPerImage = 3; // 1K
    }
  } else if (model === 'imagen-4.0-generate-001') {
    creditsPerImage = imageSize === '2K' ? 4 : 3; // Imagen 4: 1K=3, 2K=4
  } else if (model === 'gpt-image-1.5') {
    creditsPerImage = imageSize === '2K' ? 5 : 3; // GPT: Standard=3, HD=5
  }

  return creditsPerImage * numberOfImages;
};

/**
 * Legacy function for backwards compatibility with quality tiers
 * @deprecated Use calculateMediaStudioCredits with model parameter instead
 */
export const calculateMediaStudioCreditsByTier = (
  qualityTier: 'fast' | 'standard' | 'ultra',
  numberOfImages: number = 1
): number => {
  const CREDIT_COSTS = {
    fast: 2,       // Gemini 2.5 Flash
    standard: 3,   // Imagen 4 Standard
    ultra: 4,      // GPT-image-1.5 or Imagen 4 High
  };

  const creditsPerImage = CREDIT_COSTS[qualityTier];
  return creditsPerImage * numberOfImages;
};
