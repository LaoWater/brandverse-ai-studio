# Video Editor Enhancement Roadmap

## Current State (January 2025)

### What's Working
- ✅ Single video track timeline
- ✅ Non-destructive trimming (trimStart/trimEnd preserved)
- ✅ Drag-and-drop clip reordering
- ✅ Clip splitting at playhead
- ✅ Undo/Redo (50 history stack)
- ✅ Auto-save to Supabase (3s debounce, JSONB in `editor_projects.project_data`)
- ✅ Server-side export via Cloud Run + FFmpeg (frame-accurate trimming)
- ✅ Projects Library (save, load, rename projects)

### Current Data Model
```typescript
// src/types/editor.ts
interface EditorClip {
  id: string;
  mediaFileId: string;
  sourceUrl: string;
  thumbnailUrl: string | null;
  fileName: string;
  sourceDuration: number;
  startTime: number;      // Position on timeline
  trimStart: number;      // Non-destructive trim from start
  trimEnd: number;        // Non-destructive trim from end
}

// Database: editor_projects.project_data (JSONB)
interface ProjectData {
  clips: EditorClip[];
  settings?: { aspectRatio?: string; resolution?: string };
  version: number;
}
```

### Current Architecture
```
Frontend (React)                    Backend
├── VideoEditor.tsx                 ├── Supabase
│   ├── clips[] state               │   ├── editor_projects table
│   ├── EditorTimeline              │   └── media_files table
│   ├── Video preview               │
│   └── Auto-save                   └── Cloud Run (media-processing-svc)
│                                       └── FFmpeg (trim + concat)
```

---

## Phase 1: Text Captions (Priority)

### Goal
Allow users to add styled text overlays (captions, titles, lower thirds) to videos with position, timing, and style controls.

### Is This Possible? ✅ YES

**Frontend:** Fully achievable with React + Canvas/CSS overlays
**Export:** FFmpeg `drawtext` filter supports all text styling, positioning, and timing

### 1.1 Data Model Extensions

```typescript
// New: Text overlay type
interface TextOverlay {
  id: string;
  type: 'text';

  // Timing
  startTime: number;        // When text appears (seconds)
  duration: number;         // How long it shows (seconds)

  // Content
  text: string;             // The actual text content

  // Position (percentages for responsiveness)
  position: {
    x: number;              // 0-100 (% from left)
    y: number;              // 0-100 (% from top)
  };

  // Styling
  style: {
    fontFamily: string;     // 'Inter', 'Montserrat', 'Roboto', etc.
    fontSize: number;       // In pixels (scaled to video resolution)
    fontWeight: 'normal' | 'bold' | 'light';
    color: string;          // Hex color '#FFFFFF'
    backgroundColor?: string; // Optional background box
    backgroundPadding?: number;
    textAlign: 'left' | 'center' | 'right';
    opacity: number;        // 0-1
  };

  // Animation (optional, phase 1.5)
  animation?: {
    entrance: 'none' | 'fade-in' | 'slide-up' | 'typewriter';
    exit: 'none' | 'fade-out' | 'slide-down';
    duration: number;       // Animation duration in ms
  };
}

// Updated project data
interface ProjectData {
  clips: EditorClip[];
  textOverlays: TextOverlay[];  // NEW
  settings?: { aspectRatio?: string; resolution?: string };
  version: number;              // Bump to 2
}
```

### 1.2 UI Components Needed

| Component | Purpose |
|-----------|---------|
| `TextOverlayPanel.tsx` | Side panel to add/edit text overlays |
| `TextOverlayPreview.tsx` | Render text on video preview (CSS positioned) |
| `TextOverlayTimelineTrack.tsx` | Show text items on timeline (separate track) |
| `TextStyleControls.tsx` | Font, size, color, alignment pickers |
| `PositionPicker.tsx` | Drag handle on preview to position text |

### 1.3 UI Flow

1. User clicks "Add Text" button
2. Text overlay added at current playhead position (default 3s duration)
3. Text appears on preview with drag handles
4. Side panel shows style controls:
   - Text input field
   - Font family dropdown (5-10 curated fonts)
   - Font size slider
   - Color picker
   - Background toggle + color
   - Alignment buttons
   - Opacity slider
