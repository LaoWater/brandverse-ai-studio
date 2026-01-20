/**
 * Recover Pending Sora Video Jobs
 * ================================
 *
 * This edge function checks all pending Sora video jobs for a user
 * and attempts to recover completed videos that weren't captured
 * due to frontend polling timeout.
 *
 * Flow:
 * 1. Fetch all pending jobs for the authenticated user
 * 2. Check each job's status on OpenAI Sora API
 * 3. For completed jobs: download video, upload to storage, save to media_files
 * 4. Update/delete pending job records based on status
 * 5. Return summary of recovered videos
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECOVER-PENDING-VIDEOS] ${step}${detailsStr}`);
};

interface PendingJob {
  id: string;
  user_id: string;
  company_id: string | null;
  operation_name: string;
  model: string;
  mode: string;
  prompt: string;
  size: string;
  seconds: number;
  input_reference_url: string | null;
  status: string;
  created_at: string;
  expires_at: string;
}

interface RecoveryResult {
  success: boolean;
  recovered: number;
  failed: number;
  stillPending: number;
  expired: number;
  details: {
    jobId: string;
    status: 'recovered' | 'failed' | 'pending' | 'expired';
    videoUrl?: string;
    error?: string;
  }[];
}

/**
 * Download video from Sora /content endpoint and upload to Supabase Storage
 * The /content endpoint requires authentication with the OpenAI API key
 */
