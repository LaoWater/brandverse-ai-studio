import { useCallback, useMemo, useState, useEffect, useRef, RefObject } from 'react';
import { Volume2, VolumeX, Music, Unlink, Link } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { EditorClip, AudioSegment } from '@/types/editor';
import { getEffectiveDuration } from '@/types/editor';

interface AudioTimelineTrackProps {
  clips: EditorClip[];
  scale: number; // pixels per second
  timelineWidth: number;
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onToggleMute: (clipId: string) => void;
  onVolumeChange: (clipId: string, volume: number) => void;
  onDetachAudio?: (clipId: string) => void;
  onReattachAudio?: (segmentId: string) => void;
  audioSegments?: AudioSegment[];
  videoRef?: RefObject<HTMLVideoElement>;
  isPlaying?: boolean;
}

/**
 * Hook for monitoring audio level from a video element using Web Audio API.
 * Returns a 0-1 value representing the current audio level.
 */
const useAudioLevel = (
  videoRef: RefObject<HTMLVideoElement> | undefined,
  isPlaying: boolean
): number => {
  const [level, setLevel] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || !videoRef?.current) {
      setLevel(0);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const video = videoRef.current;

    // Create AudioContext and connect only once per video element
    if (!audioCtxRef.current) {
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        audioCtxRef.current = audioCtx;
        sourceRef.current = source;
        analyserRef.current = analyser;
      } catch {
        // MediaElementSource can only be created once per element
        return;
      }
    }

    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setLevel(avg / 255);
      rafRef.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, videoRef]);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
    };
  }, []);

  return level;
};

export const AudioTimelineTrack = ({
  clips,
  scale,
  timelineWidth,
  selectedClipId,
  onSelectClip,
  onToggleMute,
  onVolumeChange,
  onDetachAudio,
  onReattachAudio,
  audioSegments = [],
  videoRef,
  isPlaying = false,
}: AudioTimelineTrackProps) => {
  const [contextMenu, setContextMenu] = useState<{ clipId: string; x: number; y: number } | null>(null);

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number) => time * scale, [scale]);

  // Audio level indicator
  const audioLevel = useAudioLevel(videoRef, isPlaying);

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
      {/* Linked audio clips */}
      {sortedClips.map((clip) => {
        const effectiveDuration = getEffectiveDuration(clip);
        const left = timeToPixel(clip.startTime);
        const width = timeToPixel(effectiveDuration);
        const isSelected = selectedClipId === clip.id;
        const audioInfo = clip.audioInfo || { hasAudio: true, volume: 1, muted: false };
        const isMuted = audioInfo.muted;
        const volume = audioInfo.volume;

        // Color based on audio state
        const bgColor = !audioInfo.hasAudio
          ? 'bg-gray-300/50 dark:bg-gray-500/20 border-gray-400 dark:border-gray-500/30'
          : isMuted
          ? 'bg-red-200/50 dark:bg-red-500/20 border-red-400 dark:border-red-500/30'
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
            {audioInfo.hasAudio && !isMuted && (
              <div className="absolute inset-0 flex items-center gap-0.5 px-1 overflow-hidden" style={{ right: '70px' }}>
                {Array.from({ length: Math.max(Math.floor((width - 70) / 4), 3) }).map((_, i) => {
                  const height = 30 + Math.sin(i * 0.5 + clip.startTime) * 40 + Math.cos(i * 0.3) * 15;
                  return (
                    <div
                      key={i}
                      className="w-0.5 bg-blue-600/70 dark:bg-blue-400/60 rounded-full flex-shrink-0"
                      style={{
                        height: `${Math.min(height, 80)}%`,
                        opacity: volume,
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

            {/* Muted indicator */}
            {audioInfo.hasAudio && isMuted && (
              <div className="absolute left-2 inset-y-0 flex items-center">
                <VolumeX className="w-4 h-4 text-red-400/70" />
              </div>
            )}

            {/* Controls area (right side): volume slider + mute button */}
            {audioInfo.hasAudio && (
              <div className="absolute right-1 top-0 bottom-0 flex items-center gap-1" style={{ width: '65px' }}>
                {/* Volume slider */}
                {!isMuted && (
                  <div className="flex items-center gap-0.5 flex-1">
                    <Slider
                      value={[volume * 100]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={([v]) => {
                        onVolumeChange(clip.id, v / 100);
                      }}
                      className="w-10 h-1 [&_[data-slot=slider-track]]:h-0.5 [&_[data-slot=slider-range]]:bg-blue-500 [&_[data-slot=slider-thumb]]:h-2 [&_[data-slot=slider-thumb]]:w-2 [&_[data-slot=slider-thumb]]:border-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-[7px] text-blue-600 dark:text-blue-300 font-mono w-5 text-right">
                      {Math.round(volume * 100)}
                    </span>
                  </div>
                )}

                {/* Mute toggle */}
                <button
                  className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMute(clip.id);
                  }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-3 h-3 text-red-500 dark:text-red-400" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-blue-600 dark:text-blue-300" />
                  )}
                </button>
              </div>
            )}

            {/* Audio level indicator (bottom bar, shows during playback) */}
            {audioInfo.hasAudio && !isMuted && isPlaying && isSelected && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700/30 dark:bg-gray-700/50 overflow-hidden">
                <div
                  className="h-full bg-green-500 dark:bg-green-400 transition-all duration-75"
                  style={{ width: `${audioLevel * volume * 100}%` }}
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

        const bgColor = segment.muted
          ? 'bg-orange-200/50 dark:bg-orange-500/20 border-orange-400 dark:border-orange-500/30'
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
            {!segment.muted && (
              <div className="absolute right-5 top-0 bottom-0 flex items-center gap-0.5" style={{ width: '50px' }}>
                <Slider
                  value={[segment.volume * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => {
                    onVolumeChange(segment.id, v / 100);
                  }}
                  className="w-8 h-1 [&_[data-slot=slider-track]]:h-0.5 [&_[data-slot=slider-range]]:bg-purple-500 [&_[data-slot=slider-thumb]]:h-2 [&_[data-slot=slider-thumb]]:w-2 [&_[data-slot=slider-thumb]]:border-0"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-[7px] text-purple-600 dark:text-purple-300 font-mono w-5 text-right">
                  {Math.round(segment.volume * 100)}
                </span>
              </div>
            )}

            {/* Mute toggle for detached */}
            <button
              className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute(segment.id);
              }}
              title={segment.muted ? 'Unmute' : 'Mute'}
            >
              {segment.muted ? (
                <VolumeX className="w-3 h-3 text-orange-500 dark:text-orange-400" />
              ) : (
                <Volume2 className="w-3 h-3 text-purple-600 dark:text-purple-300" />
              )}
            </button>
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
              <button
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => {
                  onToggleMute(contextMenu.clipId);
                  setContextMenu(null);
                }}
              >
                <VolumeX className="w-3 h-3" />
                {clips.find(c => c.id === contextMenu.clipId)?.audioInfo?.muted ? 'Unmute' : 'Mute'}
              </button>
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
