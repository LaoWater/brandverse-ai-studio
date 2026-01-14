/**
 * Script to import a video from GCS to Supabase
 * Usage: npx tsx scripts/import-gcs-video.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - Update these values
const CONFIG = {
  // GCS video path (without gs:// prefix)
  gcsPath: 'veo-videos/aef6658c-423d-45bf-8e37-66e0517498fe/1768384783067/10303414462888116338/sample_0.mp4',
  gcsBucket: 'creatorsm-media-bucket',

  // User info
  userId: 'aef6658c-423d-45bf-8e37-66e0517498fe',
  companyId: 'b808fe6c-c45b-4973-8fc0-74a61f500131',

  // Video metadata
  prompt: `[VISUAL] Cinematic 4K, shallow depth of field...`, // Truncated for brevity
  model: 'veo-3.1-fast-generate-001',
  mode: 'image-to-video',
  aspectRatio: '9:16',
  resolution: '1080p',
  duration: 8,

  // Supabase config (from your client.ts)
  supabaseUrl: 'https://vcgaqikuaaazjpwyzvwb.supabase.co',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountKey = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY environment variable not set');
  }

  const credentials = JSON.parse(serviceAccountKey);

  // Create JWT
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  // Base64url encode
  const base64url = (obj: any) => {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return Buffer.from(str).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64url(header);
  const encodedPayload = base64url(payload);
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Sign with private key
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const signature = sign.sign(credentials.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const signedToken = `${unsignedToken}.${signature}`;

  // Exchange for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedToken
    })
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function main() {
  console.log('🎬 Importing video from GCS to Supabase...\n');

  // Get Google access token
  console.log('1. Getting Google Cloud access token...');
  const accessToken = await getGoogleAccessToken();
  console.log('   ✓ Token obtained\n');

  // Download video from GCS
  console.log('2. Downloading video from GCS...');
  const encodedPath = encodeURIComponent(CONFIG.gcsPath);
  const gcsUrl = `https://storage.googleapis.com/storage/v1/b/${CONFIG.gcsBucket}/o/${encodedPath}?alt=media`;

  const videoResponse = await fetch(gcsUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!videoResponse.ok) {
    throw new Error(`Failed to download from GCS: ${videoResponse.status} - ${await videoResponse.text()}`);
  }

  const videoBuffer = await videoResponse.arrayBuffer();
  const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
  console.log(`   ✓ Downloaded ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)} MB\n`);

  // Initialize Supabase client
  console.log('3. Uploading to Supabase Storage...');
  const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey);

  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  const storagePath = `${CONFIG.userId}/${CONFIG.companyId}/${timestamp}_${CONFIG.model}_${randomId}.mp4`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('media-studio-videos')
    .upload(storagePath, videoBlob, {
      contentType: 'video/mp4',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('media-studio-videos')
    .getPublicUrl(storagePath);

  console.log(`   ✓ Uploaded to: ${storagePath}`);
  console.log(`   ✓ Public URL: ${publicUrl}\n`);

  // Save to database
  console.log('4. Saving to database...');
  const mediaRecord = {
    user_id: CONFIG.userId,
    company_id: CONFIG.companyId,
    file_name: `generated_${timestamp}.mp4`,
    file_type: 'video',
    file_format: 'mp4',
    file_size: videoBuffer.byteLength,
    storage_path: storagePath,
    public_url: publicUrl,
    thumbnail_url: publicUrl,
    prompt: CONFIG.prompt,
    model_used: CONFIG.model,
    aspect_ratio: CONFIG.aspectRatio,
    quality: CONFIG.resolution,
    duration: CONFIG.duration,
    reference_image_url: null,
    tags: [],
    is_favorite: false,
    custom_title: null,
    notes: `Mode: ${CONFIG.mode} | GCS: gs://${CONFIG.gcsBucket}/${CONFIG.gcsPath}`,
    download_count: 0,
    view_count: 0,
  };

  const { error: dbError } = await supabase
    .from('media_files')
    .insert([mediaRecord]);

  if (dbError) {
    console.log(`   ⚠ Database error (non-fatal): ${dbError.message}`);
  } else {
    console.log('   ✓ Saved to media_files table\n');
  }

  console.log('✅ Import complete!');
  console.log(`\n📺 Video URL: ${publicUrl}`);
}

main().catch(console.error);
