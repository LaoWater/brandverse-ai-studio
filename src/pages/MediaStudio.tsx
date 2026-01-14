import { useState } from 'react';
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { MediaStudioProvider, useMediaStudio } from '@/contexts/MediaStudioContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import MediaTypeSwitcher from '@/components/media/MediaTypeSwitcher';
import ModelSelector from '@/components/media/ModelSelector';
import VideoModelSelector from '@/components/media/VideoModelSelector';
import VideoGenerationModeSelector from '@/components/media/VideoGenerationModeSelector';
import PromptInput from '@/components/media/PromptInput';
import FormatControls from '@/components/media/FormatControls';
import VideoFormatControls from '@/components/media/VideoFormatControls';
import ReferenceImageUpload from '@/components/media/ReferenceImageUpload';
import ReferenceImageLibrary from '@/components/media/ReferenceImageLibrary';
import KeyframeImageUpload from '@/components/media/KeyframeImageUpload';
import VideoPromptGuide from '@/components/media/VideoPromptGuide';
import MediaLibrary from '@/components/media/MediaLibrary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Zap, ArrowRight, Loader, CheckCircle, Library, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  generateMediaWithProgress,
  uploadReferenceImage,
  uploadVideoFrameImage,
  extractAndUploadLastFrame,
  MediaFile,
} from '@/services/mediaStudioService';
import { MediaType } from '@/contexts/MediaStudioContext';
import {
  getUserCredits,
  deductCredits,
  calculateMediaStudioCredits,
} from '@/services/creditsService';

