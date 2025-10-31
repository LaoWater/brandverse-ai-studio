import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { MediaStudioProvider, useMediaStudio } from '@/contexts/MediaStudioContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import MediaTypeSwitcher from '@/components/media/MediaTypeSwitcher';
import ModelSelector from '@/components/media/ModelSelector';
import PromptInput from '@/components/media/PromptInput';
import FormatControls from '@/components/media/FormatControls';
import ReferenceImageUpload from '@/components/media/ReferenceImageUpload';
import MediaLibrary from '@/components/media/MediaLibrary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Zap, ArrowRight, Loader, CheckCircle, Library } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  generateMediaWithProgress,
  saveMediaRecord,
  uploadReferenceImage,
} from '@/services/mediaStudioService';

const MediaStudioContent = () => {
  const {
    prompt,
    selectedImageModel,
    aspectRatio,
    quality,
    referenceImage,
    isGenerating,
    generationProgress,
    currentStage,
    startGeneration,
    updateGenerationProgress,
    completeGeneration,
    resetGeneration,
  } = useMediaStudio();

  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showLibrary, setShowLibrary] = useState(false);

  // Generation mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      // Upload reference image if provided
      let referenceImageUrl: string | undefined;
      if (referenceImage && user) {
        const uploadedUrl = await uploadReferenceImage(referenceImage, user.id);
        if (uploadedUrl) {
          referenceImageUrl = uploadedUrl;
        }
      }

      // Generate media with progress
      const result = await generateMediaWithProgress(
        {
          prompt,
          mediaType: 'image',
          model: selectedImageModel,
          aspectRatio,
          quality,
          referenceImageUrl,
        },
        (progress, stage) => {
          updateGenerationProgress(progress, stage);
        }
      );

      return { result, referenceImageUrl };
    },
    onSuccess: async ({ result, referenceImageUrl }) => {
      if (result.success && user) {
        // Save to database
        await saveMediaRecord({
          user_id: user.id,
          company_id: selectedCompany?.id || null,
          file_name: `generated_${Date.now()}.png`,
          file_type: 'image',
          file_format: 'png',
          file_size: null, // Will be updated when actual file is uploaded
          storage_path: result.mediaUrl, // Dummy for now
          public_url: result.mediaUrl,
          thumbnail_url: result.thumbnailUrl || null,
          prompt,
          model_used: selectedImageModel,
          aspect_ratio: aspectRatio,
          quality,
          duration: null,
          reference_image_url: referenceImageUrl || null,
          tags: [],
          is_favorite: false,
          custom_title: null,
          notes: null,
        });

        completeGeneration(result.mediaUrl, result.thumbnailUrl);

        // Invalidate library query
        queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });

        // Show success toast
        toast({
          title: 'Success!',
          description: 'Your image has been generated successfully.',
          className: 'bg-green-600/90 border-green-600 text-white',
        });

        // Auto-switch to library after 2 seconds
        setTimeout(() => {
          setShowLibrary(true);
          resetGeneration();
        }, 2000);
      }
    },
    onError: (error) => {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      resetGeneration();
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description of what you want to create.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to generate media.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    startGeneration();
    generateMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                Media Studio
              </h1>
              <p className="text-gray-400">
                Create stunning visuals with AI-powered image generation
              </p>
            </div>

            {/* Library Toggle */}
            <Button
              onClick={() => setShowLibrary(!showLibrary)}
              variant="outline"
              className="border-primary/30 hover:border-primary/50 text-white gap-2"
            >
              {showLibrary ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create New
                </>
              ) : (
                <>
                  <Library className="w-4 h-4" />
                  My Library
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Layout */}
        {!showLibrary ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            {/* Left Sidebar - Controls */}
            <aside className="space-y-4">
              <Card className="cosmic-card border-0 p-6 space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Zap className="w-5 h-5 text-accent" />
                  Generation Settings
                </div>

                <MediaTypeSwitcher />
                <ModelSelector />
                <FormatControls />
              </Card>
            </aside>

            {/* Main Content Area */}
            <main className="space-y-6">
              {/* Welcome Card */}
              <Card className="cosmic-card border-0 overflow-hidden">
                <div className="relative">
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-cosmic-drift" />
                    <div
                      className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[120px] animate-cosmic-drift"
                      style={{ animationDelay: '-10s' }}
                    />
                  </div>

                  <CardContent className="relative z-10 p-8">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-cosmic mb-3">
                        What will you create today?
                      </h2>
                      <p className="text-gray-300 text-lg">
                        Describe your vision and watch AI bring it to life
                      </p>
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-6">
                      <PromptInput />
                      <ReferenceImageUpload />

                      {/* Generate Button */}
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full cosmic-button text-white font-semibold py-6 text-lg rounded-xl group"
                      >
                        {isGenerating ? (
                          <>
                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Generate Image
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>

              {/* Quick Tips Card */}
              <Card className="cosmic-card border-0 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Pro Tips for Better Results
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <div>
                      <strong className="text-white">Be Specific:</strong> Include details about
                      lighting, mood, colors, and composition
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <div>
                      <strong className="text-white">Use References:</strong> Upload an image to
                      guide the AI's style and composition
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <div>
                      <strong className="text-white">Experiment:</strong> Try different models
                      and settings to find what works best
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <div>
                      <strong className="text-white">Iterate:</strong> Refine your prompts based
                      on previous results for improvement
                    </div>
                  </div>
                </div>
              </Card>
            </main>
          </div>
        ) : (
          /* Library View */
          <div className="max-w-7xl mx-auto">
            <MediaLibrary onCreateNew={() => setShowLibrary(false)} />
          </div>
        )}
      </div>

      {/* Generation Progress Modal */}
      <Dialog open={isGenerating}>
        <DialogContent className="media-studio-glass max-w-md border-primary/30">
          <div className="text-center py-8">
            {generationProgress < 100 ? (
              <>
                <div className="relative inline-block mb-6">
                  <Loader className="w-16 h-16 text-primary icon-spin-glow" />
                  <Sparkles className="w-8 h-8 text-accent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  {/* Orbiting particles */}
                  <div className="absolute top-0 left-1/2 w-2 h-2 bg-accent rounded-full blur-sm animate-cosmic-drift" />
                  <div className="absolute bottom-0 right-1/2 w-2 h-2 bg-primary rounded-full blur-sm animate-cosmic-drift" style={{ animationDelay: '-5s' }} />
                </div>
                <h3 className="text-2xl font-bold text-gradient-animate mb-3">
                  Creating Magic...
                </h3>
                <p className="text-gray-300 mb-6">{currentStage}</p>
                <div className="space-y-2">
                  <div className="relative">
                    <Progress value={generationProgress} className="h-2 cosmic-progress-bar" />
                  </div>
                  <p className="text-sm text-accent font-semibold">{Math.round(generationProgress)}%</p>
                </div>
              </>
            ) : (
              <>
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center shadow-lg shadow-green-600/30">
                    <CheckCircle className="w-10 h-10 text-green-500 success-checkmark" />
                  </div>
                  {/* Success particles */}
                  <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-green-500/30 rounded-full animate-ping" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Generation Complete!
                </h3>
                <p className="text-gray-300">
                  Opening your library...
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MediaStudio = () => {
  return (
    <MediaStudioProvider>
      <MediaStudioContent />
    </MediaStudioProvider>
  );
};

export default MediaStudio;
