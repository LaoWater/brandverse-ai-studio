
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-MEDIA-IMAGE] ${step}${detailsStr}`);
};

// Type definitions for API payloads
interface MediaGenerationRequest {
  prompt: string;
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview' | 'imagen-4.0-generate-001' | 'imagen-4.0-ultra-generate-001' | 'gpt-image-1.5';
  aspect_ratio: string;
  number_of_images?: number;
  image_size?: '1K' | '2K' | '4K';
  seed?: number;
  negative_prompt?: string;
  enhance_prompt?: boolean;
  reference_image_url?: string; // Deprecated - use reference_image_urls
  reference_image_urls?: string[]; // Multiple reference images (up to 14 for Gemini 3 Pro)
  user_id?: string;
  company_id?: string;
}

interface MediaGenerationResponse {
  success: boolean;
  image_url: string;
  thumbnail_url?: string;
  storage_path: string;
  metadata: {
    model: string;
    prompt: string;
    aspect_ratio: string;
    image_size?: string;
    seed?: number;
  };
  error?: string;
}

// Helper to convert aspect ratio to dimensions
const getImageDimensions = (aspectRatio: string, size: '1K' | '2K' | '4K' = '1K'): { width: number; height: number } => {
  const baseSize = size === '4K' ? 2048 : size === '2K' ? 1536 : 1024;

  switch (aspectRatio) {
    case '1:1':
      return { width: baseSize, height: baseSize };
    case '16:9':
      return size === '4K'
        ? { width: 2048, height: 1152 }
        : size === '2K'
        ? { width: 1536, height: 864 }
        : { width: 1024, height: 576 };
    case '9:16':
      return size === '4K'
        ? { width: 1152, height: 2048 }
        : size === '2K'
        ? { width: 864, height: 1536 }
        : { width: 576, height: 1024 };
    case '4:3':
      return size === '4K'
        ? { width: 2048, height: 1536 }
        : size === '2K'
        ? { width: 1536, height: 1152 }
        : { width: 1024, height: 768 };
    case '3:4':
      return size === '4K'
        ? { width: 1536, height: 2048 }
        : size === '2K'
        ? { width: 1152, height: 1536 }
        : { width: 768, height: 1024 };
    case '3:2':
      return size === '4K'
        ? { width: 2048, height: 1366 }
        : size === '2K'
        ? { width: 1536, height: 1024 }
        : { width: 1024, height: 683 };
    default:
      return { width: baseSize, height: baseSize };
  }
};

// Helper to fetch and convert reference image to base64
async function fetchReferenceImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
  logStep("Fetching reference image", { url: imageUrl });

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch reference image: ${response.status}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Use Deno's standard library base64 encoding
    const base64 = base64Encode(bytes);
    const mimeType = blob.type || 'image/png';

    logStep("Reference image fetched", {
      size: arrayBuffer.byteLength,
      mimeType
    });

    return { data: base64, mimeType };
  } catch (error: any) {
    logStep("Error fetching reference image", { error: error?.message });
    throw new Error(`Failed to fetch reference image: ${error?.message || error}`);
  }
}

// Generate image using Gemini 2.5 Flash
async function generateWithGemini(request: MediaGenerationRequest): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

  // Get reference URLs from either new or old field (backwards compatibility)
  const referenceUrls = request.reference_image_urls ||
                       (request.reference_image_url ? [request.reference_image_url] : []);

  logStep("Generating with Gemini 2.5 Flash", {
    prompt: request.prompt.substring(0, 50),
    aspectRatio: request.aspect_ratio,
    referenceCount: referenceUrls.length
  });

  // Gemini 2.5 Flash Image API endpoint
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`;

  // Build parts array - add reference images if provided
  const requestParts: any[] = [];

  // Add reference image(s) first if provided (Gemini is multimodal)
  // Note: Standard Gemini 2.5 Flash works best with 1 reference, use Pro for multiple
  if (referenceUrls.length > 0) {
    // Only use the first reference image for standard model
    const imageUrl = referenceUrls[0];
    const { data, mimeType } = await fetchReferenceImageAsBase64(imageUrl);
    requestParts.push({
      inlineData: {
        mimeType: mimeType,
        data: data
      }
    });
    logStep("Reference image added to Gemini prompt");
  }

  // Add text prompt
  requestParts.push({
    text: referenceUrls.length > 0
      ? `Using the reference image provided, generate a new image with this description: ${request.prompt}`
      : request.prompt
  });

  const payload: any = {
    contents: [{
      parts: requestParts
    }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],  // Must include both TEXT and IMAGE!
      imageConfig: {
        aspectRatio: request.aspect_ratio,
        // Gemini uses 1K by default, but we can specify 2K for higher quality
        // Note: For now we always use 1K for Gemini since it's fast/cheap
      }
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    logStep("Gemini API Error", { status: response.status, error });
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();

  // Log the FULL response to debug
  logStep("Gemini FULL response", { response: JSON.stringify(data, null, 2) });

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No candidates in Gemini response");
  }

  const candidate = data.candidates[0];
  logStep("Candidate structure", {
    hasContent: !!candidate.content,
    hasParts: !!candidate.content?.parts,
    partsLength: candidate.content?.parts?.length || 0,
    candidateKeys: Object.keys(candidate)
  });

  // Extract image from response - check multiple possible locations
  const parts = candidate.content?.parts || [];

  if (parts.length === 0) {
    // Log the entire candidate to see structure
    logStep("Empty parts - full candidate", { candidate: JSON.stringify(candidate) });
    throw new Error("No parts in Gemini response content");
  }

  // Find the part with inline_data (image)
  const imagePart = parts.find((part: any) => part.inline_data || part.inlineData);

  if (!imagePart) {
    // Check if Gemini returned a text response explaining why it couldn't generate
    const textPart = parts.find((part: any) => part.text);

    if (textPart && textPart.text) {
      logStep("Gemini returned text instead of image", { text: textPart.text });

      // Return a helpful error message with Gemini's response
      throw new Error(
        `Gemini couldn't generate an image. It says: "${textPart.text}"\n\n` +
        `💡 Tip: Try a more descriptive prompt like "a modern coffee shop interior" or "a sunset over mountains"`
      );
    }

    logStep("No image part found", {
      partsStructure: parts.map((p: any) => Object.keys(p))
    });
    throw new Error("No image data in Gemini response. Try a more descriptive prompt.");
  }

  // Handle both snake_case and camelCase
  const imageData = imagePart.inline_data?.data || imagePart.inlineData?.data;

  if (!imageData) {
    throw new Error("No image data found in response part");
  }

  logStep("Image data extracted successfully", {
    dataLength: imageData.length,
    mimeType: imagePart.inline_data?.mime_type || imagePart.inlineData?.mimeType
  });

  return `data:image/png;base64,${imageData}`;
}

