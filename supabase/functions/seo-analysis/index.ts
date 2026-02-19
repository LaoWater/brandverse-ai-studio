import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEO-ANALYSIS] ${step}${detailsStr}`);
};

interface AnalysisRequest {
  company_id: string;
  website_url?: string;  // PRIMARY - user provides this directly
  target_audience?: string;
  buyer_persona?: string;
  competitors?: string[];
  keywords?: string[];
}

interface CompanyData {
  id: string;
  name: string;
  mission?: string;
  tone_of_voice?: string;
  other_info?: any;
}

// Extract text and metadata from HTML
function extractFromHtml(html: string): { text: string; title: string; description: string; links: string[] } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract internal links for further crawling
  const linkMatches = html.matchAll(/<a[^>]*href=["']([^"'#]*?)["']/gi);
  const links: string[] = [];
  for (const match of linkMatches) {
    if (match[1] && !match[1].startsWith('mailto:') && !match[1].startsWith('tel:')) {
      links.push(match[1]);
    }
  }

  // Extract text content
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '') // Remove nav for cleaner content
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footer
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // Remove header nav
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { text: textContent, title, description, links };
}

// Fetch a single page
async function fetchPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandverseBot/1.0; +https://brandverse.ai)'
      }
    });
    if (!response.ok) return '';
    return await response.text();
  } catch {
    return '';
  }
}

// Deep website analysis - fetches main page and key subpages
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    // Clean up the URL
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const baseUrl = new URL(cleanUrl);
    logStep("Starting deep website analysis", { url: cleanUrl });

    // Fetch main page
    const mainHtml = await fetchPage(cleanUrl);
    if (!mainHtml) {
      throw new Error("Could not fetch main page");
    }

    const mainContent = extractFromHtml(mainHtml);
    let allContent = `=== HOMEPAGE ===\nTitle: ${mainContent.title}\nDescription: ${mainContent.description}\n\n${mainContent.text.substring(0, 5000)}\n\n`;

    // Find important pages to crawl (about, services, products, etc.)
    const importantPaths = ['/about', '/services', '/products', '/pricing', '/features', '/blog', '/contact'];
    const internalLinks = mainContent.links
      .filter(link => {
        if (link.startsWith('/')) return true;
        try {
          const linkUrl = new URL(link);
          return linkUrl.hostname === baseUrl.hostname;
        } catch {
          return false;
        }
      })
      .slice(0, 10); // Limit to 10 links

    // Prioritize important pages
    const pagesToFetch: string[] = [];
    for (const path of importantPaths) {
      const found = internalLinks.find(l => l.toLowerCase().includes(path));
      if (found) {
        const fullUrl = found.startsWith('/') ? `${baseUrl.origin}${found}` : found;
        pagesToFetch.push(fullUrl);
      }
    }

    // Add some other internal links
    for (const link of internalLinks.slice(0, 5)) {
      const fullUrl = link.startsWith('/') ? `${baseUrl.origin}${link}` : link;
      if (!pagesToFetch.includes(fullUrl) && pagesToFetch.length < 5) {
        pagesToFetch.push(fullUrl);
      }
    }

    logStep("Fetching subpages", { count: pagesToFetch.length });

    // Fetch subpages in parallel (limited to 3 for speed)
    const subpagePromises = pagesToFetch.slice(0, 3).map(async (pageUrl) => {
      const html = await fetchPage(pageUrl);
      if (!html) return '';
      const content = extractFromHtml(html);
      const pageName = new URL(pageUrl).pathname || 'page';
      return `=== ${pageName.toUpperCase()} ===\nTitle: ${content.title}\n${content.text.substring(0, 2000)}\n\n`;
    });

    const subpageContents = await Promise.all(subpagePromises);
    allContent += subpageContents.filter(Boolean).join('');

    logStep("Website content fetched", { totalLength: allContent.length, pagesAnalyzed: pagesToFetch.length + 1 });
    return allContent.substring(0, 15000); // Limit total to 15k chars

  } catch (error: any) {
    logStep("Failed to fetch website", { error: error.message });
    return '';
  }
}

// Run LLM analysis using OpenAI
async function runLLMAnalysis(
  company: CompanyData,
  websiteContent: string,
  targetAudience: string,
  buyerPersona: string,
  competitors: string[],
  keywords: string[]
): Promise<{ analysis: string; visibilityScore: number; platformScores: any; recommendations: string[] }> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

  logStep("Running LLM analysis");

  const systemPrompt = `You are an expert SEO analyst specializing in modern multi-platform visibility strategy.
Your task is to analyze a company's online presence and provide actionable insights.

Consider the modern SEO landscape where buying decisions happen across multiple platforms:
- Google (27% of decisions) - Traditional search
- TikTok (18%) - Discovery and trends
- YouTube (15%) - In-depth content and reviews
- Reddit (12%) - Authentic discussions and recommendations
- AI Assistants like ChatGPT (10%) - AI-powered recommendations
- Amazon (8%) - Reviews and social proof

Provide analysis in a clear, structured format with:
1. Executive Summary
2. Current Visibility Assessment
3. Platform-Specific Recommendations
4. Content Strategy Suggestions
5. Quick Wins (immediate actions)
6. Long-term Strategy

