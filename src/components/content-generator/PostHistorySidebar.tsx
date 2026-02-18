import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft, ChevronRight, Search, Image as ImageIcon,
  Video as VideoIcon, Instagram, Facebook, Linkedin, BarChart3
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { getUserPosts } from "@/services/supabaseService";
import { getPostHistoryStats } from "@/services/postHistoryService";
import WordCloud from "./WordCloud";

interface PostHistorySidebarProps {
  companyId: string | null;
  onWordClick?: (word: string) => void;
}

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: FaXTwitter,
};

const PLATFORM_COLORS_BG: Record<string, string> = {
  instagram: 'bg-pink-500',
  facebook: 'bg-blue-700',
  linkedin: 'bg-blue-500',
  twitter: 'bg-sky-500',
};

const PLATFORM_COLORS_TEXT: Record<string, string> = {
  instagram: 'text-pink-400',
  facebook: 'text-blue-400',
  linkedin: 'text-blue-400',
  twitter: 'text-sky-400',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  posted: 'bg-blue-500/20 text-blue-400',
};

const ITEMS_PER_PAGE = 20;

const PostHistorySidebar = ({ companyId, onWordClick }: PostHistorySidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['postHistory', companyId],
    queryFn: () => getUserPosts(companyId!),
    enabled: !!companyId,
    staleTime: 30_000,
  });

  const stats = useMemo(() => getPostHistoryStats(posts), [posts]);

  const debounce = useCallback((fn: (val: string) => void, delay: number) => {
    let timer: ReturnType<typeof setTimeout>;
    return (val: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(val), delay);
    };
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((val: string) => {
      setSearch(val);
      setVisibleCount(ITEMS_PER_PAGE);
    }, 300),
    [debounce]
  );

  const filtered = useMemo(() => {
    let items = posts;
    if (platformFilter) {
      items = items.filter(p => p.platform_type === platformFilter);
    }
    if (statusFilter) {
      items = items.filter(p => (p.status || 'draft') === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.details || '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [posts, platformFilter, statusFilter, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  const maxPlatformCount = Math.max(...Object.values(stats.platformCounts), 1);

  // Sorted platforms for collapsed mini-view
  const sortedPlatforms = useMemo(() =>
    Object.entries(stats.platformCounts).sort((a, b) => b[1] - a[1]),
    [stats.platformCounts]
  );

  return (
    <div
      className="hidden lg:flex flex-col flex-shrink-0 bg-gray-900/80 backdrop-blur-sm border-r border-white/10 rounded-l-lg overflow-hidden transition-all duration-300 ease-in-out"
      style={{ width: isExpanded ? 320 : 72 }}
    >
      {/* Header - always visible */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
        {isExpanded ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <BarChart3 className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm font-medium text-white truncate">Post History</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400 flex-shrink-0">
                {stats.totalPosts}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-7 h-7 p-0 text-gray-400 hover:text-white flex-shrink-0"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center w-full gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
              onClick={() => setIsExpanded(true)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Collapsed mini-view */}
      {!isExpanded && (
        <div className="flex flex-col items-center py-4 px-1.5 gap-4 flex-1">
          {/* Total posts count */}
          <div className="text-center">
            <span className="text-lg font-bold text-white">{stats.totalPosts}</span>
            <p className="text-[8px] text-gray-500 uppercase tracking-wider mt-0.5">Posts</p>
          </div>

          {/* Platform icons with counts */}
          <div className="flex flex-col items-center gap-2.5">
            {sortedPlatforms.map(([platform, count]) => {
              const Icon = PLATFORM_ICONS[platform];
              if (!Icon) return null;
              return (
                <div key={platform} className="flex flex-col items-center gap-0.5" title={`${platform}: ${count}`}>
                  <Icon className={`w-4 h-4 ${PLATFORM_COLORS_TEXT[platform] || 'text-gray-400'}`} />
                  <span className="text-[9px] text-gray-500 font-medium">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Mini status dots */}
          {Object.keys(stats.statusCounts).length > 0 && (
            <div className="flex flex-col items-center gap-2 mt-1">
              <div className="w-6 h-px bg-white/10" />
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <div key={status} className="flex flex-col items-center gap-0.5" title={`${status}: ${count}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    status === 'draft' ? 'bg-yellow-500' :
                    status === 'approved' ? 'bg-green-500' :
                    status === 'posted' ? 'bg-blue-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-[8px] text-gray-500">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                placeholder="Search posts..."
                className="w-full bg-white/5 border border-white/10 text-white text-xs pl-8 pr-3 h-8 rounded-md placeholder:text-gray-500 focus:outline-none focus:border-accent"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>

            {/* Platform filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(PLATFORM_ICONS).map(platform => {
                const Icon = PLATFORM_ICONS[platform];
                const count = stats.platformCounts[platform] || 0;
                const isActive = platformFilter === platform;
                return (
                  <button
                    key={platform}
                    type="button"
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                    onClick={() => setPlatformFilter(isActive ? null : platform)}
                  >
                    <Icon className="w-3 h-3" />
                    {count}
                  </button>
                );
              })}
            </div>

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  type="button"
                  className={`px-2 py-0.5 rounded-full text-[10px] capitalize transition-colors ${
                    statusFilter === status
                      ? 'bg-accent text-accent-foreground'
                      : STATUS_COLORS[status] || 'bg-white/5 text-gray-400'
                  }`}
                  onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                >
                  {status} ({count})
                </button>
              ))}
            </div>

            {/* Platform breakdown bars */}
            {stats.totalPosts > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Platform Breakdown</p>
                {Object.entries(stats.platformCounts).map(([platform, count]) => (
                  <div key={platform} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-16 capitalize truncate">{platform}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${PLATFORM_COLORS_BG[platform] || 'bg-gray-500'}`}
                        style={{ width: `${(count / maxPlatformCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Word Cloud */}
            {stats.wordFrequency.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Trending Words</p>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <WordCloud words={stats.wordFrequency} onWordClick={onWordClick} />
                </div>
              </div>
            )}

            {/* Post list */}
            <div className="space-y-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Recent Posts {filtered.length !== posts.length && `(${filtered.length} filtered)`}
              </p>

              {isLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : visible.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  {companyId ? 'No posts yet' : 'Select a company'}
                </p>
              ) : (
                <>
                  {visible.map(post => {
                    const PlatformIcon = PLATFORM_ICONS[post.platform_type];
                    return (
                      <div
                        key={post.id}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        {PlatformIcon && (
                          <PlatformIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{post.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] px-1 py-0.5 rounded ${STATUS_COLORS[post.status || 'draft'] || 'bg-white/5 text-gray-400'}`}>
                              {post.status || 'draft'}
                            </span>
                            <span className="text-[9px] text-gray-500">{formatDate(post.created_date)}</span>
                            {post.has_picture && <ImageIcon className="w-2.5 h-2.5 text-gray-500" />}
                            {post.has_video && <VideoIcon className="w-2.5 h-2.5 text-gray-500" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {hasMore && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-[10px] text-gray-400 hover:text-white mt-1"
                      onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                    >
                      Load more ({filtered.length - visibleCount} remaining)
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default PostHistorySidebar;
