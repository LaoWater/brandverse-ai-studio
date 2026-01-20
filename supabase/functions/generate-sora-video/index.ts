/**
 * Sora 2 Video Generation Edge Function
 * =====================================
 *
 * This edge function handles video generation using OpenAI's Sora 2 API.
 *
 * Features:
 * - Text-to-video generation
 * - Image-to-video (using input_reference parameter)
 * - Video remix (modifying existing Sora videos)
 * - Async mode with polling support
 *
 * API Reference: https://platform.openai.com/docs/guides/video-generation
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-SORA-VIDEO] ${step}${detailsStr}`);
};

// Type definitions for Sora API
interface SoraVideoRequest {
  prompt: string;
  model: 'sora-2' | 'sora-2-pro';
  mode: 'text-to-video' | 'image-to-video' | 'remix';
  size: '1280x720' | '720x1280' | '1792x1024' | '1024x1792';
  seconds: number;
  input_reference_url?: string;  // For image-to-video mode
  remix_video_id?: string;       // For remix mode
  user_id?: string;
  company_id?: string;
  async_mode?: boolean;
}

interface SoraVideoResponse {
  success: boolean;
  status: 'processing' | 'completed' | 'failed' | 'error';
  operation_name?: string;  // Job ID for polling
  model?: string;
  video_url?: string;
  thumbnail_url?: string;
  storage_path?: string;
  sora_video_id?: string;  // Sora's video ID (for remix feature)
  metadata?: {
    model: string;
    mode: string;
    prompt: string;
    size: string;
    seconds: number;
  };
  request_data?: {
    user_id: string;
    company_id?: string;
    prompt: string;
    size: string;
    seconds: number;
    mode: string;
  };
  error?: string;
}

// Model specs for validation
// Both Sora 2 and Sora 2 Pro: 4, 8, 12 seconds
// Sora 2 Pro has additional 1080p resolution options
const MODEL_SPECS = {
  'sora-2': { validDurations: [4, 8, 12], validSizes: ['1280x720', '720x1280'] },
  'sora-2-pro': { validDurations: [4, 8, 12], validSizes: ['1280x720', '720x1280', '1792x1024', '1024x1792'] },
};

const VALID_SIZES = ['1280x720', '720x1280', '1792x1024', '1024x1792'];

/**
 * Parse size string to width and height
 */
function parseSize(size: string): { width: number; height: number } {
  const [width, height] = size.split('x').map(Number);
  return { width, height };
}

/**
 * Resize and crop image to exactly match target dimensions
 *
 * Strategy:
 * 1. Calculate the aspect ratios
 * 2. If aspect ratios match (within tolerance), just resize
 * 3. If aspect ratios differ, crop to fit (center crop) then resize
 *
 * This ensures the output image exactly matches Sora's required WxH
 */
async function resizeImageToTargetSize(
  imageBlob: Blob,
  targetSize: string
): Promise<Blob> {
  const { width: targetWidth, height: targetHeight } = parseSize(targetSize);

  logStep('Resizing image to target size', {
    targetWidth,
    targetHeight,
    inputSize: imageBlob.size
  });

  try {
    // Convert blob to array buffer for ImageScript
    const arrayBuffer = await imageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Decode the image
    const image = await Image.decode(uint8Array);
    const srcWidth = image.width;
    const srcHeight = image.height;

    logStep('Source image dimensions', { srcWidth, srcHeight });

    // If already exact size, return as-is
    if (srcWidth === targetWidth && srcHeight === targetHeight) {
      logStep('Image already at target size, no resize needed');
      return imageBlob;
    }

    // Calculate aspect ratios
    const srcAspect = srcWidth / srcHeight;
    const targetAspect = targetWidth / targetHeight;
    const aspectTolerance = 0.05; // 5% tolerance

    let processedImage: typeof image;

    // Check if aspects are similar enough for direct resize
    if (Math.abs(srcAspect - targetAspect) / targetAspect < aspectTolerance) {
      // Aspects match - just resize
      logStep('Aspect ratios match, direct resize');
      processedImage = image.resize(targetWidth, targetHeight);
    } else {
      // Aspects differ - need to crop first, then resize
      logStep('Aspect ratios differ, will crop then resize', { srcAspect, targetAspect });

      // Calculate crop dimensions to match target aspect ratio
      let cropWidth: number, cropHeight: number, cropX: number, cropY: number;

      if (srcAspect > targetAspect) {
        // Source is wider - crop width (letterbox horizontal)
        cropHeight = srcHeight;
        cropWidth = Math.round(srcHeight * targetAspect);
        cropX = Math.round((srcWidth - cropWidth) / 2);
        cropY = 0;
      } else {
        // Source is taller - crop height (letterbox vertical)
        cropWidth = srcWidth;
        cropHeight = Math.round(srcWidth / targetAspect);
        cropX = 0;
        cropY = Math.round((srcHeight - cropHeight) / 2);
      }

      logStep('Crop parameters', { cropX, cropY, cropWidth, cropHeight });

      // Crop the image (center crop)
      const croppedImage = image.crop(cropX, cropY, cropWidth, cropHeight);

      // Resize to exact target dimensions
      processedImage = croppedImage.resize(targetWidth, targetHeight);
    }

    logStep('Final image dimensions', {
      width: processedImage.width,
      height: processedImage.height
    });

    // Encode back to JPEG (good balance of quality and size)
    const outputBuffer = await processedImage.encodeJPEG(90);

    // Create new blob
    const resizedBlob = new Blob([outputBuffer], { type: 'image/jpeg' });

    logStep('Image resized successfully', {
      outputSize: resizedBlob.size,
      compressionRatio: (resizedBlob.size / imageBlob.size * 100).toFixed(1) + '%'
    });

    return resizedBlob;
  } catch (error) {
    logStep('Image resize error', { error: String(error) });

    // Fallback: return original and let Sora API handle it
    // This provides graceful degradation
    logStep('Returning original image as fallback');
    return imageBlob;
  }
}

