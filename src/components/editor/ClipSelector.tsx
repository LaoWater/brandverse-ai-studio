import { useState, useCallback, useRef, useEffect } from 'react';
import { Check, Film, X, Play, Volume2, VolumeX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { getUserMediaLibrary, MediaFile } from '@/services/mediaStudioService';

// Video thumbnail card with hover preview
interface VideoThumbnailCardProps {
  video: MediaFile;
  isSelected: boolean;
  onToggle: () => void;
  formatDuration: (seconds: number | null) => string;
}

const VideoThumbnailCard = ({ video, isSelected, onToggle, formatDuration }: VideoThumbnailCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Play video on hover
  useEffect(() => {
    if (!videoRef.current) return;

    if (isHovering && !hasError) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setHasError(true));
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovering, hasError]);

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[0.98]'
          : 'hover:ring-1 hover:ring-white/30'
      }`}
    >
      {/* Video element - always rendered for preview */}
      <video
        ref={videoRef}
        src={video.public_url}
        className="w-full h-full object-cover"
        muted={isMuted}
        loop
        playsInline
        crossOrigin="anonymous"
        poster={video.thumbnail_url || undefined}
        onError={() => setHasError(true)}
      />

      {/* Fallback if video fails */}
      {hasError && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Film className="w-8 h-8 text-gray-500" />
        </div>
      )}

      {/* Play icon when not hovering */}
      {!isHovering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="w-10 h-10 text-white/80" />
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* Mute button - visible on hover */}
      {isHovering && !hasError && (
        <button
          onClick={handleMuteToggle}
          className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      )}

      {/* Duration badge */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
        {formatDuration(video.duration)}
      </div>

      {/* Selection checkbox */}
      <div
        className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          isSelected
            ? 'bg-primary border-primary'
            : 'border-white/50 bg-black/30'
        }`}
      >
        {isSelected && <Check className="w-4 h-4 text-white" />}
      </div>

      {/* Prompt preview */}
      <div className="absolute bottom-2 right-2 left-10">
        <p className="text-xs text-white/70 truncate">
          {video.prompt || video.file_name}
        </p>
      </div>
    </div>
  );
};

interface ClipSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (clips: MediaFile[]) => void;
}

export const ClipSelector = ({ open, onClose, onSelect }: ClipSelectorProps) => {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch videos from library
  const { data: videos, isLoading } = useQuery({
    queryKey: ['mediaLibrary', user?.id, selectedCompany?.id, 'videos'],
    queryFn: async () => {
      if (!user) return [];
      const media = await getUserMediaLibrary(user.id, selectedCompany?.id || null, {
        fileType: 'video',
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      return media;
    },
    enabled: !!user && open,
  });

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle add to timeline
  const handleAdd = useCallback(() => {
    if (!videos) return;
    const selected = videos.filter(v => selectedIds.has(v.id));
    onSelect(selected);
    setSelectedIds(new Set());
  }, [videos, selectedIds, onSelect]);

  // Handle close
  const handleClose = useCallback(() => {
    setSelectedIds(new Set());
    onClose();
  }, [onClose]);

  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-card/95 backdrop-blur-sm border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-accent" />
            Select Videos from Library
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose videos to add to your timeline. You can select multiple videos.
          </DialogDescription>
        </DialogHeader>

        {/* Video Grid */}
        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !videos || videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Film className="w-12 h-12 mb-3 opacity-50" />
              <p>No videos in your library</p>
              <p className="text-sm mt-1">Generate some videos first in Media Studio</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((video) => {
                const isSelected = selectedIds.has(video.id);
                return (
                  <VideoThumbnailCard
                    key={video.id}
                    video={video}
                    isSelected={isSelected}
                    onToggle={() => toggleSelection(video.id)}
                    formatDuration={formatDuration}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <span className="text-sm text-gray-400">
            {selectedIds.size} video{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="cosmic-button"
              onClick={handleAdd}
              disabled={selectedIds.size === 0}
            >
              Add to Timeline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClipSelector;
