import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Heart,
  Trash2,
  Sparkles,
  Calendar,
  Clock,
  Maximize2,
  Eye,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { MediaFile } from '@/services/mediaStudioService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface MediaPreviewModalProps {
  media: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onDelete: (id: string) => void;
  onDownload: (media: MediaFile) => void;
}

const MediaPreviewModal = ({
  media,
  isOpen,
  onClose,
  onToggleFavorite,
  onDelete,
  onDownload,
}: MediaPreviewModalProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!media) return null;

  const isVideo = media.file_type === 'video';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / 1024 / 1024;
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-xl bg-card border border-primary/30 shadow-2xl shadow-primary/20"
          >
            {/* Close button */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] h-full max-h-[95vh]">
              {/* Left: Media Preview */}
              <div className="relative bg-black flex items-center justify-center p-8">
                {/* Animated background gradient */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/40 rounded-full blur-[150px] animate-cosmic-drift" />
                  <div
                    className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/40 rounded-full blur-[150px] animate-cosmic-drift"
                    style={{ animationDelay: '-10s' }}
                  />
                </div>

                {/* Media display */}
                <div className="relative z-10 max-w-full max-h-full">
                  {isVideo ? (
                    <video
                      src={media.public_url}
                      controls
                      className="max-w-full max-h-[calc(95vh-4rem)] rounded-lg shadow-2xl"
                      autoPlay
                    />
                  ) : (
                    <img
                      src={media.public_url}
                      alt={media.custom_title || media.prompt}
                      className="max-w-full max-h-[calc(95vh-4rem)] rounded-lg shadow-2xl object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Right: Details & Actions */}
              <div className="bg-background/95 backdrop-blur-sm overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Type badge */}
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      'border-0 flex items-center gap-1.5',
                      isVideo ? 'bg-accent/90' : 'bg-primary/90'
                    )}>
                      {isVideo ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      {isVideo ? 'Video' : 'Image'}
                    </Badge>
                    {media.is_favorite && (
                      <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10">
                        <Heart className="w-3 h-3 mr-1 fill-current" />
                        Favorite
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {media.custom_title || 'Generated Media'}
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                      {media.prompt}
                    </p>
                  </div>

                  <Separator className="bg-primary/20" />

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => onDownload(media)}
                      className="cosmic-button w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => onToggleFavorite(media.id, !media.is_favorite)}
                      variant="outline"
                      className="w-full border-primary/30 hover:border-primary/50"
                    >
                      <Heart
                        className={cn(
                          'w-4 h-4 mr-2',
                          media.is_favorite && 'fill-red-500 text-red-500'
                        )}
                      />
                      {media.is_favorite ? 'Unfavorite' : 'Favorite'}
                    </Button>
                  </div>

                  <Separator className="bg-primary/20" />

                  {/* Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Details
                    </h3>

                    <div className="space-y-3 text-sm">
                      <DetailRow
                        icon={<Sparkles className="w-4 h-4 text-accent" />}
                        label="AI Model"
                        value={media.model_used.replace('-', ' ').toUpperCase()}
                      />
                      <DetailRow
                        icon={<Maximize2 className="w-4 h-4 text-accent" />}
                        label="Aspect Ratio"
                        value={media.aspect_ratio || 'Auto'}
                      />
                      <DetailRow
                        icon={<Sparkles className="w-4 h-4 text-accent" />}
                        label="Quality"
                        value={media.quality?.toUpperCase() || 'N/A'}
                      />
                      {isVideo && media.duration && (
                        <DetailRow
                          icon={<Clock className="w-4 h-4 text-accent" />}
                          label="Duration"
                          value={formatDuration(media.duration) || 'N/A'}
                        />
                      )}
                      <DetailRow
                        icon={<Calendar className="w-4 h-4 text-accent" />}
                        label="Created"
                        value={formatDate(media.created_at)}
                      />
                      <DetailRow
                        icon={<Eye className="w-4 h-4 text-accent" />}
                        label="Views"
                        value={media.view_count.toString()}
                      />
                      <DetailRow
                        icon={<Download className="w-4 h-4 text-accent" />}
                        label="Downloads"
                        value={media.download_count.toString()}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  {media.tags && media.tags.length > 0 && (
                    <>
                      <Separator className="bg-primary/20" />
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-white">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {media.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="border-primary/30 text-gray-300 bg-primary/5"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  {media.notes && (
                    <>
                      <Separator className="bg-primary/20" />
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-white">Notes</h3>
                        <p className="text-sm text-gray-300">{media.notes}</p>
                      </div>
                    </>
                  )}

                  <Separator className="bg-primary/20" />

                  {/* Delete button */}
                  <Button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
                        onDelete(media.id);
                        onClose();
                      }
                    }}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Media
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper component for detail rows
const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-gray-400">
      {icon}
      <span>{label}</span>
    </div>
    <span className="text-white font-medium">{value}</span>
  </div>
);

export default MediaPreviewModal;
