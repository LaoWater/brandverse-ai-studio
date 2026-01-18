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

    const imageBlob = await imageResponse.blob();
    const imageType = imageBlob.type || 'image/jpeg';

    // Determine file extension from mime type
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpeg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const ext = extMap[imageType] || 'jpeg';

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

  return {
    status: data.status,
    videoUrl: data.video_url,
    error: data.error?.message,
  };
}

/**
 * Wait for Sora job completion (sync mode)
 */
async function waitForSoraCompletion(
  jobId: string,
  openaiApiKey: string,
  maxWaitMs: number = 600000 // 10 minutes
): Promise<{ videoUrl: string }> {
  const startTime = Date.now();
  const pollIntervalMs = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const result = await pollSoraStatus(jobId, openaiApiKey);

    logStep(`Polling Sora job ${jobId}`, { status: result.status });

    if (result.status === 'completed' && result.videoUrl) {
      return { videoUrl: result.videoUrl };
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Sora video generation failed');
    }
  }

  throw new Error('Sora video generation timed out');
}

/**
 * Download video from URL and upload to Supabase Storage
 */
async function uploadVideoToStorage(
  supabaseClient: any,
  videoUrl: string,
  userId: string,
  companyId: string,
  model: string
): Promise<{ publicUrl: string; storagePath: string; fileSize: number }> {
  logStep('Downloading video from Sora', { videoUrl: videoUrl.substring(0, 50) + '...' });

  // Download video
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
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
    const { videoUrl } = await waitForSoraCompletion(jobId, openaiApiKey);

    // Upload to Supabase Storage
    const { publicUrl, storagePath, fileSize } = await uploadVideoToStorage(
      supabaseClient,
      videoUrl,
      user.id,
      request.company_id || 'default',
      request.model
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
