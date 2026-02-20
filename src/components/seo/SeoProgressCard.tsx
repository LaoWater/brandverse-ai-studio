import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, Globe, Search, Brain, BarChart3, Save, Shield } from 'lucide-react';
import { FaRedditAlien, FaTiktok, FaXTwitter } from 'react-icons/fa6';
import { Card, CardContent } from '@/components/ui/card';

export interface SeoStage {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  icon: React.ElementType;
}

// Predefined stage definitions for each SEO operation
export const ANALYSIS_STAGES: SeoStage[] = [
  { id: 'crawl', label: 'Crawling Website', description: 'Fetching and parsing your site content, structure, and metadata', status: 'pending', icon: Globe },
  { id: 'search-google', label: 'Searching Google', description: 'Checking your presence across Google search results', status: 'pending', icon: Search },
  { id: 'search-social', label: 'Scanning Social Platforms', description: 'Reddit, TikTok, YouTube, LinkedIn, Twitter — checking where you appear', status: 'pending', icon: FaRedditAlien },
  { id: 'competitors', label: 'Analyzing Competitors', description: 'Comparing your visibility against competitors on each platform', status: 'pending', icon: BarChart3 },
  { id: 'llm', label: 'AI Deep Analysis', description: 'Our AI is synthesizing all data into actionable insights and scores', status: 'pending', icon: Brain },
  { id: 'save', label: 'Saving Results', description: 'Storing your analysis for the SEO Engine', status: 'pending', icon: Save },
];

export const ENGAGEMENT_STAGES: SeoStage[] = [
  { id: 'search', label: 'Searching Platforms', description: 'Scanning Reddit, YouTube, Quora, and forums for relevant discussions', status: 'pending', icon: Search },
  { id: 'filter', label: 'Filtering & Ranking', description: 'AI is evaluating relevance and ranking the best opportunities', status: 'pending', icon: Brain },
  { id: 'verify', label: 'Verifying URLs', description: 'Confirming links are active and accessible', status: 'pending', icon: Shield },
  { id: 'responses', label: 'Crafting Responses', description: 'Generating suggested replies in your brand voice', status: 'pending', icon: FaXTwitter },
  { id: 'save', label: 'Saving Opportunities', description: 'Storing verified engagement opportunities', status: 'pending', icon: Save },
];

export const BLOG_STAGES: SeoStage[] = [
  { id: 'research', label: 'Researching Topic', description: 'Analyzing your SEO data to find the best angle', status: 'pending', icon: Search },
  { id: 'outline', label: 'Creating Outline', description: 'Structuring the post for maximum SEO impact', status: 'pending', icon: BarChart3 },
  { id: 'writing', label: 'Writing Content', description: 'AI is crafting your SEO-optimized blog post', status: 'pending', icon: Brain },
  { id: 'save', label: 'Saving Post', description: 'Storing your new blog post', status: 'pending', icon: Save },
];

interface SeoProgressCardProps {
  stages: SeoStage[];
  title: string;
  subtitle?: string;
  error?: string | null;
}

const SeoProgressCard: React.FC<SeoProgressCardProps> = ({ stages, title, subtitle, error }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = stages.filter(s => s.status === 'completed').length;
  const progress = Math.round((completedCount / stages.length) * 100);
  const currentStage = stages.find(s => s.status === 'in-progress');
  const hasError = !!error || stages.some(s => s.status === 'error');

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const getStatusIcon = (stage: SeoStage) => {
    const Icon = stage.icon;
    const size = "w-4 h-4";

    switch (stage.status) {
      case 'completed':
        return <CheckCircle className={`${size} text-green-400`} />;
      case 'in-progress':
        return <Icon className={`${size} text-accent animate-pulse`} />;
      case 'error':
        return <XCircle className={`${size} text-red-400`} />;
      default:
        return <Icon className={`${size} text-gray-600`} />;
    }
  };

  return (
    <Card className="cosmic-card border-accent/20 overflow-hidden">
      <CardContent className="p-0">
        {/* Header with progress bar */}
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            <span className="text-xs text-gray-500">{formatTime(elapsed)}</span>
          </div>
          {subtitle && <p className="text-gray-400 text-sm mb-3">{subtitle}</p>}

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                hasError ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-accent'
              }`}
              style={{ width: `${Math.max(progress, currentStage ? 5 : 0)}%` }}
            />
          </div>
        </div>

        {/* Stage list */}
        <div className="px-5 pb-5 space-y-1">
          {stages.map((stage) => {
            const isActive = stage.status === 'in-progress';
            const isDone = stage.status === 'completed';
            const isError = stage.status === 'error';
            const isPending = stage.status === 'pending';

            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive ? 'bg-accent/10 ring-1 ring-accent/30' :
                  isDone ? 'bg-white/[0.03]' :
                  isError ? 'bg-red-500/10' :
                  'opacity-50'
                }`}
              >
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {getStatusIcon(stage)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isDone ? 'text-gray-400' :
                    isActive ? 'text-white' :
                    isError ? 'text-red-400' :
                    'text-gray-500'
                  }`}>
                    {stage.label}
                  </p>
                  {isActive && (
                    <p className="text-xs text-gray-400 mt-0.5">{stage.description}</p>
                  )}
                </div>
                {isActive && (
                  <Loader2 className="w-3.5 h-3.5 text-accent animate-spin flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-5 mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeoProgressCard;
