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
  top_results: Array<{ url: string; title: string; snippet: string }>;
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
  // (e.g. missing SERPER_API_KEY, LLM connection error) but still returned 200
  const scores = Object.values(result.platform_scores || {});
  const allZero = scores.length > 0 && scores.every(s => s === 0);
  if (allZero && result.visibility_score === 0) {
    throw new Error(
      "Analysis returned empty results (all scores are 0). This usually means the search API or LLM backend is unavailable. Please try again later."
    );
  }

  // Validate: detect partial pipeline failure where the backend returned raw mention-count
  // scores but LLM analysis actually failed. The backend signals this by including phrases
  // like "LLM analysis unavailable" or "scores based on raw mention counts" in its analysis.
  const analysisText = typeof result.analysis === 'string'
    ? result.analysis.toLowerCase()
    : '';
  const llmFailureIndicators = [
    'llm analysis unavailable',
    'scores based on raw mention counts',
    'automated analysis:',
    'llm unavailable',
    'analysis could not be completed',
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
