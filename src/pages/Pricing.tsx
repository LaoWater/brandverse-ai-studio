
import Navigation from "@/components/Navigation";
import { Check, Star, Zap, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      badge: "Starter",
      badgeVariant: "secondary" as const,
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with AI content creation",
      features: [
        { text: "50 AI generations per day", tooltip: "Create up to 50 pieces of content daily" },
        { text: "3 brand voice profiles", tooltip: "Store up to 3 different brand personalities" },
        { text: "Basic content templates", tooltip: "Access to fundamental content formats" },
        { text: "Standard support", tooltip: "Email support with 48h response time" },
        { text: "Export to major platforms", tooltip: "Direct publishing to social media" }
      ],
      buttonText: "Get Started Free",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Standard",
      badge: "Most Popular",
      badgeVariant: "default" as const,
      price: "$29",
      period: "per month",
      description: "Ideal for growing creators and small businesses",
      features: [
        { text: "500 AI generations per day", tooltip: "10x more content creation capacity" },
        { text: "10 brand voice profiles", tooltip: "Manage multiple brand personalities" },
        { text: "Advanced content templates", tooltip: "Premium templates for better engagement" },
        { text: "Priority support", tooltip: "24h response time with priority queue" },
        { text: "Campaign management", tooltip: "Organize content into campaigns" },
        { text: "Analytics dashboard", tooltip: "Track performance across platforms" },
        { text: "Custom content scheduling", tooltip: "Schedule posts for optimal timing" }
      ],
      buttonText: "Upgrade to Standard",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Pro",
      badge: "Enterprise",
      badgeVariant: "destructive" as const,
      price: "$79",
      period: "per month",
      description: "For agencies and high-volume content creators",
      features: [
        { text: "Unlimited AI generations", tooltip: "No daily limits on content creation" },
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
      popular: false
    }
  ];

  const payAsYouGo = {
    title: "Pay-As-You-Go",
    description: "Flexible pricing for occasional users",
    price: "$0.10",
    unit: "per generation",
    features: [
      "No monthly commitment",
      "Pay only for what you use", 
      "All premium features included",
      "Perfect for testing at scale"
    ]
  };

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Simple, Transparent
              <span className="text-cosmic block mt-2">Pricing</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Choose the perfect plan for your content creation needs. Start free and scale as you grow.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <Tabs defaultValue="monthly" className="w-auto">
              <TabsList className="cosmic-card">
                <TabsTrigger value="monthly" className="text-white">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="text-white">Yearly <Badge className="ml-2 text-xs">Save 20%</Badge></TabsTrigger>
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
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-accent text-black px-4 py-2 font-semibold">
                              <Star className="w-4 h-4 mr-1" />
                              {plan.badge}
                            </Badge>
                          </div>
                        )}
                        
                        <CardHeader className="text-center pb-4">
                          <div className="flex items-center justify-center space-x-2 mb-4">
                            {plan.name === "Free" && <Zap className="w-6 h-6 text-accent" />}
                            {plan.name === "Standard" && <Crown className="w-6 h-6 text-accent" />}
                            {plan.name === "Pro" && <Star className="w-6 h-6 text-accent" />}
                            <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                          </div>
                          <div className="mb-4">
                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                            <span className="text-gray-400 ml-2">{plan.period}</span>
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
                          >
                            {plan.buttonText}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </TooltipProvider>
                </div>
              </TabsContent>
              <TabsContent value="yearly" className="mt-8">
                {/* Yearly Pricing Cards */}
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
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-accent text-black px-4 py-2 font-semibold">
                              <Star className="w-4 h-4 mr-1" />
                              {plan.badge}
                            </Badge>
                          </div>
                        )}
                        
                        <CardHeader className="text-center pb-4">
                          <div className="flex items-center justify-center space-x-2 mb-4">
                            {plan.name === "Free" && <Zap className="w-6 h-6 text-accent" />}
                            {plan.name === "Standard" && <Crown className="w-6 h-6 text-accent" />}
                            {plan.name === "Pro" && <Star className="w-6 h-6 text-accent" />}
                            <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                          </div>
                          <div className="mb-4">
                            <span className="text-4xl font-bold text-white">
                              {plan.price === "$0" ? "$0" : `$${Math.round(parseInt(plan.price.slice(1)) * 0.8)}`}
                            </span>
                            <span className="text-gray-400 ml-2">per month</span>
                            {plan.price !== "$0" && (
                              <div className="text-sm text-gray-400">
                                <span className="line-through">{plan.price}</span> <span className="text-accent">20% off</span>
                              </div>
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
                          >
                            {plan.buttonText}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </TooltipProvider>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Pay-As-You-Go Section */}
          <Card className="cosmic-card max-w-2xl mx-auto mb-20 text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white mb-4">{payAsYouGo.title}</CardTitle>
              <CardDescription className="text-gray-300">{payAsYouGo.description}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-8">
                <span className="text-3xl font-bold text-white">{payAsYouGo.price}</span>
                <span className="text-gray-400 ml-2">{payAsYouGo.unit}</span>
              </div>

              <div className="space-y-3 mb-8 max-w-md mx-auto">
                {payAsYouGo.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="justify-center">
              <Button className="cosmic-button px-10 py-4 font-semibold">
                Start Pay-As-You-Go
              </Button>
            </CardFooter>
          </Card>

          {/* FAQ Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-12">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">Can I change plans anytime?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately.</p>
                </CardContent>
              </Card>
              
              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">What happens to unused generations?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">Unused daily generations don't roll over, but you can always upgrade for higher limits or use pay-as-you-go for flexibility.</p>
                </CardContent>
              </Card>
              
              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">Do you offer refunds?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked.</p>
                </CardContent>
              </Card>
              
              <Card className="cosmic-card text-left">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">Is there a free trial for paid plans?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">Our generous free plan lets you experience most features. You can also try any paid plan for 7 days risk-free.</p>
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
