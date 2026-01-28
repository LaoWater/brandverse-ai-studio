import { useCallback, useMemo } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import type { EditorClip } from '@/types/editor';
import { getEffectiveDuration } from '@/types/editor';

interface AudioTimelineTrackProps {
  clips: EditorClip[];
  scale: number; // pixels per second
  timelineWidth: number;
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onToggleMute: (clipId: string) => void;
  onVolumeChange: (clipId: string, volume: number) => void;
}

export const AudioTimelineTrack = ({
  clips,
  scale,
  timelineWidth,
  selectedClipId,
  onSelectClip,
  onToggleMute,
  onVolumeChange,
}: AudioTimelineTrackProps) => {
  // Convert time to pixel position
  const timeToPixel = useCallback((time: number) => time * scale, [scale]);

  // Format time for display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  }, []);

  // Sort clips by start time
  const sortedClips = useMemo(() =>
    [...clips].sort((a, b) => a.startTime - b.startTime),
    [clips]
  );

  return (
    <div
      className="relative h-10 bg-blue-500/5 dark:bg-blue-900/10"
      style={{ width: timelineWidth }}
    >
      {/* Audio clips - NO label inside, label is handled by parent */}
      {sortedClips.map((clip) => {
        const effectiveDuration = getEffectiveDuration(clip);
        const left = timeToPixel(clip.startTime); // No offset - label is outside
        const width = timeToPixel(effectiveDuration);
        const isSelected = selectedClipId === clip.id;
        const audioInfo = clip.audioInfo || { hasAudio: true, volume: 1, muted: false };
        const isMuted = audioInfo.muted;
        const volume = audioInfo.volume;

        // Color based on audio state - with light mode support
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
              width: Math.max(width, 60),
            }}
            onClick={() => onSelectClip(clip.id)}
          >
            {/* Audio waveform placeholder - simple bars with light mode colors */}
            {audioInfo.hasAudio && !isMuted && (
              <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-2 overflow-hidden">
                {Array.from({ length: Math.floor(width / 4) }).map((_, i) => {
                  // Generate pseudo-random heights for visual effect
                  const height = 30 + Math.sin(i * 0.5 + clip.startTime) * 40 + Math.random() * 20;
                  return (
                    <div
                      key={i}
                      className="w-0.5 bg-blue-600/70 dark:bg-blue-400/60 rounded-full"
                      style={{
                        height: `${Math.min(height, 80)}%`,
                        opacity: volume,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* No audio indicator */}
            {!audioInfo.hasAudio && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] text-gray-400">No Audio</span>
              </div>
            )}

            {/* Muted indicator */}
            {audioInfo.hasAudio && isMuted && (
              <div className="absolute inset-0 flex items-center justify-center">
                <VolumeX className="w-4 h-4 text-red-400/70" />
              </div>
            )}

            {/* Volume/Mute button */}
            <button
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
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

            {/* Volume indicator bar */}
            {audioInfo.hasAudio && !isMuted && (
              <div
                className="absolute bottom-0.5 left-1 right-6 h-1 bg-black/20 dark:bg-black/30 rounded-full overflow-hidden"
                title={`Volume: ${Math.round(volume * 100)}%`}
              >
                <div
                  className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
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