/**
 * Start video generation with Sora API
 * Returns job ID for async polling
 */
async function startSoraGeneration(
  request: SoraVideoRequest,
  openaiApiKey: string
): Promise<{ jobId: string }> {
  const endpoint = 'https://api.openai.com/v1/videos';

  logStep('Starting Sora generation', {
    model: request.model,
    mode: request.mode,
    size: request.size,
    seconds: request.seconds,
    hasInputReference: !!request.input_reference_url,
    hasRemixId: !!request.remix_video_id,
  });

  // For text-to-video and image-to-video, use POST /v1/videos
  // For remix, use POST /v1/videos/{video_id}/remix

  if (request.mode === 'remix' && request.remix_video_id) {
    // Remix endpoint
    const remixEndpoint = `https://api.openai.com/v1/videos/${request.remix_video_id}/remix`;

    const response = await fetch(remixEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep('Sora remix API error', { status: response.status, error: errorText });
      throw new Error(`Sora API error: ${errorText}`);
    }

    const data = await response.json();
    logStep('Sora remix job started', { jobId: data.id });

    return { jobId: data.id };
  }

  // For text-to-video with image reference (image-to-video), we need multipart/form-data
  if (request.mode === 'image-to-video' && request.input_reference_url) {
    // Fetch the image and convert to blob
    logStep('Fetching input reference image', { url: request.input_reference_url });

    const imageResponse = await fetch(request.input_reference_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch input reference image: ${imageResponse.status}`);
    }

    const originalImageBlob = await imageResponse.blob();

    // IMPORTANT: Resize image to exactly match target size
    // Sora API requires input_reference to match requested width x height exactly
    logStep('Resizing input image to match target size', { targetSize: request.size });
    const imageBlob = await resizeImageToTargetSize(originalImageBlob, request.size);

    // After resize, always use JPEG (the resize function outputs JPEG)
    const imageType = imageBlob.type || 'image/jpeg';
    const ext = imageType === 'image/png' ? 'png' : 'jpeg';

    // Create FormData for multipart request
    const formData = new FormData();
    formData.append('prompt', request.prompt);
    formData.append('model', request.model);
    formData.append('size', request.size);
    formData.append('seconds', request.seconds.toString());
    formData.append('input_reference', imageBlob, `reference.${ext}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        // Note: Don't set Content-Type for FormData - browser/fetch will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep('Sora image-to-video API error', { status: response.status, error: errorText });
      throw new Error(`Sora API error: ${errorText}`);
    }

    const data = await response.json();
    logStep('Sora image-to-video job started', { jobId: data.id });

    return { jobId: data.id };
  }

  // Standard text-to-video (JSON body)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: request.prompt,
      model: request.model,
      size: request.size,
      seconds: request.seconds,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep('Sora text-to-video API error', { status: response.status, error: errorText });
    throw new Error(`Sora API error: ${errorText}`);
  }

  const data = await response.json();
  logStep('Sora text-to-video job started', { jobId: data.id });

  return { jobId: data.id };
}

