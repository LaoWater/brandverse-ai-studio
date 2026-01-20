import Navigation from "@/components/Navigation";
import { Check, Sparkles, Zap, Shield, Globe, Users, Rocket, Clock, RefreshCcw, AtomIcon,
  Moon, Star, Tag, Triangle, DollarSign, TrendingUp, Target, Lightbulb, ArrowRight, Film, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";

const Features = () => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: <AtomIcon className="w-8 h-8 text-accent" />,
      title: "AI Content for Startups",
      description: "Create compelling product announcements, launch content, and thought leadership pieces. Our AI understands startup storytelling and creates content that resonates with early adopters.",
      savings: { hours: "15-20", money: "$800-1200" },
      metric: "hours saved weekly"
    },
    {
      icon: <Film className="w-8 h-8 text-accent" />,
      title: "Video & Photo Editor",
      description: "Professional video editing built right in. Trim, add transitions, captions, and music — export in full quality with no watermarks. Photo editing tools included. No subscriptions required.",
      savings: { hours: "10-15", money: "$600-900" },
      metric: "hours saved on editing"
    },
    {
      icon: <Target className="w-8 h-8 text-accent" />,
      title: "SEO Everywhere Agent",
      description: "Go beyond Google. Our AI analyzes your visibility across TikTok, YouTube, Reddit, Amazon, ChatGPT, and more — where 73% of buying decisions actually happen.",
      savings: { hours: "25-30", money: "$1000-1500" },
      metric: "hours saved monthly"
    },
    {
      icon: <Globe className="w-8 h-8 text-accent" />,
      title: "Multi-Platform Launch",
      description: "Each platform has its own decision psychology. We tailor your message for TikTok's emotional hooks, YouTube's authority, Reddit's authenticity, and LinkedIn's professionalism.",
      savings: { hours: "10-15", money: "$500-800" },
      metric: "hours saved per launch"
    },
    {
      icon: <Layers className="w-8 h-8 text-accent" />,
      title: "All-in-One Ecosystem",
      description: "Content generation, image creation, video editing, photo editing, SEO analysis — everything a founder or marketer needs, unified in one platform. No more juggling subscriptions.",
      savings: { hours: "15-20", money: "$500-1000" },
      metric: "saved vs separate tools"
    },
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      title: "Founder-First Design",
      description: "Built for solo founders and small teams who need enterprise-level visibility without enterprise complexity. Simple, powerful, and designed for startup velocity.",
      savings: { hours: "8-12", money: "$400-600" },
      metric: "hours saved on marketing"
    },
    {
      icon: <Shield className="w-8 h-8 text-accent" />,
      title: "No Recurring Subscriptions",
      description: "Simple, transparent pay-as-you-go pricing. Buy credits when you need them, use them when you want. No monthly fees draining your runway.",
      savings: { hours: "5-8", money: "$200-400" },
      metric: "saved on unused subscriptions"
    },
    {
      icon: <Rocket className="w-8 h-8 text-accent" />,
      title: "Launch Campaign Manager",
      description: "Plan and execute your product launch across all platforms from one dashboard. Track visibility, engagement, and iterate based on what's working.",
      savings: { hours: "20-25", money: "$1200-1800" },
      metric: "hours saved per launch cycle"
    }
  ];

  const benefits = [
    { icon: <Clock className="w-6 h-6 text-accent" />, text: "Launch faster — from idea to live in hours", stat: "87% time reduction" },
    { icon: <TrendingUp className="w-6 h-6 text-accent" />, text: "Be visible where customers actually decide", stat: "73% off-Google decisions" },
    { icon: <Film className="w-6 h-6 text-accent" />, text: "Edit videos & photos with no watermarks", stat: "Full-quality exports" },
    { icon: <Layers className="w-6 h-6 text-accent" />, text: "All tools unified in one ecosystem", stat: "No subscription juggling" },
    { icon: <DollarSign className="w-6 h-6 text-accent" />, text: "No subscriptions — pay only for what you use", stat: "Founder-friendly pricing" },
    { icon: <Lightbulb className="w-6 h-6 text-accent" />, text: "AI that learns your product's unique story", stat: "Personalized content" }
  ];

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />
      
      {/* Background Effects - Static for performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-accent/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl"></div>
      </div>
      
      <main className="pt-20 pb-16 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 relative">
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
              <div className="relative">
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <span className="text-cosmic font-serif flex items-center justify-center gap-4 mb-4">
                    <Rocket className="w-12 h-12 md:w-16 md:h-16 text-accent animate-pulse" />
                    Launch Tools
                  </span>
                  <span className="text-white block">for Startup</span>
                  <span className="text-accent">Founders</span>
                </h1>
              </div>

              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Your product deserves to be seen. AI tools that <span className="text-accent font-semibold">accelerate</span> your marketing expertise —
                not replace it. The quality of output depends on the knowledge you bring.
              </p>

              <div className="flex justify-center items-center space-x-12 my-16">
                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Rocket className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-accent font-bold text-2xl">Hours</p>
                  <p className="text-gray-400">Not Weeks to Launch</p>
                </div>

                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Globe className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-accent font-bold text-2xl">73%</p>
                  <p className="text-gray-400">Decisions Off-Google</p>
                </div>

                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-accent font-bold text-2xl">$0</p>
                  <p className="text-gray-400">Monthly Subscriptions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="relative group cosmic-card hover:border-accent/50 transition-all duration-500 overflow-hidden cursor-pointer"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                {/* Hover Overlay with Savings */}
                <div className={`
                  absolute inset-0 bg-gray-900 z-10 flex flex-col items-center justify-center p-6
                  transition-all duration-500 transform
                  ${hoveredFeature === index ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                `}>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-green-400 font-bold text-xl">Average Savings</h4>
                    <div className="space-y-2">
                      <p className="text-white text-lg font-semibold">{feature.savings.hours} {feature.metric}</p>
                      <p className="text-green-300 text-lg font-bold">{feature.savings.money} saved monthly</p>
                    </div>
                    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Original Content - THIS IS THE FIX */}
                <div className={`
                  relative z-0 transition-opacity duration-500
                  ${hoveredFeature === index ? 'opacity-0' : 'opacity-100'}
                `}>
                  <div className="flex justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Acceleration Philosophy Section */}
          <div className="cosmic-card mb-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
            </div>

            <div className="relative z-10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Acceleration, Not <span className="text-cosmic font-serif">Replacement</span>
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-gray-300 leading-relaxed">
                    We're not building tools to replace marketers, creators, video editors, or image editors.
                    A small business founder wears all these hats — and that's exactly why they need acceleration, not automation.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    <span className="text-white font-medium">The output of AI is highly dependent on the knowledge and skill level of the one using it.</span> Our tools amplify your expertise, turning hours of repetitive work into minutes while you maintain creative control.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    That's why we're bringing <span className="text-accent font-medium">everything</span> into the Creators Multiverse ecosystem: content generation, AI image creation, video editing, photo editing, SEO analysis — all the tools you need, unified and subscription-free.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-white font-medium">AI Accelerates</p>
                      <p className="text-gray-400 text-sm">Content generation, image creation, video editing, SEO analysis, scheduling</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-white font-medium">You Lead</p>
                      <p className="text-gray-400 text-sm">Strategy, brand voice, creative direction, authentic messaging, final decisions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <div className="w-2 h-2 bg-rose-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-white font-medium">One Ecosystem</p>
                      <p className="text-gray-400 text-sm">No more juggling subscriptions — everything from content to video editing, all in one place</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="cosmic-card text-center mb-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-8">
                <Tag className="w-8 h-8 text-accent animate-pulse" />
                <h2 className="text-4xl font-bold text-white">
                  Why Founders Choose <span className="text-cosmic font-serif">Creators Multiverse</span>
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
                {benefits.map((benefit, index) => (
                  <div key={index} className="group">
                    <div className="flex flex-col items-center space-y-4 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 hover:border-accent/40 transition-all duration-300 hover:scale-105">
                      <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 group-hover:from-primary/30 group-hover:to-accent/20 transition-all duration-300">
                        {benefit.icon}
                      </div>
                      <span className="text-gray-300 text-center text-lg group-hover:text-white transition-colors duration-300">{benefit.text}</span>
                      <span className="text-accent font-bold text-sm">{benefit.stat}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild size="lg" className="cosmic-button px-12 py-6 text-lg font-semibold animate-pulse-glow">
                  <Link to="/brand-setup">
                    <Rocket className="mr-2 w-6 h-6" />
                    Launch Your Product
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-accent text-accent hover:bg-accent hover:text-black px-12 py-6 text-lg font-semibold">
                  <Link to="/pricing">
                    View Pricing <DollarSign className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-8">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to <span className="text-cosmic font-serif">Launch</span> Your Startup?
              </h3>
              <p className="text-xl text-gray-300 mb-8">
                Join founders who've used our platform to take their products from invisible to undeniable.
              </p>
              <div className="flex justify-center items-center space-x-8 opacity-60">
                <div className="text-center">
                  <p className="text-accent font-bold text-2xl">500+</p>
                  <p className="text-gray-400">Startups Launched</p>
                </div>
                <div className="text-center">
                  <p className="text-accent font-bold text-2xl">10+</p>
                  <p className="text-gray-400">Platforms Covered</p>
                </div>
                <div className="text-center">
                  <p className="text-accent font-bold text-2xl">1</p>
                  <p className="text-gray-400">Unified Ecosystem</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Features;