Be specific and actionable. Reference the company's actual information when providing recommendations.`;

  const userPrompt = `Analyze the following company for SEO and multi-platform visibility:

**Company Name:** ${company.name}
**Mission:** ${company.mission || 'Not specified'}
**Tone of Voice:** ${company.tone_of_voice || 'Not specified'}
**Additional Info:** ${typeof company.other_info === 'string' ? company.other_info : JSON.stringify(company.other_info || {})}

${websiteContent ? `**Website Content (excerpt):**\n${websiteContent.substring(0, 3000)}` : ''}

${targetAudience ? `**Target Audience:** ${targetAudience}` : ''}
${buyerPersona ? `**Buyer Persona:** ${buyerPersona}` : ''}
${competitors.length > 0 ? `**Competitors:** ${competitors.join(', ')}` : ''}
${keywords.length > 0 ? `**Target Keywords:** ${keywords.join(', ')}` : ''}

Please provide:
1. A comprehensive SEO analysis
2. An overall visibility score (0-100)
3. Individual platform scores (google, tiktok, youtube, reddit, ai, amazon) from 0-100
4. Top 5 specific recommendations

Format your response as JSON with this structure:
{
  "analysis": "Your detailed analysis text here...",
  "visibilityScore": 45,
  "platformScores": {
    "google": 60,
    "tiktok": 20,
    "youtube": 30,
    "reddit": 25,
    "ai": 40,
    "amazon": 15
  },
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3",
    "Recommendation 4",
    "Recommendation 5"
  ]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_completion_tokens: 4000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    logStep("OpenAI API error", { status: response.status, error });
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in LLM response");
  }

  logStep("LLM analysis completed");

  try {
    const parsed = JSON.parse(content);
    return {
      analysis: parsed.analysis || content,
      visibilityScore: parsed.visibilityScore || 50,
      platformScores: parsed.platformScores || {},
      recommendations: parsed.recommendations || []
    };
  } catch {
    // If parsing fails, return the raw content
    return {
      analysis: content,
      visibilityScore: 50,
      platformScores: {},
      recommendations: []
    };
  }
}

// Credit cost for SEO Analysis
const SEO_ANALYSIS_CREDITS = 3;

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

    // Check and deduct credits BEFORE running analysis
    const { data: deductResult, error: deductError } = await supabaseClient.rpc('deduct_credits', {
      _user_id: user.id,
      _credits_to_deduct: SEO_ANALYSIS_CREDITS
    });

    if (deductError) {
      logStep("Credit deduction error", { error: deductError.message });
      throw new Error(`Failed to process credits: ${deductError.message}`);
    }

    if (!deductResult) {
      logStep("Insufficient credits");
      throw new Error(`Insufficient credits. SEO Analysis requires ${SEO_ANALYSIS_CREDITS} credits.`);
    }

    logStep("Credits deducted", { credits: SEO_ANALYSIS_CREDITS });

    // Parse request
    const request: AnalysisRequest = await req.json();

    if (!request.company_id) {
      throw new Error("company_id is required");
    }

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

    logStep("Company loaded", { companyName: company.name });

    // Get website URL - prioritize user-provided URL, then fall back to company info
    let websiteUrl = request.website_url || '';

    if (!websiteUrl) {
      // Fall back to company's other_info
      const otherInfo = company.other_info;
      if (typeof otherInfo === 'string') {
        if (otherInfo.includes('.') && !otherInfo.includes(' ')) {
          websiteUrl = otherInfo;
        }
      } else if (otherInfo && typeof otherInfo === 'object') {
        websiteUrl = otherInfo.website || otherInfo.url || '';
      }
    }

    // Fetch website content - this is the core of the analysis
    let websiteContent = '';
    if (websiteUrl) {
      logStep("Fetching website for deep analysis", { url: websiteUrl });
      websiteContent = await fetchWebsiteContent(websiteUrl);
    } else {
      logStep("No website URL provided - analysis will be limited");
    }

    // Run LLM analysis
    const analysisResult = await runLLMAnalysis(
      company,
      websiteContent,
      request.target_audience || '',
      request.buyer_persona || '',
      request.competitors || [],
      request.keywords || []
    );

    // Save analysis to database
    const { data: savedAnalysis, error: saveError } = await supabaseClient
      .from('seo_analysis')
      .insert({
        company_id: request.company_id,
        user_id: user.id,
        target_audience: request.target_audience,
        buyer_persona: request.buyer_persona ? { description: request.buyer_persona } : {},
        competitors: request.competitors,
        keywords: request.keywords,
        analysis_result: { text: analysisResult.analysis },
        visibility_score: analysisResult.visibilityScore,
        platform_scores: analysisResult.platformScores,
        recommendations: analysisResult.recommendations,
        status: 'completed',
        credits_used: SEO_ANALYSIS_CREDITS
      })
      .select()
      .single();

    if (saveError) {
      logStep("Error saving analysis", { error: saveError });
      throw new Error(`Failed to save analysis: ${saveError.message}`);
    }

    logStep("Analysis saved successfully", { analysisId: savedAnalysis.id });

    return new Response(JSON.stringify({
      success: true,
      analysis: savedAnalysis,
      message: "SEO analysis completed successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

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
