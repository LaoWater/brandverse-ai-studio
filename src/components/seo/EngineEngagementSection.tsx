import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  RefreshCw,
  Coins,
  ExternalLink,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  AlertCircle,
  Info,
  MessageSquare,
  X,
} from 'lucide-react';
import { FaRedditAlien, FaXTwitter, FaYoutube, FaLinkedin, FaQuora } from 'react-icons/fa6';
import SeoProgressCard, { type SeoStage } from '@/components/seo/SeoProgressCard';

const platformStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  reddit: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: <FaRedditAlien className="w-3 h-3 mr-1" /> },
  twitter: { bg: 'bg-sky-500/20', text: 'text-sky-400', icon: <FaXTwitter className="w-3 h-3 mr-1" /> },
  youtube: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <FaYoutube className="w-3 h-3 mr-1" /> },
  linkedin: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <FaLinkedin className="w-3 h-3 mr-1" /> },
  quora: { bg: 'bg-red-300/20', text: 'text-red-300', icon: <FaQuora className="w-3 h-3 mr-1" /> },
  forum: { bg: 'bg-white/10', text: 'text-gray-300', icon: <MessageSquare className="w-3 h-3 mr-1" /> },
};

interface EngineEngagementSectionProps {
  engagementOpportunities: any[];
  isSearchingEngagement: boolean;
  engagementStages: SeoStage[];
  engagementError: string | null;
  searchEngagement: () => void;
  updateEngagementStatus: (id: string, status: 'used' | 'dismissed') => Promise<void>;
  copyToClipboard: (text: string, id: string) => Promise<void>;
  copiedId: string | null;
  handleViewOpportunity: (url: string) => void;
  userCredits: number;
  engagementCredits: number;
  onRegenerateWithKept: (keptIds: string[]) => Promise<void>;
  compact?: boolean;
}

