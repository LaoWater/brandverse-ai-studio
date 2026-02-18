import { useEffect, useState } from 'react';
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
  Copy,
  Check,
  Wand2,
  Film,
  FastForward,
  Loader2,
  Play,
  Pencil,
  Send,
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
  onEdit?: (media: MediaFile) => void; // New: Edit media details
  onUseForImageGeneration?: (media: MediaFile) => void;
  onUseForVideoGeneration?: (media: MediaFile) => void;
  onContinueVideo?: (media: MediaFile) => void;
  onExtendVideo?: (media: MediaFile, gcsUri: string) => void; // New: Extend video using GCS URI
  onCreatePost?: (media: MediaFile) => void;
  isContinuingVideo?: boolean;
  continueVideoProgress?: string;
}

// Helper to extract GCS URI from notes field
const extractGcsUri = (notes: string | null): string | null => {
  if (!notes) return null;
  const match = notes.match(/GCS: (gs:\/\/[^\s|]+)/);
  return match ? match[1] : null;
};

// Check if video is eligible for extension (< 2 days old, has GCS URI)
const isVideoExtendable = (media: MediaFile): { canExtend: boolean; gcsUri: string | null; reason?: string } => {
  if (media.file_type !== 'video') return { canExtend: false, gcsUri: null, reason: 'Not a video' };

  const gcsUri = extractGcsUri(media.notes);
  if (!gcsUri) return { canExtend: false, gcsUri: null, reason: 'No extension data (older video)' };

  // Check if video is less than 2 days old
  const createdAt = new Date(media.created_at);
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  if (createdAt < twoDaysAgo) {
    return { canExtend: false, gcsUri, reason: 'Video is > 2 days old' };
  }

  return { canExtend: true, gcsUri };
};

const MediaPreviewModal = ({
  media,
  isOpen,
  onClose,
  onToggleFavorite,
  onDelete,
  onDownload,
  onEdit,
  onUseForImageGeneration,
  onUseForVideoGeneration,
  onContinueVideo,
  onExtendVideo,
  onCreatePost,
  isContinuingVideo = false,
  continueVideoProgress = '',
}: MediaPreviewModalProps) => {
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    if (media?.prompt) {
      await navigator.clipboard.writeText(media.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
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

            <div className="flex flex-col lg:flex-row h-full max-h-[95vh]">
              {/* Media Preview - Takes priority, always fully visible */}
              <div className="relative bg-black flex items-center justify-center flex-1 min-h-[50vh] lg:min-h-0 p-4 lg:p-8">
                {/* Animated background gradient */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/40 rounded-full blur-[150px] animate-cosmic-drift" />
                  <div
                    className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/40 rounded-full blur-[150px] animate-cosmic-drift"
                    style={{ animationDelay: '-10s' }}
                  />
                </div>

                {/* Media display - centered and constrained to fit fully */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {isVideo ? (
                    <video
                      src={media.public_url}
                      controls
                      className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                      autoPlay
                    />
                  ) : (
                    <img
                      src={media.public_url}
                      alt={media.custom_title || media.prompt}
                      className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Details & Actions - Fixed width sidebar, scrollable */}
              <div className="w-full lg:w-[400px] lg:min-w-[400px] bg-background/95 backdrop-blur-sm overflow-y-auto max-h-[45vh] lg:max-h-[95vh]">
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
                    <h2 className="text-xl font-bold text-white mb-3">
                      {media.custom_title || 'Generated Media'}
                    </h2>

                    {/* Prompt - Scrollable box with copy functionality */}
                    <div className="relative group">
                      <div className="bg-black/30 border border-primary/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <p className="text-gray-300 text-sm leading-relaxed pr-8">
                          {media.prompt}
                        </p>
                      </div>
                      <Button
                        onClick={copyPrompt}
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-60 hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                        title="Copy prompt"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
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

                  {/* Edit Button */}
                  {onEdit && (
                    <Button
                      onClick={() => onEdit(media)}
                      variant="outline"
                      className="w-full border-accent/30 hover:border-accent/50 hover:bg-accent/10"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Details
                    </Button>
                  )}

                  {/* Create Post from Media */}
                  {onCreatePost && (
                    <>
                      <Separator className="bg-primary/20" />
                      <Button
                        onClick={() => {
                          onCreatePost(media);
                          onClose();
                        }}
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Create Post from This Media
                      </Button>
                    </>
                  )}

                  {/* Use for Generation - Only for images */}
                  {!isVideo && (onUseForImageGeneration || onUseForVideoGeneration) && (
                    <>
                      <Separator className="bg-primary/20" />
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Wand2 className="w-4 h-4 text-accent" />
                          Use for Generation
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {onUseForImageGeneration && (
                            <Button
                              onClick={() => {
                                onUseForImageGeneration(media);
                                onClose();
                              }}
                              variant="outline"
                              className="w-full border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              New Image
                            </Button>
                          )}
                          {onUseForVideoGeneration && (
                            <Button
                              onClick={() => {
                                onUseForVideoGeneration(media);
                                onClose();
                              }}
                              variant="outline"
                              className="w-full border-accent/30 hover:border-accent/50 hover:bg-accent/10"
                            >
                              <Film className="w-4 h-4 mr-2" />
                              New Video
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Continue Video - Only for videos */}
                  {isVideo && onContinueVideo && (
                    <>
                      <Separator className="bg-primary/20" />
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <FastForward className="w-4 h-4 text-accent" />
                          Continue Video
                        </h3>
                        <p className="text-xs text-gray-400">
                          Extract the last frame and use it to generate a continuation of this video.
                        </p>
                        <Button
                          onClick={() => onContinueVideo(media)}
                          disabled={isContinuingVideo}
                          className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white"
                        >
                          {isContinuingVideo ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {continueVideoProgress || 'Processing...'}
                            </>
                          ) : (
                            <>
                              <FastForward className="w-4 h-4 mr-2" />
                              Continue This Video
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Extend Video (Veo 3.1) - Only for eligible videos */}
                  {isVideo && onExtendVideo && (() => {
                    const { canExtend, gcsUri, reason } = isVideoExtendable(media);
                    return (
                      <>
                        <Separator className="bg-primary/20" />
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Play className="w-4 h-4 text-green-400" />
                            Extend Video
                            <Badge className="bg-green-500/20 text-green-400 text-[10px] border-0">
                              Veo 3.1
                            </Badge>
                          </h3>
                          <p className="text-xs text-gray-400">
                            {canExtend
                              ? 'Extend this video by ~7 seconds using AI. Continues the narrative seamlessly.'
                              : reason
                            }
                          </p>
                          <Button
                            onClick={() => {
                              if (canExtend && gcsUri) {
                                onExtendVideo(media, gcsUri);
                                onClose();
                              }
                            }}
                            disabled={!canExtend}
                            className={cn(
                              "w-full",
                              canExtend
                                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
                                : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            )}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {canExtend ? 'Extend This Video (+7s)' : 'Not Available'}
                          </Button>
                          {canExtend && (
                            <p className="text-[10px] text-gray-500">
                              720p output • 8s generation • Must be &lt; 2 days old
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}

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
