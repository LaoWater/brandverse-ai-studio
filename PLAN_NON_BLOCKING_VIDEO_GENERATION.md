# Plan: Non-Blocking Video Generation UX

## Current State Analysis

### What Works Well (Sora Edge Functions)
The backend architecture for Sora is solid:
1. **Job Persistence**: `pending_video_jobs` table stores jobs immediately on start
2. **Status Polling**: `check-sora-status` edge function polls OpenAI
3. **Auto-Recovery**: Cron job (`process-pending-videos`) runs every 5 minutes to recover completed videos
4. **Manual Recovery**: Users can trigger `recover-pending-videos` edge function

### Current Problem
The **frontend UX** blocks the user with a full-screen modal during generation:
- `<Dialog open={isGenerating}>` creates an overlay that can't be dismissed
- User is chained to watching a loading bar for 30+ seconds (up to 5 minutes)
- If user closes browser, they lose visual connection to the job (though job continues on backend)

---

## Proposed Solution: Non-Blocking "Generation Queue" Panel

### Inspiration: Professional AI Video Platforms
Platforms like Runway, Pika, and Luma handle this by:
1. **Starting generation → showing a small card/thumbnail** with progress
2. **User can continue working** while video generates in background
3. **Notification** when video completes
4. **Progress visible** in a dedicated panel or corner widget

---

## Implementation Plan

### Phase 1: Create VideoGenerationQueue Component
A new component that shows active/pending generations in a compact, non-blocking way.

**Location**: `src/components/media/VideoGenerationQueue.tsx`

**Design**:
```
┌─────────────────────────────────────────────────────────┐
│ 🎬 Generating Videos (2)                            ─ × │
├─────────────────────────────────────────────────────────┤
│ ┌──────┐ "A cat playing piano..."                      │
│ │ 🎞️   │ Sora 2 Pro • 12s • 1080p                      │
│ │ 45%  │ ████████░░░░░░░░ Processing...                │
│ └──────┘                                               │
│                                                        │
│ ┌──────┐ "Sunset over mountains..."                    │
│ │ 🎞️   │ Sora 2 • 8s • 720p                           │
│ │ 10%  │ ██░░░░░░░░░░░░░░ Queued...                    │
│ └──────┘                                               │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Collapsible panel (fixed position, bottom-right or side panel)
- Shows thumbnail preview (first frame if image-to-video, or gradient placeholder)
- Progress bar per job
- Time elapsed
- Can be minimized to just a badge count
- Click to expand and see details

### Phase 2: Update Generation Flow

**Current Flow**:
1. User clicks Generate → `startGeneration()` → Modal opens
2. `generateMutation.mutate()` → Blocks UI with modal
3. Polling happens → Progress updates modal
4. Complete → Modal shows success → Auto-navigates to library

**New Flow**:
1. User clicks Generate → Toast notification "Video generation started!"
2. Job saved to `pending_video_jobs` immediately (client-side insert or edge function)
3. VideoGenerationQueue panel appears/updates with new job
4. User can continue working (create new prompts, browse library, etc.)
5. Background polling updates the queue panel
6. On completion → Toast notification + badge update + library refresh

### Phase 3: State Management Updates

**Add to MediaStudioContext**:
```typescript
interface ActiveGeneration {
  id: string;                    // pending_video_jobs.id
  operationName: string;         // OpenAI job ID
  prompt: string;
  model: string;
  mode: string;
  resolution: string;
  duration: number;
  thumbnailUrl?: string;         // For image-to-video mode
  progress: number;              // 0-100
  status: 'starting' | 'queued' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  estimatedCompletion?: Date;
}

// New context state
activeGenerations: ActiveGeneration[];
addGeneration: (gen: Omit<ActiveGeneration, 'progress' | 'status' | 'startedAt'>) => void;
updateGenerationProgress: (id: string, progress: number, status: string) => void;
removeGeneration: (id: string) => void;
```

### Phase 4: Persist Job Immediately on Start

**Current**: Job only persists if edge function saves it (which happens after OpenAI returns)

**Improvement**: Client saves to `pending_video_jobs` immediately after edge function returns `operation_name`:

```typescript
// In startAsyncSoraGeneration or a wrapper
const result = await startAsyncSoraGeneration(config, onProgress);

// Immediately persist to pending_video_jobs
await supabase.from('pending_video_jobs').insert({
  id: crypto.randomUUID(),
  user_id: config.userId,
  company_id: config.companyId,
  operation_name: result.operation_name,
  model: config.model,
  mode: config.videoMode,
  prompt: config.prompt,
  size: config.soraResolution,
  seconds: config.soraDuration,
  input_reference_url: config.soraInputReferenceUrl,
  status: 'pending',
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});
```

### Phase 5: Background Polling Service

Create a dedicated polling service that runs independently:

**Location**: `src/services/videoPollingService.ts`

```typescript
class VideoPollingService {
  private pollingIntervals: Map<string, NodeJS.Timer> = new Map();

  startPolling(jobId: string, operationName: string, model: string, onUpdate: (status) => void) {
    const interval = setInterval(async () => {
      const status = await pollVideoStatus(operationName, model, {});
      onUpdate(status);
      if (status.status === 'completed' || status.status === 'failed') {
        this.stopPolling(jobId);
      }
    }, 5000);
    this.pollingIntervals.set(jobId, interval);
  }

  stopPolling(jobId: string) {
    const interval = this.pollingIntervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(jobId);
    }
  }
}
```

### Phase 6: UI Integration

**MediaStudio.tsx Changes**:
1. Remove the blocking `<Dialog open={isGenerating}>` modal
2. Add `<VideoGenerationQueue />` component at page level
3. Update `handleGenerate()` to:
   - Start generation (non-blocking)
   - Show toast "Generation started"
   - Add to queue panel
   - User stays on create view (can start another generation!)

**Optional Enhancements**:
- Sound/vibration notification on completion
- Desktop notification (if permission granted)
- Badge count in browser tab title: "(2) Media Studio"

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/components/media/VideoGenerationQueue.tsx` | **CREATE** - New queue panel component |
| `src/contexts/MediaStudioContext.tsx` | **MODIFY** - Add activeGenerations state |
| `src/services/videoPollingService.ts` | **CREATE** - Background polling service |
| `src/services/mediaStudioService.ts` | **MODIFY** - Add client-side job persistence |
| `src/pages/MediaStudio.tsx` | **MODIFY** - Replace modal with queue, update handlers |
| `src/index.css` | **MODIFY** - Add queue panel animations |

---

## Migration Strategy

1. **Phase 1**: Add new components without removing old modal
2. **Phase 2**: Add feature flag to switch between old/new UX
3. **Phase 3**: Test thoroughly with both Sora and Veo
4. **Phase 4**: Remove old modal code

---

## Open Questions for You

1. **Queue Panel Position**: Bottom-right corner (like chat widgets) or right sidebar?
2. **Multi-generation**: Should users be allowed to start multiple generations at once?
3. **Notification Style**: Toast + sound, or more subtle?
4. **Minimized State**: Just badge count, or show mini progress bar?

---

## Estimated Scope

- **VideoGenerationQueue component**: ~200 lines
- **Context updates**: ~50 lines
- **Polling service**: ~100 lines
- **MediaStudio integration**: ~100 lines changes
- **Styles**: ~50 lines

Total: ~500 lines of new/modified code
