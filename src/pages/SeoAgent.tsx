import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Search,
  Globe,
  TrendingUp,
  Target,
  Youtube,
  MessageSquare,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Brain,
  Zap,
  BarChart3,
  Rocket
} from "lucide-react";
import { FaTiktok, FaRedditAlien } from "react-icons/fa6";

const SeoAgent = () => {
  const platforms = [
    {
      name: "Google",
      icon: <Search className="w-8 h-8" />,
      percentage: "27%",
      description: "Traditional search — still important, but only part of the story",
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
      icon: <Sparkles className="w-6 h-6 text-accent" />,
      title: "AI-Powered Recommendations",
      description: "Get actionable insights on which platforms to prioritize and what content to create"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-accent" />,
      title: "Visibility Score Tracking",
      description: "Monitor your discoverability across the decision landscape over time"
    }
  ];

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '-2s' }}></div>
      </div>

      <main className="pt-24 pb-16 relative z-10">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
                Coming Soon — Currently in Development
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="text-cosmic font-serif flex items-center justify-center gap-3">
                  <Globe className="w-12 h-12 md:w-14 md:h-14 text-accent animate-pulse" />
                  SEO Everywhere
                </span>
                <span className="text-white block mt-2">Agent</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Traditional SEO is dead. 73% of buying decisions happen outside Google.
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
                You're optimizing for Google while your customers are deciding on TikTok, YouTube, Reddit, and ChatGPT.
                That's why you have traffic but no conversions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {platforms.map((platform, index) => (
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
                  <span className="text-accent font-bold">The insight:</span> Consumers aren't searching anymore — they're deciding in micro-moments
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

          {/* The Process Preview */}
          <Card className="cosmic-card border-0 mb-16">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-white">
                How It <span className="text-cosmic font-serif">Works</span>
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                A systematic approach to modern visibility optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { step: "1", title: "Learn", description: "AI learns your product, audience, and competitors" },
                  { step: "2", title: "Analyze", description: "Scan visibility across all decision platforms" },
                  { step: "3", title: "Persona", description: "Build customer personas with hidden intent layers" },
                  { step: "4", title: "Optimize", description: "Get actionable recommendations for each platform" }
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                      {item.step}
                    </div>
                    <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-3xl font-bold text-white">
                Get Started with <span className="text-cosmic font-serif">Content First</span>
              </h3>
              <p className="text-gray-300 text-lg">
                While we build the full SEO Agent, you can start creating platform-optimized content
                that's designed for visibility everywhere.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="cosmic-button px-8 py-6 text-lg font-semibold">
                  <Link to="/brand-setup">
                    <Rocket className="mr-2 w-5 h-5" />
                    Start Creating Content
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-accent text-accent hover:bg-accent hover:text-black px-8 py-6 text-lg font-semibold">
                  <Link to="/features">
                    View All Features
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeoAgent;
