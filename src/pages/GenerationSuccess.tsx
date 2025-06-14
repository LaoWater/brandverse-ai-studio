
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Share2, Edit3, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const GenerationSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate generated posts from the content generator
    const mockPosts = [
      {
        id: 1,
        platform: "Instagram",
        title: "Exciting Product Launch",
        content: "🚀 We're thrilled to announce our latest innovation! This groundbreaking product represents months of research and development, designed specifically with our community in mind. #Innovation #ProductLaunch #Exciting",
        mediaType: "image",
        status: "draft" as const,
        engagement: { likes: 0, comments: 0, shares: 0 }
      },
      {
        id: 2,
        platform: "LinkedIn",
        title: "Professional Industry Insights",
        content: "In today's rapidly evolving business landscape, staying ahead means embracing innovation while maintaining our core values. Here are three key strategies that have proven successful in our journey...",
        mediaType: "text",
        status: "draft" as const,
        engagement: { likes: 0, comments: 0, shares: 0 }
      }
    ];
    
    setGeneratedPosts(mockPosts);
  }, []);

  const handleEdit = (postId: number) => {
    toast({
      title: "Edit Post",
      description: "Opening post editor...",
    });
    // In a real app, this would navigate to an edit page
    navigate('/post-manager');
  };

  const handleDownload = (postId: number) => {
    toast({
      title: "Download Started",
      description: "Your post content is being downloaded...",
    });
  };

  const handleShare = (postId: number) => {
    toast({
      title: "Share Options",
      description: "Opening share menu...",
    });
  };

  const handlePublishAll = () => {
    setLoading(true);
    setTimeout(() => {
      toast({
        title: "Posts Published! 🎉",
        description: "Your content has been successfully published to all selected platforms.",
      });
      setLoading(false);
      navigate('/post-manager');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <CheckCircle className="w-20 h-20 text-green-400" />
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="w-8 h-8 text-accent animate-pulse" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Content Generated
                <span className="text-cosmic block mt-2">Successfully!</span>
              </h1>
              
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Your AI-powered content is ready for review and publishing. 
                Each post has been tailored to match your brand voice and platform requirements.
              </p>
            </div>

            {/* Generated Posts */}
            <div className="space-y-6 mb-12">
              {generatedPosts.map((post) => (
                <Card key={post.id} className="cosmic-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-white text-xl">{post.platform}</CardTitle>
                        <Badge className={`${
                          post.mediaType === 'image' ? 'bg-purple-500/20 text-purple-300' :
                          post.mediaType === 'video' ? 'bg-red-500/20 text-red-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {post.mediaType}
                        </Badge>
                        <Badge variant="outline" className="text-gray-300 border-gray-500">
                          {post.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(post.id)}
                          className="text-gray-300 hover:text-white hover:bg-white/10"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownload(post.id)}
                          className="text-gray-300 hover:text-white hover:bg-white/10"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleShare(post.id)}
                          className="text-gray-300 hover:text-white hover:bg-white/10"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-gray-300">
                      {post.title}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-gray-200 leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                    
                    {post.mediaType !== 'text' && (
                      <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10 border-dashed">
                        <p className="text-gray-400 text-center">
                          📷 {post.mediaType === 'image' ? 'AI-generated image' : 'AI-generated video'} will be attached
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/content-generator')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Generate More Content
              </Button>
              
              <Button 
                size="lg"
                onClick={handlePublishAll}
                disabled={loading}
                className="cosmic-button"
              >
                {loading ? 'Publishing...' : 'Publish All Posts'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="lg"
                onClick={() => navigate('/post-manager')}
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                View in Library
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GenerationSuccess;