5. Timeline shows text block on separate "Text" track
6. User can drag to reposition timing, resize duration
7. Auto-save includes textOverlays array

### 1.4 Export Service Updates

**Cloud Run `main.py` changes:**

```python
# New request model
class TextOverlay(BaseModel):
    id: str
    startTime: float
    duration: float
    text: str
    position: dict  # {x: float, y: float}
    style: dict     # {fontFamily, fontSize, color, etc.}

class VideoExportRequest(BaseModel):
    clips: List[VideoClip]
    textOverlays: List[TextOverlay] = []  # NEW
    userId: str
    companyId: Optional[str] = None
    projectName: Optional[str] = "Exported Video"
```

**FFmpeg drawtext filter:**
```bash
ffmpeg -i input.mp4 \
  -vf "drawtext=text='Hello World':fontfile=/path/to/font.ttf:fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-100:enable='between(t,2,5)'" \
  -c:a copy output.mp4
```

**Key FFmpeg capabilities:**
- `drawtext` filter for text rendering
- `fontfile` for custom fonts (need to bundle fonts in Docker image)
- `enable='between(t,start,end)'` for timing
- Position with expressions: `x=(w-text_w)/2` for centering
- `box=1:boxcolor=black@0.5` for background
- Multiple drawtext filters can be chained

### 1.5 Implementation Steps

1. **Data model** - Add TextOverlay type to `src/types/editor.ts`
2. **State management** - Add `textOverlays` state to VideoEditor.tsx
3. **Preview rendering** - CSS-positioned text overlay on video preview
4. **Timeline track** - Visual text track below video track
5. **Style panel** - Font/color/size controls
6. **Position controls** - Drag to position on preview
7. **Auto-save update** - Include textOverlays in project_data
8. **Export service** - Add drawtext filter to FFmpeg pipeline
9. **Font bundling** - Add fonts to Docker image

### 1.6 Fonts Strategy

Bundle popular fonts in Docker image:
- Inter (modern, clean)
- Montserrat (bold, impactful)
- Roboto (readable)
- Playfair Display (elegant serif)
- Oswald (condensed, strong)

Store in `/usr/share/fonts/custom/` in container.

---

## Phase 2: Multi-Track Foundation

### Goal
Restructure data model to support multiple tracks/layers for future features.

### 2.1 Data Model

```typescript
interface EditorTrack {
  id: string;
  type: 'video' | 'text' | 'image' | 'audio';
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;        // Z-order (higher = on top)
}

interface ProjectData {
  tracks: EditorTrack[];
  clips: EditorClip[];          // Now include trackId
  textOverlays: TextOverlay[];  // Now include trackId
  imageOverlays: ImageOverlay[];
  settings: ProjectSettings;
  version: number;
}

// Extended clip with track reference
interface EditorClip {
  // ... existing fields ...
  trackId: string;
}
```

### 2.2 Timeline UI Changes

- Multiple horizontal tracks stacked vertically
- Track headers with name, visibility toggle, lock
- Drag items between tracks
- Track reordering

---

## Phase 3: Image Overlays

### Goal
Add logos, watermarks, stickers, images as overlays on videos.

### 3.1 Data Model

```typescript
interface ImageOverlay {
  id: string;
  type: 'image';
  trackId: string;

  // Source
  mediaFileId: string;
  imageUrl: string;

  // Timing
  startTime: number;
  duration: number;

  // Position & Size (percentages)
  position: { x: number; y: number };
  size: { width: number; height: number };

  // Properties
  opacity: number;
  rotation?: number;
  cornerRadius?: number;
}
```

### 3.2 FFmpeg Implementation

```bash
ffmpeg -i video.mp4 -i logo.png \
  -filter_complex "[1:v]scale=100:-1[logo];[0:v][logo]overlay=10:10:enable='between(t,0,5)'" \
  output.mp4
```

---

## Phase 4: Transitions & Effects

### Goal
Add transitions between clips and effects on clips.

### 4.1 Transitions

