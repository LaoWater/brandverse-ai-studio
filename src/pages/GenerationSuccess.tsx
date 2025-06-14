// src/pages/GenerationSuccess.tsx
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Send } from "lucide-react"; // Removed Edit3 for now
import { toast } from "@/hooks/use-toast";
import { useState } from "react"; // Added for potential loading state on send
import { supabase } from "@/integrations/supabase/client"; // For updating status

// Define the structure of a post object within pipelineResult.posts
// This should match the structure of one item in the 'posts' array from your API response
interface GeneratedPostFromAPI {
  platform: string;
  post_type: string; // e.g., "Image", "Text"
  original_text_content: string;
  media_asset?: {
    type: 'image' | 'video';
    file_path: string; // local path from API, might not be relevant here
  } | null;
  media_generation_prompt_used?: string | null;
  cloud_storage?: {
    uploads?: Array<{
      success: boolean;
      cloud_path: string;
      public_url: string;
      content_type?: string;
    }>;
  } | null;
  // Add any other fields you expect from pipelineResult.posts
}

interface PipelineResultFromAPI {
  pipeline_id: string;
  posts: GeneratedPostFromAPI[];
  // Add any other top-level fields from your API response
}


const GenerationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Provide a more specific type for location.state
  const { pipelineResult, insertedPostIds } = (location.state || {}) as { 
    pipelineResult?: PipelineResultFromAPI; 
    insertedPostIds?: string[];
  };
  
  const [isSending, setIsSending] = useState(false);

  if (!pipelineResult || !pipelineResult.posts || pipelineResult.posts.length === 0) {
    return (
      // ... (No Content to Display fallback - this is fine) ...
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No Content to Display</h1>
          <p className="text-gray-300 mb-6">
            It seems there was an issue, or no content was generated.
          </p>
          <Button onClick={() => navigate("/content-generator")}>Generate New Content</Button>
        </div>
      </div>
    );
  }

  const handleSendToManager = async () => {
    setIsSending(true);
    if (insertedPostIds && insertedPostIds.length > 0) {
      try {
        // Option B: Update status of these posts in Supabase
        const { error } = await supabase
          .from('posts')
          .update({ status: 'review' }) // Or 'managed', 'pending_review', etc.
          .in('id', insertedPostIds);

        if (error) {
          throw error;
        }

        toast({
          title: "Sent to Manager!",
          description: "The generated posts have been updated and are ready for further management.",
        });
        navigate("/post-manager"); // Navigate to your post manager page
      } catch (error: any) {
        console.error("Error updating post statuses in Supabase:", error);
        toast({
          title: "Error Sending",
          description: error.message || "Could not update post statuses.",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
    } else {
      // Option A (Fallback or if no insertedPostIds were passed): Just navigate
      console.log("Sending posts to manager (simulated - no IDs to update)...", pipelineResult.posts);
      toast({
        title: "Navigating to Manager",
        description: "The generated posts can be found in the Post Manager.",
      });
      navigate("/post-manager");
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            Content <span className="text-cosmic font-serif">Successfully</span> Generated!
          </h1>
          <p className="text-gray-300 text-lg">
            Review your AI-crafted posts below. Pipeline ID: {pipelineResult.pipeline_id}
          </p>
        </div>

        <div className="space-y-8">
          {pipelineResult.posts.map((post, index) => { // `post` here is of type GeneratedPostFromAPI
            const mediaAsset = post.media_asset;
            let mediaUrl: string | null = null;
            if (mediaAsset) {
                const mediaUpload = post.cloud_storage?.uploads?.find(
                    (upload) => upload.success && upload.content_type?.startsWith(mediaAsset.type + '/')
                );
                mediaUrl = mediaUpload?.public_url || null;
            }
            // This retrieves the URL to the .txt file on GCS
            const textContentGCSUrl = post.cloud_storage?.uploads?.find(
                (upload) => upload.success && upload.content_type?.startsWith('text/')
            )?.public_url;

            // The main text content is directly available from the API result for display
            const mainTextContentForDisplay = post.original_text_content;

            return (
              <Card key={index} className="cosmic-card border-0 cosmic-glow overflow-hidden">
                <CardHeader className="cosmic-card-header flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-white text-xl capitalize">{post.platform} Post</CardTitle>
                    <CardDescription className="text-gray-300">Requested Type: {post.post_type}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {mediaUrl && mediaAsset?.type === 'image' && (
                    <div className="rounded-lg overflow-hidden border border-white/10 max-h-96 flex justify-center bg-black/20">
                      <img 
                        src={mediaUrl} 
                        alt={`${post.platform} content visual`} 
                        className="object-contain max-h-96" 
                      />
                    </div>
                  )}
                  {mediaUrl && mediaAsset?.type === 'video' && (
                     <div className="rounded-lg overflow-hidden border border-white/10">
                        <video controls src={mediaUrl} className="w-full max-h-96">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                  )}
                  
                  <div className="p-4 bg-white/5 rounded-md border border-white/10">
                    <p className="text-white whitespace-pre-wrap text-sm leading-relaxed">
                      {mainTextContentForDisplay}
                    </p>
                  </div>

                  {post.media_generation_prompt_used && (
                    <details className="text-xs text-gray-400">
                        <summary className="cursor-pointer hover:text-white">View Media Prompt</summary>
                        <p className="mt-1 p-2 bg-black/20 border border-white/10 rounded-md whitespace-pre-wrap">
                            {post.media_generation_prompt_used}
                        </p>
                    </details>
                  )}
                   {textContentGCSUrl && ( // Display link to the raw text file on GCS
                     <p className="text-xs text-gray-400">
                        <a href={textContentGCSUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent underline">
                            View raw text file (GCS)
                        </a>
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Button 
            size="lg" 
            className="cosmic-button text-white font-semibold"
            onClick={handleSendToManager}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send to Posts Manager"}
            <Send className="ml-2 w-4 h-4" />
          </Button>
          <p className="mt-4">
            <Link to="/content-generator" className="text-accent hover:underline">
              Or, Generate More Content <ArrowRight className="inline w-4 h-4" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GenerationSuccess;