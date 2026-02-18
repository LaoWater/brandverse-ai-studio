import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Check } from "lucide-react";

interface ImageQualityDialogProps {
  imageQuality: 'balanced' | 'ultra';
  setImageQuality: (quality: 'balanced' | 'ultra') => void;
}

const ImageQualityDialog = ({ imageQuality, setImageQuality }: ImageQualityDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-4 py-2 h-12 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 relative group"
          type="button"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Award className="w-5 h-5 relative z-10 drop-shadow-lg" />
          <span className="text-sm font-medium relative z-10">
            Quality: {imageQuality === 'balanced' ? 'Balanced' : 'Ultra'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="cosmic-card border-0 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-bold flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <Award className="w-6 h-6 text-white" />
            </div>
            <span>Image Generation Quality</span>
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Choose the AI model quality for generating images. Higher quality takes longer and costs more.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              imageQuality === 'balanced'
                ? 'border-accent bg-accent/10'
                : 'border-white/10 hover:border-white/30 bg-white/5'
            }`}
            onClick={() => setImageQuality('balanced')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  Balanced
                  <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">Default</span>
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Great balance of quality and cost
                </p>
                <div className="mt-3 space-y-1 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Speed:</span>
                    <span>Moderate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Quality:</span>
                    <span>Very High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Cost:</span>
                    <span>3 credits per image</span>
                  </div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                imageQuality === 'balanced'
                  ? 'bg-accent border-accent'
                  : 'border-white/20'
              }`}>
                {imageQuality === 'balanced' && <Check className="w-3 h-3 text-gray-900" />}
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              imageQuality === 'ultra'
                ? 'border-accent bg-accent/10'
                : 'border-white/10 hover:border-white/30 bg-white/5'
            }`}
            onClick={() => setImageQuality('ultra')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg">Ultra</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Exceptional quality for special campaigns
                </p>
                <div className="mt-3 space-y-1 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Speed:</span>
                    <span>Slower</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Quality:</span>
                    <span>Exceptional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Cost:</span>
                    <span>4 credits per image (+1)</span>
                  </div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                imageQuality === 'ultra'
                  ? 'bg-accent border-accent'
                  : 'border-white/20'
              }`}>
                {imageQuality === 'ultra' && <Check className="w-3 h-3 text-gray-900" />}
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mt-4">
            <p className="text-xs text-gray-300">
              <strong className="text-blue-300">Note:</strong> The selected quality level affects all generated images in this content batch.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageQualityDialog;