// Generate image using Gemini 3 Pro Image (Advanced reasoning, 4K support, multi-reference)
async function generateWithGeminiPro(request: MediaGenerationRequest): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

  // Get reference URLs from either new or old field
  const referenceUrls = request.reference_image_urls ||
                       (request.reference_image_url ? [request.reference_image_url] : []);

  logStep("Generating with Gemini 3 Pro Image", {
    prompt: request.prompt.substring(0, 50),
    aspectRatio: request.aspect_ratio,
    imageSize: request.image_size || '1K',
    referenceCount: referenceUrls.length
  });

  // Gemini 3 Pro Image API endpoint
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent`;

  // Build parts array - add reference images if provided
  const requestParts: any[] = [];

  // Add all reference images first (Gemini 3 Pro supports up to 14)
  if (referenceUrls.length > 0) {
    for (const imageUrl of referenceUrls) {
      const { data, mimeType } = await fetchReferenceImageAsBase64(imageUrl);
      requestParts.push({
        inlineData: {
          mimeType: mimeType,
          data: data
        }
      });
    }
    logStep(`${referenceUrls.length} reference image(s) added to Gemini Pro prompt`);
  }

  // Add text prompt
  requestParts.push({
    text: referenceUrls.length > 0
      ? `Using the ${referenceUrls.length} reference image(s) provided, generate a new image with this description: ${request.prompt}`
      : request.prompt
  });

  const payload: any = {
    contents: [{
      parts: requestParts
    }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: request.aspect_ratio,
        // Gemini 3 Pro supports 1K, 2K, and 4K
        imageSize: request.image_size || '1K'
      }
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    logStep("Gemini Pro API Error", { status: response.status, error });
    throw new Error(`Gemini Pro API error: ${error}`);
  }

  const data = await response.json();

  // Log the FULL response to debug
  logStep("Gemini Pro FULL response", { response: JSON.stringify(data, null, 2) });

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No candidates in Gemini Pro response");
  }

  const candidate = data.candidates[0];
  logStep("Candidate structure", {
    hasContent: !!candidate.content,
    hasParts: !!candidate.content?.parts,
    partsLength: candidate.content?.parts?.length || 0,
    candidateKeys: Object.keys(candidate)
  });

  // Extract image from response
  const parts = candidate.content?.parts || [];

  if (parts.length === 0) {
    logStep("Empty parts - full candidate", { candidate: JSON.stringify(candidate) });
    throw new Error("No parts in Gemini Pro response content");
  }

  // Find the part with inline_data (image)
  const imagePart = parts.find((part: any) => part.inline_data || part.inlineData);

  if (!imagePart) {
    // Check if Gemini returned a text response explaining why it couldn't generate
    const textPart = parts.find((part: any) => part.text);

    if (textPart && textPart.text) {
      logStep("Gemini Pro returned text instead of image", { text: textPart.text });

      throw new Error(
        `Gemini Pro couldn't generate an image. It says: "${textPart.text}"\n\n` +
        `💡 Tip: Try a more detailed prompt or check your reference images for clarity.`
      );
    }

    logStep("No image part found", {
      partsStructure: parts.map((p: any) => Object.keys(p))
    });
    throw new Error("No image data in Gemini Pro response. Try a more descriptive prompt.");
  }

  // Handle both snake_case and camelCase
  const imageData = imagePart.inline_data?.data || imagePart.inlineData?.data;

  if (!imageData) {
    throw new Error("No image data found in response part");
  }

  logStep("Image data extracted successfully", {
    dataLength: imageData.length,
    mimeType: imagePart.inline_data?.mime_type || imagePart.inlineData?.mimeType
  });

  return `data:image/png;base64,${imageData}`;
}

