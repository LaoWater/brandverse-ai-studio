
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-MEDIA-VIDEO] ${step}${detailsStr}`);
};

// Type definitions for API payloads
interface VideoGenerationRequest {
  prompt: string;
  model: 'veo-3.1-generate-001' | 'veo-3.1-fast-generate-001';
  mode: 'text-to-video' | 'image-to-video' | 'keyframe-to-video';
  aspect_ratio: '16:9' | '9:16' | '1:1';
  duration: 8; // Veo 3.1 supports 8-second clips
  fps?: 24 | 30; // 24fps or 30fps (default: 24)

  // For image-to-video mode
  input_image_url?: string;

  // For keyframe-to-video mode
  first_frame_url?: string;
  last_frame_url?: string;

  user_id?: string;
  company_id?: string;
}

interface VideoGenerationResponse {
  success: boolean;
  video_url: string;
  thumbnail_url?: string;
  storage_path: string;
  metadata: {
    model: string;
    mode: string;
    prompt: string;
    aspect_ratio: string;
    duration: number;
    fps: number;
  };
  error?: string;
}

// Helper to fetch and convert image to base64
async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
  logStep("Fetching image", { url: imageUrl });

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Use Deno's standard library base64 encoding
    const base64 = base64Encode(bytes);
    const mimeType = blob.type || 'image/png';

    logStep("Image fetched", {
      size: arrayBuffer.byteLength,
      mimeType
    });

    return { data: base64, mimeType };
  } catch (error: any) {
    logStep("Error fetching image", { error: error?.message });
    throw new Error(`Failed to fetch image: ${error?.message || error}`);
  }
}


// Generate video using Google Veo 3.1 (Gemini API - NOT Vertex AI!)
async function generateVideoWithVeo(request: VideoGenerationRequest): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

  logStep("Generating with Veo via Gemini API", {
    model: request.model,
    mode: request.mode,
    prompt: request.prompt.substring(0, 50),
    aspectRatio: request.aspect_ratio,
    duration: request.duration
  });

  // Gemini API endpoint for Veo
  const modelId = request.model;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning`;

  // Build request payload
  let instance: any = {
    prompt: request.prompt,
  };

  // Add image if needed
  if (request.mode === 'image-to-video' && request.input_image_url) {
    const { data, mimeType } = await fetchImageAsBase64(request.input_image_url);
    instance.image = {
      bytesBase64Encoded: data,
      mimeType: mimeType
    };
  } else if (request.mode === 'keyframe-to-video') {
    if (request.first_frame_url && request.last_frame_url) {
      const firstFrame = await fetchImageAsBase64(request.first_frame_url);
      const lastFrame = await fetchImageAsBase64(request.last_frame_url);
      instance.firstImage = {
        bytesBase64Encoded: firstFrame.data,
        mimeType: firstFrame.mimeType
      };
      instance.lastImage = {
        bytesBase64Encoded: lastFrame.data,
        mimeType: lastFrame.mimeType
      };
    }
  }

  const payload = {
    instances: [instance]
  };

  logStep("Gemini API Payload", { endpoint, mode: request.mode });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    logStep("Veo API Error", { status: response.status, error });
    throw new Error(`Veo API error: ${error}`);
  }

  const data = await response.json();

  // PredictLongRunning returns an operation object
  if (!data.name) {
    logStep("No operation name in response", { response: JSON.stringify(data, null, 2) });
    throw new Error("Invalid Veo API response: no operation name");
  }

  const operationName = data.name;
  logStep("Long-running operation started", { operationName });

  // Poll the operation until it completes (Gemini API)
  const maxPolls = 60; // 5 minutes max (10 seconds * 60)
  const pollInterval = 10000; // 10 seconds (recommended by docs)

  for (let i = 0; i < maxPolls; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    // Gemini API polling endpoint
    const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}`;

    logStep(`Polling operation attempt ${i + 1}`, { pollUrl });

    const pollResponse = await fetch(pollUrl, {
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!pollResponse.ok) {
      const errorBody = await pollResponse.text();
      logStep("Poll error details", {
        status: pollResponse.status,
        error: errorBody
      });
      throw new Error(`Failed to poll operation: ${pollResponse.status} - ${errorBody}`);
    }

    const pollData = await pollResponse.json();

    if (pollData.done) {
      logStep("Operation completed", { pollData });

      // Check for errors
      if (pollData.error) {
        throw new Error(`Veo generation failed: ${JSON.stringify(pollData.error)}`);
      }

      // Gemini API returns video data directly in the response
      // The response structure is: response.predictions[0].bytesBase64Encoded
      // OR response.generatedSamples[0].video.bytesBase64Encoded
      const videoBase64 =
        pollData.response?.predictions?.[0]?.bytesBase64Encoded ||
        pollData.response?.generatedSamples?.[0]?.video?.bytesBase64Encoded;

      if (!videoBase64) {
        logStep("No video data in response", {
          response: JSON.stringify(pollData.response, null, 2)
        });
        throw new Error("Video generation completed but no video data found in response");
      }

      logStep("Video data received from Gemini API", {
        sizeBytes: videoBase64.length
      });

      return `data:video/mp4;base64,${videoBase64}`;
    }

    logStep(`Polling operation (${i + 1}/${maxPolls})`, {
      done: pollData.done,
      metadata: pollData.metadata
    });
  }

  throw new Error("Video generation timed out after 5 minutes");
}

// Upload video to Supabase Storage
async function uploadVideoToStorage(
  supabaseClient: any,
  videoDataUrl: string,
  userId: string,
  companyId: string,
  model: string
): Promise<{ publicUrl: string; storagePath: string }> {
  logStep("Uploading video to Supabase Storage");

  // Convert data URL to blob
  const base64Data = videoDataUrl.split(',')[1];
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  // Create storage path
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().substring(0, 8);
  const storagePath = `${userId}/${companyId}/${timestamp}_${model}_${randomId}.mp4`;

  // Upload to media-studio-videos bucket
  const { data, error } = await supabaseClient.storage
    .from('media-studio-videos')
    .upload(storagePath, binaryData, {
      contentType: 'video/mp4',
      upsert: false
    });

  if (error) {
    logStep("Storage upload error", { error });
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseClient.storage
    .from('media-studio-videos')
    .getPublicUrl(storagePath);

  logStep("Video uploaded successfully", { storagePath, publicUrl });

  return { publicUrl, storagePath };
}

// Main handler
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // Use service role for storage
  );

  try {
    logStep("Function started");

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
    const request: VideoGenerationRequest = await req.json();

    // Validate required fields
    if (!request.prompt || !request.model || !request.mode || !request.aspect_ratio) {
      throw new Error("Missing required fields: prompt, model, mode, aspect_ratio");
    }

    // Validate mode-specific requirements
    if (request.mode === 'image-to-video' && !request.input_image_url) {
      throw new Error("input_image_url is required for image-to-video mode");
    }

    if (request.mode === 'keyframe-to-video' && (!request.first_frame_url || !request.last_frame_url)) {
      throw new Error("first_frame_url and last_frame_url are required for keyframe-to-video mode");
    }

    logStep("Request validated", {
      model: request.model,
      mode: request.mode,
      aspectRatio: request.aspect_ratio,
      duration: request.duration
    });

    // Generate video
    const videoDataUrl = await generateVideoWithVeo(request);

    // Upload to storage
    const { publicUrl, storagePath } = await uploadVideoToStorage(
      supabaseClient,
      videoDataUrl,
      user.id,
      request.company_id || 'default',
      request.model
    );

    // Prepare response
    const response: VideoGenerationResponse = {
      success: true,
      video_url: publicUrl,
      thumbnail_url: publicUrl, // TODO: Generate thumbnail from first frame
      storage_path: storagePath,
      metadata: {
        model: request.model,
        mode: request.mode,
        prompt: request.prompt,
        aspect_ratio: request.aspect_ratio,
        duration: request.duration,
        fps: request.fps || 24,
      }
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
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