const MediaStudioContent = () => {
  const {
    mediaType,
    prompt,
    selectedImageModel,
    selectedVideoModel,
    videoGenerationMode,
    aspectRatio,
    numberOfImages,
    imageSize,
    seed,
    negativePrompt,
    enhancePrompt,
    referenceImages,
    videoDuration,
    videoFps,
    generateAudio,
    firstFrameImage,
    lastFrameImage,
    inputVideoImage,
    isGenerating,
    generationProgress,
    currentStage,
    startGeneration,
    updateGenerationProgress,
    completeGeneration,
    resetGeneration,
    setMediaType,
    setVideoGenerationMode,
    addReferenceImageFromUrl,
    setInputVideoImageFromUrl,
    clearReferenceImages,
    clearVideoFrames,
  } = useMediaStudio();

  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showLibrary, setShowLibrary] = useState(false);

  // State for video continuation feature
  const [isContinuingVideo, setIsContinuingVideo] = useState(false);
  const [continueVideoProgress, setContinueVideoProgress] = useState('');

  // Calculate generation cost based on current settings
  const generationCost = calculateMediaStudioCredits(
    mediaType === 'image' ? selectedImageModel : selectedVideoModel,
    imageSize,
    numberOfImages,
    mediaType,
    videoDuration
  );

  // Generation mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      // Check if user has enough credits
      const userCredits = await getUserCredits();
      if (!userCredits || userCredits.available_credits < generationCost) {
        throw new Error(
          `Insufficient credits. You need ${generationCost} credits but only have ${userCredits?.available_credits || 0}.`
        );
      }

      // Deduct credits before generation
      const deductSuccess = await deductCredits(generationCost);
      if (!deductSuccess) {
        throw new Error('Failed to deduct credits. Please try again.');
      }

      let referenceImageUrls: string[] = [];
      let firstFrameUrl: string | undefined;
      let lastFrameUrl: string | undefined;
      let inputImageUrl: string | undefined;

      if (mediaType === 'image') {
        // Upload reference images for image generation
        if (referenceImages.length > 0 && user) {
          console.log('[MediaStudio] Uploading reference images...', referenceImages.length);
          for (const image of referenceImages) {
            const uploadedUrl = await uploadReferenceImage(image, user.id);
            console.log('[MediaStudio] Reference image uploaded:', uploadedUrl);
            if (uploadedUrl) {
              referenceImageUrls.push(uploadedUrl);
            } else {
              console.error('[MediaStudio] Reference image upload failed - no URL returned');
            }
          }
        }
      } else {
        // Upload frame images for video generation based on mode
        if (videoGenerationMode === 'image-to-video' && inputVideoImage && user) {
          console.log('[MediaStudio] Uploading input image for image-to-video...');
          inputImageUrl = await uploadVideoFrameImage(inputVideoImage, user.id, 'input');
          if (!inputImageUrl) {
            throw new Error('Failed to upload input image. Please try again.');
          }
          console.log('[MediaStudio] Input image uploaded:', inputImageUrl);
        } else if (videoGenerationMode === 'keyframe-to-video' && user) {
          if (firstFrameImage) {
            console.log('[MediaStudio] Uploading first frame...');
            firstFrameUrl = await uploadVideoFrameImage(firstFrameImage, user.id, 'first');
            if (!firstFrameUrl) {
              throw new Error('Failed to upload first frame. Please try again.');
            }
            console.log('[MediaStudio] First frame uploaded:', firstFrameUrl);
          }
          if (lastFrameImage) {
            console.log('[MediaStudio] Uploading last frame...');
            lastFrameUrl = await uploadVideoFrameImage(lastFrameImage, user.id, 'last');
            if (!lastFrameUrl) {
              throw new Error('Failed to upload last frame. Please try again.');
            }
            console.log('[MediaStudio] Last frame uploaded:', lastFrameUrl);
          }
        }
      }

      console.log(`[MediaStudio] Calling generateMediaWithProgress for ${mediaType}...`);

      // Generate media with progress
      const result = await generateMediaWithProgress(
        {
          prompt,
          mediaType,
          model: mediaType === 'image' ? selectedImageModel : selectedVideoModel,
          aspectRatio,
          // Image-specific
          numberOfImages: mediaType === 'image' ? numberOfImages : undefined,
          imageSize: mediaType === 'image' ? imageSize : undefined,
          seed: mediaType === 'image' ? seed : undefined,
          negativePrompt: mediaType === 'image' ? negativePrompt : undefined,
          enhancePrompt: mediaType === 'image' ? enhancePrompt : undefined,
          referenceImageUrls: mediaType === 'image' ? referenceImageUrls : undefined,
          // Video-specific
          videoMode: mediaType === 'video' ? videoGenerationMode : undefined,
          videoDuration: mediaType === 'video' ? videoDuration : undefined,
          videoFps: mediaType === 'video' ? videoFps : undefined,
          generateAudio: mediaType === 'video' ? generateAudio : undefined,
          inputImageUrl: mediaType === 'video' ? inputImageUrl : undefined,
          firstFrameUrl: mediaType === 'video' ? firstFrameUrl : undefined,
          lastFrameUrl: mediaType === 'video' ? lastFrameUrl : undefined,
          // Common
          userId: user.id,
          companyId: selectedCompany?.id,
        },
        (progress, stage) => {
          updateGenerationProgress(progress, stage);
        }
      );

      return { result, mediaType };
    },
    onSuccess: async ({ result, mediaType: generatedMediaType }) => {
      // Handle error result (when generateMedia returns success: false)
      if (!result.success) {
        resetGeneration(); // Close the modal immediately

        const errorMessage = result.error || 'Something went wrong. Please try again.';
        const isHelpfulError = errorMessage.includes("couldn't generate") ||
                               errorMessage.includes("💡 Tip:");

        toast({
          title: isHelpfulError ? 'Need More Details' : 'Generation Failed',
          description: errorMessage,
          variant: 'destructive',
          duration: isHelpfulError ? 8000 : 5000,
        });
        return;
      }

      // Handle success result
      // NOTE: The edge function already saves the media record to the database
      // This ensures the record exists even if the user's browser crashes
      // We only need to refresh the UI here
      if (result.success && user) {
        const isVideo = generatedMediaType === 'video';

        completeGeneration(result.mediaUrl, result.thumbnailUrl);

        // Invalidate library query to refresh with the new record from the database
        queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });

        // Show success toast
        toast({
          title: 'Success!',
          description: `Your ${isVideo ? 'video' : 'image'} has been generated successfully.`,
          className: 'bg-green-600/90 border-green-600 text-white',
        });

        // Auto-switch to library after 2 seconds
        setTimeout(() => {
          setShowLibrary(true);
          resetGeneration();
        }, 2000);
      }
    },
    onError: (error: any) => {
      // This handles network/fetch errors or thrown exceptions
      console.error('Generation error (network/exception):', error);

      resetGeneration(); // Close the modal immediately

      const errorMessage = error?.message || 'Network error. Please check your connection and try again.';

      toast({
        title: 'Connection Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
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

  // Handler for using a library image for new generation
  const handleUseForGeneration = async (media: MediaFile, targetType: MediaType) => {
    try {
      if (targetType === 'image') {
        // Clear existing reference images and add the new one
        clearReferenceImages();
        await addReferenceImageFromUrl(media.public_url, media.file_name);
        setMediaType('image');

        toast({
          title: 'Image Added',
          description: 'Image added as reference. Enter a prompt to generate variations.',
          className: 'bg-primary/90 border-primary text-white',
        });
      } else {
        // For video generation: set as input image and switch to image-to-video mode
        clearVideoFrames();
        await setInputVideoImageFromUrl(media.public_url, media.file_name);
        setMediaType('video');
        setVideoGenerationMode('image-to-video');

        toast({
          title: 'Image Added',
          description: 'Image set for video generation. Enter a prompt to animate it.',
          className: 'bg-accent/90 border-accent text-white',
        });
      }

      // Switch to create view
      setShowLibrary(false);
    } catch (error) {
      console.error('Failed to load image for generation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handler for continuing a video (extract last frame and use for new video)
  const handleContinueVideo = async (media: MediaFile) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to continue videos.',
        variant: 'destructive',
      });
      return;
    }

    setIsContinuingVideo(true);
    setContinueVideoProgress('Preparing...');

    try {
      // Extract and upload the last frame
      const result = await extractAndUploadLastFrame(
        media.public_url,
        user.id,
        media.id,
        (stage) => setContinueVideoProgress(stage)
      );

      if (!result.success || !result.frameUrl) {
        throw new Error(result.error || 'Failed to extract frame');
      }

      // Clear existing video frames and set the extracted frame as input
      clearVideoFrames();
      await setInputVideoImageFromUrl(result.frameUrl, `continuation_from_${media.file_name}`);

      // Switch to video mode with image-to-video
      setMediaType('video');
      setVideoGenerationMode('image-to-video');

      // Switch to create view
      setShowLibrary(false);

      toast({
        title: 'Ready to Continue',
        description: 'Last frame extracted! Enter a prompt to continue this video.',
        className: 'bg-accent/90 border-accent text-white',
      });
    } catch (error: any) {
      console.error('Failed to continue video:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to extract frame from video. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsContinuingVideo(false);
      setContinueVideoProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <Navigation />

      {/* Diagonal Ambient Gradients - Static for performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Top-left to bottom-right diagonal streak */}
        <div className="absolute -top-20 -left-20 w-[700px] h-[700px] bg-primary/25 rounded-full blur-3xl"></div>
        {/* Bottom-right accent glow */}
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl"></div>
        {/* Center diagonal accent band */}
        <div className="absolute top-1/3 left-1/4 w-[900px] h-[300px] bg-gradient-to-r from-primary/15 via-accent/12 to-primary/15 rotate-12 blur-3xl"></div>
        {/* Extra mid-screen glow */}
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-primary/15 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                Media Studio
              </h1>
              <p className="text-gray-400">
                {mediaType === 'image'
                  ? 'Create stunning visuals with AI-powered image generation'
                  : 'Create dynamic videos with AI-powered video generation'}
              </p>
            </div>

            {/* View Mode Switcher with Company Logo - GPU accelerated */}
            <div className="relative flex items-center gap-6">
              <div className="relative inline-flex items-center bg-muted/50 dark:bg-black/30 rounded-full p-1.5 border-0 will-change-auto">
              {/* Sliding indicator - hardware accelerated with transform */}
              <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-primary to-accent transition-transform duration-300 ease-out will-change-transform"
                style={{
                  transform: showLibrary ? 'translateX(calc(100% + 4px))' : 'translateX(4px)',
                }}
              />

              {/* Create New Button */}
              <button
                onClick={() => setShowLibrary(false)}
                className={`relative z-10 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-2 ${
                  !showLibrary
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                Create New
              </button>

              {/* My Library Button */}
              <button
                onClick={() => setShowLibrary(true)}
                className={`relative z-10 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-2 ${
                  showLibrary
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Library className="w-4 h-4" />
                My Library
              </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        {!showLibrary ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            {/* Left Sidebar - Controls */}
            <aside className="space-y-4">
              {/* Generation Settings */}
              <Card className="cosmic-card border-0 p-6 space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Zap className="w-5 h-5 text-accent" />
                  Generation Settings
                </div>

                <MediaTypeSwitcher />

                {/* Conditional rendering based on media type */}
                {mediaType === 'image' ? (
                  <>
                    <ModelSelector />
                    <FormatControls />
                  </>
                ) : (
                  <>
                    <VideoModelSelector />
                    <VideoGenerationModeSelector />
                    <VideoFormatControls />
                  </>
                )}
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
                        {mediaType === 'image'
                          ? 'What will you create today?'
                          : 'What video will you bring to life?'}
                      </h2>
                      <p className="text-gray-300 text-lg">
                        {mediaType === 'image'
                          ? 'Describe your vision and watch AI bring it to life'
                          : 'Describe the action and watch AI animate your vision'}
                      </p>
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-6">
                      <PromptInput />

                      {/* Conditional rendering based on media type */}
                      {mediaType === 'image' ? (
                        <>
                          <ReferenceImageUpload />
                          <ReferenceImageLibrary />
                        </>
                      ) : (
                        <>
                          <KeyframeImageUpload />
                          <VideoPromptGuide />
                        </>
                      )}

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
                            {mediaType === 'image' ? 'Generate Image' : 'Generate Video'}
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
            <MediaLibrary
              onCreateNew={() => setShowLibrary(false)}
              onUseForGeneration={handleUseForGeneration}
              onContinueVideo={handleContinueVideo}
              isContinuingVideo={isContinuingVideo}
              continueVideoProgress={continueVideoProgress}
            />
          </div>
        )}
      </div>

      {/* Generation Progress Modal */}
      <Dialog open={isGenerating} onOpenChange={(open) => {
        // Prevent closing during generation
        if (!open && isGenerating && generationProgress < 100) {
          return;
        }
      }}>
        <DialogContent className="bg-card/95 backdrop-blur-sm max-w-md border-primary/30">
          <DialogTitle className="sr-only">Image Generation Progress</DialogTitle>
          <DialogDescription className="sr-only">
            {generationProgress < 100
              ? `Generating your image: ${currentStage || 'Starting...'}`
              : 'Image generation complete'}
          </DialogDescription>
          <div className="text-center py-8">
            {generationProgress < 100 ? (
              <>
                {/* Enhanced Magic Spinner */}
                <div className="relative inline-block mb-8 magic-spinner-container">
                  {/* Animated glow background */}
                  <div className="magic-glow-bg w-32 h-32" />

                  {/* Rotating light rays */}
                  <div className="magic-rays">
                    <div className="magic-ray" style={{ transform: 'rotate(0deg)' }} />
                    <div className="magic-ray" style={{ transform: 'rotate(45deg)' }} />
                    <div className="magic-ray" style={{ transform: 'rotate(90deg)' }} />
                    <div className="magic-ray" style={{ transform: 'rotate(135deg)' }} />
                    <div className="magic-ray" style={{ transform: 'rotate(180deg)' }} />
                    <div className="magic-ray" style={{ transform: 'rotate(225deg)' }} />
                    <div className="magic-ray" style={{ transform: 'rotate(270deg)' }} />
                    <div className="magic-ray" style={{ transform: 'rotate(315deg)' }} />
                  </div>

                  {/* Expanding rings */}
                  <div className="magic-ring" />
                  <div className="magic-ring" />
                  <div className="magic-ring" />

                  {/* Main rotating loader with 3D effect */}
                  <div className="relative z-10">
                    <Loader className="w-20 h-20 text-primary magic-spinner-ring" />
                  </div>

                  {/* Pulsing center core - custom animated element */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 magic-core-sparkle z-20">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white via-accent to-primary"
                         style={{ boxShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(0, 212, 255, 0.5)' }} />
                  </div>

                  {/* Orbiting energy particles */}
                  <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gradient-to-r from-primary to-accent rounded-full magic-particle" />
                  <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gradient-to-r from-accent to-primary rounded-full magic-particle" />
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full magic-particle" />
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-accent rounded-full magic-particle" />

                  {/* Floating stars */}
                  <div className="absolute -top-2 -right-2 text-accent magic-star" style={{ animationDelay: '0s' }}>✦</div>
                  <div className="absolute -top-2 -left-2 text-primary magic-star" style={{ animationDelay: '0.5s' }}>✦</div>
                  <div className="absolute -bottom-2 -right-2 text-primary magic-star" style={{ animationDelay: '1s' }}>✦</div>
                  <div className="absolute -bottom-2 -left-2 text-accent magic-star" style={{ animationDelay: '1.5s' }}>✦</div>
                </div>

                <h3 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-3 animate-gradient-x">
                  Creating Magic...
                </h3>
                <p className="text-gray-300 mb-6 text-lg">{currentStage || 'Initializing...'}</p>
                <div className="space-y-3">
                  <div className="relative">
                    <Progress value={generationProgress} className="h-3 cosmic-progress-bar" />
                  </div>
                  <p className="text-base text-accent font-bold">{Math.round(generationProgress)}%</p>
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

// Error boundary component
class MediaStudioErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MediaStudio Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-destructive/50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h2>
            <p className="text-gray-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="cosmic-button"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const MediaStudio = () => {
  return (
    <MediaStudioErrorBoundary>
      <MediaStudioProvider>
        <MediaStudioContent />
      </MediaStudioProvider>
    </MediaStudioErrorBoundary>
  );
};

export default MediaStudio;
