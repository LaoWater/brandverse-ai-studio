import { useState } from 'react';
import { X, Plus, Trash2, Copy, ChevronDown, ChevronUp, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TextOverlay, TextStyle, FontFamily } from '@/types/editor';
import { createTextOverlay, DEFAULT_TEXT_STYLE } from '@/types/editor';
import { TextStyleControls } from './TextStyleControls';

// Canva-style caption presets
interface CaptionPreset {
  name: string;
  style: TextStyle;
  preview: string;
}

const CAPTION_PRESETS: CaptionPreset[] = [
  // Row 1: Bold & Impact styles
  {
    name: 'Bold Impact',
    preview: 'BOLD',
    style: {
      fontFamily: 'Oswald' as FontFamily,
      fontSize: 48,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#000000',
      backgroundPadding: 12,
      textAlign: 'center',
      opacity: 1,
    },
  },
  {
    name: 'Minimal White',
    preview: 'Minimal',
    style: {
      fontFamily: 'Inter' as FontFamily,
      fontSize: 36,
      fontWeight: 'normal',
      color: '#FFFFFF',
      textAlign: 'center',
      opacity: 1,
    },
  },
  // Row 2: Neon & Vibrant
  {
    name: 'Neon Glow',
    preview: 'NEON',
    style: {
      fontFamily: 'Montserrat' as FontFamily,
      fontSize: 42,
      fontWeight: 'bold',
      color: '#00FF88',
      textAlign: 'center',
      opacity: 1,
    },
  },
  {
    name: 'Electric Pink',
    preview: 'PINK',
    style: {
      fontFamily: 'Poppins' as FontFamily,
      fontSize: 40,
      fontWeight: 'bold',
      color: '#FF6B9D',
      textAlign: 'center',
      opacity: 1,
    },
  },
  // Row 3: Subtitles
  {
    name: 'Classic Subtitle',
    preview: 'Subtitle',
    style: {
      fontFamily: 'Roboto' as FontFamily,
      fontSize: 28,
      fontWeight: 'normal',
      color: '#FFFFFF',
      backgroundColor: '#000000',
      backgroundPadding: 8,
      textAlign: 'center',
      opacity: 0.85,
    },
  },
  {
    name: 'Yellow Subtitle',
    preview: 'Caption',
    style: {
      fontFamily: 'Open Sans' as FontFamily,
      fontSize: 26,
      fontWeight: 'bold',
      color: '#FFD700',
      textAlign: 'center',
      opacity: 1,
    },
  },
  // Row 4: Elegant & Luxury
  {
    name: 'Elegant Serif',
    preview: 'Elegant',
    style: {
      fontFamily: 'Playfair Display' as FontFamily,
      fontSize: 40,
      fontWeight: 'normal',
      color: '#F5E6D3',
      textAlign: 'center',
      opacity: 1,
    },
  },
  {
    name: 'Gold Luxury',
    preview: 'LUXURY',
    style: {
      fontFamily: 'Playfair Display' as FontFamily,
      fontSize: 38,
      fontWeight: 'bold',
      color: '#D4AF37',
      textAlign: 'center',
      opacity: 1,
    },
  },
  // Row 5: Pop & Fun
  {
    name: 'Pop Color',
    preview: 'POP!',
    style: {
      fontFamily: 'Poppins' as FontFamily,
      fontSize: 44,
      fontWeight: 'bold',
      color: '#FFD93D',
      backgroundColor: '#6C5CE7',
      backgroundPadding: 10,
      textAlign: 'center',
      opacity: 1,
    },
  },
  {
    name: 'Coral Punch',
    preview: 'FUN',
    style: {
      fontFamily: 'Montserrat' as FontFamily,
      fontSize: 42,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#FF6B6B',
      backgroundPadding: 10,
      textAlign: 'center',
      opacity: 1,
    },
  },
  // Row 6: Professional & News
  {
    name: 'News Lower Third',
    preview: 'Breaking',
    style: {
      fontFamily: 'Open Sans' as FontFamily,
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#E74C3C',
      backgroundPadding: 8,
      textAlign: 'left',
      opacity: 1,
    },
  },
  {
    name: 'Corporate Blue',
    preview: 'Business',
    style: {
      fontFamily: 'Inter' as FontFamily,
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#2C3E50',
      backgroundPadding: 10,
      textAlign: 'center',
      opacity: 1,
    },
  },
  // Row 7: Soft & Casual
  {
    name: 'Soft Cream',
    preview: 'soft',
    style: {
      fontFamily: 'Lato' as FontFamily,
      fontSize: 32,
      fontWeight: 'light',
      color: '#FFEAA7',
      textAlign: 'center',
      opacity: 0.95,
    },
  },
  {
    name: 'Mint Fresh',
    preview: 'fresh',
    style: {
      fontFamily: 'Poppins' as FontFamily,
      fontSize: 34,
      fontWeight: 'normal',
      color: '#00D9A5',
      textAlign: 'center',
      opacity: 1,
    },
  },
  // Row 8: Social Media styles
  {
    name: 'TikTok Style',
    preview: 'VIRAL',
    style: {
      fontFamily: 'Montserrat' as FontFamily,
      fontSize: 36,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#FE2C55',
      backgroundPadding: 8,
      textAlign: 'center',
      opacity: 1,
    },
  },
  {
    name: 'Instagram Story',
    preview: 'Story',
    style: {
      fontFamily: 'Poppins' as FontFamily,
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#833AB4',
      backgroundPadding: 10,
      textAlign: 'center',
      opacity: 1,
    },
  },
];

