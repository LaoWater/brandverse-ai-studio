import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { CompanySelector } from "@/components/CompanySelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    ArrowRight, Instagram, Facebook, Linkedin, Info,
    Image as ImageIconLucide, Video as VideoIconLucide, Type as TypeIconLucide,
    Wand2, FileText, Bot, Palette, Globe, SaveIcon, Loader2, Coins, Video
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";

import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { calculateCreditsNeeded, deductCredits, getUserCredits } from "@/services/creditsService";
import {
  getAllImageControlSettings,
  type ImageControlSettings
} from "@/services/imageControlService";
import { prepareAPIPayload } from "@/services/contentGeneratorService";
import { saveGeneratedPostsToSupabase } from '@/services/supabaseService';
import GenerationProgressModal, { ProgressStage } from '@/components/GenerationProgressModal';

// Extracted components (Phase 0)
import ImageQualityDialog from "@/components/content-generator/ImageQualityDialog";
import ImageControlDialog from "@/components/content-generator/ImageControlDialog";
import PlatformCard from "@/components/content-generator/PlatformCard";

// Phase 1: Post History Sidebar
import PostHistorySidebar from "@/components/content-generator/PostHistorySidebar";

// Phase 2: Media Browser
import MediaBrowserSheet from "@/components/content-generator/MediaBrowserSheet";

// Phase 3: Image Finesse
import ImageFinesseOverlay from "@/components/content-generator/ImageFinesseOverlay";

const API_BASE_URL = "https://gcs-gemini-openai-app-1006785094868.europe-central2.run.app";

const getDefaultStages = (): ProgressStage[] => [
  { id: 'init', label: 'Initializing', description: 'Preparing your request...', status: 'pending', icon: FileText },
  { id: 'planning', label: 'Strategic Planning', description: 'Architecting core content strategy...', status: 'pending', icon: Bot },
  { id: 'crafting', label: 'Platform Crafting', description: 'Tailoring content for each platform...', status: 'pending', icon: Wand2 },
  { id: 'media', label: 'Visual Asset Generation', description: 'Creating stunning visuals (if applicable)...', status: 'pending', icon: Palette },
  { id: 'finalizing', label: 'Finalizing & Translating', description: 'Polishing and adapting language...', status: 'pending', icon: Globe },
  { id: "saving", label: "Saving Creations", description: "Storing your new posts in the database...", status: "pending", icon: SaveIcon }
];

// Attached media type for Phase 2
interface AttachedMedia {
  mediaId: string;
  url: string;
  thumbnailUrl: string | null;
  fileType: 'image' | 'video';
  fileName: string;
}

