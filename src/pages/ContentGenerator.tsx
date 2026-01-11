import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { CompanySelector } from "@/components/CompanySelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    ArrowRight, Award, Instagram, Facebook, Twitter, Linkedin, Info,
    Image as ImageIconLucide, Video as VideoIconLucide, Type as TypeIconLucide,
    Wand2, Check, FileText, Bot, Palette, Globe, SaveIcon, Loader2, Coins, Image, Video
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";

import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { calculateCreditsNeeded, deductCredits, getUserCredits } from "@/services/creditsService";
import { 
  saveImageControlSettings, 
  loadImageControlSettings, 
  getAllImageControlSettings,
  type ImageControlSettings 
} from "@/services/imageControlService";
import { prepareAPIPayload } from "@/services/contentGeneratorService";

import { saveGeneratedPostsToSupabase } from '@/services/supabaseService';
import GenerationProgressModal, { ProgressStage } from '@/components/GenerationProgressModal';

const API_BASE_URL = "https://gcs-gemini-openai-app-1006785094868.europe-central2.run.app";


const getDefaultStages = (): ProgressStage[] => [
  { id: 'init', label: 'Initializing', description: 'Preparing your request...', status: 'pending', icon: FileText },
  { id: 'planning', label: 'Strategic Planning', description: 'Architecting core content strategy...', status: 'pending', icon: Bot },
  { id: 'crafting', label: 'Platform Crafting', description: 'Tailoring content for each platform...', status: 'pending', icon: Wand2 },
  { id: 'media', label: 'Visual Asset Generation', description: 'Creating stunning visuals (if applicable)...', status: 'pending', icon: Palette },
  { id: 'finalizing', label: 'Finalizing & Translating', description: 'Polishing and adapting language...', status: 'pending', icon: Globe },
  { id: "saving", label: "Saving Creations", description: "Storing your new posts in the database...", status: "pending", icon: SaveIcon }
];

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

  // Image Quality / Model Selection State
  const [imageQuality, setImageQuality] = useState<'balanced' | 'ultra'>('balanced');

  // Map quality to model names
  const getModelFromQuality = (quality: 'balanced' | 'ultra'): string => {
    switch (quality) {
      case 'balanced':
        return 'imagen-4.0-generate-001';
      case 'ultra':
        return 'imagen-4.0-ultra-generate-preview-06-06';
      default:
        return 'imagen-4.0-generate-001';
    }
  };

  // Image Control State
  const [imageControlSettings, setImageControlSettings] = useState<ImageControlSettings>({
    enabled: false,
    style: "",
    guidance: "",
    caption: "",
    ratio: "16:9",
    startingImage: null
  });

  // Platform-specific Image Control State
  const [platformImageControls, setPlatformImageControls] = useState<Record<string, ImageControlSettings>>({});

  // Loading saved settings
  useEffect(() => {
    const loadSavedImageControls = async () => {
      if (!user || !selectedCompany) return;
      
      try {
        const allSettings = await getAllImageControlSettings(user.id, selectedCompany.id);
        
        if (allSettings.level1) {
          setImageControlSettings(allSettings.level1);
        }
        
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
    
    if (user) {
      fetchUserCredits();
    }
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

  // Convert language code to full language name for API
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

  // Calculate credits based on quality for image/video
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
  };

  const handleMediaTypeSelect = (platformId: string, mediaType: 'text' | 'image' | 'video') => {
    setFormData(prev => ({
      ...prev,
      platformMedia: { ...prev.platformMedia, [platformId]: mediaType as any }
    }));
  };
  
  const updateStage = (stageId: string, status: ProgressStage['status'], delay = 0): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            setProgressStages(prevStages =>
                prevStages.map(stage =>
                    stage.id === stageId ? { ...stage, status } : stage
                )
            );
            if (status === 'in-progress') {
                setCurrentStageId(stageId);
            }
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


    // Prepare complete content generator data structure
    const contentData = {
      topic: formData.subject,
      description: formData.tone, // Use tone as description since we don't have a separate description field
      hashtags: [], // Empty for now - can be enhanced later
      callToAction: "" // Empty for now - can be enhanced later
    };

    // Prepare platform settings
    const platformSettings = formData.platforms.reduce((acc: Record<string, { selected: boolean; postType: string }>, platformId) => {
      const mediaType = formData.platformMedia[platformId] || 'text';
      // Convert to API expected format
      const postType = mediaType === 'text' ? 'Text' : 
                       mediaType === 'image' ? 'Image' : 
                       mediaType === 'video' ? 'Video' : 'Text';

      acc[platformId] = {
        selected: true,
        postType
      };
      return acc;
    }, {});

    // Prepare complete API payload structure
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
      
      const postsToInsert = result.posts.map(generatedPost => {
        let picture_url: string | null = null;
        let video_url: string | null = null;
      
        if (generatedPost.media_asset) {
          if (generatedPost.media_asset.type === 'image') {
            const imageUpload = generatedPost.cloud_storage?.uploads?.find(
              upload => upload.success && upload.content_type?.startsWith('image/')
            );
            picture_url = imageUpload?.public_url || null;
          } else if (generatedPost.media_asset.type === 'video') {
            const videoUpload = generatedPost.cloud_storage?.uploads?.find(
              upload => upload.success && upload.content_type?.startsWith('video/')
            );
            video_url = videoUpload?.public_url || null;
          }
        }
      
        const main_text_content = generatedPost.original_text_content;
        const post_title = formData.subject || (main_text_content.substring(0, 70) + (main_text_content.length > 70 ? "..." : ""));
        
        const textUpload = generatedPost.cloud_storage?.uploads?.find(
           upload => upload.success && upload.content_type?.startsWith('text/')
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

  return (
    <TooltipProvider>
      {isGenerating && <GenerationProgressModal stages={progressStages} currentStageId={currentStageId} />}
      <div className={`min-h-screen bg-cosmic-gradient ${isGenerating ? 'blur-sm pointer-events-none' : ''}`}>
        {/* Distributed Gradient Art */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Top-left accent orb */}
          <div className="absolute top-20 left-[10%] w-[280px] h-[280px] bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
          {/* Top-right primary orb */}
          <div className="absolute top-32 right-[15%] w-[250px] h-[250px] bg-primary/18 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '-2s' }}></div>
          {/* Mid-left primary glow */}
          <div className="absolute top-[40%] left-[5%] w-[220px] h-[220px] bg-primary/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '-4s' }}></div>
          {/* Center-right accent */}
          <div className="absolute top-[45%] right-[8%] w-[200px] h-[200px] bg-accent/16 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '-3s' }}></div>
          {/* Bottom-left accent */}
          <div className="absolute bottom-[20%] left-[12%] w-[240px] h-[240px] bg-accent/18 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '11s', animationDelay: '-5s' }}></div>
          {/* Bottom-right primary */}
          <div className="absolute bottom-[15%] right-[10%] w-[260px] h-[260px] bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '-1s' }}></div>
          {/* Subtle diagonal band */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[120px] bg-gradient-to-r from-transparent via-primary/10 to-transparent -rotate-12 blur-3xl"></div>
        </div>
        <Navigation />
        
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-4xl mx-auto">
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
                    {/* Image Quality Selector */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 px-4 py-2 h-12 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 relative group"
                          type="button"
                        >
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <Award className="w-5 h-5 relative z-10 drop-shadow-lg" />
                          <span className="text-sm font-medium relative z-10">
                            Quality: {imageQuality === 'balanced' ? 'Balanced' : 'Ultra'}
                          </span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="cosmic-card border-0 max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-white text-2xl font-bold flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                              <Award className="w-6 h-6 text-white" />
                            </div>
                            <span>Image Generation Quality</span>
                          </DialogTitle>
                          <DialogDescription className="text-gray-300">
                            Choose the AI model quality for generating images. Higher quality takes longer and costs more.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-6">
                          {/* Balanced Option */}
                          <div
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              imageQuality === 'balanced'
                                ? 'border-accent bg-accent/10'
                                : 'border-white/10 hover:border-white/30 bg-white/5'
                            }`}
                            onClick={() => setImageQuality('balanced')}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                                  Balanced
                                  <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">Default</span>
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">
                                  Great balance of quality and cost
                                </p>
                                <div className="mt-3 space-y-1 text-xs text-gray-300">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Speed:</span>
                                    <span>Moderate</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Quality:</span>
                                    <span>Very High</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Cost:</span>
                                    <span>3 credits per image</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                imageQuality === 'balanced'
                                  ? 'bg-accent border-accent'
                                  : 'border-white/20'
                              }`}>
                                {imageQuality === 'balanced' && <Check className="w-3 h-3 text-gray-900" />}
                              </div>
                            </div>
                          </div>

                          {/* Ultra Option */}
                          <div
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              imageQuality === 'ultra'
                                ? 'border-accent bg-accent/10'
                                : 'border-white/10 hover:border-white/30 bg-white/5'
                            }`}
                            onClick={() => setImageQuality('ultra')}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-white font-semibold text-lg">Ultra</h3>
                                <p className="text-gray-400 text-sm mt-1">
                                  Exceptional quality for special campaigns
                                </p>
                                <div className="mt-3 space-y-1 text-xs text-gray-300">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Speed:</span>
                                    <span>Slower</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Quality:</span>
                                    <span>Exceptional</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Cost:</span>
                                    <span>4 credits per image (+1)</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                imageQuality === 'ultra'
                                  ? 'bg-accent border-accent'
                                  : 'border-white/20'
                              }`}>
                                {imageQuality === 'ultra' && <Check className="w-3 h-3 text-gray-900" />}
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mt-4">
                            <p className="text-xs text-gray-300">
                              <strong className="text-blue-300">Note:</strong> The selected quality level affects all generated images in this content batch.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Image Control */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 px-4 py-2 h-12 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 relative group"
                          type="button"
                        >
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <Image className="w-5 h-5 relative z-10 drop-shadow-lg" />
                          <span className="text-sm font-medium relative z-10">Image Control</span>
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="cosmic-card border-0 max-w-2xl max-h-[85vh] flex flex-col">
                      <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-white text-2xl font-bold flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            <Image className="w-6 h-6 text-white" />
                          </div>
                          <span>Image Control Settings</span>
                        </DialogTitle>
                        <DialogDescription className="text-gray-300">
                          Configure image generation preferences, style guidance, and visual controls for your content
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="flex-1 overflow-y-auto space-y-6 mt-6 pr-2">{/* Added padding-right for scrollbar space */}
                        {/* Enable Image Control Toggle */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="space-y-1">
                            <Label className="text-white font-medium">Enable Image Control</Label>
                            <p className="text-sm text-gray-400">Override AI's automatic image decisions with custom preferences</p>
                          </div>
                          <Switch 
                            checked={imageControlSettings.enabled}
                            onCheckedChange={(checked) => setImageControlSettings(prev => ({ ...prev, enabled: checked }))}
                          />
                        </div>

                        {imageControlSettings.enabled && (
                          <div className="space-y-6 animate-fade-in">
                            {/* Style Guidance */}
                            <div className="space-y-3">
                              <Label className="text-white font-medium">Style Guidance</Label>
                              <Select value={imageControlSettings.style} onValueChange={(value) => setImageControlSettings(prev => ({ ...prev, style: value }))}>
                                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                                  <SelectValue placeholder="Choose image style..." />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-white/20">
                                  <SelectItem value="photorealistic" className="text-white hover:bg-white/10">Photorealistic</SelectItem>
                                  <SelectItem value="minimalist" className="text-white hover:bg-white/10">Minimalist</SelectItem>
                                  <SelectItem value="artistic" className="text-white hover:bg-white/10">Artistic</SelectItem>
                                  <SelectItem value="corporate" className="text-white hover:bg-white/10">Corporate</SelectItem>
                                  <SelectItem value="vibrant" className="text-white hover:bg-white/10">Vibrant & Colorful</SelectItem>
                                  <SelectItem value="monochrome" className="text-white hover:bg-white/10">Monochrome</SelectItem>
                                  <SelectItem value="modern" className="text-white hover:bg-white/10">Modern & Clean</SelectItem>
                                  <SelectItem value="vintage" className="text-white hover:bg-white/10">Vintage</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Image Ratio */}
                            <div className="space-y-3">
                              <Label className="text-white font-medium">Image Ratio</Label>
                              <Select value={imageControlSettings.ratio} onValueChange={(value) => setImageControlSettings(prev => ({ ...prev, ratio: value }))}>
                                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                                  <SelectValue placeholder="Choose aspect ratio..." />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-white/20">
                                  <SelectItem value="16:9" className="text-white hover:bg-white/10">Landscape (16:9) - Default</SelectItem>
                                  <SelectItem value="1:1" className="text-white hover:bg-white/10">Square (1:1)</SelectItem>
                                  <SelectItem value="9:16" className="text-white hover:bg-white/10">Portrait (9:16)</SelectItem>
                                  <SelectItem value="3:4" className="text-white hover:bg-white/10">Portrait (3:4)</SelectItem>
                                  <SelectItem value="4:3" className="text-white hover:bg-white/10">Standard (4:3)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Visual Guidance */}
                            <div className="space-y-3">
                              <Label className="text-white font-medium">Visual Guidance</Label>
                              <Textarea
                                placeholder="Describe the visual elements, mood, colors, or specific objects you want in the image..."
                                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-[100px] resize-none"
                                value={imageControlSettings.guidance}
                                onChange={(e) => setImageControlSettings(prev => ({ ...prev, guidance: e.target.value }))}
                              />
                              <p className="text-xs text-gray-400 bg-blue-500/10 p-2 rounded-md border border-blue-500/20">
                                <strong>Note:</strong> This is high-level guidance. The AI will become more specific during Post Generation Setup based on your content.
                              </p>
                            </div>

                            {/* Caption Guidance */}
                            <div className="space-y-3 opacity-50 cursor-not-allowed">
                              <Label className="text-gray-400 font-medium">Caption/Text Overlay</Label>
                              <Input
                                placeholder="Text to overlay on the image (optional)..."
                                className="bg-gray-700/30 border-gray-600/40 text-gray-500 placeholder:text-gray-500 cursor-not-allowed"
                                value={imageControlSettings.caption}
                                onChange={(e) => setImageControlSettings(prev => ({ ...prev, caption: e.target.value }))}
                                disabled
                              />
                              <div className="p-3 bg-gray-700/20 border border-gray-600/30 rounded-lg">
                                <p className="text-xs text-gray-400 leading-relaxed">
                                  <strong className="text-gray-300">Note:</strong> For optimal performance, we recommend adding captions manually after generation using simple video editing software. Current visual models cannot create proper captions yet.
                                </p>
                                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                  We're working on a combination of automated photo editing, visual models, and video models to enable this functionality.
                                </p>
                              </div>
                            </div>

                            {/* Starting Image Upload */}
                            <div className="space-y-3">
                              <Label className="text-white font-medium">Starting Image (Optional)</Label>
                              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id="starting-image"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setImageControlSettings(prev => ({ ...prev, startingImage: file }));
                                  }}
                                />
                                <Label htmlFor="starting-image" className="cursor-pointer">
                                  <div className="space-y-2">
                                    <Image className="w-8 h-8 mx-auto text-gray-400" />
                                    {imageControlSettings.startingImage ? (
                                      <p className="text-white font-medium">{imageControlSettings.startingImage.name}</p>
                                    ) : (
                                      <p className="text-gray-400">Upload a base image to modify or enhance</p>
                                    )}
                                    <p className="text-xs text-gray-500">Click to browse or drag & drop</p>
                                  </div>
                                </Label>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Save Settings */}
                        <div className="flex justify-end space-x-3 pt-6 border-t border-white/10 mt-8 flex-shrink-0">
                          <Button 
                            variant="outline" 
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => {
                              setImageControlSettings({
                                enabled: false,
                                style: "",
                                guidance: "",
                                caption: "",
                                ratio: "16:9",
                                startingImage: null
                              });
                            }}
                          >
                            Reset to Defaults
                          </Button>
                          <Button 
                            className="cosmic-button"
                            onClick={async () => {
                              if (!user || !selectedCompany) {
                                toast({
                                  title: "Error",
                                  description: "Please ensure you're logged in and have a company selected.",
                                  variant: "destructive"
                                });
                                return;
                              }

                              const result = await saveImageControlSettings(
                                user.id,
                                selectedCompany.id,
                                1,
                                imageControlSettings
                              );

                              if (result.success) {
                                toast({
                                  title: "Settings Saved!",
                                  description: "Your image control preferences have been saved as defaults.",
                                });
                              } else {
                                toast({
                                  title: "Save Failed",
                                  description: result.error || "Failed to save settings.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <SaveIcon className="w-4 h-4 mr-2" />
                            Save as Default
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
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
                      {platforms.map((platform) => {
                        const IconComponent = platform.icon;
                        const isSelected = formData.platforms.includes(platform.id);
                        const selectedMedia = formData.platformMedia[platform.id];
                        
                        return (
                          <div key={platform.id} 
                               className={`p-4 rounded-lg bg-white/5 border transition-colors
                                           ${isSelected ? 'border-accent ring-1 ring-accent' : 'border-white/10 hover:bg-white/10'}`}
                          >
                            <div 
                              className="flex items-center space-x-3 cursor-pointer"
                              onClick={() => handlePlatformToggle(platform.id)}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center 
                                              ${isSelected ? 'bg-accent border-accent' : 'border-white/20'}`}>
                                {isSelected && <Check className="w-3 h-3 text-gray-900" />}
                              </div>
                              <div className="flex items-center space-x-2 flex-1">
                                <IconComponent className={`w-5 h-5 ${platform.color}`} />
                                <span className="text-white">
                                  {platform.label}
                                </span>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="mt-3 pl-8 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  {mediaOptions.map(({ value, label, icon: Icon, comingSoon, wide }) => {
                                    const credits = getMediaCredits(value);
                                    if (comingSoon) {
                                      return (
                                        <Dialog key={value}>
                                          <DialogTrigger asChild>
                                            <div className={wide ? "col-span-2" : ""}>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 relative group"
                                              >
                                                <div className="absolute inset-0 rounded bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <Icon className="w-3 h-3 mr-2 relative z-10" />
                                                <span className="relative z-10">{label}</span>
                                              </Button>
                                            </div>
                                          </DialogTrigger>
                                          <DialogContent className="cosmic-card border-0 max-w-2xl">
                                            <DialogHeader>
                                              <DialogTitle className="text-white text-xl font-bold flex items-center space-x-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                                  <Icon className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <span>Video Generation - Future Vision</span>
                                              </DialogTitle>
                                            </DialogHeader>
                                            
                                            <div className="space-y-6 mt-6">
                                              <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                                <div className="space-y-4" style={{ color: 'rgb(15, 15, 23)' }}>
                                                  <p className="text-lg font-medium" style={{ color: 'rgb(126, 58, 242)' }}>
                                                    The Current Reality
                                                  </p>
                                                  <p style={{ color: 'rgb(15, 15, 23)' }}>
                                                    Current video models have significant limitations, with quality content generation costs reaching up to <span className="font-semibold" style={{ color: 'rgb(234, 179, 8)' }}>$0.70 per second</span> and often falling short of creating favorable engaging content-cost equity.
                                                  </p>

                                                  <p className="text-lg font-medium mt-6" style={{ color: 'rgb(126, 58, 242)' }}>
                                                    Our Vision Forward
                                                  </p>
                                                  <p style={{ color: 'rgb(15, 15, 23)' }}>
                                                    We are working on a revolutionary new way to automatize Video Creation - which will include a comprehensive pipeline of Video Scripts generation, creating clear scripts blueprints & execution plans, so they can easily be filmed.
                                                  </p>

                                                  <p style={{ color: 'rgb(15, 15, 23)' }}>
                                                    As Leading AI Providers companies grow stronger and video models improve, we will transition to video generation as well - keeping the same Promise towards our clients and our very mission.
                                                  </p>

                                                  <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mt-6">
                                                    <p className="font-medium text-center" style={{ color: 'rgb(14, 116, 144)' }}>
                                                      Our mission is to generate Human-Level-Performance quality content, not just Content.
                                                    </p>
                                                    <p className="text-center text-sm mt-2" style={{ color: 'rgb(75, 85, 99)' }}>
                                                      Because we want to create something as close to HLP as possible.
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      );
                                    }
                                    return (
                                      <Button
                                        type="button"
                                        key={value}
                                        variant="ghost"
                                        size="sm"
                                        className={`w-full justify-start text-xs
                                                    ${selectedMedia === value ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                                        onClick={() => handleMediaTypeSelect(platform.id, value as 'text' | 'image' | 'video')}
                                      >
                                        <Icon className="w-3 h-3 mr-2" />
                                        {label} ({credits}c)
                                      </Button>
                                    );
                                  })}
                                </div>
                                
                                 {/* Platform-specific Image Control Button */}
                                {(selectedMedia === 'image' || selectedMedia === 'text') && (
                                  <div className="mt-2 pt-2 border-t border-white/10">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="w-full text-xs text-gray-300 hover:text-white hover:bg-white/10 justify-start relative group"
                                          type="button"
                                        >
                                          <div className="absolute inset-0 rounded bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                          <Image className="w-3 h-3 mr-2 relative z-10" />
                                          <span className="relative z-10">Platform Image Control</span>
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="cosmic-card border-0 max-w-2xl max-h-[85vh] flex flex-col">
                                        <DialogHeader className="flex-shrink-0">
                                          <DialogTitle className="text-white text-xl font-bold flex items-center space-x-3">
                                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                              <IconComponent className={`w-5 h-5 ${platform.color}`} />
                                            </div>
                                            <span>{platform.label} Image Control</span>
                                          </DialogTitle>
                                          <DialogDescription className="text-gray-300">
                                            Platform-specific image preferences for {platform.label}
                                          </DialogDescription>
                                        </DialogHeader>
                                        
                                        <div className="flex-1 overflow-y-auto space-y-6 mt-6 pr-2">{/* Added padding-right for scrollbar space */}
                                          {/* Enable Platform Image Control Toggle */}
                                          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                            <div className="space-y-1">
                                              <Label className="text-white font-medium">Enable Platform Image Control *</Label>
                                              <p className="text-sm text-gray-400">Override general settings with {platform.label}-specific preferences</p>
                                            </div>
                                            <Switch
                                              checked={platformImageControls[platform.id]?.enabled || false}
                                              onCheckedChange={(checked) => {
                                                setPlatformImageControls(prev => ({
                                                  ...prev,
                                                  [platform.id]: {
                                                    enabled: checked,
                                                    style: prev[platform.id]?.style || "",
                                                    guidance: prev[platform.id]?.guidance || "",
                                                    caption: prev[platform.id]?.caption || "",
                                                    ratio: prev[platform.id]?.ratio || "16:9",
                                                    startingImage: prev[platform.id]?.startingImage || null
                                                  }
                                                }));
                                              }}
                                            />
                                          </div>

                                          {/* Platform-specific settings */}
                                          {platformImageControls[platform.id]?.enabled && (
                                            <div className="space-y-6 animate-fade-in">
                                              {/* Style Guidance */}
                                              <div className="space-y-3">
                                                <Label className="text-white font-medium">Style Guidance</Label>
                                                <Select
                                                  value={platformImageControls[platform.id]?.style || ""}
                                                  onValueChange={(value) => {
                                                    setPlatformImageControls(prev => ({
                                                      ...prev,
                                                      [platform.id]: { ...prev[platform.id], style: value }
                                                    }));
                                                  }}
                                                >
                                                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                                                    <SelectValue placeholder="Choose image style..." />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-gray-900 border-white/20">
                                                    <SelectItem value="photorealistic" className="text-white hover:bg-white/10">Photorealistic</SelectItem>
                                                    <SelectItem value="minimalist" className="text-white hover:bg-white/10">Minimalist</SelectItem>
                                                    <SelectItem value="artistic" className="text-white hover:bg-white/10">Artistic</SelectItem>
                                                    <SelectItem value="corporate" className="text-white hover:bg-white/10">Corporate</SelectItem>
                                                    <SelectItem value="vibrant" className="text-white hover:bg-white/10">Vibrant & Colorful</SelectItem>
                                                    <SelectItem value="monochrome" className="text-white hover:bg-white/10">Monochrome</SelectItem>
                                                    <SelectItem value="modern" className="text-white hover:bg-white/10">Modern & Clean</SelectItem>
                                                    <SelectItem value="vintage" className="text-white hover:bg-white/10">Vintage</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>

                                              {/* Image Ratio */}
                                              <div className="space-y-3">
                                                <Label className="text-white font-medium">Image Ratio</Label>
                                                <Select
                                                  value={platformImageControls[platform.id]?.ratio || "16:9"}
                                                  onValueChange={(value) => {
                                                    setPlatformImageControls(prev => ({
                                                      ...prev,
                                                      [platform.id]: { ...prev[platform.id], ratio: value }
                                                    }));
                                                  }}
                                                >
                                                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                                                    <SelectValue placeholder="Choose aspect ratio..." />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-gray-900 border-white/20">
                                                    <SelectItem value="16:9" className="text-white hover:bg-white/10">Landscape (16:9) - Default</SelectItem>
                                                    <SelectItem value="1:1" className="text-white hover:bg-white/10">Square (1:1)</SelectItem>
                                                    <SelectItem value="9:16" className="text-white hover:bg-white/10">Portrait (9:16)</SelectItem>
                                                    <SelectItem value="3:4" className="text-white hover:bg-white/10">Portrait (3:4)</SelectItem>
                                                    <SelectItem value="4:3" className="text-white hover:bg-white/10">Standard (4:3)</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>

                                              {/* Visual Guidance */}
                                              <div className="space-y-3">
                                                <Label className="text-white font-medium">Visual Guidance</Label>
                                                <Textarea
                                                  placeholder="Platform-specific visual guidance..."
                                                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-[80px] resize-none"
                                                  value={platformImageControls[platform.id]?.guidance || ""}
                                                  onChange={(e) => {
                                                    setPlatformImageControls(prev => ({
                                                      ...prev,
                                                      [platform.id]: { ...prev[platform.id], guidance: e.target.value }
                                                    }));
                                                  }}
                                                />
                                                <p className="text-xs text-gray-400 bg-orange-500/10 p-2 rounded-md border border-orange-500/20">
                                                  <strong>Level 2:</strong> Platform-specific guidance that overrides Level 1 settings when enabled.
                                                </p>
                                              </div>

                                              {/* Caption Guidance - Platform Specific */}
                                              <div className="space-y-3 opacity-50 cursor-not-allowed">
                                                <Label className="text-gray-400 font-medium">Caption/Text Overlay</Label>
                                                <Input
                                                  placeholder="Text to overlay on the image (optional)..."
                                                  className="bg-gray-700/30 border-gray-600/40 text-gray-500 placeholder:text-gray-500 cursor-not-allowed"
                                                  value={platformImageControls[platform.id]?.caption || ""}
                                                  onChange={(e) => {
                                                    setPlatformImageControls(prev => ({
                                                      ...prev,
                                                      [platform.id]: { ...prev[platform.id], caption: e.target.value }
                                                    }));
                                                  }}
                                                  disabled
                                                />
                                                <div className="p-3 bg-gray-700/20 border border-gray-600/30 rounded-lg">
                                                  <p className="text-xs text-gray-400 leading-relaxed">
                                                    <strong className="text-gray-300">Note:</strong> For optimal performance, we recommend adding captions manually after generation using simple video editing software. Current visual models cannot create proper captions yet.
                                                  </p>
                                                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                                    We're working on a combination of automated photo editing, visual models, and video models to enable this functionality.
                                                  </p>
                                                </div>
                                              </div>

                                              {/* Starting Image Upload - Platform Specific */}
                                              <div className="space-y-3">
                                                <Label className="text-white font-medium">Starting Image (Optional)</Label>
                                                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                                                  <Input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    id={`starting-image-${platform.id}`}
                                                    onChange={(e) => {
                                                      const file = e.target.files?.[0] || null;
                                                      setPlatformImageControls(prev => ({
                                                        ...prev,
                                                        [platform.id]: { ...prev[platform.id], startingImage: file }
                                                      }));
                                                    }}
                                                  />
                                                  <Label htmlFor={`starting-image-${platform.id}`} className="cursor-pointer">
                                                    <div className="space-y-2">
                                                      <Image className="w-8 h-8 mx-auto text-gray-400" />
                                                      {platformImageControls[platform.id]?.startingImage ? (
                                                        <p className="text-white font-medium">{platformImageControls[platform.id].startingImage?.name}</p>
                                                      ) : (
                                                        <p className="text-gray-400">Upload a base image for {platform.label}</p>
                                                      )}
                                                      <p className="text-xs text-gray-500">Click to browse or drag & drop</p>
                                                    </div>
                                                  </Label>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Save Settings */}
                                          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                                            <Button 
                                              variant="outline" 
                                              className="border-white/20 text-white hover:bg-white/10"
                                              onClick={() => {
                                                setPlatformImageControls(prev => ({
                                                  ...prev,
                                                  [platform.id]: {
                                                    enabled: false,
                                                    style: "",
                                                    guidance: "",
                                                    caption: "",
                                                    ratio: "16:9",
                                                    startingImage: null
                                                  }
                                                }));
                                              }}
                                            >
                                              Reset to Defaults
                                            </Button>
                                            <Button 
                                              className="cosmic-button"
                                              onClick={async () => {
                                                if (!user || !selectedCompany) {
                                                  toast({
                                                    title: "Error",
                                                    description: "Please ensure you're logged in and have a company selected.",
                                                    variant: "destructive"
                                                  });
                                                  return;
                                                }

                                                const platformSettings = platformImageControls[platform.id];
                                                if (!platformSettings) return;

                                                const result = await saveImageControlSettings(
                                                  user.id,
                                                  selectedCompany.id,
                                                  2,
                                                  platformSettings,
                                                  platform.id
                                                );

                                                if (result.success) {
                                                  toast({
                                                    title: "Platform Settings Saved!",
                                                    description: `${platform.label} image control preferences saved as defaults.`,
                                                  });
                                                } else {
                                                  toast({
                                                    title: "Save Failed",
                                                    description: result.error || "Failed to save platform settings.",
                                                    variant: "destructive"
                                                  });
                                                }
                                              }}
                                            >
                                              <SaveIcon className="w-4 h-4 mr-2" />
                                              Save as Default
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
    </TooltipProvider>
  );
};

export default ContentGenerator;
