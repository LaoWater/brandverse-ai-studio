
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

 * The flow is: GCS Download (Stream) -> Uint8Array -> Supabase Storage Upload (Binary).
 * Only re-introduce Base64 if absolutely necessary for a text-only transport layer,
 * and be aware of the severe performance penalty.
 */

 * ARCHITECTURE TODO:
 * Currently, we perform a "Double Hop" (GCS -> Edge -> Supabase).
 * This is viable for files < 20MB.
 * For production scaling or larger files:
 * 1. Store only the GCS URI in the database.
 * 2. Serve videos directly from GCS to the frontend using "Signed URLs".
 * 3. This avoids Edge Function memory limits and double-bandwidth costs.
 */

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

// Helper to import PKCS8 private key for JWT signing
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Remove PEM header/footer and decode base64
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

// Helper to create base64url encoding
function base64url(input: ArrayBuffer | string): string {
  const base64 = typeof input === 'string'
    ? btoa(input)
    : btoa(String.fromCharCode(...new Uint8Array(input)));

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper to get OAuth access token from service account
async function getAccessToken(): Promise<string> {
  const serviceAccountKey = Deno.env.get("GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY");

  if (!serviceAccountKey) {
    throw new Error(
      "GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY not configured.\n\n" +
      "Please set up a service account:\n" +
      "1. Download service account JSON from Google Cloud Console\n" +
      "2. Set secret: supabase secrets set GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=\"$(cat key.json)\"\n\n" +
      "See VEO_SETUP_INSTRUCTIONS.md for details."
    );
  }

  try {
    const credentials = JSON.parse(serviceAccountKey);

    // Create JWT header and payload
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };

    // Encode header and payload
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    // Import private key and sign
    const privateKey = await importPrivateKey(credentials.private_key);
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      encoder.encode(unsignedToken)
    );

    const signedToken = `${unsignedToken}.${base64url(signature)}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signedToken
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error: any) {
    logStep("OAuth token error", { error: error.message });
    throw new Error(`Failed to authenticate with Google Cloud: ${error.message}`);
  }
}

// Generate video using Google Veo 3.1 (Vertex AI)
async function generateVideoWithVeo(request: VideoGenerationRequest): Promise<Blob> {
  // Use existing project configuration
  const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID") || "creators-multi-verse";
  // Veo is available in us-central1 (primary AI region)
  const location = "us-central1";
  const gcsBucket = Deno.env.get("GCS_BUCKET_NAME") || "creatorsm-media-bucket";

  logStep("Generating with Veo", {
    model: request.model,
    mode: request.mode,
    prompt: request.prompt.substring(0, 50),
    aspectRatio: request.aspect_ratio,
    duration: request.duration,
    projectId,
    location
  });

  // Get OAuth access token
  const accessToken = await getAccessToken();

  // Veo uses predictLongRunning endpoint (long-running operation)
  const modelId = request.model;
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`;

  // GCS path for output video
  const timestamp = Date.now();
  const outputPath = `gs://${gcsBucket}/veo-videos/${request.user_id}/${timestamp}/`;

  // Build instances and parameters based on generation mode
  let instances: any[] = [];
  let parameters: any = {
    storageUri: outputPath,
    sampleCount: 1,
    durationSeconds: request.duration,
    aspectRatio: request.aspect_ratio,
    personGeneration: "allow_adult",
  };

  switch (request.mode) {
    case 'text-to-video': {
      // Simple text-to-video generation
      instances = [{
        prompt: request.prompt,
      }];
      break;
    }

    case 'image-to-video': {
      // Image-to-video: animate a single input image
      if (!request.input_image_url) {
        throw new Error("input_image_url is required for image-to-video mode");
      }

      const { data, mimeType } = await fetchImageAsBase64(request.input_image_url);

      instances = [{
        prompt: request.prompt,
        image: {
          bytesBase64Encoded: data,
          mimeType: mimeType
        }
      }];
      parameters.resizeMode = "pad";
      break;
    }

    case 'keyframe-to-video': {
      // Keyframe interpolation: extend video from last frame
      // Note: Veo API uses video extension, not dual keyframes
      // We'll use the first image as a static video and last frame as target
      if (!request.first_frame_url || !request.last_frame_url) {
        throw new Error("first_frame_url and last_frame_url are required for keyframe-to-video mode");
      }

      const lastFrame = await fetchImageAsBase64(request.last_frame_url);

      // For now, use image-to-video with the last frame
      // (True keyframe interpolation requires existing video + target frame)
      instances = [{
        prompt: request.prompt,
        image: {
          bytesBase64Encoded: lastFrame.data,
          mimeType: lastFrame.mimeType
        }
      }];
      parameters.resizeMode = "pad";
      break;
    }

    default:
      throw new Error(`Unsupported video generation mode: ${request.mode}`);
  }

  const payload = {
    instances,
    parameters
  };

  logStep("Veo API Payload", {
    endpoint,
    mode: request.mode,
    outputPath,
    hasInstances: instances.length > 0
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
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

  // Poll the operation until it completes
  // Video generation takes time (30-60s). We must poll the API to check status.
  // We use a 10s interval to minimize CPU usage from repeated network requests.
  const maxPolls = 60; 
  const pollInterval = 10000; // 10 seconds

  for (let i = 0; i < maxPolls; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    // Use the :fetchPredictOperation endpoint (POST, not GET)
    const fetchOpUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;

    logStep(`Polling operation attempt ${i + 1}`, { fetchOpUrl });

    const pollResponse = await fetch(fetchOpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operationName: operationName
      })
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

      // Get the GCS URI from the response
      let gcsUri = pollData.response?.generatedSamples?.[0]?.video?.gcsUri ||
                   pollData.response?.generatedSamples?.[0]?.videoUri ||
                   pollData.response?.videos?.[0]?.uri ||
                   pollData.response?.videoUri;

      // Fallback: search recursively for a string starting with gs://
      if (!gcsUri && pollData.response) {
        const findGsUri = (obj: any): string | null => {
          if (typeof obj === 'string' && obj.startsWith('gs://')) return obj;
          if (typeof obj === 'object' && obj !== null) {
            for (const key of Object.keys(obj)) {
              const result = findGsUri(obj[key]);
              if (result) return result;
            }
          }
          return null;
        };
        gcsUri = findGsUri(pollData.response);
      }

      if (!gcsUri) {
        logStep("No GCS URI in response", { response: pollData.response });
        throw new Error("Video generation completed but no GCS URI found. Check logs for response structure.");
      }

      logStep("Video saved to GCS", { gcsUri });

      // Download video from GCS using the authenticated API
      // Format: gs://bucket-name/path/to/object
      // We need: path/to/object (URL encoded)
      const bucketPath = gcsUri.replace(`gs://${gcsBucket}/`, '');
      const encodedPath = encodeURIComponent(bucketPath);
      const videoStorageApiUrl = `https://storage.googleapis.com/storage/v1/b/${gcsBucket}/o/${encodedPath}?alt=media`;

      logStep("Downloading video from GCS", { 
        bucket: gcsBucket,
        path: bucketPath
      });

      const videoResponse = await fetch(videoStorageApiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!videoResponse.ok) {
        const errText = await videoResponse.text();
        throw new Error(`Failed to download video from GCS: ${videoResponse.status} - ${errText}`);
      }

      const videoBlob = await videoResponse.blob();

      logStep("Video downloaded successfully", {
        sizeBytes: videoBlob.size,
        type: videoBlob.type
      });

      return videoBlob;
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
  videoData: Blob,
  userId: string,
  companyId: string,
  model: string
): Promise<{ publicUrl: string; storagePath: string }> {
  logStep("Uploading video to Supabase Storage");

  // Create storage path
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().substring(0, 8);
  const storagePath = `${userId}/${companyId}/${timestamp}_${model}_${randomId}.mp4`;

  // Upload to media-studio-videos bucket
  const { data, error } = await supabaseClient.storage
    .from('media-studio-videos')
    .upload(storagePath, videoData, {
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
    const videoData = await generateVideoWithVeo(request);

    // Upload to storage
    const { publicUrl, storagePath } = await uploadVideoToStorage(
      supabaseClient,
      videoData,
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
