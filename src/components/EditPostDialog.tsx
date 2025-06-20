import { useState, useEffect } from "react"; // Ensure useEffect is imported
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Video, ClipboardCopy, Check, Download, LucideIcon } from "lucide-react";
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
  isImageUrl: (url: string | null) => url is string; // Updated isImageUrl type
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
  // Initialize detailsContent. It will be updated by useEffect when 'post' prop changes.
  const [detailsContent, setDetailsContent] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // CORRECTED: Use useEffect to update detailsContent when the 'post' prop changes.
  useEffect(() => {
    if (post) {
      setDetailsContent(post.details || "");
    } else {
      setDetailsContent(""); // Clear content if post is null
    }
  }, [post]); // Dependency array: re-run effect if 'post' changes.

  const handleCopyDetails = async () => {
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

  const handleDownloadMedia = () => {
    if (!downloadableMediaUrl) {
      toast({ title: "No downloadable media", description: "No valid URL found for download.", variant: "destructive" });
      return;
    }
    try {
      const link = document.createElement('a');
      link.href = downloadableMediaUrl;
      const filename = downloadableMediaUrl.substring(downloadableMediaUrl.lastIndexOf('/') + 1) || 'social_media_file';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download Started! 🚀", description: "Your media should begin downloading shortly.", className: "bg-primary/90 border-primary text-white" });
    } catch (error) {
      console.error("Download error:", error);
      toast({ title: "Download Failed", description: "Could not initiate media download.", variant: "destructive" });
    }
  };

  if (!post) return null; // If post is null, don't render the dialog content

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
            {/* Left Column - Form */}
            <div className="space-y-4">
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
                  defaultValue={post.title} // defaultValue is fine for inputs not controlled for copy/paste
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
                  value={detailsContent} // Controlled component: value is from state
                  onChange={(e) => setDetailsContent(e.target.value)} // Updates state on change
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
                      className="text-gray-300 hover:text-white px-2"
                    >
                      <Download className="w-4 h-4" />
                      <span className="ml-1 text-xs">Download</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Image Preview */}
              {post.has_picture && isImageUrl(post.has_picture) && (
                <div className="space-y-2">
                  <Label className="text-white">Image</Label>
                  <div className="border border-white/20 rounded-lg p-2 bg-white/5">
                    <img
                      src={post.has_picture}
                      alt="Post image"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentNode as HTMLElement;
                        if (parent && !parent.querySelector('.media-error')) {
                           const errorMsg = document.createElement('p');
                           errorMsg.textContent = 'Could not load image preview.';
                           errorMsg.className = 'text-red-400 text-sm text-center media-error';
                           parent.appendChild(errorMsg);
                        }
                      }}
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
                        onError={(e) => {
                          const target = e.target as HTMLVideoElement;
                          target.style.display = 'none';
                           const parent = target.parentNode as HTMLElement;
                           if (parent && !parent.querySelector('.media-error')) {
                               const errorMsg = document.createElement('p');
                               errorMsg.textContent = 'Could not load video preview.';
                               errorMsg.className = 'text-red-400 text-sm text-center media-error';
                               parent.appendChild(errorMsg);
                           }
                        }}
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
                  <div className="flex justify-center gap-2 mb-2">
                    <Image className="w-6 h-6" />
                    <Video className="w-6 h-6" />
                  </div>
                  <p>No media attached to this post</p>
                </div>
              )}

              {/* Media Info for non-URL content */}
              {(post.has_picture && !isImageUrl(post.has_picture)) && (
                <div className="text-sm text-gray-300 space-y-1 mt-2">
                  <div className="bg-white/5 p-2 rounded border border-white/10">
                    <strong>Image Info:</strong> {post.has_picture}
                  </div>
                </div>
              )}
              {(post.has_video && !post.has_video.startsWith('http') && !post.has_video.includes('video')) && ( // Added !post.has_video.includes('video') for robustness
                 <div className="text-sm text-gray-300 space-y-1 mt-2">
                    <div className="bg-white/5 p-2 rounded border border-white/10">
                        <strong>Video Info:</strong> {post.has_video}
                    </div>
                 </div>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};