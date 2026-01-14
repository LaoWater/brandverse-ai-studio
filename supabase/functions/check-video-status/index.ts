import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-VIDEO-STATUS] ${step}${detailsStr}`);
};

interface StatusRequest {
  operation_name: string;
  model: string;
  user_id: string;
  company_id?: string;
  prompt: string;
  aspect_ratio: string;
  resolution: string;
  duration: number;
  mode: string;
  negative_prompt?: string;
  input_image_url?: string;
}

// Helper to import PKCS8 private key for JWT signing
async function importPrivateKey(pem: string): Promise<CryptoKey> {
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
    throw new Error("GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY not configured.");
  }

  try {
    const credentials = JSON.parse(serviceAccountKey);

    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const privateKey = await importPrivateKey(credentials.private_key);
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      encoder.encode(unsignedToken)
    );

    const signedToken = `${unsignedToken}.${base64url(signature)}`;

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

// Parse Google API error codes into user-friendly messages
function parseGoogleError(errorCode: number, operationId?: string): any {
  const userFriendlyErrors: Record<number, { title: string; message: string; suggestion: string }> = {
    1: {
      title: "Generation Cancelled",
      message: "The video generation was cancelled.",
      suggestion: "Please try again when ready."
    },
    2: {
      title: "Unknown Error",
      message: "An unexpected error occurred while generating your video.",
      suggestion: "Please try again. If the problem persists, try with a different prompt."
    },
    3: {
      title: "Invalid Request",
      message: "There was an issue with the generation parameters.",
      suggestion: "Try adjusting your prompt or settings and try again."
    },
    4: {
      title: "Request Timeout",
      message: "The video generation took too long to complete.",
      suggestion: "Please try again. Consider using a shorter duration or simpler prompt."
    },
    5: {
      title: "Resource Not Found",
      message: "A required resource could not be found.",
      suggestion: "Please try again with a different input image or prompt."
    },
    7: {
      title: "Access Denied",
      message: "Unable to access the video generation service.",
      suggestion: "Please contact support if this problem continues."
    },
    8: {
      title: "Service Busy",
      message: "The video generation service is currently at capacity.",
      suggestion: "Please wait a few minutes and try again."
    },
    9: {
      title: "Unable to Process",
      message: "The request could not be processed in its current state.",
      suggestion: "Try with a different image or prompt."
    },
    10: {
      title: "Generation Aborted",
      message: "The video generation was interrupted.",
      suggestion: "Please try again."
    },
    13: {
      title: "Service Temporarily Unavailable",
      message: "Google's video generation service encountered a temporary issue.",
      suggestion: "This is usually resolved within a few minutes. Please try again shortly."
    },
    14: {
      title: "Service Unavailable",
      message: "The video generation service is temporarily unavailable.",
      suggestion: "Please wait a few minutes and try again."
    },
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

  return {
    type: "GOOGLE_API_ERROR",
    code: errorCode,
    title: errorInfo.title,
    message: errorInfo.message,
    suggestion: errorInfo.suggestion,
    operationId: operationId,
    retryable: [4, 8, 13, 14].includes(errorCode)
  };
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    const request: StatusRequest = await req.json();

    if (!request.operation_name || !request.model) {
      throw new Error("Missing required fields: operation_name, model");
    }

    logStep("Checking operation status", { operationName: request.operation_name });

    // Get OAuth access token
    const accessToken = await getAccessToken();

    // Configuration
    const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID") || "creators-multi-verse";
    const location = "us-central1";
    const gcsBucket = Deno.env.get("GCS_BUCKET_NAME") || "creatorsm-media-bucket";

    // Poll the operation status
    const fetchOpUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${request.model}:fetchPredictOperation`;

    const pollResponse = await fetch(fetchOpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operationName: request.operation_name
      })
    });

    if (!pollResponse.ok) {
      const errorBody = await pollResponse.text();
      logStep("Poll error", { status: pollResponse.status, error: errorBody });
      throw new Error(`Failed to check operation status: ${pollResponse.status}`);
    }

    const pollData = await pollResponse.json();

    // Check if operation is still in progress
    if (!pollData.done) {
      logStep("Operation still in progress");
      return new Response(JSON.stringify({
        success: true,
        status: "processing",
        message: "Video is still being generated...",
        progress: pollData.metadata?.progress || null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Operation is complete - check for errors
    if (pollData.error) {
      const errorCode = pollData.error.code;
      const operationId = pollData.error.message?.match(/Operation ID: ([\w-]+)/)?.[1];
      const structuredError = parseGoogleError(errorCode, operationId);

      logStep("Operation failed", structuredError);

      return new Response(JSON.stringify({
        success: false,
        status: "failed",
        error: JSON.stringify(structuredError)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 so frontend can handle gracefully
      });
    }

    // Success! Get the GCS URI
    let gcsUri = pollData.response?.generatedSamples?.[0]?.video?.gcsUri ||
                 pollData.response?.generatedSamples?.[0]?.videoUri ||
                 pollData.response?.videos?.[0]?.uri ||
                 pollData.response?.videoUri;

    // Fallback: search recursively
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
      throw new Error("Video generation completed but no video URI found.");
    }

    logStep("Video ready at GCS", { gcsUri });

    // Download video from GCS
    const bucketPath = gcsUri.replace(`gs://${gcsBucket}/`, '');
    const encodedPath = encodeURIComponent(bucketPath);
    const videoStorageApiUrl = `https://storage.googleapis.com/storage/v1/b/${gcsBucket}/o/${encodedPath}?alt=media`;

    logStep("Downloading video from GCS", { bucket: gcsBucket, path: bucketPath });

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
    const fileSize = videoBlob.size;

    logStep("Video downloaded", { sizeBytes: fileSize });

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().substring(0, 8);
    const storagePath = `${request.user_id}/${request.company_id || 'default'}/${timestamp}_${request.model}_${randomId}.mp4`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('media-studio-videos')
      .upload(storagePath, videoBlob, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (uploadError) {
      logStep("Storage upload error", { error: uploadError });
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('media-studio-videos')
      .getPublicUrl(storagePath);

    logStep("Video uploaded to Supabase", { storagePath, publicUrl });

    // Save to database
    const fileName = `generated_${timestamp}.mp4`;
    let notes = `Mode: ${request.mode}`;
    if (request.negative_prompt) notes += ` | Negative: ${request.negative_prompt}`;
    if (gcsUri) notes += ` | GCS: ${gcsUri}`;

    const mediaRecord = {
      user_id: request.user_id,
      company_id: request.company_id === 'default' ? null : request.company_id,
      file_name: fileName,
      file_type: 'video',
      file_format: 'mp4',
      file_size: fileSize,
      storage_path: storagePath,
      public_url: publicUrl,
      thumbnail_url: publicUrl,
      prompt: request.prompt,
      model_used: request.model,
      aspect_ratio: request.aspect_ratio,
      quality: request.resolution,
      duration: request.duration,
      reference_image_url: request.input_image_url || null,
      tags: [],
      is_favorite: false,
      custom_title: null,
      notes: notes,
      download_count: 0,
      view_count: 0,
    };

    const { error: dbError } = await supabaseClient
      .from('media_files')
      .insert([mediaRecord]);

    if (dbError) {
      logStep("Database insert error (non-fatal)", { error: dbError.message });
    } else {
      logStep("Video media record saved");
    }

    // Return success
    return new Response(JSON.stringify({
      success: true,
      status: "completed",
      video_url: publicUrl,
      thumbnail_url: publicUrl,
      storage_path: storagePath,
      gcs_uri: gcsUri,
      metadata: {
        model: request.model,
        mode: request.mode,
        prompt: request.prompt,
        aspect_ratio: request.aspect_ratio,
        resolution: request.resolution,
        duration: request.duration,
        negative_prompt: request.negative_prompt,
        has_reference_images: false,
        is_extension: request.mode === 'extend-video',
      }
    }), {
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
