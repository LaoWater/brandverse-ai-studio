
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Sparkles, Zap, Globe, Share2 } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced Cosmic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Central idea explosion */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse"></div>
        
        {/* Idea spreading particles */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent/40 rounded-full blur-2xl animate-cosmic-drift"></div>
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-cosmic-drift" style={{ animationDelay: '-5s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-accent/30 rounded-full blur-xl animate-cosmic-drift" style={{ animationDelay: '-10s' }}></div>
        
        {/* Connection lines simulation */}
        <div className="absolute top-1/2 left-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent rotate-45 blur-sm"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent -rotate-45 blur-sm"></div>
        <div className="absolute top-1/2 left-1/2 w-56 h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent rotate-12 blur-sm"></div>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
          {/* Enhanced floating icons representing social platforms */}
          <div className="relative mb-8">
            <div className="absolute -top-16 left-1/4 animate-bounce" style={{ animationDelay: '0s' }}>
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
                <Share2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="absolute -top-20 right-1/3 animate-bounce" style={{ animationDelay: '0.5s' }}>
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute -top-12 right-1/4 animate-bounce" style={{ animationDelay: '1s' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
                <Globe className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          <div className="relative">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-cosmic font-serif flex items-center justify-center gap-3">
                <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-accent animate-pulse" />
                Transform Ideas
              </span>
              <br />
              <span className="text-white">Into Viral Content</span>
              <br />
              <span className="text-accent">Across the Universe</span>
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Watch your brilliant ideas gleam and sparkle as they spread across Twitter, Instagram, 
            LinkedIn, and Facebook. Our AI captures your creative essence and amplifies it 
            to reach every corner of the digital multiverse.
          </p>

          {/* Visual concept representation */}
          <div className="flex justify-center items-center space-x-8 my-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-2 mx-auto animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-gray-400">Your Ideas</p>
            </div>
            
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-ping"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-accent rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-2 mx-auto">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-gray-400">Global Reach</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              asChild 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-semibold glow-effect animate-pulse-glow"
            >
              <Link to="/brand-setup">
                <Sparkles className="mr-2 w-5 h-5" />
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
            <div className="text-sm text-gray-400">Spreading to:</div>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">f</span>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">ig</span>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">in</span>
              </div>
              <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">tw</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
