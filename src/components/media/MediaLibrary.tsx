import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, Heart, Grid3x3, Loader2, Upload, X, Trash2, CheckSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import {
  getUserMediaLibrary,
  toggleFavorite,
  deleteMediaFile,
  incrementDownloadCount,
  incrementViewCount,
  updateMediaMetadata,
  MediaFile,
  MediaFilters as Filters,
} from '@/services/mediaStudioService';
import { MediaType } from '@/contexts/MediaStudioContext';
import MediaGrid from './MediaGrid';
import MediaFiltersComponent from './MediaFilters';
import MediaPreviewModal from './MediaPreviewModal';
import MediaEditDialog from './MediaEditDialog';
import ImportVideoDialog from './ImportVideoDialog';
import CreatePostFromMediaModal from './CreatePostFromMediaModal';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 10;

interface MediaLibraryProps {
  onCreateNew: () => void;
  isStudioContext?: boolean; // Determines if this is Studio (show all by default) or Post library (show current company only)
  onUseForGeneration?: (media: MediaFile, targetType: MediaType) => void; // Callback when user wants to use image for generation
  onContinueVideo?: (media: MediaFile) => void; // Callback when user wants to continue a video
  onExtendVideo?: (media: MediaFile, gcsUri: string) => void; // Callback when user wants to extend a video (Veo 3.1)
  isContinuingVideo?: boolean; // Whether video continuation is in progress
  continueVideoProgress?: string; // Progress message for video continuation
}

