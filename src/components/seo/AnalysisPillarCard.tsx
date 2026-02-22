import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AnalysisPillarCardProps {
  icon: React.ReactNode;
  title: string;
  score: number;
  summary: string;
  color: string; // tailwind color class prefix like 'blue', 'purple', 'orange', 'green'
  children?: React.ReactNode;
  defaultExpanded?: boolean;
}

const SCORE_COLORS = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-red-400',
};

const AnalysisPillarCard: React.FC<AnalysisPillarCardProps> = ({
  icon,
  title,
  score,
  summary,
  color,
  children,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const scoreLevel = score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low';
  const scoreColor = SCORE_COLORS[scoreLevel];

  // SVG arc for score gauge
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const ringColor =
    color === 'blue' ? 'stroke-blue-400' :
    color === 'purple' ? 'stroke-purple-400' :
    color === 'orange' ? 'stroke-orange-400' :
    color === 'green' ? 'stroke-green-400' :
    'stroke-accent';

  const bgGlow =
    color === 'blue' ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40' :
    color === 'purple' ? 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40' :
    color === 'orange' ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40' :
    color === 'green' ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40' :
    'bg-white/5 border-white/20';

  return (
    <div className={`rounded-xl border transition-all duration-200 ${bgGlow}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 text-left"
      >
        {/* Score ring */}
        <div className="flex-shrink-0 relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32" cy="32" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-white/10"
            />
            <circle
              cx="32" cy="32" r={radius}
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              className={ringColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${scoreColor}`}>{score}</span>
          </div>
        </div>

        {/* Title & summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex-shrink-0">{icon}</span>
            <h3 className="text-white font-semibold truncate">{title}</h3>
          </div>
          <p className="text-gray-400 text-sm line-clamp-2">{summary}</p>
        </div>

        {/* Expand toggle */}
        {children && (
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && children && (
        <div className="px-4 pb-4 pt-0 border-t border-white/5">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPillarCard;
