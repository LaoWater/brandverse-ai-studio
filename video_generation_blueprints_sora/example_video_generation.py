"""
Simple example script for generating videos with Sora 2 Pro
"""

from video_generation import SoraVideoGenerator


def generate_therapy_intro():
    """Generate a calming intro video for therapy sessions"""

    generator = SoraVideoGenerator(default_model="sora-2-pro")

    prompt = """
    A peaceful therapy room with soft natural lighting streaming through large windows.
    Comfortable chairs arranged in a circle, indoor plants creating a calming atmosphere.
    Gentle camera movement revealing the serene space designed for healing conversations.
    """.strip()

    try:
        video_path = generator.generate_and_download(
            prompt=prompt,
            duration=3,
            resolution="1920x1080",
            output_dir="therapy_videos"
        )

        print(f"\n✅ Therapy intro video created: {video_path}")
        return video_path

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return None


def generate_wellness_content():
    """Generate wellness-related video content"""

    generator = SoraVideoGenerator(default_model="sora-2-pro")

    prompts = [
        {
            "name": "breathing_exercise",
            "prompt": "Peaceful beach at sunrise with gentle waves, synchronized breathing visualization overlay",
            "duration": 20
        },
        {
            "name": "meditation_space",
            "prompt": "Zen garden with flowing water, bamboo, and soft morning light creating tranquil atmosphere",
            "duration": 15
        },
        {
            "name": "nature_therapy",
            "prompt": "Lush forest path with sunlight filtering through trees, birds chirping, peaceful walking pace",
            "duration": 30
        }
    ]

    results = []

    for video_config in prompts:
        print(f"\n{'='*60}")
        print(f"Generating: {video_config['name']}")
        print(f"{'='*60}\n")

        try:
            video_path = generator.generate_and_download(
                prompt=video_config["prompt"],
                duration=video_config["duration"],
                resolution="1920x1080",
                output_path=f"wellness_videos/{video_config['name']}.mp4"
            )

            results.append({
                "name": video_config['name'],
                "path": video_path,
                "status": "success"
            })

        except Exception as e:
            print(f"❌ Failed to generate {video_config['name']}: {str(e)}")
            results.append({
                "name": video_config['name'],
                "error": str(e),
                "status": "failed"
            })

    # Summary
    print(f"\n{'='*60}")
    print("GENERATION SUMMARY")
    print(f"{'='*60}")

    for result in results:
        status_emoji = "✅" if result["status"] == "success" else "❌"
        print(f"{status_emoji} {result['name']}: {result.get('path', result.get('error'))}")

    return results


def quick_test():
    """Quick test with a simple prompt"""

    generator = SoraVideoGenerator(default_model="sora-2")

    prompt = "A beautiful sunrise over mountains with birds flying"

    print("\n🚀 Running quick test with Sora 2...")

    try:
        video_path = generator.generate_and_download(
            prompt=prompt,
            duration=10,
            resolution="1280x720",
            output_dir="test_videos"
        )

        print(f"\n✅ Test successful! Video: {video_path}")
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        return False


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "test":
            quick_test()
        elif command == "therapy":
            generate_therapy_intro()
        elif command == "wellness":
            generate_wellness_content()
        else:
            print(f"Unknown command: {command}")
            print("Available commands: test, therapy, wellness")
    else:
        print("\nSora 2 Pro Video Generation Examples")
        print("=" * 60)
        print("\nUsage:")
        print("  python example_video_generation.py test      # Quick test")
        print("  python example_video_generation.py therapy   # Therapy intro")
        print("  python example_video_generation.py wellness  # Wellness videos")
        print("\nOr run directly:")
        print("  python -c 'from example_video_generation import quick_test; quick_test()'")
        print()

        # Run quick test by default
        quick_test()
