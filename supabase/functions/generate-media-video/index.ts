
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

//  * The flow is: GCS Download (Stream) -> Uint8Array -> Supabase Storage Upload (Binary).
//  * Only re-introduce Base64 if absolutely necessary for a text-only transport layer,
//  * and be aware of the severe performance penalty.
//  */

//  * ARCHITECTURE TODO:
//  * Currently, we perform a "Double Hop" (GCS -> Edge -> Supabase).
//  * This is viable for files < 20MB.
//  * For production scaling or larger files:
//  * 1. Store only the GCS URI in the database.
//  * 2. Serve videos directly from GCS to the frontend using "Signed URLs".
//  * 3. This avoids Edge Function memory limits and double-bandwidth costs.
//  */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-MEDIA-VIDEO] ${step}${detailsStr}`);
};

// Type definitions for API payloads
// Based on official Veo 3.1 API: https://ai.google.dev/gemini-api/docs/video
interface VideoGenerationRequest {
  prompt: string;
  model: 'veo-3.1-generate-001' | 'veo-3.1-fast-generate-001';
  mode: 'text-to-video' | 'image-to-video' | 'interpolation' | 'extend-video';

  // Core parameters (official Veo 3.1)
  aspect_ratio: '16:9' | '9:16'; // Only these two supported by Veo 3.1
  duration: 4 | 6 | 8; // 8s required for 1080p/4k, reference images, or extension
  resolution?: '720p' | '1080p' | '4k'; // 1080p/4k only with 8s duration; 720p ONLY for extension

  // Content control
  negative_prompt?: string; // Describes what NOT to include in the video
  generate_audio?: boolean; // Generate audio with video (default: true)
  person_generation?: 'allow_all' | 'allow_adult'; // Controls people generation

  // For image-to-video mode (animate a single image)
  // Maps to API: "image" parameter
  input_image_url?: string;

  // For interpolation mode (transition between two images)
  // Official API naming: "image" (start) + "lastFrame" (end)
  image_url?: string;        // Starting image (maps to API "image" param) - preferred
  first_frame_url?: string;  // Alias for image_url (backwards compatibility)
  last_frame_url?: string;   // Ending image (maps to API "lastFrame" param)

  // Reference images for style/content guidance (Veo 3.1 exclusive - up to 3)
  reference_image_urls?: string[];

  // For extend-video mode (Veo 3.1 exclusive)
  // Extends a previously generated Veo video by ~7 seconds
  // Requirements: 720p only, 8s duration, video must be <2 days old, max 141s input -> 148s output
  source_video_gcs_uri?: string; // GCS URI of the Veo-generated video to extend

  // Tracking
  user_id?: string;
  company_id?: string;
}