const MediaLibrary = ({
  onCreateNew,
  isStudioContext = true,
  onUseForGeneration,
  onContinueVideo,
  onExtendVideo,
  isContinuingVideo = false,
  continueVideoProgress = '',
}: MediaLibraryProps) => {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos' | 'favorites'>('all');
  const [filters, setFilters] = useState<Filters>({
    fileType: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(isStudioContext); // Default to true for Studio, false for Post
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [createPostMedia, setCreatePostMedia] = useState<MediaFile | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Determine which company ID to use for fetching
  const companyIdToFetch = (isStudioContext && showAllCompanies) ? null : selectedCompany?.id;

  // Fetch media library
  const { data: allMedia = [], isLoading } = useQuery({
    queryKey: ['mediaLibrary', user?.id, companyIdToFetch, filters, showAllCompanies],
    queryFn: () => getUserMediaLibrary(user!.id, companyIdToFetch, filters),
    enabled: !!user?.id,
  });

  // Filter media based on active tab
  const getFilteredMedia = () => {
    let filtered = allMedia;

    switch (activeTab) {
      case 'images':
        filtered = allMedia.filter((m) => m.file_type === 'image');
        break;
      case 'videos':
        filtered = allMedia.filter((m) => m.file_type === 'video');
        break;
      case 'favorites':
        filtered = allMedia.filter((m) => m.is_favorite);
        break;
      default:
        filtered = allMedia;
    }

    return filtered;
  };

  const filteredMedia = getFilteredMedia();

  // Paginated media for display
  const displayedMedia = filteredMedia.slice(0, displayCount);
  const hasMore = displayCount < filteredMedia.length;

  // Reset display count when filters/tab change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [activeTab, filters, showAllCompanies, companyIdToFetch]);

  // Intersection Observer for infinite scroll
  const loadMore = useCallback(() => {
    if (hasMore) {
      setDisplayCount(prev => prev + ITEMS_PER_PAGE);
    }
  }, [hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      toggleFavorite(id, isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });
      toast({
        title: 'Updated',
        description: 'Favorite status updated successfully',
        className: 'bg-primary/90 border-primary text-white',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update favorite status',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (media: MediaFile) =>
      deleteMediaFile(media.id, media.storage_path, media.file_type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });
      toast({
        title: 'Deleted',
        description: 'Media deleted successfully',
        className: 'bg-green-600/90 border-green-600 text-white',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete media',
        variant: 'destructive',
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (mediaIds: string[]) => {
      const mediaToDelete = allMedia.filter((m) => mediaIds.includes(m.id));
      const results = await Promise.all(
        mediaToDelete.map((media) =>
          deleteMediaFile(media.id, media.storage_path, media.file_type)
        )
      );
      const successCount = results.filter((r) => r.success).length;
      return { successCount, totalCount: mediaIds.length };
    },
    onSuccess: ({ successCount, totalCount }) => {
      queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      toast({
        title: 'Deleted',
        description: `Successfully deleted ${successCount} of ${totalCount} items`,
        className: 'bg-green-600/90 border-green-600 text-white',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete some media',
        variant: 'destructive',
      });
    },
  });

  // Update metadata mutation
  const updateMetadataMutation = useMutation({
    mutationFn: async ({ mediaId, updates }: { mediaId: string; updates: Partial<MediaFile> }) => {
      return updateMediaMetadata(mediaId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });
      setIsEditDialogOpen(false);
      toast({
        title: 'Updated',
        description: 'Media details updated successfully',
        className: 'bg-primary/90 border-primary text-white',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update media details',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleToggleFavorite = (id: string, isFavorite: boolean) => {
    favoriteMutation.mutate({ id, isFavorite });
  };

  const handleDelete = (id: string) => {
    const media = allMedia.find((m) => m.id === id);
    if (media) {
      deleteMutation.mutate(media);
    }
  };

  const handleDownload = async (media: MediaFile) => {
    try {
      // Increment download count
      await incrementDownloadCount(media.id);

      // Download file
      const response = await fetch(media.public_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = media.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Invalidate query to update download count
      queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });

      toast({
        title: 'Downloaded',
        description: 'Media downloaded successfully',
        className: 'bg-primary/90 border-primary text-white',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download media',
        variant: 'destructive',
      });
    }
  };

  const handleView = async (media: MediaFile) => {
    setSelectedMedia(media);
    setIsPreviewOpen(true);

    // Increment view count
    await incrementViewCount(media.id);
    queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleEdit = (media: MediaFile) => {
    setSelectedMedia(media);
    setIsEditDialogOpen(true);
  };

  const handleCreatePost = (media: MediaFile) => {
    setCreatePostMedia(media);
    setIsCreatePostOpen(true);
    setIsPreviewOpen(false);
  };

  const handleSaveEdit = async (mediaId: string, updates: Partial<MediaFile>) => {
    await updateMetadataMutation.mutateAsync({ mediaId, updates });
  };

  // Selection handlers
  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedia.map((m) => m.id)));
    }
  };

  const handleCancelSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteMutation.mutate(Array.from(selectedIds));
  };

  // Get counts for tabs
  const counts = {
    all: allMedia.length,
    images: allMedia.filter((m) => m.file_type === 'image').length,
    videos: allMedia.filter((m) => m.file_type === 'video').length,
    favorites: allMedia.filter((m) => m.is_favorite).length,
  };

  return (
    <div className="space-y-6 media-library-scroll">
      {/* Tabs and Company Filter Toggle */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList className="bg-background/50 border border-primary/20 p-1">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger
              value="images"
              className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
            >
              <Image className="w-4 h-4 mr-2" />
              Images ({counts.images})
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
            >
              <Video className="w-4 h-4 mr-2" />
              Videos ({counts.videos})
            </TabsTrigger>
            {/* Import/Upload button - visible on all, images, and videos tabs */}
            {(activeTab === 'all' || activeTab === 'images' || activeTab === 'videos') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImportDialogOpen(true);
                }}
                className="ml-1 p-1.5 rounded-md hover:bg-primary/20 text-gray-400 hover:text-primary transition-colors"
                title="Upload or import media"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
            <TabsTrigger
              value="favorites"
              className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
            >
              <Heart className="w-4 h-4 mr-2" />
              Favorites ({counts.favorites})
            </TabsTrigger>
          </TabsList>

          {/* Company Filter Toggle - Only show in Studio context */}
          {isStudioContext && (
            <button
              onClick={() => setShowAllCompanies(!showAllCompanies)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-primary/30 hover:border-primary/50 bg-background/50 hover:bg-background/70 text-white"
            >
              {showAllCompanies ? 'Show Current Company Only' : 'Show All Companies'}
            </button>
          )}
        </div>

        {/* Filters */}
        <MediaFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          resultsCount={filteredMedia.length}
        />

        {/* Selection Toolbar */}
        <AnimatePresence>
          {isSelectionMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between gap-4 p-4 mb-4 rounded-lg bg-primary/10 border border-primary/30"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm text-white">
                  <strong>{selectedIds.size}</strong> of {filteredMedia.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-primary hover:text-primary hover:bg-primary/20"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  {selectedIds.size === filteredMedia.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending}
                  className="gap-2"
                >
                  {bulkDeleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete ({selectedIds.size})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelSelection}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Select Mode Toggle Button - shown when not in selection mode */}
        {!isSelectionMode && filteredMedia.length > 0 && (
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectionMode(true)}
              className="border-primary/30 text-gray-300 hover:text-white hover:bg-primary/20"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Select
            </Button>
          </div>
        )}

        {/* Content */}
        <TabsContent value={activeTab} className="mt-6 card-enter">
          <MediaGrid
            media={displayedMedia}
            isLoading={isLoading}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onView={handleView}
            onCreateNew={onCreateNew}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
            onCreatePost={handleCreatePost}
          />

          {/* Infinite scroll sentinel & loading indicator */}
          {hasMore && (
            <div
              ref={loadMoreRef}
              className="flex items-center justify-center py-8"
            >
              <div className="flex items-center gap-3 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm">Loading more...</span>
              </div>
            </div>
          )}

          {/* Show count indicator */}
          {filteredMedia.length > 0 && (
            <div className="text-center text-sm text-gray-500 py-4">
              Showing {displayedMedia.length} of {filteredMedia.length} items
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <MediaPreviewModal
        media={selectedMedia}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedMedia(null);
        }}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onEdit={handleEdit}
        onUseForImageGeneration={
          onUseForGeneration
            ? (media) => onUseForGeneration(media, 'image')
            : undefined
        }
        onUseForVideoGeneration={
          onUseForGeneration
            ? (media) => onUseForGeneration(media, 'video')
            : undefined
        }
        onContinueVideo={onContinueVideo}
        onExtendVideo={onExtendVideo}
        onCreatePost={handleCreatePost}
        isContinuingVideo={isContinuingVideo}
        continueVideoProgress={continueVideoProgress}
      />

      {/* Edit Dialog */}
      <MediaEditDialog
        media={selectedMedia}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
        }}
        onSave={handleSaveEdit}
        isSaving={updateMetadataMutation.isPending}
      />

      {/* Import Video Dialog */}
      <ImportVideoDialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });
          toast({
            title: 'Video Imported',
            description: 'Video has been added to your library.',
            className: 'bg-green-600/90 border-green-600 text-white',
          });
        }}
        companyId={selectedCompany?.id}
      />

      {/* Create Post from Media Modal */}
      <CreatePostFromMediaModal
        media={createPostMedia}
        isOpen={isCreatePostOpen}
        onClose={() => {
          setIsCreatePostOpen(false);
          setCreatePostMedia(null);
        }}
        onPostCreated={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
      />
    </div>
  );
};

export default MediaLibrary;
