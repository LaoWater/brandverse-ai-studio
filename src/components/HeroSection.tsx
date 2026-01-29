
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Zap, Globe, Share2, Lightbulb, Target, Rocket, Play, Users, TrendingUp, Clock, Activity, GitGraph, DatabaseIcon, Sparkles, Radio, Film, Scissors, Music, Type } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import ReviewsSection from "./ReviewsSection";

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
      style: "bg-black hover:shadow-[0_0_15px_rgba(255,255,255,0.5)]",
    },
  ];

  return (
    <div className="min-h-screen hero-section-page">
      {/* Main Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24
       md:pt-0">
        {/* Enhanced Cosmic Background Elements - Static for performance */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Central light speed burst */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/30 rounded-full blur-3xl"></div>

          {/* Light speed streaks */}
          <div className="hero-light-rays absolute top-1/4 left-1/4 w-64 h-1 bg-gradient-to-r from-transparent via-accent/60 to-transparent rotate-45 blur-sm"></div>
          <div className="hero-light-rays absolute bottom-1/3 right-1/3 w-80 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent -rotate-45 blur-sm"></div>
          <div className="hero-light-rays absolute top-1/3 right-1/4 w-48 h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent rotate-12 blur-sm"></div>

          {/* Speed particles */}
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-primary rounded-full"></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-accent rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="relative">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">
                <span className="text-cosmic font-serif flex items-center justify-center gap-2 sm:gap-3">
                  <Rocket className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-accent animate-pulse" />
                  <span>Launch Your Startup</span>
                </span>
                <br />
                <span className="text-white">Into The Spotlight</span>
                <br />
                <span className="text-accent">Everywhere That Matters</span>
              </h1>
            </div>

            <p className="text-base sm:text-lg md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-2">
              You built something great. Now make sure the world sees it.
              <br className="hidden sm:block" />
              <span className="text-white">AI-powered tools that <span className="text-accent font-semibold">accelerate</span> your expertise</span> —
              not replace it. Your vision, amplified everywhere that matters.
            </p>

            {/* Visual concept representation - 3D Holographic Cards */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 md:gap-12 my-8 sm:my-16 px-4">
              {/* Your Product Card */}
              <div className="group relative">
                <div className="relative transform hover:scale-105 transition-all duration-500 hover:-rotate-2">
                  {/* Animated gradient glow border */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400 rounded-3xl opacity-60 blur-lg animate-pulse group-hover:opacity-80 transition-opacity"></div>

                  {/* Glass card with proper light/dark mode */}
                  <div className="relative bg-gradient-to-br from-white/80 to-white/60 dark:from-black/40 dark:to-black/20 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 border-2 border-sky-400/30 shadow-2xl overflow-visible">
                    {/* Floating icon above card */}
                    <div className="relative -mt-10 sm:-mt-14 mb-2 sm:mb-3 flex justify-center">
                      {/* Icon glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl blur-2xl opacity-40 animate-pulse scale-110"></div>

                      {/* Icon container - boosted vibrant colors */}
                      <div className="icon-gradient-container relative bg-gradient-to-br from-sky-600 to-indigo-700 rounded-2xl p-3 sm:p-4 shadow-2xl transform hover:rotate-12 hover:scale-110 transition-all duration-300">
                        <Rocket className="w-7 h-7 sm:w-9 sm:h-9 text-white force-text-white drop-shadow-2xl " />
                      </div>
                    </div>

                    {/* Label with solid color fallback */}
                    <p className="text-xs sm:text-sm font-bold text-center bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      Your Product
                    </p>
                  </div>
                </div>
              </div>

              {/* Speed Animation - Enhanced */}
              <div className="flex sm:flex-row flex-col gap-1.5">
                <div className="w-8 h-1 sm:w-12 sm:h-1.5 bg-gradient-to-r from-accent to-transparent animate-pulse rounded-full shadow-lg shadow-accent/50"></div>
                <div className="w-8 h-1 sm:w-12 sm:h-1.5 bg-gradient-to-r from-primary to-transparent animate-pulse rounded-full shadow-lg shadow-primary/50" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-8 h-1 sm:w-12 sm:h-1.5 bg-gradient-to-r from-accent to-transparent animate-pulse rounded-full shadow-lg shadow-accent/50" style={{ animationDelay: '0.3s' }}></div>
              </div>

              {/* Global Visibility Card */}
              <div className="group relative">
                <div className="relative transform hover:scale-105 transition-all duration-500 hover:rotate-2">
                  {/* Animated gradient glow border */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#5B5FEE] via-[#00D4FF] to-[#5B5FEE] rounded-3xl opacity-60 blur-lg animate-pulse group-hover:opacity-80 transition-opacity" style={{ animationDelay: '0.5s' }}></div>

                  {/* Glass card with proper light/dark mode */}
                  <div className="relative bg-gradient-to-br from-white/80 to-white/60 dark:from-black/40 dark:to-black/20 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 border-2 border-[#5B5FEE]/30 shadow-2xl overflow-visible">
                    {/* Floating icon above card */}
                    <div className="relative -mt-10 sm:-mt-14 mb-2 sm:mb-3 flex justify-center">
                      {/* Icon glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#5B5FEE] to-[#00D4FF] rounded-2xl blur-2xl opacity-40 animate-pulse scale-110"></div>

                      {/* Icon container - vibrant in light mode with hardcoded colors */}
                      <div className="icon-gradient-container relative bg-gradient-to-br from-[#5B5FEE] to-[#00D4FF] rounded-2xl p-3 sm:p-4 shadow-2xl transform hover:-rotate-12 hover:scale-110 transition-all duration-300">
                        <Globe className="w-7 h-7 sm:w-9 sm:h-9 text-white force-text-white drop-shadow-2xl" />
                      </div>
                    </div>

                    {/* Label - solid color for light mode */}
                    <p className="text-xs sm:text-sm font-bold text-center text-[#5B5FEE]/90 dark:bg-gradient-to-r dark:from-[#5B5FEE] dark:to-[#00D4FF] dark:bg-clip-text dark:text-transparent">
                      Global Visibility
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* === UPDATED SECTION: Multi-Platform Visibility === */}
            <div className="flex flex-col items-center space-y-3 sm:space-y-4 pt-6 sm:pt-12 px-4">
              <div className="text-xs sm:text-sm text-gray-400">Be visible where decisions happen:</div>
              <div className="flex items-center justify-center space-x-3 sm:space-x-4">
                {socialPlatforms.map((platform) => (
                  <div
                    key={platform.name}
                    title={platform.name}
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                      transition-all duration-300 ease-in-out
                      hover:scale-110 cursor-pointer
                      ${platform.style}
                    `}
                  >
                    <platform.Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white force-text-white" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 max-w-md text-center px-2">
                Over 70% of buying decisions happen outside Google. We help you reach customers on TikTok, YouTube, Reddit, and beyond.
              </p>
            </div>
            {/* === END UPDATED SECTION === */}

          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="py-12 sm:py-24 relative bg-gradient-to-b from-background to-background/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              See It In <span className="text-cosmic font-serif">Action</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto px-2">
              Watch how founders use our platform to launch their products into the spotlight
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {/* The container already has the perfect styling for a video embed */}
            <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl overflow-hidden cosmic-card">
              <iframe
                src="https://player.vimeo.com/video/1095653837?title=0&byline=0&portrait=0&color=your_hex_color"
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Product Demo Video" // Add a descriptive title for accessibility
                loading="lazy" // Improves page load performance
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Video Editor Showcase Section */}
      <section className="py-12 sm:py-24 relative bg-gradient-to-b from-background/80 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 mb-4 sm:mb-6">
              <Film className="w-4 h-4 text-rose-400" />
              <span className="text-sm text-rose-300 font-medium">Integrated Video Editor</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Edit Your Media, <span className="text-cosmic font-serif">Your Way</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-300 max-w-3xl mx-auto px-2">
              Professional video editing built right in. Trim, add transitions, captions, and music —
              then export in full quality. No subscriptions, no watermarks, no limits.
            </p>
          </div>

          {/* Video Editor Screenshot Placeholder */}
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-rose-500/20 rounded-3xl blur-xl opacity-60"></div>

              {/* Screenshot container */}
              <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl overflow-hidden border border-rose-500/30 shadow-2xl">
                {/* Placeholder for screenshot - replace src with actual screenshot */}
                <div className="aspect-video bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center">
                  {/* Placeholder content - will be replaced with actual screenshot */}
                  <img
                    src="/video-editor-screenshot.png"
                    alt="Video Editor Interface - Timeline, transitions, captions and audio tools"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if screenshot doesn't exist yet
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.classList.add('placeholder-active');
                    }}
                  />
                  {/* Fallback placeholder UI */}
                  <div className="placeholder-fallback absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-500/30 to-purple-500/30 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                      <Film className="w-8 h-8 sm:w-10 sm:h-10 text-rose-400" />
                    </div>
                  </div>
                </div>

                {/* Feature badges overlay */}
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 backdrop-blur-sm rounded-full border border-white/10">
                    <Scissors className="w-3 h-3 text-rose-400" />
                    <span className="text-xs text-white">Trim & Cut</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 backdrop-blur-sm rounded-full border border-white/10">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-white">Transitions</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 backdrop-blur-sm rounded-full border border-white/10">
                    <Type className="w-3 h-3 text-sky-400" />
                    <span className="text-xs text-white">Captions</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 backdrop-blur-sm rounded-full border border-white/10">
                    <Music className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-white">Audio</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ecosystem message */}
          <div className="text-center mt-8 sm:mt-12">
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
              Part of the <span className="text-accent font-medium">Creators Multiverse</span> ecosystem —
              content generation, image creation, video editing, SEO analysis, all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Founder's Launch Hub Section */}
      <section className="py-12 sm:py-24 relative">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
            <div className="space-y-4 sm:space-y-8">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white">
                Your Launch <span className="text-cosmic font-serif">Command Center</span>
              </h2>
              <p className="text-base sm:text-xl text-gray-300 leading-relaxed">
                Built for founders who move fast. Create content, analyze SEO opportunities,
                and distribute across platforms — all from one dashboard designed for startup velocity.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    <span className="text-white font-semibold text-sm sm:text-base">Launch Faster</span>
                  </div>
                  <p className="text-gray-400 text-xs sm:text-sm">From idea to multi-platform presence in hours, not weeks</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    <span className="text-white font-semibold text-sm sm:text-base">SEO Everywhere</span>
                  </div>
                  <p className="text-gray-400 text-xs sm:text-sm">Optimize for Google, TikTok, Facebook, Instagram & more</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="/CommandCenter.jpg"
                alt="Content creator working on laptop"
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <GitGraph className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solo Founder & Small Team Section */}
      <section className="py-12 sm:py-24 relative bg-gradient-to-b from-background/50 to-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80"
                alt="Modern workspace with multiple devices"
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <div className="space-y-4 sm:space-y-8 order-1 lg:order-2">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white">
                Built for <span className="text-cosmic font-serif">Startup Speed</span>
              </h2>
              <p className="text-sm sm:text-lg md:text-xl text-gray-300 leading-relaxed">
                Solo or small team, bootstrapped or funded — get enterprise-level marketing power
                without the enterprise price tag or complexity.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                  <span className="text-white text-sm sm:text-base">No recurring subscriptions — pay for what you use</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                  <span className="text-white text-sm sm:text-base">AI learns your product's unique value proposition</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                  <span className="text-white text-sm sm:text-base">One dashboard for all your visibility needs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section - NEW */}
      <ReviewsSection />

      {/* Focus on Product Section */}
      <section className="py-12 sm:py-24 relative">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
            <div className="space-y-4 sm:space-y-8">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white">
                Focus on <span className="text-cosmic font-serif">Building</span>
              </h2>
              <p className="text-base sm:text-xl text-gray-300 leading-relaxed">
                You have a product to perfect and customers to serve. Our AI accelerates the visibility work —
                content creation, SEO analysis, and multi-platform distribution — while you stay in the driver's seat.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 text-black px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold"
              >
                <Link to="/brand-setup">
                  Launch Your Product <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <img
                src="/unleash_your_productivity.jpg"
                alt="Founder working on their startup"
                className="rounded-2xl shadow-2xl w-full h-full"
              />
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 sm:p-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: '#ffffff' }}>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Your Product Getting Discovered
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-12 sm:py-24 relative">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white">
              Ready to <span className="text-cosmic font-serif">Launch?</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-300 leading-relaxed px-2">
              Your product deserves to be seen. Let's make sure it is — everywhere that matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 sm:pt-8">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg font-semibold glow-effect animate-pulse-glow"
              >
                <Link to="/brand-setup">
                  <Rocket className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  Start Your Launch
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
