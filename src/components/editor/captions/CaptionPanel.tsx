import { useState } from 'react';
import { X, Plus, Trash2, Loader2, Wand2, MessageSquare, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CaptionSegment, CaptionStyle } from '@/types/editor';
import { DEFAULT_CAPTION_STYLE, createCaptionSegment } from '@/types/editor';

interface CaptionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  captions: CaptionSegment[];
  selectedCaptionId: string | null;
  onSelectCaption: (id: string | null) => void;
  onAddCaption: (caption: CaptionSegment) => void;
  onUpdateCaption: (id: string, updates: Partial<CaptionSegment>) => void;
  onDeleteCaption: (id: string) => void;
  onDuplicateCaption: (id: string) => void;
  onGenerateCaptions: () => Promise<void>;
  isGenerating: boolean;
  currentTime: number;
  totalDuration: number;
  // Global caption style
  globalStyle: CaptionStyle;
  onUpdateGlobalStyle: (style: Partial<CaptionStyle>) => void;
}

export const CaptionPanel = ({
  isOpen,
  onClose,
  captions,
  selectedCaptionId,
  onSelectCaption,
  onAddCaption,
  onUpdateCaption,
  onDeleteCaption,
  onDuplicateCaption,
  onGenerateCaptions,
  isGenerating,
  currentTime,
  totalDuration,
  globalStyle,
  onUpdateGlobalStyle,
}: CaptionPanelProps) => {
  const [isStyleExpanded, setIsStyleExpanded] = useState(false);

  // Format time as MM:SS.ms
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Parse time from string
  const parseTime = (str: string): number => {
    const parts = str.split(':');
    if (parts.length === 2) {
      const [mins, secMs] = parts;
      const [secs, ms] = secMs.split('.');
      return parseInt(mins) * 60 + parseInt(secs) + (parseInt(ms || '0') / 100);
    }
    return 0;
  };

  // Get selected caption
  const selectedCaption = captions.find(c => c.id === selectedCaptionId);

  // Add new caption at current time
  const handleAddCaption = () => {
    const duration = Math.min(3, Math.max(0.5, totalDuration - currentTime));
    const newCaption = createCaptionSegment(
      currentTime,
      currentTime + (duration > 0 ? duration : 3),
      'New caption'
    );
    onAddCaption(newCaption);
    onSelectCaption(newCaption.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-card/95 backdrop-blur border-l border-white/10 shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-white">Captions</h3>
          <span className="text-xs text-gray-400">({captions.length})</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Generate Captions Button */}
        <Button
          className="w-full bg-yellow-600 hover:bg-yellow-700"
          onClick={onGenerateCaptions}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate from Audio
            </>
          )}
        </Button>

        {/* Add Manual Caption */}
        <Button
          variant="outline"
          className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/20"
          onClick={handleAddCaption}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Caption at Playhead
        </Button>

        {/* Global Style Section */}
        <div className="border border-white/10 rounded-lg overflow-hidden">
          <button
            className="w-full p-3 flex items-center justify-between text-sm text-gray-300 hover:bg-white/5"
            onClick={() => setIsStyleExpanded(!isStyleExpanded)}
          >
            <span>Caption Style</span>
            {isStyleExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isStyleExpanded && (
            <div className="p-3 space-y-3 border-t border-white/10">
              {/* Font Size */}
              <div>
                <Label className="text-xs text-gray-400">Font Size: {globalStyle.fontSize}px</Label>
                <Slider
                  value={[globalStyle.fontSize]}
                  min={16}
                  max={48}
                  step={2}
                  onValueChange={([v]) => onUpdateGlobalStyle({ fontSize: v })}
                  className="mt-1"
                />
              </div>

              {/* Position */}
              <div>
                <Label className="text-xs text-gray-400">Position</Label>
                <Select
                  value={globalStyle.position}
                  onValueChange={(v) => onUpdateGlobalStyle({ position: v as CaptionStyle['position'] })}
                >
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Color */}
              <div>
                <Label className="text-xs text-gray-400">Font Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={globalStyle.fontColor}
                    onChange={(e) => onUpdateGlobalStyle({ fontColor: e.target.value })}
                    className="w-10 h-8 p-0 border-0 cursor-pointer"
                  />
                  <Input
                    value={globalStyle.fontColor}
                    onChange={(e) => onUpdateGlobalStyle({ fontColor: e.target.value })}
                    className="flex-1 bg-white/5 border-white/10"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <Label className="text-xs text-gray-400">Background</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={globalStyle.backgroundColor?.replace(/rgba?\([^)]+\)/, '#000000') || '#000000'}
                    onChange={(e) => onUpdateGlobalStyle({ backgroundColor: `${e.target.value}B3` })}
                    className="w-10 h-8 p-0 border-0 cursor-pointer"
                  />
                  <Input
                    value={globalStyle.backgroundColor || 'rgba(0,0,0,0.7)'}
                    onChange={(e) => onUpdateGlobalStyle({ backgroundColor: e.target.value })}
                    className="flex-1 bg-white/5 border-white/10"
                    placeholder="rgba(0,0,0,0.7)"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Caption List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Caption Segments</h4>

          {captions.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No captions yet</p>
              <p className="text-xs mt-1">Generate from audio or add manually</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {captions.map((caption) => (
                <div
                  key={caption.id}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    selectedCaptionId === caption.id
                      ? 'border-yellow-400 bg-yellow-500/20'
                      : 'border-white/10 bg-white/5 hover:border-yellow-500/50'
                  }`}
                  onClick={() => onSelectCaption(caption.id)}
                >
                  <p className="text-sm text-white truncate">{caption.text || 'Empty'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(caption.startTime)} - {formatTime(caption.endTime)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Caption Editor */}
        {selectedCaption && (
          <div className="border border-yellow-500/30 rounded-lg p-3 space-y-3 bg-yellow-500/5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-400">Edit Caption</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDuplicateCaption(selectedCaption.id)}
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onDeleteCaption(selectedCaption.id)}
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Text */}
            <div>
              <Label className="text-xs text-gray-400">Text</Label>
              <Textarea
                value={selectedCaption.text}
                onChange={(e) => onUpdateCaption(selectedCaption.id, { text: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 min-h-[60px]"
                placeholder="Caption text..."
              />
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-400">Start</Label>
                <Input
                  value={formatTime(selectedCaption.startTime)}
                  onChange={(e) => {
                    const time = parseTime(e.target.value);
                    if (!isNaN(time)) {
                      onUpdateCaption(selectedCaption.id, { startTime: time });
                    }
                  }}
                  className="mt-1 bg-white/5 border-white/10 font-mono text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400">End</Label>
                <Input
                  value={formatTime(selectedCaption.endTime)}
                  onChange={(e) => {
                    const time = parseTime(e.target.value);
                    if (!isNaN(time)) {
                      onUpdateCaption(selectedCaption.id, { endTime: time });
                    }
                  }}
                  className="mt-1 bg-white/5 border-white/10 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptionPanel;
