import { useCallback, useMemo, useState, useEffect, useRef, RefObject } from 'react';
import { Volume2, Music, Unlink, Link } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { EditorClip, AudioSegment } from '@/types/editor';
import { getEffectiveDuration } from '@/types/editor';

interface AudioTimelineTrackProps {
  clips: EditorClip[];
  scale: number; // pixels per second
  timelineWidth: number;
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onVolumeChange: (clipId: string, volume: number) => void;
  onDetachAudio?: (clipId: string) => void;
  onReattachAudio?: (segmentId: string) => void;
  audioSegments?: AudioSegment[];
  videoRef?: RefObject<HTMLVideoElement>;
  isPlaying?: boolean;
}

/**
 * Simulated audio level indicator for visual feedback during playback.
 * Uses a simple animation instead of Web Audio API to avoid hijacking
 * the video element's audio output (createMediaElementSource permanently
 * re-routes audio and breaks normal playback).
 */
const useAudioLevel = (
  _videoRef: RefObject<HTMLVideoElement> | undefined,
  isPlaying: boolean
): number => {
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      setLevel(0);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const animate = () => {
      // Generate a natural-looking pseudo-random level
      const t = performance.now() / 1000;
      const simulated = 0.3 + 0.2 * Math.sin(t * 3.7) + 0.15 * Math.sin(t * 7.1) + 0.1 * Math.cos(t * 11.3);
      setLevel(Math.max(0, Math.min(1, simulated)));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  return level;
};

/**
 * Get volume color: blue at normal (<=100%), transitions to red when boosted (>100%)
 */
const getVolumeColor = (volume: number): { slider: string; text: string; waveform: string; label: string } => {
  if (volume <= 1) {
    return {
      slider: '[&_[data-slot=slider-range]]:bg-blue-500',
      text: 'text-blue-600 dark:text-blue-300',
      waveform: 'bg-blue-600/70 dark:bg-blue-400/60',
      label: 'text-blue-600 dark:text-blue-300',
    };
  }
  // Interpolate from blue to red as volume goes from 1.0 to 2.0
  const t = (volume - 1); // 0 to 1
  if (t < 0.5) {
    return {
      slider: '[&_[data-slot=slider-range]]:bg-orange-500',
      text: 'text-orange-500 dark:text-orange-400',
      waveform: 'bg-orange-500/70 dark:bg-orange-400/60',
      label: 'text-orange-500 dark:text-orange-400',
    };
  }
  return {
    slider: '[&_[data-slot=slider-range]]:bg-red-500',
    text: 'text-red-500 dark:text-red-400',
    waveform: 'bg-red-500/70 dark:bg-red-400/60',
    label: 'text-red-500 dark:text-red-400',
  };
};

export const AudioTimelineTrack = ({
  clips,
  scale,
  timelineWidth,
  selectedClipId,
  onSelectClip,
  onVolumeChange,
  onDetachAudio,
  onReattachAudio,
  audioSegments = [],
  videoRef,
  isPlaying = false,
}: AudioTimelineTrackProps) => {
  const [contextMenu, setContextMenu] = useState<{ clipId: string; x: number; y: number } | null>(null);
  const [boostWarning, setBoostWarning] = useState(false);
  const boostWarningShownRef = useRef(false);
  const boostWarningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number) => time * scale, [scale]);

  // Audio level indicator
  const audioLevel = useAudioLevel(videoRef, isPlaying);

  // Show a one-time boost warning when volume crosses 100%
  const handleVolumeWithBoostWarning = useCallback((clipId: string, newVolume: number) => {
    if (newVolume > 1 && !boostWarningShownRef.current) {
      boostWarningShownRef.current = true;
      setBoostWarning(true);
      if (boostWarningTimerRef.current) clearTimeout(boostWarningTimerRef.current);
      boostWarningTimerRef.current = setTimeout(() => setBoostWarning(false), 4000);
    }
    onVolumeChange(clipId, newVolume);
  }, [onVolumeChange]);

  // Sort clips by start time
  const sortedClips = useMemo(() =>
    [...clips].sort((a, b) => a.startTime - b.startTime),
    [clips]
  );

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent, clipId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ clipId, x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div
      className="relative h-10 bg-blue-500/5 dark:bg-blue-900/10"
      style={{ width: timelineWidth }}
      onClick={() => setContextMenu(null)}
    >
      {/* Boost warning tooltip */}
      {boostWarning && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded bg-orange-500/90 text-white text-[10px] whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          Volume above 100% will only be reflected in the final exported video
        </div>
      )}

      {/* Linked audio clips */}
      {sortedClips.map((clip) => {
        const effectiveDuration = getEffectiveDuration(clip);
        const left = timeToPixel(clip.startTime);
        const width = timeToPixel(effectiveDuration);
        const isSelected = selectedClipId === clip.id;
        const audioInfo = clip.audioInfo || { hasAudio: true, volume: 1 };
        const volume = audioInfo.volume;
        const isMuted = volume === 0;
        const colors = getVolumeColor(volume);

        // Color based on audio state
        const bgColor = !audioInfo.hasAudio
          ? 'bg-gray-300/50 dark:bg-gray-500/20 border-gray-400 dark:border-gray-500/30'
          : isMuted
          ? 'bg-red-200/50 dark:bg-red-500/20 border-red-400 dark:border-red-500/30'
          : volume > 1
          ? isSelected
            ? 'bg-red-200/40 dark:bg-red-500/30 border-red-400 dark:border-red-400'
            : 'bg-orange-200/30 dark:bg-orange-500/15 border-orange-400/70 dark:border-orange-500/50'
          : isSelected
          ? 'bg-blue-300/60 dark:bg-blue-500/40 border-blue-500 dark:border-blue-400'
          : 'bg-blue-200/50 dark:bg-blue-500/20 border-blue-400/70 dark:border-blue-500/50';

        return (
          <div
            key={clip.id}
            className={`absolute top-1 h-8 rounded border transition-all cursor-pointer ${bgColor} hover:border-blue-500 dark:hover:border-blue-400`}
            style={{
              left: left,
              width: Math.max(width, 80),
            }}
            onClick={() => onSelectClip(clip.id)}
            onContextMenu={(e) => handleContextMenu(e, clip.id)}
          >
            {/* Audio waveform placeholder - simple bars */}
            {audioInfo.hasAudio && volume > 0 && (
              <div className="absolute inset-0 flex items-center gap-0.5 px-1 overflow-hidden" style={{ right: '70px' }}>
                {Array.from({ length: Math.max(Math.floor((width - 70) / 4), 3) }).map((_, i) => {
                  const height = 30 + Math.sin(i * 0.5 + clip.startTime) * 40 + Math.cos(i * 0.3) * 15;
                  return (
                    <div
                      key={i}
                      className={`w-0.5 ${colors.waveform} rounded-full flex-shrink-0`}
                      style={{
                        height: `${Math.min(height * Math.min(volume, 1.5), 90)}%`,
                        opacity: Math.min(volume, 1),
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* No audio indicator (detached or no audio track) */}
            {!audioInfo.hasAudio && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Unlink className="w-3 h-3 text-gray-400 mr-1" />
                <span className="text-[9px] text-gray-400">Detached</span>
              </div>
            )}

            {/* Controls area (right side): volume slider */}
            {audioInfo.hasAudio && (
              <div className="absolute right-1 top-0 bottom-0 flex items-center gap-1" style={{ width: '70px' }}>
                <div className="flex items-center gap-0.5 flex-1">
                  <Slider
                    value={[volume * 100]}
                    min={0}
                    max={200}
                    step={5}
                    onValueChange={([v]) => {
                      handleVolumeWithBoostWarning(clip.id, v / 100);
                    }}
                    className={`w-10 h-1 [&_[data-slot=slider-track]]:h-0.5 ${colors.slider} [&_[data-slot=slider-thumb]]:h-2 [&_[data-slot=slider-thumb]]:w-2 [&_[data-slot=slider-thumb]]:border-0`}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={`text-[7px] ${colors.text} font-mono w-6 text-right`}>
                    {Math.round(volume * 100)}
                  </span>
                </div>
              </div>
            )}

            {/* Audio level indicator (bottom bar, shows during playback) */}
            {audioInfo.hasAudio && volume > 0 && isPlaying && isSelected && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700/30 dark:bg-gray-700/50 overflow-hidden">
                <div
                  className={`h-full ${volume > 1 ? 'bg-red-500 dark:bg-red-400' : 'bg-green-500 dark:bg-green-400'} transition-all duration-75`}
                  style={{ width: `${audioLevel * Math.min(volume, 1) * 100}%` }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Detached audio segments */}
      {audioSegments.map((segment) => {
        const left = timeToPixel(segment.startTime);
        const effectiveDuration = segment.duration - segment.trimStart - segment.trimEnd;
        const width = timeToPixel(effectiveDuration);
        const isSelected = selectedClipId === segment.id;
        const isMuted = segment.volume === 0;
        const colors = getVolumeColor(segment.volume);

        const bgColor = isMuted
          ? 'bg-orange-200/50 dark:bg-orange-500/20 border-orange-400 dark:border-orange-500/30'
          : segment.volume > 1
          ? isSelected
            ? 'bg-red-200/40 dark:bg-red-500/30 border-red-400 dark:border-red-400'
            : 'bg-purple-200/50 dark:bg-purple-500/20 border-purple-400/70 dark:border-purple-500/50'
          : isSelected
          ? 'bg-purple-300/60 dark:bg-purple-500/40 border-purple-500 dark:border-purple-400'
          : 'bg-purple-200/50 dark:bg-purple-500/20 border-purple-400/70 dark:border-purple-500/50';

        return (
          <div
            key={segment.id}
            className={`absolute top-1 h-8 rounded border transition-all cursor-pointer ${bgColor} hover:border-purple-500 dark:hover:border-purple-400`}
            style={{
              left: left,
              width: Math.max(width, 80),
            }}
            onClick={() => onSelectClip(segment.id)}
            onContextMenu={(e) => handleContextMenu(e, segment.id)}
          >
            {/* Detached audio indicator */}
            <div className="absolute left-1 inset-y-0 flex items-center">
              <Unlink className="w-3 h-3 text-purple-500 dark:text-purple-400 mr-0.5" />
              <span className="text-[8px] text-purple-600 dark:text-purple-300 truncate max-w-[40px]">
                Audio
              </span>
            </div>

            {/* Volume slider for detached segments */}
            <div className="absolute right-1 top-0 bottom-0 flex items-center gap-0.5" style={{ width: '60px' }}>
              <Slider
                value={[segment.volume * 100]}
                min={0}
                max={200}
                step={5}
                onValueChange={([v]) => {
                  handleVolumeWithBoostWarning(segment.id, v / 100);
                }}
                className={`w-9 h-1 [&_[data-slot=slider-track]]:h-0.5 ${colors.slider} [&_[data-slot=slider-thumb]]:h-2 [&_[data-slot=slider-thumb]]:w-2 [&_[data-slot=slider-thumb]]:border-0`}
                onClick={(e) => e.stopPropagation()}
              />
              <span className={`text-[7px] ${colors.text} font-mono w-6 text-right`}>
                {Math.round(segment.volume * 100)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Check if it's a detached segment or a linked clip */}
          {audioSegments.some(s => s.id === contextMenu.clipId) ? (
            // Detached segment context menu
            <>
              {onReattachAudio && (
                <button
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  onClick={() => {
                    onReattachAudio(contextMenu.clipId);
                    setContextMenu(null);
                  }}
                >
                  <Link className="w-3 h-3" />
                  Reattach Audio
                </button>
              )}
            </>
          ) : (
            // Linked clip context menu
            <>
              {onDetachAudio && clips.find(c => c.id === contextMenu.clipId)?.audioInfo?.hasAudio !== false && (
                <button
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  onClick={() => {
                    onDetachAudio(contextMenu.clipId);
                    setContextMenu(null);
                  }}
                >
                  <Unlink className="w-3 h-3" />
                  Detach Audio
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Track label component for use outside the scrollable area
export const AudioTrackLabel = () => (
  <div className="h-10 w-16 flex items-center justify-center bg-slate-100 dark:bg-black/20 border-r border-slate-200 dark:border-white/10">
    <Music className="w-3 h-3 text-blue-500 dark:text-blue-400 mr-1" />
    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">Audio</span>
  </div>
);

export default AudioTimelineTrack;
