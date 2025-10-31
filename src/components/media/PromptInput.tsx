import { Textarea } from '@/components/ui/textarea';
import { useMediaStudio } from '@/contexts/MediaStudioContext';
import { Wand2 } from 'lucide-react';

const PromptInput = () => {
  const { prompt, setPrompt } = useMediaStudio();

  const maxLength = 2000;
  const characterCount = prompt.length;
  const percentage = (characterCount / maxLength) * 100;

  const placeholderText = 'Describe the image you want to create... Include details about subject, style, composition, lighting, colors, and mood.';

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-primary" />
        Your Creative Prompt
      </label>

      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              setPrompt(e.target.value);
            }
          }}
          placeholder={placeholderText}
          className="min-h-[180px] bg-background/50 border-primary/20 text-white placeholder:text-gray-500 resize-none focus:border-primary/50 transition-colors"
          style={{
            boxShadow: prompt.length > 0 ? '0 0 20px rgba(91, 95, 238, 0.15)' : 'none',
          }}
        />

        {/* Character Counter */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/20">
            <div className="relative w-8 h-8">
              <svg className="transform -rotate-90 w-8 h-8">
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke={percentage > 90 ? '#FF6B6B' : percentage > 70 ? '#FFD93D' : '#5B5FEE'}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 12}`}
                  strokeDashoffset={`${2 * Math.PI * 12 * (1 - percentage / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
            </div>
            <span className={`text-xs font-medium transition-colors ${
              percentage > 90 ? 'text-red-400' : percentage > 70 ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {characterCount}/{maxLength}
            </span>
          </div>
        </div>
      </div>

      {/* Prompt Tips */}
      {prompt.length === 0 && (
        <div className="text-xs text-gray-500 space-y-1 pl-1">
          <p className="flex items-center gap-1">
            💡 <span>Tip: Be specific and descriptive for best results</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default PromptInput;
