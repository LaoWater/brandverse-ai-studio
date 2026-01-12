
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
 * Credit Pricing Constants
 *
 * Base: 1 credit = $0.01
 * All API costs include 15% margin
 *
 * Foundation:
 * - 1 text post = 1 credit
 * - 1 low quality/fast image = 2 credits
 */

// Image generation credits per model and quality
export const IMAGE_CREDITS = {
  // GPT-Image-1.5: Low=$0.018, Medium=$0.05, High=$0.20
  'gpt-image-1.5': {
    '1K': 2,   // Low quality
    '2K': 6,   // Medium quality
    '4K': 23,  // High quality
  },
  // Imagen 4.0: Fast=$0.02, Standard=$0.04, Ultra=$0.06
  'imagen-4.0-generate-001': {
    '1K': 2,   // Fast
    '2K': 5,   // Standard
    '4K': 7,   // Ultra
  },
  // Gemini 2.5 Flash (Nano-Banana): ~$0.04
  'gemini-2.5-flash-image': {
    '1K': 5,
    '2K': 5,
    '4K': 5,
  },
  // Gemini 3 Pro: Higher quality tiers
  'gemini-3-pro-image-preview': {
    '1K': 5,
    '2K': 6,
    '4K': 8,
  },
} as const;

// Video generation credits per second by model
export const VIDEO_CREDITS_PER_SECOND = {
  // Veo 3.1 Standard: $0.40/sec
  'veo-3.1-generate-001': 46,
  // Veo 3.1 Fast: $0.15/sec
  'veo-3.1-fast-generate-001': 17,
  // Sora 2: $0.10/sec
  'sora-2': 12,
  // Sora 2 Pro: $0.30/sec
  'sora-2-pro': 35,
  // Sora 2 Pro Higher Res: $0.50/sec
  'sora-2-pro-hr': 58,
} as const;

/**
 * Calculate credits needed for Media Studio generation
 * Based on model, quality/size, number of images, and media type
 */
export const calculateMediaStudioCredits = (
  model: string,
  imageSize: '1K' | '2K' | '4K' = '1K',
  numberOfImages: number = 1,
  mediaType: 'image' | 'video' = 'image',
  videoDuration: 4 | 6 | 8 = 8
): number => {
  // Handle video generation costs
  if (mediaType === 'video') {
    const creditsPerSecond = VIDEO_CREDITS_PER_SECOND[model as keyof typeof VIDEO_CREDITS_PER_SECOND]
      || VIDEO_CREDITS_PER_SECOND['veo-3.1-generate-001'];
    return creditsPerSecond * videoDuration;
  }

  // Handle image generation costs
  const modelCredits = IMAGE_CREDITS[model as keyof typeof IMAGE_CREDITS];
  if (modelCredits) {
    return modelCredits[imageSize] * numberOfImages;
  }

  // Fallback - use Imagen pricing as default
  return IMAGE_CREDITS['imagen-4.0-generate-001'][imageSize] * numberOfImages;
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
