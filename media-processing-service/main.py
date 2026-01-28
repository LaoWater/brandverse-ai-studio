"""
Media Processing Service
========================
Cloud Run service for video/image processing operations.
Uses FFmpeg for lossless video operations.

Endpoints:
- POST /video/export - Trim and concatenate video clips (lossless)
- GET /health - Health check
"""

import os
import asyncio
import subprocess
import uuid
import shutil
import aiohttp
import aiofiles
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from google.cloud import storage as gcs_storage

# ============================================
# Configuration
# ============================================

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
WORK_DIR = Path("/tmp/media-processing")

# GCS configuration for large files (> 50MB)
GCS_BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME", "brandverse-media-exports")
GCS_LARGE_FILE_THRESHOLD = 50 * 1024 * 1024  # 50MB in bytes

# ============================================
# FastAPI App Setup
# ============================================

app = FastAPI(
    title="Media Processing Service",
    description="Video and image processing API with FFmpeg",
    version="1.0.0"
)

# CORS - allow all origins for now (can restrict later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Models
# ============================================

class VideoClip(BaseModel):
    id: str
    sourceUrl: str
    sourceDuration: float
    startTime: float
    trimStart: float
    trimEnd: float


class TextStyle(BaseModel):
    fontFamily: str = "Inter"
    fontSize: int = 32
    fontWeight: str = "normal"  # 'normal', 'bold', 'light'
    color: str = "#FFFFFF"
    backgroundColor: Optional[str] = None
    backgroundPadding: Optional[int] = None
    textAlign: str = "center"  # 'left', 'center', 'right'
    opacity: float = 1.0


class TextOverlay(BaseModel):
    id: str
    startTime: float
    duration: float
    text: str
    position: dict  # { x: number, y: number } as percentages
    style: TextStyle


class PreviewDimensions(BaseModel):
    width: int
    height: int


class Transition(BaseModel):
    """Video transition between two clips."""
    fromClipIndex: int
    toClipIndex: int
    type: str  # FFmpeg xfade transition name
    duration: float  # Transition duration in seconds


class VideoExportRequest(BaseModel):
    clips: List[VideoClip]
    textOverlays: Optional[List[TextOverlay]] = None
    transitions: Optional[List[Transition]] = None  # Transitions between clips
    previewDimensions: Optional[PreviewDimensions] = None  # Preview container size from web editor
    userId: str
    companyId: Optional[str] = None
    projectName: Optional[str] = "Exported Video"


class VideoExportResponse(BaseModel):
    success: bool
    videoUrl: Optional[str] = None
    storagePath: Optional[str] = None
    fileSize: Optional[int] = None
    mediaFileId: Optional[str] = None
    processingTimeMs: Optional[int] = None
    storageType: Optional[str] = None  # 'supabase' or 'gcs'
    error: Optional[str] = None


# ============================================
# Helper Functions
# ============================================

