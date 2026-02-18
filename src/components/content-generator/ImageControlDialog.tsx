import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, SaveIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { saveImageControlSettings, type ImageControlSettings } from "@/services/imageControlService";

interface ImageControlDialogProps {
  imageControlSettings: ImageControlSettings;
  setImageControlSettings: React.Dispatch<React.SetStateAction<ImageControlSettings>>;
  userId: string | undefined;
  companyId: string | undefined;
}

const ImageControlDialog = ({ imageControlSettings, setImageControlSettings, userId, companyId }: ImageControlDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-4 py-2 h-12 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 relative group"
          type="button"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Image className="w-5 h-5 relative z-10 drop-shadow-lg" />
          <span className="text-sm font-medium relative z-10">Image Control</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="cosmic-card border-0 max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-white text-2xl font-bold flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Image className="w-6 h-6 text-white" />
            </div>
            <span>Image Control Settings</span>
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Configure image generation preferences, style guidance, and visual controls for your content
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 mt-6 pr-2">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="space-y-1">
              <Label className="text-white font-medium">Enable Image Control</Label>
              <p className="text-sm text-gray-400">Override AI's automatic image decisions with custom preferences</p>
            </div>
            <Switch
              checked={imageControlSettings.enabled}
              onCheckedChange={(checked) => setImageControlSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {imageControlSettings.enabled && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <Label className="text-white font-medium">Style Guidance</Label>
                <Select value={imageControlSettings.style} onValueChange={(value) => setImageControlSettings(prev => ({ ...prev, style: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Choose image style..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    <SelectItem value="photorealistic" className="text-white hover:bg-white/10">Photorealistic</SelectItem>
                    <SelectItem value="minimalist" className="text-white hover:bg-white/10">Minimalist</SelectItem>
                    <SelectItem value="artistic" className="text-white hover:bg-white/10">Artistic</SelectItem>
                    <SelectItem value="corporate" className="text-white hover:bg-white/10">Corporate</SelectItem>
                    <SelectItem value="vibrant" className="text-white hover:bg-white/10">Vibrant & Colorful</SelectItem>
                    <SelectItem value="monochrome" className="text-white hover:bg-white/10">Monochrome</SelectItem>
                    <SelectItem value="modern" className="text-white hover:bg-white/10">Modern & Clean</SelectItem>
                    <SelectItem value="vintage" className="text-white hover:bg-white/10">Vintage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-white font-medium">Image Ratio</Label>
                <Select value={imageControlSettings.ratio} onValueChange={(value) => setImageControlSettings(prev => ({ ...prev, ratio: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Choose aspect ratio..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    <SelectItem value="16:9" className="text-white hover:bg-white/10">Landscape (16:9) - Default</SelectItem>
                    <SelectItem value="1:1" className="text-white hover:bg-white/10">Square (1:1)</SelectItem>
                    <SelectItem value="9:16" className="text-white hover:bg-white/10">Portrait (9:16)</SelectItem>
                    <SelectItem value="3:4" className="text-white hover:bg-white/10">Portrait (3:4)</SelectItem>
                    <SelectItem value="4:3" className="text-white hover:bg-white/10">Standard (4:3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-white font-medium">Visual Guidance</Label>
                <Textarea
                  placeholder="Describe the visual elements, mood, colors, or specific objects you want in the image..."
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-[100px] resize-none"
                  value={imageControlSettings.guidance}
                  onChange={(e) => setImageControlSettings(prev => ({ ...prev, guidance: e.target.value }))}
                />
                <p className="text-xs text-gray-400 bg-blue-500/10 p-2 rounded-md border border-blue-500/20">
                  <strong>Note:</strong> This is high-level guidance. The AI will become more specific during Post Generation Setup based on your content.
                </p>
              </div>

              <div className="space-y-3 opacity-50 cursor-not-allowed">
                <Label className="text-gray-400 font-medium">Caption/Text Overlay</Label>
                <Input
                  placeholder="Text to overlay on the image (optional)..."
                  className="bg-gray-700/30 border-gray-600/40 text-gray-500 placeholder:text-gray-500 cursor-not-allowed"
                  value={imageControlSettings.caption}
                  onChange={(e) => setImageControlSettings(prev => ({ ...prev, caption: e.target.value }))}
                  disabled
                />
                <div className="p-3 bg-gray-700/20 border border-gray-600/30 rounded-lg">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <strong className="text-gray-300">Note:</strong> For optimal performance, we recommend adding captions manually after generation using simple video editing software. Current visual models cannot create proper captions yet.
                  </p>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    We're working on a combination of automated photo editing, visual models, and video models to enable this functionality.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-white font-medium">Starting Image (Optional)</Label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="starting-image"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setImageControlSettings(prev => ({ ...prev, startingImage: file }));
                    }}
                  />
                  <Label htmlFor="starting-image" className="cursor-pointer">
                    <div className="space-y-2">
                      <Image className="w-8 h-8 mx-auto text-gray-400" />
                      {imageControlSettings.startingImage ? (
                        <p className="text-white font-medium">{imageControlSettings.startingImage.name}</p>
                      ) : (
                        <p className="text-gray-400">Upload a base image to modify or enhance</p>
                      )}
                      <p className="text-xs text-gray-500">Click to browse or drag & drop</p>
                    </div>
                  </Label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-white/10 mt-8 flex-shrink-0">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                setImageControlSettings({
                  enabled: false,
                  style: "",
                  guidance: "",
                  caption: "",
                  ratio: "16:9",
                  startingImage: null
                });
              }}
            >
              Reset to Defaults
            </Button>
            <Button
              className="cosmic-button"
              onClick={async () => {
                if (!userId || !companyId) {
                  toast({
                    title: "Error",
                    description: "Please ensure you're logged in and have a company selected.",
                    variant: "destructive"
                  });
                  return;
                }

                const result = await saveImageControlSettings(
                  userId,
                  companyId,
                  1,
                  imageControlSettings
                );

                if (result.success) {
                  toast({
                    title: "Settings Saved!",
                    description: "Your image control preferences have been saved as defaults.",
                  });
                } else {
                  toast({
                    title: "Save Failed",
                    description: result.error || "Failed to save settings.",
                    variant: "destructive"
                  });
                }
              }}
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save as Default
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageControlDialog;
