
import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Image, Calendar, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ContentGenerator = () => {
  const [topic, setTopic] = useState("");
  const [intent, setIntent] = useState("");
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    instagram: true,
    facebook: true,
    twitter: true,
    linkedin: true
  });

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-600' },
    { id: 'facebook', name: 'Facebook', icon: '👥', color: 'from-blue-600 to-blue-700' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'from-sky-400 to-sky-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'from-blue-700 to-blue-800' }
  ];

  const mockContent = {
    instagram: {
      caption: "🚀 Ready to transform your content strategy? Creators Multiverse makes it effortless to scale your brand across platforms. From vision to viral - we've got you covered! ✨\n\n#CreatorsMultiverse #ContentStrategy #AIContent #SocialMediaGrowth #DigitalMarketing",
      hashtags: ["#CreatorsMultiverse", "#ContentStrategy", "#AIContent", "#SocialMediaGrowth", "#DigitalMarketing"],
      imagePrompt: "Futuristic digital workspace with holographic social media icons floating around a content creator"
    },
    facebook: {
      caption: "Transform your content strategy with Creators Multiverse! 🌟\n\nWe're revolutionizing how brands connect with their audience across social platforms. Our AI-powered tools help you create authentic, engaging content that resonates with your community.\n\nReady to take your social media game to the next level? Let's make your brand shine! ✨",
      hashtags: ["#ContentStrategy", "#DigitalMarketing", "#SocialMedia", "#BrandGrowth"],
      imagePrompt: "Professional brand visualization with multiple social media platforms connected"
    },
    linkedin: {
      caption: "The future of content creation is here. At Creators Multiverse, we believe every brand deserves content that truly represents their vision and values.\n\nOur AI-powered platform helps solopreneurs and marketing teams create authentic, platform-optimized content at scale.\n\nWhat's your biggest content creation challenge?",
      hashtags: ["#ContentCreation", "#DigitalMarketing", "#AI", "#Entrepreneurship"],
      imagePrompt: "Professional minimalist graphic showing content flowing across multiple platform icons"
    },
    twitter: {
      caption: "Content creation shouldn't be a bottleneck for your business growth 🚀\n\nWith Creators Multiverse, generate brand-aligned posts for Instagram, LinkedIn, Twitter & more in minutes.\n\nWhat platform do you struggle with most?",
      hashtags: ["#ContentCreation", "#AI", "#SocialMedia"],
      imagePrompt: "Dynamic graphic showing content multiplying across different social platforms"
    }
  };

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platformId]: checked
    }));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Please enter a topic",
        description: "We need a topic to generate amazing content for you!",
        variant: "destructive"
      });
      return;
    }

    const selectedCount = Object.values(selectedPlatforms).filter(Boolean).length;
    if (selectedCount === 0) {
      toast({
        title: "Please select at least one platform",
        description: "Choose which platforms you want to create content for!",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation delay
    setTimeout(() => {
      setGeneratedContent(mockContent);
      setIsGenerating(false);
      toast({
        title: "Content Generated! ✨",
        description: `Content created for ${selectedCount} platform${selectedCount > 1 ? 's' : ''}.`
      });
    }, 2000);
  };

  const handleApprove = (platform: string) => {
    toast({
      title: "Content Approved! 🎉",
      description: `${platform} post has been added to your campaign calendar.`
    });
  };

  const handleAbort = () => {
    setGeneratedContent(null);
    setTopic("");
    setIntent("");
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Content <span className="text-cosmic font-serif">Generator</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Transform your ideas into platform-optimized content instantly
            </p>
          </div>

          {!generatedContent ? (
            <div className="max-w-2xl mx-auto">
              <Card className="cosmic-card">
                <CardHeader>
                  <CardTitle className="text-white">Generate Content</CardTitle>
                  <CardDescription className="text-gray-300">
                    Tell us what you want to create
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-white">Topic/Subject</Label>
                    <Input
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Product launch, Company update, Tips & tricks"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intent" className="text-white">Intent & Direction</Label>
                    <Textarea
                      id="intent"
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      placeholder="What's the goal? Who's the audience? Any specific tone or style?"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white font-semibold">Target Platforms</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {platforms.map((platform) => (
                        <div key={platform.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          <Checkbox
                            id={platform.id}
                            checked={selectedPlatforms[platform.id as keyof typeof selectedPlatforms]}
                            onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <label
                            htmlFor={platform.id}
                            className="flex items-center space-x-2 text-white cursor-pointer flex-1"
                          >
                            <span className="text-lg">{platform.icon}</span>
                            <span className="font-medium">{platform.name}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg" 
                    className="w-full bg-primary hover:bg-primary/90 text-white glow-effect"
                  >
                    {isGenerating ? "Generating..." : "Generate Content"}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header with Abort Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Generated Content</h2>
                <Button 
                  onClick={handleAbort}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Abort & Start Over
                </Button>
              </div>

              {/* All Platform Cards */}
              <div className="grid lg:grid-cols-2 gap-6">
                {platforms
                  .filter(platform => selectedPlatforms[platform.id as keyof typeof selectedPlatforms])
                  .map((platform) => {
                    const content = generatedContent[platform.id as keyof typeof generatedContent];
                    return (
                      <Card key={platform.id} className="cosmic-card">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-white font-semibold`}>
                                {platform.icon}
                              </div>
                              {platform.name} Post
                            </CardTitle>
                            <Button 
                              onClick={() => handleApprove(platform.name)}
                              size="sm" 
                              className="bg-accent hover:bg-accent/90 text-black"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Caption */}
                          <div className="space-y-2">
                            <Label className="text-white font-semibold">Caption</Label>
                            <Textarea
                              value={content.caption}
                              readOnly
                              className="bg-white/5 border-white/20 text-white min-h-[120px] resize-none"
                            />
                          </div>

                          {/* Hashtags */}
                          <div className="space-y-2">
                            <Label className="text-white font-semibold">Hashtags</Label>
                            <div className="flex flex-wrap gap-2">
                              {content.hashtags.map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="border-accent text-accent">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Visual Preview */}
                          <div className="space-y-2">
                            <Label className="text-white font-semibold">Visual Concept</Label>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                              <div className="flex items-center space-x-3 text-gray-300">
                                <Image className="w-5 h-5" />
                                <span className="text-sm">{content.imagePrompt}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentGenerator;
