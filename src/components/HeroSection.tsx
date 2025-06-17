
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Zap, Globe, Share2, Lightbulb, Target, Rocket, Play, Users, TrendingUp, Clock } from "lucide-react";

const HeroSection = () => {
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
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-accent rounded-full animate-ping"></div>
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '-1s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-accent rounded-full animate-ping" style={{ animationDelay: '-3s' }}></div>
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

            {/* Social platform indicators */}
            <div className="flex justify-center items-center space-x-6 pt-8 opacity-70">
              <div className="text-sm text-gray-400">Publishing to:</div>
              <div className="flex space-x-4">
                {/* Facebook Icon */}
                <div className="w-8 h-8 bg-[#1877F2] rounded flex items-center justify-center">
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                
                {/* Instagram Icon */}
                <div className="w-8 h-8 bg-gradient-to-br from-[#405DE6] via-[#5851DB] via-[#833AB4] via-[#C13584] via-[#E1306C] via-[#FD1D1D] to-[#F56040] rounded flex items-center justify-center">
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                
                {/* LinkedIn Icon */}
                <div className="w-8 h-8 bg-[#0077B5] rounded flex items-center justify-center">
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                
                {/* Twitter/X Icon */}
                <div className="w-8 h-8 bg-[#1DA1F2] rounded flex items-center justify-center">
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </div>
              </div>
            </div>
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
