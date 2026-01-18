import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Sparkles } from 'lucide-react';
import { MediaFile } from '@/services/mediaStudioService';
import MediaCard from './MediaCard';
import { Button } from '@/components/ui/button';

interface MediaGridProps {
  media: MediaFile[];
  isLoading: boolean;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onDelete: (id: string) => void;
  onDownload: (media: MediaFile) => void;
  onView: (media: MediaFile) => void;
  onCreateNew?: () => void;
  isSelectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
}

const MediaGrid = ({
  media,
  isLoading,
  onToggleFavorite,
  onDelete,
  onDownload,
  onView,
  onCreateNew,
  isSelectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
}: MediaGridProps) => {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="media-card-gradient rounded-lg overflow-hidden"
          >
            <div className="aspect-video skeleton-loading" />
            <div className="p-4 space-y-3">
              <div className="h-4 skeleton-loading rounded" />
              <div className="h-3 skeleton-loading rounded w-3/4" />
              <div className="flex justify-between pt-2">
                <div className="h-3 skeleton-loading rounded w-20" />
                <div className="h-3 skeleton-loading rounded w-16" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Empty state
  if (media.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-20 px-4"
      >
        <div className="relative mb-8 float-animation">
          <div className="absolute inset-0 animate-ping opacity-20">
            <div className="w-32 h-32 rounded-full bg-primary" />
          </div>
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center backdrop-blur-sm border border-primary/30 shadow-2xl shadow-primary/20">
            <ImageIcon className="w-16 h-16 text-primary" />
          </div>
          {/* Orbiting particles */}
          <div className="absolute top-0 left-1/2 w-3 h-3 bg-accent rounded-full blur-sm animate-cosmic-drift" />
          <div className="absolute bottom-0 right-1/2 w-2 h-2 bg-primary rounded-full blur-sm animate-cosmic-drift" style={{ animationDelay: '-5s' }} />
        </div>

        <h3 className="text-2xl font-bold text-gradient-animate mb-2">
          Your creative journey starts here
        </h3>
        <p className="text-gray-400 text-center max-w-md mb-8 leading-relaxed">
          You haven't created any media yet. Start by generating your first masterpiece with AI.
        </p>

        {onCreateNew && (
          <Button onClick={onCreateNew} className="cosmic-button gap-2 button-press-effect force-text-white">
            <Sparkles className="w-5 h-5" />
            Create Your First Media
          </Button>
        )}
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <AnimatePresence>
        {media.map((item) => (
          <motion.div
            key={item.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <MediaCard
              media={item}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDelete}
              onDownload={onDownload}
              onView={onView}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(item.id)}
              onToggleSelection={onToggleSelection}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default MediaGrid;
