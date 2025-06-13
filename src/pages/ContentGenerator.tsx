import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { CompanySelector } from "@/components/CompanySelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, Sparkles, Instagram, Facebook, Twitter, Linkedin, Info, Image, Video, Type, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";

const ContentGenerator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    topic: "",
    tone: "",
    language: "en",
    platforms: [] as string[],
    platformMedia: {} as Record<string, 'auto' | 'text' | 'image' | 'video'>
  });

  const languages = [
    { code: "en", name: "English", isDefault: true },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese (Simplified)" },
    { code: "zh-tw", name: "Chinese (Traditional)" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "nl", name: "Dutch" },
    { code: "sv", name: "Swedish" },
    { code: "da", name: "Danish" },
    { code: "no", name: "Norwegian" },
    { code: "fi", name: "Finnish" },
    { code: "pl", name: "Polish" },
    { code: "tr", name: "Turkish" },
    { code: "he", name: "Hebrew" },
    { code: "th", name: "Thai" },
    { code: "vi", name: "Vietnamese" },
    { code: "uk", name: "Ukrainian" },
    { code: "cs", name: "Czech" },
    { code: "hu", name: "Hungarian" },
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
    "Authoritative"
  ];

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    console.log("Platform change:", platformId, checked);
    setFormData(prev => {
      const newPlatforms = checked 
        ? [...prev.platforms, platformId]
        : prev.platforms.filter(p => p !== platformId);
      
      // Set default media type to 'auto' when platform is selected, remove when unchecked
      const newPlatformMedia = { ...prev.platformMedia };
      if (checked) {
        newPlatformMedia[platformId] = 'auto';
      } else {
        delete newPlatformMedia[platformId];
      }
      
      return {
        ...prev,
        platforms: newPlatforms,
        platformMedia: newPlatformMedia
      };
    });
  };

  const handleMediaChange = (platformId: string, mediaType: 'auto' | 'text' | 'image' | 'video') => {
    console.log("Media change:", platformId, mediaType);
    setFormData(prev => ({
      ...prev,
      platformMedia: {
        ...prev.platformMedia,
        [platformId]: mediaType
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate content.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!selectedCompany) {
      toast({
        title: "Company Required",
        description: "Please select a company to generate content for.",
        variant: "destructive",
      });
      return;
    }

    if (formData.platforms.length === 0) {
      toast({
        title: "Platform Required",
        description: "Please select at least one platform.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log("Generating content with data:", { ...formData, company: selectedCompany.name });

    // Simulate content generation
    setTimeout(() => {
      toast({
        title: "Content Generated! ✨",
        description: "Your content has been created and is ready for review."
      });
      setLoading(false);
      navigate("/post-manager");
    }, 2000);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <Navigation />
        
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                Generate <span className="text-cosmic font-serif">Content</span>
              </h1>
              <p className="text-gray-300 text-lg">
                Create engaging content powered by AI that matches your brand voice
              </p>
            </div>

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
                      <Label htmlFor="topic" className="text-white font-medium">Topic/Subject</Label>
                      <Input
                        id="topic"
                        value={formData.topic}
                        onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
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
                      <Label htmlFor="tone" className="text-white font-medium">Sentiment/Tonality</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400 hover:text-white" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 border-white/20 text-white max-w-xs">
                          <p>Expand more on your company's presence, philosophy, and beliefs - the more depth you provide, the more accurate our models will perform.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={formData.tone} onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white h-12">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {tones.map((tone) => (
                          <SelectItem key={tone} value={tone} className="text-white hover:bg-white/10">
                            {tone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-white font-medium">Target Platforms</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {platforms.map((platform) => {
                        const IconComponent = platform.icon;
                        const isSelected = formData.platforms.includes(platform.id);
                        const selectedMedia = formData.platformMedia[platform.id];
                        
                        return (
                          <div key={platform.id} className="space-y-3">
                            <div 
                              className="flex items-center space-x-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                              onClick={() => handlePlatformChange(platform.id, !isSelected)}
                            >
                              <Checkbox
                                id={platform.id}
                                checked={isSelected}
                                onChange={() => {}} // Controlled by parent click
                                className="border-white/20 pointer-events-none"
                              />
                              <div className="flex items-center space-x-2 flex-1">
                                <IconComponent className={`w-5 h-5 ${platform.color}`} />
                                <label className="text-white cursor-pointer">
                                  {platform.label}
                                </label>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="ml-4 space-y-2">
                                <Label className="text-gray-300 text-sm">Media Type</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div 
                                    className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-white/5"
                                    onClick={() => handleMediaChange(platform.id, 'auto')}
                                  >
                                    <div className={`w-4 h-4 rounded-full border-2 border-white/20 flex items-center justify-center ${selectedMedia === 'auto' ? 'bg-white' : ''}`}>
                                      {selectedMedia === 'auto' && <div className="w-2 h-2 bg-gray-900 rounded-full" />}
                                    </div>
                                    <Label className="text-gray-300 text-sm flex items-center cursor-pointer">
                                      <Wand2 className="w-4 h-4 mr-1" />
                                      Let Model Decide
                                    </Label>
                                  </div>
                                  <div 
                                    className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-white/5"
                                    onClick={() => handleMediaChange(platform.id, 'text')}
                                  >
                                    <div className={`w-4 h-4 rounded-full border-2 border-white/20 flex items-center justify-center ${selectedMedia === 'text' ? 'bg-white' : ''}`}>
                                      {selectedMedia === 'text' && <div className="w-2 h-2 bg-gray-900 rounded-full" />}
                                    </div>
                                    <Label className="text-gray-300 text-sm flex items-center cursor-pointer">
                                      <Type className="w-4 h-4 mr-1" />
                                      Text
                                    </Label>
                                  </div>
                                  <div 
                                    className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-white/5"
                                    onClick={() => handleMediaChange(platform.id, 'image')}
                                  >
                                    <div className={`w-4 h-4 rounded-full border-2 border-white/20 flex items-center justify-center ${selectedMedia === 'image' ? 'bg-white' : ''}`}>
                                      {selectedMedia === 'image' && <div className="w-2 h-2 bg-gray-900 rounded-full" />}
                                    </div>
                                    <Label className="text-gray-300 text-sm flex items-center cursor-pointer">
                                      <Image className="w-4 h-4 mr-1" />
                                      Image
                                    </Label>
                                  </div>
                                  <div 
                                    className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-white/5"
                                    onClick={() => handleMediaChange(platform.id, 'video')}
                                  >
                                    <div className={`w-4 h-4 rounded-full border-2 border-white/20 flex items-center justify-center ${selectedMedia === 'video' ? 'bg-white' : ''}`}>
                                      {selectedMedia === 'video' && <div className="w-2 h-2 bg-gray-900 rounded-full" />}
                                    </div>
                                    <Label className="text-gray-300 text-sm flex items-center cursor-pointer">
                                      <Video className="w-4 h-4 mr-1" />
                                      Video
                                    </Label>
                                  </div>
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
                    disabled={loading || !selectedCompany || formData.platforms.length === 0}
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
