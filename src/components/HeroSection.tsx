
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Zap, Globe, Share2, Lightbulb, Target, Rocket, Play, Users, TrendingUp, Clock } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";

const HeroSection = () => {

  const socialPlatforms = [
    {
      name: "Facebook",
      Icon: FaFacebookF,
      style: "bg-[#1877F2] hover:shadow-[0_0_15px_#1877F2]",
    },
    {
      name: "Instagram",
      Icon: FaInstagram,
      style: "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] hover:shadow-[0_0_15px_#E1306C]",
    },
    {
      name: "LinkedIn",
      Icon: FaLinkedinIn,
      style: "bg-[#0077B5] hover:shadow-[0_0_15px_#0077B5]",
    },
    {
      name: "X",
      Icon: FaXTwitter,
      // Using a subtle white glow for X's black background
      style: "bg-black hover:shadow-[0_0_15px_rgba(255,255,255,0.5)]",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Main Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Enhanced Cosmic Background Elements - Speed Theme */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Central light speed burst */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse"></div>
          
          {/* Light speed streaks */}
          <div className="absolute top-1/4 left-1/4 w-64 h-1 bg-gradient-to-r from-transparent via-accent/60 to-transparent rotate-45 blur-sm animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-80 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent -rotate-45 blur-sm animate-pulse" style={{ animationDelay: '-2s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-48 h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent rotate-12 blur-sm animate-pulse" style={{ animationDelay: '-4s' }}></div>
          
          {/* Speed particles */}
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '-1s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '-3s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="relative">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="text-cosmic font-serif flex items-center justify-center gap-3">
                  <Zap className="w-12 h-12 md:w-16 md:h-16 text-accent animate-pulse" />
                  Transform Ideas
                </span>
                <br />
                <span className="text-white">Into Viral Content</span>
                <br />
                <span className="text-accent">At Light Speed</span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Watch your brilliant ideas accelerate from concept to viral content in seconds. 
              Our AI captures your creative essence and propels it across Twitter, Instagram, 
              LinkedIn, and Facebook at the speed of light.
            </p>

            {/* Visual concept representation - Speed Theme */}
            <div className="flex justify-center items-center space-x-8 my-12">
              <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full flex items-center justify-center mb-2 mx-auto animate-pulse">
                <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-gray-400">Your Ideas</p>
              </div>
              
              <div className="flex space-x-1">
                <div className="w-8 h-1 bg-gradient-to-r from-accent to-transparent animate-pulse"></div>
                <div className="w-8 h-1 bg-gradient-to-r from-primary to-transparent animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-8 h-1 bg-gradient-to-r from-accent to-transparent animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-2 mx-auto">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-gray-400">Instant Impact</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button 
                asChild 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-semibold glow-effect animate-pulse-glow"
              >
                <Link to="/brand-setup">
                  <Rocket className="mr-2 w-5 h-5" />
                  Start Creating Magic
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="border-accent text-accent hover:bg-accent hover:text-black px-8 py-6 text-lg font-semibold"
              >
                <Link to="/content-generator">
                  See the Magic <Calendar className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>

   {/* === UPDATED SECTION: Social Platform Indicators === */}
   <div className="flex justify-center items-center space-x-6 pt-12 opacity-80">
              <div className="text-sm text-gray-400">Publishing to:</div>
              <div className="flex items-center justify-center space-x-4">
                {socialPlatforms.map((platform) => (
                  <div
                    key={platform.name}
                    title={platform.name}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center 
                      transition-all duration-300 ease-in-out 
                      hover:scale-110 cursor-pointer
                      ${platform.style}
                    `}
                  >
                    <platform.Icon className="w-5 h-5 text-white" />
                  </div>
                ))}
              </div>
            </div>
            {/* === END UPDATED SECTION === */}

          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="py-24 relative bg-gradient-to-b from-background to-background/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              See It In <span className="text-cosmic font-serif">Action</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Watch how our AI transforms your ideas into compelling content across all platforms
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl overflow-hidden cosmic-card">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto hover:scale-110 transition-transform cursor-pointer">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <p className="text-white text-lg">Coming Soon - Product Demo</p>
                  <p className="text-gray-400 text-sm mt-2">See the magic unfold in real-time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creative Workspace Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Your Creative <span className="text-cosmic font-serif">Command Center</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Transform any workspace into a content creation powerhouse. Our AI works wherever inspiration strikes - 
                from your home office to your favorite café.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    <span className="text-white font-semibold">Save Hours Daily</span>
                  </div>
                  <p className="text-gray-400 text-sm">Automate content creation across all platforms</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <span className="text-white font-semibold">Viral Potential</span>
                  </div>
                  <p className="text-gray-400 text-sm">AI-optimized content for maximum engagement</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/CommandCenter.jpg" 
                alt="Content creator working on laptop"
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collaboration Section */}
      <section className="py-24 relative bg-gradient-to-b from-background/50 to-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <img 
                src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80" 
                alt="Modern workspace with multiple devices"
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Built for <span className="text-cosmic font-serif">Modern Teams</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Whether you're a solo creator or part of a marketing team, our platform scales with your needs. 
                Collaborate seamlessly and maintain brand consistency across all channels.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-white">Multi-platform publishing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-white">Brand voice consistency</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-white">Performance analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Productivity Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Unleash Your <span className="text-cosmic font-serif">Productivity</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Focus on what you do best - creating amazing ideas. Let our AI handle the heavy lifting of 
                content adaptation, scheduling, and optimization across all your social platforms.
              </p>
              <Button 
                asChild 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-black px-8 py-4 text-lg font-semibold"
              >
                <Link to="/brand-setup">
                  Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <img 
                src="/unleash_your_productivity.jpg" 
                alt="Professional working on content creation"
                className="rounded-2xl shadow-2xl w-full h-full"
              />
              <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-white">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  AI Working
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



    </div>
  );
};

export default HeroSection;