async function uploadVideoToStorage(
  supabaseClient: any,
  videoUrl: string,
  userId: string,
  companyId: string,
  model: string,
  openaiApiKey: string
): Promise<{ publicUrl: string; storagePath: string; fileSize: number }> {
  logStep('Downloading video from Sora', { url: videoUrl.substring(0, 60) + '...' });

  // The /content endpoint requires authentication
  const response = await fetch(videoUrl, {
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

  const timestamp = Date.now();
  const randomId = crypto.randomUUID().substring(0, 8);
  const storagePath = `${userId}/${companyId}/${timestamp}_${model}_recovered_${randomId}.mp4`;

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
  job: PendingJob
): Promise<void> {
  const timestamp = Date.now();
  const fileName = `sora_recovered_${timestamp}.mp4`;

  let notes = `Sora Mode: ${job.mode} | Recovered from pending job`;
  notes += ` | Sora ID: ${job.operation_name}`;

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
    prompt: job.prompt,
    model_used: job.model,
    aspect_ratio: job.size.includes('1280x720') || job.size.includes('1792x1024') ? '16:9' : '9:16',
    quality: job.size,
    duration: job.seconds,
    reference_image_url: job.input_reference_url || null,
    tags: ['sora', job.mode, 'recovered'],
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
    throw new Error(`Failed to save media record: ${error.message}`);
  }

  logStep('Video media record saved');
}

/**
 * Check status of a single Sora job
 */
async function checkSoraJobStatus(
  jobId: string,
  openaiApiKey: string
): Promise<{ status: 'completed' | 'processing' | 'failed'; videoUrl?: string; error?: string }> {
  const endpoint = `https://api.openai.com/v1/videos/${jobId}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Check if this is a 404 (job expired/deleted)
    if (response.status === 404) {
      return { status: 'failed', error: 'Job not found - may have expired on OpenAI servers' };
    }
    throw new Error(`Failed to check Sora status: ${errorText}`);
  }

  const data = await response.json();

  // Normalize status
  if (data.status === 'completed') {
    // Use the /content endpoint to get the actual video download URL
    // The video_url from status might be a reference, but /content gives us the actual downloadable video
    const contentUrl = `https://api.openai.com/v1/videos/${jobId}/content`;
    return { status: 'completed', videoUrl: contentUrl };
  }

  if (data.status === 'failed') {
    return { status: 'failed', error: data.error?.message || 'Generation failed' };
  }

  // 'queued' or 'in_progress'
  return { status: 'processing' };
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

    logStep("User authenticated", { userId: user.id });

    // Fetch all pending jobs for this user
    const { data: pendingJobs, error: fetchError } = await supabaseClient
      .from('pending_video_jobs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch pending jobs: ${fetchError.message}`);
    }

    logStep('Found pending jobs', { count: pendingJobs?.length || 0 });

    if (!pendingJobs || pendingJobs.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        recovered: 0,
        failed: 0,
        stillPending: 0,
        expired: 0,
        details: [],
        message: 'No pending video jobs found'
      } as RecoveryResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const result: RecoveryResult = {
      success: true,
      recovered: 0,
      failed: 0,
      stillPending: 0,
      expired: 0,
      details: [],
    };

    const now = new Date();

    // Process each pending job
    for (const job of pendingJobs as PendingJob[]) {
      logStep('Processing pending job', { jobId: job.operation_name, model: job.model });

      // Check if job has expired (>24 hours)
      const expiresAt = new Date(job.expires_at);
      if (now > expiresAt) {
        logStep('Job expired', { jobId: job.operation_name, expiresAt: job.expires_at });

        // Mark as expired in database
        await supabaseClient
          .from('pending_video_jobs')
          .update({ status: 'expired' })
          .eq('id', job.id);

        result.expired++;
        result.details.push({
          jobId: job.operation_name,
          status: 'expired',
          error: 'Job expired (>24 hours old)',
        });
        continue;
      }

      try {
        // Check status on OpenAI
        const statusResult = await checkSoraJobStatus(job.operation_name, openaiApiKey);

        if (statusResult.status === 'completed' && statusResult.videoUrl) {
          logStep('Job completed, recovering video', { jobId: job.operation_name });

          // Download and upload to our storage
          const { publicUrl, storagePath, fileSize } = await uploadVideoToStorage(
            supabaseClient,
            statusResult.videoUrl,
            user.id,
            job.company_id || 'default',
            job.model,
            openaiApiKey
          );

          // Save to media_files
          await saveVideoMediaRecord(
            supabaseClient,
            user.id,
            job.company_id || 'default',
            storagePath,
            publicUrl,
            fileSize,
            job
          );

          // Delete the pending job record
          await supabaseClient
            .from('pending_video_jobs')
            .delete()
            .eq('id', job.id);

          result.recovered++;
          result.details.push({
            jobId: job.operation_name,
            status: 'recovered',
            videoUrl: publicUrl,
          });

        } else if (statusResult.status === 'failed') {
          logStep('Job failed on OpenAI', { jobId: job.operation_name, error: statusResult.error });

          // Mark as failed in database
          await supabaseClient
            .from('pending_video_jobs')
            .update({ status: 'failed' })
            .eq('id', job.id);

          result.failed++;
          result.details.push({
            jobId: job.operation_name,
            status: 'failed',
            error: statusResult.error,
          });

        } else {
          // Still processing
          logStep('Job still processing', { jobId: job.operation_name });

          result.stillPending++;
          result.details.push({
            jobId: job.operation_name,
            status: 'pending',
          });
        }
      } catch (jobError: any) {
        logStep('Error processing job', { jobId: job.operation_name, error: jobError.message });

        // Check if error indicates job not found (expired on OpenAI)
        if (jobError.message?.includes('not found') || jobError.message?.includes('expired')) {
          await supabaseClient
            .from('pending_video_jobs')
            .update({ status: 'expired' })
            .eq('id', job.id);

          result.expired++;
          result.details.push({
            jobId: job.operation_name,
            status: 'expired',
            error: jobError.message,
          });
        } else {
          result.failed++;
          result.details.push({
            jobId: job.operation_name,
            status: 'failed',
            error: jobError.message,
          });
        }
      }
    }

    logStep('Recovery complete', {
      recovered: result.recovered,
      failed: result.failed,
      stillPending: result.stillPending,
      expired: result.expired,
    });

    return new Response(JSON.stringify(result), {
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
