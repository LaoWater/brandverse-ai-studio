import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge"; // Not used in current logic, can be removed if not needed
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Download, Share2, Edit3, ArrowRight, Sparkles, Calendar, Users, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EditPostDialog } from "@/components/EditPostDialog";
import { FaXTwitter, FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa6";



// Interface for the data structure coming from the API (pipelineResult.posts)
interface ApiPostData {
  platform: string;
  post_type: string; // e.g., "Text", "Image", "Video"
  text_file_path?: string; // Optional, as it might not always be present
  media_asset?: {
    type?: string; // e.g., "image", "video"
    url?: string;  // If media is directly linked
    // ... any other relevant media asset properties
  } | null;
  original_text_content: string;
  media_generation_prompt_used?: string | null;
  cloud_storage?: {
    platform: string;
    filename_base: string;
    uploads: Array<{
      success: boolean;
      cloud_path: string;
      public_url: string; // Potentially useful for images/videos
      bucket_name: string;
      content_type: string;
      size: number;
      uploaded_at: string;
      content_preview?: string;
    }>;
  } | null;
  // Add any other fields that might come directly from the API post object
  id?: string; // Making it optional here, as we'll try to map it from insertedPostIds
}

// Interface for the transformed post data used by the component
interface GeneratedPost {
  company_id: string;
  created_date: string;
  details: string;
  has_picture: string; // "true" or "false"
  has_video: string;   // "true" or "false"
  id: string;          // This will be populated during transformation
  metadata: {
    post_type?: string;
    hashtags?: string[];
    cloud_urls?: string[]; // To store public URLs of media
    // ... any other metadata
  };
  platform_type: "instagram" | "linkedin" | "twitter" | "facebook" | "tiktok"; // Removed "unknown" for type safety
  status: "draft" | "posted" | "approved";
  title: string;
  updated_at: string;
  // Store the original API data if needed for editing or other purposes
  original_api_data?: ApiPostData;
}

// Updated PipelineResult to reflect the actual structure of 'posts'
interface PipelineResultFromApi {
  pipeline_id: string;
  subject: string;
  platform_configurations: Record<string, string>;
  language_used: string;
  generated_at: string;
  posts: ApiPostData[]; // Use the ApiPostData interface here
  cloud_uploads_summary?: any[]; // Keep as any or define if structure is known and used
  requirements?: null | any;
  posts_history?: null | any;
  summary_cloud_storage?: any; // Keep as any or define if structure is known and used
}

// For the component's state, we'll use a version of PipelineResult
// that contains the transformed GeneratedPost[]
interface PipelineResultForState {
  pipeline_id: string;
  subject: string;
  platform_configurations: Record<string, string>;
  language_used: string;
  generated_at: string;
  posts: GeneratedPost[]; // This will hold the transformed posts
  summary?: { // Adding summary based on your previous component structure
    totalPosts: number;
    platforms: string[];
    generatedAt: string;
  };
  // Include other top-level fields from PipelineResultFromApi if needed by the UI directly
  cloud_uploads_summary?: any[];
  requirements?: null | any;
  posts_history?: null | any;
  summary_cloud_storage?: any;
}


const GenerationSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  // const [loading, setLoading] = useState(false); // Not currently used, consider removing if not needed
  const [pipelineResultForDisplay, setPipelineResultForDisplay] = useState<PipelineResultForState | null>(null);
  const [subjectFromForm, setSubjectFromForm] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<GeneratedPost | null>(null);

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'from-pink-500 to-purple-600' },
    { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'from-blue-600 to-blue-700' },
    { id: 'twitter', name: 'X', icon: FaXTwitter, color: 'from-sky-400 to-sky-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'from-blue-700 to-blue-800' }
  ];


  useEffect(() => {
    const state = location.state as {
      pipelineResult: PipelineResultFromApi; // Expecting data from API
      insertedPostIds?: string[]; // Optional, as it might not always be there
      subjectFromForm: string;
    };

    console.log("Received location.state:", JSON.stringify(location.state, null, 2));

    if (state?.pipelineResult?.posts) {
      const apiPipelineResult = state.pipelineResult;
      setSubjectFromForm(state.subjectFromForm || apiPipelineResult.subject || "");

      const transformedPosts: GeneratedPost[] = apiPipelineResult.posts.map((apiPost, index) => {
        // --- ID Assignment Logic ---
        // Priority: 1. ID from API post object itself (if API is updated)
        //           2. Corresponding ID from insertedPostIds (if arrays align)
        //           3. Fallback generated ID
        let postId: string;
        if (apiPost.id && typeof apiPost.id === 'string') {
          postId = apiPost.id;
        } else if (state.insertedPostIds && state.insertedPostIds[index]) {
          postId = state.insertedPostIds[index];
        } else {
          console.warn(`Missing ID for post at index ${index}. Generating fallback ID.`);
          postId = `generated-${apiPost.platform}-${Date.now()}-${index}`;
        }

        // --- Platform Type Logic ---
        let platformType: GeneratedPost['platform_type'] = "facebook"; // Default fallback
        const apiPlatformLower = apiPost.platform?.toLowerCase();
        if (["instagram", "linkedin", "twitter", "facebook", "tiktok"].includes(apiPlatformLower)) {
          platformType = apiPlatformLower as GeneratedPost['platform_type'];
        } else {
          console.warn(`Unknown platform type: ${apiPost.platform}`);
        }

        // --- Media Type Logic (has_picture, has_video) ---
        let hasPicture = false;
        let hasVideo = false;
        const postTypeLower = apiPost.post_type?.toLowerCase();
        const mediaAssetTypeLower = apiPost.media_asset?.type?.toLowerCase();

        if (postTypeLower?.includes("image") || mediaAssetTypeLower?.includes("image")) {
          hasPicture = true;
        }
        if (postTypeLower?.includes("video") || mediaAssetTypeLower?.includes("video")) {
          hasVideo = true;
        }
        // If it's just "Text", and no media_asset indicating otherwise
        if (postTypeLower === "text" && !apiPost.media_asset) {
          // Defaults to false are fine
        }

        // --- Metadata: Cloud URLs and Hashtags ---
        const cloudUrls: string[] = [];
        if (apiPost.cloud_storage?.uploads) {
          apiPost.cloud_storage.uploads.forEach(upload => {
            if (upload.success && upload.public_url) {
              cloudUrls.push(upload.public_url);
            }
          });
        }
        const hashtags = apiPost.original_text_content?.match(/#\w+/g) || [];


        return {
          id: postId,
          company_id: "default-company-id", // Placeholder: Replace with actual company ID if available
          created_date: apiPost.cloud_storage?.uploads?.[0]?.uploaded_at || apiPipelineResult.generated_at || new Date().toISOString(),
          details: apiPost.original_text_content || "No content provided.",
          has_picture: String(hasPicture),
          has_video: String(hasVideo),
          metadata: {
            post_type: apiPost.post_type,
            hashtags: hashtags,
            cloud_urls: cloudUrls,
            // You can add more from apiPost or cloud_storage here
          },
          platform_type: platformType,
          status: "draft", // Default status
          title: state.subjectFromForm || apiPipelineResult.subject || `Generated Post for ${apiPost.platform}`,
          updated_at: apiPipelineResult.generated_at || new Date().toISOString(),
          original_api_data: apiPost, // Store original data
        };
      });

      setGeneratedPosts(transformedPosts);
      setSelectedPosts(new Set(transformedPosts.map(post => post.id)));

      // Prepare pipelineResultForDisplay with transformed posts and summary
      const uniquePlatforms = Array.from(new Set(transformedPosts.map(p => p.platform_type)));
      setPipelineResultForDisplay({
        ...apiPipelineResult, // Spread other properties from the API result
        posts: transformedPosts, // Override with transformed posts
        summary: {
          totalPosts: transformedPosts.length,
          platforms: uniquePlatforms,
          generatedAt: new Date(apiPipelineResult.generated_at).toLocaleString(),
        }
      });

    } else {
      console.warn("Pipeline result or posts not found in location.state. Falling back to mock data.");
      // Fallback to mock data if no state is provided or if posts are missing
      const mockPosts: GeneratedPost[] = [
        {
          id: "mock-1",
          company_id: "mock-company",
          created_date: new Date().toISOString(),
          details: "🚀 Mock Instagram Post! #Innovation #ProductLaunch",
          has_picture: "true",
          has_video: "false",
          metadata: { hashtags: ["#Innovation", "#ProductLaunch"] },
          platform_type: "instagram",
          status: "draft",
          title: "Exciting Mock Product Launch",
          updated_at: new Date().toISOString()
        },
        {
          id: "mock-2",
          company_id: "mock-company",
          created_date: new Date().toISOString(),
          details: "Mock LinkedIn Insights: Stay ahead by embracing innovation.",
          has_picture: "false",
          has_video: "false",
          metadata: {},
          platform_type: "linkedin",
          status: "draft",
          title: "Mock Professional Insights",
          updated_at: new Date().toISOString()
        }
      ];
      setGeneratedPosts(mockPosts);
      setSelectedPosts(new Set(mockPosts.map(post => post.id)));
      setSubjectFromForm("Mock Subject");
      setPipelineResultForDisplay({
        pipeline_id: "mock-pipeline",
        subject: "Mock Subject",
        platform_configurations: {},
        language_used: "en",
        generated_at: new Date().toISOString(),
        posts: mockPosts,
        summary: {
          totalPosts: mockPosts.length,
          platforms: ["instagram", "linkedin"],
          generatedAt: new Date().toLocaleString(),
        }
      });
    }
  }, [location.state]);

  const handlePostSelection = (postId: string, checked: boolean) => {
    const newSelection = new Set(selectedPosts);
    if (checked) {
      newSelection.add(postId);
    } else {
      newSelection.delete(postId);
    }
    setSelectedPosts(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedPosts.size === generatedPosts.length && generatedPosts.length > 0) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(generatedPosts.map(post => post.id)));
    }
  };

  const handleEdit = (post: GeneratedPost) => {
    setSelectedPost(post);
    setIsEditDialogOpen(true);
  };

  const handleSavePost = (formData: FormData) => {
    if (!selectedPost) return;
    
    // Create a deep copy to avoid mutating original_api_data if it's referenced elsewhere
    const updatedPost: GeneratedPost = JSON.parse(JSON.stringify(selectedPost));

    updatedPost.title = formData.get('title') as string || selectedPost.title;
    updatedPost.details = formData.get('content') as string || selectedPost.details;
    updatedPost.platform_type = formData.get('platform') as GeneratedPost['platform_type'] || selectedPost.platform_type;
    updatedPost.updated_at = new Date().toISOString();
    
    // If you need to update original_api_data as well, do it here.
    // For example, if 'content' maps to 'original_text_content':
    if (updatedPost.original_api_data) {
        updatedPost.original_api_data.original_text_content = updatedPost.details;
        updatedPost.original_api_data.platform = updatedPost.platform_type; // If platform can change
    }

    setGeneratedPosts(posts => 
      posts.map(post => post.id === updatedPost.id ? updatedPost : post)
    );

    // Update pipelineResultForDisplay as well
    if (pipelineResultForDisplay) {
        setPipelineResultForDisplay(prev => ({
            ...prev!,
            posts: prev!.posts.map(p => p.id === updatedPost.id ? updatedPost : p)
        }));
    }

    setIsEditDialogOpen(false);
    toast({
      title: "Post Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const handleDownload = (postId: string) => {
    const post = generatedPosts.find(p => p.id === postId);
    if (post) {
      const content = `Platform: ${post.platform_type}\nTitle: ${post.title}\n\nContent:\n${post.details}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${post.platform_type}_${post.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: "Your post content has been downloaded.",
      });
    }
  };

  const handleShare = (postId: string) => {
    const post = generatedPosts.find(p => p.id === postId);
    if (post && navigator.share) {
      navigator.share({
        title: post.title,
        text: post.details,
      }).catch(err => console.error("Share failed:", err));
    } else if (post) {
       navigator.clipboard.writeText(`${post.title}\n\n${post.details}`).then(() => {
        toast({
          title: "Content Copied",
          description: "Post content copied to clipboard.",
        });
      }).catch(err => {
        console.error("Failed to copy: ", err);
        toast({
          title: "Share Options",
          description: "Could not copy to clipboard. Please copy manually.",
          variant: "destructive"
        });
      });
    } else {
      toast({
        title: "Error",
        description: "Post not found for sharing.",
        variant: "destructive"
      });
    }
  };

  const handlePublishSelected = () => {
    if (selectedPosts.size === 0) {
      toast({
        title: "No Posts Selected",
        description: "Please select at least one post to publish.",
        variant: "destructive"
      });
      return;
    }

    // Example: Collect data of selected posts
    // const postsToPublish = generatedPosts.filter(p => selectedPosts.has(p.id));
    // console.log("Publishing:", postsToPublish);

    toast({
      title: "Coming Soon! 🚀",
      description: `Publishing ${selectedPosts.size} post(s) functionality will be available soon.`,
    });
  };

  const isImageUrl = (url: string): url is string => {
    return url ? /\.(jpg|jpeg|png|gif|webp)$/i.test(url) : false;
  };

  const getPlatformIcon = (platform: GeneratedPost['platform_type']) => {
    const platformDetails = platforms.find(p => p.id === platform);
    if (platformDetails) {
      const IconComponent = platformDetails.icon;
      return <IconComponent className="w-6 h-6" />;
    }
    return "📱";
  };

  // getMediaTypeColor is not currently used, can be removed or implemented if needed for badges
  // const getMediaTypeColor = (mediaType: string) => { ... };


  if (!pipelineResultForDisplay && generatedPosts.length === 0) {
    // Still loading or no data yet, could show a spinner or a message
    // but current logic falls back to mock or processes quickly.
    // If useEffect had async ops before setStates, a loading state would be more useful.
  }

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <CheckCircle className="w-20 h-20 text-green-400" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Content Generated
                <span className="text-cosmic block mt-2">Successfully!</span>
              </h1>
              
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
                Your AI-powered content is ready for review and publishing. 
                Each post has been tailored to match your brand voice and platform requirements.
              </p>

              {subjectFromForm && (
                <div className="inline-flex items-center px-4 py-2 bg-cosmic/20 rounded-full border border-cosmic/30">
                  <span className="text-cosmic font-medium">Subject: </span>
                  <span className="text-white ml-2">{subjectFromForm}</span>
                </div>
              )}
            </div>

            {/* Stats Overview */}
            {pipelineResultForDisplay?.summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="cosmic-card">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-cosmic/20 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-cosmic" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{pipelineResultForDisplay.summary.totalPosts}</p>
                        <p className="text-gray-300">Posts Generated</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cosmic-card">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Users className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{pipelineResultForDisplay.summary.platforms.length}</p>
                        <p className="text-gray-300">Platforms ({pipelineResultForDisplay.summary.platforms.join(', ') || 'N/A'})</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cosmic-card">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Calendar className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{selectedPosts.size}</p>
                        <p className="text-gray-300">Selected</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Selection Controls */}
            {generatedPosts.length > 0 && (
                <div className="flex items-center justify-between mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-4">
                    <Checkbox
                    id="select-all"
                    checked={generatedPosts.length > 0 && selectedPosts.size === generatedPosts.length}
                    onCheckedChange={handleSelectAll}
                    disabled={generatedPosts.length === 0}
                    className="border-white/30 data-[state=checked]:bg-cosmic data-[state=checked]:border-cosmic"
                    />
                    <label htmlFor="select-all" className="text-white font-medium cursor-pointer">
                    Select All ({selectedPosts.size} of {generatedPosts.length} selected)
                    </label>
                </div>
                
                <Button
                    onClick={handlePublishSelected}
                    disabled={selectedPosts.size === 0}
                    className="cosmic-button"
                >
                    Publish Selected ({selectedPosts.size})
                </Button>
                </div>
            )}

            {/* Generated Posts */}
            {generatedPosts.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                {generatedPosts.map((post) => (
                    <Card 
                    key={post.id} 
                    className={`cosmic-card transition-all duration-200 cursor-pointer ${
                        selectedPosts.has(post.id) 
                        ? 'ring-2 ring-cosmic shadow-cosmic shadow-lg' 
                        : 'hover:ring-1 hover:ring-white/20'
                    }`}
                    onClick={() => handlePostSelection(post.id, !selectedPosts.has(post.id))}
                    >
                    <CardHeader>
                        <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Checkbox
                            checked={selectedPosts.has(post.id)}
                            onCheckedChange={(checked) => handlePostSelection(post.id, checked as boolean)}
                            className="border-white/30 data-[state=checked]:bg-cosmic data-[state=checked]:border-cosmic"
                            onClick={(e) => e.stopPropagation()} // Prevent card click when checkbox is clicked
                            />
                            <div className="flex items-center space-x-2">
                            <span className="text-2xl">{getPlatformIcon(post.platform_type)}</span>
                            <CardTitle className="text-white text-lg capitalize">{post.platform_type}</CardTitle>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleEdit(post); }}
                            className="text-gray-300 hover:text-white hover:bg-white/10 px-2 sm:px-3"
                            title="Edit Post"
                            >
                            <Edit3 className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                            </Button>
                            
                            <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDownload(post.id); }}
                            className="text-gray-300 hover:text-white hover:bg-white/10 px-2 sm:px-3"
                            title="Download Post"
                            >
                            <Download className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Download</span>
                            </Button>
                            
                            <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleShare(post.id); }}
                            className="text-gray-300 hover:text-white hover:bg-white/10 px-2 sm:px-3"
                            title="Share Post"
                            >
                            <Share2 className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Share</span>
                            </Button>
                        </div>
                        </div>
                        
                        <CardDescription className="text-gray-300 font-medium pt-2">
                        {post.title}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-4">
                        <p className="text-gray-200 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                            {post.details}
                        </p>
                        {/* Optionally display image/video preview if available */}
                        {post.has_picture === "true" && post.metadata.cloud_urls?.[0] && isImageUrl(post.metadata.cloud_urls[0]) && (
                            <img src={post.metadata.cloud_urls[0]} alt="Post media" className="mt-2 rounded max-h-40 object-contain" />
                        )}
                        {/* Add video player if post.has_video === "true" and URL available */}
                        </div>
                        {/* You could add Badges here for metadata like post_type or hashtags */}
                        {/* <div className="flex flex-wrap gap-2">
                            {post.metadata.hashtags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div> */}
                    </CardContent>
                    </Card>
                ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-400">No posts were generated or found.</p>
                    <p className="text-gray-500">Try generating new content.</p>
                </div>
            )}


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
              
              {generatedPosts.length > 0 && (
                <Button 
                    size="lg"
                    onClick={handlePublishSelected}
                    disabled={selectedPosts.size === 0}
                    className="cosmic-button"
                >
                    Publish Selected ({selectedPosts.size})
                    <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="lg"
                onClick={() => navigate('/post-manager')} // Assuming '/post-manager' is your library route
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                View in Library
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Post Dialog */}
      <EditPostDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        post={selectedPost}
        onSave={handleSavePost}
        platforms={platforms.map(p => ({ ...p, icon: p.icon as any }))} // Type cast for compatibility
        isSaving={false} // Manage actual saving state if EditPostDialog makes async calls
        isImageUrl={isImageUrl}
      />
    </div>
  );
};

export default GenerationSuccess;