interface VideoGenerationResponse {
  success: boolean;
  video_url: string;
  thumbnail_url?: string;
  storage_path: string;
  // GCS URI for video extension feature - store this to enable "extend video" later
  // Videos can be extended within 2 days of generation
  gcs_uri?: string;
  metadata: {
    model: string;
    mode: string;
    prompt: string;
    aspect_ratio: string;
    resolution: string;
    duration: number;
    negative_prompt?: string;
    has_reference_images: boolean;
    is_extension?: boolean; // True if this video was created by extending another
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

// Result from video generation - includes GCS URI for extension capability
interface VeoGenerationResult {
  videoBlob: Blob;
  gcsUri: string; // Store this to enable video extension later (valid for 2 days)
}

// Generate video using Google Veo 3.1 (Vertex AI)
// Official docs: https://ai.google.dev/gemini-api/docs/video
async function generateVideoWithVeo(request: VideoGenerationRequest): Promise<VeoGenerationResult> {
  // Use existing project configuration
  const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID") || "creators-multi-verse";
  // Veo is available in us-central1 (primary AI region)
  const location = "us-central1";
  const gcsBucket = Deno.env.get("GCS_BUCKET_NAME") || "creatorsm-media-bucket";

  // Determine resolution (default 720p)
  const resolution = request.resolution || '720p';

  // Validate Veo 3.1 constraints
  const hasReferenceImages = request.reference_image_urls && request.reference_image_urls.length > 0;
  const isHighRes = resolution === '1080p' || resolution === '4k';
  const isImageMode = request.mode === 'image-to-video' || request.mode === 'interpolation';

  // Constraint: 1080p/4k and reference images require 8s duration
  if ((isHighRes || hasReferenceImages) && request.duration !== 8) {
    logStep("Duration constraint violation", {
      resolution,
      hasReferenceImages,
      duration: request.duration,
    });
    throw new Error(`Duration must be 8 seconds when using ${isHighRes ? resolution : 'reference images'}`);
  }

  // Constraint: reference images limit (max 3 for Veo 3.1)
  if (hasReferenceImages && request.reference_image_urls!.length > 3) {
    throw new Error("Veo 3.1 supports a maximum of 3 reference images");
  }

  // Determine personGeneration based on mode
  // Text-to-video: allow_all, Image modes: allow_adult
  const personGeneration = request.person_generation ||
    (isImageMode ? 'allow_adult' : 'allow_all');

  logStep("Generating with Veo 3.1", {
    model: request.model,
    mode: request.mode,
    prompt: request.prompt.substring(0, 50),
    negativePrompt: request.negative_prompt?.substring(0, 30),
    aspectRatio: request.aspect_ratio,
    resolution,
    duration: request.duration,
    generateAudio: request.generate_audio ?? true,
    hasReferenceImages,
    referenceImageCount: request.reference_image_urls?.length || 0,
    personGeneration,
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
    resolution: resolution, // Official Veo 3.1 param: 720p, 1080p, 4k
    personGeneration: personGeneration,
    generateAudio: request.generate_audio ?? true,
  };

  // Add negative prompt if provided (official Veo 3.1 param)
  if (request.negative_prompt) {
    parameters.negativePrompt = request.negative_prompt;
  }

  switch (request.mode) {
    case 'text-to-video': {
      // Simple text-to-video generation
      const instance: any = {
        prompt: request.prompt,
      };

      // Add reference images if provided (Veo 3.1 exclusive feature)
      if (hasReferenceImages) {
        const referenceImages = [];
        for (const url of request.reference_image_urls!) {
          const { data, mimeType } = await fetchImageAsBase64(url);
          referenceImages.push({
            referenceImage: {
              bytesBase64Encoded: data,
              mimeType: mimeType
            },
            referenceType: "REFERENCE_TYPE_STYLE" // Can also be REFERENCE_TYPE_SUBJECT
          });
        }
        instance.referenceImages = referenceImages;
      }

      instances = [instance];
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

    case 'interpolation': {
      // Interpolation: smooth transition between two images
      // Official Veo 3.1 API: "image" (start) + "lastFrame" (end)
      // We accept either image_url or first_frame_url for backwards compatibility
      const startImageUrl = request.image_url || request.first_frame_url;
      if (!startImageUrl || !request.last_frame_url) {
        throw new Error("image_url (or first_frame_url) and last_frame_url are required for interpolation mode");
      }

      const [startImage, endImage] = await Promise.all([
        fetchImageAsBase64(startImageUrl),
        fetchImageAsBase64(request.last_frame_url)
      ]);

      // Official API structure: image + lastFrame
      instances = [{
        prompt: request.prompt,
        image: {
          bytesBase64Encoded: startImage.data,
          mimeType: startImage.mimeType
        },
        lastFrame: {
          bytesBase64Encoded: endImage.data,
          mimeType: endImage.mimeType
        }
      }];
      parameters.resizeMode = "pad";
      break;
    }

    case 'extend-video': {
      // Video Extension: Continue a previously generated Veo video
      // Official Veo 3.1 feature - extends by ~7 seconds (up to 20 times)
      // Requirements:
      // - source_video_gcs_uri: GCS URI of a Veo-generated video
      // - Resolution: 720p ONLY
      // - Duration: 8s ONLY
      // - Video age: must be < 2 days old
      // - Max input length: 141 seconds -> output 148 seconds
      if (!request.source_video_gcs_uri) {
        throw new Error("source_video_gcs_uri is required for extend-video mode");
      }

      // Validate extension constraints
      if (resolution !== '720p') {
        throw new Error("Video extension only supports 720p resolution");
      }
      if (request.duration !== 8) {
        throw new Error("Video extension requires 8 second duration");
      }

      logStep("Extending video", {
        sourceUri: request.source_video_gcs_uri,
        prompt: request.prompt.substring(0, 50)
      });

      // For video extension, we pass the video object with the GCS URI
      instances = [{
        prompt: request.prompt,
        video: {
          gcsUri: request.source_video_gcs_uri
        }
      }];
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
    hasInstances: instances.length > 0,
    parameters: parameters
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
        // Parse Google API error codes into user-friendly messages
        const errorCode = pollData.error.code;
        const operationId = pollData.error.message?.match(/Operation ID: ([\w-]+)/)?.[1];

        const userFriendlyErrors: Record<number, { title: string; message: string; suggestion: string }> = {
          // CANCELLED
          1: {
            title: "Generation Cancelled",
            message: "The video generation was cancelled.",
            suggestion: "Please try again when ready."
          },
          // UNKNOWN
          2: {
            title: "Unknown Error",
            message: "An unexpected error occurred while generating your video.",
            suggestion: "Please try again. If the problem persists, try with a different prompt."
          },
          // INVALID_ARGUMENT
          3: {
            title: "Invalid Request",
            message: "There was an issue with the generation parameters.",
            suggestion: "Try adjusting your prompt or settings and try again."
          },
          // DEADLINE_EXCEEDED
          4: {
            title: "Request Timeout",
            message: "The video generation took too long to complete.",
            suggestion: "Please try again. Consider using a shorter duration or simpler prompt."
          },
          // NOT_FOUND
          5: {
            title: "Resource Not Found",
            message: "A required resource could not be found.",
            suggestion: "Please try again with a different input image or prompt."
          },
          // PERMISSION_DENIED
          7: {
            title: "Access Denied",
            message: "Unable to access the video generation service.",
            suggestion: "Please contact support if this problem continues."
          },
          // RESOURCE_EXHAUSTED
          8: {
            title: "Service Busy",
            message: "The video generation service is currently at capacity.",
            suggestion: "Please wait a few minutes and try again."
          },
          // FAILED_PRECONDITION
          9: {
            title: "Unable to Process",
            message: "The request could not be processed in its current state.",
            suggestion: "Try with a different image or prompt."
          },
          // ABORTED
          10: {
            title: "Generation Aborted",
            message: "The video generation was interrupted.",
            suggestion: "Please try again."
          },
          // INTERNAL
          13: {
            title: "Service Temporarily Unavailable",
            message: "Google's video generation service encountered a temporary issue.",
            suggestion: "This is usually resolved within a few minutes. Please try again shortly."
          },
          // UNAVAILABLE
          14: {
            title: "Service Unavailable",
            message: "The video generation service is temporarily unavailable.",
            suggestion: "Please wait a few minutes and try again."
          },
          // DATA_LOSS
          15: {
            title: "Processing Error",
            message: "An error occurred while processing your video.",
            suggestion: "Please try again with a different prompt or settings."
          }
        };

        const errorInfo = userFriendlyErrors[errorCode] || {
          title: "Generation Failed",
          message: "An unexpected error occurred.",
          suggestion: "Please try again. If the problem persists, try a different prompt."
        };

        // Create structured error for frontend
        const structuredError = {
          type: "GOOGLE_API_ERROR",
          code: errorCode,
          title: errorInfo.title,
          message: errorInfo.message,
          suggestion: errorInfo.suggestion,
          operationId: operationId,
          retryable: [4, 8, 13, 14].includes(errorCode) // These are typically transient
        };

        logStep("Veo generation error (parsed)", structuredError);
        throw new Error(JSON.stringify(structuredError));
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
        type: videoBlob.type,
        gcsUri: gcsUri // Log for debugging
      });

      // Return both blob and GCS URI (for video extension feature)
      return {
        videoBlob,
        gcsUri // Store this to enable extending this video later (valid for 2 days)
      };
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
): Promise<{ publicUrl: string; storagePath: string; fileSize: number }> {
  logStep("Uploading video to Supabase Storage");

  const fileSize = videoData.size;

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

  return { publicUrl, storagePath, fileSize };
}

// Save video media record to database
async function saveVideoMediaRecord(
  supabaseClient: any,
  userId: string,
  companyId: string,
  storagePath: string,
  publicUrl: string,
  fileSize: number,
  prompt: string,
  model: string,
  mode: string,
  aspectRatio: string,
  resolution: string,
  duration: number,
  negativePrompt?: string,
  inputImageUrl?: string,
  gcsUri?: string // GCS URI for video extension feature (valid for 2 days)
): Promise<void> {
  logStep("Saving video media record to database");

  const timestamp = Date.now();
  const fileName = `generated_${timestamp}.mp4`;

  // Build notes with metadata for extension feature
  let notes = `Mode: ${mode}`;
  if (negativePrompt) notes += ` | Negative: ${negativePrompt}`;
  if (gcsUri) notes += ` | GCS: ${gcsUri}`; // Store GCS URI in notes for extension capability

  const mediaRecord = {
    user_id: userId,
    company_id: companyId === 'default' ? null : companyId,
    file_name: fileName,
    file_type: 'video',
    file_format: 'mp4',
    file_size: fileSize,
    storage_path: storagePath,
    public_url: publicUrl,
    thumbnail_url: publicUrl, // Use same URL for thumbnail (can generate proper thumbnail later)
    prompt: prompt,
    model_used: model,
    aspect_ratio: aspectRatio,
    quality: resolution, // Store resolution as quality for videos (720p, 1080p, 4k)
    duration: duration,
    reference_image_url: inputImageUrl || null,
    tags: [],
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
    logStep("Database insert error", { error: error.message });
    // Don't throw - video is already uploaded, just log the error
    // User can still see the video via the returned URL
    console.error("Failed to save video media record:", error);
  } else {
    logStep("Video media record saved successfully");
  }
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

    if (request.mode === 'interpolation') {
      const hasStartImage = request.image_url || request.first_frame_url;
      if (!hasStartImage || !request.last_frame_url) {
        throw new Error("image_url (start image) and last_frame_url (end image) are required for interpolation mode");
      }
    }

    if (request.mode === 'extend-video') {
      if (!request.source_video_gcs_uri) {
        throw new Error("source_video_gcs_uri is required for extend-video mode");
      }
      // Extension only works with 720p and 8s duration
      if (request.resolution && request.resolution !== '720p') {
        throw new Error("Video extension only supports 720p resolution");
      }
      if (request.duration !== 8) {
        throw new Error("Video extension requires 8 second duration");
      }
    }

    // Validate aspect ratio (Veo 3.1 only supports 16:9 and 9:16)
    if (!['16:9', '9:16'].includes(request.aspect_ratio)) {
      throw new Error("Veo 3.1 only supports aspect ratios: 16:9 or 9:16");
    }

    // Validate resolution if provided
    if (request.resolution && !['720p', '1080p', '4k'].includes(request.resolution)) {
      throw new Error("Invalid resolution. Supported: 720p, 1080p, 4k");
    }

    logStep("Request validated", {
      model: request.model,
      mode: request.mode,
      aspectRatio: request.aspect_ratio,
      resolution: request.resolution || '720p',
      duration: request.duration,
      negativePrompt: request.negative_prompt ? 'yes' : 'no',
      referenceImages: request.reference_image_urls?.length || 0,
      generate_audio: request.generate_audio
    });

    // Generate video
    const { videoBlob, gcsUri } = await generateVideoWithVeo(request);

    // Upload to storage
    const { publicUrl, storagePath, fileSize } = await uploadVideoToStorage(
      supabaseClient,
      videoBlob,
      user.id,
      request.company_id || 'default',
      request.model
    );

    // Save video media record to database (so it appears in user's library even if browser crashes)
    const resolution = request.resolution || '720p';
    await saveVideoMediaRecord(
      supabaseClient,
      user.id,
      request.company_id || 'default',
      storagePath,
      publicUrl,
      fileSize,
      request.prompt,
      request.model,
      request.mode,
      request.aspect_ratio,
      resolution,
      request.duration,
      request.negative_prompt,
      request.input_image_url || request.first_frame_url,
      gcsUri // Store GCS URI for video extension feature
    );

    // Prepare response - include GCS URI for video extension capability
    const isExtension = request.mode === 'extend-video';
    const response: VideoGenerationResponse = {
      success: true,
      video_url: publicUrl,
      thumbnail_url: publicUrl, // TODO: Generate thumbnail from first frame
      storage_path: storagePath,
      gcs_uri: gcsUri, // IMPORTANT: Store this to enable "Extend Video" feature (valid for 2 days)
      metadata: {
        model: request.model,
        mode: request.mode,
        prompt: request.prompt,
        aspect_ratio: request.aspect_ratio,
        resolution: resolution,
        duration: request.duration,
        negative_prompt: request.negative_prompt,
        has_reference_images: (request.reference_image_urls?.length || 0) > 0,
        is_extension: isExtension,
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
