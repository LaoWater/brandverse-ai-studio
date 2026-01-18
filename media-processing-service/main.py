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

# ============================================
# Configuration
# ============================================

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
WORK_DIR = Path("/tmp/media-processing")

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


class VideoExportRequest(BaseModel):
    clips: List[VideoClip]
    textOverlays: Optional[List[TextOverlay]] = None
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
    """Escape special characters for FFmpeg drawtext filter."""
    # FFmpeg drawtext needs special escaping
    text = text.replace("\\", "\\\\\\\\")  # Backslash
    text = text.replace("'", "\\\\'")  # Single quote
    text = text.replace(":", "\\\\:")  # Colon
    text = text.replace("[", "\\\\[")  # Brackets
    text = text.replace("]", "\\\\]")
    text = text.replace("%", "\\\\%")  # Percent
    return text


def build_drawtext_filter(
    overlay: TextOverlay,
    video_width: int,
    video_height: int,
    preview_width: int = 400  # Approximate preview width in the web editor
) -> str:
    """
    Build FFmpeg drawtext filter string for a text overlay.

    The web preview shows text at CSS pixels relative to a ~400px wide container.
    We need to scale the font size proportionally to the actual video resolution.

    Position values (x, y) are percentages (0-100) where:
    - x=0 is left edge, x=100 is right edge
    - y=0 is top edge, y=100 is bottom edge
    - x=50, y=50 is center of the video

    The web UI uses CSS transform: translate(-50%, -50%) to center the text element
    on the position point. FFmpeg's drawtext uses x and y as the top-left corner
    by default, so we need to offset by half the text width and height.
    """
    style = overlay.style

    # Get font path (includes validation and fallback logic)
    font_path = get_font_path(style.fontFamily, style.fontWeight)

    # Calculate position in pixels from percentage
    # Handle both dict access styles (Pydantic model or raw dict)
    pos = overlay.position
    x_pct = pos.get('x', 50) if isinstance(pos, dict) else getattr(pos, 'x', 50)
    y_pct = pos.get('y', 50) if isinstance(pos, dict) else getattr(pos, 'y', 50)

    # Ensure position values are valid numbers
    try:
        x_pct = float(x_pct)
        y_pct = float(y_pct)
    except (TypeError, ValueError):
        print(f"[Warning] Invalid position values: x={x_pct}, y={y_pct}. Using center.")
        x_pct = 50.0
        y_pct = 50.0

    print(f"[Position] Raw percentages: x={x_pct}%, y={y_pct}%")
    x_pos = int((x_pct / 100) * video_width)
    y_pos = int((y_pct / 100) * video_height)

    # Scale font size proportionally to video resolution
    # Preview is ~400px wide, so we scale based on actual video width
    # For portrait videos (1080x1920), width is 1080, scale = 1080/400 = 2.7
    # For landscape videos (1920x1080), width is 1920, scale = 1920/400 = 4.8
    scale_factor = video_width / preview_width
    scaled_font_size = int(style.fontSize * scale_factor)

    # Also scale background padding
    scaled_padding = int((style.backgroundPadding or 0) * scale_factor)

    print(f"[Font] Family: {style.fontFamily}, Weight: {style.fontWeight}, Path: {font_path}")
    print(f"[Font] Original size: {style.fontSize}px, Scale factor: {scale_factor:.2f}, Scaled size: {scaled_font_size}px")
    print(f"[Position] x={x_pct}% -> {x_pos}px, y={y_pct}% -> {y_pos}px (video: {video_width}x{video_height})")
    print(f"[Style] align={style.textAlign}, color={style.color}, opacity={style.opacity}")
    print(f"[Style] bgColor={style.backgroundColor}, bgPadding={style.backgroundPadding} (scaled: {scaled_padding})")

    # Escape text for FFmpeg
    escaped_text = escape_text_for_drawtext(overlay.text)

    # Color conversion - now returns (color, opacity)
    font_color, font_color_opacity = hex_to_ffmpeg_color(style.color)
    # Combine color opacity with style opacity
    final_font_opacity = style.opacity * font_color_opacity

    # Build the drawtext filter
    filter_parts = [
        f"drawtext=text='{escaped_text}'",
        f"fontfile='{font_path}'",
        f"fontsize={scaled_font_size}",
        f"fontcolor={font_color}@{final_font_opacity}",
    ]

    # Text alignment - adjust x position based on alignment
    #
    # Web behavior (CSS):
    # - The text container is positioned at (x%, y%) using left/top
    # - transform: translate(-50%, -50%) centers the container on that point
    # - textAlign then aligns text WITHIN that centered container
    #
    # So for ALL alignments, the visual "anchor point" is the CENTER of the text block.
    # This means:
    # - center: text center is at x_pos → x = x_pos - (tw/2)
    # - left: text center is at x_pos, but text reads left-to-right → x = x_pos - (tw/2)
    # - right: text center is at x_pos, but text reads right-to-left → x = x_pos - (tw/2)
    #
    # The textAlign in CSS only affects multi-line text alignment within the container,
    # but for single-line text, the container width equals text width, so alignment
    # doesn't visually change the position - the CENTER is always at the anchor point.
    #
    # Therefore, for FFmpeg we ALWAYS center the text on the x_pos point:
    filter_parts.append(f"x={x_pos}-(tw/2)")

    # Y position (center vertically on the point) - same logic
    filter_parts.append(f"y={y_pos}-(th/2)")

    print(f"[Position] FFmpeg x={x_pos}-(tw/2), y={y_pos}-(th/2) (text centered on anchor point)")

    # Background box if specified
    if style.backgroundColor:
        bg_color, bg_opacity = hex_to_ffmpeg_color(style.backgroundColor)
        # Combine background opacity with style opacity
        final_bg_opacity = style.opacity * bg_opacity
        filter_parts.append(f"box=1")
        filter_parts.append(f"boxcolor={bg_color}@{final_bg_opacity}")
        filter_parts.append(f"boxborderw={scaled_padding}")

    # Enable timing (show text only during specified time range)
    end_time = overlay.startTime + overlay.duration
    filter_parts.append(f"enable='between(t,{overlay.startTime},{end_time})'")

    return ":".join(filter_parts)


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
    preview_height: int = None
) -> None:
    """
    Apply text overlays to a video using FFmpeg drawtext filters.

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
    filter_parts = []
    for i, overlay in enumerate(overlays):
        filter_str = build_drawtext_filter(overlay, video_width, video_height, preview_width)
        print(f"[TextOverlay] Filter {i+1}: {filter_str[:200]}...")
        filter_parts.append(filter_str)

    # Chain filters together
    filter_complex = ",".join(filter_parts)
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
    print(f"[Export:{job_id}] Starting export with {len(request.clips)} clips and {text_overlay_count} text overlays")

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

        # Step 3: Concatenate all videos
        print(f"[Export:{job_id}] Step 3: Concatenating videos...")
        concat_output_path = work_dir / "concat_output.mp4"
        concatenate_videos(trimmed_paths, concat_output_path, work_dir)

        # Step 4: Apply text overlays (if any)
        output_path = work_dir / "output.mp4"
        if request.textOverlays and len(request.textOverlays) > 0:
            print(f"[Export:{job_id}] Step 4: Applying {len(request.textOverlays)} text overlays...")

            # Get preview dimensions from request
            preview_width = request.previewDimensions.width if request.previewDimensions else None
            preview_height = request.previewDimensions.height if request.previewDimensions else None
            print(f"[Export:{job_id}] Preview dimensions from request: {preview_width}x{preview_height}")

            for i, overlay in enumerate(request.textOverlays):
                text_preview = overlay.text[:30] if len(overlay.text) > 30 else overlay.text
                print(f"[Export:{job_id}]   Overlay {i+1}: text='{text_preview}', start={overlay.startTime}, duration={overlay.duration}")

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
                request.textOverlays,
                preview_width=preview_width,
                preview_height=preview_height
            )
        else:
            print(f"[Export:{job_id}] Step 4: No text overlays to apply, using concatenated output...")
            shutil.copy(concat_output_path, output_path)

        # Get output file size
        output_size = output_path.stat().st_size
        print(f"[Export:{job_id}] Output file size: {output_size} bytes")

        # Step 5: Upload to Supabase storage
        print(f"[Export:{job_id}] Step 5: Uploading to storage...")
        supabase = get_supabase_client()

        timestamp = int(datetime.now().timestamp() * 1000)
        storage_path = f"{request.userId}/{request.companyId or 'default'}/{timestamp}_export.mp4"

        with open(output_path, "rb") as f:
            output_data = f.read()

        upload_result = supabase.storage.from_("media-studio-videos").upload(
            storage_path,
            output_data,
            file_options={"content-type": "video/mp4"}
        )

        # Get public URL
        public_url = supabase.storage.from_("media-studio-videos").get_public_url(storage_path)
        print(f"[Export:{job_id}] Uploaded to: {public_url}")

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
        print(f"[Export:{job_id}] Complete in {processing_time_ms}ms")

        return VideoExportResponse(
            success=True,
            videoUrl=public_url,
            storagePath=storage_path,
            fileSize=output_size,
            mediaFileId=media_file_id,
            processingTimeMs=processing_time_ms
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
# Main
# ============================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