const ContentGenerator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStages, setProgressStages] = useState<ProgressStage[]>(getDefaultStages());
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState(0);

  const [formData, setFormData] = useState({
    subject: "",
    tone: "",
    language: "en",
    platforms: [] as string[],
    platformMedia: {} as Record<string, 'text' | 'image' | 'video'>
  });

  const [imageQuality, setImageQuality] = useState<'balanced' | 'ultra'>('balanced');

  const getModelFromQuality = (quality: 'balanced' | 'ultra'): string => {
    switch (quality) {
      case 'balanced': return 'imagen-4.0-generate-001';
      case 'ultra': return 'imagen-4.0-ultra-generate-preview-06-06';
      default: return 'imagen-4.0-generate-001';
    }
  };

  const [imageControlSettings, setImageControlSettings] = useState<ImageControlSettings>({
    enabled: false, style: "", guidance: "", caption: "", ratio: "16:9", startingImage: null
  });

  const [platformImageControls, setPlatformImageControls] = useState<Record<string, ImageControlSettings>>({});

  // Phase 2: Attached media per platform
  const [platformAttachedMedia, setPlatformAttachedMedia] = useState<Record<string, AttachedMedia | null>>({});

  // Phase 2: Media browser state
  const [mediaBrowserState, setMediaBrowserState] = useState<{
    isOpen: boolean;
    platformId: string | null;
  }>({ isOpen: false, platformId: null });

  // Phase 3: Finesse overlay state
  const [finesseState, setFinesseState] = useState<{
    isOpen: boolean;
    platformId: string | null;
    imageUrl: string | null;
  }>({ isOpen: false, platformId: null, imageUrl: null });

  // Load saved image controls
  useEffect(() => {
    const loadSavedImageControls = async () => {
      if (!user || !selectedCompany) return;
      try {
        const allSettings = await getAllImageControlSettings(user.id, selectedCompany.id);
        if (allSettings.level1) setImageControlSettings(allSettings.level1);
        setPlatformImageControls(allSettings.level2);
      } catch (error) {
        console.error('Error loading image control settings:', error);
      }
    };
    loadSavedImageControls();
  }, [user, selectedCompany]);

  useEffect(() => {
    const defaultLang = languages.find(l => l.isDefault)?.code || 'en';
    setFormData(prev => ({ ...prev, language: defaultLang }));
  }, []);

  useEffect(() => {
    const fetchUserCredits = async () => {
      const credits = await getUserCredits();
      setUserCredits(credits?.available_credits ?? 0);
    };
    if (user) fetchUserCredits();
  }, [user]);

  const languages = [
    { code: "en", name: "English", isDefault: true },
    { code: "ro", name: "Romanian" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "bg", name: "Bulgarian" },
    { code: "hr", name: "Croatian" },
    { code: "sk", name: "Slovak" }
  ];

  const getLanguageName = (code: string): string => {
    const lang = languages.find(l => l.code === code);
    return lang?.name || "English";
  };

  const platforms = [
    { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
    { id: "twitter", label: "Twitter", icon: FaXTwitter, color: "text-sky-500" },
    { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-700" }
  ];

  const tones = [
    "Professional", "Casual & Friendly", "Inspirational", "Humorous",
    "Educational", "Urgent", "Conversational", "Authoritative", "Neutral"
  ];

  const getMediaCredits = (mediaType: string): number => {
    if (mediaType === 'text') return 1;
    if (mediaType === 'image' || mediaType === 'video') {
      return imageQuality === 'ultra' ? 4 : 3;
    }
    return 3;
  };

  const mediaOptions = [
    { value: 'text', label: 'Text', icon: TypeIconLucide },
    { value: 'image', label: 'Image + Text', icon: ImageIconLucide },
    { value: 'video', label: 'Video + Text (Coming Soon)', icon: VideoIconLucide, comingSoon: true, wide: true },
  ];

  const creditsNeeded = calculateCreditsNeeded(formData.platforms, formData.platformMedia, imageQuality);
  const hasEnoughCredits = userCredits >= creditsNeeded;

  const handlePlatformToggle = (platformId: string) => {
    const isCurrentlySelected = formData.platforms.includes(platformId);
    setFormData(prev => {
      if (isCurrentlySelected) {
        const newPlatforms = prev.platforms.filter(p => p !== platformId);
        const newPlatformMedia = { ...prev.platformMedia };
        delete newPlatformMedia[platformId];
        return { ...prev, platforms: newPlatforms, platformMedia: newPlatformMedia };
      } else {
        return {
          ...prev,
          platforms: [...prev.platforms, platformId],
          platformMedia: { ...prev.platformMedia, [platformId]: 'text' }
        };
      }
    });
    // Clear attached media when deselecting platform
    if (isCurrentlySelected) {
      setPlatformAttachedMedia(prev => {
        const updated = { ...prev };
        delete updated[platformId];
        return updated;
      });
    }
  };

  const handleMediaTypeSelect = (platformId: string, mediaType: 'text' | 'image' | 'video') => {
    setFormData(prev => ({
      ...prev,
      platformMedia: { ...prev.platformMedia, [platformId]: mediaType }
    }));
  };

  // Phase 2: Media attachment handlers
  const handleOpenMediaBrowser = (platformId: string) => {
    setMediaBrowserState({ isOpen: true, platformId });
  };

  const handleSelectMedia = (media: AttachedMedia) => {
    const platformId = mediaBrowserState.platformId;
    if (!platformId) return;

    setPlatformAttachedMedia(prev => ({ ...prev, [platformId]: media }));
    // Force text-only when media is attached
    setFormData(prev => ({
      ...prev,
      platformMedia: { ...prev.platformMedia, [platformId]: 'text' }
    }));
  };

  const handleRemoveAttachedMedia = (platformId: string) => {
    setPlatformAttachedMedia(prev => {
      const updated = { ...prev };
      delete updated[platformId];
      return updated;
    });
  };

  // Phase 3: Finesse handlers
  const handleFinesseImage = (platformId: string, imageUrl: string) => {
    setFinesseState({ isOpen: true, platformId, imageUrl });
  };

  const handleFinesseSuccess = (platformId: string, newImageUrl: string, newThumbnailUrl: string | null) => {
    setPlatformAttachedMedia(prev => {
      const existing = prev[platformId];
      if (!existing) return prev;
      return {
        ...prev,
        [platformId]: {
          ...existing,
          url: newImageUrl,
          thumbnailUrl: newThumbnailUrl,
        }
      };
    });
  };

  const updateStage = (stageId: string, status: ProgressStage['status'], delay = 0): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => {
        setProgressStages(prevStages =>
          prevStages.map(stage =>
            stage.id === stageId ? { ...stage, status } : stage
          )
        );
        if (status === 'in-progress') setCurrentStageId(stageId);
        resolve();
      }, delay);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Authentication Required", description: "Please log in to generate content.", variant: "destructive" });
      navigate('/auth');
      return;
    }

    if (!selectedCompany) {
      toast({ title: "Company Required", description: "Please select a company to generate content for.", variant: "destructive" });
      return;
    }

    if (!formData.subject.trim()) {
      toast({ title: "Topic Required", description: "Please enter a topic/subject for your post.", variant: "destructive" });
      return;
    }

    if (!formData.tone) {
      toast({ title: "Tone Required", description: "Please select a sentiment/tonality for your post.", variant: "destructive" });
      return;
    }

    if (formData.platforms.length === 0) {
      toast({ title: "Platform Required", description: "Please select at least one platform.", variant: "destructive" });
      return;
    }

    if (!hasEnoughCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsNeeded} credits but only have ${userCredits}. Credits reset daily if under 10.`,
        variant: "destructive"
      });
      return;
    }

    const creditDeducted = await deductCredits(creditsNeeded);
    if (!creditDeducted) {
      toast({
        title: "Credit Deduction Failed",
        description: "Unable to deduct credits. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setUserCredits(prev => prev - creditsNeeded);
    setIsGenerating(true);
    setProgressStages(getDefaultStages());

    await updateStage('init', 'in-progress', 0);
    await new Promise(resolve => setTimeout(resolve, 300));
    await updateStage('init', 'completed', 200);
    await updateStage('planning', 'in-progress', 100);

    const contentData = {
      topic: formData.subject,
      description: formData.tone,
      hashtags: [] as string[],
      callToAction: ""
    };

    const platformSettings = formData.platforms.reduce((acc: Record<string, { selected: boolean; postType: string }>, platformId) => {
      const mediaType = formData.platformMedia[platformId] || 'text';
      const postType = mediaType === 'text' ? 'Text' :
                       mediaType === 'image' ? 'Image' :
                       mediaType === 'video' ? 'Video' : 'Text';
      acc[platformId] = { selected: true, postType };
      return acc;
    }, {});

    const completeAPIPayload = prepareAPIPayload(
      selectedCompany,
      contentData,
      imageControlSettings,
      platformImageControls,
      platformSettings,
      getModelFromQuality(imageQuality),
      getLanguageName(formData.language)
    );

    console.log("=== COMPLETE CONTENT GENERATOR DATA ===");
    console.log(JSON.stringify(completeAPIPayload, null, 2));
    console.log("=======================================");

    if (!completeAPIPayload) {
      throw new Error("Failed to prepare API payload");
    }

    const payload = completeAPIPayload;
    console.log("Sending enhanced payload to API:", payload);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-posts-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      await updateStage('planning', 'completed', 0);
      await updateStage('crafting', 'in-progress', 100);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
      await updateStage('crafting', 'completed', 0);

      await updateStage('media', 'in-progress', 100);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 500));
      await updateStage('media', 'completed', 0);

      await updateStage('finalizing', 'in-progress', 100);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
      await updateStage('finalizing', 'completed', 0);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Content generation pipeline failed." }));
        setProgressStages(prev => prev.map(s => (s.status === 'in-progress' || s.status === 'pending') ? {...s, status: 'error'} : s));
        throw new Error(errorData?.detail || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Success Response:", result);

      await updateStage('saving', 'in-progress', 100);

      const postsToInsert = result.posts.map((generatedPost: any) => {
        let picture_url: string | null = null;
        let video_url: string | null = null;

        // Check for attached media from library (Phase 2)
        const attached = platformAttachedMedia[generatedPost.platform];
        if (attached) {
          if (attached.fileType === 'image') {
            picture_url = attached.url;
          } else if (attached.fileType === 'video') {
            video_url = attached.url;
          }
        } else if (generatedPost.media_asset) {
          if (generatedPost.media_asset.type === 'image') {
            const imageUpload = generatedPost.cloud_storage?.uploads?.find(
              (upload: any) => upload.success && upload.content_type?.startsWith('image/')
            );
            picture_url = imageUpload?.public_url || null;
          } else if (generatedPost.media_asset.type === 'video') {
            const videoUpload = generatedPost.cloud_storage?.uploads?.find(
              (upload: any) => upload.success && upload.content_type?.startsWith('video/')
            );
            video_url = videoUpload?.public_url || null;
          }
        }

        const main_text_content = generatedPost.original_text_content;
        const post_title = formData.subject || (main_text_content.substring(0, 70) + (main_text_content.length > 70 ? "..." : ""));

        const textUpload = generatedPost.cloud_storage?.uploads?.find(
          (upload: any) => upload.success && upload.content_type?.startsWith('text/')
        );
        const text_content_cloud_url = textUpload?.public_url || null;

        return {
          company_id: selectedCompany.id,
          title: post_title,
          platform_type: generatedPost.platform,
          details: main_text_content,
          has_picture: picture_url,
          has_video: video_url,
          status: 'draft',
          metadata: {
            pipeline_id: result.pipeline_id,
            post_type_from_api: generatedPost.post_type,
            media_generation_prompt_used: generatedPost.media_generation_prompt_used,
            text_content_cloud_url: text_content_cloud_url,
          }
        };
      });

      const { data: insertedPosts, error: supabaseError } = await saveGeneratedPostsToSupabase(postsToInsert);

      if (supabaseError || !insertedPosts) {
        await updateStage('saving', 'error', 0);
        throw new Error(supabaseError?.message || "Failed to save posts to the database.");
      }
      await updateStage('saving', 'completed', 300);

      toast({
        title: "Content Universe Expanded!",
        description: `Your new creations (ID: ${result.pipeline_id}) are ready.`,
      });
      navigate("/generation-success", { state: { pipelineResult: result,
        insertedPostIds: insertedPosts.map((p: any) => p.id),
        subjectFromForm: formData.subject
      } });

    } catch (error: any) {
      console.error("Error during content generation or saving:", error);
      toast({
        title: "Mission Aborted",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setProgressStages(prevStages =>
        prevStages.map(stage => {
          if (stage.id === currentStageId && stage.status === 'in-progress') {
            return { ...stage, status: 'error' };
          }
          if ((stage.status === 'in-progress' || stage.status === 'pending') && !prevStages.find(s=>s.id === currentStageId && s.status === 'in-progress')) {
             if (!prevStages.some(s => s.status === 'error')) return { ...stage, status: 'error' };
          }
          return stage;
        })
      );
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 1500);
    }
  };

  // Word cloud click handler - fills subject field
  const handleWordClick = (word: string) => {
    setFormData(prev => ({
      ...prev,
      subject: prev.subject ? `${prev.subject} ${word}` : word
    }));
  };

  return (
    <TooltipProvider>
      {isGenerating && <GenerationProgressModal stages={progressStages} currentStageId={currentStageId} />}

      {/* Phase 2: Media Browser Sheet */}
      {user && selectedCompany && (
        <MediaBrowserSheet
          isOpen={mediaBrowserState.isOpen}
          onClose={() => setMediaBrowserState({ isOpen: false, platformId: null })}
          userId={user.id}
          companyId={selectedCompany.id}
          onSelectMedia={handleSelectMedia}
        />
      )}

      {/* Phase 3: Image Finesse Overlay */}
      {user && selectedCompany && (
        <ImageFinesseOverlay
          isOpen={finesseState.isOpen}
          imageUrl={finesseState.imageUrl}
          platformId={finesseState.platformId}
          userId={user.id}
          companyId={selectedCompany.id}
          onClose={() => setFinesseState({ isOpen: false, platformId: null, imageUrl: null })}
          onSuccess={handleFinesseSuccess}
        />
      )}

      <div className={`min-h-screen bg-cosmic-gradient ${isGenerating ? 'blur-sm pointer-events-none' : ''}`}>
        {/* Distributed Gradient Art - Static for performance */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-[280px] h-[280px] bg-accent/20 rounded-full blur-3xl"></div>
          <div className="absolute top-32 right-[15%] w-[250px] h-[250px] bg-primary/18 rounded-full blur-3xl"></div>
          <div className="absolute top-[40%] left-[5%] w-[220px] h-[220px] bg-primary/15 rounded-full blur-3xl"></div>
          <div className="absolute top-[45%] right-[8%] w-[200px] h-[200px] bg-accent/16 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[20%] left-[12%] w-[240px] h-[240px] bg-accent/18 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[15%] right-[10%] w-[260px] h-[260px] bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[120px] bg-gradient-to-r from-transparent via-primary/10 to-transparent -rotate-12 blur-3xl"></div>
        </div>
        <Navigation />

        <div className="container mx-auto px-4 pt-24 pb-12">
          {/* Phase 1: Flex layout with sidebar on desktop */}
          <div className="flex flex-row gap-6">
            {/* Sidebar - hidden on mobile, shown on lg+ */}
            <PostHistorySidebar
              companyId={selectedCompany?.id || null}
              onWordClick={handleWordClick}
            />

            {/* Main content area */}
            <div className="flex-1 max-w-4xl">
              <Card className="cosmic-card border-0 cosmic-glow mb-6">
                <CardHeader className="cosmic-card-header">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-xl">Company Selection</CardTitle>
                      <CardDescription className="text-gray-300">
                        Choose the company you want to generate content for
                      </CardDescription>
                    </div>
                    {selectedCompany?.logo_path && (
                      <div className="ml-4 w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 shadow-lg flex-shrink-0">
                        <img
                          src={selectedCompany.logo_path}
                          alt={`${selectedCompany.name} logo`}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CompanySelector />
                </CardContent>
              </Card>

              <Card className="cosmic-card border-0 cosmic-glow">
                <CardHeader className="cosmic-card-header">
                  <CardTitle className="text-white text-2xl font-bold flex items-center justify-between">
                    <span>Content Details</span>
                    <div className="flex items-center gap-3">
                      <ImageQualityDialog
                        imageQuality={imageQuality}
                        setImageQuality={setImageQuality}
                      />

                      <ImageControlDialog
                        imageControlSettings={imageControlSettings}
                        setImageControlSettings={setImageControlSettings}
                        userId={user?.id}
                        companyId={selectedCompany?.id}
                      />

                      {/* Video Control - Coming Soon */}
                      <div className="relative group">
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 px-4 py-2 h-12 text-muted-foreground bg-muted cursor-not-allowed rounded-xl"
                          disabled
                        >
                          <Video className="w-5 h-5" />
                          <span className="text-sm font-medium">Video Control</span>
                        </Button>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          Coming Soon
                        </div>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-base">
                    Provide details about the content you want to generate
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {creditsNeeded > 0 && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Coins className="w-5 h-5 text-accent" />
                            <span className="text-white font-medium">Credits Required</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${hasEnoughCredits ? 'text-accent' : 'text-red-400'}`}>
                              {creditsNeeded} / {userCredits}
                            </span>
                          </div>
                        </div>
                        {!hasEnoughCredits && (
                          <div className="mt-3 space-y-2">
                            <p className="text-red-400 text-sm">
                              Insufficient credits. Credits reset daily if under 10.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full border-accent text-accent hover:bg-accent/10"
                              onClick={() => navigate('/pricing')}
                            >
                              Go to Pricing & Subscriptions
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="subject" className="text-white font-medium">Topic/Subject</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="e.g., New Product Launch, Event Announcement"
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 h-12"
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="language" className="text-white font-medium">Language</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-6 h-6 p-0 text-gray-400 hover:text-white">
                                <Info className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-white/20 text-white max-w-xs">
                              <p>Model performance might vary for non-English tasks.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white h-12">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-white/20 max-h-60">
                            {languages.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-white/10">
                                {lang.name} {lang.isDefault && "(Default)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="tone" className="text-white font-medium">Sentiment/Tonality (for this post)</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-6 h-6 p-0 text-gray-400 hover:text-white">
                              <Info className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/20 text-white max-w-xs">
                            <p>Choose the specific tone for this particular piece of content.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select value={formData.tone} onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))} required>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white h-12">
                          <SelectValue placeholder="Select tone for this post" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/20">
                          {tones.map((toneItem) => (
                            <SelectItem key={toneItem} value={toneItem} className="text-white hover:bg-white/10">
                              {toneItem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-white font-medium">Target Platforms & Media Types</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {platforms.map((platform) => (
                          <PlatformCard
                            key={platform.id}
                            platform={platform}
                            isSelected={formData.platforms.includes(platform.id)}
                            selectedMedia={formData.platformMedia[platform.id]}
                            mediaOptions={mediaOptions}
                            getMediaCredits={getMediaCredits}
                            onPlatformToggle={handlePlatformToggle}
                            onMediaTypeSelect={handleMediaTypeSelect}
                            platformImageControls={platformImageControls}
                            setPlatformImageControls={setPlatformImageControls}
                            userId={user?.id}
                            companyId={selectedCompany?.id}
                            attachedMedia={platformAttachedMedia[platform.id]}
                            onOpenMediaBrowser={handleOpenMediaBrowser}
                            onRemoveAttachedMedia={handleRemoveAttachedMedia}
                            onFinesseImage={handleFinesseImage}
                          />
                        ))}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full cosmic-button text-white font-semibold h-12 mt-8"
                      disabled={isGenerating || !selectedCompany || formData.platforms.length === 0 || !formData.subject.trim() || !formData.tone || !hasEnoughCredits}
                    >
                      {isGenerating ? 'Conjuring Content...' : 'Generate Content'}
                      {isGenerating ? <Loader2 className="ml-2 w-5 h-5 animate-spin" /> : <ArrowRight className="ml-2 w-5 h-5" />}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ContentGenerator;
