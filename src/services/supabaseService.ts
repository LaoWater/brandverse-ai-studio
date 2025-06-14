// Example: services/postService.ts or similar
import { supabase } from '@/integrations/supabase/client'; // Your Supabase client

interface SupabasePostInput {
  company_id: string;
  title: string;
  platform_type: string; // Should match your Supabase enum values
  has_picture?: string | null;
  has_video?: string | null;
  details?: string | object | null; // string if you stringify before, object if Supabase client handles it
  status?: string; // e.g., 'draft'
  metadata?: object | null; // For the new JSONB column

}

export const saveGeneratedPostsToSupabase = async (posts: SupabasePostInput[]) => {
  if (!posts || posts.length === 0) {
    console.log("No posts to save.");
    return { data: [], error: null };
  }

  try {
    // Ensure 'details' is a stringified JSON if your column is TEXT,
    // or pass as an object if your column is JSON/JSONB and client handles stringification.
    const postsWithJsonDetails = posts.map(post => ({
      ...post,
      details: typeof post.details === 'object' ? JSON.stringify(post.details) : post.details,
    }));

    const { data, error } = await supabase
      .from('posts')
      .insert(postsWithJsonDetails)
      .select(); // Important: .select() returns the inserted rows

    if (error) {
      console.error('Error inserting posts into Supabase:', error);
      throw error;
    }

    console.log('Posts successfully inserted into Supabase:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Supabase insert operation failed:', error);
    return { data: null, error };
  }
};