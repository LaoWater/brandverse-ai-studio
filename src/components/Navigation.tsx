
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User, Settings, LogOut, CreditCard, Sparkles } from "lucide-react"; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useAdmin } from "@/hooks/useAdmin";
import CreatorsMultiverseLogo from "@/components/CreatorsMultiverseLogo";
import CreditsDisplay from "@/components/CreditsDisplay";
import CreditsBar from "@/components/CreditsBar";
import ThemeToggle from "@/components/ThemeToggle";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { selectedCompany } = useCompany();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // ... keep existing code (publicNavItems, authNavItems arrays)
  const publicNavItems = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
  ];

  const nonAuthNavItems = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Content Generator", href: "/content-generator" },
    { name: "Media Studio", href: "/media-studio" },
    { name: "Pricing", href: "/pricing" },

  ];

  const authNavItems = [
    { name: "Content Generator", href: "/content-generator" },
    { name: "Media Studio", href: "/media-studio" },
    { name: "Library", href: "/post-manager" },
    { name: "Settings", href: "/settings" },
  ];

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
            {user ? (
              <>
                {/* Collapsible Home Menu for authenticated users */}
                <div className="relative">
                  <Collapsible open={isHomeMenuOpen} onOpenChange={setIsHomeMenuOpen}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                      >
                        Home
                        <ChevronDown className={`w-4 h-4 transition-transform ${isHomeMenuOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="absolute top-full left-0 mt-2 w-48 bg-card border border-primary/20 rounded-md shadow-lg z-50">
                      <div className="py-2">
                        {publicNavItems.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => setIsHomeMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Main authenticated navigation */}
                {authNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              // Show public navigation for non-authenticated users
              nonAuthNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {item.name}
                </Link>
              ))
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle - Always visible */}
            <ThemeToggle />

            {user ? (
              <div className="flex items-center space-x-4">
                {/* Credits Display for Admins */}
                {isAdmin && <CreditsDisplay />}
                
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
                  
                  <DropdownMenuContent align="end" className="w-64 bg-card border-primary/20 p-0">
                    {/* Credits Bar - First item */}
                    <CreditsBar />
                    
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
              // ... keep existing code (sign in buttons)
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
          <div className="md:hidden flex items-center space-x-2">
            {/* Theme Toggle - Mobile */}
            <ThemeToggle />

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
              {user ? (
                <>
                  {/* Mobile Credits Display for Admins */}
                  {isAdmin && (
                    <div className="px-4 py-2 border-b border-primary/20">
                      <CreditsDisplay />
                    </div>
                  )}
                  
                  {/* Mobile Credits Bar */}
                  <div className="border-b border-primary/20">
                    <CreditsBar />
                  </div>
                  
                  {/* Mobile Home Menu */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="text-gray-300 hover:text-white transition-colors w-full justify-between"
                      >
                        Home
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-4 mt-2 space-y-2">
                      {publicNavItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="block text-gray-300 hover:text-white transition-colors py-2"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Mobile authenticated navigation */}
                  {authNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="text-gray-300 hover:text-white transition-colors py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </>
              ) : (
                // ... keep existing code (mobile public navigation)
                nonAuthNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-gray-300 hover:text-white transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))
              )}
              
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