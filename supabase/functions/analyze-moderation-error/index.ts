/**
 * Analyze Moderation Error
 * ========================
 *
 * This edge function uses an LLM to analyze why a video generation prompt
 * may have been blocked by OpenAI's moderation system, and provides
 * actionable suggestions for the user.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-MODERATION] ${step}${detailsStr}`);
};

interface AnalysisRequest {
  prompt: string;
  error_code?: string;
}

interface AnalysisResponse {
  success: boolean;
  analysis?: string;
  error?: string;
}

const SYSTEM_PROMPT = `You are an expert at analyzing AI content moderation systems, specifically OpenAI's Sora video generation moderation.

Your task is to analyze a video generation prompt that was blocked by moderation and provide helpful, actionable feedback.

Guidelines for your analysis:
1. Be concise (2-4 sentences max)
2. Identify the most likely trigger(s) in the prompt
3. Suggest specific, actionable changes
4. Be supportive and constructive, not judgmental
5. Focus on how to achieve the user's creative intent within moderation guidelines

Common moderation triggers for video generation:
- Close-up references to eyes, faces, or facial features (can trigger deepfake concerns)
- "Pushing into" or "through" body parts (manipulation concerns)
- Surreal transformations of human features
- Descriptions that could be interpreted as violence or harm
- Content that could be seen as creating fake footage of real scenarios
- Overly detailed descriptions of human anatomy

Format your response as:
**Likely trigger:** [brief explanation]
**Suggested fix:** [specific rewording or approach]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    // Parse request
    const request: AnalysisRequest = await req.json();

    if (!request.prompt) {
      throw new Error("Prompt is required for analysis");
    }

    logStep("Analyzing prompt", { promptLength: request.prompt.length });

    // Call OpenAI to analyze the prompt
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Fast and cost-effective
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `This video generation prompt was blocked by moderation:\n\n"${request.prompt}"\n\nPlease analyze why it might have been blocked and suggest how to modify it.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("OpenAI API error", { status: response.status, error: errorText });
      throw new Error("Failed to analyze prompt");
    }

    const result = await response.json();
    const analysis = result.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error("No analysis returned from AI");
    }

    logStep("Analysis complete", { analysisLength: analysis.length });

    const responseData: AnalysisResponse = {
      success: true,
      analysis,
    };

    return new Response(JSON.stringify(responseData), {
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
