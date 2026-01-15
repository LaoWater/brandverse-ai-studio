import { useState } from 'react';
import { Film, CheckCircle, XCircle, Loader, Download, CloudUpload, HardDrive } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { ExportState } from '@/types/editor';

export type ExportDestination = 'download' | 'library' | 'both';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  exportState: ExportState;
  onStartExport?: (destination: ExportDestination) => void;
  showOptions?: boolean; // Show export options before starting
}

export const ExportModal = ({ open, onClose, exportState, onStartExport, showOptions = false }: ExportModalProps) => {
  const { exporting, progress, stage, error } = exportState;
  const [selectedDestination, setSelectedDestination] = useState<ExportDestination>('download');

  // Get stage display text
  const getStageText = () => {
    switch (stage) {
      case 'preparing':
        return 'Preparing export...';
      case 'loading-ffmpeg':
        return 'Loading video processor...';
      case 'downloading-videos':
        return 'Downloading video files...';
      case 'trimming':
        return 'Processing clips...';
      case 'concatenating':
        return 'Joining clips together...';
      case 'finalizing':
        return 'Finalizing video...';
      case 'uploading':
        return 'Saving to library...';
      case 'complete':
        return 'Export complete!';
      case 'error':
        return 'Export failed';
      default:
        return 'Starting...';
    }
  };

  // Show export options before starting
  if (showOptions && !exporting && stage === 'idle') {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-sm border-primary/30">
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-accent" />
            Export Video
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose where to save your exported video
          </DialogDescription>

          <div className="space-y-3 py-4">
            {/* Download option */}
            <button
              onClick={() => setSelectedDestination('download')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                selectedDestination === 'download'
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              <div className={`p-3 rounded-lg ${selectedDestination === 'download' ? 'bg-primary/20' : 'bg-white/10'}`}>
                <HardDrive className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">Download to Device</p>
                <p className="text-sm text-gray-400">Save the video file to your computer</p>
              </div>
            </button>

            {/* Save to library option */}
            <button
              onClick={() => setSelectedDestination('library')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                selectedDestination === 'library'
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              <div className={`p-3 rounded-lg ${selectedDestination === 'library' ? 'bg-primary/20' : 'bg-white/10'}`}>
                <CloudUpload className="w-6 h-6 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">Save to Library</p>
                <p className="text-sm text-gray-400">Upload to your media library in the cloud</p>
              </div>
            </button>

            {/* Both option */}
            <button
              onClick={() => setSelectedDestination('both')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                selectedDestination === 'both'
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              <div className={`p-3 rounded-lg ${selectedDestination === 'both' ? 'bg-primary/20' : 'bg-white/10'}`}>
                <Download className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">Both</p>
                <p className="text-sm text-gray-400">Download and save to library</p>
              </div>
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="cosmic-button"
              onClick={() => onStartExport?.(selectedDestination)}
            >
              <Download className="w-4 h-4 mr-2" />
              Start Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isComplete = stage === 'complete';
  const isError = stage === 'error';
  const canClose = !exporting || isComplete || isError;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && canClose && onClose()}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-sm border-primary/30">
        <DialogTitle className="sr-only">
          {isComplete ? 'Export Complete' : isError ? 'Export Failed' : 'Exporting Video'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {getStageText()}
        </DialogDescription>

        <div className="text-center py-6">
          {/* Icon */}
          <div className="relative inline-block mb-6">
            {isComplete ? (
              <div className="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            ) : isError ? (
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
            ) : (
              <div className="relative">
                {/* Animated background */}
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-primary/30 to-accent/30 animate-pulse" />

                {/* Spinning ring */}
                <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Film className="w-8 h-8 text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-2xl font-bold mb-2 ${
            isComplete ? 'text-green-500' : isError ? 'text-destructive' : 'text-white'
          }`}>
            {isComplete ? 'Export Complete!' : isError ? 'Export Failed' : 'Exporting Video'}
          </h3>

          {/* Stage text */}
          <p className="text-gray-400 mb-6">
            {isError && error ? error : getStageText()}
          </p>

          {/* Progress bar (only show when exporting) */}
          {!isComplete && !isError && (
            <div className="space-y-3 mb-6">
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-accent font-semibold">{Math.round(progress)}%</p>
            </div>
          )}

          {/* Processing details */}
          {!isComplete && !isError && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader className="w-4 h-4 animate-spin" />
              <span>This may take a few minutes for longer videos</span>
            </div>
          )}

          {/* Success message */}
          {isComplete && (
            <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
              <Download className="w-5 h-5" />
              <span>Your video has been downloaded</span>
            </div>
          )}

          {/* Close button (only when can close) */}
          {canClose && (
            <Button
              onClick={onClose}
              className={isComplete ? 'cosmic-button' : 'mt-4'}
              variant={isComplete ? 'default' : 'outline'}
            >
              {isComplete ? 'Done' : isError ? 'Close' : 'Cancel'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
