
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Settings } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cosmic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-cosmic-drift"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-cosmic-drift" style={{ animationDelay: '-10s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-accent/30 rounded-full blur-2xl animate-pulse"></div>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="text-cosmic font-serif">Create</span>
            <br />
            <span className="text-white">Infinite Content</span>
            <br />
            <span className="text-accent">Across Platforms</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Generate AI-powered, brand-aligned social media content that scales across 
            Instagram, LinkedIn, Twitter, and beyond. Welcome to the multiverse of creation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              asChild 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-semibold glow-effect animate-pulse-glow"
            >
              <Link to="/brand-setup">
                Start Creating <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="border-accent text-accent hover:bg-accent hover:text-black px-8 py-6 text-lg font-semibold"
            >
              <Link to="/content-generator">
                See Demo <Calendar className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
