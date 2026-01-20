import { X, ChevronDown, ChevronUp, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import type { EditorClip, ClipTransition, TransitionType, TransitionTypeInfo } from '@/types/editor';
import { TRANSITION_TYPES, DEFAULT_TRANSITION, getTransitionInfo, getEffectiveDuration } from '@/types/editor';
import { useState } from 'react';

interface TransitionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clips: EditorClip[];
  selectedClipIndex: number | null;
  onUpdateTransition: (clipIndex: number, transition: ClipTransition | undefined) => void;
}

// Group transitions by category
const TRANSITION_CATEGORIES: { category: TransitionTypeInfo['category']; label: string }[] = [
  { category: 'basic', label: 'Basic' },
  { category: 'wipe', label: 'Wipe' },
  { category: 'slide', label: 'Slide' },
  { category: 'shape', label: 'Shape' },
  { category: 'special', label: 'Special' },
];

// Preview icons for different transition types
const getTransitionIcon = (type: TransitionType): string => {
  switch (type) {
    case 'none': return '⏹';
    case 'fade': return '🌅';
    case 'fadeblack': return '⬛';
    case 'fadewhite': return '⬜';
    case 'dissolve': return '✨';
    case 'wipeleft': return '◀';
    case 'wiperight': return '▶';
    case 'wipeup': return '▲';
    case 'wipedown': return '▼';
    case 'slideleft': return '⬅';
    case 'slideright': return '➡';
    case 'slideup': return '⬆';
    case 'slidedown': return '⬇';
    case 'circlecrop': return '⭕';
    case 'rectcrop': return '⬜';
    case 'circleopen': return '🔘';
    case 'circleclose': return '⚫';
    case 'pixelize': return '🔲';
    case 'radial': return '🌀';
    case 'smoothleft': return '↩';
    case 'smoothright': return '↪';
    case 'smoothup': return '↰';
    case 'smoothdown': return '↱';
    default: return '🎬';
  }
};

export const TransitionPanel = ({
  isOpen,
  onClose,
  clips,
  selectedClipIndex,
  onUpdateTransition,
}: TransitionPanelProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['basic']));

  // Can only add transitions to clips that have a next clip (not the last clip)
  const canHaveTransition = selectedClipIndex !== null && selectedClipIndex < clips.length - 1;
  const selectedClip = selectedClipIndex !== null ? clips[selectedClipIndex] : null;
  const nextClip = selectedClipIndex !== null && selectedClipIndex < clips.length - 1
    ? clips[selectedClipIndex + 1]
    : null;

  const currentTransition = selectedClip?.transitionOut || null;
  const currentType = currentTransition?.type || 'none';
  const currentDuration = currentTransition?.duration || DEFAULT_TRANSITION.duration;

  // Calculate max duration (can't be longer than half of either clip)
  const maxDuration = selectedClip && nextClip
    ? Math.min(
        getEffectiveDuration(selectedClip) / 2,
        getEffectiveDuration(nextClip) / 2,
        2.0 // Hard cap at 2 seconds
      )
    : 1.0;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleSelectType = (type: TransitionType) => {
    if (selectedClipIndex === null) return;

    if (type === 'none') {
      onUpdateTransition(selectedClipIndex, undefined);
    } else {
      onUpdateTransition(selectedClipIndex, {
        type,
        duration: Math.min(currentDuration, maxDuration),
      });
    }
  };

  const handleDurationChange = (duration: number) => {
    if (selectedClipIndex === null || currentType === 'none') return;
    onUpdateTransition(selectedClipIndex, {
      type: currentType,
      duration: Math.min(duration, maxDuration),
    });
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
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          Transitions
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-300 hover:text-white hover:bg-gray-800">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4">
          {/* No clip selected state */}
          {selectedClipIndex === null && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Select a clip to add transitions</p>
              <p className="text-xs mt-1">Click on a clip in the timeline</p>
            </div>
          )}

          {/* Last clip selected - no transition possible */}
          {selectedClipIndex !== null && !canHaveTransition && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">This is the last clip</p>
              <p className="text-xs mt-1">Transitions are applied between clips</p>
            </div>
          )}

          {/* Clip selected and can have transition */}
          {selectedClip && canHaveTransition && (
            <>
              {/* Current clip info */}
              <div className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Transition after</div>
                <div className="text-sm text-white font-medium truncate">
                  {selectedClip.fileName || `Clip ${selectedClipIndex + 1}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  → {nextClip?.fileName || `Clip ${selectedClipIndex + 2}`}
                </div>
              </div>

              {/* Current transition indicator */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-900/30 border border-blue-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getTransitionIcon(currentType)}</span>
                  <span className="text-sm text-white">
                    {currentType === 'none' ? 'No transition' : getTransitionInfo(currentType)?.label}
                  </span>
                </div>
                {currentType !== 'none' && (
                  <span className="text-xs text-gray-400">
                    {currentDuration.toFixed(1)}s
                  </span>
                )}
              </div>

              {/* Duration slider */}
              {currentType !== 'none' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <label className="text-xs text-gray-400">Duration</label>
                    </div>
                    <span className="text-xs text-white">{currentDuration.toFixed(1)}s</span>
                  </div>
                  <Slider
                    value={[currentDuration]}
                    min={0.1}
                    max={maxDuration}
                    step={0.1}
                    onValueChange={([value]) => handleDurationChange(value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>0.1s</span>
                    <span>{maxDuration.toFixed(1)}s max</span>
                  </div>
                </div>
              )}

              {/* Transition Type Selection */}
              <div className="space-y-2 pt-2 border-t border-gray-700">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  Select Transition Type
                </label>

                {/* Categories */}
                {TRANSITION_CATEGORIES.map(({ category, label }) => {
                  const transitions = TRANSITION_TYPES.filter(t => t.category === category);
                  const isExpanded = expandedCategories.has(category);

                  return (
                    <div key={category} className="space-y-1">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="flex items-center justify-between w-full py-2 text-sm text-gray-300 hover:text-white"
                      >
                        <span>{label}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="grid grid-cols-2 gap-2 pb-2">
                          {transitions.map((transition) => {
                            const isSelected = currentType === transition.type;
                            return (
                              <button
                                key={transition.type}
                                onClick={() => handleSelectType(transition.type)}
                                className={`p-3 rounded-lg border transition-all text-left ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-600/30'
                                    : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                                }`}
                                title={transition.description}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">{getTransitionIcon(transition.type)}</span>
                                  <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                    {transition.label}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500 truncate">
                                  {transition.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="space-y-2 pt-2 border-t border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectType('none')}
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                  disabled={currentType === 'none'}
                >
                  Remove Transition
                </Button>
              </div>
            </>
          )}

          {/* Bottom spacing */}
          <div className="h-16" />
        </div>
      </ScrollArea>
    </div>
  );
};

export default TransitionPanel;
