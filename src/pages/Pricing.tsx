import Navigation from "@/components/Navigation";
import { Check, Zap, Sparkles, Video, MessageSquare, Wand2, Gift, Shield, Rocket, ArrowRight, RefreshCcw, CreditCard, Globe, Target, Clock, ChevronRight, Search, Brain, TrendingUp, Users, Crown, Star, Infinity } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Pricing = () => {
  const { user } = useAuth();

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

  const creditPacks = [
    {
      name: "Starter",
      credits: 100,
      price: "$3",
      pricePerCredit: "3¢",
      description: "Perfect for testing the waters",
      icon: <Rocket className="w-8 h-8" />,
      gradient: "from-sky-500 to-blue-600",
      glowColor: "sky-500",
      popular: false,
      productId: "prod_SXNQ20skugqshl",
      tier: "Explorer",
      features: [
        { text: "~100 posts or ~50 fast images", icon: <MessageSquare className="w-4 h-4" /> },
        { text: "~1-2 short videos (4s fast)", icon: <Video className="w-4 h-4" /> },
        { text: "All AI models included", icon: <Brain className="w-4 h-4" /> },
        { text: "1 SEO visibility scan", icon: <Search className="w-4 h-4" /> },
        { text: "3 brand profiles", icon: <Users className="w-4 h-4" /> },
        { text: "Credits never expire", icon: <Infinity className="w-4 h-4" /> }
      ],
      limits: "Standard queue priority"
    },
    {
      name: "Launch",
      credits: 300,
      price: "$8",
      pricePerCredit: "2.7¢",
      savings: "Save 10%",
      description: "Built for your product launch",
      icon: <Target className="w-8 h-8" />,
      gradient: "from-emerald-500 to-teal-600",
      glowColor: "emerald-500",
      popular: true,
      productId: "prod_SXNQqHY08uDDpg",
      tier: "Launcher",
      features: [
        { text: "~300 posts or ~150 fast images", icon: <MessageSquare className="w-4 h-4" /> },
        { text: "~4-5 short videos (4s fast)", icon: <Video className="w-4 h-4" /> },
        { text: "Premium AI models", icon: <Brain className="w-4 h-4" /> },
        { text: "5 SEO scans + competitor analysis", icon: <Search className="w-4 h-4" /> },
        { text: "Multi-platform SEO insights", icon: <Globe className="w-4 h-4" /> },
        { text: "5 brand profiles", icon: <Users className="w-4 h-4" /> },
        { text: "Priority queue access", icon: <Zap className="w-4 h-4" /> },
        { text: "Credits never expire", icon: <Infinity className="w-4 h-4" /> }
      ],
      limits: "Priority generation queue"
    },
    {
      name: "Scale",
      credits: 1000,
      price: "$20",
      pricePerCredit: "2¢",
      savings: "Save 33%",
      description: "Unlimited growth mode",
      icon: <Crown className="w-8 h-8" />,
      gradient: "from-violet-500 to-purple-600",
      glowColor: "violet-500",
      popular: false,
      productId: "prod_SXNRQ7G1zjUMC3",
      tier: "Growth Leader",
      features: [
        { text: "~1000 posts or ~500 fast images", icon: <MessageSquare className="w-4 h-4" /> },
        { text: "~15 short videos (4s fast)", icon: <Video className="w-4 h-4" /> },
        { text: "All premium AI models", icon: <Brain className="w-4 h-4" /> },
        { text: "Unlimited SEO scans", icon: <Search className="w-4 h-4" /> },
        { text: "Full SEO Agent access", icon: <TrendingUp className="w-4 h-4" /> },
        { text: "6-platform visibility tracking", icon: <Globe className="w-4 h-4" /> },
        { text: "10 brand profiles", icon: <Users className="w-4 h-4" /> },
        { text: "Fastest queue priority", icon: <Zap className="w-4 h-4" /> },
        { text: "Early access to new features", icon: <Star className="w-4 h-4" /> },
        { text: "Credits never expire", icon: <Infinity className="w-4 h-4" /> }
      ],
      limits: "VIP generation priority"
    }
  ];

  const philosophyPoints = [
    {
      icon: <Shield className="w-6 h-6 text-accent" />,
      title: "No Recurring Subscriptions",
      description: "Buy credits when you need them. No surprise charges, no forgotten renewals draining your runway."
    },
    {
      icon: <Clock className="w-6 h-6 text-accent" />,
      title: "Credits Never Expire",
      description: "Your credits wait patiently until you're ready. Create engagement when the timing is right, not when a billing cycle dictates."
    },
    {
      icon: <RefreshCcw className="w-6 h-6 text-accent" />,
      title: "Scale As You Grow",
      description: "Start small, buy more as your startup gains traction. We grow when you grow."
    }
  ];

  const creditUsage = [
    {
      type: "Text Content",
      icon: <MessageSquare className="w-7 h-7 text-violet-400" />,
      cost: "1",
      examples: "Social posts, captions, blog content, product descriptions",
      gradient: "from-violet-500 to-fuchsia-500"
    },
    {
      type: "Image Generation",
      icon: <Wand2 className="w-7 h-7 text-cyan-400" />,
      cost: "2-23",
      examples: "Fast images from 2 credits, premium 4K up to 23 credits",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      type: "Video Creation",
      icon: <Video className="w-7 h-7 text-emerald-400" />,
      cost: "68-368",
      examples: "4s fast video: 68 credits, 8s standard: 368 credits",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      type: "SEO Analysis",
      icon: <Search className="w-7 h-7 text-amber-400" />,
      cost: "5-10",
      examples: "Visibility scans, competitor analysis, multi-platform SEO reports",
      gradient: "from-amber-500 to-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '-4s' }}></div>
      </div>

      <main className="pt-24 pb-16 relative z-10">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-medium">
                <Shield className="w-4 h-4" />
                No Subscriptions. Ever.
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="dark:text-white text-gray-900">Simple, Honest</span>
                <span className="text-cosmic font-serif block mt-2">Pricing for Startups</span>
              </h1>

              <p className="text-xl dark:text-gray-300 text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Pay for what you use. No monthly fees eating into your runway.
                Buy credits, launch your product, scale when you're ready.
              </p>
            </motion.div>
          </div>

          {/* Our Philosophy Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-20"
          >
            <Card className="cosmic-card border-accent/20 overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">
                    Built for <span className="text-cosmic font-serif">Startup Economics</span>
                  </h2>
                  <p className="dark:text-gray-400 text-gray-600">We understand cash flow. That's why we do things differently.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {philosophyPoints.map((point, index) => (
                    <div key={index} className="text-center">
                      <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                        {point.icon}
                      </div>
                      <h3 className="dark:text-white text-gray-900 font-semibold text-lg mb-2">{point.title}</h3>
                      <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">{point.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Free Tier Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent/50 to-primary/50 rounded-2xl blur-lg opacity-30"></div>
              <Card className="relative cosmic-card border-accent/30">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Gift className="w-8 h-8 text-accent" />
                    <h3 className="text-2xl font-bold dark:text-white text-gray-900">Start Free</h3>
                  </div>
                  <p className="dark:text-gray-300 text-gray-600 mb-6">
                    Get <span className="text-accent font-semibold">10 free credits daily</span> to explore everything.
                    No credit card required. Just sign up and start creating.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600">
                      <Check className="w-4 h-4 text-accent" />
                      All AI models
                    </div>
                    <div className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600">
                      <Check className="w-4 h-4 text-accent" />
                      Content + Media Studio
                    </div>
                    <div className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600">
                      <Check className="w-4 h-4 text-accent" />
                      3 brand profiles
                    </div>
                  </div>
                  <Button asChild size="lg" className="cosmic-button px-8">
                    <Link to="/auth">
                      Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Credit Packs - Main Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold dark:text-white text-gray-900 mb-4">
                Choose Your <span className="text-cosmic font-serif">Launch Tier</span>
              </h2>
              <p className="dark:text-gray-300 text-gray-600 text-lg max-w-2xl mx-auto">
                One-time purchase. More credits = more features unlocked. Never expires.
              </p>
              <div className="flex items-center justify-center gap-6 mt-6 text-sm dark:text-gray-400 text-gray-500">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-accent" />
                  <span>SEO Agent included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-accent" />
                  <span>AI video generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent" />
                  <span>Multi-platform content</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <TooltipProvider>
                {creditPacks.map((pack, index) => (
                  <div key={index} className="relative group">
                    {pack.popular && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-20">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 blur-md opacity-60"></div>
                          <Badge className="relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 px-5 py-2 font-bold shadow-xl">
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            Most Popular
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${pack.gradient} rounded-3xl blur ${pack.popular ? 'opacity-50' : 'opacity-25'} group-hover:opacity-60 transition duration-500`}></div>

                    <Card className="relative cosmic-card overflow-hidden border-2 dark:border-white/10 border-gray-200 dark:hover:border-white/20 hover:border-gray-300 transition-all duration-500 h-full flex flex-col">
                      <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-${pack.glowColor}/20 to-transparent rounded-full blur-3xl`}></div>

                      <CardHeader className="text-center pt-8 pb-4 relative z-10">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pack.gradient} flex items-center justify-center mx-auto mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {pack.icon}
                        </div>

                        <CardTitle className="text-xl font-bold dark:text-white text-gray-900 mb-1">{pack.name}</CardTitle>
                        <CardDescription className="dark:text-gray-400 text-gray-600">{pack.description}</CardDescription>

                        <div className="mt-6 mb-2">
                          <div className={`text-5xl font-bold bg-gradient-to-r ${pack.gradient} bg-clip-text text-transparent`}>
                            {pack.credits.toLocaleString()}
                          </div>
                          <div className="dark:text-gray-400 text-gray-500 text-sm uppercase tracking-wide mt-1">Credits</div>
                        </div>

                        <div className="flex items-center justify-center gap-3">
                          <span className="text-3xl font-bold dark:text-white text-gray-900">{pack.price}</span>
                          <span className="dark:text-gray-400 text-gray-500">({pack.pricePerCredit}/credit)</span>
                        </div>

                        {pack.savings && (
                          <Badge className="mt-3 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 dark:text-yellow-400 text-yellow-600 border-yellow-500/30">
                            {pack.savings}
                          </Badge>
                        )}
                      </CardHeader>

                      <CardContent className="px-6 pb-4 flex-grow relative z-10">
                        {/* Tier Badge */}
                        <div className="mb-4">
                          <span className={`text-xs font-semibold uppercase tracking-wider bg-gradient-to-r ${pack.gradient} bg-clip-text text-transparent`}>
                            {pack.tier}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {pack.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${pack.gradient} flex items-center justify-center flex-shrink-0 text-white`}>
                                {feature.icon}
                              </div>
                              <span className="dark:text-gray-300 text-gray-700 text-sm">{feature.text}</span>
                            </div>
                          ))}
                        </div>

                        {/* Queue Priority Indicator */}
                        <div className="mt-4 pt-4 border-t dark:border-white/10 border-gray-200">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4" style={{ color: pack.popular ? '#10b981' : pack.name === 'Scale' ? '#8b5cf6' : '#0ea5e9' }} />
                            <span className="text-xs dark:text-gray-400 text-gray-500">{pack.limits}</span>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-0 pb-8 px-6 relative z-10">
                        <Button
                          className={`w-full h-12 text-base font-semibold bg-gradient-to-r ${pack.gradient} hover:shadow-lg hover:shadow-${pack.glowColor}/30 transition-all duration-300 text-white ${pack.popular ? 'ring-2 ring-emerald-400/50' : ''}`}
                          onClick={() => handleCreditPurchase(pack.productId, pack.credits)}
                        >
                          Buy {pack.name} Pack
                          <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </motion.div>

          {/* Credit Usage Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold dark:text-white text-gray-900 mb-4">
                How <span className="text-cosmic font-serif">Credits</span> Work
              </h2>
              <p className="dark:text-gray-300 text-gray-600">One credit system for all your launch needs</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {creditUsage.map((item, index) => (
                <Card key={index} className="cosmic-card border-0 hover:border-accent/30 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-full animate-pulse opacity-20`}></div>
                      <div className={`absolute inset-1.5 bg-gradient-to-br ${item.gradient} rounded-full`}></div>
                      <div className="absolute inset-2.5 dark:bg-[#0f0f1a] bg-white rounded-full flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div className={`absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                        <span className="text-white text-xs font-bold">{item.cost}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-2">{item.type}</h3>
                    <div className="mb-3">
                      <span className={`text-2xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                        {item.cost}
                      </span>
                      <span className="dark:text-gray-400 text-gray-500 text-sm ml-1">credit{item.cost !== "1" ? "s" : ""}</span>
                    </div>
                    <p className="dark:text-gray-400 text-gray-600 text-sm">{item.examples}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold dark:text-white text-gray-900 mb-4">
                Frequently Asked <span className="text-cosmic font-serif">Questions</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <Card className="cosmic-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">Why no subscriptions?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                    Subscriptions create pressure to use what you've paid for, even when the timing isn't right.
                    As a startup, your needs fluctuate. Our model lets you invest in marketing when it makes sense for your business, not when a billing cycle demands it.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">Do credits really never expire?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                    Yes, really. Buy credits today, use them in 6 months when you're ready to launch.
                    We believe in earning your continued business through value, not lock-in.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">What can I create with credits?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                    Everything! Social posts for all platforms, AI-generated images, short videos, blog content,
                    product descriptions, and more. One credit pool, all features unlocked.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">What about the free tier?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                    Free users get 10 credits daily that reset automatically. It's enough to explore all features,
                    create content for a soft launch, or maintain a minimal presence. Upgrade only when you're ready to scale.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">Can I buy more credits anytime?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                    Absolutely. Buy any credit pack at any time. They stack with your existing credits.
                    Running a big launch campaign? Buy a larger pack. Maintenance mode? The free tier has you covered.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">What AI models do you use?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                    We use the latest AI models optimized for each task — GPT-4 for content, DALL-E and Stable Diffusion for images,
                    and cutting-edge video generation. You get enterprise-quality AI at startup-friendly prices.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">What is the SEO Agent?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                    Our SEO Agent analyzes your visibility across Google, TikTok, YouTube, Reddit, Amazon, and AI assistants —
                    where 73% of buying decisions happen. Higher tier packs unlock more scans and deeper competitor analysis.
                  </p>
                </CardContent>
              </Card>

              <Card className="cosmic-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">What are the queue priorities?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                    Higher tier packs get faster generation speeds. Scale pack users get VIP priority with near-instant generations,
                    while Launch pack users get priority queue access. All tiers have access to the same AI models.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center"
          >
            <Card className="cosmic-card border-accent/20 max-w-3xl mx-auto overflow-hidden">
              <CardContent className="p-10">
                <h3 className="text-3xl font-bold dark:text-white text-gray-900 mb-4">
                  Ready to <span className="text-cosmic font-serif">Launch?</span>
                </h3>
                <p className="dark:text-gray-300 text-gray-600 text-lg mb-8 max-w-xl mx-auto">
                  Start with free credits today. Buy a pack when you're ready to go big.
                  No commitment, no risk — just results.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="cosmic-button px-10 py-6 text-lg font-semibold">
                    <Link to="/auth">
                      <Rocket className="mr-2 w-5 h-5" />
                      Start Free
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-accent text-accent hover:bg-accent hover:text-black px-10 py-6 text-lg font-semibold">
                    <Link to="/features">
                      Explore Features
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
