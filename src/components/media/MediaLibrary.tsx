import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, Heart, Grid3x3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import {
  getUserMediaLibrary,
  toggleFavorite,
  deleteMediaFile,
  incrementDownloadCount,
  incrementViewCount,
  MediaFile,
  MediaFilters as Filters,
} from '@/services/mediaStudioService';
import MediaGrid from './MediaGrid';
import MediaFiltersComponent from './MediaFilters';
import MediaPreviewModal from './MediaPreviewModal';

interface MediaLibraryProps {
  onCreateNew: () => void;
}

const MediaLibrary = ({ onCreateNew }: MediaLibraryProps) => {
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

  // Fetch media library
  const { data: allMedia = [], isLoading } = useQuery({
    queryKey: ['mediaLibrary', user?.id, selectedCompany?.id, filters],
    queryFn: () => getUserMediaLibrary(user!.id, selectedCompany?.id, filters),
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

  // Get counts for tabs
  const counts = {
    all: allMedia.length,
    images: allMedia.filter((m) => m.file_type === 'image').length,
    videos: allMedia.filter((m) => m.file_type === 'video').length,
    favorites: allMedia.filter((m) => m.is_favorite).length,
  };

  return (
    <div className="space-y-6 media-library-scroll">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
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
          <TabsTrigger
            value="favorites"
            className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
          >
            <Heart className="w-4 h-4 mr-2" />
            Favorites ({counts.favorites})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <MediaFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          resultsCount={filteredMedia.length}
        />

        {/* Content */}
        <TabsContent value={activeTab} className="mt-6 card-enter">
          <MediaGrid
            media={filteredMedia}
            isLoading={isLoading}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onView={handleView}
            onCreateNew={onCreateNew}
          />
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
      />
    </div>
  );
};

export default MediaLibrary;
