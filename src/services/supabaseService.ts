
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
