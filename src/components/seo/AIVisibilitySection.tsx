import { Badge } from '@/components/ui/badge';
import { Brain, Quote, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import type { AIVisibilityDetails } from '@/services/seoService';

interface AIVisibilitySectionProps {
  data: AIVisibilityDetails;
}

const AWARENESS_CONFIG = {
  none: { label: 'Not Recognized', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  partial: { label: 'Partially Known', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  good: { label: 'Well Known', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  excellent: { label: 'Highly Recognized', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

const AIVisibilitySection: React.FC<AIVisibilitySectionProps> = ({ data }) => {
  const chatgpt = data.systems?.chatgpt;

  return (
    <div className="space-y-4">
      {/* ChatGPT card */}
      {chatgpt && (
        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/15">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">ChatGPT</span>
              <span className="text-xs text-gray-500">({chatgpt.model})</span>
            </div>
            <Badge className={`text-xs border ${AWARENESS_CONFIG[chatgpt.awareness]?.color || AWARENESS_CONFIG.none.color}`}>
              {AWARENESS_CONFIG[chatgpt.awareness]?.label || 'Unknown'}
            </Badge>
          </div>

          {/* AI's response quote */}
          {chatgpt.response_summary && (
            <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="flex items-start gap-2">
                <Quote className="w-3.5 h-3.5 text-purple-400/50 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-300 italic line-clamp-4">
                  {chatgpt.response_summary}
                </p>
              </div>
            </div>
          )}

          {/* Accuracy */}
          <div className="flex items-start gap-2 text-xs">
            {chatgpt.knows_company ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-gray-400">{chatgpt.accuracy_notes || 'No accuracy assessment available.'}</span>
          </div>
        </div>
      )}

      {/* Key findings */}
      {data.key_findings && data.key_findings.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Findings</p>
          <div className="space-y-1.5">
            {data.key_findings.map((finding, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-purple-400 mt-0.5 text-xs">•</span>
                <span className="text-gray-300">{finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">How to Improve</p>
          <div className="space-y-1.5">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIVisibilitySection;