// Generate image using Google Imagen 4
async function generateWithImagen(request: MediaGenerationRequest): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

  // Select model variant based on quality
  // 1K = Standard quality → imagen-4.0-generate-001
  // 2K = High quality → imagen-4.0-ultra-generate-001
  const modelVariant = request.image_size === '2K'
    ? 'imagen-4.0-ultra-generate-001'
    : 'imagen-4.0-generate-001';

  logStep("Generating with Imagen 4", {
    model: modelVariant,
    prompt: request.prompt.substring(0, 50),
    size: request.image_size,
    hasReference: !!request.reference_image_url
  });

  // Use Generative Language API endpoint (same auth as Gemini!)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelVariant}:predict`;

  // Build instance object
  const instance: any = {
    prompt: request.prompt,
  };

  // Add reference image if provided
  if (request.reference_image_url) {
    const { data, mimeType } = await fetchReferenceImageAsBase64(request.reference_image_url);
    instance.referenceImage = {
      bytesBase64Encoded: data
    };
    logStep("Reference image added to Imagen 4 request");
  }

  const payload = {
    instances: [instance],
    parameters: {
      sampleCount: request.number_of_images || 1,
      aspectRatio: request.aspect_ratio,
      ...(request.image_size && { imageSize: request.image_size }),
      ...(request.negative_prompt && { negativePrompt: request.negative_prompt }),
      ...(request.seed && { seed: request.seed }),
      // Note: Prompt enhancement (prompt rewriter) is ENABLED BY DEFAULT for Imagen 4
      // It automatically enhances prompts < 30 words with LLM-based detail addition
      // The enhancePrompt parameter allows disabling it (set to false), but we keep it enabled
      // See: https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images#prompt-rewriter
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,  // ✅ Use same auth as Gemini!
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    logStep("Imagen API Error", { status: response.status, error });
    throw new Error(`Imagen API error: ${error}`);
  }

  const data = await response.json();

  // Extract image from response
  const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;
  if (!imageBase64) throw new Error("No image data in Imagen response");

  return `data:image/png;base64,${imageBase64}`;
}

