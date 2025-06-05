
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Image, User, ArrowRight } from "lucide-react";

const CampaignPreview = () => {
  const mockCampaigns = [
    {
      id: 1,
      title: "Product Launch Campaign",
      date: "2024-01-15",
      platform: "Instagram",
      status: "approved",
      preview: "🚀 Ready to transform your content strategy? Creators Multiverse makes it effortless...",
      image: "Product launch visual with futuristic elements"
    },
    {
      id: 2,
      title: "Thought Leadership Post",
      date: "2024-01-16",
      platform: "LinkedIn",
      status: "draft",
      preview: "The future of content creation is here. At Creators Multiverse, we believe...",
      image: "Professional minimalist graphic"
    },
    {
      id: 3,
      title: "Community Engagement",
      date: "2024-01-17",
      platform: "Twitter",
      status: "approved",
      preview: "Content creation shouldn't be a bottleneck for your business growth 🚀...",
      image: "Dynamic social media icons"
    },
    {
      id: 4,
      title: "Behind the Scenes",
      date: "2024-01-18",
      platform: "Instagram",
      status: "scheduled",
      preview: "Ever wondered how AI creates content that feels authentically you? Here's a peek...",
      image: "Behind the scenes workspace"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "draft": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "scheduled": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "Instagram": return "📸";
      case "LinkedIn": return "💼";
      case "Twitter": return "🐦";
      case "Facebook": return "👥";
      default: return "📱";
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Campaign <span className="text-cosmic font-serif">Calendar</span>
              </h1>
              <p className="text-gray-300 text-lg">
                Manage and schedule your content across all platforms
              </p>
            </div>
            
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white glow-effect"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule New Post
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockCampaigns.map((campaign) => (
              <Card key={campaign.id} className="cosmic-card group hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`${getStatusColor(campaign.status)} text-xs px-2 py-1`}>
                      {campaign.status}
                    </Badge>
                    <span className="text-2xl">
                      {getPlatformIcon(campaign.platform)}
                    </span>
                  </div>
                  
                  <CardTitle className="text-white text-lg leading-tight">
                    {campaign.title}
                  </CardTitle>
                  
                  <CardDescription className="text-gray-400 text-sm">
                    {new Date(campaign.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Preview Image */}
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-300">
                      <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">{campaign.image}</p>
                    </div>
                  </div>
                  
                  {/* Preview Text */}
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {campaign.preview}
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-accent hover:bg-accent/90 text-black"
                    >
                      {campaign.status === 'approved' ? 'Schedule' : 'Review'}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="cosmic-card text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-accent mb-2">12</div>
                <div className="text-gray-300">Posts This Month</div>
              </CardContent>
            </Card>
            
            <Card className="cosmic-card text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">4</div>
                <div className="text-gray-300">Platforms Connected</div>
              </CardContent>
            </Card>
            
            <Card className="cosmic-card text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-green-400 mb-2">89%</div>
                <div className="text-gray-300">Engagement Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignPreview;
