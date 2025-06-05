
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings, Calendar, User } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/20 border-b border-white/10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">CM</span>
          </div>
          <span className="font-serif font-semibold text-xl text-cosmic">
            Creators Multiverse
          </span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          <Link 
            to="/content-generator" 
            className={`text-sm font-medium transition-colors hover:text-accent ${
              isActive('/content-generator') ? 'text-accent' : 'text-gray-300'
            }`}
          >
            Generator
          </Link>
          <Link 
            to="/campaign-preview" 
            className={`text-sm font-medium transition-colors hover:text-accent ${
              isActive('/campaign-preview') ? 'text-accent' : 'text-gray-300'
            }`}
          >
            Campaigns
          </Link>
          <Link 
            to="/settings" 
            className={`text-sm font-medium transition-colors hover:text-accent ${
              isActive('/settings') ? 'text-accent' : 'text-gray-300'
            }`}
          >
            Settings
          </Link>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" asChild className="md:hidden">
            <Link to="/settings">
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="md:hidden">
            <Link to="/campaign-preview">
              <Calendar className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="hidden md:flex">
            <User className="w-4 h-4 mr-2" />
            Login
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
