import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Image as ImageIconLucide, Video as VideoIconLucide, Type as TypeIconLucide,
  Check, Image, SaveIcon
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { saveImageControlSettings, type ImageControlSettings } from "@/services/imageControlService";
import type { IconType } from "react-icons";
import type { LucideIcon } from "lucide-react";

export interface PlatformDef {
  id: string;
  label: string;
  icon: LucideIcon | IconType;
  color: string;
}

interface MediaOption {
  value: string;
  label: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  wide?: boolean;
}

interface AttachedMedia {
  mediaId: string;
  url: string;
  thumbnailUrl: string | null;
  fileType: 'image' | 'video';
  fileName: string;
}

interface PlatformCardProps {
  platform: PlatformDef;
  isSelected: boolean;
  selectedMedia: string | undefined;
  mediaOptions: MediaOption[];
  getMediaCredits: (mediaType: string) => number;
  onPlatformToggle: (platformId: string) => void;
  onMediaTypeSelect: (platformId: string, mediaType: 'text' | 'image' | 'video') => void;
  platformImageControls: Record<string, ImageControlSettings>;
  setPlatformImageControls: React.Dispatch<React.SetStateAction<Record<string, ImageControlSettings>>>;
  userId: string | undefined;
  companyId: string | undefined;
  attachedMedia?: AttachedMedia | null;
  onOpenMediaBrowser?: (platformId: string) => void;
  onRemoveAttachedMedia?: (platformId: string) => void;
  onFinesseImage?: (platformId: string, imageUrl: string) => void;
}