// Generate image using OpenAI GPT-Image-1.5
async function generateWithGPT(request: MediaGenerationRequest): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  // Get reference URL from either new or old field (backwards compatibility)
  const referenceUrl = request.reference_image_urls?.[0] || request.reference_image_url;

  logStep("Generating with GPT-Image-1.5", {
    prompt: request.prompt.substring(0, 50),
    size: request.image_size,
    hasReference: !!referenceUrl,
    referenceUrl: referenceUrl ? referenceUrl.substring(0, 80) : 'none'
  });

  // Determine size parameter for OpenAI
  let sizeParam = "1024x1024";
  if (request.image_size === '2K') {
    // HD quality uses 1536px on longest side
    if (request.aspect_ratio === '16:9' || request.aspect_ratio === '3:2') {
      sizeParam = "1536x1024";
    } else if (request.aspect_ratio === '9:16' || request.aspect_ratio === '3:4') {
      sizeParam = "1024x1536";
    } else {
      sizeParam = "1024x1024"; // Square
    }
  }

  // Map image_size to GPT-Image-1.5 quality levels
  // 1K = low, 2K = medium, 4K = high
  let quality = "low";
  if (request.image_size === '2K') {
    quality = "medium";
  } else if (request.image_size === '4K') {
    quality = "high";
  }

  // For reference images, use the /v1/images/edits endpoint with multipart/form-data
  if (referenceUrl) {
    const endpoint = "https://api.openai.com/v1/images/edits";

    logStep("Using edits endpoint with reference image", { referenceUrl: referenceUrl.substring(0, 80) });

    // Fetch reference image as base64
    const { data: imageData, mimeType } = await fetchReferenceImageAsBase64(referenceUrl);

    // Convert base64 to blob for form data
    const binaryData = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: mimeType });

    // Build multipart form data for edits endpoint
    const formData = new FormData();
    formData.append('model', 'gpt-image-1.5');
    formData.append('prompt', request.prompt);
    formData.append('image', blob, 'reference.png'); // Singular 'image', not 'image[]'
    formData.append('n', String(request.number_of_images || 1));
    formData.append('size', sizeParam);
    formData.append('input_fidelity', 'high'); // High fidelity for better reference adherence
    formData.append('quality', quality); // low, medium, high
    formData.append('output_format', 'png');

    logStep("Reference image added to GPT-Image-1.5 edits request", {
      quality: quality,
      size: sizeParam,
      input_fidelity: 'high',
      endpoint: endpoint
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // Don't set Content-Type - let FormData set it with boundary
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      logStep("OpenAI API Error", { status: response.status, error });
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();

    // Log the full response for debugging
    logStep("OpenAI response received", {
      hasData: !!data.data,
      dataLength: data.data?.length,
      firstItem: data.data?.[0] ? Object.keys(data.data[0]) : [],
      fullResponse: JSON.stringify(data).substring(0, 200)
    });

    // GPT-Image-1.5 can return either URL or base64 data
    const firstResult = data.data?.[0];
    if (!firstResult) {
      throw new Error("No image data in OpenAI response");
    }

    // Check if we got base64 data directly
    if (firstResult.b64_json) {
      logStep("Received base64 image data directly");
      return `data:image/png;base64,${firstResult.b64_json}`;
    }

    // Otherwise, fetch from URL
    const imageUrl = firstResult.url;
    if (!imageUrl) {
      logStep("Full OpenAI response for debugging", { response: JSON.stringify(data, null, 2) });
      throw new Error("No image URL or base64 data in OpenAI response");
    }

    logStep("Fetching image from URL", { url: imageUrl.substring(0, 50) });

    // Fetch the image and convert to base64 data URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = base64Encode(bytes);

    return `data:image/png;base64,${base64}`;
  }

  // For generations without reference images, use JSON format
  const endpoint = "https://api.openai.com/v1/images/generations";
  const payload: any = {
    model: "gpt-image-1.5",
    prompt: request.prompt,
    n: request.number_of_images || 1,
    size: sizeParam,
    quality: quality, // GPT-Image-1.5 supports: low, medium, high
    output_format: "png",
  };

  // For generations without reference images
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    logStep("OpenAI API Error", { status: response.status, error });
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();

  // Log the full response for debugging
  logStep("OpenAI response received", {
    hasData: !!data.data,
    dataLength: data.data?.length,
    firstItem: data.data?.[0] ? Object.keys(data.data[0]) : [],
    fullResponse: JSON.stringify(data).substring(0, 200)
  });

  // GPT-Image-1.5 can return either URL or base64 data
  const firstResult = data.data?.[0];
  if (!firstResult) {
    throw new Error("No image data in OpenAI response");
  }

  // Check if we got base64 data directly
  if (firstResult.b64_json) {
    logStep("Received base64 image data directly");
    return `data:image/png;base64,${firstResult.b64_json}`;
  }

  // Otherwise, fetch from URL
  const imageUrl = firstResult.url;
  if (!imageUrl) {
    logStep("Full OpenAI response for debugging", { response: JSON.stringify(data, null, 2) });
    throw new Error("No image URL or base64 data in OpenAI response");
  }

  logStep("Fetching image from URL", { url: imageUrl.substring(0, 50) });

  // Fetch the image and convert to base64 data URL
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
  }

  const imageBlob = await imageResponse.blob();
  const arrayBuffer = await imageBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const base64 = base64Encode(bytes);

  return `data:image/png;base64,${base64}`;
}

