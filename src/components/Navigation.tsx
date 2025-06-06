
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User, Settings, LogOut, CreditCard } from "lucide-react"; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import CreatorsMultiverseLogo from "@/components/CreatorsMultiverseLogo";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { selectedCompany } = useCompany();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const baseNavItems = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
  ];

  const authNavItems = [
    { name: "Content Generator", href: "/content-generator" },
    { name: "Settings", href: "/settings" },
  ];

  const navItems = user ? [...baseNavItems, ...authNavItems] : baseNavItems;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <CreatorsMultiverseLogo className="w-14 h-14" />
            <span className="text-xl font-bold text-white">Creators Multiverse</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-white text-sm block">Welcome, {user.email}</span>
                  {selectedCompany && (
                    <span className="text-gray-400 text-xs block">
                      Working on: {selectedCompany.name}
                    </span>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-white/10 p-2">
                      <User className="w-5 h-5" />
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-48 bg-card border-primary/20">
                    <DropdownMenuItem 
                      onClick={() => navigate('/my-plan')}
                      className="text-white hover:bg-white/10 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      My Plan
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => navigate('/settings')}
                      className="text-white hover:bg-white/10 cursor-pointer"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-primary/20" />
                    
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/auth">
                  <button className="px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link to="/auth">
                  <button className="cosmic-button px-6 py-2 rounded-md">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-primary/20">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {user ? (
                <div className="pt-4 border-t border-primary/20">
                  <div className="mb-4">
                    <p className="text-white text-sm mb-1">Welcome, {user.email}</p>
                    {selectedCompany && (
                      <p className="text-gray-400 text-xs">
                        Working on: {selectedCompany.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <button 
                      onClick={() => {
                        navigate('/my-plan');
                        setIsOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors w-full text-left"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      My Plan
                    </button>
                    
                    <button 
                      onClick={() => {
                        navigate('/settings');
                        setIsOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors w-full text-left"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    
                    <button 
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-md transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-primary/20">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <button className="px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors w-full">
                      Sign In
                    </button>
                  </Link>
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <button className="cosmic-button px-6 py-2 rounded-md w-full">
                      Get Started
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
