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
import { ArrowRight, Sparkles, Instagram, Facebook, Twitter, Linkedin, Info, Image, Video, Type, Wand2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";

import { saveGeneratedPostsToSupabase } from '@/services/supabaseService'
import GenerationProgressModal, { ProgressStage } from '@/components/GenerationProgressModal'; // Import modal and type


// Define the API endpoint URL
// In a real app, this would come from an environment variable: process.env.REACT_APP_API_URL or similar
const API_BASE_URL = "http://localhost:8000"; // Or your deployed Docker container's URL

// Define types for API request (matching Pydantic models - optional but good practice)
interface RequirementItem {
  type: string;
  detail: string;
}

interface PostHistoryItem {
  platform: string;
  text: string;
  // ... other fields
}

interface PipelineRequestBody {
  company_name: string;
  company_mission: string;
  company_sentiment: string; // This corresponds to company.tone_of_voice in your CompanyContext
  language: string;
  platforms_post_types_map: Array<Record<string, string>>;
  subject: string;
  tone: string; // This is the user-selected tone for the post
  requirements?: RequirementItem[] | null;
  posts_history?: PostHistoryItem[] | null;
  upload_to_cloud: boolean;
}


const ContentGenerator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCompany } = useCompany(); // selectedCompany has: name, mission, tone_of_voice
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: "", // Renamed from topic to match API
    tone: "",    // This is the post-specific tone
    language: "en", // Default from languages[0].code
    platforms: [] as string[],
    platformMedia: {} as Record<string, 'Text' | 'Image' | 'Video' | 'Auto' | 'Let Model Decide'>
  });

  // Default language from your languages array
  useEffect(() => {
    const defaultLang = languages.find(l => l.isDefault)?.code || 'en';
    setFormData(prev => ({ ...prev, language: defaultLang }));
  }, []);


  const languages = [
    { code: "en", name: "English", isDefault: true },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    // ... (keep your full list)
     { code: "ro", name: "Romanian" },
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
    "Professional",
    "Casual & Friendly",
    "Inspirational",
    "Humorous",
    "Educational",
    "Urgent",
    "Conversational",
    "Authoritative",
    "Neutral" // Added Neutral as a default option if needed
  ];

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
          platformMedia: { ...prev.platformMedia, [platformId]: 'auto' }
        };
      }
    });
  };

  const handleMediaTypeSelect = (platformId: string, mediaType: 'text' | 'image' | 'video' | 'auto') => {
    setFormData(prev => ({
      ...prev,
      platformMedia: { ...prev.platformMedia, [platformId]: mediaType }
    }));
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
     // Validate subject and tone
    if (!formData.subject.trim()) {
      toast({ title: "Topic Required", description: "Please enter a topic/subject for your post.", variant: "destructive" });
      return;
    }
    if (!formData.tone) { // Check if tone is selected
      toast({ title: "Tone Required", description: "Please select a sentiment/tonality for your post.", variant: "destructive" });
      return;
    }


    if (formData.platforms.length === 0) {
      toast({ title: "Platform Required", description: "Please select at least one platform.", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Prepare platforms_post_types_map for the API
    const platforms_post_types_map = formData.platforms.map(platformId => {
      let mediaType = formData.platformMedia[platformId];
      // Convert 'auto' to 'Let Model Decide' or handle as per API expectation
      // Your API expects "Image", "Text", "Video", or "Let Model Decide"
      if (mediaType === 'auto') {
        mediaType = 'Let Model Decide';
      } else if (mediaType === 'text') {
        mediaType = 'Text';
      } else if (mediaType === 'image') {
        mediaType = 'Image';
      } else if (mediaType === 'video') {
        mediaType = 'Video';
      }
      return { [platformId]: mediaType };
    });

    const payload: PipelineRequestBody = {
      company_name: selectedCompany.name,
      company_mission: selectedCompany.mission || "Default mission if not available", // Provide a fallback or ensure it's always there
      company_sentiment: selectedCompany.tone_of_voice || "Neutral", // API expects company_sentiment, map from tone_of_voice
      language: formData.language,
      platforms_post_types_map: platforms_post_types_map as Array<Record<string, string>>, // Cast if necessary
      subject: formData.subject,
      tone: formData.tone, // This is the post-specific tone selected by the user
      requirements: null, // Defaulting to null as per your request
      posts_history: null, // Defaulting to null
      upload_to_cloud: true, // Defaulting to true
    };

    console.log("Sending payload to API:", payload);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add Authorization header if your API requires it (e.g., JWT token)
          // 'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify(payload),
      });

      setLoading(false);

      if (!response.ok) {
        // Try to parse error message from backend if available
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If response is not JSON or empty
          console.error("Could not parse error response:", parseError);
        }
        console.error("API Error Response:", errorData);
        toast({
          title: "Generation Failed",
          description: errorData?.detail || `Server responded with ${response.status}`,
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();
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
          details: main_text_content,        // Main text content
          has_picture: picture_url,          // GCS Image URL or null
          has_video: video_url,              // GCS Video URL or null
          status: 'draft',
          metadata: {                       // <<<< All extra info here
            pipeline_id: result.pipeline_id,
            post_type_from_api: generatedPost.post_type, // e.g., "Image", "Text"
            media_generation_prompt_used: generatedPost.media_generation_prompt_used,
            text_content_cloud_url: text_content_cloud_url, // Link to the raw .txt file in GCS
            // Add any other fields from generatedPost you want to preserve
            // For example, the local file paths if they were useful for some reason, though less so now
            // local_text_file_path: generatedPost.text_file_path,
            // local_media_file_path: generatedPost.media_asset?.file_path,
          }
        };
      });
      
      console.log("Posts to insert into Supabase (Corrected for details):", postsToInsert);
      
      try {
        const { data: insertedPosts, error: supabaseError } = await saveGeneratedPostsToSupabase(postsToInsert);
    
        if (supabaseError || !insertedPosts) {
            toast({
                title: "Saving Failed",
                description: "Could not save generated posts to the database. " + (supabaseError?.message || ""),
                variant: "destructive",
            });
            // setLoading(false); // Already handled in the main try-catch
            return; // Or decide how to proceed. Content is generated but not saved.
        }
    
        // Now navigate with the insertedPosts data or the original pipelineResult
        toast({
            title: "Content Generated & Saved! ✨",
            description: `Your content (ID: ${result.pipeline_id}) has been created and saved.`,
        });
        // Pass the original pipeline result for display, and perhaps IDs of inserted posts
        navigate("/generation-success", { 
            state: { 
                pipelineResult: result, // For displaying generated content
                insertedPostIds: insertedPosts.map(p => p.id) // If needed on next page
            } 
        });
    
    } catch (supabaseError) { // Add this catch block
      toast({
        title: "Saving Failed",
        description: "An error occurred while saving to the database.",
        variant: "destructive",
      });
    }
        
    } catch (apiError) { // This catch is for the fetch API call
        setLoading(false);
        console.error("API call or Supabase save error:", apiError);
        toast({
            title: "Operation Failed",
            description: "An error occurred during content generation or saving.",
            variant: "destructive",
        });
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <Navigation />
        
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-4xl mx-auto">
            {/* ... (Company Selection Card - no changes needed here) ... */}
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
                  <Sparkles className="w-6 h-6 mr-2 text-accent" />
                  Content Details
                </CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  Provide details about the content you want to generate
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="subject" className="text-white font-medium">Topic/Subject</Label> {/* Changed from topic to subject */}
                      <Input
                        id="subject" // Changed from topic to subject
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="What do you want to post about?"
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 h-12"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="language" className="text-white font-medium">Language</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-gray-400 hover:text-white" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/20 text-white max-w-xs">
                            <p>Model performance might not be state-of-the-art for non-English tasks</p>
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
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400 hover:text-white" />
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
                        {tones.map((toneItem) => ( // Renamed tone to toneItem to avoid conflict
                          <SelectItem key={toneItem} value={toneItem} className="text-white hover:bg-white/10">
                            {toneItem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ... (Platform selection - no major changes needed, just ensure values map correctly) ... */}
                  <div className="space-y-4">
                    <Label className="text-white font-medium">Target Platforms & Media Types</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Changed to 1 column on small screens */}
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
                              <div className="mt-3 pl-8 space-y-2"> {/* Indent media options */}
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { value: 'auto', label: 'Auto', icon: Wand2 },
                                    { value: 'text', label: 'Text', icon: Type },
                                    { value: 'image', label: 'Image', icon: Image },
                                    { value: 'video', label: 'Video', icon: Video }
                                  ].map(({ value, label, icon: Icon }) => (
                                    <Button 
                                      key={value}
                                      type="button" 
                                      variant="ghost"
                                      size="sm"
                                      className={`w-full justify-start text-xs
                                                  ${selectedMedia === value ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                                      onClick={() => handleMediaTypeSelect(platform.id, value as 'text' | 'image' | 'video' | 'auto')}
                                    >
                                      <Icon className="w-3 h-3 mr-2" />
                                      {label}
                                    </Button>
                                  ))}
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
                    disabled={loading || !selectedCompany || formData.platforms.length === 0 || !formData.subject.trim() || !formData.tone}
                  >
                    {loading ? 'Generating Content...' : 'Generate Content'} 
                    <ArrowRight className="ml-2 w-5 h-5" />
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