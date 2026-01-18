"""
Sora 2 Pro Video Generation Script
----------------------------------
This module provides a production-ready interface for generating videos using OpenAI's Sora 2 Pro API.

Features:
- Text-to-video generation with Sora 2 and Sora 2 Pro models
- Image-to-video generation (i2v) with starting image input
- Automatic status polling with exponential backoff
- Video download with streaming support
- Comprehensive error handling and retry logic
- Environment variable configuration

Requirements:
- openai>=1.51.0
- python-dotenv>=1.0.0
"""

import os
import time
from typing import Optional, Dict, Any, Literal
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI, OpenAIError

# Load environment variables
load_dotenv()


class SoraVideoGenerator:
    """
    A production-ready client for OpenAI's Sora 2 video generation API.

    Attributes:
        client (OpenAI): Initialized OpenAI client
        default_model (str): Default model to use ('sora-2' or 'sora-2-pro')
        max_retries (int): Maximum number of retry attempts for failed requests
        poll_interval (int): Initial polling interval in seconds
    """

    # Model specifications
    MODEL_SPECS = {
        "sora-2": {
            "max_duration": 20,
            "description": "Fast and flexible model for rapid prototyping"
        },
        "sora-2-pro": {
            "max_duration": 90,
            "description": "State-of-the-art model with synced audio generation"
        }
    }

    # Supported resolutions
    RESOLUTIONS = [
        "1280x720",   # 720p HD (default)
        "720x1280",
        "1792x1024",
        "1024x1792",  # 2160p 4K (Pro tier)
    ]

    def __init__(
        self,
        api_key: Optional[str] = None,
        organization: Optional[str] = None,
        default_model: Literal["sora-2", "sora-2-pro"] = "sora-2",
        max_retries: int = 3,
        poll_interval: int = 5
    ):
        """
        Initialize the Sora video generator client.

        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
            organization: OpenAI organization ID (defaults to OPENAI_ORG_ID env var)
            default_model: Default model to use for generation
            max_retries: Maximum number of retry attempts for failed requests
            poll_interval: Initial polling interval in seconds
        """
        self.client = OpenAI(
            api_key=api_key or os.getenv("OPENAI_API_KEY"),
            organization=organization or os.getenv("OPENAI_ORG_ID")
        )
        self.default_model = default_model
        self.max_retries = max_retries
        self.poll_interval = poll_interval

        # Validate API key
        if not self.client.api_key:
            raise ValueError(
                "OpenAI API key not found. Set OPENAI_API_KEY environment variable "
                "or pass api_key parameter."
            )

    def generate_video(
        self,
        prompt: str,
        model: Optional[Literal["sora-2", "sora-2-pro"]] = None,
        duration: Optional[int] = None,
        resolution: str = "1280x720",
        image_url: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a video from a text prompt, optionally starting from an image.

        Args:
            prompt: Text description for video generation (max 500 characters)
            model: Model to use ('sora-2' or 'sora-2-pro')
            duration: Video duration in seconds (max 20 for sora-2, 90 for sora-2-pro)
            resolution: Video resolution (e.g., "1280x720", "1920x1080")
            image_url: Optional publicly accessible URL of starting image for i2v generation
            **kwargs: Additional parameters to pass to the API

        Returns:
            Dict containing job_id and initial status

        Raises:
            ValueError: If parameters are invalid
            OpenAIError: If API request fails
        """
        model = model or self.default_model

        # Validate prompt
        if not prompt or len(prompt) > 500:
            raise ValueError("Prompt must be between 1 and 500 characters")

        # Validate model and duration
        if model not in self.MODEL_SPECS:
            raise ValueError(f"Invalid model. Choose from: {list(self.MODEL_SPECS.keys())}")

        max_duration = self.MODEL_SPECS[model]["max_duration"]
        if duration and duration > max_duration:
            raise ValueError(
                f"Duration {duration}s exceeds maximum {max_duration}s for {model}"
            )

        # Validate resolution
        if resolution not in self.RESOLUTIONS:
            raise ValueError(
                f"Invalid resolution. Supported: {self.RESOLUTIONS}"
            )

        # Prepare request parameters
        params = {
            "prompt": prompt,
            "model": model,
        }

        if duration:
            params["seconds"] = str(duration)  # API expects "seconds" parameter as string
        if resolution:
            params["size"] = resolution  # API expects "size" parameter for resolution
        if image_url:
            params["image_url"] = image_url

        # Add any additional parameters
        params.update(kwargs)

        generation_type = "Image-to-video" if image_url else "Text-to-video"
        print(f"🎬 Initiating {generation_type} generation with {model}...")
        print(f"📝 Prompt: {prompt}")
        if image_url:
            print(f"🖼️  Starting image: {image_url}")
        print(f"⏱️  Duration: {duration or 'default'}s")
        print(f"📐 Resolution: {resolution}")

        try:
            response = self.client.videos.create(**params)
            job_id = response.id

            print(f"✅ Job created successfully!")
            print(f"🆔 Job ID: {job_id}")

            return {
                "job_id": job_id,
                "status": "pending",
                "model": model,
                "prompt": prompt
            }

        except OpenAIError as e:
            print(f"❌ Error creating video generation job: {str(e)}")
            raise

    def check_status(self, job_id: str) -> Dict[str, Any]:
        """
        Check the status of a video generation job.

        Args:
            job_id: The job ID returned from generate_video()

        Returns:
            Dict containing job status and metadata
        """
        try:
            response = self.client.videos.retrieve(job_id)

            return {
                "job_id": job_id,
                "status": response.status,  # "queued", "processing", "completed", "failed"
                "created_at": getattr(response, 'created_at', None),
                "model": getattr(response, 'model', None),
                "progress": getattr(response, 'progress', 0),  # Progress percentage
                "seconds": getattr(response, 'seconds', None),  # Video duration
                "size": getattr(response, 'size', None),  # Resolution
                "error": getattr(response, 'error', None)
            }

        except OpenAIError as e:
            print(f"❌ Error checking job status: {str(e)}")
            raise

    def wait_for_completion(
        self,
        job_id: str,
        max_wait_time: int = 600,
        verbose: bool = True
    ) -> Dict[str, Any]:
        """
        Poll job status until completion or failure.

        Args:
            job_id: The job ID to monitor
            max_wait_time: Maximum time to wait in seconds (default: 10 minutes)
            verbose: Whether to print status updates

        Returns:
            Dict containing final job status and video URL

        Raises:
            TimeoutError: If job doesn't complete within max_wait_time
            RuntimeError: If job fails
        """
        start_time = time.time()
        poll_interval = self.poll_interval

        if verbose:
            print(f"⏳ Waiting for job {job_id} to complete...")

        while True:
            elapsed = time.time() - start_time

            if elapsed > max_wait_time:
                raise TimeoutError(
                    f"Job {job_id} did not complete within {max_wait_time} seconds"
                )

            status_info = self.check_status(job_id)
            status = status_info["status"]
            progress = status_info.get("progress", 0)

            if status == "completed":
                if verbose:
                    print(f"✅ Job completed in {elapsed:.1f} seconds!")
                return status_info

            elif status == "failed":
                error = status_info.get("error", "Unknown error")
                raise RuntimeError(f"Job {job_id} failed: {error}")

            elif status in ["queued", "processing", "pending"]:
                if verbose:
                    progress_str = f"{progress}%" if progress > 0 else "queued"
                    print(f"⏳ Status: {status} ({progress_str})... ({elapsed:.1f}s elapsed)")

            # Exponential backoff with max 30 seconds
            time.sleep(min(poll_interval, 30))
            poll_interval = min(poll_interval * 1.5, 30)

    def download_video(
        self,
        job_id: str,
        output_path: Optional[str] = None,
        output_dir: str = "generated_videos"
    ) -> str:
        """
        Download the generated video to local storage.

        Args:
            job_id: The video job ID to download
            output_path: Full path where to save the video (optional)
            output_dir: Directory to save video if output_path not specified

        Returns:
            Path to the downloaded video file
        """
        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        # Generate filename if not provided
        if not output_path:
            timestamp = int(time.time())
            filename = f"sora_video_{timestamp}.mp4"
            output_path = os.path.join(output_dir, filename)

        print(f"⬇️  Downloading video to: {output_path}")

        try:
            # Use OpenAI client's download_content method
            response = self.client.videos.download_content(job_id)

            # Write the response content to file
            with open(output_path, 'wb') as f:
                # The response is an httpx.Response object, we need to read its content
                for chunk in response.iter_bytes(chunk_size=8192):
                    f.write(chunk)

            print(f"\n✅ Video downloaded successfully: {output_path}")
            return output_path

        except Exception as e:
            print(f"❌ Error downloading video: {str(e)}")
            raise

    def generate_and_download(
        self,
        prompt: str,
        model: Optional[Literal["sora-2", "sora-2-pro"]] = None,
        duration: Optional[int] = None,
        resolution: str = "1280x720",
        image_url: Optional[str] = None,
        output_path: Optional[str] = None,
        output_dir: str = "generated_videos",
        max_wait_time: int = 600,
        **kwargs
    ) -> str:
        """
        Complete workflow: generate video, wait for completion, and download.

        Args:
            prompt: Text description for video generation
            model: Model to use ('sora-2' or 'sora-2-pro')
            duration: Video duration in seconds
            resolution: Video resolution
            image_url: Optional publicly accessible URL of starting image for i2v generation
            output_path: Full path where to save the video (optional)
            output_dir: Directory to save video if output_path not specified
            max_wait_time: Maximum time to wait for completion
            **kwargs: Additional parameters to pass to the API

        Returns:
            Path to the downloaded video file
        """
        # Step 1: Generate video
        job_info = self.generate_video(
            prompt=prompt,
            model=model,
            duration=duration,
            resolution=resolution,
            image_url=image_url,
            **kwargs
        )

        # Step 2: Wait for completion
        completed_info = self.wait_for_completion(
            job_id=job_info["job_id"],
            max_wait_time=max_wait_time
        )

        # Step 3: Download video using job_id
        output_file = self.download_video(
            job_id=completed_info["job_id"],
            output_path=output_path,
            output_dir=output_dir
        )

        return output_file


def main():
    """
    Example usage demonstrating the video generation workflow.
    """
    # Initialize the generator
    generator = SoraVideoGenerator(
        default_model="sora-2",
        max_retries=3
    )

    # Example 1: Generate and download a video
    print("\n" + "="*60)
    print("Example 1: Complete workflow with Sora 2 Pro")
    print("="*60 + "\n")

    prompt = (
        "A brown bear sits in a therapist's office, fidgeting nervously in a plush chair. "
        "Human therapist with glasses takes notes, listening intently. "
        "The bear gestures emotionally about his cubs, eyes expressive and worried. "
        "Mid-session, the bear yawns widely, eyelids grow heavy, then slumps back snoring loudly. "
        "Cozy office, warm lighting, bookshelves. Cinematic, realistic fur, comedic ending."
    )


    try:
        video_path = generator.generate_and_download(
            prompt=prompt,
            model="sora-2",
            duration=12,
            resolution="720x1280", # 1920x1080 is 40% more expensive, try later
            output_dir="generated_videos"
        )

        print(f"\n🎉 Success! Video saved to: {video_path}")

    except Exception as e:
        print(f"\n❌ Failed to generate video: {str(e)}")


    # # Example 2: Step-by-step workflow
    # print("\n" + "="*60)
    # print("Example 2: Step-by-step workflow")
    # print("="*60 + "\n")

    # try:
    #     # Generate
    #     job = generator.generate_video(
    #         prompt="A Bear is doing therapy with a human in a cozy room, the bear talks affected by some internal traumas making it act in Fear of his children life and his own." \
    #         " The human is listening carefully and taking notes. Warm lighting, comfortable furniture, bookshelves filled with psychology books." \
    #         " Soft instrumental music playing in the background." \
    #         " Cinematic style, high detail, 4K resolution." \
    #         " The scene captures the internal struggle of the Bear and the therapist beginning to talk of how to manage his fears. " \
    #         "All the conversation happens in Romanian Language",
    #         model="sora-2",
    #         duration=10
    #     )

    #     # Wait
    #     result = generator.wait_for_completion(job["job_id"])

    #     # Download
    #     video_path = generator.download_video(
    #         job_id=result["job_id"],
    #         output_dir="generated_videos"
    #     )

    #     print(f"\n🎉 Success! Video saved to: {video_path}")

    # except Exception as e:
    #     print(f"\n❌ Failed to generate video: {str(e)}")


if __name__ == "__main__":
    main()
