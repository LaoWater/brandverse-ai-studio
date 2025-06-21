import Navigation from "@/components/Navigation";
import { Check, Sparkles, Zap, Shield, Globe, Users, Rocket, Clock, RefreshCcw, AtomIcon,
  Moon, Star, Tag, Triangle, DollarSign, TrendingUp, Target, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";

const Features = () => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: <AtomIcon className="w-8 h-8 text-accent" />,
      title: "AI-Powered Content Generation",
      description: "Create engaging social media posts, blog articles, and marketing copy with advanced AI that understands your brand voice and creates content that converts.",
      savings: { hours: "15-20", money: "$800-1200" },
      metric: "hours saved weekly"
    },
    {
      icon: <Zap className="w-8 h-8 text-accent" />,
      title: "Lightning Fast Creation",
      description: "Generate high-quality content in seconds, not hours. Our optimized AI delivers professional results instantly, letting you focus on strategy and engagement.",
      savings: { hours: "25-30", money: "$1000-1500" },
      metric: "hours saved monthly"
    },
    {
      icon: <Globe className="w-8 h-8 text-accent" />,
      title: "Multi-Platform Optimization",
      description: "Content automatically optimized for different platforms - Instagram, X, LinkedIn, Facebook, and more. Each post is tailored for maximum platform-specific engagement.",
      savings: { hours: "10-15", money: "$500-800" },
      metric: "hours saved per campaign"
    },
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      title: "Brand Voice Consistency",
      description: "Maintain your unique brand voice across all content with our advanced brand voice learning system that adapts to your style and tone perfectly.",
      savings: { hours: "8-12", money: "$400-600" },
      metric: "hours saved on brand alignment"
    },
    {
      icon: <Shield className="w-8 h-8 text-accent" />,
      title: "Content Safety & Quality",
      description: "Built-in content filters and quality checks ensure your content is always professional, on-brand, and ready for publication without manual review.",
      savings: { hours: "5-8", money: "$200-400" },
      metric: "hours saved on content review"
    },
    {
      icon: <Rocket className="w-8 h-8 text-accent" />,
      title: "Campaign Management",
      description: "Plan, create, and manage entire content campaigns with our intuitive tools. Schedule, track performance, and optimize for maximum ROI across all platforms.",
      savings: { hours: "20-25", money: "$1200-1800" },
      metric: "hours saved per campaign cycle"
    }
  ];

  const benefits = [
    { icon: <Clock className="w-6 h-6 text-accent" />, text: "Save 15+ hours per week on content creation", stat: "87% time reduction" },
    { icon: <TrendingUp className="w-6 h-6 text-accent" />, text: "Increase engagement rates by up to 300%", stat: "3x better performance" },
    { icon: <Target className="w-6 h-6 text-accent" />, text: "Maintain consistent brand messaging", stat: "95% brand consistency" },
    { icon: <Lightbulb className="w-6 h-6 text-accent" />, text: "Scale your content production effortlessly", stat: "10x content output" },
    { icon: <DollarSign className="w-6 h-6 text-accent" />, text: "Access to latest AI content generation models", stat: "$3000+ monthly savings" },
    { icon: <Triangle className="w-6 h-6 text-accent" />, text: "Real-time content performance analytics", stat: "Real-time insights" }
  ];

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '-4s' }}></div>
      </div>
      
      <main className="pt-20 pb-16 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 relative">
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
              <div className="relative">
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <span className="text-cosmic font-serif flex items-center justify-center gap-4 mb-4">
                    <Rocket className="w-12 h-12 md:w-16 md:h-16 text-accent animate-pulse" />
                    Powerful Features
                  </span>
                  <span className="text-white block">for Content</span>
                  <span className="text-accent">Creators</span>
                </h1>
              </div>
              
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Everything you need to transform your content creation workflow with the power of AI. 
                Save thousands of hours and amplify your creative impact across all platforms.
              </p>

              <div className="flex justify-center items-center space-x-12 my-16">
                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-accent font-bold text-2xl">15+ Hours</p>
                  <p className="text-gray-400">Saved Weekly</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-accent font-bold text-2xl">300%</p>
                  <p className="text-gray-400">Better Engagement</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-accent font-bold text-2xl">$3000+</p>
                  <p className="text-gray-400">Monthly Savings</p>
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

          <div className="cosmic-card text-center mb-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-8">
                <Tag className="w-8 h-8 text-accent animate-pulse" />
                <h2 className="text-4xl font-bold text-white">
                  Why Choose <span className="text-cosmic font-serif">Creators Multiverse?</span>
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
                    Start Creating Magic
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-accent text-accent hover:bg-accent hover:text-black px-12 py-6 text-lg font-semibold">
                  <Link to="/pricing">
                    See Pricing <DollarSign className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-8">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to <span className="text-cosmic font-serif">Transform</span> Your Content?
              </h3>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of creators who have already revolutionized their content workflow with our AI-powered platform.
              </p>
              <div className="flex justify-center items-center space-x-8 opacity-60">
                <div className="text-center">
                  <p className="text-accent font-bold text-2xl">10,000+</p>
                  <p className="text-gray-400">Active Creators</p>
                </div>
                <div className="text-center">
                  <p className="text-accent font-bold text-2xl">2M+</p>
                  <p className="text-gray-400">Posts Generated</p>
                </div>
                <div className="text-center">
                  <p className="text-accent font-bold text-2xl">98%</p>
                  <p className="text-gray-400">Satisfaction Rate</p>
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