
import Navigation from "@/components/Navigation";
import { Check, Sparkles, Zap, Shield, Globe, Users, Rocket } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Sparkles className="w-8 h-8 text-accent" />,
      title: "AI-Powered Content Generation",
      description: "Create engaging social media posts, blog articles, and marketing copy with advanced AI that understands your brand voice."
    },
    {
      icon: <Zap className="w-8 h-8 text-accent" />,
      title: "Lightning Fast Creation",
      description: "Generate content in seconds, not hours. Our optimized AI delivers high-quality results instantly."
    },
    {
      icon: <Globe className="w-8 h-8 text-accent" />,
      title: "Multi-Platform Optimization",
      description: "Content automatically optimized for different platforms - Instagram, Twitter, LinkedIn, Facebook, and more."
    },
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      title: "Brand Voice Consistency",
      description: "Maintain your unique brand voice across all content with our advanced brand voice learning system."
    },
    {
      icon: <Shield className="w-8 h-8 text-accent" />,
      title: "Content Safety & Quality",
      description: "Built-in content filters and quality checks ensure your content is always professional and on-brand."
    },
    {
      icon: <Rocket className="w-8 h-8 text-accent" />,
      title: "Campaign Management",
      description: "Plan, create, and manage entire content campaigns with our intuitive campaign management tools."
    }
  ];

  const benefits = [
    "Save 10+ hours per week on content creation",
    "Increase engagement rates by up to 300%",
    "Maintain consistent brand messaging",
    "Scale your content production effortlessly",
    "Access to latest AI content generation models",
    "Real-time content performance analytics"
  ];

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Powerful Features for
              <span className="text-cosmic block mt-2">Content Creators</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Everything you need to create, manage, and optimize your content creation workflow with the power of AI.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="cosmic-card p-8 text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="cosmic-card p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              Why Choose Creators Multiverse?
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <a href="/auth" className="cosmic-button px-8 py-3 rounded-lg text-lg font-semibold">
                Start Creating Today
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Features;