def get_supabase_client() -> Client:
    """Create Supabase client with service role key."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase credentials not configured"
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def upload_to_gcs(file_path: Path, destination_path: str) -> str:
    """
    Upload file to Google Cloud Storage and return a public URL.
    Used for files > 50MB that exceed Supabase storage limits.

    Bucket has uniform bucket-level access with allUsers:objectViewer,
    so all objects are publicly readable by default.
    Objects are auto-deleted after 30 days via bucket lifecycle policy.
    """
    print(f"[GCS] Uploading {file_path} to gs://{GCS_BUCKET_NAME}/{destination_path}")

    client = gcs_storage.Client()
    bucket = client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(destination_path)

    # Upload the file
    blob.upload_from_filename(str(file_path), content_type="video/mp4")

    # Return the public URL (bucket already has public read access)
    public_url = f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{destination_path}"
    print(f"[GCS] Upload complete. Public URL: {public_url}")
    return public_url


async def download_file(url: str, dest_path: Path) -> None:
    """Download a file from URL to local path."""
    print(f"[Download] {url} -> {dest_path}")

    async with aiohttp.ClientSession() as session:
        async with session.get(url, allow_redirects=True) as response:
            if response.status != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to download video: HTTP {response.status}"
                )

            async with aiofiles.open(dest_path, 'wb') as f:
                async for chunk in response.content.iter_chunked(8192):
                    await f.write(chunk)

    print(f"[Download] Complete: {dest_path.stat().st_size} bytes")


def run_ffmpeg(args: List[str]) -> None:
    """Run FFmpeg command and handle errors."""
    cmd = ["ffmpeg", "-y"] + args
    print(f"[FFmpeg] Running: {' '.join(cmd)}")

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"[FFmpeg] Error: {result.stderr}")
        raise HTTPException(
            status_code=500,
            detail=f"FFmpeg error: {result.stderr[:500]}"
        )

    print("[FFmpeg] Command completed successfully")


def trim_video(input_path: Path, output_path: Path, start_time: float, duration: float) -> None:
    """
    Trim video using FFmpeg with re-encoding for frame-accurate cuts.

    Uses -i before -ss for accurate seeking (input-based seeking with re-encode).
    Re-encodes with high quality settings (CRF 18) for near-lossless output.
    This approach ensures exact frame trimming regardless of keyframe positions.
    """
    end_time = start_time + duration

    run_ffmpeg([
        "-i", str(input_path),
        "-ss", str(start_time),
        "-to", str(end_time),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-avoid_negative_ts", "make_zero",
        str(output_path)
    ])


def concatenate_videos(input_paths: List[Path], output_path: Path, work_dir: Path) -> None:
    """
    Concatenate videos using FFmpeg concat demuxer (lossless for same-codec files).
    """
    if len(input_paths) == 1:
        # Single file - just copy
        shutil.copy(input_paths[0], output_path)
        return

    # Create concat list file
    concat_list_path = work_dir / "concat_list.txt"
    with open(concat_list_path, "w") as f:
        for path in input_paths:
            f.write(f"file '{path}'\n")

    run_ffmpeg([
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list_path),
        "-c", "copy",
        str(output_path)
    ])


def get_video_duration_ffprobe(video_path: Path) -> float:
    """Get video duration using ffprobe."""
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(video_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            duration = float(result.stdout.strip())
            print(f"[FFprobe] Video duration: {duration}s")
            return duration
    except Exception as e:
        print(f"[FFprobe] Error getting duration: {e}")
    return 0.0


def concatenate_videos_with_transitions(
    input_paths: List[Path],
    clip_durations: List[float],
    transitions: List[dict],  # List of {fromIndex, toIndex, type, duration}
    output_path: Path,
    work_dir: Path
) -> None:
    """
    Concatenate videos with transitions using FFmpeg xfade filter.

    The xfade filter works by:
    1. Taking two input streams
    2. Applying a transition effect for a specified duration
    3. The offset is where the transition starts (end of first clip minus transition duration)

    For multiple clips with transitions, we need to chain xfade filters:
    [0][1]xfade=...[v01]; [v01][2]xfade=...[v012]; ...
    """
    if len(input_paths) == 1:
        # Single file - just copy
        shutil.copy(input_paths[0], output_path)
        return

    if not transitions:
        # No transitions - use regular concat
        concatenate_videos(input_paths, output_path, work_dir)
        return

    # Build transition map: fromIndex -> transition
    transition_map = {t['fromClipIndex']: t for t in transitions}

    # Check if all clips have transitions between them
    # If not all clips have transitions, we need a more complex approach
    has_all_transitions = all(i in transition_map for i in range(len(input_paths) - 1))

    if not has_all_transitions:
        # Mixed case: some transitions, some hard cuts
        # For simplicity, we'll process this in segments and then concat
        print(f"[Transitions] Mixed transitions detected, using segment-based approach")
        _concatenate_with_mixed_transitions(
            input_paths, clip_durations, transition_map, output_path, work_dir
        )
        return

    # All consecutive clips have transitions - use chained xfade
    print(f"[Transitions] All clips have transitions, using chained xfade")
    _concatenate_with_chained_xfade(
        input_paths, clip_durations, transition_map, output_path, work_dir
    )


def _concatenate_with_chained_xfade(
    input_paths: List[Path],
    clip_durations: List[float],
    transition_map: dict,
    output_path: Path,
    work_dir: Path
) -> None:
    """
    Concatenate all clips with xfade transitions between each pair.

    For N clips with transitions between all of them:
    - Input 0 and 1 get xfade -> v01
    - v01 and Input 2 get xfade -> v012
    - etc.

    The offset for each transition is calculated as:
    - For first transition: duration of clip 0 - transition_duration
    - For subsequent: accumulated_duration - transition_duration
    """
    n = len(input_paths)

    # Build FFmpeg inputs
    inputs = []
    for i, path in enumerate(input_paths):
        inputs.extend(["-i", str(path)])

    # Build filter_complex
    # For 2 clips: [0:v][1:v]xfade=transition=fade:duration=0.5:offset=4.5[outv]; [0:a][1:a]acrossfade=d=0.5[outa]
    # For 3 clips: [0:v][1:v]xfade=...:[v01]; [v01][2:v]xfade=...:[v012]

    filter_parts = []
    audio_filter_parts = []

    # Calculate running offset (accumulated duration minus transitions)
    running_duration = clip_durations[0]

    for i in range(n - 1):
        trans = transition_map.get(i)
        if not trans:
            trans = {'type': 'fade', 'duration': 0.5}

        trans_type = trans['type']
        trans_duration = trans['duration']

        # Calculate offset: where transition starts
        # For first transition: end of clip 0 minus transition duration
        # For subsequent: running duration minus transition duration
        if i == 0:
            offset = clip_durations[0] - trans_duration
        else:
            # Accumulated duration (minus previous transitions) minus this transition
            offset = running_duration - trans_duration

        # Video xfade
        if i == 0:
            # First transition: inputs are [0:v] and [1:v]
            in1 = "[0:v]"
            in2 = "[1:v]"
        else:
            # Subsequent: previous output and next input
            in1 = f"[v{i-1}]"
            in2 = f"[{i+1}:v]"

        # Output label
        if i == n - 2:
            # Last transition - final output
            out_label = "[outv]"
        else:
            out_label = f"[v{i}]"

        filter_parts.append(
            f"{in1}{in2}xfade=transition={trans_type}:duration={trans_duration}:offset={offset}{out_label}"
        )

        # Audio crossfade
        if i == 0:
            ain1 = "[0:a]"
            ain2 = "[1:a]"
        else:
            ain1 = f"[a{i-1}]"
            ain2 = f"[{i+1}:a]"

        if i == n - 2:
            aout_label = "[outa]"
        else:
            aout_label = f"[a{i}]"

        audio_filter_parts.append(
            f"{ain1}{ain2}acrossfade=d={trans_duration}{aout_label}"
        )

        # Update running duration: add next clip duration, subtract transition overlap
        running_duration = running_duration + clip_durations[i + 1] - trans_duration

    # Combine video and audio filters
    filter_complex = "; ".join(filter_parts + audio_filter_parts)

    print(f"[Transitions] Filter complex: {filter_complex[:500]}...")

    cmd = inputs + [
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-map", "[outa]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        str(output_path)
    ]

    run_ffmpeg(cmd)


def _concatenate_with_mixed_transitions(
    input_paths: List[Path],
    clip_durations: List[float],
    transition_map: dict,
    output_path: Path,
    work_dir: Path
) -> None:
    """
    Handle case where only some clips have transitions.

    Strategy:
    1. Group consecutive clips that have transitions between them
    2. Process each group with xfade
    3. Concat all processed groups with regular concat (hard cuts)
    """
    n = len(input_paths)
    segments = []  # List of (start_index, end_index, has_transitions)

    i = 0
    while i < n:
        start = i
        # Find consecutive clips with transitions
        while i < n - 1 and i in transition_map:
            i += 1
        end = i

        if start < end:
            # This segment has transitions
            segments.append((start, end + 1, True))  # end + 1 to include last clip
            i = end + 1
        else:
            # Single clip or clip without transition to next
            segments.append((start, start + 1, False))
            i += 1

    print(f"[Transitions] Segments: {segments}")

    # Process each segment
    processed_paths = []
    for seg_idx, (start, end, has_trans) in enumerate(segments):
        seg_paths = input_paths[start:end]
        seg_durations = clip_durations[start:end]

        if has_trans and len(seg_paths) > 1:
            # Extract relevant transitions
            seg_transitions = {
                idx - start: transition_map[idx]
                for idx in range(start, end - 1)
                if idx in transition_map
            }

            seg_output = work_dir / f"segment_{seg_idx}.mp4"
            _concatenate_with_chained_xfade(
                seg_paths, seg_durations, seg_transitions, seg_output, work_dir
            )
            processed_paths.append(seg_output)
        else:
            # Single clip or no transitions
            if len(seg_paths) == 1:
                processed_paths.append(seg_paths[0])
            else:
                # Multiple clips without transitions - regular concat
                seg_output = work_dir / f"segment_{seg_idx}.mp4"
                concatenate_videos(seg_paths, seg_output, work_dir)
                processed_paths.append(seg_output)

    # Final concat of all segments
    if len(processed_paths) == 1:
        shutil.copy(processed_paths[0], output_path)
    else:
        concatenate_videos(processed_paths, output_path, work_dir)


# Font mapping for FFmpeg
FONT_MAP = {
    "Inter": "/usr/share/fonts/custom/Inter-Regular.ttf",
    "Montserrat": "/usr/share/fonts/custom/Montserrat-Regular.ttf",
    "Roboto": "/usr/share/fonts/custom/Roboto-Regular.ttf",
    "Playfair Display": "/usr/share/fonts/custom/PlayfairDisplay-Regular.ttf",
    "Oswald": "/usr/share/fonts/custom/Oswald-Regular.ttf",
    "Open Sans": "/usr/share/fonts/custom/OpenSans-Regular.ttf",
    "Lato": "/usr/share/fonts/custom/Lato-Regular.ttf",
    "Poppins": "/usr/share/fonts/custom/Poppins-Regular.ttf",
}

FONT_BOLD_MAP = {
    "Inter": "/usr/share/fonts/custom/Inter-Bold.ttf",
    "Montserrat": "/usr/share/fonts/custom/Montserrat-Bold.ttf",
    "Roboto": "/usr/share/fonts/custom/Roboto-Bold.ttf",
    "Playfair Display": "/usr/share/fonts/custom/PlayfairDisplay-Bold.ttf",
    "Oswald": "/usr/share/fonts/custom/Oswald-Bold.ttf",
    "Open Sans": "/usr/share/fonts/custom/OpenSans-Bold.ttf",
    "Lato": "/usr/share/fonts/custom/Lato-Bold.ttf",
    "Poppins": "/usr/share/fonts/custom/Poppins-Bold.ttf",
}

FONT_LIGHT_MAP = {
    "Inter": "/usr/share/fonts/custom/Inter-Light.ttf",
    "Montserrat": "/usr/share/fonts/custom/Montserrat-Light.ttf",
    "Roboto": "/usr/share/fonts/custom/Roboto-Light.ttf",
    "Playfair Display": "/usr/share/fonts/custom/PlayfairDisplay-Regular.ttf",  # No light variant
    "Oswald": "/usr/share/fonts/custom/Oswald-Light.ttf",
    "Open Sans": "/usr/share/fonts/custom/OpenSans-Light.ttf",
    "Lato": "/usr/share/fonts/custom/Lato-Light.ttf",
    "Poppins": "/usr/share/fonts/custom/Poppins-Light.ttf",
}


def get_font_path(font_family: str, weight: str) -> str:
    """
    Get the font file path based on family and weight.
    Returns a tuple of (path, is_fallback) to track if we're using a fallback font.
    """
    # Select the appropriate font map based on weight
    if weight == "bold":
        font_map = FONT_BOLD_MAP
        dejavu_fallback = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    elif weight == "light":
        font_map = FONT_LIGHT_MAP
        dejavu_fallback = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"  # No light variant
    else:
        font_map = FONT_MAP
        dejavu_fallback = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

    # Try to get the requested font
    font_path = font_map.get(font_family)

    if font_path:
        # Verify font file exists and is valid (> 1KB to filter out error pages)
        try:
            if Path(font_path).exists() and Path(font_path).stat().st_size > 1000:
                print(f"[Font] Using {font_family} {weight}: {font_path}")
                return font_path
            else:
                print(f"[Font] Font file missing or invalid: {font_path}")
        except Exception as e:
            print(f"[Font] Error checking font file {font_path}: {e}")

    # Fall back to regular weight of same family if bold/light not found
    if weight in ("bold", "light"):
        regular_path = FONT_MAP.get(font_family)
        if regular_path:
            try:
                if Path(regular_path).exists() and Path(regular_path).stat().st_size > 1000:
                    print(f"[Font] Falling back to {font_family} regular: {regular_path}")
                    return regular_path
            except Exception as e:
                print(f"[Font] Error checking regular font {regular_path}: {e}")

    # Final fallback to DejaVu
    print(f"[Font] Using DejaVu fallback for {font_family} {weight}: {dejavu_fallback}")
    return dejavu_fallback


def hex_to_ffmpeg_color(color: str) -> tuple[str, float]:
    """
    Convert color to FFmpeg format.
    Supports: #FFFFFF, rgba(0,0,0,0.7)
    Returns: (color_hex, opacity)
    """
    color = color.strip()

    # Handle rgba() format
    if color.startswith('rgba('):
        try:
            # Extract rgba values: rgba(0,0,0,0.7)
            inner = color[5:-1]  # Remove 'rgba(' and ')'
            parts = [p.strip() for p in inner.split(',')]
            r, g, b = int(parts[0]), int(parts[1]), int(parts[2])
            a = float(parts[3])
            hex_color = f"0x{r:02X}{g:02X}{b:02X}"
            return hex_color, a
        except (ValueError, IndexError):
            return "0x000000", 1.0

    # Handle rgb() format
    if color.startswith('rgb('):
        try:
            inner = color[4:-1]
            parts = [p.strip() for p in inner.split(',')]
            r, g, b = int(parts[0]), int(parts[1]), int(parts[2])
            hex_color = f"0x{r:02X}{g:02X}{b:02X}"
            return hex_color, 1.0
        except (ValueError, IndexError):
            return "0x000000", 1.0

    # Handle hex format (#FFFFFF or FFFFFF)
    hex_color = color.lstrip('#')
    return f"0x{hex_color}", 1.0


def escape_text_for_drawtext(text: str) -> str:
    """
    Escape special characters for FFmpeg drawtext filter.

    For multiline text, we use a text file instead (see build_drawtext_filter).
    This function handles single-line text escaping.
    """
    # FFmpeg drawtext needs special escaping
    text = text.replace("\\", "\\\\\\\\")  # Backslash
    text = text.replace("'", "\\\\'")  # Single quote
    text = text.replace(":", "\\\\:")  # Colon
    text = text.replace("[", "\\\\[")  # Brackets
    text = text.replace("]", "\\\\]")
    text = text.replace("%", "\\\\%")  # Percent
    return text


def split_text_into_lines(text: str) -> list[str]:
    """Split text into lines, normalizing line endings."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text.split("\n")


