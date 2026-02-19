
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
// Base: 1 credit = $0.01, with 25% markup on API costs
export const VIDEO_CREDITS_PER_SECOND = {
  // Veo 3.1 Standard: $0.40/sec × 1.25 = $0.50 → 50 credits/sec
  'veo-3.1-generate-001': 50,
  // Veo 3.1 Fast: $0.15/sec × 1.25 = $0.1875 → 19 credits/sec
  'veo-3.1-fast-generate-001': 19,
  // Sora 2 (720p only): $0.10/sec × 1.25 = $0.125 → 13 credits/sec
  'sora-2': 13,
  // Sora 2 Pro at 720p: $0.30/sec × 1.25 = $0.375 → 38 credits/sec
  'sora-2-pro': 38,
  // Sora 2 Pro at 1080p: $0.50/sec × 1.25 = $0.625 → 63 credits/sec
  'sora-2-pro-1080p': 63,
} as const;

/**
 * Calculate credits needed for Media Studio generation
 * Based on model, quality/size, number of images, and media type
 *
 * @param model - The AI model to use
 * @param imageSize - Size/quality for images (1K, 2K, 4K)
 * @param numberOfImages - Number of images to generate
 * @param mediaType - 'image' or 'video'
 * @param videoDuration - Duration in seconds (4-8 for Veo, 4/8/12 for Sora)
 * @param soraResolution - Optional Sora resolution for Pro pricing (720p vs 1080p)
 */
export const calculateMediaStudioCredits = (
  model: string,
  imageSize: '1K' | '2K' | '4K' = '1K',
  numberOfImages: number = 1,
  mediaType: 'image' | 'video' = 'image',
  videoDuration: number = 8,
  soraResolution?: string
): number => {
  // Handle video generation costs
  if (mediaType === 'video') {
    let creditsPerSecond: number;

    // Special handling for Sora 2 Pro resolution-based pricing
    if (model === 'sora-2-pro' && soraResolution) {
      // Check if using 1080p resolution (1792x1024 or 1024x1792)
      const is1080p = soraResolution === '1792x1024' || soraResolution === '1024x1792';
      creditsPerSecond = is1080p
        ? VIDEO_CREDITS_PER_SECOND['sora-2-pro-1080p']
        : VIDEO_CREDITS_PER_SECOND['sora-2-pro'];
    } else {
      creditsPerSecond = VIDEO_CREDITS_PER_SECOND[model as keyof typeof VIDEO_CREDITS_PER_SECOND]
        || VIDEO_CREDITS_PER_SECOND['veo-3.1-generate-001'];
    }

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

/**
 * SEO Agent Credit Costs
 */
export const SEO_CREDITS = {
  ANALYSIS: 5,        // Real website crawl + Serper search + LLM analysis
  BLOG_POST: 1,       // Generate SEO-optimized blog post
  ENGAGEMENT: 3,      // Real engagement search via Serper + LLM response crafting
} as const;

export const POST_FROM_MEDIA_CREDITS = {
  AI_GENERATED_TEXT: 2,  // Per platform, AI writes the post text
  MANUAL_TEXT: 0,        // User writes their own text
} as const;

export type SeoAction = 'analysis' | 'blog' | 'engagement';

export const getSeoCredits = (action: SeoAction): number => {
  switch (action) {
    case 'analysis':
      return SEO_CREDITS.ANALYSIS;
    case 'blog':
      return SEO_CREDITS.BLOG_POST;
    case 'engagement':
      return SEO_CREDITS.ENGAGEMENT;
    default:
      return 0;
  }
};
