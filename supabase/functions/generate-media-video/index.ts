
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

// Generate video using Google Veo 3.1
async function generateVideoWithVeo(request: VideoGenerationRequest): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

  logStep("Generating with Veo 3.1", {
    model: request.model,
    mode: request.mode,
    prompt: request.prompt.substring(0, 50),
    aspectRatio: request.aspect_ratio,
    duration: request.duration
  });

  // Veo 3.1 API endpoint
  const modelId = request.model;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

  // Build the request payload based on generation mode
  let payload: any;

  switch (request.mode) {
    case 'text-to-video': {
      // Simple text-to-video generation
      payload = {
        contents: [{
          parts: [{
            text: request.prompt
          }]
        }],
        generationConfig: {
          responseModalities: ["VIDEO"],
          videoConfig: {
            aspectRatio: request.aspect_ratio,
            duration: `${request.duration}s`,
            fps: request.fps || 24
          }
        }
      };
      break;
    }

    case 'image-to-video': {
      // Image-to-video: generate video from a single input image
      if (!request.input_image_url) {
        throw new Error("input_image_url is required for image-to-video mode");
      }

      const { data, mimeType } = await fetchImageAsBase64(request.input_image_url);

      payload = {
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            },
            {
              text: request.prompt
            }
          ]
        }],
        generationConfig: {
          responseModalities: ["VIDEO"],
          videoConfig: {
            aspectRatio: request.aspect_ratio,
            duration: `${request.duration}s`,
            fps: request.fps || 24
          }
        }
      };
      break;
    }

    case 'keyframe-to-video': {
      // Keyframe-to-video: generate video between first and last frame
      if (!request.first_frame_url || !request.last_frame_url) {
        throw new Error("first_frame_url and last_frame_url are required for keyframe-to-video mode");
      }

      const firstFrame = await fetchImageAsBase64(request.first_frame_url);
      const lastFrame = await fetchImageAsBase64(request.last_frame_url);

      payload = {
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: firstFrame.mimeType,
                data: firstFrame.data
              }
            },
            {
              inlineData: {
                mimeType: lastFrame.mimeType,
                data: lastFrame.data
              }
            },
            {
              text: request.prompt
            }
          ]
        }],
        generationConfig: {
          responseModalities: ["VIDEO"],
          videoConfig: {
            aspectRatio: request.aspect_ratio,
            duration: `${request.duration}s`,
            fps: request.fps || 24
          }
        }
      };
      break;
    }

    default:
      throw new Error(`Unsupported video generation mode: ${request.mode}`);
  }

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

  // Log the FULL response to debug
  logStep("Veo FULL response", { response: JSON.stringify(data, null, 2) });

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No candidates in Veo response");
  }

  const candidate = data.candidates[0];
  logStep("Candidate structure", {
    hasContent: !!candidate.content,
    hasParts: !!candidate.content?.parts,
    partsLength: candidate.content?.parts?.length || 0,
    candidateKeys: Object.keys(candidate)
  });

  // Extract video from response
  const parts = candidate.content?.parts || [];

  if (parts.length === 0) {
    logStep("Empty parts - full candidate", { candidate: JSON.stringify(candidate) });
    throw new Error("No parts in Veo response content");
  }

  // Find the part with inline_data (video)
  const videoPart = parts.find((part: any) => part.inline_data || part.inlineData);

  if (!videoPart) {
    // Check if Veo returned a text response explaining why it couldn't generate
    const textPart = parts.find((part: any) => part.text);

    if (textPart && textPart.text) {
      logStep("Veo returned text instead of video", { text: textPart.text });

      throw new Error(
        `Veo couldn't generate a video. It says: "${textPart.text}"\n\n` +
        `💡 Tip: Try a more descriptive prompt with camera movements and actions (e.g., "Aerial drone shot descending toward a mountain lake at sunrise, smooth and slow")`
      );
    }

    logStep("No video part found", {
      partsStructure: parts.map((p: any) => Object.keys(p))
    });
    throw new Error("No video data in Veo response. Try a more descriptive prompt with camera movements.");
  }

  // Handle both snake_case and camelCase
  const videoData = videoPart.inline_data?.data || videoPart.inlineData?.data;

  if (!videoData) {
    throw new Error("No video data found in response part");
  }

  logStep("Video data extracted successfully", {
    dataLength: videoData.length,
    mimeType: videoPart.inline_data?.mime_type || videoPart.inlineData?.mimeType
  });

  // Return base64-encoded video (will be uploaded to storage)
  return `data:video/mp4;base64,${videoData}`;
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
