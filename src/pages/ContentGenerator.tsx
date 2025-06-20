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
    ArrowRight, Sparkles, Instagram, Facebook, Twitter, Linkedin, Info, 
    Image as ImageIconLucide, Video as VideoIconLucide, Type as TypeIconLucide, 
    Wand2, Check, FileText, Bot, Palette, Globe, SaveIcon, Loader2, Coins
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { calculateCreditsNeeded, deductCredits, getUserCredits } from "@/services/creditsService";

import { saveGeneratedPostsToSupabase } from '@/services/supabaseService';
import GenerationProgressModal, { ProgressStage } from '@/components/GenerationProgressModal';

const API_BASE_URL = "https://gcs-gemini-openai-app-1006785094868.europe-central2.run.app";

interface RequirementItem { type: string; detail: string; }
interface PostHistoryItem { platform: string; text: string; }
interface PipelineRequestBody {
  company_name: string;
  company_mission: string;
  company_sentiment: string;
  language: string;
  platforms_post_types_map: Array<Record<string, string>>;
  subject: string;
  tone: string;
  requirements?: RequirementItem[] | null;
  posts_history?: PostHistoryItem[] | null;
  upload_to_cloud: boolean;
}

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
    platformMedia: {} as Record<string, 'Text' | 'Image' | 'Video' | 'Let Model Decide' | 'auto'> 
  });

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

  const platforms = [
    { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
    { id: "twitter", label: "Twitter", icon: Twitter, color: "text-sky-500" },
    { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-700" }
  ];

  const tones = [
    "Professional", "Casual & Friendly", "Inspirational", "Humorous",
    "Educational", "Urgent", "Conversational", "Authoritative", "Neutral"
  ];

  const mediaOptions = [
    { value: 'text', label: 'Text', icon: TypeIconLucide, credits: 1 },
    { value: 'image', label: 'Image + Text', icon: ImageIconLucide, credits: 3 },
    { value: 'video', label: 'Video + Text', icon: VideoIconLucide, credits: 3, comingSoon: true }, // Added comingSoon flag
    { value: 'auto', label: 'Auto-Decide', icon: Wand2, credits: 3 },
  ];

  const creditsNeeded = calculateCreditsNeeded(formData.platforms, formData.platformMedia);
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
          platformMedia: { ...prev.platformMedia, [platformId]: 'Text' }
        };
      }
    });
  };

  const handleMediaTypeSelect = (platformId: string, mediaType: 'text' | 'image' | 'video' | 'auto') => {
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

    const platforms_post_types_map = formData.platforms.map(platformId => {
      let mediaTypeApiValue: string = formData.platformMedia[platformId] || 'auto';
      if (mediaTypeApiValue === 'auto') mediaTypeApiValue = 'Let Model Decide';
      else if (mediaTypeApiValue === 'text') mediaTypeApiValue = 'Text';
      else if (mediaTypeApiValue === 'image') mediaTypeApiValue = 'Image';
      else if (mediaTypeApiValue === 'video') mediaTypeApiValue = 'Video';
      return { [platformId]: mediaTypeApiValue };
    });

    const payload: PipelineRequestBody = {
      company_name: selectedCompany.name,
      company_mission: selectedCompany.mission || "Mission not set",
      company_sentiment: selectedCompany.tone_of_voice || "Neutral",
      language: formData.language,
      platforms_post_types_map: platforms_post_types_map as Array<Record<string, string>>,
      subject: formData.subject,
      tone: formData.tone,
      requirements: null,
      posts_history: null,
      upload_to_cloud: true,
    };
    console.log("Sending payload to API:", payload);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-posts`, {
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
        title: "Content Universe Expanded! ✨",
        description: `Your new creations (ID: ${result.pipeline_id}) are ready.`,
      });
      navigate("/generation-success", { state: { pipelineResult: result, insertedPostIds: insertedPosts.map((p: any) => p.id) } });

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
      <div className={`min-h-screen ${isGenerating ? 'blur-sm pointer-events-none' : ''}`}>
        <Navigation />
        
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-4xl mx-auto">
             <Card className="cosmic-card border-0 cosmic-glow mb-6">
              <CardHeader className="cosmic-card-header">
                <CardTitle className="text-white text-xl">Company Selection</CardTitle>
                <CardDescription className="text-gray-300">
                  Choose the company you want to generate content for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompanySelector />
              </CardContent>
            </Card>

            <Card className="cosmic-card border-0 cosmic-glow">
              <CardHeader className="cosmic-card-header">
                <CardTitle className="text-white text-2xl font-bold flex items-center">
                  Content Details
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
                        <p className="text-red-400 text-sm mt-2">
                          Insufficient credits. Credits reset daily if under 10.
                        </p>
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
                              {mediaOptions.map(({ value, label, icon: Icon, credits, comingSoon }) => {
                                if (comingSoon) {
                                  return (
                                    <Tooltip key={value} delayDuration={100}>
                                      <TooltipTrigger asChild>
                                        {/* 
                                          This span acts as the event target for the tooltip.
                                          The Button inside is disabled and has pointer-events: none 
                                          so events "pass through" to this span.
                                        */}
                                        <span className="w-full inline-block"> {/* Ensure span takes up the button's space */}
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start text-xs text-gray-500 opacity-60 cursor-not-allowed pointer-events-none"
                                            disabled // Button is functionally disabled
                                            aria-disabled="true" // Good for accessibility
                                            // No onClick needed here as it's disabled
                                          >
                                            <Icon className="w-3 h-3 mr-2" />
                                            {label} ({credits}c)
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-gray-800 border-white/20 text-white">
                                        <p>Coming soon!</p>
                                      </TooltipContent>
                                    </Tooltip>
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
                                    onClick={() => handleMediaTypeSelect(platform.id, value as 'text' | 'image' | 'video' | 'auto')}
                                  >
                                    <Icon className="w-3 h-3 mr-2" />
                                    {label} ({credits}c)
                                  </Button>
                                );
                              })}
                            </div>
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
