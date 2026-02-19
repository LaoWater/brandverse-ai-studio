import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, Video as VideoIcon, Search, Check } from "lucide-react";
import { getUserMediaLibrary, type MediaFile } from "@/services/mediaStudioService";

const VIDEO_PLACEHOLDER = "/logo-simple.png";

type TabFilter = 'all' | 'image' | 'video';

interface MediaBrowserSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  companyId: string | null;
  onSelectMedia: (media: {
    mediaId: string;
    url: string;
    thumbnailUrl: string | null;
    fileType: 'image' | 'video';
    fileName: string;
  }) => void;
}

const ITEMS_PER_PAGE = 15;

const MediaBrowserSheet = ({ isOpen, onClose, userId, companyId, onSelectMedia }: MediaBrowserSheetProps) => {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>('all');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    getUserMediaLibrary(userId, companyId)
      .then(data => setMedia(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, userId, companyId]);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [search, tab]);

  const filtered = useMemo(() => {
    let items = media;
    if (tab !== 'all') {
      items = items.filter(m => m.file_type === tab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(m =>
        (m.file_name || '').toLowerCase().includes(q) ||
        (m.prompt || '').toLowerCase().includes(q) ||
        (m.custom_title || '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [media, tab, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleSelect = (item: MediaFile) => {
    onSelectMedia({
      mediaId: item.id,
      url: item.public_url,
      thumbnailUrl: item.thumbnail_url,
      fileType: item.file_type,
      fileName: item.custom_title || item.file_name,
    });
    onClose();
  };

  const formatDate = (dateStr: string) => {
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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="border-l border-border !w-[400px] sm:!w-[440px] !max-w-[440px] !p-0 flex flex-col bg-card backdrop-blur-xl">
        <SheetTitle className="sr-only">Media Library</SheetTitle>
        <div className="px-5 pt-5 pb-4 border-b border-border space-y-3 flex-shrink-0">
          <div className="pr-8">
            <h3 className="text-foreground text-lg font-semibold">Media Library</h3>
            <p className="text-muted-foreground text-sm mt-0.5">Select media from your MediaStudio library</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <input
              placeholder="Search media..."
              className="w-full bg-secondary/50 border border-border text-foreground pl-9 pr-3 h-9 text-sm rounded-md placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'image', 'video'] as TabFilter[]).map(t => (
              <Button
                key={t}
                type="button"
                variant="ghost"
                size="sm"
                className={`text-xs capitalize ${
                  tab === t ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setTab(t)}
              >
                {t === 'image' && <ImageIcon className="w-3 h-3 mr-1" />}
                {t === 'video' && <VideoIcon className="w-3 h-3 mr-1" />}
                {t}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? 'No media matching your search' : 'No media in your library yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {visible.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors text-left group"
                  onClick={() => handleSelect(item)}
                >
                  <div className="w-12 h-12 rounded bg-secondary overflow-hidden flex-shrink-0 relative">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = VIDEO_PLACEHOLDER;
                          (e.target as HTMLImageElement).className = "w-full h-full object-contain p-1.5 opacity-60";
                        }}
                      />
                    ) : item.file_type === 'video' ? (
                      <img
                        src={VIDEO_PLACEHOLDER}
                        alt=""
                        className="w-full h-full object-contain p-1.5 opacity-60"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                    )}
                    {item.file_type === 'video' && (
                      <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded px-1">
                        <VideoIcon className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {item.custom_title || item.file_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {item.model_used}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                      <Check className="w-4 h-4 text-accent-foreground" />
                    </div>
                  </div>
                </button>
              ))}

              {hasMore && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground mt-2"
                  onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                >
                  Load more ({filtered.length - visibleCount} remaining)
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MediaBrowserSheet;
