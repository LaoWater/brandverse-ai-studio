
import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Image, Calendar, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ContentGenerator = () => {
  const [topic, setTopic] = useState("");
  const [intent, setIntent] = useState("");
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const mockContent = {
    instagram: {
      caption: "🚀 Ready to transform your content strategy? Creators Multiverse makes it effortless to scale your brand across platforms. From vision to viral - we've got you covered! ✨\n\n#CreatorsMultiverse #ContentStrategy #AIContent #SocialMediaGrowth #DigitalMarketing",
      hashtags: ["#CreatorsMultiverse", "#ContentStrategy", "#AIContent", "#SocialMediaGrowth", "#DigitalMarketing"],
      imagePrompt: "Futuristic digital workspace with holographic social media icons floating around a content creator"
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

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Please enter a topic",
        description: "We need a topic to generate amazing content for you!",
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
        description: "Your platform-specific content is ready for review."
      });
    }, 2000);
  };

  const handleApprove = (platform: string) => {
    toast({
      title: "Content Approved! 🎉",
      description: `${platform} post has been added to your campaign calendar.`
    });
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Content <span className="text-cosmic font-serif">Generator</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Transform your ideas into platform-optimized content instantly
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="lg:col-span-1">
              <Card className="cosmic-card sticky top-24">
                <CardHeader>
                  <CardTitle className="text-white">Generate Content</CardTitle>
                  <CardDescription className="text-gray-300">
                    Tell us what you want to create
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
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

            {/* Results Section */}
            <div className="lg:col-span-2">
              {generatedContent ? (
                <Tabs defaultValue="instagram" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
                    <TabsTrigger value="instagram" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      📸 Instagram
                    </TabsTrigger>
                    <TabsTrigger value="linkedin" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      💼 LinkedIn
                    </TabsTrigger>
                    <TabsTrigger value="twitter" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      🐦 Twitter
                    </TabsTrigger>
                  </TabsList>

                  {Object.entries(generatedContent).map(([platform, content]: [string, any]) => (
                    <TabsContent key={platform} value={platform}>
                      <Card className="cosmic-card">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white capitalize">
                              {platform} Post
                            </CardTitle>
                            <Button 
                              onClick={() => handleApprove(platform)}
                              size="sm" 
                              className="bg-accent hover:bg-accent/90 text-black"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                          {/* Caption */}
                          <div className="space-y-2">
                            <Label className="text-white font-semibold">Caption</Label>
                            <Textarea
                              value={content.caption}
                              readOnly
                              className="bg-white/5 border-white/20 text-white min-h-[120px]"
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
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <Card className="cosmic-card">
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center text-gray-400">
                      <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Generate content to see platform-specific previews here</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentGenerator;
