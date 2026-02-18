import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-POST-TEXT] ${step}${detailsStr}`);
};

const CREDITS_PER_PLATFORM = 2;

interface PostTextRequest {
  company_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  platforms: string[];
  user_title?: string;
  media_prompt?: string;
}

interface CompanyData {
  id: string;
  name: string;
  mission?: string;
  tone_of_voice?: string;
  other_info?: any;
}

const PLATFORM_GUIDELINES: Record<string, string> = {
  instagram: "Instagram: Up to ~2200 characters. Use hashtags liberally (5-15 relevant ones). Visual-first, storytelling tone. Include a call-to-action. Use line breaks for readability.",
  twitter: "Twitter/X: STRICT 280 character limit. Be punchy and concise. Use 1-2 hashtags max. No fluff - every word counts.",
  linkedin: "LinkedIn: Up to ~3000 characters. Professional and insightful tone. Add value through industry perspective. Use formatting (line breaks, bullet points). 3-5 relevant hashtags at the end.",
  facebook: "Facebook: Conversational, medium length (100-500 words). Encourage engagement with questions. Emojis welcome but don't overdo it. 2-3 hashtags max.",
  tiktok: "TikTok: Trendy, casual, Gen-Z friendly. Up to ~2200 characters. Use trending hashtags. Keep it fun and authentic. Include a hook in the first line.",
};

async function generatePostTexts(
  company: CompanyData,
  mediaUrl: string,
  mediaType: 'image' | 'video',
  platforms: string[],
  userTitle?: string,
  mediaPrompt?: string,
): Promise<Record<string, { title: string; content: string; hashtags?: string[] }>> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

  logStep("Generating post texts", { platforms, mediaType });

  const platformInstructions = platforms
    .map(p => PLATFORM_GUIDELINES[p] || `${p}: Standard social media post.`)
    .join("\n");

  const brandContext = [
    `Company: ${company.name}`,
    company.mission ? `Mission: ${company.mission}` : null,
    company.tone_of_voice ? `Tone of Voice: ${company.tone_of_voice}` : null,
    company.other_info ? `Additional Brand Info: ${typeof company.other_info === 'string' ? company.other_info : JSON.stringify(company.other_info)}` : null,
  ].filter(Boolean).join("\n");

  const systemPrompt = `You are a social media content expert creating platform-optimized posts for a brand.

${brandContext}

Create engaging post content for each requested platform. Each post should:
- Match the brand's tone of voice
- Be optimized for the specific platform's format and audience
- Include relevant hashtags where appropriate
- Feel authentic, not generic or robotic

Platform-specific guidelines:
${platformInstructions}

Respond with a JSON object where each key is the platform name, containing:
{
  "platform_name": {
    "title": "A short title/headline for the post (max 100 chars)",
    "content": "The full post content optimized for this platform",
    "hashtags": ["relevant", "hashtags", "without", "hash", "symbol"]
  }
}`;

  const topicContext = userTitle ? `\nUser's topic/title guidance: "${userTitle}"` : '';
  const promptContext = mediaPrompt ? `\nOriginal media generation prompt: "${mediaPrompt}"` : '';

  // Build messages based on media type
  let messages: any[];

  if (mediaType === 'image') {
    // Multimodal: send image for vision analysis
    messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: mediaUrl },
          },
          {
            type: "text",
            text: `Create social media posts for these platforms: ${platforms.join(', ')}.

Look at this image and create compelling, platform-specific post content that describes and complements it.${topicContext}${promptContext}

Return ONLY valid JSON.`,
          },
        ],
      },
    ];
  } else {
    // Video: text-only using the generation prompt as context
    messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Create social media posts for these platforms: ${platforms.join(', ')}.

This is for a VIDEO post. Here's the context about the video:
${mediaPrompt ? `Video description/prompt: "${mediaPrompt}"` : 'A video created by the brand.'}${topicContext}

Create compelling, platform-specific post content that would accompany this video.

Return ONLY valid JSON.`,
      },
    ];
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      messages,
      temperature: 0.8,
      max_completion_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in LLM response");
  }

  const parsed = JSON.parse(content);
  logStep("Post texts generated", { platforms: Object.keys(parsed) });

  return parsed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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
    const request: PostTextRequest = await req.json();

    if (!request.company_id || !request.media_url || !request.platforms?.length) {
      throw new Error("company_id, media_url, and platforms are required");
    }

    // Calculate and deduct credits
    const creditsNeeded = CREDITS_PER_PLATFORM * request.platforms.length;

    const { data: deductResult, error: deductError } = await supabaseClient.rpc('deduct_credits', {
      _user_id: user.id,
      _credits_to_deduct: creditsNeeded,
    });

    if (deductError) {
      logStep("Credit deduction error", { error: deductError.message });
      throw new Error(`Failed to process credits: ${deductError.message}`);
    }

    if (!deductResult) {
      logStep("Insufficient credits");
      throw new Error(`Insufficient credits. AI post text generation requires ${creditsNeeded} credits (${CREDITS_PER_PLATFORM} per platform).`);
    }

    logStep("Credits deducted", { credits: creditsNeeded });

    // Fetch company data for brand context
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('id, name, mission, tone_of_voice, other_info')
      .eq('id', request.company_id)
      .eq('user_id', user.id)
      .single();

    if (companyError || !company) {
      throw new Error("Company not found or access denied");
    }

    logStep("Company loaded", { companyName: company.name });

    // Generate post texts
    const posts = await generatePostTexts(
      company,
      request.media_url,
      request.media_type || 'image',
      request.platforms,
      request.user_title,
      request.media_prompt,
    );

    return new Response(JSON.stringify({
      success: true,
      posts,
      credits_used: creditsNeeded,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
