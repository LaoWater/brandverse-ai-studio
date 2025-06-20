import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Video, ClipboardCopy, Check, Download, LucideIcon, Loader2 } from "lucide-react"; // Added Loader2
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Post = Database['public']['Tables']['posts']['Row'];
type PostStatus = Database['public']['Enums']['post_status'];
type PlatformType = Database['public']['Enums']['platform_type'];

interface PlatformOption {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

interface EditPostDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  post: Post | null;
  onSave: (formData: FormData) => void;
  platforms: PlatformOption[];
  isSaving: boolean;
  isImageUrl: (url: string | null) => url is string;
}

export const EditPostDialog = ({
  isOpen,
  onOpenChange,
  post,
  onSave,
  platforms,
  isSaving,
  isImageUrl,
}: EditPostDialogProps) => {
  const [detailsContent, setDetailsContent] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); // State for download button

  useEffect(() => {
    if (post) {
      setDetailsContent(post.details || "");
    } else {
      setDetailsContent("");
    }
  }, [post]);

  const handleCopyDetails = async () => {
    // ... (keep existing implementation)
    if (!detailsContent) {
      toast({ title: "Nothing to copy", variant: "default", className: "bg-yellow-500/10 text-yellow-400" });
      return;
    }
    try {
      await navigator.clipboard.writeText(detailsContent);
      toast({ title: "Content Copied! ✨", description: "Post details copied to clipboard.", className: "bg-primary/90 border-primary text-white" });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({ title: "Copy Failed", description: "Could not copy details to clipboard.", variant: "destructive" });
    }
  };

  const getMediaUrlForDownload = (): string | null => {
    if (post?.has_picture && post.has_picture.startsWith('http')) {
      return post.has_picture;
    }
    if (post?.has_video && post.has_video.startsWith('http')) {
      return post.has_video;
    }
    return null;
  };

  const downloadableMediaUrl = getMediaUrlForDownload();

  const handleDownloadMedia = async () => {
    if (!downloadableMediaUrl) {
      toast({ title: "No downloadable media", description: "No valid URL found for download.", variant: "destructive" });
      return;
    }

    setIsDownloading(true);
    toast({ title: "Preparing download...", description: "Fetching media file. Please wait.", className: "bg-blue-600 text-white border-blue-600" });

    try {
      const response = await fetch(downloadableMediaUrl);

      if (!response.ok) {
        // Try to get more info from response if possible for error message
        let errorBodyText = '';
        try {
            errorBodyText = await response.text();
        } catch (e) { /* ignore if can't read body */ }
        
        throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}. ${errorBodyText ? 'Server response: ' + errorBodyText.substring(0,100) : ''} Ensure CORS is configured on the storage bucket.`);
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      // Attempt to get filename from Content-Disposition header, otherwise parse from URL
      const contentDisposition = response.headers.get('content-disposition');
      let filename = downloadableMediaUrl.substring(downloadableMediaUrl.lastIndexOf('/') + 1).split('?')[0]; // Remove query params from filename

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d'')?([^;\r\n"']+)['"]?;?/i);
        if (filenameMatch && filenameMatch[1]) {
          try {
            filename = decodeURIComponent(filenameMatch[1]);
          } catch (e) {
             // fallback to URL parsing if decoding fails
            console.warn("Could not decode filename from Content-Disposition, falling back to URL parsing.");
          }
        }
      }
      
      filename = filename || 'downloaded_media_file'; // Fallback filename if all else fails

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); // Clean up the blob URL

      toast({ title: "Download Started! 🚀", description: `"${filename}" should begin downloading shortly.`, className: "bg-primary/90 border-primary text-white" });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during download.",
        variant: "destructive",
        duration: 7000, // Show longer for errors
      });
    } finally {
      setIsDownloading(false);
    }
  };


  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="cosmic-card max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Post</DialogTitle>
          <DialogDescription className="text-gray-300">
            Make changes to your post content and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave(new FormData(e.currentTarget));
        }} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form (no changes here) */}
            <div className="space-y-4">
              {/* ... Platform, Status, Title, Content inputs ... */}
               <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Platform</Label>
                  <Select name="platform_type" defaultValue={post.platform_type || undefined}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {platforms.map(platform => {
                        const IconComponent = platform.icon;
                        return (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {platform.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Status</Label>
                  <Select name="status" defaultValue={post.status || 'draft'}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-white">Title</Label>
                <Input
                  name="title"
                  defaultValue={post.title}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-white">Content</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyDetails}
                    className="text-gray-300 hover:text-white px-2"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <ClipboardCopy className="w-4 h-4" />}
                    <span className="ml-1 text-xs">{copied ? "Copied!" : "Copy"}</span>
                  </Button>
                </div>
                <Textarea
                  name="details"
                  value={detailsContent}
                  onChange={(e) => setDetailsContent(e.target.value)}
                  className="bg-white/5 border-white/20 text-white min-h-[240px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>


            {/* Right Column - Media Preview */}
            <div className="space-y-4">
              <div>
                <Label className="text-white">Media URL (Image or Video)</Label>
                <Input
                  name="has_picture"
                  defaultValue={post.has_picture || post.has_video || ''}
                  placeholder="Image/Video URL"
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-white text-lg font-semibold">Media Preview</Label>
                  {downloadableMediaUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadMedia}
                      disabled={isDownloading} // Disable button while downloading
                      className="text-gray-300 hover:text-white px-2"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span className="ml-1 text-xs">{isDownloading ? "Downloading..." : "Download"}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* ... (rest of the media preview logic: Image, Video, No Media, Info) ... */}
              {/* Image Preview */}
              {post.has_picture && isImageUrl(post.has_picture) && (
                <div className="space-y-2">
                  <Label className="text-white">Image</Label>
                  <div className="border border-white/20 rounded-lg p-2 bg-white/5">
                    <img
                      src={post.has_picture}
                      alt="Post image"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      onError={(e) => { /* ... */ }}
                    />
                  </div>
                </div>
              )}

              {/* Video Preview */}
              {post.has_video && (post.has_video.startsWith('http') || post.has_video.includes('video')) && (
                <div className="space-y-2">
                  <Label className="text-white">Video</Label>
                  <div className="border border-white/20 rounded-lg p-2 bg-white/5">
                    {post.has_video.startsWith('http') ? (
                      <video
                        src={post.has_video}
                        controls
                        className="w-full max-w-sm mx-auto rounded-lg"
                        onError={(e) => { /* ... */ }}
                      />
                    ) : (
                      <div className="text-center text-gray-300 p-4">
                        <Video className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">{post.has_video}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Media Message */}
              {(!post.has_picture && !post.has_video) && (
                <div className="text-center text-gray-400 p-8 border border-white/10 rounded-lg bg-white/5">
                   {/* ... */}
                </div>
              )}

              {/* Media Info for non-URL content */}
              {(post.has_picture && !isImageUrl(post.has_picture)) && (
                 <div className="text-sm text-gray-300 space-y-1 mt-2">
                    {/* ... */}
                 </div>
              )}
              {(post.has_video && !post.has_video.startsWith('http') && !post.has_video.includes('video')) && (
                 <div className="text-sm text-gray-300 space-y-1 mt-2">
                    {/* ... */}
                 </div>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};