import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEO-ENGINE] ${step}${detailsStr}`);
};

interface EngineRequest {
  action: 'generate_blog' | 'find_engagement';
  company_id: string;
  analysis_id: string;
  topic?: string; // For blog generation
}

// Credit costs for SEO Engine actions
const SEO_BLOG_CREDITS = 1;
const SEO_ENGAGEMENT_CREDITS = 2;

interface CompanyData {
  id: string;
  name: string;
  mission?: string;
  tone_of_voice?: string;
  other_info?: any;
}

interface AnalysisData {
  id: string;
  analysis_result: any;
  recommendations: string[];
  keywords: string[];
  target_audience: string;
}

// Generate blog post using OpenAI
async function generateBlogPost(
  company: CompanyData,
  analysis: AnalysisData,
  topic?: string
): Promise<{ title: string; content: string; excerpt: string; keywords: string[]; wordCount: number }> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

  logStep("Generating blog post", { topic });

  const analysisText = typeof analysis.analysis_result === 'object'
    ? analysis.analysis_result.text || JSON.stringify(analysis.analysis_result)
    : analysis.analysis_result;

  const systemPrompt = `You are an expert content writer specializing in SEO-optimized blog posts.
Your task is to write engaging, informative blog posts that:
- Are optimized for search engines
- Provide genuine value to readers
- Match the company's tone of voice
- Include relevant keywords naturally
- Are well-structured with headers

Write in a professional yet approachable style.`;

  const userPrompt = `Write a blog post for the following company:

**Company:** ${company.name}
**Mission:** ${company.mission || 'Not specified'}
**Tone of Voice:** ${company.tone_of_voice || 'Professional and friendly'}

**SEO Analysis Insights:**
${analysisText?.substring(0, 2000) || 'General SEO optimization'}

**Target Keywords:** ${(analysis.keywords || []).join(', ') || 'industry-relevant keywords'}

**Topic:** ${topic || 'Choose a topic based on the analysis recommendations and keywords that would benefit the company\'s SEO'}

Please write a complete blog post (800-1200 words) with:
1. An engaging title optimized for SEO
2. A compelling introduction
3. Well-structured body with subheadings
4. Practical takeaways
5. A conclusion with call to action

Format your response as JSON:
{
  "title": "Your SEO-Optimized Title Here",
  "content": "Full blog post content with markdown formatting...",
  "excerpt": "A 2-3 sentence excerpt for previews",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_completion_tokens: 3000,
      response_format: { type: "json_object" }
    })
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
  const wordCount = (parsed.content || '').split(/\s+/).length;

  logStep("Blog post generated", { title: parsed.title, wordCount });

  return {
    title: parsed.title || 'Untitled Blog Post',
    content: parsed.content || '',
    excerpt: parsed.excerpt || '',
    keywords: parsed.keywords || [],
    wordCount
  };
}