const EngineEngagementSection: React.FC<EngineEngagementSectionProps> = ({
  engagementOpportunities,
  isSearchingEngagement,
  engagementStages,
  engagementError,
  searchEngagement,
  updateEngagementStatus,
  copyToClipboard,
  copiedId,
  handleViewOpportunity,
  userCredits,
  engagementCredits,
  onRegenerateWithKept,
  compact = false,
}) => {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pendingOpps = (engagementOpportunities || []).filter((o: any) => o.status === 'pending');

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enterSelectMode = () => {
    setSelectMode(true);
    setSelectedIds(new Set());
  };

  const cancelSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleRegenerate = async () => {
    const keptIds = Array.from(selectedIds);
    setSelectMode(false);
    setSelectedIds(new Set());
    await onRegenerateWithKept(keptIds);
  };

  return (
    <div className="space-y-6">
      {/* Engagement Finder */}
      <Card className="cosmic-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Engagement Finder
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-medium px-1.5 py-0">
              Beta
            </Badge>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Find real discussions on Reddit, YouTube, Quora, and forums where you can engage
          </CardDescription>
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-gray-500 leading-relaxed">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
            <span>
              Results sourced via web search. Most platforms actively restrict indexing and automated access, which means link freshness and availability may vary. We're building direct platform integrations to improve accuracy — always verify links before engaging.
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          {!isSearchingEngagement && (
            <>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                onClick={searchEngagement}
                disabled={userCredits < engagementCredits}
              >
                <RefreshCw className="mr-2 w-5 h-5" />
                Find Opportunities
                <span className="ml-2 flex items-center text-sm opacity-80">
                  <Coins className="w-4 h-4 mr-1" />
                  {engagementCredits}
                </span>
              </Button>
              {pendingOpps.length > 0 && !selectMode && (
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={enterSelectMode}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Find More
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Engagement Search Progress */}
      {isSearchingEngagement && engagementStages.length > 0 && (
        <SeoProgressCard
          stages={engagementStages}
          title="Finding Engagement Opportunities"
          subtitle="Scanning platforms for relevant discussions"
          error={engagementError}
        />
      )}

      {/* Select mode floating bar */}
      {selectMode && pendingOpps.length > 0 && (
        <div className="sticky top-20 z-30 p-4 rounded-xl bg-gradient-to-r from-primary/90 to-accent/90 backdrop-blur-sm border border-white/20 shadow-lg flex items-center justify-between gap-4">
          <div className="text-white text-sm">
            <span className="font-semibold">{selectedIds.size}</span> selected to keep
            <span className="text-white/60 ml-1">
              ({pendingOpps.length - selectedIds.size} will be replaced)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={cancelSelectMode}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-white text-primary hover:bg-white/90 font-medium"
              onClick={handleRegenerate}
              disabled={userCredits < engagementCredits}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Regenerate
              <span className="ml-1 flex items-center text-xs opacity-80">
                <Coins className="w-3 h-3 mr-0.5" />
                {engagementCredits}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Engagement Opportunities */}
      {pendingOpps.length > 0 && (
        <Card className="cosmic-card">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Engagement Opportunities
              <Badge variant="outline" className="ml-2 text-xs border-white/20 text-gray-400">
                {pendingOpps.length} pending
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
              {pendingOpps.map((opportunity: any) => {
                const pStyle = platformStyles[opportunity.platform] || { bg: 'bg-white/10', text: 'text-gray-300', icon: null };
                const isVerified = opportunity.url_verified === true;
                const isSelected = selectedIds.has(opportunity.id);

                return (
                  <div
                    key={opportunity.id}
                    className={`p-4 bg-white/5 rounded-lg border transition-all ${
                      selectMode
                        ? isSelected
                          ? 'border-accent/60 bg-accent/5'
                          : 'border-white/10 opacity-60'
                        : 'border-white/10'
                    }`}
                  >
                    {/* Select checkbox */}
                    {selectMode && (
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(opportunity.id)}
                          className="border-white/30 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                        <span className="text-xs text-gray-400">
                          {isSelected ? 'Keeping this opportunity' : 'Will be replaced'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={`${pStyle.bg} ${pStyle.text} border-0 capitalize`}>
                        {pStyle.icon}
                        {opportunity.platform}
                      </Badge>
                      {opportunity.relevance_score && (
                        <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                          {opportunity.relevance_score}% match
                        </Badge>
                      )}
                      {isVerified ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified URL
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>

                    <h4 className="text-white font-medium mb-2">{opportunity.source_title}</h4>

                    {opportunity.source_content && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {opportunity.source_content}
                      </p>
                    )}

                    {(opportunity.created_at || opportunity.discovered_via) && (
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        {opportunity.created_at && (
                          <span>Found {new Date(opportunity.created_at).toLocaleDateString()}</span>
                        )}
                        {opportunity.discovered_via && (
                          <span>via {
                            ({ reddit_api: 'Reddit API', youtube_api: 'YouTube API', serper: 'Web Search' } as Record<string, string>)[opportunity.discovered_via]
                            || opportunity.discovered_via
                          }</span>
                        )}
                      </div>
                    )}

                    {opportunity.suggested_response && (
                      <div className="bg-accent/10 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-300">{opportunity.suggested_response}</p>
                      </div>
                    )}

                    {!selectMode && (
                      <div className="flex items-center gap-2">
                        {opportunity.source_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => handleViewOpportunity(opportunity.source_url)}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => copyToClipboard(opportunity.suggested_response || '', opportunity.id)}
                        >
                          {copiedId === opportunity.id ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          onClick={() => updateEngagementStatus(opportunity.id, 'used')}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => updateEngagementStatus(opportunity.id, 'dismissed')}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {engagementOpportunities && engagementOpportunities.length > 0 && pendingOpps.length === 0 && !isSearchingEngagement && (
        <Card className="cosmic-card">
          <CardContent className="py-8 text-center">
            <p className="text-gray-400">
              No pending opportunities. Click "Find Opportunities" to search for more.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EngineEngagementSection;
