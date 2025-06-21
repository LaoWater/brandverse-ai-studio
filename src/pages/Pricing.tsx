import Navigation from "@/components/Navigation";
import { Check, Star, Zap, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Pricing = () => {
  const { user } = useAuth();

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
        { text: "Access to latest AI models", tooltip: "Use our most advanced content generation models" },
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
      priceId: "price_1RaddlEybjfbmfmGeEzFDalD" // Replace with your actual Stripe price ID
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
      priceId: "price_1RakAAEybjfbmfmGPLiHbxj1" // Actual Pro ID:  price_1Rak0xEybjfbmfmGF5fVAYoR
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
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Simple, Credit-Based
              <span className="text-cosmic block mt-2">Pricing</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Pay for what you use with our flexible credit system. Text posts cost 1 credit, images/videos cost 3 credits.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <Tabs defaultValue="monthly" className="w-auto">
              <TabsList className="cosmic-card">
                <TabsTrigger value="monthly" className="text-white">Monthly Plans</TabsTrigger>
                <TabsTrigger value="credits" className="text-white">Credit Packs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="monthly" className="mt-8">
                {/* Monthly Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8">
                  <TooltipProvider>
                    {plans.map((plan, index) => (
                      <Card 
                        key={index} 
                        className={`cosmic-card relative transition-all duration-300 hover:scale-105 ${
                          plan.popular 
                            ? 'ring-2 ring-accent/50 shadow-2xl shadow-accent/20' 
                            : 'hover:ring-1 hover:ring-primary/30'
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-0 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-accent text-black px-4 py-2 font-semibold">
                              <Star className="w-4 h-4 mr-1" />
                              {plan.badge}
                            </Badge>
                          </div>
                        )}
                        
                        <CardHeader className="text-center pb-4">
                          <div className="flex items-center justify-center space-x-2 mb-4">
                            {plan.name === "Free"}
                            {plan.name === "Standard" && <Star className="w-6 h-6 text-accent" />}
                            {plan.name === "Pro" && <Crown className="w-6 h-6 text-accent" />}
                            <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                          </div>
                          <div className="mb-2">
                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                            <span className="text-gray-400 ml-2">{plan.period}</span>
                          </div>
                          <div className="mb-4">
                            <Badge className="bg-accent/20 text-accent border-accent/30 font-semibold">
                              {plan.credits}
                            </Badge>
                            {plan.dailyLimit && (
                              <div className="text-xs text-gray-400 mt-1">{plan.dailyLimit}</div>
                            )}
                          </div>
                          <CardDescription className="text-gray-300">{plan.description}</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {plan.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center space-x-3">
                              <Check className="w-5 h-5 text-accent flex-shrink-0" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-gray-300 text-sm cursor-help hover:text-white transition-colors">
                                    {typeof feature === 'string' ? feature : feature.text}
                                  </span>
                                </TooltipTrigger>
                                {typeof feature === 'object' && feature.tooltip && (
                                  <TooltipContent>
                                    <p>{feature.tooltip}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </div>
                          ))}
                        </CardContent>

                        <CardFooter>
                          <Button 
                            variant={plan.buttonVariant}
                            className={`w-full cosmic-button ${plan.popular ? 'animate-pulse-glow' : ''}`}
                            onClick={() => plan.priceId && handleUpgrade(plan.priceId, plan.name)}
                            disabled={!plan.priceId}
                          >
                            {plan.buttonText}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </TooltipProvider>
                </div>
              </TabsContent>
              
              <TabsContent value="credits" className="mt-8">
                {/* Credit Packs */}
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4">Pay-As-You-Go Credit Packs</h2>
                    <p className="text-gray-300">Perfect for occasional users or to top up your monthly allowance</p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {creditPacks.map((pack, index) => (
                      <Card 
                        key={index}
                        className={`cosmic-card text-center transition-all duration-300 hover:scale-105 ${
                          pack.popular 
                            ? 'ring-2 ring-accent/50 shadow-2xl shadow-accent/20' 
                            : 'hover:ring-1 hover:ring-primary/30'
                        }`}
                      >
                        {pack.popular && (
                          <div className="absolute -top-0 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-accent text-black px-4 py-2 font-semibold">
                              Best Value
                            </Badge>
                          </div>
                        )}
                        
                        <CardHeader>
                          <div className="mb-4">
                            <div className="text-3xl font-bold text-white mb-2">{pack.credits}</div>
                            <div className="text-gray-400">Credits</div>
                          </div>
                          <div className="mb-4">
                            <span className="text-4xl font-bold text-white">{pack.price}</span>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {pack.value}
                          </Badge>
                          {pack.savings && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mt-2">
                              {pack.savings}
                            </Badge>
                          )}
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-center space-x-3">
                            <Check className="w-5 h-5 text-accent" />
                            <span className="text-gray-300 text-sm">Never expires</span>
                          </div>
                          <div className="flex items-center justify-center space-x-3">
                            <Check className="w-5 h-5 text-accent" />
                            <span className="text-gray-300 text-sm">All premium features</span>
                          </div>
                          <div className="flex items-center justify-center space-x-3">
                            <Check className="w-5 h-5 text-accent" />
                            <span className="text-gray-300 text-sm">Instant activation</span>
                          </div>
                        </CardContent>
                        
                        <CardFooter>
                          <Button 
                            className={`w-full cosmic-button ${pack.popular ? 'animate-pulse-glow' : ''}`}
                            onClick={() => handleCreditPurchase(pack.productId, pack.credits)}
                          >
                            Buy {pack.credits} Credits
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                      💡 <strong>Credit Usage:</strong> Text posts = 1 credit • Images/Videos = 3 credits each
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* FAQ Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-12">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">How do credits work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    Credits are consumed when generating content: 1 credit for text posts, 3 credits for images/videos. 
                    Free users get 10 credits daily that reset automatically.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">Do unused credits expire?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    Monthly plan credits reset each billing cycle. Pay-as-you-go credit packs never expire and can be used anytime.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">Can I upgrade my plan anytime?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">What happens if I run out of credits?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    You can purchase credit packs anytime or upgrade to a higher plan. Free users automatically get 10 new credits each day.
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
