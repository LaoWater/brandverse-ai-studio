
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

export const calculateCreditsNeeded = (platforms: string[], platformMedia: Record<string, string>): number => {
  let totalCredits = 0;
  
  platforms.forEach(platform => {
    const mediaType = platformMedia[platform];
    if (mediaType === 'text') {
      totalCredits += 1;
    } else if (mediaType === 'image' || mediaType === 'video' || mediaType === 'auto') {
      totalCredits += 3;
    }
  });
  
  return totalCredits;
};