def remap_overlay_times_to_concatenated_timeline(
    overlays: List[TextOverlay],
    sorted_clips: List[VideoClip],
    transitions: Optional[List] = None
) -> List[TextOverlay]:
    """
    Remap text overlay times from editor timeline to concatenated video timeline.

    The editor timeline has clips positioned with gaps (based on clip.startTime),
    but the concatenated video has clips joined sequentially with no gaps.

    This function calculates where each overlay should appear in the final video.

    Args:
        overlays: List of text overlays with editor timeline positions
        sorted_clips: Clips sorted by their editor timeline startTime
        transitions: Optional list of transitions (affects timing due to overlap)

    Returns:
        New list of TextOverlay objects with adjusted startTime values
    """
    if not overlays or not sorted_clips:
        return overlays or []

    # Build a mapping from editor timeline to concatenated timeline
    # For each clip, we need:
    # - editor_start: when it starts in the editor timeline
    # - editor_end: when it ends in the editor timeline
    # - concat_start: when it starts in the concatenated video
    # - concat_end: when it ends in the concatenated video

    clip_mappings = []
    concat_position = 0.0

    for i, clip in enumerate(sorted_clips):
        effective_duration = clip.sourceDuration - clip.trimStart - clip.trimEnd
        editor_start = clip.startTime
        editor_end = editor_start + effective_duration

        # Check if there's a transition INTO this clip (reduces concat position)
        transition_offset = 0.0
        if transitions and i > 0:
            for trans in transitions:
                if trans.get('toClipIndex') == i or (hasattr(trans, 'toClipIndex') and trans.toClipIndex == i):
                    duration = trans.get('duration', 0) if isinstance(trans, dict) else trans.duration
                    transition_offset = duration
                    break

        # Adjust concat position for transition overlap
        concat_start = max(0, concat_position - transition_offset)
        concat_end = concat_start + effective_duration

        clip_mappings.append({
            'clip_index': i,
            'editor_start': editor_start,
            'editor_end': editor_end,
            'concat_start': concat_start,
            'concat_end': concat_end,
            'effective_duration': effective_duration,
        })

        # Move concat position forward (accounting for transition overlap already applied)
        concat_position = concat_end

    print(f"[TimeRemap] Clip timeline mappings:")
    for m in clip_mappings:
        print(f"[TimeRemap]   Clip {m['clip_index']}: editor [{m['editor_start']:.2f}-{m['editor_end']:.2f}] -> concat [{m['concat_start']:.2f}-{m['concat_end']:.2f}]")

    # Now remap each overlay
    remapped_overlays = []

    for overlay in overlays:
        original_start = overlay.startTime
        original_end = original_start + overlay.duration

        # Find which clip(s) this overlay belongs to based on editor timeline
        # An overlay might span multiple clips, so we use the start time to anchor it
        matched_clip = None
        for mapping in clip_mappings:
            # Check if overlay starts within this clip's editor timeline span
            if mapping['editor_start'] <= original_start < mapping['editor_end']:
                matched_clip = mapping
                break

        if matched_clip is None:
            # Overlay starts before first clip or after last clip
            # Try to find the closest clip
            if original_start < clip_mappings[0]['editor_start']:
                matched_clip = clip_mappings[0]
                print(f"[TimeRemap] Overlay '{overlay.text[:20]}...' starts before first clip, anchoring to clip 0")
            else:
                matched_clip = clip_mappings[-1]
                print(f"[TimeRemap] Overlay '{overlay.text[:20]}...' starts after last clip, anchoring to last clip")

        # Calculate the offset within the clip (in editor timeline)
        offset_within_clip = original_start - matched_clip['editor_start']

        # Apply same offset in concatenated timeline
        new_start = matched_clip['concat_start'] + offset_within_clip

        # Clamp to valid range (0 to total duration)
        total_concat_duration = clip_mappings[-1]['concat_end']
        new_start = max(0, min(new_start, total_concat_duration - 0.1))

        # Ensure duration doesn't extend past video end
        new_duration = min(overlay.duration, total_concat_duration - new_start)

        print(f"[TimeRemap] Overlay '{overlay.text[:30]}': editor {original_start:.2f}s -> concat {new_start:.2f}s (clip {matched_clip['clip_index']}, offset {offset_within_clip:.2f}s)")

        # Create new overlay with adjusted times
        remapped_overlay = TextOverlay(
            id=overlay.id,
            startTime=new_start,
            duration=new_duration,
            text=overlay.text,
            position=overlay.position,
            style=overlay.style,
        )
        remapped_overlays.append(remapped_overlay)

    return remapped_overlays


