import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { useMediaStudio, isSoraModel } from '@/contexts/MediaStudioContext';
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
import SoraFormatControls from '@/components/media/SoraFormatControls';
import MediaLibrary from '@/components/media/MediaLibrary';
// VideoGenerationQueue is now rendered globally via GlobalGenerationTracker
import { VideoEditor } from '@/components/editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Zap, ArrowRight, Loader, Library, Plus, Film, RefreshCw, AlertCircle } from 'lucide-react';
import type { MediaStudioView } from '@/types/editor';
import { useToast } from '@/hooks/use-toast';
import {
  generateMedia,
  uploadReferenceImage,
  uploadVideoFrameImage,
  extractAndUploadLastFrame,
  MediaFile,
  getPendingVideoJobsCount,
  recoverPendingVideos,
  RecoveryResult,
  startAsyncVideoGeneration,
  persistPendingVideoJob,
  deletePendingJob,
  GenerationConfig,
} from '@/services/mediaStudioService';
import { videoPollingService } from '@/services/videoPollingService';
// Note: videoPollingService callbacks are set up globally in GlobalGenerationTracker
import GenerationErrorDialog, { GenerationError } from '@/components/media/GenerationErrorDialog';
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
    videoResolution,
    generateAudio,
    videoNegativePrompt,
    videoReferenceImages,
    firstFrameImage,
    lastFrameImage,
    inputVideoImage,
    inputVideoImagePreview,
    sourceVideoGcsUri,
    // Sora-specific state
    soraResolution,
    soraDuration,
    // Note: Sora image-to-video uses inputVideoImage (shared with Veo)
    soraRemixVideoId,
    isGenerating,
    setMediaType,
    setVideoGenerationMode,
    addReferenceImageFromUrl,
    setInputVideoImageFromUrl,
    clearReferenceImages,
    clearVideoFrames,
    setSourceVideoForExtension,
    // Active generations queue (non-blocking video generation)
    activeGenerations,
    addActiveGeneration,
    updateActiveGeneration,
    removeActiveGeneration,
  } = useMediaStudio();

  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // View state: 'create' | 'library' | 'editor'
  const [currentView, setCurrentView] = useState<MediaStudioView>('create');

  // Sync view state from URL search params (e.g. ?view=library from GlobalGenerationTracker)
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'library' || viewParam === 'create' || viewParam === 'editor') {
      setCurrentView(viewParam as MediaStudioView);
      // Clear the param so it doesn't persist on subsequent navigations
      searchParams.delete('view');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // State for video continuation feature
  const [isContinuingVideo, setIsContinuingVideo] = useState(false);
  const [continueVideoProgress, setContinueVideoProgress] = useState('');

  // State for error dialog
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [generationError, setGenerationError] = useState<GenerationError | string | null>(null);

  // State for pending video recovery
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);

  // Note: Video polling service callbacks are now set up globally in GlobalGenerationTracker
  // This component only needs to handle local error dialogs for failed generations

  // Watch for failed generations to show error dialog
  useEffect(() => {
    const failedGeneration = activeGenerations.find(
      g => g.status === 'failed' && g.error && !showErrorDialog
    );
    if (failedGeneration) {
      setGenerationError(failedGeneration.error || null);
      setShowErrorDialog(true);
    }
  }, [activeGenerations, showErrorDialog]);

  // Calculate generation cost based on current settings
  // For Sora models, use soraDuration; for Veo models, use videoDuration
  const effectiveVideoDuration = mediaType === 'video' && isSoraModel(selectedVideoModel)
    ? soraDuration
    : videoDuration;

  const generationCost = calculateMediaStudioCredits(
    mediaType === 'image' ? selectedImageModel : selectedVideoModel,
    imageSize,
    numberOfImages,
    mediaType,
    effectiveVideoDuration,
    // Pass Sora resolution for Sora 2 Pro pricing (720p vs 1080p)
    isSoraModel(selectedVideoModel) ? soraResolution : undefined
  );

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

    // For VIDEO: Use non-blocking queue-based generation
    if (mediaType === 'video') {
      handleVideoGenerateNonBlocking();
      return;
    }

    // For IMAGE: Use non-blocking queue-based generation
    handleImageGenerateNonBlocking();
  };

  // Non-blocking video generation handler
  const handleVideoGenerateNonBlocking = async () => {
    if (!user) return;

    const usingSora = isSoraModel(selectedVideoModel);

    // Create a local generation ID outside try block so it's accessible in catch
    const localId = crypto.randomUUID();
    let generationAdded = false;

    try {
      // Check credits first
      const userCredits = await getUserCredits();
      if (!userCredits || userCredits.available_credits < generationCost) {
        toast({
          title: 'Insufficient Credits',
          description: `You need ${generationCost} credits but only have ${userCredits?.available_credits || 0}.`,
          variant: 'destructive',
        });
        return;
      }

      // Deduct credits
      const deductSuccess = await deductCredits(generationCost);
      if (!deductSuccess) {
        toast({
          title: 'Error',
          description: 'Failed to deduct credits. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Upload input image if needed (for image-to-video mode)
      let inputImageUrl: string | undefined;
      if (videoGenerationMode === 'image-to-video' && inputVideoImage && user) {
        toast({
          title: 'Uploading image...',
          description: 'Preparing your input image.',
        });
        inputImageUrl = await uploadVideoFrameImage(inputVideoImage, user.id, 'input');
        if (!inputImageUrl) {
          throw new Error('Failed to upload input image. Please try again.');
        }
      }

      // Build generation config
      const config: GenerationConfig = {
        prompt,
        mediaType: 'video',
        model: selectedVideoModel,
        aspectRatio,
        videoMode: videoGenerationMode,
        userId: user.id,
        companyId: selectedCompany?.id,
        // Sora-specific
        ...(usingSora && {
          soraResolution,
          soraDuration,
          soraInputReferenceUrl: inputImageUrl,
          soraRemixVideoId: videoGenerationMode === 'remix' ? soraRemixVideoId || undefined : undefined,
        }),
        // Veo-specific
        ...(!usingSora && {
          videoDuration,
          videoResolution,
          generateAudio,
          negativePrompt: videoNegativePrompt,
          inputImageUrl,
          sourceVideoGcsUri: videoGenerationMode === 'extend-video' ? sourceVideoGcsUri || undefined : undefined,
        }),
      };

      // Add to active generations queue immediately (shows in UI)
      addActiveGeneration({
        id: localId,
        mediaType: 'video',
        operationName: '', // Will be updated after API call
        prompt,
        model: selectedVideoModel,
        mode: videoGenerationMode,
        resolution: usingSora ? soraResolution : videoResolution,
        duration: usingSora ? soraDuration : videoDuration,
        thumbnailUrl: inputVideoImagePreview || undefined,
      });
      generationAdded = true;

      // Show toast
      toast({
        title: 'Video Generation Started',
        description: 'You can continue working while the video generates.',
        className: 'bg-primary/90 border-primary text-white',
      });

      // Start the async generation
      const result = await startAsyncVideoGeneration(config, (progress, stage) => {
        // Update progress during initial API call
        updateActiveGeneration(localId, { progress, stage });
      });

      if (!result.success || !result.operation_name) {
        throw new Error(result.error || 'Failed to start video generation');
      }

      // Update the generation with the operation name
      updateActiveGeneration(localId, {
        operationName: result.operation_name,
        status: 'queued',
        stage: 'Queued for processing...',
      });

      // Persist to pending_video_jobs for recovery
      const pendingJobId = await persistPendingVideoJob(result.operation_name, config);
      if (pendingJobId) {
        updateActiveGeneration(localId, { pendingJobId });
      }

      // Start background polling
      videoPollingService.startPolling(
        localId,
        result.operation_name,
        selectedVideoModel,
        result.request_data
      );

    } catch (error: any) {
      console.error('Video generation error:', error);

      // Remove the failed generation from the queue if it was added
      if (generationAdded) {
        removeActiveGeneration(localId);
      }

      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to start video generation.',
        variant: 'destructive',
      });
    }
  };

  // Non-blocking image generation handler
  const handleImageGenerateNonBlocking = async () => {
    if (!user) return;

    const localId = crypto.randomUUID();
    let generationAdded = false;

    // Limit concurrent image generations
    const activeImageGenerations = activeGenerations.filter(
      g => g.mediaType === 'image' && (g.status === 'starting' || g.status === 'queued' || g.status === 'processing')
    );
    if (activeImageGenerations.length >= 5) {
      toast({
        title: 'Too Many Active Generations',
        description: 'Please wait for some images to finish before starting new ones.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check credits first
      const userCredits = await getUserCredits();
      if (!userCredits || userCredits.available_credits < generationCost) {
        toast({
          title: 'Insufficient Credits',
          description: `You need ${generationCost} credits but only have ${userCredits?.available_credits || 0}.`,
          variant: 'destructive',
        });
        return;
      }

      // Deduct credits
      const deductSuccess = await deductCredits(generationCost);
      if (!deductSuccess) {
        toast({
          title: 'Error',
          description: 'Failed to deduct credits. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Add to active generations queue immediately (shows in tracker)
      addActiveGeneration({
        id: localId,
        mediaType: 'image',
        operationName: '', // Images don't use operation names
        prompt,
        model: selectedImageModel,
        mode: 'text-to-image',
        resolution: imageSize,
        duration: 0, // Not applicable for images
        aspectRatio,
        numberOfImages,
        thumbnailUrl: undefined,
      });
      generationAdded = true;

      // Show toast
      toast({
        title: 'Image Generation Started',
        description: 'You can continue working while the image generates.',
        className: 'bg-primary/90 border-primary text-white',
      });

      // Update progress: uploading reference images
      updateActiveGeneration(localId, {
        progress: 10,
        stage: 'Preparing request...',
        status: 'processing',
      });

      // Upload reference images if any
      let referenceImageUrls: string[] = [];
      if (referenceImages.length > 0 && user) {
        updateActiveGeneration(localId, {
          progress: 20,
          stage: 'Uploading reference images...',
        });
        for (const image of referenceImages) {
          const uploadedUrl = await uploadReferenceImage(image, user.id);
          if (uploadedUrl) {
            referenceImageUrls.push(uploadedUrl);
          }
        }
      }

      // Build generation config
      const config: GenerationConfig = {
        prompt,
        mediaType: 'image',
        model: selectedImageModel,
        aspectRatio,
        numberOfImages,
        imageSize,
        seed,
        negativePrompt,
        enhancePrompt,
        referenceImageUrls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
        userId: user.id,
        companyId: selectedCompany?.id,
      };

      // Update progress: generating
      updateActiveGeneration(localId, {
        progress: 35,
        stage: `Generating with ${getImageModelDisplayName(selectedImageModel)}...`,
      });

      // Call the generation API (this is synchronous but we don't block the UI)
      const result = await generateMedia(config);

      if (!result.success) {
        // Generation returned error
        updateActiveGeneration(localId, {
          status: 'failed',
          stage: 'Failed',
          error: result.error || 'Generation failed. Please try again.',
        });

        // Show error dialog for structured errors
        const errorMessage = result.error || 'Something went wrong.';
        const isStructuredError = errorMessage.includes('GOOGLE_API_ERROR') ||
                                  errorMessage.includes('Internal error') ||
                                  errorMessage.includes('Service') ||
                                  errorMessage.includes('Timeout');

        if (isStructuredError) {
          setGenerationError(errorMessage);
          setShowErrorDialog(true);
        }
        return;
      }

      // Success!
      updateActiveGeneration(localId, {
        progress: 100,
        status: 'completed',
        stage: 'Complete!',
        imageUrl: result.mediaUrl,
        completedAt: new Date(),
      });

      // Refresh library
      queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });

      // Show success toast
      toast({
        title: 'Image Ready!',
        description: 'Your image has been generated successfully.',
        className: 'bg-emerald-600/90 border-emerald-600 text-white',
      });

    } catch (error: any) {
      console.error('Image generation error:', error);

      if (generationAdded) {
        updateActiveGeneration(localId, {
          status: 'failed',
          stage: 'Failed',
          error: error.message || 'Image generation failed.',
        });
      }

      // Show error for network/exception errors
      const errorMessage = error?.message || 'Network error. Please check your connection.';
      const isStructuredError = errorMessage.includes('GOOGLE_API_ERROR') ||
                                errorMessage.includes('Internal error') ||
                                errorMessage.length > 100;

      if (isStructuredError) {
        setGenerationError(errorMessage);
        setShowErrorDialog(true);
      } else {
        toast({
          title: 'Generation Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  // Helper for image model display names
  const getImageModelDisplayName = (model: string): string => {
    const names: Record<string, string> = {
      'gemini-2.5-flash-image': 'Gemini Flash',
      'gemini-3-pro-image-preview': 'Gemini Pro',
      'imagen-4.0-generate-001': 'Imagen 4',
      'gpt-image-1.5': 'GPT Image',
    };
    return names[model] || model;
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
      setCurrentView('create');
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
      setCurrentView('create');

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

  // Handler for extending a video (Veo 3.1 exclusive feature)
  const handleExtendVideo = (media: MediaFile, gcsUri: string) => {
    // Set up extension mode with the GCS URI and video preview
    setSourceVideoForExtension(gcsUri, media.public_url);

    // Switch to video mode
    setMediaType('video');
    setVideoGenerationMode('extend-video');

    // Switch to create view
    setCurrentView('create');

    toast({
      title: 'Ready to Extend',
      description: 'Enter a prompt describing how you want to continue this video.',
      className: 'bg-green-600/90 border-green-600 text-white',
    });
  };

  // Fetch pending video jobs count on mount and when not generating
  React.useEffect(() => {
    const fetchPendingCount = async () => {
      if (!user || isGenerating) return;
      const count = await getPendingVideoJobsCount();
      setPendingJobsCount(count);
    };

    fetchPendingCount();
    // Re-check every 30 seconds when not generating
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [user, isGenerating]);

  // Handler for recovering pending videos
  const handleRecoverPendingVideos = async () => {
    if (isRecovering || !user) return;

    setIsRecovering(true);
    try {
      const result = await recoverPendingVideos();

      if (result.success) {
        // Refresh the pending count
        const newCount = await getPendingVideoJobsCount();
        setPendingJobsCount(newCount);

        // Invalidate library query to show recovered videos
        if (result.recovered > 0) {
          queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });
        }

        // Show appropriate toast
        if (result.recovered > 0) {
          toast({
            title: `${result.recovered} Video${result.recovered > 1 ? 's' : ''} Recovered!`,
            description: `Successfully recovered ${result.recovered} video${result.recovered > 1 ? 's' : ''} from pending jobs.${result.stillPending > 0 ? ` ${result.stillPending} still processing.` : ''}`,
            className: 'bg-green-600/90 border-green-600 text-white',
          });
          // Switch to library to show recovered videos
          setCurrentView('library');
        } else if (result.stillPending > 0) {
          toast({
            title: 'Videos Still Processing',
            description: `${result.stillPending} video${result.stillPending > 1 ? 's are' : ' is'} still being generated. Check back in a few minutes.`,
            className: 'bg-primary/90 border-primary text-white',
          });
        } else if (result.expired > 0 || result.failed > 0) {
          toast({
            title: 'Recovery Complete',
            description: `${result.expired} expired, ${result.failed} failed. No videos were recovered.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'No Pending Videos',
            description: 'There are no pending video jobs to recover.',
          });
        }
      } else {
        toast({
          title: 'Recovery Failed',
          description: result.error || 'Failed to check pending videos. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to recover pending videos.',
        variant: 'destructive',
      });
    } finally {
      setIsRecovering(false);
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

            {/* View Mode Switcher - Three tabs: Create, Library, Editor */}
            <div className="relative flex items-center gap-6">
              {/* Pending Videos Recovery Button */}
              {pendingJobsCount > 0 && !isGenerating && (
                <Button
                  onClick={handleRecoverPendingVideos}
                  disabled={isRecovering}
                  variant="outline"
                  className="relative border-accent/50 hover:border-accent hover:bg-accent/10 text-accent"
                >
                  {isRecovering ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Check Pending Videos
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-accent/20 rounded-full">
                        {pendingJobsCount}
                      </span>
                    </>
                  )}
                </Button>
              )}

              <div className="relative inline-flex items-center bg-muted/50 dark:bg-black/30 rounded-full p-1.5 border-0 will-change-auto">
              {/* Sliding indicator - hardware accelerated with transform */}
              <div
                className="absolute top-1 bottom-1 w-[calc(33.333%-3px)] rounded-full bg-gradient-to-r from-primary to-accent transition-transform duration-300 ease-out will-change-transform"
                style={{
                  transform: currentView === 'create'
                    ? 'translateX(4px)'
                    : currentView === 'library'
                    ? 'translateX(calc(100% + 4px))'
                    : 'translateX(calc(200% + 8px))',
                }}
              />

              {/* Create New Button */}
              <button
                onClick={() => setCurrentView('create')}
                className={`relative z-10 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center justify-center w-32 gap-2 ${
                  currentView === 'create'
                    ? 'text-white force-text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                Create
              </button>

              {/* My Library Button */}
              <button
                onClick={() => setCurrentView('library')}
                className={`relative z-10 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center justify-center w-32 gap-2 ${
                  currentView === 'library'
                    ? 'text-white force-text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Library className="w-4 h-4" />
                Library
              </button>

              {/* Editor Button */}
              <button
                onClick={() => setCurrentView('editor')}
                className={`relative z-10 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center justify-center w-32 gap-2 ${
                  currentView === 'editor'
                    ? 'text-white force-text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Film className="w-4 h-4" />
                Editor
              </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        {currentView === 'create' ? (
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
                    {/* Show Sora-specific controls for Sora models, Veo controls for Veo models */}
                    {isSoraModel(selectedVideoModel) ? (
                      <SoraFormatControls />
                    ) : (
                      <>
                        <VideoGenerationModeSelector />
                        <VideoFormatControls />
                      </>
                    )}
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
                          : videoGenerationMode === 'extend-video' && sourceVideoGcsUri
                            ? 'How should this video continue?'
                            : 'What video will you bring to life?'}
                      </h2>
                      <p className="text-gray-300 text-lg">
                        {mediaType === 'image'
                          ? 'Describe your vision and watch AI bring it to life'
                          : videoGenerationMode === 'extend-video' && sourceVideoGcsUri
                            ? 'Describe the next scene to add ~7 seconds to your video'
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
                        disabled={!prompt.trim()}
                        className="w-full cosmic-button text-white font-semibold py-6 text-lg rounded-xl group force-text-white"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        {mediaType === 'image'
                          ? 'Generate Image'
                          : videoGenerationMode === 'extend-video' && sourceVideoGcsUri
                            ? 'Extend Video (+7s)'
                            : 'Generate Video'}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
        ) : currentView === 'library' ? (
          /* Library View */
          <div className="max-w-7xl mx-auto">
            <MediaLibrary
              onCreateNew={() => setCurrentView('create')}
              onUseForGeneration={handleUseForGeneration}
              onContinueVideo={handleContinueVideo}
              onExtendVideo={handleExtendVideo}
              isContinuingVideo={isContinuingVideo}
              continueVideoProgress={continueVideoProgress}
            />
          </div>
        ) : (
          /* Editor View */
          <div className="max-w-7xl mx-auto">
            <VideoEditor onBack={() => setCurrentView('library')} />
          </div>
        )}
      </div>

      {/* Generation Error Dialog */}
      <GenerationErrorDialog
        open={showErrorDialog}
        onClose={() => {
          setShowErrorDialog(false);
          setGenerationError(null);
        }}
        onRetry={() => {
          setShowErrorDialog(false);
          setGenerationError(null);
          // Small delay before retrying to ensure dialog closes
          setTimeout(() => {
            handleGenerate();
          }, 100);
        }}
        error={generationError}
      />

      {/* Note: VideoGenerationQueue is now rendered globally in App.tsx via GlobalGenerationTracker */}
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

// Note: MediaStudioProvider is now at the App level for global video generation tracking
const MediaStudio = () => {
  return (
    <MediaStudioErrorBoundary>
      <MediaStudioContent />
    </MediaStudioErrorBoundary>
  );
};

export default MediaStudio;
