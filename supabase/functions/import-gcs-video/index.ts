import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function base64url(input: ArrayBuffer | string): string {
  const base64 = typeof input === 'string'
    ? btoa(input)
    : btoa(String.fromCharCode(...new Uint8Array(input)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getAccessToken(): Promise<string> {
  const serviceAccountKey = Deno.env.get("GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY");
  if (!serviceAccountKey) throw new Error("GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY not configured.");

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

  if (!tokenResponse.ok) throw new Error(`Token exchange failed: ${await tokenResponse.text()}`);
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
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
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    const body = await req.json();
    const { gcs_path, prompt, model, mode, aspect_ratio, resolution, duration, company_id } = body;

    if (!gcs_path) throw new Error("gcs_path is required");

    console.log(`[IMPORT] Starting import for user ${user.id}`);
    console.log(`[IMPORT] GCS path: ${gcs_path}`);

    // Get access token
    const accessToken = await getAccessToken();

    // Download from GCS
    const gcsBucket = Deno.env.get("GCS_BUCKET_NAME") || "creatorsm-media-bucket";
    const encodedPath = encodeURIComponent(gcs_path);
    const gcsUrl = `https://storage.googleapis.com/storage/v1/b/${gcsBucket}/o/${encodedPath}?alt=media`;

    console.log(`[IMPORT] Downloading from GCS...`);
    const videoResponse = await fetch(gcsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!videoResponse.ok) {
      throw new Error(`Failed to download from GCS: ${videoResponse.status}`);
    }

    const videoBlob = await videoResponse.blob();
    const fileSize = videoBlob.size;
    console.log(`[IMPORT] Downloaded ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().substring(0, 8);
    const storagePath = `${user.id}/${company_id || 'default'}/${timestamp}_${model || 'veo'}_${randomId}.mp4`;

    console.log(`[IMPORT] Uploading to Supabase Storage...`);
    const { error: uploadError } = await supabaseClient.storage
      .from('media-studio-videos')
      .upload(storagePath, videoBlob, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabaseClient.storage
      .from('media-studio-videos')
      .getPublicUrl(storagePath);

    console.log(`[IMPORT] Uploaded to: ${publicUrl}`);

    // Save to database
    const mediaRecord = {
      user_id: user.id,
      company_id: company_id || null,
      file_name: `imported_${timestamp}.mp4`,
      file_type: 'video',
      file_format: 'mp4',
      file_size: fileSize,
      storage_path: storagePath,
      public_url: publicUrl,
      thumbnail_url: publicUrl,
      prompt: prompt || 'Imported from GCS',
      model_used: model || 'veo-3.1-fast-generate-001',
      aspect_ratio: aspect_ratio || '9:16',
      quality: resolution || '1080p',
      duration: duration || 8,
      reference_image_url: null,
      tags: ['imported'],
      is_favorite: false,
      custom_title: null,
      notes: `Mode: ${mode || 'image-to-video'} | GCS: gs://${gcsBucket}/${gcs_path}`,
      download_count: 0,
      view_count: 0,
    };

    const { error: dbError } = await supabaseClient
      .from('media_files')
      .insert([mediaRecord]);

    if (dbError) {
      console.log(`[IMPORT] Database error (non-fatal): ${dbError.message}`);
    }

    console.log(`[IMPORT] Complete!`);

    return new Response(JSON.stringify({
      success: true,
      video_url: publicUrl,
      storage_path: storagePath,
      file_size: fileSize
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`[IMPORT] ERROR: ${errorMessage}`);

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
