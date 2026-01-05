import Navigation from "@/components/Navigation";
import { Check, Star, Zap, Crown, Bell, Sparkles, Video, MessageSquare, Users, Wand2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const Pricing = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignupRedirect = () => {
    // Redirect to signup page
    window.location.href = '/auth'; // or use your router navigation
  };

  const handleUpgrade = async (priceId: string, planName: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: priceId,
          mode: "subscription"
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreditPurchase = async (productId: string, credits: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-credit-checkout', {
        body: { 
          productId: productId,
          credits: credits
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Credit purchase error:', error);
      toast({
        title: "Purchase Error",
        description: "Failed to start purchase process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const plans = [
    {
      name: "Free",
      badge: "Starter",
      badgeVariant: "secondary" as const,
      price: "$0",
      period: "forever",
      credits: "10 credits/day",
      description: "Perfect for getting started with AI content creation",
      features: [
        { text: "10 credits daily (resets automatically)", tooltip: "Get 10 fresh credits every day" },
        { text: "Max 3 brand profiles", tooltip: "Store up to 3 different brand personalities" },
        { text: "Content Generation + Media Studio", tooltip: "Access to all our AI tools" },
        { text: "Posts management tools", tooltip: "Organize and manage your generated content" },
        { text: "Export to major platforms", tooltip: "Direct publishing to social media" }
      ],
      buttonText: "Get Started Free",
      buttonVariant: "outline" as const,
      popular: false,
      priceId: null
    },
    {
      name: "Standard",
      badge: "Most Popular",
      badgeVariant: "default" as const,
      price: "$28",
      period: "per month",
      credits: "3,000 monthly credits",
      dailyLimit: "500 credits/day limit",
      description: "Ideal for growing creators and small businesses",
      features: [
        { text: "3,000 monthly credits (500/day limit)", tooltip: "Much higher capacity for content creation" },
        { text: "10 brand voice profiles", tooltip: "Manage multiple brand personalities" },
        { text: "Multi-language support with PRO translation", tooltip: "Professional translation models for global reach" },
        { text: "Priority support", tooltip: "24h response time with priority queue" },
        { text: "Campaign management", tooltip: "Organize content into campaigns" },
        { text: "Analytics dashboard", tooltip: "Track performance across platforms" },
        { text: "Custom content scheduling", tooltip: "Schedule posts for optimal timing" }
      ],
      buttonText: "Upgrade to Standard",
      buttonVariant: "default" as const,
      popular: true,
      priceId: "price_1RcU8fEybjfbmfmGXpAcMnPa"
    },
    {
      name: "Pro",
      badge: "Enterprise",
      badgeVariant: "destructive" as const,
      price: "$79",
      period: "per month",
      credits: "Unlimited credits",
      description: "For agencies and high-volume content creators",
      features: [
        { text: "Unlimited monthly credits", tooltip: "No limits on content creation" },
        { text: "Unlimited brand voice profiles", tooltip: "Manage unlimited brand personalities" },
        { text: "Premium content templates", tooltip: "Exclusive high-converting templates" },
        { text: "24/7 priority support", tooltip: "Round-the-clock dedicated support" },
        { text: "Advanced campaign management", tooltip: "Multi-client campaign organization" },
        { text: "Detailed analytics & insights", tooltip: "Deep performance analytics" },
        { text: "API access", tooltip: "Integrate with your existing tools" },
        { text: "White-label options", tooltip: "Brand the platform as your own" },
        { text: "Team collaboration tools", tooltip: "Multi-user workspace management" }
      ],
      buttonText: "Go Pro",
      buttonVariant: "default" as const,
      popular: false,
      priceId: "price_1RakAAEybjfbmfmGPLiHbxj1"
    }
  ];

  const creditPacks = [
    {
      credits: 100,
      price: "$3",
      value: "3¢ per credit",
      popular: false,
      productId: "prod_SXNQ20skugqshl"
    },
    {
      credits: 300,
      price: "$8",
      value: "2.7¢ per credit",
      popular: true,
      savings: "Save 10%",
      productId: "prod_SXNQqHY08uDDpg"
    },
    {
      credits: 1000,
      price: "$20",
      value: "2¢ per credit",
      popular: false,
      savings: "Save 33%",
      productId: "prod_SXNRQ7G1zjUMC3"
    }
  ];

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Powerful AI Tools,
              <span className="text-cosmic block mt-2">Simple Pricing</span>
            </h1>
            <p className="text-xl text-gray-300 dark:text-gray-300 [html.light_&]:text-gray-700 max-w-3xl mx-auto">
              One credit system for all your needs. From marketing automation to creative media generation.
            </p>
          </div>

          {/* Product Categories Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-20 max-w-6xl mx-auto">
            {/* Content Generation Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <Card className="relative cosmic-card overflow-hidden border-2 border-purple-500/20 hover:border-purple-500/40 transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl -z-0"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full blur-2xl -z-0"></div>

                <CardContent className="relative z-10 p-10">
                  <div className="mb-6">
                    <div className="relative w-20 h-20 mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl"></div>
                      <div className="relative w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl border border-purple-400/30 flex items-center justify-center backdrop-blur-sm">
                        <MessageSquare className="w-9 h-9 text-purple-300" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Content Generation</h3>
                    <p className="text-purple-300 dark:text-purple-300 [html.light_&]:text-purple-700 font-medium">For Marketing Automation</p>
                  </div>

                  <p className="text-gray-300 mb-8 leading-relaxed text-base">
                    Perfect for businesses and agencies looking to automate their content marketing across multiple platforms.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-200">AI-powered social media posts</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-200">Brand voice consistency</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-200">Multi-platform publishing</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-200">Campaign management</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Media Studio Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <Card className="relative cosmic-card overflow-hidden border-2 border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-3xl -z-0"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-2xl -z-0"></div>

                <CardContent className="relative z-10 p-10">
                  <div className="mb-6">
                    <div className="relative w-20 h-20 mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl opacity-20 blur-xl"></div>
                      <div className="relative w-full h-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl border border-cyan-400/30 flex items-center justify-center backdrop-blur-sm">
                        <Video className="w-9 h-9 text-cyan-300" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Media Studio</h3>
                    <p className="text-cyan-300 dark:text-cyan-300 [html.light_&]:text-cyan-700 font-medium">For Individual Creators</p>
                  </div>

                  <p className="text-gray-300 mb-8 leading-relaxed text-base">
                    Ideal for content creators who need professional-quality images and videos without the complexity.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-200">AI image generation</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-200">AI video creation</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-200">Professional editing tools</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-200">Export in multiple formats</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Credit System Explanation */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">
                One Credit System, Endless Possibilities
              </h2>
              <p className="text-gray-300 dark:text-gray-300 [html.light_&]:text-gray-700">
                Simple, transparent pricing for all your content needs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Text Content */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <Card className="relative cosmic-card overflow-hidden border border-violet-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent"></div>
                  <CardContent className="relative p-6 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-full animate-pulse opacity-20"></div>
                      <div className="absolute inset-1.5 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full"></div>
                      <div className="absolute inset-2.5 bg-[#0f0f1a] light:bg-white rounded-full flex items-center justify-center">
                        <MessageSquare className="w-7 h-7 text-violet-400" strokeWidth={1.5} />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-6 h-6 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/50">
                        <span className="text-white text-[10px] font-bold">1</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white light:text-gray-900 mb-2">Text Content</h3>
                    <div className="mb-3">
                      <div className="inline-flex items-baseline space-x-1">
                        <span className="text-4xl font-bold text-violet-500 dark:bg-gradient-to-r dark:from-violet-400 dark:to-fuchsia-400 dark:bg-clip-text dark:text-transparent">1</span>
                        <span className="text-base text-gray-400 light:text-gray-600">Credit</span>
                      </div>
                    </div>
                    <p className="text-gray-400 light:text-gray-600 text-sm">
                      Social posts, captions, blog content
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Image Generation */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <Card className="relative cosmic-card overflow-hidden border border-cyan-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent"></div>
                  <CardContent className="relative p-6 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 rounded-full animate-pulse opacity-20"></div>
                      <div className="absolute inset-1.5 bg-gradient-to-br from-cyan-600 to-indigo-600 rounded-full"></div>
                      <div className="absolute inset-2.5 bg-[#0f0f1a] light:bg-white rounded-full flex items-center justify-center">
                        <Wand2 className="w-7 h-7 text-cyan-400" strokeWidth={1.5} />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-6 h-6 bg-gradient-to-br from-cyan-400 to-indigo-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50">
                        <span className="text-white text-[10px] font-bold">2</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white light:text-gray-900 mb-2">Image Generation</h3>
                    <div className="mb-3">
                      <div className="inline-flex items-baseline space-x-1">
                        <span className="text-4xl font-bold text-cyan-600 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-400 dark:bg-clip-text dark:text-transparent">2</span>
                        <span className="text-base text-gray-400 light:text-gray-600">Credits</span>
                      </div>
                    </div>
                    <p className="text-gray-400 light:text-gray-600 text-sm">
                      Based on Quality and complexity, starting at 2 credits
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Video Generation */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <Card className="relative cosmic-card overflow-hidden border border-emerald-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent"></div>
                  <CardContent className="relative p-6 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-full animate-pulse opacity-20"></div>
                      <div className="absolute inset-1.5 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-full"></div>
                      <div className="absolute inset-2.5 bg-[#0f0f1a] light:bg-white rounded-full flex items-center justify-center">
                        <Video className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
                        <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white light:text-gray-900 mb-2">Video Generation</h3>
                    <div className="mb-3">
                      <div className="inline-flex items-baseline space-x-1">
                        <span className="text-3xl font-bold text-emerald-600 dark:bg-gradient-to-r dark:from-emerald-400 dark:to-cyan-400 dark:bg-clip-text dark:text-transparent">Variable</span>
                      </div>
                    </div>
                    <p className="text-gray-400 light:text-gray-600 text-sm">
                      Based on length and complexity
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Billing Toggle and Pricing Cards */}
          <div className="flex justify-center mb-12">
            <Tabs defaultValue="monthly" className="w-auto">
              <TabsList className="cosmic-card">
                <TabsTrigger value="monthly" className="text-white">Monthly Plans</TabsTrigger>
                <TabsTrigger value="credits" className="text-white">Credit Packs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="monthly" className="mt-12">
                <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  <TooltipProvider>
                    {plans.map((plan, index) => {
                      const gradients = [
                        { border: 'from-slate-500 to-gray-600', card: 'slate-500/20', glow: 'slate-500/10', icon: 'slate-400', accent: 'from-slate-400 to-gray-400' },
                        { border: 'from-amber-500 to-orange-600', card: 'amber-500/20', glow: 'amber-500/20', icon: 'amber-400', accent: 'from-amber-400 to-orange-400' },
                        { border: 'from-purple-600 to-pink-600', card: 'purple-500/20', glow: 'purple-500/20', icon: 'purple-400', accent: 'from-purple-400 to-pink-400' }
                      ];
                      const style = gradients[index];

                      return (
                        <div key={index} className="relative group">
                          {plan.popular && (
                            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-20">
                              <div className="relative">
                                <div className={`absolute inset-0 bg-gradient-to-r ${style.border} blur-md opacity-60`}></div>
                                <Badge className="relative bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-5 py-2 font-bold shadow-xl">
                                  <Star className="w-4 h-4 mr-1.5" fill="currentColor" />
                                  {plan.badge}
                                </Badge>
                              </div>
                            </div>
                          )}

                          <div className={`absolute -inset-0.5 bg-gradient-to-r ${style.border} rounded-3xl blur ${plan.popular ? 'opacity-50' : 'opacity-25'} group-hover:opacity-60 transition duration-500`}></div>

                          <Card className={`relative cosmic-card overflow-hidden border-2 border-${style.card} hover:border-${style.card.replace('/20', '/40')} transition-all duration-500 h-full flex flex-col`}>
                            <div className={`absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-${style.glow} to-transparent rounded-full blur-3xl`}></div>
                            <div className={`absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-${style.glow} to-transparent rounded-full blur-2xl`}></div>

                            <CardHeader className="text-center pb-4 relative z-10">
                              <div className="mb-4">
                                {plan.name === "Standard" && <Star className={`w-10 h-10 text-${style.icon} mx-auto mb-2`} />}
                                {plan.name === "Pro" && <Crown className={`w-10 h-10 text-${style.icon} mx-auto mb-2`} />}
                                {plan.name === "Free" && <Sparkles className={`w-10 h-10 text-${style.icon} mx-auto mb-2`} />}
                                <CardTitle className="text-2xl font-bold text-white light:text-gray-900">{plan.name}</CardTitle>
                              </div>

                              <div className="mb-4">
                                <div className="flex items-baseline justify-center mb-1">
                                  {index === 0 && <span className="text-5xl font-bold text-slate-500 dark:bg-gradient-to-r dark:from-slate-400 dark:to-gray-400 dark:bg-clip-text dark:text-transparent">{plan.price.replace('$', '')}</span>}
                                  {index === 1 && <span className="text-5xl font-bold text-amber-600 dark:bg-gradient-to-r dark:from-amber-400 dark:to-orange-400 dark:bg-clip-text dark:text-transparent">{plan.price.replace('$', '')}</span>}
                                  {index === 2 && <span className="text-5xl font-bold text-purple-600 dark:bg-gradient-to-r dark:from-purple-400 dark:to-pink-400 dark:bg-clip-text dark:text-transparent">{plan.price.replace('$', '')}</span>}
                                  {plan.price !== "$0" && <span className="text-xl text-gray-400 ml-1.5">$</span>}
                                </div>
                                <span className="text-gray-400 light:text-gray-600 text-xs uppercase tracking-wider">{plan.period}</span>
                              </div>

                              <div className="space-y-1.5 mb-3">
                                <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r ${style.border} bg-opacity-10 border border-${style.card}`}>
                                  <Zap className="w-3.5 h-3.5 mr-1.5 text-white light:text-gray-700" />
                                  <span className="text-white light:text-gray-800 font-semibold text-xs">{plan.credits}</span>
                                </div>
                                {plan.dailyLimit && (
                                  <div className="text-[11px] text-gray-400 light:text-gray-600">{plan.dailyLimit}</div>
                                )}
                              </div>

                              <CardDescription className="text-gray-300 light:text-gray-600 text-sm px-3">{plan.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-2.5 px-6 pb-6 flex-grow relative z-10">
                              {plan.features.map((feature, featureIndex) => (
                                <Tooltip key={featureIndex}>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-start space-x-2.5 cursor-help group/item">
                                      <div className={`mt-0.5 w-4 h-4 rounded-full bg-gradient-to-br ${style.border} flex items-center justify-center flex-shrink-0`}>
                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                      </div>
                                      <span className="text-gray-300 light:text-gray-600 text-xs group-hover/item:text-white light:group-hover/item:text-gray-900 transition-colors leading-relaxed">
                                        {typeof feature === 'string' ? feature : feature.text}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  {typeof feature === 'object' && feature.tooltip && (
                                    <TooltipContent className="max-w-xs">
                                      <p>{feature.tooltip}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              ))}
                            </CardContent>

                            <CardFooter className="pt-0 pb-6 px-6 relative z-10">
                              <Button
                                variant={plan.buttonVariant}
                                className={`w-full h-11 text-sm font-semibold cosmic-button bg-gradient-to-r ${style.border} hover:shadow-lg hover:shadow-${style.glow} transition-all duration-300 ${plan.popular ? 'ring-2 ring-amber-400/50' : ''} text-white dark:text-white [html.light_&]:text-gray-900`}
                                onClick={() => plan.priceId && handleUpgrade(plan.priceId, plan.name)}
                                disabled={!plan.priceId}
                              >
                                {plan.buttonText}
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      );
                    })}
                  </TooltipProvider>
                </div>
              </TabsContent>
              
              <TabsContent value="credits" className="mt-12">
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white light:text-gray-900 mb-3">Pay-As-You-Go Credit Packs</h2>
                    <p className="text-gray-300 light:text-gray-600">Perfect for occasional users or to top up your monthly allowance</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {creditPacks.map((pack, index) => {
                      const packGradients = [
                        { border: 'from-blue-500 to-cyan-500', glow: 'blue-500/20', badge: 'from-blue-400 to-cyan-400' },
                        { border: 'from-emerald-500 to-teal-500', glow: 'emerald-500/30', badge: 'from-emerald-400 to-teal-400' },
                        { border: 'from-violet-500 to-purple-500', glow: 'violet-500/20', badge: 'from-violet-400 to-purple-400' }
                      ];
                      const packStyle = packGradients[index];

                      return (
                        <div key={index} className="relative group">
                          {pack.popular && (
                            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-20">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 blur-md opacity-60"></div>
                                <Badge className="relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 px-5 py-2 font-bold shadow-xl">
                                  <Sparkles className="w-4 h-4 mr-1.5" />
                                  Best Value
                                </Badge>
                              </div>
                            </div>
                          )}

                          <div className={`absolute -inset-0.5 bg-gradient-to-r ${packStyle.border} rounded-3xl blur ${pack.popular ? 'opacity-50' : 'opacity-25'} group-hover:opacity-60 transition duration-500`}></div>

                          <Card className="relative cosmic-card overflow-hidden border-2 border-white/10 hover:border-white/20 transition-all duration-500 h-full flex flex-col">
                            <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-${packStyle.glow} to-transparent rounded-full blur-3xl`}></div>

                            <CardHeader className="text-center pt-6 pb-4 relative z-10">
                              <div className="mb-4">
                                {index === 0 && <div className="text-5xl font-bold text-blue-600 dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400 dark:bg-clip-text dark:text-transparent mb-1">{pack.credits}</div>}
                                {index === 1 && <div className="text-5xl font-bold text-emerald-600 dark:bg-gradient-to-r dark:from-emerald-400 dark:to-teal-400 dark:bg-clip-text dark:text-transparent mb-1">{pack.credits}</div>}
                                {index === 2 && <div className="text-5xl font-bold text-violet-600 dark:bg-gradient-to-r dark:from-violet-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent mb-1">{pack.credits}</div>}
                                <div className="text-gray-400 light:text-gray-600 text-sm uppercase tracking-wide">Credits</div>
                              </div>

                              <div className="mb-4">
                                <span className="text-4xl font-bold text-white light:text-gray-900">{pack.price}</span>
                              </div>

                              <div className="space-y-1.5">
                                <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r ${packStyle.border} bg-opacity-10 border border-white/10`}>
                                  <span className="text-white light:text-gray-700 font-semibold text-xs">{pack.value}</span>
                                </div>
                                {pack.savings && (
                                  <div>
                                    <Badge className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-500 light:text-yellow-600 border-yellow-500/30 px-3 py-0.5 text-xs">
                                      {pack.savings}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-3 px-6 pb-6 flex-grow relative z-10">
                              <div className="flex items-center justify-center space-x-2.5">
                                <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${packStyle.border} flex items-center justify-center`}>
                                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </div>
                                <span className="text-gray-300 light:text-gray-600 text-xs">Never expires</span>
                              </div>
                              <div className="flex items-center justify-center space-x-2.5">
                                <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${packStyle.border} flex items-center justify-center`}>
                                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </div>
                                <span className="text-gray-300 light:text-gray-600 text-xs">All premium features</span>
                              </div>
                              <div className="flex items-center justify-center space-x-2.5">
                                <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${packStyle.border} flex items-center justify-center`}>
                                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </div>
                                <span className="text-gray-300 light:text-gray-600 text-xs">Instant activation</span>
                              </div>
                            </CardContent>

                            <CardFooter className="pt-0 pb-6 px-6 relative z-10">
                              <Button
                                className={`w-full h-11 text-sm font-semibold cosmic-button bg-gradient-to-r ${packStyle.border} hover:shadow-lg hover:shadow-${packStyle.glow} transition-all duration-300 ${pack.popular ? 'ring-2 ring-emerald-400/50' : ''}`}
                                onClick={() => handleCreditPurchase(pack.productId, pack.credits)}
                              >
                                Buy {pack.credits} Credits
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 text-center">
                    <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <p className="text-gray-300 light:text-gray-600 text-sm">
                        <strong className="text-white light:text-gray-900">Credit Usage:</strong> Text = 1 credit • Images = 2 credits • Videos = Variable
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* FAQ Section */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-12">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">How do credits work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    Credits are a unified currency for all features. Text content costs 1 credit, images cost 2 credits,
                    and videos have variable pricing. Use credits across both Content Generation and Media Studio.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">Can I use credits for both features?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    Yes! Your credits work across all our tools - Content Generation for marketing automation and
                    Media Studio for image and video creation. One account, one credit pool, endless possibilities.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">What AI models do you use?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    We use curated, task-specific AI models that are regularly updated to ensure stability and quality.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">Do unused credits expire?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    Monthly plan credits reset each billing cycle. Pay-as-you-go credit packs never expire and
                    can be used anytime across all features.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">Is there a free tier?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    Yes! Free users get daily credits that reset automatically. This allows you to test both
                    Content Generation and Media Studio features before committing to a paid plan.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">Who should use Content Generation vs Media Studio?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    Content Generation is perfect for businesses and marketers needing automated social media posts.
                    Media Studio is ideal for creators needing AI-generated images and videos. Most users benefit from both!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;