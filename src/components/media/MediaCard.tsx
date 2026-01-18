import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Video,
  Image as ImageIcon,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import { MediaFile } from '@/services/mediaStudioService';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  media: MediaFile;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onDelete: (id: string) => void;
  onDownload: (media: MediaFile) => void;
  onView: (media: MediaFile) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

const MediaCard = ({
  media,
  onToggleFavorite,
  onDelete,
  onDownload,
  onView,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
}: MediaCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  const isVideo = media.file_type === 'video';

  // Intersection Observer to only play videos that are in viewport
  useEffect(() => {
    if (!isVideo || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);

          if (videoRef.current) {
            if (entry.isIntersecting) {
              // Play video when in view
              videoRef.current.play().catch(() => {
                // Ignore autoplay errors
              });
            } else {
              // Pause video when out of view to save resources
              videoRef.current.pause();
            }
          }
        });
      },
      {
        threshold: 0.25, // Trigger when 25% of the card is visible
        rootMargin: '50px', // Start loading slightly before entering viewport
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isVideo]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleCardClick = () => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection(media.id);
    } else {
      onView(media);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative rounded-lg overflow-hidden transition-all duration-300',
        'media-card-gradient cursor-pointer',
        'hover:shadow-2xl hover:shadow-primary/30',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Thumbnail/Preview */}
      <div
        onClick={handleCardClick}
        className="relative aspect-video bg-background/50 overflow-hidden"
      >
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-background via-primary/10 to-background" />
        )}

        {/* Media preview - Always show video for video files, image for image files */}
        {isVideo ? (
          <video
            ref={videoRef}
            src={media.public_url}
            loop
            muted
            playsInline
            preload="metadata"
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              'group-hover:scale-105'
            )}
            onLoadedData={() => setImageLoaded(true)}
          />
        ) : (
          <img
            src={media.public_url}
            alt={media.custom_title || media.prompt.slice(0, 50)}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              'group-hover:scale-110'
            )}
          />
        )}

        {/* Hover overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center"
        >
          <Button
            variant="ghost"
            size="lg"
            className="text-white hover:bg-white/20"
          >
            <Eye className="w-6 h-6 mr-2" />
            View
          </Button>
        </motion.div>

        {/* Video indicator */}
        {isVideo && (
          <div className={cn(
            "absolute top-3 flex items-center gap-2",
            isSelectionMode ? "left-12" : "left-3"
          )}>
            <Badge className="bg-accent/90 text-white border-0 flex items-center gap-1">
              <Video className="w-3 h-3" />
              Video
            </Badge>
            {media.duration && (
              <Badge className="bg-black/60 text-white force-text-white border-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(media.duration)}
              </Badge>
            )}
          </div>
        )}

        {!isVideo && (
          <div className={cn(
            "absolute top-3",
            isSelectionMode ? "left-12" : "left-3"
          )}>
            <Badge className="bg-primary/90 text-white border-0 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              Image
            </Badge>
          </div>
        )}

        {/* Selection checkbox - shown in selection mode */}
        {isSelectionMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection?.(media.id);
            }}
            className={cn(
              'absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
              isSelected
                ? 'bg-primary border-primary text-white'
                : 'bg-black/60 border-white/60 hover:border-primary'
            )}
          >
            {isSelected && <Check className="w-4 h-4" />}
          </motion.button>
        )}

        {/* Favorite button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(media.id, !media.is_favorite);
          }}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors",
            isSelectionMode && "opacity-50"
          )}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              media.is_favorite
                ? 'fill-red-500 text-red-500'
                : 'text-white hover:text-red-400'
            )}
          />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title/Prompt */}
        <div className="space-y-1">
          <h3 className="text-white font-semibold line-clamp-2 leading-snug">
            {media.custom_title || media.prompt}
          </h3>
          {media.custom_title && (
            <p className="text-xs text-gray-400 line-clamp-1">{media.prompt}</p>
          )}
        </div>

        {/* Model & Date */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent" />
            <span className="capitalize">{media.model_used.replace('-', ' ')}</span>
          </div>
          <span>{formatDate(media.created_at)}</span>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-primary/10">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{media.view_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{media.download_count}</span>
            </div>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-card border-primary/20"
            >
              <DropdownMenuItem
                onClick={() => onView(media)}
                className="text-white hover:bg-white/10 cursor-pointer"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDownload(media)}
                className="text-white hover:bg-white/10 cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleFavorite(media.id, !media.is_favorite)}
                className="text-white hover:bg-white/10 cursor-pointer"
              >
                <Heart className="w-4 h-4 mr-2" />
                {media.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-primary/20" />
              <DropdownMenuItem
                onClick={() => onDelete(media.id)}
                className="text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        {media.tags && media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {media.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs border-primary/30 text-gray-300 bg-primary/5"
              >
                #{tag}
              </Badge>
            ))}
            {media.tags.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs border-primary/30 text-gray-400 bg-primary/5"
              >
                +{media.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MediaCard;
