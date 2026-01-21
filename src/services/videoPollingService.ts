/**
 * Video Polling Service
 * Handles background polling for video generation status
 * Works independently of the UI, allowing users to continue working
 */

import { pollVideoStatus, AsyncVideoStartResponse } from './mediaStudioService';
import { ActiveGeneration } from '@/contexts/MediaStudioContext';

export interface PollingCallbacks {
  onProgress: (id: string, progress: number, stage: string) => void;
  onComplete: (id: string, videoUrl: string, thumbnailUrl?: string) => void;
  onError: (id: string, error: string) => void;
}

interface PollingJob {
  id: string;
  operationName: string;
  model: string;
  requestData: AsyncVideoStartResponse['request_data'];
  intervalId: NodeJS.Timer | null;
  startTime: number;
  pollCount: number;
}

class VideoPollingService {
  private jobs: Map<string, PollingJob> = new Map();
  private callbacks: PollingCallbacks | null = null;
  private pollInterval: number = 5000; // 5 seconds
  private maxPollCount: number = 120; // 10 minutes max (120 * 5s)

  /**
   * Set callbacks for status updates
   */
  setCallbacks(callbacks: PollingCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start polling for a video generation job
   */
  startPolling(
    id: string,
    operationName: string,
    model: string,
    requestData: AsyncVideoStartResponse['request_data']
  ) {
    // Don't start if already polling this job
    if (this.jobs.has(id)) {
      console.log(`[VideoPollingService] Already polling job ${id}`);
      return;
    }

    const job: PollingJob = {
      id,
      operationName,
      model,
      requestData,
      intervalId: null,
      startTime: Date.now(),
      pollCount: 0,
    };

    // Start the polling interval
    job.intervalId = setInterval(() => this.pollJob(id), this.pollInterval);
    this.jobs.set(id, job);

    console.log(`[VideoPollingService] Started polling job ${id} (${operationName})`);

    // Do an immediate first poll
    this.pollJob(id);
  }

  /**
   * Stop polling for a specific job
   */
  stopPolling(id: string) {
    const job = this.jobs.get(id);
    if (job && job.intervalId) {
      clearInterval(job.intervalId);
      this.jobs.delete(id);
      console.log(`[VideoPollingService] Stopped polling job ${id}`);
    }
  }

  /**
   * Stop all polling
   */
  stopAll() {
    this.jobs.forEach((job, id) => {
      if (job.intervalId) {
        clearInterval(job.intervalId);
      }
    });
    this.jobs.clear();
    console.log('[VideoPollingService] Stopped all polling');
  }

  /**
   * Get active job count
   */
  getActiveJobCount(): number {
    return this.jobs.size;
  }

  /**
   * Check if a specific job is being polled
   */
  isPolling(id: string): boolean {
    return this.jobs.has(id);
  }

  /**
   * Poll a specific job for status
   */
  private async pollJob(id: string) {
    const job = this.jobs.get(id);
    if (!job) return;

    job.pollCount++;

    // Calculate progress based on elapsed time (rough estimate)
    // Video generation typically takes 30s-5min
    const elapsedSeconds = (Date.now() - job.startTime) / 1000;
    const estimatedProgress = Math.min(
      90, // Cap at 90% until actually complete
      Math.floor(10 + (elapsedSeconds / 180) * 80) // 10-90% over ~3 minutes
    );

    // Build stage message based on elapsed time
    let stage = 'Processing...';
    if (elapsedSeconds < 10) {
      stage = 'Starting generation...';
    } else if (elapsedSeconds < 30) {
      stage = 'Analyzing prompt...';
    } else if (elapsedSeconds < 60) {
      stage = 'Generating frames...';
    } else if (elapsedSeconds < 120) {
      stage = 'Rendering video...';
    } else {
      stage = 'Finalizing...';
    }

    // Update progress
    this.callbacks?.onProgress(id, estimatedProgress, stage);

    try {
      const result = await pollVideoStatus(
        job.operationName,
        job.model,
        job.requestData
      );

      console.log(`[VideoPollingService] Poll ${job.pollCount} for ${id}:`, {
        status: result.status,
        hasError: !!result.error,
        error: result.error,
      });

      if (result.status === 'completed') {
        // Success!
        this.stopPolling(id);
        this.callbacks?.onComplete(
          id,
          result.video_url || '',
          result.thumbnail_url
        );
      } else if (result.status === 'failed' || result.status === 'error') {
        // Failed - pass through the full error (may contain structured JSON)
        console.log(`[VideoPollingService] Generation failed for ${id}:`, result.error);
        this.stopPolling(id);
        this.callbacks?.onError(id, result.error || 'Video generation failed');
      }
      // If still processing, continue polling

      // Check for timeout
      if (job.pollCount >= this.maxPollCount) {
        this.stopPolling(id);
        this.callbacks?.onError(
          id,
          'Generation timed out. The video may still be processing - check your library later.'
        );
      }
    } catch (error: any) {
      console.error(`[VideoPollingService] Poll error for ${id}:`, error);

      // Don't stop on transient errors, but track consecutive failures
      // After 5 consecutive failures, give up
      if (job.pollCount > 5 && job.pollCount % 5 === 0) {
        // Every 5 polls after the first 5, check if we should give up
        // This allows for transient network issues
      }
    }
  }

  /**
   * Resume polling for jobs that were interrupted (e.g., page reload)
   * Takes active generations from context and restarts polling for any that are still processing
   */
  resumePolling(activeGenerations: ActiveGeneration[]) {
    activeGenerations.forEach(gen => {
      if (
        (gen.status === 'processing' || gen.status === 'queued' || gen.status === 'starting') &&
        gen.operationName &&
        !this.isPolling(gen.id)
      ) {
        this.startPolling(
          gen.id,
          gen.operationName,
          gen.model,
          {
            user_id: '', // Will be filled from session
            prompt: gen.prompt,
            aspect_ratio: gen.resolution.includes('x') ? '16:9' : '16:9',
            resolution: gen.resolution,
            duration: gen.duration,
            mode: gen.mode,
          }
        );
      }
    });
  }
}

// Export singleton instance
export const videoPollingService = new VideoPollingService();

export default videoPollingService;
