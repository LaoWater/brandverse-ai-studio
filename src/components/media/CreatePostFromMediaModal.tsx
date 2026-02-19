import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Send,
  Loader2,
  Image as ImageIcon,
  Video,
  Check,
  Pencil,
  Wand2,
  Save,
  Coins,
} from 'lucide-react';
import { FaInstagram, FaFacebook, FaLinkedin, FaTiktok } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { MediaFile } from '@/services/mediaStudioService';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUserCredits, POST_FROM_MEDIA_CREDITS } from '@/services/creditsService';
import { saveGeneratedPostsToSupabase } from '@/services/supabaseService';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import ComingSoonPostDialog from '@/components/shared/ComingSoonPostDialog';

type PlatformType = 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok';

interface CreatePostFromMediaModalProps {
  media: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const PLATFORMS: {
  id: PlatformType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'from-purple-500 to-pink-500' },
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'from-blue-500 to-blue-700' },
  { id: 'twitter', name: 'X', icon: FaXTwitter, color: 'from-gray-700 to-gray-900' },
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'from-blue-600 to-blue-800' },
  { id: 'tiktok', name: 'TikTok', icon: FaTiktok, color: 'from-gray-900 to-pink-500' },
];

const CreatePostFromMediaModal = ({
  media,
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostFromMediaModalProps) => {
  const { selectedCompany } = useCompany();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformType>>(new Set());
  const [mode, setMode] = useState<'manual' | 'ai'>('ai');
  const [userTitle, setUserTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [generatedPosts, setGeneratedPosts] = useState<Record<string, { title: string; content: string; hashtags?: string[] }>>({});
  const [editedPosts, setEditedPosts] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [autoPostPlatform, setAutoPostPlatform] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedPlatforms(new Set());
      setMode('ai');
      setUserTitle('');
      setManualContent('');
      setGeneratedPosts({});
      setEditedPosts({});
      setIsGenerating(false);
      setIsSaving(false);
      setAutoPostPlatform(null);
      loadCredits();
    }
  }, [isOpen]);

  const loadCredits = useCallback(async () => {
    const credits = await getUserCredits();
    setAvailableCredits(credits?.available_credits ?? 0);
  }, []);

  const togglePlatform = (platform: PlatformType) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const creditsNeeded = selectedPlatforms.size * POST_FROM_MEDIA_CREDITS.AI_GENERATED_TEXT;
  const hasEnoughCredits = availableCredits >= creditsNeeded;

  const handleGenerate = async () => {
    if (!media || !selectedCompany || selectedPlatforms.size === 0) return;

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${(supabase as any).supabaseUrl}/functions/v1/generate-post-text`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            company_id: selectedCompany.id,
            media_url: media.public_url,
            media_type: media.file_type,
            platforms: Array.from(selectedPlatforms),
            user_title: userTitle || undefined,
            media_prompt: media.prompt || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate post text');
      }

      setGeneratedPosts(data.posts);
      setEditedPosts({});
      await loadCredits();

      toast({
        title: 'Content Generated',
        description: `Created post text for ${selectedPlatforms.size} platform${selectedPlatforms.size > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Error generating post text:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPostContent = (platform: string): string => {
    if (mode === 'manual') return manualContent;
    if (editedPosts[platform] !== undefined) return editedPosts[platform];
    const gen = generatedPosts[platform];
    if (!gen) return '';
    const hashtags = gen.hashtags?.map(h => `#${h}`).join(' ') || '';
    return `${gen.content}${hashtags ? `\n\n${hashtags}` : ''}`;
  };

  const getPostTitle = (platform: string): string => {
    if (mode === 'manual') return userTitle || media?.custom_title || 'Untitled Post';
    return generatedPosts[platform]?.title || userTitle || media?.custom_title || 'Untitled Post';
  };

  const handleSave = async () => {
    if (!media || !selectedCompany || selectedPlatforms.size === 0) return;

    setIsSaving(true);
    try {
      const postsToSave = Array.from(selectedPlatforms).map(platform => ({
        company_id: selectedCompany.id,
        title: getPostTitle(platform),
        platform_type: platform as any,
        details: getPostContent(platform) || null,
        has_picture: media.file_type === 'image' ? media.public_url : null,
        has_video: media.file_type === 'video' ? media.public_url : null,
        status: 'draft' as const,
        metadata: {
          source: 'media_studio',
          media_id: media.id,
          ai_generated: mode === 'ai',
        },
      }));

      const { error } = await saveGeneratedPostsToSupabase(postsToSave);

      if (error) throw error;

      toast({
        title: 'Posts Saved',
        description: `${postsToSave.length} draft post${postsToSave.length > 1 ? 's' : ''} created successfully.`,
      });

      onPostCreated?.();
      onClose();
    } catch (error) {
      console.error('Error saving posts:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canGenerate = selectedPlatforms.size > 0 && !isGenerating && hasEnoughCredits;
  const canSave = selectedPlatforms.size > 0 && !isSaving && (
    mode === 'manual' ? manualContent.trim().length > 0 : Object.keys(generatedPosts).length > 0
  );

  if (!media) return null;

  const isVideo = media.file_type === 'video';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto p-0" data-theme-aware>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-foreground text-xl flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Create Post from Media
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-0 md:gap-6 p-6 pt-4">
            {/* Left: Media Preview */}
            <div className="w-full md:w-[280px] flex-shrink-0 space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-black/30 border border-border">
                {isVideo ? (
                  <video
                    src={media.public_url}
                    className="w-full aspect-video object-contain"
                    controls
                    muted
                  />
                ) : (
                  <img
                    src={media.public_url}
                    alt={media.custom_title || 'Media'}
                    className="w-full aspect-video object-contain"
                  />
                )}
                <Badge className={cn(
                  'absolute top-2 left-2 text-xs text-white',
                  isVideo ? 'bg-purple-500/80' : 'bg-blue-500/80',
                )}>
                  {isVideo ? <Video className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
                  {media.file_type}
                </Badge>
              </div>

              {media.custom_title && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Title</p>
                  <p className="text-sm text-foreground">{media.custom_title}</p>
                </div>
              )}

              {media.prompt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prompt</p>
                  <p className="text-xs text-muted-foreground line-clamp-4 bg-secondary/50 rounded p-2">
                    {media.prompt}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Coins className="w-3 h-3" />
                <span>{availableCredits} credits available</span>
              </div>
            </div>

            {/* Right: Post Configuration */}
            <div className="flex-1 space-y-5 min-w-0">
              {/* Platform Selection */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Select Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(platform => {
                    const isSelected = selectedPlatforms.has(platform.id);
                    const Icon = platform.icon;
                    return (
                      <button
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
                          isSelected
                            ? 'border-primary bg-primary/20 text-foreground'
                            : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-foreground',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{platform.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Mode Toggle */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Mode:</Label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setMode('manual')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
                      mode === 'manual'
                        ? 'bg-primary/20 text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Pencil className="w-3 h-3" />
                    Manual
                  </button>
                  <button
                    onClick={() => setMode('ai')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
                      mode === 'ai'
                        ? 'bg-primary/20 text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Wand2 className="w-3 h-3" />
                    AI Generate
                  </button>
                </div>
              </div>

              {/* Title / Topic */}
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  {mode === 'ai' ? 'Topic / Title (optional)' : 'Post Title'}
                </Label>
                <Input
                  value={userTitle}
                  onChange={(e) => setUserTitle(e.target.value)}
                  placeholder={mode === 'ai' ? 'Guide the AI with a topic or title...' : 'Enter post title...'}
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* AI Generate Button */}
              {mode === 'ai' && (
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Text
                      {selectedPlatforms.size > 0 && (
                        <Badge variant="outline" className="ml-2 border-white/30 text-white text-xs">
                          {creditsNeeded} credits
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              )}

              {!hasEnoughCredits && mode === 'ai' && selectedPlatforms.size > 0 && (
                <p className="text-xs text-red-400">
                  Not enough credits. Need {creditsNeeded}, have {availableCredits}.
                </p>
              )}

              {/* Content Area */}
              {mode === 'manual' ? (
                <div>
                  <Label className="text-sm text-muted-foreground mb-1.5 block">Post Content</Label>
                  <Textarea
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder="Write your post content here. This will be used for all selected platforms..."
                    className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground min-h-[120px] resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Same content will be used for all {selectedPlatforms.size} selected platform{selectedPlatforms.size !== 1 ? 's' : ''}.
                  </p>
                </div>
              ) : (
                Object.keys(generatedPosts).length > 0 && (
                  <div className="space-y-4">
                    <Separator className="bg-border" />
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      Generated Content
                    </h3>
                    {Array.from(selectedPlatforms).map(platform => {
                      const gen = generatedPosts[platform];
                      if (!gen) return null;
                      const platformInfo = PLATFORMS.find(p => p.id === platform);
                      if (!platformInfo) return null;
                      const Icon = platformInfo.icon;

                      return (
                        <div key={platform} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{platformInfo.name}</span>
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                              {gen.title}
                            </Badge>
                          </div>
                          <Textarea
                            value={editedPosts[platform] !== undefined ? editedPosts[platform] : getPostContent(platform)}
                            onChange={(e) => setEditedPosts(prev => ({
                              ...prev,
                              [platform]: e.target.value,
                            }))}
                            className="bg-secondary/50 border-border text-foreground text-sm min-h-[80px] resize-y"
                          />
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={!canSave}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save as Draft{selectedPlatforms.size > 0 ? `s (${selectedPlatforms.size})` : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coming Soon Dialog for Auto-post */}
      {autoPostPlatform && (
        <ComingSoonPostDialog
          isOpen={!!autoPostPlatform}
          onClose={() => setAutoPostPlatform(null)}
          platform={autoPostPlatform}
        />
      )}
    </>
  );
};

export default CreatePostFromMediaModal;
