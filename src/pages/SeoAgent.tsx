import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Globe,
  TrendingUp,
  Target,
  Youtube,
  ShoppingCart,
  ArrowRight,
  CheckCircle2,
  Brain,
  BarChart3,
  Rocket,
  Settings,
  AlertCircle,
  Loader2,
  FileText,
  Users,
  PenTool,
  ExternalLink,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Link2,
  Building2,
  ChevronDown,
  ChevronUp,
  Wand2
} from "lucide-react";
import { FaTiktok, FaRedditAlien, FaXTwitter } from "react-icons/fa6";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SeoTab = 'overview' | 'analysis' | 'engine';

const SeoAgent = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { selectedCompany, loading: companyLoading } = useCompany();
  const [activeTab, setActiveTab] = useState<SeoTab>('overview');

  // Analysis form state - Website is PRIMARY
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetAudience, setTargetAudience] = useState('');
  const [buyerPersona, setBuyerPersona] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Engine state
  const [blogTopic, setBlogTopic] = useState('');
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [isSearchingEngagement, setIsSearchingEngagement] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load saved preferences from latest analysis
  useEffect(() => {
    if (latestAnalysis) {
      // Pre-fill from previous analysis
      if (latestAnalysis.target_audience) setTargetAudience(latestAnalysis.target_audience);
      if (latestAnalysis.buyer_persona?.description) setBuyerPersona(latestAnalysis.buyer_persona.description);
      if (latestAnalysis.competitors?.length) setCompetitors(latestAnalysis.competitors.join(', '));
      if (latestAnalysis.keywords?.length) setKeywords(latestAnalysis.keywords.join(', '));
    }
  }, []);

  // Extract website from company other_info or set default
  useEffect(() => {
    if (selectedCompany?.other_info) {
      const info = selectedCompany.other_info;
      if (typeof info === 'string' && info.includes('.')) {
        setWebsiteUrl(info);
      } else if (typeof info === 'object' && info.website) {
        setWebsiteUrl(info.website);
      }
    }
  }, [selectedCompany]);

  // Fetch latest analysis for the selected company
  const { data: latestAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['seo-analysis', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany?.id) return null;

      const { data, error } = await supabase
        .from('seo_analysis')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!selectedCompany?.id
  });

  // Fetch blog posts for the company
  const { data: blogPosts } = useQuery({
    queryKey: ['seo-blog-posts', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany?.id) return [];

      const { data, error } = await supabase
        .from('seo_blog_posts')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCompany?.id
  });

  // Fetch engagement opportunities
  const { data: engagementOpportunities } = useQuery({
    queryKey: ['seo-engagement', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany?.id) return [];

      const { data, error } = await supabase
        .from('seo_engagement_opportunities')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCompany?.id
  });

  // Run SEO Analysis
  const runAnalysis = async () => {
    if (!selectedCompany?.id) {
      toast.error("Please select a company first");
      return;
    }

    if (!websiteUrl.trim()) {
      toast.error("Please enter your website URL");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-analysis', {
        body: {
          company_id: selectedCompany.id,
          website_url: websiteUrl.trim(),
          target_audience: targetAudience,
          buyer_persona: buyerPersona,
          competitors: competitors.split(',').map(c => c.trim()).filter(Boolean),
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean)
        }
      });

      if (error) {
        throw new Error(error.message || 'Analysis failed');
      }

      toast.success("SEO Analysis completed!");
      queryClient.invalidateQueries({ queryKey: ['seo-analysis'] });

      // Auto-switch to engine tab after successful analysis
      setActiveTab('engine');

    } catch (error: any) {
      toast.error(error.message || "Failed to run analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate blog post
  const generateBlogPost = async () => {
    if (!selectedCompany?.id || !latestAnalysis) {
      toast.error("Please run an analysis first");
      return;
    }

    setIsGeneratingBlog(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-engine`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'generate_blog',
          company_id: selectedCompany.id,
          analysis_id: latestAnalysis.id,
          topic: blogTopic
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Blog generation failed');
      }

      toast.success("Blog post generated!");
      setBlogTopic('');
      queryClient.invalidateQueries({ queryKey: ['seo-blog-posts'] });

    } catch (error: any) {
      toast.error(error.message || "Failed to generate blog post");
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  // Search for engagement opportunities
  const searchEngagement = async () => {
    if (!selectedCompany?.id || !latestAnalysis) {
      toast.error("Please run an analysis first");
      return;
    }

    setIsSearchingEngagement(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-engine`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'find_engagement',
          company_id: selectedCompany.id,
          analysis_id: latestAnalysis.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Engagement search failed');
      }

      toast.success("Found new engagement opportunities!");
      queryClient.invalidateQueries({ queryKey: ['seo-engagement'] });

    } catch (error: any) {
      toast.error(error.message || "Failed to find engagement opportunities");
    } finally {
      setIsSearchingEngagement(false);
    }
  };

  // Update engagement opportunity status
  const updateEngagementStatus = async (id: string, status: 'used' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('seo_engagement_opportunities')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast.success(status === 'used' ? "Marked as used!" : "Dismissed");
      queryClient.invalidateQueries({ queryKey: ['seo-engagement'] });
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const platforms = [
    {
      name: "Google",
      icon: <Search className="w-8 h-8" />,
      percentage: "27%",
      description: "Traditional search - still important, but only part of the story",
      color: "from-blue-500 to-blue-600"
    },
    {
      name: "TikTok",
      icon: <FaTiktok className="w-8 h-8" />,
      percentage: "18%",
      description: "Emotional, visual, novelty-driven discovery",
      color: "from-pink-500 to-purple-600"
    },
    {
      name: "YouTube",
      icon: <Youtube className="w-8 h-8" />,
      percentage: "15%",
      description: "In-depth, authoritative content for evaluation",
      color: "from-red-500 to-red-600"
    },
    {
      name: "Reddit",
      icon: <FaRedditAlien className="w-8 h-8" />,
      percentage: "12%",
      description: "Raw authenticity and unfiltered opinions",
      color: "from-orange-500 to-orange-600"
    },
    {
      name: "ChatGPT & AI",
      icon: <Brain className="w-8 h-8" />,
      percentage: "10%",
      description: "AI assistants recommending based on trust signals",
      color: "from-emerald-500 to-teal-600"
    },
    {
      name: "Amazon",
      icon: <ShoppingCart className="w-8 h-8" />,
      percentage: "8%",
      description: "Social proof via reviews and trust signals",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const capabilities = [
    {
      icon: <Target className="w-6 h-6 text-accent" />,
      title: "Multi-Platform Visibility Analysis",
      description: "See where your startup appears (or doesn't) across all major decision platforms"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-accent" />,
      title: "Competitor Presence Mapping",
      description: "Discover where your competitors are gaining traction and find untapped opportunities"
    },
    {
      icon: <Wand2 className="w-6 h-6 text-accent" />,
      title: "AI-Powered Recommendations",
      description: "Get actionable insights on which platforms to prioritize and what content to create"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-accent" />,
      title: "Visibility Score Tracking",
      description: "Monitor your discoverability across the decision landscape over time"
    }
  ];

  const tabs: { id: SeoTab; label: string; sublabel: string }[] = [
    { id: 'overview', label: 'SEO', sublabel: 'Overview' },
    { id: 'analysis', label: 'SEO', sublabel: 'Analysis' },
    { id: 'engine', label: 'SEO', sublabel: 'Engine' }
  ];

  // Check if user needs to login or company needs setup
  const needsLogin = !authLoading && !user;
  const needsCompanySetup = !companyLoading && (!selectedCompany || !selectedCompany.name);
  const hasAnalysis = !!latestAnalysis;

  // Format analysis result for display
  const formatAnalysisResult = (result: any) => {
    if (!result) return '';
    if (typeof result === 'string') return result;
    if (result.text) return result.text;
    return JSON.stringify(result, null, 2);
  };

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-accent/15 rounded-full blur-3xl"></div>
      </div>

      <main className="pt-24 pb-16 relative z-10">
        <div className="container mx-auto px-6">
          {/* Sliding Tabs Header with Company Logo */}
          <div className="relative flex items-center justify-center mb-8">
            {/* Tabs */}
            <div className="relative inline-flex items-center bg-muted/50 dark:bg-black/30 rounded-full p-2 border-0 will-change-auto">
              {/* Sliding indicator */}
              <div
                className="absolute top-1.5 bottom-1.5 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out will-change-transform"
                style={{
                  width: `calc(${100 / tabs.length}% - 8px)`,
                  transform: `translateX(calc(${tabs.findIndex(t => t.id === activeTab) * 100}% + 6px + ${tabs.findIndex(t => t.id === activeTab) * 4}px))`,
                }}
              />

              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 px-6 py-3.5 rounded-full text-lg font-semibold transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.label} <span className={`font-serif ${activeTab === tab.id ? 'text-white' : 'text-cosmic'}`}>{tab.sublabel}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Company Logo - Absolute Top Right */}
            {selectedCompany && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
                {selectedCompany.logo_path ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <img
                      src={selectedCompany.logo_path}
                      alt={selectedCompany.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                    {selectedCompany.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-base font-medium text-white">{selectedCompany.name}</span>
              </div>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              {/* Hero Section */}
              <div className="text-center mb-16">
                <div className="max-w-4xl mx-auto space-y-6">
                  <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                    <span className="text-cosmic font-serif flex items-center justify-center gap-3">
                      <Globe className="w-12 h-12 md:w-14 md:h-14 text-accent animate-pulse" />
                      SEO Everywhere
                    </span>
                    <span className="text-white block mt-2">Agent</span>
                  </h1>

                  <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                    Traditional SEO is changing. 73% of buying decisions happen outside Google.
                    Our AI agent analyzes your visibility across the entire modern decision landscape.
                  </p>
                </div>
              </div>

              {/* The Problem Section */}
              <Card className="cosmic-card border-accent/30 mb-16 overflow-hidden">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl text-white">
                    The <span className="text-cosmic font-serif">Google Trap</span>
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-lg max-w-2xl mx-auto">
                    This is a concept first unveiled by NpDigital. Reflect on your own buying flow - or watch others -
                    and you'll understand how in modern times only a fraction of the decision is happening on Google anymore.
                    You're optimizing for Google while your customers are deciding on TikTok, YouTube, Reddit, and ChatGPT.
                    {" "}
                    <br></br>
                    <a
                      href="https://www.youtube.com/watch?v=39o0uYPo4jU"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 underline transition-colors"
                    >
                      Video by NpDigital
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {platforms.map((platform) => (
                      <div
                        key={platform.name}
                        className="relative group p-6 rounded-xl bg-white/5 border border-white/10 hover:border-accent/40 transition-all duration-300 hover:scale-105"
                      >
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                          {platform.icon}
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-3xl font-bold text-accent">{platform.percentage}</span>
                          <span className="text-gray-400 text-sm">of decisions</span>
                        </div>
                        <h3 className="text-white font-semibold mb-1">{platform.name}</h3>
                        <p className="text-gray-400 text-sm">{platform.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
                    <p className="text-center text-gray-300">
                      <span className="text-accent font-bold">The insight:</span> Consumers aren't searching anymore - they're deciding in micro-moments
                      across dozens of platforms simultaneously. Each platform has its own decision psychology.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* What SEO Agent Does */}
              <div className="mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
                  What the <span className="text-cosmic font-serif">SEO Agent</span> Does
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {capabilities.map((capability, index) => (
                    <Card key={index} className="cosmic-card border-0 hover:border-accent/30 transition-all duration-300">
                      <CardContent className="p-6 flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          {capability.icon}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-2">{capability.title}</h3>
                          <p className="text-gray-400">{capability.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* CTA Section */}
              <div className="text-center">
                <div className="max-w-2xl mx-auto space-y-6">
                  <h3 className="text-3xl font-bold text-white">
                    Ready to <span className="text-cosmic font-serif">Get Started?</span>
                  </h3>
                  <p className="text-gray-300 text-lg">
                    Run your first SEO analysis to understand your visibility across the modern decision landscape.
                  </p>
                  <Button
                    size="lg"
                    className="cosmic-button px-8 py-6 text-lg font-semibold"
                    onClick={() => setActiveTab('analysis')}
                  >
                    <Rocket className="mr-2 w-5 h-5" />
                    Start Analysis
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">
                  SEO <span className="text-cosmic font-serif">Analysis</span>
                </h1>
                <p className="text-gray-300 text-lg">
                  Enter your website and we'll deeply analyze your online presence
                </p>
              </div>

              {/* Auth Check */}
              {needsLogin ? (
                <Card className="cosmic-card border-accent/30 mb-8">
                  <CardContent className="p-8 text-center">
                    <Globe className="w-16 h-16 text-accent mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Sign In to Get Started</h3>
                    <p className="text-gray-300 mb-6">
                      Create an account or sign in to run SEO analysis and unlock powerful insights
                      about your online presence across all major platforms.
                    </p>
                    <Button
                      className="cosmic-button"
                      onClick={() => navigate('/auth')}
                    >
                      Sign In to Continue
                    </Button>
                  </CardContent>
                </Card>
              ) : needsCompanySetup ? (
                <Card className="cosmic-card border-amber-500/30 mb-8">
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Company Setup Required</h3>
                    <p className="text-gray-300 mb-6">
                      To run an SEO analysis, you need to set up your company first. We'll use your company information
                      to understand your business and analyze your online presence.
                    </p>
                    <Button
                      className="cosmic-button"
                      onClick={() => navigate('/settings')}
                    >
                      <Settings className="mr-2 w-5 h-5" />
                      Go to Settings
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Main Analysis Card - Website First */}
                  <Card className="cosmic-card mb-8">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Link2 className="w-5 h-5 text-white" />
                        </div>
                        Analyze Your Website
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        We'll crawl your website, understand your business, and provide a comprehensive SEO analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Website URL - Primary Input */}
                      <div>
                        <Label htmlFor="websiteUrl" className="text-white text-lg flex items-center gap-2">
                          <Globe className="w-4 h-4 text-accent" />
                          Website URL
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="websiteUrl"
                            placeholder="https://yourcompany.com"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            className="bg-white/5 border-white/20 text-white pl-4 pr-4 py-6 text-lg"
                          />
                        </div>
                        <p className="text-gray-500 text-sm mt-2">
                          Enter your main website URL. We'll analyze the content, structure, and SEO elements.
                        </p>
                      </div>

                      {/* Company Info Summary */}
                      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{selectedCompany?.name}</p>
                          {selectedCompany?.mission && (
                            <p className="text-gray-400 text-sm line-clamp-1">{selectedCompany.mission}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                          onClick={() => navigate('/settings')}
                        >
                          Edit
                        </Button>
                      </div>

                      {/* Advanced Options Toggle */}
                      <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full justify-center py-2"
                      >
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span className="text-sm">{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
                      </button>

                      {/* Advanced Options */}
                      {showAdvanced && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                          <div>
                            <Label htmlFor="targetAudience" className="text-white">Target Audience</Label>
                            <Textarea
                              id="targetAudience"
                              placeholder="e.g., 'Small business owners aged 30-50 looking to automate their marketing'"
                              value={targetAudience}
                              onChange={(e) => setTargetAudience(e.target.value)}
                              className="bg-white/5 border-white/20 text-white mt-2"
                              rows={2}
                            />
                          </div>

                          <div>
                            <Label htmlFor="buyerPersona" className="text-white">Buyer Persona</Label>
                            <Textarea
                              id="buyerPersona"
                              placeholder="e.g., 'Marketing Manager at mid-size company, tech-savvy, budget-conscious'"
                              value={buyerPersona}
                              onChange={(e) => setBuyerPersona(e.target.value)}
                              className="bg-white/5 border-white/20 text-white mt-2"
                              rows={2}
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="competitors" className="text-white">Competitors</Label>
                              <Input
                                id="competitors"
                                placeholder="competitor1.com, competitor2.com"
                                value={competitors}
                                onChange={(e) => setCompetitors(e.target.value)}
                                className="bg-white/5 border-white/20 text-white mt-2"
                              />
                            </div>

                            <div>
                              <Label htmlFor="keywords" className="text-white">Target Keywords</Label>
                              <Input
                                id="keywords"
                                placeholder="AI marketing, content automation"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                className="bg-white/5 border-white/20 text-white mt-2"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Run Analysis Button */}
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white py-6 text-lg font-semibold"
                        onClick={runAnalysis}
                        disabled={isAnalyzing || !websiteUrl.trim()}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                            Analyzing your website...
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 w-5 h-5" />
                            Run SEO Analysis
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Previous Analysis Results */}
                  {latestAnalysis && (
                    <Card className="cosmic-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white">Latest Analysis Results</CardTitle>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {new Date(latestAnalysis.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Visibility Score */}
                        {latestAnalysis.visibility_score && (
                          <div className="mb-6 flex items-center justify-center gap-8">
                            <div className="text-center">
                              <div className="text-6xl font-bold text-accent mb-1">
                                {latestAnalysis.visibility_score}
                              </div>
                              <p className="text-gray-400">Visibility Score</p>
                            </div>

                            {/* Platform Scores */}
                            {latestAnalysis.platform_scores && Object.keys(latestAnalysis.platform_scores).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(latestAnalysis.platform_scores).map(([platform, score]) => (
                                  <div key={platform} className="px-3 py-2 bg-white/5 rounded-lg text-center">
                                    <div className="text-lg font-semibold text-white">{score as number}</div>
                                    <div className="text-xs text-gray-500 capitalize">{platform}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Analysis Text */}
                        {latestAnalysis.analysis_result && (
                          <div className="bg-white/5 rounded-lg p-6 text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {formatAnalysisResult(latestAnalysis.analysis_result)}
                          </div>
                        )}

                        {/* Recommendations */}
                        {latestAnalysis.recommendations && latestAnalysis.recommendations.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-white font-semibold mb-3">Top Recommendations</h4>
                            <div className="space-y-2">
                              {latestAnalysis.recommendations.map((rec: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
                                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-accent text-sm font-medium">{idx + 1}</span>
                                  </div>
                                  <p className="text-gray-300 text-sm">{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-6 flex justify-center">
                          <Button
                            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                            onClick={() => setActiveTab('engine')}
                          >
                            Go to SEO Engine
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'engine' && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">
                  SEO <span className="text-cosmic font-serif">Engine</span>
                </h1>
                <p className="text-gray-300 text-lg">
                  Generate content and find engagement opportunities based on your analysis
                </p>
              </div>

              {/* Auth Check */}
              {needsLogin ? (
                <Card className="cosmic-card border-accent/30 max-w-2xl mx-auto">
                  <CardContent className="p-8 text-center">
                    <Rocket className="w-16 h-16 text-accent mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Sign In to Access SEO Engine</h3>
                    <p className="text-gray-300 mb-6">
                      Create an account or sign in to generate SEO-optimized content
                      and discover engagement opportunities across platforms.
                    </p>
                    <Button
                      className="cosmic-button"
                      onClick={() => navigate('/auth')}
                    >
                      Sign In to Continue
                    </Button>
                  </CardContent>
                </Card>
              ) : !hasAnalysis ? (
                <Card className="cosmic-card border-amber-500/30 max-w-2xl mx-auto">
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Analysis Required</h3>
                    <p className="text-gray-300 mb-6">
                      Run an SEO analysis first to unlock the SEO Engine features.
                      The engine uses your analysis data to generate relevant content and find engagement opportunities.
                    </p>
                    <Button
                      className="cosmic-button"
                      onClick={() => setActiveTab('analysis')}
                    >
                      <BarChart3 className="mr-2 w-5 h-5" />
                      Go to Analysis
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Blog Post Generator */}
                  <div className="space-y-6">
                    <Card className="cosmic-card">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-accent" />
                          Blog Post Generator
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Generate SEO-optimized blog posts based on your analysis
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="blogTopic" className="text-white">Topic or Title (Optional)</Label>
                          <Input
                            id="blogTopic"
                            placeholder="Leave empty for AI suggestion based on analysis"
                            value={blogTopic}
                            onChange={(e) => setBlogTopic(e.target.value)}
                            className="bg-white/5 border-white/20 text-white mt-2"
                          />
                        </div>
                        <Button
                          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                          onClick={generateBlogPost}
                          disabled={isGeneratingBlog}
                        >
                          {isGeneratingBlog ? (
                            <>
                              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <PenTool className="mr-2 w-5 h-5" />
                              Generate Blog Post
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Generated Blog Posts */}
                    {blogPosts && blogPosts.length > 0 && (
                      <Card className="cosmic-card">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Generated Posts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {blogPosts.map((post: any) => (
                            <div
                              key={post.id}
                              className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-accent/30 transition-colors"
                            >
                              <h4 className="text-white font-medium mb-1">{post.title}</h4>
                              <p className="text-gray-400 text-sm line-clamp-2">{post.excerpt || post.content?.substring(0, 150)}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                                  {post.word_count || 0} words
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(post.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Engagement Finder */}
                  <div className="space-y-6">
                    <Card className="cosmic-card">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Users className="w-5 h-5 text-accent" />
                          Engagement Finder
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Find opportunities to engage on Reddit, X, and forums
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                          onClick={searchEngagement}
                          disabled={isSearchingEngagement}
                        >
                          {isSearchingEngagement ? (
                            <>
                              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 w-5 h-5" />
                              Find Opportunities
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Engagement Opportunities */}
                    {engagementOpportunities && engagementOpportunities.length > 0 && (
                      <Card className="cosmic-card">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Engagement Opportunities</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {engagementOpportunities.filter((o: any) => o.status === 'pending').map((opportunity: any) => (
                            <div
                              key={opportunity.id}
                              className="p-4 bg-white/5 rounded-lg border border-white/10"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-white/10 text-white border-0 capitalize">
                                  {opportunity.platform === 'reddit' && <FaRedditAlien className="w-3 h-3 mr-1" />}
                                  {opportunity.platform === 'twitter' && <FaXTwitter className="w-3 h-3 mr-1" />}
                                  {opportunity.platform}
                                </Badge>
                                {opportunity.relevance_score && (
                                  <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                                    {opportunity.relevance_score}% match
                                  </Badge>
                                )}
                              </div>

                              <h4 className="text-white font-medium mb-2">{opportunity.source_title}</h4>

                              {opportunity.source_content && (
                                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                  {opportunity.source_content}
                                </p>
                              )}

                              {opportunity.suggested_response && (
                                <div className="bg-accent/10 rounded-lg p-3 mb-3">
                                  <p className="text-sm text-gray-300">{opportunity.suggested_response}</p>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                {opportunity.source_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10"
                                    onClick={() => window.open(opportunity.source_url, '_blank')}
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/20 text-white hover:bg-white/10"
                                  onClick={() => copyToClipboard(opportunity.suggested_response || '', opportunity.id)}
                                >
                                  {copiedId === opportunity.id ? (
                                    <Check className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Copy className="w-3 h-3 mr-1" />
                                  )}
                                  Copy
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                                  onClick={() => updateEngagementStatus(opportunity.id, 'used')}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                  onClick={() => updateEngagementStatus(opportunity.id, 'dismissed')}
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          {engagementOpportunities.filter((o: any) => o.status === 'pending').length === 0 && (
                            <p className="text-gray-400 text-center py-4">
                              No pending opportunities. Click "Find Opportunities" to search for more.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SeoAgent;
