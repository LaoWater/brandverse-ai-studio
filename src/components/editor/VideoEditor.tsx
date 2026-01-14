import { useState, useCallback, useRef, useEffect } from 'react';
import { Film, Plus, Download, Trash2, Play, Pause, SkipBack, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import type { EditorClip, PlaybackState, ExportState, ExportStage } from '@/types/editor';
import { getEffectiveDuration, getClipEndTime } from '@/types/editor';
import { ClipSelector } from './ClipSelector';
import { EditorTimeline } from './EditorTimeline';
import { ExportModal } from './ExportModal';
import { exportProject, downloadBlob } from '@/services/videoEditorService';
import type { MediaFile } from '@/services/mediaStudioService';

interface VideoEditorProps {
  onBack?: () => void;
}

export const VideoEditor = ({ onBack }: VideoEditorProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);

  // Editor state
  const [clips, setClips] = useState<EditorClip[]>([]);
  const [playback, setPlayback] = useState<PlaybackState>({
    playing: false,
    currentTime: 0,
    activeClipId: null,
  });
  const [exportState, setExportState] = useState<ExportState>({
    exporting: false,
    progress: 0,
    stage: 'idle',
    error: null,
  });

  // UI state
  const [showClipSelector, setShowClipSelector] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Calculate total timeline duration
  const totalDuration = clips.length > 0
    ? Math.max(...clips.map(clip => getClipEndTime(clip)))
    : 0;

  // Find which clip is active at current time
  const findActiveClip = useCallback((time: number): EditorClip | null => {
    for (const clip of clips) {
      const clipEnd = getClipEndTime(clip);
      if (time >= clip.startTime && time < clipEnd) {
        return clip;
      }
    }
    return null;
  }, [clips]);

  // Update video source when active clip changes
  useEffect(() => {
    const activeClip = findActiveClip(playback.currentTime);

    if (!videoRef.current) return;

    if (activeClip) {
      if (playback.activeClipId !== activeClip.id) {
        // New clip, load it
        console.log('[VideoEditor] Loading clip:', activeClip.id, activeClip.sourceUrl);
        videoRef.current.src = activeClip.sourceUrl;
        videoRef.current.load();

        // Wait for video to be ready before seeking
        const handleLoadedMetadata = () => {
          if (videoRef.current) {
            const clipLocalTime = playback.currentTime - activeClip.startTime + activeClip.trimStart;
            videoRef.current.currentTime = Math.max(0, clipLocalTime);
            console.log('[VideoEditor] Video loaded, seeking to:', clipLocalTime);
          }
        };

        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });

        setPlayback(prev => ({ ...prev, activeClipId: activeClip.id }));
      }
    } else if (clips.length > 0) {
      // No active clip at current time, but we have clips - load the first one for preview
      const firstClip = clips[0];
      if (videoRef.current.src !== firstClip.sourceUrl) {
        videoRef.current.src = firstClip.sourceUrl;
        videoRef.current.load();
      }
    }
  }, [playback.currentTime, playback.activeClipId, findActiveClip, clips]);

  // Playback animation loop
  useEffect(() => {
    if (!playback.playing) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setPlayback(prev => {
        const newTime = prev.currentTime + delta;

        // Check if we've reached the end
        if (newTime >= totalDuration) {
          return { ...prev, currentTime: 0, playing: false };
        }

        return { ...prev, currentTime: newTime };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playback.playing, totalDuration]);

  // Sync video element with playback
  useEffect(() => {
    if (!videoRef.current) return;

    const activeClip = findActiveClip(playback.currentTime);
    if (!activeClip) {
      videoRef.current.pause();
      return;
    }

    const clipLocalTime = playback.currentTime - activeClip.startTime + activeClip.trimStart;

    if (playback.playing) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = clipLocalTime;
    }
  }, [playback.playing, playback.currentTime, findActiveClip]);

  // Handle adding clips from library
  const handleAddClips = useCallback((mediaFiles: MediaFile[]) => {
    const newClips: EditorClip[] = mediaFiles.map((media, index) => {
      // Calculate start time (add to end of timeline)
      const existingDuration = clips.length > 0
        ? Math.max(...clips.map(c => getClipEndTime(c)))
        : 0;

      // Sum durations of previously added clips in this batch
      const batchDuration = mediaFiles.slice(0, index).reduce((sum, m) => sum + (m.duration || 8), 0);

      console.log('[VideoEditor] Adding clip:', media.file_name, 'url:', media.public_url);

      return {
        id: `clip_${Date.now()}_${index}`,
        mediaFileId: media.id,
        sourceUrl: media.public_url,
        thumbnailUrl: media.thumbnail_url,
        fileName: media.file_name,
        sourceDuration: media.duration || 8, // Default to 8s if unknown
        startTime: existingDuration + batchDuration,
        trimStart: 0,
        trimEnd: 0,
      };
    });

    setClips(prev => [...prev, ...newClips]);
    setShowClipSelector(false);

    toast({
      title: 'Clips Added',
      description: `Added ${newClips.length} clip${newClips.length > 1 ? 's' : ''} to timeline`,
    });
  }, [clips, toast]);

  // Handle timeline changes (reorder, trim)
  const handleTimelineChange = useCallback((updatedClips: EditorClip[]) => {
    setClips(updatedClips);
  }, []);

  // Handle clip deletion
  const handleDeleteClip = useCallback((clipId: string) => {
    setClips(prev => {
      const filtered = prev.filter(c => c.id !== clipId);
      // Recalculate start times to close gaps
      let currentStart = 0;
      return filtered.map(clip => {
        const newClip = { ...clip, startTime: currentStart };
        currentStart += getEffectiveDuration(clip);
        return newClip;
      });
    });
  }, []);

  // Handle seek
  const handleSeek = useCallback((time: number) => {
    setPlayback(prev => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, totalDuration)),
    }));
  }, [totalDuration]);

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    if (clips.length === 0) return;

    setPlayback(prev => {
      // If at end, restart
      if (!prev.playing && prev.currentTime >= totalDuration) {
        return { ...prev, playing: true, currentTime: 0 };
      }
      return { ...prev, playing: !prev.playing };
    });
  }, [clips.length, totalDuration]);

  // Reset to beginning
  const handleReset = useCallback(() => {
    setPlayback(prev => ({
      ...prev,
      currentTime: 0,
      playing: false,
    }));
  }, []);

  // Clear all clips
  const handleClearAll = useCallback(() => {
    setClips([]);
    setPlayback({
      playing: false,
      currentTime: 0,
      activeClipId: null,
    });
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    if (clips.length === 0) {
      toast({
        title: 'No Clips',
        description: 'Add some clips to the timeline before exporting.',
        variant: 'destructive',
      });
      return;
    }

    setShowExportModal(true);
    setExportState({
      exporting: true,
      progress: 0,
      stage: 'preparing',
      error: null,
    });

    try {
      const blob = await exportProject(clips, (progress, stage, message) => {
        setExportState(prev => ({
          ...prev,
          progress,
          stage,
          error: null,
        }));
      });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `edited_video_${timestamp}.mp4`;

      // Download the file
      downloadBlob(blob, filename);

      setExportState(prev => ({
        ...prev,
        progress: 100,
        stage: 'complete',
      }));

      toast({
        title: 'Export Complete!',
        description: 'Your video has been downloaded.',
        className: 'bg-green-600/90 border-green-600 text-white',
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      setExportState(prev => ({
        ...prev,
        exporting: false,
        stage: 'error',
        error: error.message || 'Export failed',
      }));

      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export video. Please try again.',
        variant: 'destructive',
      });
    }
  }, [clips, toast]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get active clip for preview
  const activeClip = findActiveClip(playback.currentTime);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/20">
            <Film className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Video Editor</h2>
            <p className="text-sm text-gray-400">
              {clips.length === 0
                ? 'Add clips from your library to get started'
                : `${clips.length} clip${clips.length !== 1 ? 's' : ''} • ${formatTime(totalDuration)} total`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowClipSelector(true)}
            className="bg-primary/20 hover:bg-primary/30 text-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Clips
          </Button>

          {clips.length > 0 && (
            <>
              <Button
                onClick={handleClearAll}
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>

              <Button
                onClick={handleExport}
                className="cosmic-button"
                disabled={exportState.exporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Video
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Preview Section */}
        <Card className="cosmic-card border-0 overflow-hidden">
          <div className="aspect-video bg-black/50 relative flex items-center justify-center">
            {clips.length === 0 ? (
              <div className="text-center text-gray-400">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No clips added yet</p>
                <p className="text-sm mt-1">Click "Add Clips" to import from your library</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  muted={isMuted}
                  playsInline
                  crossOrigin="anonymous"
                  preload="auto"
                />
                {!activeClip && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-gray-400">No clip at current position</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Playback Controls */}
          <div className="p-4 space-y-4 bg-card/50">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-12 text-right">
                {formatTime(playback.currentTime)}
              </span>
              <Slider
                value={[playback.currentTime]}
                min={0}
                max={totalDuration || 1}
                step={0.1}
                onValueChange={([value]) => handleSeek(value)}
                className="flex-1"
                disabled={clips.length === 0}
              />
              <span className="text-sm text-gray-400 w-12">
                {formatTime(totalDuration)}
              </span>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleReset}
                disabled={clips.length === 0}
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                size="lg"
                className="cosmic-button rounded-full w-14 h-14"
                onClick={togglePlayback}
                disabled={clips.length === 0}
              >
                {playback.playing ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsMuted(!isMuted)}
                disabled={clips.length === 0}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>

              {!isMuted && (
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([v]) => {
                    setVolume(v);
                    if (videoRef.current) videoRef.current.volume = v;
                  }}
                  className="w-24"
                />
              )}
            </div>
          </div>
        </Card>

        {/* Clips List / Info Panel */}
        <Card className="cosmic-card border-0 p-4 space-y-4">
          <h3 className="font-semibold text-white">Clips ({clips.length})</h3>

          {clips.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No clips in timeline</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {clips.map((clip, index) => (
                <div
                  key={clip.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    playback.activeClipId === clip.id
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                  onClick={() => handleSeek(clip.startTime)}
                >
                  <div className="flex items-start gap-3">
                    {clip.thumbnailUrl ? (
                      <img
                        src={clip.thumbnailUrl}
                        alt=""
                        className="w-16 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-black/30 rounded flex items-center justify-center">
                        <Film className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        Clip {index + 1}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(getEffectiveDuration(clip))}
                        {(clip.trimStart > 0 || clip.trimEnd > 0) && (
                          <span className="text-accent ml-1">(trimmed)</span>
                        )}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClip(clip.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Timeline */}
      <Card className="cosmic-card border-0 p-4">
        <EditorTimeline
          clips={clips}
          currentTime={playback.currentTime}
          totalDuration={totalDuration}
          onSeek={handleSeek}
          onChange={handleTimelineChange}
          onDeleteClip={handleDeleteClip}
        />
      </Card>

      {/* Clip Selector Modal */}
      <ClipSelector
        open={showClipSelector}
        onClose={() => setShowClipSelector(false)}
        onSelect={handleAddClips}
      />

      {/* Export Modal */}
      <ExportModal
        open={showExportModal}
        onClose={() => {
          if (!exportState.exporting) {
            setShowExportModal(false);
            setExportState({
              exporting: false,
              progress: 0,
              stage: 'idle',
              error: null,
            });
          }
        }}
        exportState={exportState}
      />
    </div>
  );
};

export default VideoEditor;
