import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateMedia } from "@/services/mediaStudioService";
import { deductCredits } from "@/services/creditsService";
import { useNavigate } from "react-router-dom";

interface ImageFinesseOverlayProps {
  isOpen: boolean;
  imageUrl: string | null;
  platformId: string | null;
  userId: string;
  companyId: string;
  onClose: () => void;
  onSuccess: (platformId: string, newImageUrl: string, newThumbnailUrl: string | null) => void;
}

const FINESSE_CREDITS = 5; // gemini-2.5-flash-image 1K cost

const detectAspectRatio = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (Math.abs(ratio - 1) < 0.1) resolve('1:1');
      else if (Math.abs(ratio - 16 / 9) < 0.15) resolve('16:9');
      else if (Math.abs(ratio - 9 / 16) < 0.15) resolve('9:16');
      else if (Math.abs(ratio - 4 / 3) < 0.15) resolve('4:3');
      else if (Math.abs(ratio - 3 / 4) < 0.15) resolve('3:4');
      else if (ratio > 1) resolve('16:9');
      else resolve('9:16');
    };
    img.onerror = () => resolve('1:1');
    img.src = url;
  });
};

const ImageFinesseOverlay = ({
  isOpen,
  imageUrl,
  platformId,
  userId,
  companyId,
  onClose,
  onSuccess,
}: ImageFinesseOverlayProps) => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) setPrompt("");
  }, [isOpen]);

  const handleFinesse = async () => {
    if (!prompt.trim() || !imageUrl || !platformId) return;

    setIsGenerating(true);

    try {
      const creditDeducted = await deductCredits(FINESSE_CREDITS);
      if (!creditDeducted) {
        toast({
          title: "Insufficient Credits",
          description: `Image finessing requires ${FINESSE_CREDITS} credits.`,
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const aspectRatio = await detectAspectRatio(imageUrl);

      const result = await generateMedia({
        prompt: prompt.trim(),
        mediaType: 'image',
        model: 'gemini-2.5-flash-image',
        aspectRatio,
        imageSize: '1K',
        numberOfImages: 1,
        referenceImageUrls: [imageUrl],
        userId,
        companyId,
      });

      if (!result.success) {
        throw new Error(result.error || "Image finessing failed.");
      }

      onSuccess(platformId, result.mediaUrl, result.thumbnailUrl || null);

      toast({
        title: "Image Updated",
        description: "Your finessed image has been attached.",
      });

      onClose();
    } catch (error: any) {
      console.error("Finesse error:", error);
      toast({
        title: "Finesse Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestions = [
    "Remove background elements",
    "Add subtle text overlay",
    "Change color palette",
    "Adjust lighting and contrast",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="cosmic-card border-0 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            Quick Image Edit
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Describe the changes you'd like to make
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {imageUrl && (
            <div className="relative rounded-lg overflow-hidden bg-white/5 border border-white/10">
              <img
                src={imageUrl}
                alt="Original"
                className="w-full max-h-[300px] object-contain mx-auto"
              />
              {isGenerating && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
                    <p className="text-sm text-gray-300">Generating...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="Describe your changes..."
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-[80px] resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-gray-500">Suggestions:</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                  onClick={() => setPrompt(prev => prev ? `${prev}, ${s.toLowerCase()}` : s)}
                  disabled={isGenerating}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            onClick={() => navigate('/media-studio')}
          >
            For deeper editing, use Media Studio <ExternalLink className="w-3 h-3" />
          </button>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              className="cosmic-button"
              onClick={handleFinesse}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Save & Use ({FINESSE_CREDITS}c)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageFinesseOverlay;
