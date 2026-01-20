/**
 * Process Pending Sora Video Jobs (Cron)
 * =======================================
 *
 * Called by pg_cron every 5 minutes to automatically recover
 * completed Sora videos that weren't captured due to frontend timeout.
 *
 * No auth required - uses service role key internally.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PENDING-VIDEOS] ${step}${detailsStr}`);
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

/**
 * Download video from Sora /content endpoint
 */
async function downloadAndUploadVideo(
  supabaseClient: any,
  jobId: string,
  userId: string,
  companyId: string,
  model: string,
  openaiApiKey: string
): Promise<{ publicUrl: string; storagePath: string; fileSize: number }> {
  const contentUrl = `https://api.openai.com/v1/videos/${jobId}/content`;
  logStep('Downloading video', { jobId });

  const response = await fetch(contentUrl, {
    headers: { 'Authorization': `Bearer ${openaiApiKey}` },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Download failed: ${response.status} ${errorText}`);
  }

  const videoBlob = await response.blob();
  const fileSize = videoBlob.size;
  logStep('Downloaded', { sizeBytes: fileSize });

  const timestamp = Date.now();
  const randomId = crypto.randomUUID().substring(0, 8);
  const storagePath = `${userId}/${companyId}/${timestamp}_${model}_auto_${randomId}.mp4`;

  const { error } = await supabaseClient.storage
    .from('media-studio-videos')
    .upload(storagePath, videoBlob, { contentType: 'video/mp4' });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabaseClient.storage
    .from('media-studio-videos')
    .getPublicUrl(storagePath);

  return { publicUrl, storagePath, fileSize };
}

/**
 * Save video to media_files table
 */
async function saveMediaRecord(
  supabaseClient: any,
  job: PendingJob,
  storagePath: string,
  publicUrl: string,
  fileSize: number
): Promise<void> {
  const { error } = await supabaseClient.from('media_files').insert([{
    user_id: job.user_id,
    company_id: job.company_id === 'default' ? null : job.company_id,
    file_name: `sora_auto_${Date.now()}.mp4`,
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
    reference_image_url: job.input_reference_url,
    tags: ['sora', job.mode, 'auto-recovered'],
    notes: `Sora Mode: ${job.mode} | Auto-recovered | ID: ${job.operation_name}`,
  }]);

  if (error) throw new Error(`DB insert failed: ${error.message}`);
}

/**
 * Check Sora job status
 */
async function checkJobStatus(
  jobId: string,
  openaiApiKey: string
): Promise<{ status: 'completed' | 'processing' | 'failed'; error?: string }> {
  const response = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
    headers: { 'Authorization': `Bearer ${openaiApiKey}` },
  });

  if (!response.ok) {
    if (response.status === 404) return { status: 'failed', error: 'Job expired on OpenAI' };
    throw new Error(`Status check failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.status === 'completed') return { status: 'completed' };
  if (data.status === 'failed') return { status: 'failed', error: data.error?.message };
  return { status: 'processing' };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role - no auth needed (called by cron)
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Cron triggered");

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

    // Mark expired jobs
    await supabaseClient
      .from('pending_video_jobs')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    // Fetch all pending jobs
    const { data: jobs, error } = await supabaseClient
      .from('pending_video_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at');

    if (error) throw new Error(`Fetch failed: ${error.message}`);

    logStep('Pending jobs found', { count: jobs?.length || 0 });

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recovered = 0, failed = 0, pending = 0;

    for (const job of jobs as PendingJob[]) {
      try {
        const status = await checkJobStatus(job.operation_name, openaiApiKey);

        if (status.status === 'completed') {
          const { publicUrl, storagePath, fileSize } = await downloadAndUploadVideo(
            supabaseClient, job.operation_name, job.user_id,
            job.company_id || 'default', job.model, openaiApiKey
          );

          await saveMediaRecord(supabaseClient, job, storagePath, publicUrl, fileSize);

          await supabaseClient.from('pending_video_jobs').delete().eq('id', job.id);
          recovered++;
          logStep('Recovered', { jobId: job.operation_name });

        } else if (status.status === 'failed') {
          await supabaseClient.from('pending_video_jobs')
            .update({ status: 'failed' }).eq('id', job.id);
          failed++;
          logStep('Failed', { jobId: job.operation_name, error: status.error });

        } else {
          pending++;
        }
      } catch (e: any) {
        logStep('Error processing job', { jobId: job.operation_name, error: e.message });
        failed++;
      }
    }

    logStep('Complete', { recovered, failed, pending });

    return new Response(JSON.stringify({ success: true, recovered, failed, pending }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