// Upload image to Supabase Storage
async function uploadToStorage(
  supabaseClient: any,
  imageDataUrl: string,
  userId: string,
  companyId: string,
  model: string
): Promise<{ publicUrl: string; storagePath: string }> {
  logStep("Uploading to Supabase Storage");

  // Convert data URL to blob
  const base64Data = imageDataUrl.split(',')[1];
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  // Create storage path
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().substring(0, 8);
  const storagePath = `${userId}/${companyId}/${timestamp}_${model}_${randomId}.png`;

  // Upload to media-studio-images bucket
  const { data, error } = await supabaseClient.storage
    .from('media-studio-images')
    .upload(storagePath, binaryData, {
      contentType: 'image/png',
      upsert: false
    });

  if (error) {
    logStep("Storage upload error", { error });
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseClient.storage
    .from('media-studio-images')
    .getPublicUrl(storagePath);

  logStep("Image uploaded successfully", { storagePath, publicUrl });

  return { publicUrl, storagePath };
}

// Main handler
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // Use service role for storage
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    // Parse request
    const request: MediaGenerationRequest = await req.json();

    // Validate required fields
    if (!request.prompt || !request.model || !request.aspect_ratio) {
      throw new Error("Missing required fields: prompt, model, aspect_ratio");
    }

    logStep("Request validated", {
      model: request.model,
      aspectRatio: request.aspect_ratio,
      imageSize: request.image_size
    });

    // Generate image based on model
    let imageDataUrl: string;

    switch (request.model) {
      case 'gemini-2.5-flash-image':
        // Gemini 2.5 Flash - Fast & creative (1K/2K)
        imageDataUrl = await generateWithGemini(request);
        break;
      case 'gemini-3-pro-image-preview':
        // Gemini 3 Pro - Advanced reasoning, 4K support, multi-reference (up to 14 images)
        imageDataUrl = await generateWithGeminiPro(request);
        break;
      case 'imagen-4.0-generate-001':
      case 'imagen-4.0-ultra-generate-001':
        // Imagen 4 supports 1K/2K quality (auto-selects standard or ultra variant)
        imageDataUrl = await generateWithImagen(request);
        break;
      case 'gpt-image-1.5':
        // GPT supports standard/HD quality
        imageDataUrl = await generateWithGPT(request);
        break;
      default:
        throw new Error(`Unsupported model: ${request.model}`);
    }

    // Upload to storage
    const { publicUrl, storagePath } = await uploadToStorage(
      supabaseClient,
      imageDataUrl,
      user.id,
      request.company_id || 'default',
      request.model
    );

    // Prepare response
    const response: MediaGenerationResponse = {
      success: true,
      image_url: publicUrl,
      thumbnail_url: publicUrl, // Same for now, can create thumbnail later
      storage_path: storagePath,
      metadata: {
        model: request.model,
        prompt: request.prompt,
        aspect_ratio: request.aspect_ratio,
        image_size: request.image_size,
        seed: request.seed,
      }
    };

    logStep("Generation completed successfully");

    return new Response(JSON.stringify(response), {
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