/**
 * Poll Sora job status
 * Sora API returns: 'queued', 'in_progress', 'completed', 'failed'
 * We normalize to: 'queued', 'processing', 'completed', 'failed'
 */
async function pollSoraStatus(
  jobId: string,
  openaiApiKey: string
): Promise<{
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}> {
  const endpoint = `https://api.openai.com/v1/videos/${jobId}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to poll Sora status: ${errorText}`);
  }

  const data = await response.json();

  // Normalize 'in_progress' to 'processing' for consistency
  let normalizedStatus = data.status;
  if (normalizedStatus === 'in_progress') {
    normalizedStatus = 'processing';
  }

  return {
    status: normalizedStatus,
    videoUrl: data.video_url,
    error: data.error?.message,
  };
}

/**
 * Wait for Sora job completion (sync mode)
 * Returns when job is completed - we use /content endpoint for download, not video_url
 */
async function waitForSoraCompletion(
  jobId: string,
  openaiApiKey: string,
  maxWaitMs: number = 600000 // 10 minutes
): Promise<void> {
  const startTime = Date.now();
  const pollIntervalMs = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const result = await pollSoraStatus(jobId, openaiApiKey);

    logStep(`Polling Sora job ${jobId}`, { status: result.status });

    if (result.status === 'completed') {
      return; // Job complete - caller will use /content endpoint to download
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Sora video generation failed');
    }
  }

  throw new Error('Sora video generation timed out');
}

/**
 * Download video from Sora /content endpoint and upload to Supabase Storage
 * The /content endpoint requires authentication with the OpenAI API key
 */
