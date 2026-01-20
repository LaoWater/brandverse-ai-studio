import { Sparkles } from 'lucide-react';
import type { ClipTransition, TransitionType } from '@/types/editor';
import { getTransitionInfo } from '@/types/editor';

interface TransitionIndicatorProps {
  transition: ClipTransition | undefined;
  position: number; // pixel position
  scale: number; // pixels per second
  isSelected: boolean;
  onClick: () => void;
}

// Compact icon for timeline display
const getCompactTransitionIcon = (type: TransitionType): string => {
  switch (type) {
    case 'fade':
    case 'fadeblack':
    case 'fadewhite':
    case 'dissolve':
      return '◐';
    case 'wipeleft':
    case 'wiperight':
      return '◧';
    case 'wipeup':
    case 'wipedown':
      return '◫';
    case 'slideleft':
    case 'slideright':
    case 'smoothleft':
    case 'smoothright':
      return '⟷';
    case 'slideup':
    case 'slidedown':
    case 'smoothup':
    case 'smoothdown':
      return '⟷';
    case 'circlecrop':
    case 'circleopen':
    case 'circleclose':
      return '⊚';
    case 'rectcrop':
      return '▣';
    case 'pixelize':
      return '▤';
    case 'radial':
      return '◎';
    default:
      return '◇';
  }
};

export const TransitionIndicator = ({
  transition,
  position,
  scale,
  isSelected,
  onClick,
}: TransitionIndicatorProps) => {
  // No transition - show add button
  if (!transition || transition.type === 'none') {
    return (
      <button
        onClick={onClick}
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all ${
          isSelected
            ? 'w-8 h-8 bg-blue-600 border-2 border-blue-400'
            : 'w-6 h-6 bg-gray-700 border border-gray-500 hover:bg-gray-600 hover:border-blue-400'
        } rounded-full flex items-center justify-center group`}
        style={{ left: position }}
        title="Add transition"
      >
        <Sparkles className={`${isSelected ? 'w-4 h-4 text-white' : 'w-3 h-3 text-gray-400 group-hover:text-blue-400'}`} />
      </button>
    );
  }

  // Has transition - show indicator with duration visualization
  const transitionWidth = Math.max(transition.duration * scale, 24);
  const info = getTransitionInfo(transition.type);

  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all ${
        isSelected
          ? 'bg-blue-600/80 border-2 border-blue-400 shadow-lg shadow-blue-500/30'
          : 'bg-blue-700/60 border border-blue-500/50 hover:bg-blue-600/70 hover:border-blue-400'
      } rounded-md flex items-center justify-center gap-1 px-2 py-1`}
      style={{
        left: position,
        minWidth: transitionWidth,
      }}
      title={`${info?.label || transition.type} (${transition.duration.toFixed(1)}s)`}
    >
      <span className="text-sm">{getCompactTransitionIcon(transition.type)}</span>
      <span className={`text-[10px] font-medium ${isSelected ? 'text-white' : 'text-blue-200'}`}>
        {transition.duration.toFixed(1)}s
      </span>
    </button>
  );
};

export default TransitionIndicator;
