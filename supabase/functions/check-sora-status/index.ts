/**
 * Check Sora Video Generation Status
 * ===================================
 *
 * This edge function polls the OpenAI Sora API for video generation status.
 * Called by the frontend during async video generation.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SORA-STATUS] ${step}${detailsStr}`);
};

interface StatusCheckRequest {
  operation_name: string;  // Sora job ID
  model: string;
  user_id: string;
  company_id?: string;
  prompt: string;
  size: string;
  seconds: number;
  mode: string;
  input_reference_url?: string;
}

interface StatusCheckResponse {
  success: boolean;
  status: 'processing' | 'completed' | 'failed' | 'error';
  video_url?: string;
  thumbnail_url?: string;
  storage_path?: string;
  sora_video_id?: string;
  metadata?: any;
  error?: string;
}

/**
 * Download video and upload to Supabase Storage
 */
async function uploadVideoToStorage(
  supabaseClient: any,
  videoUrl: string,
  userId: string,
  companyId: string,
  model: string
): Promise<{ publicUrl: string; storagePath: string; fileSize: number }> {
  logStep('Downloading completed video from Sora');

  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const videoBlob = await response.blob();
  const fileSize = videoBlob.size;

  logStep('Video downloaded', { sizeBytes: fileSize });

  const timestamp = Date.now();
  const randomId = crypto.randomUUID().substring(0, 8);
  const storagePath = `${userId}/${companyId}/${timestamp}_${model}_${randomId}.mp4`;

  const { error } = await supabaseClient.storage
    .from('media-studio-videos')
    .upload(storagePath, videoBlob, {
      contentType: 'video/mp4',
      upsert: false
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabaseClient.storage
    .from('media-studio-videos')
    .getPublicUrl(storagePath);

  logStep('Video uploaded to storage', { storagePath });

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
  request: StatusCheckRequest,
  soraVideoId: string
): Promise<void> {
  const timestamp = Date.now();
  const fileName = `sora_${timestamp}.mp4`;

  let notes = `Sora Mode: ${request.mode}`;
  notes += ` | Sora ID: ${soraVideoId}`;

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
    console.error('Failed to save video media record:', error);
  } else {
    logStep('Video media record saved');
  }
}

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

    // Parse request
    const request: StatusCheckRequest = await req.json();

    if (!request.operation_name) {
      throw new Error("operation_name (job ID) is required");
    }

    const jobId = request.operation_name;

    logStep("Checking Sora job status", { jobId });

    // Poll Sora API for status
    const statusEndpoint = `https://api.openai.com/v1/videos/${jobId}`;

    const statusResponse = await fetch(statusEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`Failed to check Sora status: ${errorText}`);
    }

    const statusData = await statusResponse.json();

    logStep("Sora status response", {
      status: statusData.status,
      hasVideoUrl: !!statusData.video_url,
    });

    // Handle different statuses
    if (statusData.status === 'queued' || statusData.status === 'processing') {
      const response: StatusCheckResponse = {
        success: true,
        status: 'processing',
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (statusData.status === 'failed') {
      const response: StatusCheckResponse = {
        success: false,
        status: 'failed',
        error: statusData.error?.message || 'Sora video generation failed',
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (statusData.status === 'completed' && statusData.video_url) {
      logStep("Video completed, downloading and uploading to storage");

      // Download and upload to our storage
      const { publicUrl, storagePath, fileSize } = await uploadVideoToStorage(
        supabaseClient,
        statusData.video_url,
        request.user_id,
        request.company_id || 'default',
        request.model
      );

      // Save to database
      await saveVideoMediaRecord(
        supabaseClient,
        request.user_id,
        request.company_id || 'default',
        storagePath,
        publicUrl,
        fileSize,
        request,
        jobId
      );

      const response: StatusCheckResponse = {
        success: true,
        status: 'completed',
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
    }

    // Unknown status
    throw new Error(`Unknown Sora status: ${statusData.status}`);

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