def build_drawtext_filters(
    overlay: TextOverlay,
    video_width: int,
    video_height: int,
    preview_width: int = 400,  # Approximate preview width in the web editor
) -> list[str]:
    """
    Build FFmpeg drawtext filter strings for a text overlay.

    Returns a LIST of filter strings - one per line for multiline text.
    This approach handles newlines reliably by rendering each line separately.

    Position values (x, y) are percentages (0-100) where:
    - x=0 is left edge, x=100 is right edge
    - y=0 is top edge, y=100 is bottom edge
    - x=50, y=50 is center of the video
    """
    style = overlay.style

    # Get font path (includes validation and fallback logic)
    font_path = get_font_path(style.fontFamily, style.fontWeight)

    # Calculate position in pixels from percentage
    pos = overlay.position
    x_pct = pos.get('x', 50) if isinstance(pos, dict) else getattr(pos, 'x', 50)
    y_pct = pos.get('y', 50) if isinstance(pos, dict) else getattr(pos, 'y', 50)

    try:
        x_pct = float(x_pct)
        y_pct = float(y_pct)
    except (TypeError, ValueError):
        print(f"[Warning] Invalid position values: x={x_pct}, y={y_pct}. Using center.")
        x_pct = 50.0
        y_pct = 50.0

    x_pos = int((x_pct / 100) * video_width)
    y_pos = int((y_pct / 100) * video_height)

    # Scale font size and padding proportionally to video resolution
    scale_factor = video_width / preview_width
    scaled_font_size = int(style.fontSize * scale_factor)
    scaled_padding = int((style.backgroundPadding or 0) * scale_factor)

    # Line height with some spacing (typically 1.2x font size)
    line_height = int(scaled_font_size * 1.2)

    print(f"[Font] Family: {style.fontFamily}, Weight: {style.fontWeight}, Path: {font_path}")
    print(f"[Font] Original size: {style.fontSize}px, Scale: {scale_factor:.2f}, Scaled: {scaled_font_size}px")
    print(f"[Position] x={x_pct}% -> {x_pos}px, y={y_pct}% -> {y_pos}px (video: {video_width}x{video_height})")

    # Color conversion
    font_color, font_color_opacity = hex_to_ffmpeg_color(style.color)
    final_font_opacity = style.opacity * font_color_opacity

    # Background color
    bg_color, bg_opacity, final_bg_opacity = None, None, None
    if style.backgroundColor:
        bg_color, bg_opacity = hex_to_ffmpeg_color(style.backgroundColor)
        final_bg_opacity = style.opacity * bg_opacity

    # Timing
    end_time = overlay.startTime + overlay.duration

    # Split text into lines
    lines = split_text_into_lines(overlay.text)
    num_lines = len(lines)

    print(f"[TextOverlay] {num_lines} line(s): {lines}")

    # Calculate total text block height to center it on y_pos
    total_height = num_lines * line_height
    # Starting Y position (top of first line, adjusted to center the block)
    start_y = y_pos - (total_height // 2) + (line_height // 2)

    filters = []
    for i, line_text in enumerate(lines):
        if not line_text.strip():
            # Skip empty lines but account for spacing
            continue

        escaped_text = escape_text_for_drawtext(line_text)

        # Calculate Y position for this line
        line_y = start_y + (i * line_height)

        filter_parts = [
            f"drawtext=text='{escaped_text}'",
            f"fontfile='{font_path}'",
            f"fontsize={scaled_font_size}",
            f"fontcolor={font_color}@{final_font_opacity}",
        ]

        # X position - always center on anchor point
        filter_parts.append(f"x={x_pos}-(tw/2)")

        # Y position for this specific line
        filter_parts.append(f"y={line_y}-(th/2)")

        # Background box if specified
        if bg_color:
            filter_parts.append(f"box=1")
            filter_parts.append(f"boxcolor={bg_color}@{final_bg_opacity}")
            filter_parts.append(f"boxborderw={scaled_padding}")

        # Timing
        filter_parts.append(f"enable='between(t,{overlay.startTime},{end_time})'")

        filters.append(":".join(filter_parts))
        print(f"[TextOverlay] Line {i+1} filter: y={line_y}")

    return filters


def get_video_dimensions(video_path: Path) -> tuple[int, int]:
    """
    Get video dimensions using ffprobe.
    Returns: (width, height)
    """
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=p=0",
            str(video_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            parts = result.stdout.strip().split(',')
            if len(parts) >= 2:
                width = int(parts[0])
                height = int(parts[1])
                print(f"[FFprobe] Video dimensions: {width}x{height}")
                return width, height
    except Exception as e:
        print(f"[FFprobe] Error getting dimensions: {e}")

    # Fallback to common dimensions
    print("[FFprobe] Using fallback dimensions: 1920x1080")
    return 1920, 1080


def apply_text_overlays(
    input_path: Path,
    output_path: Path,
    overlays: List[TextOverlay],
    video_width: int = None,
    video_height: int = None,
    preview_width: int = None,
    preview_height: int = None,
) -> None:
    """
    Apply text overlays to a video using FFmpeg drawtext filters.

    Handles multiline text by rendering each line as a separate filter,
    stacked vertically and centered on the anchor point.

    Args:
        input_path: Input video file
        output_path: Output video file
        overlays: List of text overlays to apply
        video_width: Actual video width (auto-detected if not provided)
        video_height: Actual video height (auto-detected if not provided)
        preview_width: Width of the preview container in the web editor
        preview_height: Height of the preview container in the web editor
    """
    if not overlays:
        # No overlays, just copy the file
        shutil.copy(input_path, output_path)
        return

    # Auto-detect video dimensions if not provided
    if video_width is None or video_height is None:
        video_width, video_height = get_video_dimensions(input_path)

    # Use default preview width if not provided
    if preview_width is None:
        preview_width = 400  # Default fallback

    print(f"[TextOverlay] Applying {len(overlays)} overlays to video ({video_width}x{video_height})")
    print(f"[TextOverlay] Preview dimensions: {preview_width}x{preview_height}")

    # Build filter complex with all text overlays chained together
    # Note: build_drawtext_filters returns a LIST of filters (one per line for multiline text)
    all_filters = []
    for i, overlay in enumerate(overlays):
        filters = build_drawtext_filters(overlay, video_width, video_height, preview_width)
        print(f"[TextOverlay] Overlay {i+1}: {len(filters)} filter(s)")
        all_filters.extend(filters)

    # Chain all filters together
    filter_complex = ",".join(all_filters)
    print(f"[TextOverlay] Full filter complex length: {len(filter_complex)} chars")

    run_ffmpeg([
        "-i", str(input_path),
        "-vf", filter_complex,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-c:a", "copy",
        str(output_path)
    ])


# ============================================
# Endpoints
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    # Verify FFmpeg is available
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True
        )
        ffmpeg_available = result.returncode == 0
    except FileNotFoundError:
        ffmpeg_available = False

    return {
        "status": "healthy",
        "ffmpeg": ffmpeg_available,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/debug/fonts")
async def debug_fonts():
    """Debug endpoint to check font availability."""
    font_status = {}

    # Check all fonts in the maps
    all_fonts = {
        **{f"regular/{k}": v for k, v in FONT_MAP.items()},
        **{f"bold/{k}": v for k, v in FONT_BOLD_MAP.items()},
        **{f"light/{k}": v for k, v in FONT_LIGHT_MAP.items()},
    }

    for name, path in all_fonts.items():
        try:
            font_path = Path(path)
            if font_path.exists():
                size = font_path.stat().st_size
                font_status[name] = {
                    "path": path,
                    "exists": True,
                    "size_bytes": size,
                    "valid": size > 1000,  # Valid if > 1KB
                }
            else:
                font_status[name] = {
                    "path": path,
                    "exists": False,
                    "size_bytes": 0,
                    "valid": False,
                }
        except Exception as e:
            font_status[name] = {
                "path": path,
                "exists": False,
                "error": str(e),
                "valid": False,
            }

    # Check DejaVu fallback
    dejavu_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in dejavu_paths:
        try:
            font_path = Path(path)
            if font_path.exists():
                size = font_path.stat().st_size
                font_status[f"fallback/{Path(path).stem}"] = {
                    "path": path,
                    "exists": True,
                    "size_bytes": size,
                    "valid": size > 1000,
                }
            else:
                font_status[f"fallback/{Path(path).stem}"] = {
                    "path": path,
                    "exists": False,
                    "valid": False,
                }
        except Exception as e:
            font_status[f"fallback/{Path(path).stem}"] = {
                "path": path,
                "error": str(e),
                "valid": False,
            }

    # Summary
    valid_count = sum(1 for f in font_status.values() if f.get("valid", False))
    total_count = len(font_status)

    return {
        "summary": f"{valid_count}/{total_count} fonts available",
        "fonts": font_status,
    }


@app.post("/video/export", response_model=VideoExportResponse)
async def export_video(request: VideoExportRequest):
    """
    Export video by trimming and concatenating clips, then applying text overlays.

    Uses lossless stream copy (-c copy) for concatenation to preserve original quality.
    Text overlays are rendered using FFmpeg drawtext filter.
    Uploads result to Supabase storage and creates media_files record.
    """
    start_time = datetime.now()
    job_id = str(uuid.uuid4())[:8]
    work_dir = WORK_DIR / job_id

    text_overlay_count = len(request.textOverlays) if request.textOverlays else 0
    transition_count = len(request.transitions) if request.transitions else 0
    print(f"[Export:{job_id}] Starting export with {len(request.clips)} clips, {text_overlay_count} text overlays, and {transition_count} transitions")

    try:
        # Create work directory
        work_dir.mkdir(parents=True, exist_ok=True)

        # Sort clips by timeline position
        sorted_clips = sorted(request.clips, key=lambda c: c.startTime)

        # Step 1: Download all videos
        print(f"[Export:{job_id}] Step 1: Downloading videos...")
        downloaded_paths: List[Path] = []

        for i, clip in enumerate(sorted_clips):
            input_path = work_dir / f"input_{i}.mp4"
            await download_file(clip.sourceUrl, input_path)
            downloaded_paths.append(input_path)

        # Step 2: Trim each video (if needed)
        print(f"[Export:{job_id}] Step 2: Trimming videos...")
        trimmed_paths: List[Path] = []

        for i, clip in enumerate(sorted_clips):
            input_path = downloaded_paths[i]
            effective_duration = clip.sourceDuration - clip.trimStart - clip.trimEnd

            if clip.trimStart > 0 or clip.trimEnd > 0:
                # Need to trim
                trimmed_path = work_dir / f"trimmed_{i}.mp4"
                print(f"[Export:{job_id}] Trimming clip {i+1}: start={clip.trimStart}, duration={effective_duration}")
                trim_video(input_path, trimmed_path, clip.trimStart, effective_duration)
                trimmed_paths.append(trimmed_path)
            else:
                # No trim needed
                trimmed_paths.append(input_path)

        # Calculate clip durations for transition offset calculations
        clip_durations = [
            clip.sourceDuration - clip.trimStart - clip.trimEnd
            for clip in sorted_clips
        ]

        # Step 3: Concatenate all videos (with transitions if specified)
        print(f"[Export:{job_id}] Step 3: Concatenating videos...")
        concat_output_path = work_dir / "concat_output.mp4"

        if request.transitions and len(request.transitions) > 0:
            print(f"[Export:{job_id}] Using transition-aware concatenation with {len(request.transitions)} transitions")
            for trans in request.transitions:
                print(f"[Export:{job_id}]   Transition: {trans.type} ({trans.duration}s) between clips {trans.fromClipIndex} and {trans.toClipIndex}")

            # Convert Pydantic models to dicts for processing
            transitions_list = [
                {
                    'fromClipIndex': t.fromClipIndex,
                    'toClipIndex': t.toClipIndex,
                    'type': t.type,
                    'duration': t.duration
                }
                for t in request.transitions
            ]

            concatenate_videos_with_transitions(
                trimmed_paths,
                clip_durations,
                transitions_list,
                concat_output_path,
                work_dir
            )
        else:
            print(f"[Export:{job_id}] No transitions, using simple concatenation")
            concatenate_videos(trimmed_paths, concat_output_path, work_dir)

        # Step 4: Apply text overlays (if any)
        output_path = work_dir / "output.mp4"
        if request.textOverlays and len(request.textOverlays) > 0:
            print(f"[Export:{job_id}] Step 4: Applying {len(request.textOverlays)} text overlays...")

            # Get preview dimensions from request
            preview_width = request.previewDimensions.width if request.previewDimensions else None
            preview_height = request.previewDimensions.height if request.previewDimensions else None
            print(f"[Export:{job_id}] Preview dimensions from request: {preview_width}x{preview_height}")

            # CRITICAL: Remap overlay times from editor timeline to concatenated video timeline
            # The editor timeline has gaps between clips, but the concatenated video is seamless
            print(f"[Export:{job_id}] Remapping overlay times from editor timeline to concatenated timeline...")
            transitions_for_remap = None
            if request.transitions:
                transitions_for_remap = [
                    {
                        'fromClipIndex': t.fromClipIndex,
                        'toClipIndex': t.toClipIndex,
                        'type': t.type,
                        'duration': t.duration
                    }
                    for t in request.transitions
                ]
            remapped_overlays = remap_overlay_times_to_concatenated_timeline(
                request.textOverlays,
                sorted_clips,
                transitions_for_remap
            )

            for i, overlay in enumerate(remapped_overlays):
                text_preview = overlay.text[:30] if len(overlay.text) > 30 else overlay.text
                original_start = request.textOverlays[i].startTime
                print(f"[Export:{job_id}]   Overlay {i+1}: text='{text_preview}', editor_time={original_start:.2f}s -> concat_time={overlay.startTime:.2f}s, duration={overlay.duration:.2f}s")

                # Detailed position logging
                pos = overlay.position
                print(f"[Export:{job_id}]   Position raw: {pos} (type={type(pos).__name__})")
                if isinstance(pos, dict):
                    x_val = pos.get('x', 'MISSING')
                    y_val = pos.get('y', 'MISSING')
                    print(f"[Export:{job_id}]   Position parsed: x={x_val} (type={type(x_val).__name__}), y={y_val} (type={type(y_val).__name__})")
                else:
                    print(f"[Export:{job_id}]   Position is not a dict!")

                # Detailed style logging
                style = overlay.style
                print(f"[Export:{job_id}]   Style raw: fontFamily={style.fontFamily}, fontSize={style.fontSize}, fontWeight={style.fontWeight}")
                print(f"[Export:{job_id}]   Style raw: color={style.color}, textAlign={style.textAlign}, opacity={style.opacity}")
                print(f"[Export:{job_id}]   Style raw: bgColor={style.backgroundColor}, bgPadding={style.backgroundPadding}")

            # Auto-detect video dimensions and apply overlays with preview dimensions for proper scaling
            apply_text_overlays(
                concat_output_path,
                output_path,
                remapped_overlays,  # Use remapped overlays with corrected times
                preview_width=preview_width,
                preview_height=preview_height,
            )
        else:
            print(f"[Export:{job_id}] Step 4: No text overlays to apply, using concatenated output...")
            shutil.copy(concat_output_path, output_path)

        # Get output file size
        output_size = output_path.stat().st_size
        print(f"[Export:{job_id}] Output file size: {output_size} bytes ({output_size / (1024*1024):.1f} MB)")

        # Step 5: Upload to storage (GCS for large files, Supabase for smaller)
        supabase = get_supabase_client()
        timestamp = int(datetime.now().timestamp() * 1000)
        storage_path = f"{request.userId}/{request.companyId or 'default'}/{timestamp}_export.mp4"

        # Choose storage based on file size
        if output_size > GCS_LARGE_FILE_THRESHOLD:
            # Large file: use GCS
            print(f"[Export:{job_id}] Step 5: File > 50MB, uploading to GCS...")
            public_url = upload_to_gcs(output_path, storage_path)
            storage_type = "gcs"
            print(f"[Export:{job_id}] Uploaded to GCS: {storage_path}")
        else:
            # Normal file: use Supabase
            print(f"[Export:{job_id}] Step 5: Uploading to Supabase storage...")
            with open(output_path, "rb") as f:
                output_data = f.read()

            upload_result = supabase.storage.from_("media-studio-videos").upload(
                storage_path,
                output_data,
                file_options={"content-type": "video/mp4"}
            )

            public_url = supabase.storage.from_("media-studio-videos").get_public_url(storage_path)
            storage_type = "supabase"
            print(f"[Export:{job_id}] Uploaded to Supabase: {public_url}")

        # Step 6: Create media_files record
        print(f"[Export:{job_id}] Step 6: Creating media record...")
        safe_name = "".join(c for c in (request.projectName or "Exported Video") if c.isalnum() or c in " -_")

        # Calculate total duration
        total_duration = sum(
            clip.sourceDuration - clip.trimStart - clip.trimEnd
            for clip in sorted_clips
        )

        media_record = {
            "user_id": request.userId,
            "company_id": request.companyId if request.companyId else None,
            "file_name": f"{safe_name}.mp4",
            "file_type": "video",
            "file_format": "mp4",
            "file_size": output_size,
            "storage_path": storage_path,
            "public_url": public_url,
            "duration": int(total_duration),
            "prompt": f"Edited video: {safe_name}",
            "model_used": "editor-export",
        }

        result = supabase.table("media_files").insert(media_record).execute()
        media_file_id = result.data[0]["id"] if result.data else None

        # Calculate processing time
        processing_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        print(f"[Export:{job_id}] Complete in {processing_time_ms}ms (storage: {storage_type})")

        return VideoExportResponse(
            success=True,
            videoUrl=public_url,
            storagePath=storage_path,
            fileSize=output_size,
            mediaFileId=media_file_id,
            processingTimeMs=processing_time_ms,
            storageType=storage_type
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Export:{job_id}] Error: {str(e)}")
        return VideoExportResponse(
            success=False,
            error=str(e)
        )
    finally:
        # Cleanup work directory
        if work_dir.exists():
            shutil.rmtree(work_dir, ignore_errors=True)
            print(f"[Export:{job_id}] Cleaned up work directory")


# ============================================
# AUDIO PROCESSING MODELS
# ============================================

class AudioExtractRequest(BaseModel):
    """Request to extract audio from a video file."""
    videoUrl: str
    userId: str
    outputFormat: str = "mp3"  # "mp3" or "wav"


class AudioExtractResponse(BaseModel):
    """Response from audio extraction."""
    success: bool
    audioUrl: Optional[str] = None
    duration: Optional[float] = None
    fileSize: Optional[int] = None
    error: Optional[str] = None


class TranscriptSegment(BaseModel):
    """A single segment of transcribed text with timing."""
    start: float
    end: float
    text: str


class TranscribeRequest(BaseModel):
    """Request to transcribe audio to text using Whisper."""
    audioUrl: str  # URL to audio file (can also be video URL)
    userId: str
    language: Optional[str] = None  # Auto-detect if not specified


class TranscribeResponse(BaseModel):
    """Response from transcription."""
    success: bool
    srtUrl: Optional[str] = None
    transcript: Optional[str] = None
    segments: Optional[List[TranscriptSegment]] = None
    duration: Optional[float] = None
    language: Optional[str] = None
    error: Optional[str] = None


# ============================================
# AUDIO PROCESSING HELPERS
# ============================================

def extract_audio_ffmpeg(input_path: Path, output_path: Path, output_format: str = "mp3") -> float:
    """
    Extract audio from video using FFmpeg.
    Returns the audio duration in seconds.
    """
    if output_format == "mp3":
        codec_args = ["-acodec", "libmp3lame", "-q:a", "2"]
    else:  # wav
        codec_args = ["-acodec", "pcm_s16le"]

    run_ffmpeg([
        "-i", str(input_path),
        "-vn",  # No video
        *codec_args,
        "-ar", "16000",  # 16kHz sample rate (good for speech recognition)
        "-ac", "1",  # Mono (better for speech recognition)
        str(output_path)
    ])

    # Get duration
    return get_video_duration_ffprobe(output_path)


def segments_to_srt(segments: List[dict]) -> str:
    """
    Convert Whisper segments to SRT subtitle format.
    """
    srt_lines = []

    for i, segment in enumerate(segments, 1):
        start_time = segment['start']
        end_time = segment['end']
        text = segment['text'].strip()

        # Format timestamps as HH:MM:SS,mmm
        def format_srt_time(seconds: float) -> str:
            hours = int(seconds // 3600)
            minutes = int((seconds % 3600) // 60)
            secs = int(seconds % 60)
            millis = int((seconds % 1) * 1000)
            return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

        srt_lines.append(str(i))
        srt_lines.append(f"{format_srt_time(start_time)} --> {format_srt_time(end_time)}")
        srt_lines.append(text)
        srt_lines.append("")  # Empty line between entries

    return "\n".join(srt_lines)


async def transcribe_with_whisper(audio_path: Path, language: Optional[str] = None) -> dict:
    """
    Transcribe audio using OpenAI Whisper API.
    Returns dict with: transcript, segments, language, duration
    """
    import httpx

    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    # Read audio file
    with open(audio_path, "rb") as f:
        audio_data = f.read()

    # Prepare multipart form data
    files = {
        "file": (audio_path.name, audio_data, "audio/mpeg"),
    }
    data = {
        "model": "whisper-1",
        "response_format": "verbose_json",  # Get word-level timestamps
        "timestamp_granularities[]": "segment",
    }

    if language:
        data["language"] = language

    print(f"[Whisper] Transcribing {audio_path.name} ({len(audio_data)} bytes)")

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {openai_api_key}"},
            files=files,
            data=data,
        )

        if response.status_code != 200:
            error_text = response.text
            print(f"[Whisper] Error: {response.status_code} - {error_text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Whisper API error: {error_text}"
            )

        result = response.json()
        print(f"[Whisper] Transcription complete: {len(result.get('text', ''))} chars")

        return {
            "transcript": result.get("text", ""),
            "segments": result.get("segments", []),
            "language": result.get("language", "unknown"),
            "duration": result.get("duration", 0),
        }


# ============================================
# AUDIO PROCESSING ENDPOINTS
# ============================================

@app.post("/audio/extract", response_model=AudioExtractResponse)
async def extract_audio(request: AudioExtractRequest):
    """
    Extract audio track from a video file.

    Supports MP3 (smaller, lossy) or WAV (larger, lossless) output.
    Audio is converted to 16kHz mono for optimal speech recognition compatibility.
    """
    job_id = str(uuid.uuid4())[:8]
    work_dir = WORK_DIR / f"audio_{job_id}"

    print(f"[AudioExtract:{job_id}] Starting audio extraction from {request.videoUrl}")

    try:
        work_dir.mkdir(parents=True, exist_ok=True)

        # Download video
        input_path = work_dir / "input.mp4"
        await download_file(request.videoUrl, input_path)

        # Extract audio
        ext = request.outputFormat.lower()
        if ext not in ["mp3", "wav"]:
            ext = "mp3"

        output_path = work_dir / f"audio.{ext}"
        duration = extract_audio_ffmpeg(input_path, output_path, ext)

        # Get file size
        file_size = output_path.stat().st_size
        print(f"[AudioExtract:{job_id}] Extracted audio: {duration:.1f}s, {file_size} bytes")

        # Upload to Supabase storage
        supabase = get_supabase_client()
        timestamp = int(datetime.now().timestamp() * 1000)
        storage_path = f"{request.userId}/audio/{timestamp}_extracted.{ext}"

        with open(output_path, "rb") as f:
            audio_data = f.read()

        supabase.storage.from_("media-studio-videos").upload(
            storage_path,
            audio_data,
            file_options={"content-type": f"audio/{ext}"}
        )

        public_url = supabase.storage.from_("media-studio-videos").get_public_url(storage_path)
        print(f"[AudioExtract:{job_id}] Uploaded to: {public_url}")

        return AudioExtractResponse(
            success=True,
            audioUrl=public_url,
            duration=duration,
            fileSize=file_size,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[AudioExtract:{job_id}] Error: {str(e)}")
        return AudioExtractResponse(
            success=False,
            error=str(e),
        )
    finally:
        if work_dir.exists():
            shutil.rmtree(work_dir, ignore_errors=True)


@app.post("/audio/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(request: TranscribeRequest):
    """
    Transcribe audio to text using OpenAI Whisper.

    Accepts either audio or video URLs. If a video URL is provided,
    audio will be extracted first before transcription.

    Returns:
    - Full transcript text
    - Timestamped segments for subtitle generation
    - SRT file URL for use in video export
    """
    job_id = str(uuid.uuid4())[:8]
    work_dir = WORK_DIR / f"transcribe_{job_id}"

    print(f"[Transcribe:{job_id}] Starting transcription from {request.audioUrl}")

    try:
        work_dir.mkdir(parents=True, exist_ok=True)

        # Download the audio/video file
        input_path = work_dir / "input"
        await download_file(request.audioUrl, input_path)

        # Check if it's a video file (extract audio if needed)
        audio_path = work_dir / "audio.mp3"

        # Try to extract audio (works for both video and audio files)
        try:
            extract_audio_ffmpeg(input_path, audio_path, "mp3")
        except Exception as e:
            print(f"[Transcribe:{job_id}] Audio extraction failed, assuming input is already audio: {e}")
            # If extraction fails, assume input is already audio
            audio_path = input_path

        # Transcribe with Whisper
        result = await transcribe_with_whisper(audio_path, request.language)

        # Convert segments to our format
        segments = [
            TranscriptSegment(
                start=seg['start'],
                end=seg['end'],
                text=seg['text'].strip()
            )
            for seg in result['segments']
        ]

        # Generate SRT content
        srt_content = segments_to_srt(result['segments'])

        # Upload SRT to storage
        supabase = get_supabase_client()
        timestamp = int(datetime.now().timestamp() * 1000)
        srt_path = f"{request.userId}/captions/{timestamp}_captions.srt"

        supabase.storage.from_("media-studio-videos").upload(
            srt_path,
            srt_content.encode('utf-8'),
            file_options={"content-type": "text/plain"}
        )

        srt_url = supabase.storage.from_("media-studio-videos").get_public_url(srt_path)
        print(f"[Transcribe:{job_id}] SRT uploaded to: {srt_url}")

        return TranscribeResponse(
            success=True,
            srtUrl=srt_url,
            transcript=result['transcript'],
            segments=segments,
            duration=result['duration'],
            language=result['language'],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Transcribe:{job_id}] Error: {str(e)}")
        return TranscribeResponse(
            success=False,
            error=str(e),
        )
    finally:
        if work_dir.exists():
            shutil.rmtree(work_dir, ignore_errors=True)


# ============================================
# Main
# ============================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