```typescript
interface Transition {
  id: string;
  fromClipId: string;
  toClipId: string;
  type: 'crossfade' | 'fade-black' | 'wipe-left' | 'wipe-right';
  duration: number;  // milliseconds
}
```

### 4.2 Clip Effects

```typescript
interface ClipEffect {
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'grayscale';
  intensity: number;  // 0-1
}

interface EditorClip {
  // ... existing ...
  effects?: ClipEffect[];
}
```

### 4.3 FFmpeg Filters

- Crossfade: `xfade=transition=fade:duration=0.5`
- Brightness: `eq=brightness=0.1`
- Blur: `boxblur=5:1`
- Grayscale: `colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3`

---

## Phase 5: Audio Enhancements

### Goal
Separate audio track, volume control, music overlay.

### 5.1 Features
- Extract audio from video to separate track
- Volume keyframes
- Add background music track
- Audio ducking (lower music when speech detected)

---

## Technical Feasibility Summary

| Feature | Frontend | Export (FFmpeg) | Complexity |
|---------|----------|-----------------|------------|
| Text Captions | ✅ CSS overlays | ✅ drawtext filter | Medium |
| Multi-track | ✅ Track components | ✅ filter_complex | Medium |
| Image Overlays | ✅ Positioned images | ✅ overlay filter | Medium |
| Transitions | ✅ Preview animation | ✅ xfade filter | High |
| Effects | ✅ CSS filters preview | ✅ eq/colorize filters | Medium |
| Audio tracks | ✅ Waveform viz | ✅ amix filter | High |

**All features are achievable with:**
- React + Canvas/CSS for preview
- FFmpeg filter chains for export
- JSONB storage scales well

---

## File Structure After Phase 1

```
src/
├── types/
│   └── editor.ts              # Extended with TextOverlay
├── components/editor/
│   ├── VideoEditor.tsx        # Main container
│   ├── EditorTimeline.tsx     # Multi-track timeline
│   ├── TextOverlayPanel.tsx   # NEW: Text editing panel
│   ├── TextOverlayPreview.tsx # NEW: Text on video preview
│   ├── TextStyleControls.tsx  # NEW: Font/color controls
│   ├── ClipSelector.tsx
│   ├── ExportModal.tsx
│   └── ProjectsLibrary.tsx
├── services/
│   ├── videoEditorService.ts  # Updated export with text
│   └── editorProjectService.ts

media-processing-service/
├── main.py                    # Updated with drawtext
├── fonts/                     # NEW: Bundled fonts
│   ├── Inter.ttf
│   ├── Montserrat.ttf
│   └── ...
├── Dockerfile                 # Updated to copy fonts
└── requirements.txt
```

---

## Database Migration (Phase 1)

No schema change needed - `project_data` is JSONB and can store any structure.

Version field in project_data handles migrations:
```typescript
// Migration logic in editorProjectService.ts
function migrateProjectData(data: any): ProjectData {
  if (data.version < 2) {
    data.textOverlays = [];
    data.version = 2;
  }
  return data;
}
```

---

## Estimated Scope

| Phase | Features | Effort |
|-------|----------|--------|
| Phase 1 | Text Captions | 3-4 days |
| Phase 2 | Multi-track Foundation | 2-3 days |
| Phase 3 | Image Overlays | 2 days |
| Phase 4 | Transitions & Effects | 3-4 days |
| Phase 5 | Audio Enhancements | 4-5 days |

---

## Next Steps

1. **Start Phase 1** - Text Captions implementation
2. Add TextOverlay type to editor.ts
3. Build TextOverlayPanel UI component
4. Add preview rendering (CSS overlay on video)
5. Add text track to timeline
6. Update export service with drawtext filter
7. Bundle fonts in Docker image
8. Test end-to-end export with text

---

## Questions to Resolve

1. **Caption presets** - Should we offer preset styles (e.g., "YouTube Title", "Instagram Caption", "Lower Third")?
2. **Auto-captions** - Future: integrate speech-to-text for automatic caption generation?
3. **Font licensing** - Which fonts can we legally bundle? (Google Fonts are safe)
4. **Mobile editing** - Timeline needs touch-friendly controls for mobile?