async function uploadVideoToStorage(
  supabaseClient: any,
  jobId: string,
  userId: string,
  companyId: string,
  model: string,
  openaiApiKey: string
): Promise<{ publicUrl: string; storagePath: string; fileSize: number }> {
  // Use the /content endpoint which requires authentication
  const contentUrl = `https://api.openai.com/v1/videos/${jobId}/content`;
  logStep('Downloading video from Sora /content endpoint', { jobId });

  // Download video with authentication
  const response = await fetch(contentUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    logStep('Video download failed', { status: response.status, error: errorText });
    throw new Error(`Failed to download video: ${response.status} - ${errorText}`);
  }

  const videoBlob = await response.blob();
  const fileSize = videoBlob.size;

  logStep('Video downloaded', { sizeBytes: fileSize });

  // Create storage path
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().substring(0, 8);
  const storagePath = `${userId}/${companyId}/${timestamp}_${model}_${randomId}.mp4`;

  // Upload to Supabase Storage
  const { data, error } = await supabaseClient.storage
    .from('media-studio-videos')
    .upload(storagePath, videoBlob, {
      contentType: 'video/mp4',
      upsert: false
    });

  if (error) {
    logStep('Storage upload error', { error: error.message });
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseClient.storage
    .from('media-studio-videos')
    .getPublicUrl(storagePath);

  logStep('Video uploaded to storage', { storagePath, publicUrl });

  return { publicUrl, storagePath, fileSize };
}

/**
 * Save video record to database
 */
async function saveVideoMediaRecord(
  supabaseClient: any,
  userId: string,
  companyId: string,
  storagePath: string,
  publicUrl: string,
  fileSize: number,
  request: SoraVideoRequest,
  soraVideoId?: string
): Promise<void> {
  logStep('Saving video media record');

  const timestamp = Date.now();
  const fileName = `sora_${timestamp}.mp4`;

  // Build notes with Sora-specific metadata
  let notes = `Sora Mode: ${request.mode}`;
  if (soraVideoId) notes += ` | Sora ID: ${soraVideoId}`;
  if (request.input_reference_url) notes += ` | Has input reference`;

  const mediaRecord = {
    user_id: userId,
    company_id: companyId === 'default' ? null : companyId,
    file_name: fileName,
    file_type: 'video',
    file_format: 'mp4',
    file_size: fileSize,
    storage_path: storagePath,
    public_url: publicUrl,
    thumbnail_url: publicUrl,
    prompt: request.prompt,
    model_used: request.model,
    aspect_ratio: request.size.includes('1280x720') || request.size.includes('1792x1024') ? '16:9' : '9:16',
    quality: request.size,
    duration: request.seconds,
    reference_image_url: request.input_reference_url || null,
    tags: ['sora', request.mode],
    is_favorite: false,
    custom_title: null,
    notes: notes,
    download_count: 0,
    view_count: 0,
  };

  const { error } = await supabaseClient
    .from('media_files')
    .insert([mediaRecord]);

  if (error) {
    logStep('Database insert error', { error: error.message });
    console.error('Failed to save video media record:', error);
  } else {
    logStep('Video media record saved');
  }
}

// Main handler
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    // Parse request
    const request: SoraVideoRequest = await req.json();

    // Validate required fields
    if (!request.prompt || !request.model || !request.mode || !request.size || !request.seconds) {
      throw new Error("Missing required fields: prompt, model, mode, size, seconds");
    }

    // Validate model
    if (!MODEL_SPECS[request.model]) {
      throw new Error(`Invalid model. Supported: ${Object.keys(MODEL_SPECS).join(', ')}`);
    }

    // Validate size based on model (Sora 2 Pro has more options)
    const modelSpec = MODEL_SPECS[request.model];
    if (!modelSpec.validSizes.includes(request.size)) {
      throw new Error(`Invalid size for ${request.model}. Supported: ${modelSpec.validSizes.join(', ')}`);
    }

    // Validate duration
    if (!modelSpec.validDurations.includes(request.seconds)) {
      throw new Error(`Duration must be one of ${modelSpec.validDurations.join(', ')} seconds`);
    }

    // Validate mode-specific requirements
    if (request.mode === 'image-to-video' && !request.input_reference_url) {
      throw new Error("input_reference_url is required for image-to-video mode");
    }

    if (request.mode === 'remix' && !request.remix_video_id) {
      throw new Error("remix_video_id is required for remix mode");
    }

    logStep("Request validated", {
      model: request.model,
      mode: request.mode,
      size: request.size,
      seconds: request.seconds,
      asyncMode: request.async_mode || false,
    });

    // Start generation
    const { jobId } = await startSoraGeneration(request, openaiApiKey);

    // ASYNC MODE: Return immediately with job ID for client-side polling
    if (request.async_mode) {
      logStep("Returning async operation for frontend polling");

      // Store pending job in database for recovery if frontend stops polling
      try {
        const { error: pendingJobError } = await supabaseClient
          .from('pending_video_jobs')
          .insert({
            user_id: user.id,
            company_id: request.company_id || null,
            operation_name: jobId,
            model: request.model,
            mode: request.mode,
            prompt: request.prompt,
            size: request.size,
            seconds: request.seconds,
            input_reference_url: request.input_reference_url || null,
            status: 'pending',
          });

        if (pendingJobError) {
          logStep('Warning: Failed to store pending job record', { error: pendingJobError.message });
          // Continue anyway - this is not critical for generation
        } else {
          logStep('Pending job record created for recovery', { jobId });
        }
      } catch (pendingError) {
        logStep('Warning: Exception storing pending job', { error: String(pendingError) });
        // Continue anyway
      }

      const response: SoraVideoResponse = {
        success: true,
        status: "processing",
        operation_name: jobId,
        model: request.model,
        request_data: {
          user_id: user.id,
          company_id: request.company_id,
          prompt: request.prompt,
          size: request.size,
          seconds: request.seconds,
          mode: request.mode,
        },
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // SYNC MODE: Wait for completion (may timeout for long videos)
    await waitForSoraCompletion(jobId, openaiApiKey);

    // Upload to Supabase Storage using /content endpoint
    const { publicUrl, storagePath, fileSize } = await uploadVideoToStorage(
      supabaseClient,
      jobId,  // Pass jobId - the function uses /content endpoint
      user.id,
      request.company_id || 'default',
      request.model,
      openaiApiKey
    );

    // Save to database
    await saveVideoMediaRecord(
      supabaseClient,
      user.id,
      request.company_id || 'default',
      storagePath,
      publicUrl,
      fileSize,
      request,
      jobId
    );

    // Return success response
    const response: SoraVideoResponse = {
      success: true,
      status: "completed",
      video_url: publicUrl,
      thumbnail_url: publicUrl,
      storage_path: storagePath,
      sora_video_id: jobId,
      metadata: {
        model: request.model,
        mode: request.mode,
        prompt: request.prompt,
        size: request.size,
        seconds: request.seconds,
      },
    };

    logStep("Generation completed successfully");

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(JSON.stringify({
      success: false,
      status: "error",
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
