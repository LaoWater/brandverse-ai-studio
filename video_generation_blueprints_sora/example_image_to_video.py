"""
Image-to-Video (i2v) Generation Examples with Sora 2 Pro
--------------------------------------------------------
This script demonstrates how to use Sora 2 Pro's image-to-video capabilities
to animate static images with AI-generated motion and transitions.
"""

from video_generation import SoraVideoGenerator


def animate_from_url():
    """
    Generate video from a publicly accessible image URL.

    Note: The image URL must be publicly accessible (not behind authentication).
    For local images, you'll need to upload them to a hosting service first.
    """
    generator = SoraVideoGenerator(default_model="sora-2-pro")

    # Example: Animate a therapy room image
    image_url = "https://example.com/therapy-room.jpg"  # Replace with your image URL

    prompt = """
    Gentle camera zoom into the therapy room, soft natural lighting gradually
    brightening. Plants swaying slightly from a gentle breeze. Create a warm,
    welcoming atmosphere with subtle movements.
    """

    try:
        video_path = generator.generate_and_download(
            prompt=prompt,
            image_url=image_url,
            duration=10,
            resolution="1920x1080",
            output_dir="i2v_videos"
        )

        print(f"\n✅ Image-to-video completed: {video_path}")
        return video_path

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return None


def animate_therapy_scenes():
    """
    Generate multiple animated scenes from therapy-related images.
    """
    generator = SoraVideoGenerator(default_model="sora-2-pro")

    scenes = [
        {
            "name": "meditation_space",
            "image_url": "https://example.com/zen-garden.jpg",
            "prompt": "Gentle water ripples in the pond, soft wind moving bamboo leaves, peaceful ambiance",
            "duration": 15
        },
        {
            "name": "breathing_visual",
            "image_url": "https://example.com/calm-ocean.jpg",
            "prompt": "Slow, rhythmic ocean waves matching breathing pattern, sunset colors intensifying",
            "duration": 20
        },
        {
            "name": "counseling_room",
            "image_url": "https://example.com/therapy-office.jpg",
            "prompt": "Camera slowly panning across the room, sunlight streaming through windows creating warmth",
            "duration": 12
        }
    ]

    results = []

    for scene in scenes:
        print(f"\n{'='*60}")
        print(f"Animating: {scene['name']}")
        print(f"{'='*60}\n")

        try:
            video_path = generator.generate_and_download(
                prompt=scene["prompt"],
                image_url=scene["image_url"],
                duration=scene["duration"],
                resolution="1920x1080",
                output_path=f"i2v_videos/{scene['name']}.mp4"
            )

            results.append({
                "name": scene['name'],
                "path": video_path,
                "status": "success"
            })

        except Exception as e:
            print(f"❌ Failed: {str(e)}")
            results.append({
                "name": scene['name'],
                "error": str(e),
                "status": "failed"
            })

    # Summary
    print(f"\n{'='*60}")
    print("ANIMATION SUMMARY")
    print(f"{'='*60}")

    for result in results:
        status_emoji = "✅" if result["status"] == "success" else "❌"
        info = result.get('path', result.get('error'))
        print(f"{status_emoji} {result['name']}: {info}")

    return results


def step_by_step_i2v_example():
    """
    Step-by-step example showing the full i2v workflow.
    """
    generator = SoraVideoGenerator(default_model="sora-2-pro")

    print("\n" + "="*60)
    print("Image-to-Video: Step-by-Step Example")
    print("="*60 + "\n")

    # Your image URL (must be publicly accessible)
    image_url = "https://example.com/starting-image.jpg"

    # Describe how you want the image to animate
    prompt = "Slow motion ripple effect from center, colors gently pulsing with energy"

    print("Step 1: Initiating video generation from image...")

    try:
        # Step 1: Generate
        job = generator.generate_video(
            prompt=prompt,
            image_url=image_url,
            model="sora-2-pro",
            duration=10,
            resolution="1920x1080"
        )

        print(f"Job ID: {job['job_id']}")

        # Step 2: Wait for completion
        print("\nStep 2: Waiting for video processing...")
        result = generator.wait_for_completion(
            job_id=job["job_id"],
            max_wait_time=600
        )

        # Step 3: Download
        print("\nStep 3: Downloading generated video...")
        video_path = generator.download_video(
            video_url=result["video_url"],
            output_dir="i2v_videos"
        )

        print(f"\n🎉 Success! Video saved to: {video_path}")
        return video_path

    except Exception as e:
        print(f"\n❌ Failed: {str(e)}")
        return None


def upload_and_animate_local_image():
    """
    Guide for uploading local images before animating them.

    Note: Sora API requires publicly accessible image URLs.
    You need to upload your local image to a hosting service first.
    """
    print("\n" + "="*60)
    print("How to Animate Local Images")
    print("="*60 + "\n")

    print("Sora 2 Pro requires publicly accessible image URLs.")
    print("To animate a local image, follow these steps:\n")

    print("Option 1: Use Supabase Storage (recommended for your project)")
    print("-" * 60)
    print("""
from supabase import create_client
from pathlib import Path

# Upload to Supabase Storage
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

with open('local_image.jpg', 'rb') as f:
    supabase.storage.from_('therapy-videos').upload(
        'starting-images/my-image.jpg',
        f,
        file_options={"content-type": "image/jpeg"}
    )

# Get public URL
public_url = supabase.storage.from_('therapy-videos').get_public_url(
    'starting-images/my-image.jpg'
)

# Now use with Sora
generator = SoraVideoGenerator()
video = generator.generate_and_download(
    prompt="Animate this image...",
    image_url=public_url,
    duration=10
)
    """)

    print("\nOption 2: Use Imgur or similar image hosting")
    print("-" * 60)
    print("""
1. Upload image to https://imgur.com
2. Get the direct image URL (ends with .jpg, .png, etc.)
3. Use that URL with Sora:

   video = generator.generate_and_download(
       prompt="Your animation description",
       image_url="https://i.imgur.com/YOUR-IMAGE.jpg",
       duration=15
   )
    """)

    print("\nOption 3: Host on your own server")
    print("-" * 60)
    print("""
1. Place image in public directory of your server
2. Ensure it's accessible without authentication
3. Use the full URL:

   image_url = "https://yourserver.com/images/therapy-room.jpg"
    """)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "url":
            animate_from_url()
        elif command == "scenes":
            animate_therapy_scenes()
        elif command == "step":
            step_by_step_i2v_example()
        elif command == "local":
            upload_and_animate_local_image()
        else:
            print(f"Unknown command: {command}")
            print("Available: url, scenes, step, local")
    else:
        print("\n" + "="*60)
        print("Sora 2 Pro Image-to-Video Examples")
        print("="*60 + "\n")

        print("Usage:")
        print("  python example_image_to_video.py url     # Animate from URL")
        print("  python example_image_to_video.py scenes  # Multiple scenes")
        print("  python example_image_to_video.py step    # Step-by-step guide")
        print("  python example_image_to_video.py local   # Local image guide")
        print()

        # Show the local image guide by default
        upload_and_animate_local_image()