interface TextOverlayPanelProps {
  isOpen: boolean;
  onClose: () => void;
  overlays: TextOverlay[];
  selectedOverlayId: string | null;
  onSelectOverlay: (id: string | null) => void;
  onAddOverlay: (overlay: TextOverlay) => void;
  onUpdateOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  onDeleteOverlay: (id: string) => void;
  onDuplicateOverlay: (id: string) => void;
  currentTime: number;
  totalDuration: number;
}

export const TextOverlayPanel = ({
  isOpen,
  onClose,
  overlays,
  selectedOverlayId,
  onSelectOverlay,
  onAddOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
  onDuplicateOverlay,
  currentTime,
  totalDuration,
}: TextOverlayPanelProps) => {
  const [showStyleControls, setShowStyleControls] = useState(true);
  const [showPresets, setShowPresets] = useState(false);

  const selectedOverlay = overlays.find((o) => o.id === selectedOverlayId);

  const applyPreset = (preset: CaptionPreset) => {
    if (selectedOverlayId) {
      onUpdateOverlay(selectedOverlayId, { style: { ...preset.style } });
    }
  };

  const handleAddText = () => {
    // Create new overlay at current playhead position with 3s duration
    const duration = Math.min(3, Math.max(0.5, totalDuration - currentTime));
    const newOverlay = createTextOverlay(currentTime, duration > 0 ? duration : 3);
    onAddOverlay(newOverlay);
    onSelectOverlay(newOverlay.id);
  };

  const handleTextChange = (text: string) => {
    if (selectedOverlayId) {
      onUpdateOverlay(selectedOverlayId, { text });
    }
  };

  const handleStyleChange = (style: TextStyle) => {
    if (selectedOverlayId) {
      onUpdateOverlay(selectedOverlayId, { style });
    }
  };

  const handleTimingChange = (field: 'startTime' | 'duration', value: number) => {
    if (selectedOverlayId) {
      onUpdateOverlay(selectedOverlayId, { [field]: Math.max(0, value) });
    }
  };

  // Format time as MM:SS.ms
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  // Parse time from MM:SS.ms format
  const parseTime = (input: string): number | null => {
    const match = input.match(/^(\d+):(\d{1,2})(?:\.(\d))?$/);
    if (!match) return null;
    const mins = parseInt(match[1], 10);
    const secs = parseInt(match[2], 10);
    const ms = match[3] ? parseInt(match[3], 10) / 10 : 0;
    return mins * 60 + secs + ms;
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-gray-900 backdrop-blur-sm border-l border-gray-700 transform transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      data-theme="dark"
      style={{ colorScheme: 'dark' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white">Text Overlays</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-300 hover:text-white hover:bg-gray-800">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4">
          {/* Add Text Button */}
          <Button
            onClick={handleAddText}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Text Overlay
          </Button>

          {/* Overlays List */}
          {overlays.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">
                All Overlays ({overlays.length})
              </label>
              <div className="space-y-1">
                {overlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    onClick={() => onSelectOverlay(overlay.id)}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedOverlayId === overlay.id
                        ? 'bg-purple-600/30 border border-purple-500'
                        : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white truncate max-w-[180px]">
                        {overlay.text || 'Empty text'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatTime(overlay.startTime)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Overlay Editor */}
          {selectedOverlay && (
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  Edit Selected
                </label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDuplicateOverlay(selectedOverlay.id)}
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400 hover:text-red-300"
                    onClick={() => onDeleteOverlay(selectedOverlay.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">Text Content</label>
                <Textarea
                  value={selectedOverlay.text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Enter your text..."
                  className="min-h-[80px] bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 resize-none"
                />
              </div>

              {/* Caption Presets Toggle */}
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="flex items-center justify-between w-full py-2 text-sm text-gray-300 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Caption Styles</span>
                </div>
                {showPresets ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Caption Presets Grid */}
              {showPresets && (
                <div className="grid grid-cols-2 gap-2">
                  {CAPTION_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className="p-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-purple-500 transition-all group"
                      title={preset.name}
                    >
                      <div
                        className="text-center mb-1 truncate"
                        style={{
                          fontFamily: preset.style.fontFamily,
                          fontSize: '14px',
                          fontWeight: preset.style.fontWeight === 'bold' ? 700 : preset.style.fontWeight === 'light' ? 300 : 400,
                          color: preset.style.color,
                          backgroundColor: preset.style.backgroundColor,
                          padding: preset.style.backgroundColor ? '4px 8px' : undefined,
                          borderRadius: preset.style.backgroundColor ? '4px' : undefined,
                          textShadow: !preset.style.backgroundColor
                            ? '1px 1px 2px rgba(0,0,0,0.8)'
                            : undefined,
                        }}
                      >
                        {preset.preview}
                      </div>
                      <div className="text-[10px] text-gray-500 group-hover:text-gray-400 truncate">
                        {preset.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Timing Controls */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <label className="text-xs text-gray-400">Timing</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500">Start</label>
                    <Input
                      type="text"
                      value={formatTime(selectedOverlay.startTime)}
                      onChange={(e) => {
                        const time = parseTime(e.target.value);
                        if (time !== null) {
                          handleTimingChange('startTime', time);
                        }
                      }}
                      className="h-8 text-sm bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Duration</label>
                    <Input
                      type="text"
                      value={formatTime(selectedOverlay.duration)}
                      onChange={(e) => {
                        const time = parseTime(e.target.value);
                        if (time !== null) {
                          handleTimingChange('duration', time);
                        }
                      }}
                      className="h-8 text-sm bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Position Display */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">
                  Position (drag on preview to adjust)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-800 rounded text-sm">
                    <span className="text-gray-400">X:</span>
                    <span className="text-white">
                      {Math.round(selectedOverlay.position.x)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-800 rounded text-sm">
                    <span className="text-gray-400">Y:</span>
                    <span className="text-white">
                      {Math.round(selectedOverlay.position.y)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Style Controls Toggle */}
              <button
                onClick={() => setShowStyleControls(!showStyleControls)}
                className="flex items-center justify-between w-full py-2 text-sm text-gray-300 hover:text-white"
              >
                <span>Style Options</span>
                {showStyleControls ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Style Controls */}
              {showStyleControls && (
                <TextStyleControls
                  style={selectedOverlay.style}
                  onChange={handleStyleChange}
                />
              )}
            </div>
          )}

          {/* Empty State */}
          {overlays.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No text overlays yet</p>
              <p className="text-xs mt-1">Click "Add Text Overlay" to create one</p>
            </div>
          )}

          {/* Bottom spacing to ensure full scroll */}
          <div className="h-16" />
        </div>
      </ScrollArea>
    </div>
  );
};

export default TextOverlayPanel;
