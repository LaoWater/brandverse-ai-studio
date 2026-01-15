// ============================================
// EDITOR PROJECT SERVICE
// CRUD operations for video editor projects
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { EditorClip } from '@/types/editor';

/**
 * Project data structure stored in JSONB
 */
export interface ProjectData {
  clips: EditorClip[];
  settings?: {
    aspectRatio?: string;
    resolution?: string;
  };
  version: number; // Schema version for future migrations
}

/**
 * Editor project record from database
 */
export interface EditorProject {
  id: string;
  user_id: string;
  company_id: string | null;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  project_data: ProjectData;
  status: 'draft' | 'exported' | 'archived';
  total_duration: number;
  clip_count: number;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
  exported_media_id: string | null;
}

/**
 * Create a new project
 */
export const createProject = async (
  userId: string,
  companyId: string | null,
  name: string = 'Untitled Project',
  clips: EditorClip[] = []
): Promise<EditorProject | null> => {
  try {
    const projectData: ProjectData = {
      clips,
      version: 1,
    };

    const totalDuration = clips.reduce((sum, clip) => {
      const effectiveDuration = clip.sourceDuration - clip.trimStart - clip.trimEnd;
      return sum + effectiveDuration;
    }, 0);

    // Generate thumbnail from first clip if available
    const thumbnailUrl = clips.length > 0 ? clips[0].thumbnailUrl : null;

    const { data, error } = await supabase
      .from('editor_projects')
      .insert({
        user_id: userId,
        company_id: companyId,
        name,
        project_data: projectData,
        total_duration: totalDuration,
        clip_count: clips.length,
        thumbnail_url: thumbnailUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    return data as EditorProject;
  } catch (error) {
    console.error('Error in createProject:', error);
    return null;
  }
};

/**
 * Update an existing project (for auto-save)
 */
export const updateProject = async (
  projectId: string,
  updates: {
    name?: string;
    description?: string;
    clips?: EditorClip[];
    status?: 'draft' | 'exported' | 'archived';
    thumbnailUrl?: string | null;
  }
): Promise<EditorProject | null> => {
  try {
    const updateData: Record<string, any> = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }

    if (updates.thumbnailUrl !== undefined) {
      updateData.thumbnail_url = updates.thumbnailUrl;
    }

    if (updates.clips !== undefined) {
      const projectData: ProjectData = {
        clips: updates.clips,
        version: 1,
      };

      const totalDuration = updates.clips.reduce((sum, clip) => {
        const effectiveDuration = clip.sourceDuration - clip.trimStart - clip.trimEnd;
        return sum + effectiveDuration;
      }, 0);

      updateData.project_data = projectData;
      updateData.total_duration = totalDuration;
      updateData.clip_count = updates.clips.length;

      // Update thumbnail from first clip if not explicitly set
      if (updates.thumbnailUrl === undefined && updates.clips.length > 0) {
        updateData.thumbnail_url = updates.clips[0].thumbnailUrl;
      }
    }

    const { data, error } = await supabase
      .from('editor_projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return null;
    }

    return data as EditorProject;
  } catch (error) {
    console.error('Error in updateProject:', error);
    return null;
  }
};

/**
 * Get a single project by ID
 */
export const getProject = async (projectId: string): Promise<EditorProject | null> => {
  try {
    const { data, error } = await supabase
      .from('editor_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }

    // Update last_opened_at
    await supabase
      .from('editor_projects')
      .update({ last_opened_at: new Date().toISOString() })
      .eq('id', projectId);

    return data as EditorProject;
  } catch (error) {
    console.error('Error in getProject:', error);
    return null;
  }
};

/**
 * Get all projects for a user
 */
export const getUserProjects = async (
  userId: string,
  companyId?: string | null,
  options?: {
    status?: 'draft' | 'exported' | 'archived' | 'all';
    sortBy?: 'updated_at' | 'created_at' | 'name';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  }
): Promise<EditorProject[]> => {
  try {
    let query = supabase
      .from('editor_projects')
      .select('*')
      .eq('user_id', userId);

    // Filter by company if specified
    if (companyId !== null && companyId !== undefined) {
      query = query.eq('company_id', companyId);
    }

    // Filter by status
    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    } else {
      // By default, exclude archived projects
      query = query.neq('status', 'archived');
    }

    // Sorting
    const sortBy = options?.sortBy || 'updated_at';
    const sortOrder = options?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user projects:', error);
      return [];
    }

    return (data || []) as EditorProject[];
  } catch (error) {
    console.error('Error in getUserProjects:', error);
    return [];
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('editor_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProject:', error);
    return false;
  }
};

/**
 * Archive a project (soft delete)
 */
export const archiveProject = async (projectId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('editor_projects')
      .update({ status: 'archived' })
      .eq('id', projectId);

    if (error) {
      console.error('Error archiving project:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in archiveProject:', error);
    return false;
  }
};

/**
 * Duplicate a project
 */
export const duplicateProject = async (
  projectId: string,
  userId: string,
  newName?: string
): Promise<EditorProject | null> => {
  try {
    const original = await getProject(projectId);
    if (!original) return null;

    const name = newName || `${original.name} (Copy)`;

    return await createProject(
      userId,
      original.company_id,
      name,
      original.project_data.clips
    );
  } catch (error) {
    console.error('Error in duplicateProject:', error);
    return null;
  }
};

/**
 * Mark project as exported and link to media file
 */
export const markProjectExported = async (
  projectId: string,
  mediaFileId?: string
): Promise<boolean> => {
  try {
    const updateData: Record<string, any> = {
      status: 'exported',
    };

    if (mediaFileId) {
      updateData.exported_media_id = mediaFileId;
    }

    const { error } = await supabase
      .from('editor_projects')
      .update(updateData)
      .eq('id', projectId);

    if (error) {
      console.error('Error marking project as exported:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markProjectExported:', error);
    return false;
  }
};