// Find engagement opportunities using web search simulation
// In MVP, we use LLM to generate realistic opportunities based on the company's niche
async function findEngagementOpportunities(
  company: CompanyData,
  analysis: AnalysisData
): Promise<Array<{
  platform: string;
  source_url: string;
  source_title: string;
  source_content: string;
  suggested_response: string;
  relevance_score: number;
}>> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

  logStep("Finding engagement opportunities");

  const analysisText = typeof analysis.analysis_result === 'object'
    ? analysis.analysis_result.text || JSON.stringify(analysis.analysis_result)
    : analysis.analysis_result;

  const systemPrompt = `You are an expert at finding and responding to relevant discussions online.
Your task is to identify potential engagement opportunities on platforms like Reddit, X (Twitter), and forums
where a company could add value to discussions.

Generate realistic examples of discussions that would be relevant to the company's niche.
For each opportunity, provide a helpful, non-promotional response that adds genuine value.`;

  const userPrompt = `Find engagement opportunities for:

**Company:** ${company.name}
**Mission:** ${company.mission || 'Not specified'}
**Industry Keywords:** ${(analysis.keywords || []).join(', ') || 'Not specified'}
**Target Audience:** ${analysis.target_audience || 'General'}

**SEO Analysis:**
${analysisText?.substring(0, 1500) || 'General marketing company'}

Generate 3-5 realistic engagement opportunities across platforms (Reddit, Twitter/X, forums).
For each, provide a helpful response that:
- Adds genuine value to the discussion
- Is not overtly promotional
- Positions the company as a helpful expert
- Could naturally mention the company's solution where relevant

Format as JSON:
{
  "opportunities": [
    {
      "platform": "reddit",
      "source_url": "https://reddit.com/r/relevant_subreddit/example_post",
      "source_title": "Discussion title about relevant topic",
      "source_content": "Brief excerpt of the original post/question (2-3 sentences)",
      "suggested_response": "Your helpful response (2-4 sentences)",
      "relevance_score": 85
    }
  ]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.9,
      max_completion_tokens: 2000,
      response_format: { type: "json_object" }
    })
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
  const opportunities = parsed.opportunities || [];

  logStep("Found engagement opportunities", { count: opportunities.length });

  return opportunities;
}

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
    const request: EngineRequest = await req.json();

    if (!request.company_id || !request.analysis_id || !request.action) {
      throw new Error("company_id, analysis_id, and action are required");
    }

    // Determine credits needed based on action
    const creditsNeeded = request.action === 'generate_blog' ? SEO_BLOG_CREDITS : SEO_ENGAGEMENT_CREDITS;

    // Fetch company data
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('*')
      .eq('id', request.company_id)
      .eq('user_id', user.id)
      .single();

    if (companyError || !company) {
      throw new Error("Company not found or access denied");
    }

    // Fetch analysis data
    const { data: analysis, error: analysisError } = await supabaseClient
      .from('seo_analysis')
      .select('*')
      .eq('id', request.analysis_id)
      .eq('user_id', user.id)
      .single();

    if (analysisError || !analysis) {
      throw new Error("Analysis not found or access denied");
    }

    logStep("Data loaded", { companyName: company.name, analysisId: analysis.id });

    // Handle different actions
    if (request.action === 'generate_blog') {
      const blogPost = await generateBlogPost(company, analysis, request.topic);

      // LLM succeeded — NOW deduct credits
      const { data: deductResult, error: deductError } = await supabaseClient.rpc('deduct_credits', {
        _user_id: user.id,
        _credits_to_deduct: creditsNeeded
      });
      if (deductError) throw new Error(`Failed to process credits: ${deductError.message}`);
      if (!deductResult) throw new Error(`Insufficient credits. Blog generation requires ${creditsNeeded} credit(s).`);
      logStep("Credits deducted after successful blog generation", { credits: creditsNeeded });

      // Save to database
      const { data: savedPost, error: saveError } = await supabaseClient
        .from('seo_blog_posts')
        .insert({
          company_id: request.company_id,
          user_id: user.id,
          analysis_id: request.analysis_id,
          title: blogPost.title,
          content: blogPost.content,
          excerpt: blogPost.excerpt,
          target_keywords: blogPost.keywords,
          seo_meta: {
            word_count: blogPost.wordCount,
            generated_at: new Date().toISOString()
          },
          word_count: blogPost.wordCount,
          reading_time_minutes: Math.ceil(blogPost.wordCount / 200),
          status: 'draft',
          credits_used: SEO_BLOG_CREDITS
        })
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save blog post: ${saveError.message}`);
      }

      logStep("Blog post saved", { postId: savedPost.id });

      return new Response(JSON.stringify({
        success: true,
        blog_post: savedPost,
        message: "Blog post generated successfully"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });

    } else if (request.action === 'find_engagement') {
      const opportunities = await findEngagementOpportunities(company, analysis);

      // LLM succeeded — NOW deduct credits
      const { data: deductResult2, error: deductError2 } = await supabaseClient.rpc('deduct_credits', {
        _user_id: user.id,
        _credits_to_deduct: creditsNeeded
      });
      if (deductError2) throw new Error(`Failed to process credits: ${deductError2.message}`);
      if (!deductResult2) throw new Error(`Insufficient credits. Engagement finder requires ${creditsNeeded} credit(s).`);
      logStep("Credits deducted after successful engagement search", { credits: creditsNeeded });

      // Normalize platform values to match database constraint
      const validPlatforms = ['reddit', 'twitter', 'facebook', 'quora', 'forum', 'other'];
      const normalizePlatform = (platform: string): string => {
        const p = platform.toLowerCase().trim();
        if (p === 'x' || p === 'twitter/x' || p === 'x/twitter') return 'twitter';
        if (validPlatforms.includes(p)) return p;
        return 'other';
      };

      // Save opportunities to database
      const opportunitiesToInsert = opportunities.map(opp => ({
        company_id: request.company_id,
        user_id: user.id,
        analysis_id: request.analysis_id,
        platform: normalizePlatform(opp.platform),
        source_url: opp.source_url,
        source_title: opp.source_title,
        source_content: opp.source_content,
        suggested_response: opp.suggested_response,
        relevance_score: opp.relevance_score,
        status: 'pending'
      }));

      const { data: savedOpportunities, error: saveError } = await supabaseClient
        .from('seo_engagement_opportunities')
        .insert(opportunitiesToInsert)
        .select();

      if (saveError) {
        throw new Error(`Failed to save opportunities: ${saveError.message}`);
      }

      logStep("Opportunities saved", { count: savedOpportunities?.length });

      return new Response(JSON.stringify({
        success: true,
        opportunities: savedOpportunities,
        message: `Found ${opportunities.length} engagement opportunities`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });

    } else {
      throw new Error(`Unknown action: ${request.action}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
