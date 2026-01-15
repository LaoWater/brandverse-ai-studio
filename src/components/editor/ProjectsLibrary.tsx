import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Film, Trash2, Copy, Archive, MoreVertical, Clock, Layers, Play, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import {
  getUserProjects,
  deleteProject,
  archiveProject,
  duplicateProject,
  EditorProject,
} from '@/services/editorProjectService';

// Project thumbnail component with video preview
interface ProjectThumbnailProps {
  videoUrl?: string;
  duration: number;
  status: string;
  formatDuration: (seconds: number) => string;
}

const ProjectThumbnail = ({ videoUrl, duration, status, formatDuration }: ProjectThumbnailProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Play/pause on hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      if (videoRef.current.readyState > 0) {
        videoRef.current.currentTime = 0;
      }
    }
  };

  return (
    <div
      className="aspect-video bg-gradient-to-br from-gray-700 to-gray-900 relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fallback icon - always behind */}
      {!videoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Film className="w-12 h-12 text-gray-600" />
        </div>
      )}

      {/* Video preview from first clip */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          muted
          playsInline
          preload="metadata"
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            videoLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoadedData={() => setVideoLoaded(true)}
        />
      )}

      {/* Play icon when not hovered */}
      {!isHovered && videoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="w-10 h-10 text-white/80" />
        </div>
      )}

      {/* Hover overlay with button */}
      <div className={cn(
        'absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity',
        isHovered ? 'opacity-100' : 'opacity-0'
      )}>
        <Button size="lg" className="cosmic-button">
          <Play className="w-5 h-5 mr-2" />
          Open Project
        </Button>
      </div>

      {/* Status badge */}
      {status === 'exported' && (
        <div className="absolute top-2 left-2 bg-green-600/90 text-white text-xs px-2 py-1 rounded z-10">
          Exported
        </div>
      )}

      {/* Duration badge */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
        {formatDuration(duration)}
      </div>
    </div>
  );
};

interface ProjectsLibraryProps {
  onOpenProject: (projectId: string) => void;
  onCreateNew: () => void;
}

export const ProjectsLibrary = ({ onOpenProject, onCreateNew }: ProjectsLibraryProps) => {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<EditorProject | null>(null);

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['editorProjects', user?.id, selectedCompany?.id],
    queryFn: async () => {
      if (!user) return [];
      return getUserProjects(user.id, selectedCompany?.id || null);
    },
    enabled: !!user,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return deleteProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorProjects'] });
      toast({
        title: 'Project Deleted',
        description: 'The project has been permanently deleted.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete project.',
        variant: 'destructive',
      });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return archiveProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorProjects'] });
      toast({
        title: 'Project Archived',
        description: 'The project has been archived.',
      });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (project: EditorProject) => {
      if (!user) return null;
      return duplicateProject(project.id, user.id);
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['editorProjects'] });
      if (newProject) {
        toast({
          title: 'Project Duplicated',
          description: `Created "${newProject.name}"`,
        });
      }
    },
  });

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDelete = (project: EditorProject) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete.id);
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Projects</h2>
          <p className="text-gray-400">
            {projects?.length || 0} project{projects?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={onCreateNew} className="cosmic-button force-text-white">
          <Film className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : !projects || projects.length === 0 ? (
        <Card className="cosmic-card border-0 p-12 text-center">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
          <p className="text-gray-400 mb-6">
            Start editing videos and your projects will appear here.
          </p>
          <Button onClick={onCreateNew} className="cosmic-button force-text-white">
            Create Your First Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => {
            // Get first clip's video URL for preview
            const firstClipUrl = project.project_data?.clips?.[0]?.sourceUrl;

            return (
            <Card
              key={project.id}
              className="cosmic-card border-0 overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => onOpenProject(project.id)}
            >
              {/* Thumbnail - using video from first clip */}
              <ProjectThumbnail
                videoUrl={firstClipUrl}
                duration={project.total_duration}
                status={project.status}
                formatDuration={formatDuration}
              />

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {project.clip_count} clips
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => onOpenProject(project.id)}>
                        <Play className="w-4 h-4 mr-2" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateMutation.mutate(project)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => archiveMutation.mutate(project.id)}>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(project)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectsLibrary;
