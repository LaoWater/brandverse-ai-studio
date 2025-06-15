
import { supabase } from '@/integrations/supabase/client';

interface PostData {
  details: string;
  company_id: string;
  title: string;
  platform_type: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';
  has_picture?: string | null;
  has_video?: string | null;
  status?: 'draft' | 'approved' | 'posted';
  metadata?: any;
}

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export const createPosts = async (postsData: PostData[]) => {
  const { data, error } = await supabase
    .from('posts')
    .insert(postsData);

  if (error) {
    console.error('Error creating posts:', error);
    throw error;
  }

  return data;
};

export const getUserPosts = async (companyId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('company_id', companyId)
    .order('created_date', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }

  return data;
};

export const updatePost = async (postId: string, updates: Partial<PostData>) => {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId);

  if (error) {
    console.error('Error updating post:', error);
    throw error;
  }

  return data;
};

export const deletePost = async (postId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    console.error('Error deleting post:', error);
    throw error;
  }

  return data;
};
import { Database } from '@/integrations/supabase/types';
import { PostgrestError } from '@supabase/supabase-js';


export const saveGeneratedPostsToSupabase = async (
  posts: {
    company_id: string;
    created_date?: string | null;
    details?: string | null;
    has_picture?: string | null;
    has_video?: string | null;
    id?: string;
    metadata?: Json | null;
    platform_type: Database["public"]["Enums"]["platform_type"];
    status?: Database["public"]["Enums"]["post_status"] | null;
    title: string;
    updated_at?: string | null;
  }[]
): Promise<{
  data: {
    company_id: string;
    created_date: string | null;
    details: string | null;
    has_picture: string | null;
    has_video: string | null;
    id: string;
    metadata: Json | null;
    platform_type: Database["public"]["Enums"]["platform_type"];
    status: Database["public"]["Enums"]["post_status"] | null;
    title: string;
    updated_at: string | null;
  }[] | null;
  error: PostgrestError | null;
}> => {
  const { data, error } = await supabase
    .from('posts')
    .insert(posts)
    .select();
  return { data, error };
};