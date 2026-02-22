// seoService.ts
// Frontend service layer for calling the Python backend SEO endpoints.
// Follows the same pattern as ContentGenerator.tsx's direct fetch to Cloud Run.

const SEO_API_BASE = "https://gcs-gemini-openai-app-1006785094868.europe-central2.run.app";

// ── Types ────────────────────────────────────────────────────────────────────

export interface EngagementOpportunity {
  url: string;
  title: string;
  snippet: string;
  platform: string;
  relevance_score: number;
  suggested_response: string;
  engagement_reason: string;
  url_verified: boolean;
  discovered_via: string;
}

export interface SearchEngagementParams {
  company_name: string;
  keywords: string[];
  industry: string;
  target_audience: string;
  website_url: string;
  tone_of_voice: string;
}

export interface SearchEngagementResult {
  opportunities: EngagementOpportunity[];
  queries_used: string[];
  total_raw_results?: number;
  message: string;
}

export interface PlatformEvidence {
  mention_count: number;
  verified_mention_count?: number;
  top_results: Array<{
    url: string;
    title: string;
    snippet: string;
    verified_relevant?: boolean;
    trustworthiness_score?: number;
    visibility_impact?: string;
  }>;
  keyword_coverage: number;
}

export interface AnalyzePresenceParams {
  website_url: string;
  company_name: string;
  keywords: string[];
  competitors: string[];
  target_audience: string;
  buyer_persona: string;
  mission: string;
  tone_of_voice: string;
}

// 4-Pillar Types

export interface PillarScores {
  google_search: number;
  ai_visibility: number;
  community: number;
  website_technical: number;
}

export interface WebsiteAuditIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  message: string;
  recommendation?: string;
}

export interface TechStackItem {
  name: string;
  confidence: string;
  ssr?: boolean;
}

export interface WebsiteTechnicalDetails {
  crawlability_score: number;
  issues: WebsiteAuditIssue[];
  tech_stack: TechStackItem[];
  js_dependent_content: boolean;
  has_meta_title: boolean;
  has_meta_description: boolean;
  has_og_tags: boolean;
  has_sitemap: boolean;
  has_robots_txt: boolean;
  has_canonical_url: boolean;
  response_time_ms: number;
  technical_summary: string;
}

export interface AISystemResult {
  model: string;
  score: number;
  awareness: 'none' | 'partial' | 'good' | 'excellent';
  response_summary: string;
  accuracy_notes: string;
  knows_company: boolean;
  sentiment: string;
}

export interface AIVisibilityDetails {
  overall_score: number;
  systems: { chatgpt?: AISystemResult };
  key_findings: string[];
  recommendations: string[];
}

export interface MarketingPlanItem {
  action: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeframe: string;
  details: string;
}

export interface MarketingPlan {
  quick_wins?: MarketingPlanItem[];
  foundation?: MarketingPlanItem[];
  growth?: MarketingPlanItem[];
  long_term?: MarketingPlanItem[];
}

export interface PillarDetails {
  google_search: {
    evidence: Record<string, PlatformEvidence>;
    total_mentions: number;
    verified_mentions: number;
  };
  ai_visibility: AIVisibilityDetails;
  community: Record<string, PlatformEvidence>;
  website_technical: WebsiteTechnicalDetails;
}

export interface AnalyzePresenceResult {
  analysis: string;
  visibility_score: number;
  platform_scores: Record<string, number>;
  recommendations: string[];
  search_evidence: Record<string, PlatformEvidence>;
  competitor_data: Record<string, Record<string, { mention_count: number }>>;
  website_metadata: {
    title: string;
    description: string;
    pages_crawled: number;
    total_characters: number;
    url: string;
  };
  // V2 4-pillar fields
  pillar_scores?: PillarScores;
  pillar_details?: PillarDetails;
  marketing_plan?: MarketingPlan;
}

// Keyword management types

export interface ManageKeywordsParams {
  company_name: string;
  company_description: string;
  industry: string;
  target_audience: string;
  existing_keywords: string[];
  action: 'suggest' | 'analyze';
}

export interface KeywordSuggestion {
  keyword: string;
  category: 'primary' | 'secondary' | 'long-tail' | 'brand' | 'competitor';
  reasoning: string;
  estimated_difficulty: string;
}

export interface KeywordAnalysis {
  keyword: string;
  seo_value_score: number;
  search_volume_estimate: string;
  difficulty_estimate: string;
  recommendation: string;
}

export interface ManageKeywordsResult {
  keywords?: KeywordSuggestion[];
  analysis?: KeywordAnalysis[];
  action: string;
  error?: string;
}

// ── API Functions ────────────────────────────────────────────────────────────

export async function searchEngagement(
  params: SearchEngagementParams
): Promise<SearchEngagementResult> {
  const response = await fetch(`${SEO_API_BASE}/seo/search-engagement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: "Engagement search failed.",
    }));
    throw new Error(errorData?.detail || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function analyzePresence(
  params: AnalyzePresenceParams
): Promise<AnalyzePresenceResult> {
  const response = await fetch(`${SEO_API_BASE}/seo/analyze-presence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: "Presence analysis failed.",
    }));
    throw new Error(errorData?.detail || `Server error: ${response.status}`);
  }

  const result: AnalyzePresenceResult = await response.json();

  // Validate: if all platform scores are 0 and visibility is 0, the backend likely failed
  const scores = Object.values(result.platform_scores || {});
  const allZero = scores.length > 0 && scores.every(s => s === 0);
  if (allZero && result.visibility_score === 0) {
    throw new Error(
      "Analysis returned empty results (all scores are 0). This usually means the search API or LLM backend is unavailable. Please try again later."
    );
  }

  // Validate: detect partial pipeline failure
  const analysisText = typeof result.analysis === 'string'
    ? result.analysis.toLowerCase()
    : '';
  const llmFailureIndicators = [
    'llm analysis unavailable',
    'scores based on raw mention counts',
    'automated analysis:',
    'llm unavailable',
    'analysis could not be completed',
    'llm synthesis unavailable',
  ];
  const isPartialFailure = llmFailureIndicators.some(indicator =>
    analysisText.includes(indicator)
  );

  if (isPartialFailure) {
    throw new Error(
      "The SEO analysis pipeline did not complete fully — the LLM analysis step failed. " +
      "No credits were deducted. Please try again later."
    );
  }

  return result;
}

export async function manageKeywords(
  params: ManageKeywordsParams
): Promise<ManageKeywordsResult> {
  const response = await fetch(`${SEO_API_BASE}/seo/manage-keywords`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: "Keyword management failed.",
    }));
    throw new Error(errorData?.detail || `Server error: ${response.status}`);
  }

  return response.json();
}