const PlatformCard = ({
  platform,
  isSelected,
  selectedMedia,
  mediaOptions,
  getMediaCredits,
  onPlatformToggle,
  onMediaTypeSelect,
  platformImageControls,
  setPlatformImageControls,
  userId,
  companyId,
  attachedMedia,
  onOpenMediaBrowser,
  onRemoveAttachedMedia,
  onFinesseImage,
}: PlatformCardProps) => {
  const IconComponent = platform.icon;
  const hasAttachedMedia = !!attachedMedia;

  return (
    <div
      className={`p-4 rounded-lg bg-white/5 border transition-colors
                  ${isSelected ? 'border-accent ring-1 ring-accent' : 'border-white/10 hover:bg-white/10'}`}
    >
      <div
        className="flex items-center space-x-3 cursor-pointer"
        onClick={() => onPlatformToggle(platform.id)}
      >
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                        ${isSelected ? 'bg-accent border-accent' : 'border-white/20'}`}>
          {isSelected && <Check className="w-3 h-3 text-gray-900" />}
        </div>
        <div className="flex items-center space-x-2 flex-1">
          <IconComponent className={`w-5 h-5 ${platform.color}`} />
          <span className="text-white">
            {platform.label}
          </span>
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 pl-8 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {mediaOptions.map(({ value, label, icon: Icon, comingSoon, wide }) => {
              const credits = getMediaCredits(value);
              const isDisabledByAttachment = hasAttachedMedia && (value === 'image' || value === 'video');

              if (comingSoon) {
                return (
                  <Dialog key={value}>
                    <DialogTrigger asChild>
                      <div className={wide ? "col-span-2" : ""}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 relative group"
                        >
                          <div className="absolute inset-0 rounded bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <Icon className="w-3 h-3 mr-2 relative z-10" />
                          <span className="relative z-10">{label}</span>
                        </Button>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="cosmic-card border-0 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-white text-xl font-bold flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            <Icon className="w-5 h-5 text-purple-400" />
                          </div>
                          <span>Video Generation - Future Vision</span>
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-6 mt-6">
                        <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                          <div className="space-y-4" style={{ color: 'rgb(15, 15, 23)' }}>
                            <p className="text-lg font-medium" style={{ color: 'rgb(126, 58, 242)' }}>
                              The Current Reality
                            </p>
                            <p style={{ color: 'rgb(15, 15, 23)' }}>
                              Current video models have significant limitations, with quality content generation costs reaching up to <span className="font-semibold" style={{ color: 'rgb(234, 179, 8)' }}>$0.70 per second</span> and often falling short of creating favorable engaging content-cost equity.
                            </p>

                            <p className="text-lg font-medium mt-6" style={{ color: 'rgb(126, 58, 242)' }}>
                              Our Vision Forward
                            </p>
                            <p style={{ color: 'rgb(15, 15, 23)' }}>
                              We are working on a revolutionary new way to automatize Video Creation - which will include a comprehensive pipeline of Video Scripts generation, creating clear scripts blueprints & execution plans, so they can easily be filmed.
                            </p>

                            <p style={{ color: 'rgb(15, 15, 23)' }}>
                              As Leading AI Providers companies grow stronger and video models improve, we will transition to video generation as well - keeping the same Promise towards our clients and our very mission.
                            </p>

                            <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mt-6">
                              <p className="font-medium text-center" style={{ color: 'rgb(14, 116, 144)' }}>
                                Our mission is to generate Human-Level-Performance quality content, not just Content.
                              </p>
                              <p className="text-center text-sm mt-2" style={{ color: 'rgb(75, 85, 99)' }}>
                                Because we want to create something as close to HLP as possible.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              }
              return (
                <Button
                  type="button"
                  key={value}
                  variant="ghost"
                  size="sm"
                  disabled={isDisabledByAttachment}
                  className={`w-full justify-start text-xs
                              ${isDisabledByAttachment
                                ? 'text-gray-500 cursor-not-allowed opacity-50'
                                : selectedMedia === value
                                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                                  : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                  onClick={() => !isDisabledByAttachment && onMediaTypeSelect(platform.id, value as 'text' | 'image' | 'video')}
                  title={isDisabledByAttachment ? "Using library media" : undefined}
                >
                  <Icon className="w-3 h-3 mr-2" />
                  {label} ({isDisabledByAttachment ? '—' : `${credits}c`})
                </Button>
              );
            })}
          </div>

          {/* Media Library Button */}
          {onOpenMediaBrowser && (
            <div className="mt-2 pt-2 border-t border-white/10">
              {hasAttachedMedia ? (
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                  <div className="w-8 h-8 rounded bg-white/10 overflow-hidden flex-shrink-0">
                    {attachedMedia.thumbnailUrl ? (
                      <img src={attachedMedia.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {attachedMedia.fileType === 'image' ? (
                          <ImageIconLucide className="w-4 h-4 text-gray-400" />
                        ) : (
                          <VideoIconLucide className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-300 truncate flex-1">{attachedMedia.fileName}</span>
                  {attachedMedia.fileType === 'image' && onFinesseImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300"
                      onClick={() => onFinesseImage(platform.id, attachedMedia.url)}
                    >
                      Finesse
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                    onClick={() => onRemoveAttachedMedia?.(platform.id)}
                  >
                    &times;
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-gray-300 hover:text-white hover:bg-white/10 justify-start relative group"
                  onClick={() => onOpenMediaBrowser(platform.id)}
                >
                  <div className="absolute inset-0 rounded bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <ImageIconLucide className="w-3 h-3 mr-2 relative z-10" />
                  <span className="relative z-10">Use Media from Library</span>
                </Button>
              )}
            </div>
          )}

          {/* Platform-specific Image Control Button */}
          {(selectedMedia === 'image' || selectedMedia === 'text') && !hasAttachedMedia && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-gray-300 hover:text-white hover:bg-white/10 justify-start relative group"
                    type="button"
                  >
                    <div className="absolute inset-0 rounded bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Image className="w-3 h-3 mr-2 relative z-10" />
                    <span className="relative z-10">Platform Image Control</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="cosmic-card border-0 max-w-2xl max-h-[85vh] flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-white text-xl font-bold flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        <IconComponent className={`w-5 h-5 ${platform.color}`} />
                      </div>
                      <span>{platform.label} Image Control</span>
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">
                      Platform-specific image preferences for {platform.label}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto space-y-6 mt-6 pr-2">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="space-y-1">
                        <Label className="text-white font-medium">Enable Platform Image Control *</Label>
                        <p className="text-sm text-gray-400">Override general settings with {platform.label}-specific preferences</p>
                      </div>
                      <Switch
                        checked={platformImageControls[platform.id]?.enabled || false}
                        onCheckedChange={(checked) => {
                          setPlatformImageControls(prev => ({
                            ...prev,
                            [platform.id]: {
                              enabled: checked,
                              style: prev[platform.id]?.style || "",
                              guidance: prev[platform.id]?.guidance || "",
                              caption: prev[platform.id]?.caption || "",
                              ratio: prev[platform.id]?.ratio || "16:9",
                              startingImage: prev[platform.id]?.startingImage || null
                            }
                          }));
                        }}
                      />
                    </div>

                    {platformImageControls[platform.id]?.enabled && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="space-y-3">
                          <Label className="text-white font-medium">Style Guidance</Label>
                          <Select
                            value={platformImageControls[platform.id]?.style || ""}
                            onValueChange={(value) => {
                              setPlatformImageControls(prev => ({
                                ...prev,
                                [platform.id]: { ...prev[platform.id], style: value }
                              }));
                            }}
                          >
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
                          <Select
                            value={platformImageControls[platform.id]?.ratio || "16:9"}
                            onValueChange={(value) => {
                              setPlatformImageControls(prev => ({
                                ...prev,
                                [platform.id]: { ...prev[platform.id], ratio: value }
                              }));
                            }}
                          >
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
                            placeholder="Platform-specific visual guidance..."
                            className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-[80px] resize-none"
                            value={platformImageControls[platform.id]?.guidance || ""}
                            onChange={(e) => {
                              setPlatformImageControls(prev => ({
                                ...prev,
                                [platform.id]: { ...prev[platform.id], guidance: e.target.value }
                              }));
                            }}
                          />
                          <p className="text-xs text-gray-400 bg-orange-500/10 p-2 rounded-md border border-orange-500/20">
                            <strong>Level 2:</strong> Platform-specific guidance that overrides Level 1 settings when enabled.
                          </p>
                        </div>

                        <div className="space-y-3 opacity-50 cursor-not-allowed">
                          <Label className="text-gray-400 font-medium">Caption/Text Overlay</Label>
                          <Input
                            placeholder="Text to overlay on the image (optional)..."
                            className="bg-gray-700/30 border-gray-600/40 text-gray-500 placeholder:text-gray-500 cursor-not-allowed"
                            value={platformImageControls[platform.id]?.caption || ""}
                            onChange={(e) => {
                              setPlatformImageControls(prev => ({
                                ...prev,
                                [platform.id]: { ...prev[platform.id], caption: e.target.value }
                              }));
                            }}
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
                              id={`starting-image-${platform.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setPlatformImageControls(prev => ({
                                  ...prev,
                                  [platform.id]: { ...prev[platform.id], startingImage: file }
                                }));
                              }}
                            />
                            <Label htmlFor={`starting-image-${platform.id}`} className="cursor-pointer">
                              <div className="space-y-2">
                                <Image className="w-8 h-8 mx-auto text-gray-400" />
                                {platformImageControls[platform.id]?.startingImage ? (
                                  <p className="text-white font-medium">{platformImageControls[platform.id].startingImage?.name}</p>
                                ) : (
                                  <p className="text-gray-400">Upload a base image for {platform.label}</p>
                                )}
                                <p className="text-xs text-gray-500">Click to browse or drag & drop</p>
                              </div>
                            </Label>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          setPlatformImageControls(prev => ({
                            ...prev,
                            [platform.id]: {
                              enabled: false,
                              style: "",
                              guidance: "",
                              caption: "",
                              ratio: "16:9",
                              startingImage: null
                            }
                          }));
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

                          const settings = platformImageControls[platform.id];
                          if (!settings) return;

                          const result = await saveImageControlSettings(
                            userId,
                            companyId,
                            2,
                            settings,
                            platform.id
                          );

                          if (result.success) {
                            toast({
                              title: "Platform Settings Saved!",
                              description: `${platform.label} image control preferences saved as defaults.`,
                            });
                          } else {
                            toast({
                              title: "Save Failed",
                              description: result.error || "Failed to save platform settings.",
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformCard;
