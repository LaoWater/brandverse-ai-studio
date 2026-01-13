
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User, Settings, LogOut, CreditCard, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import CreatorsMultiverseLogo from "@/components/CreatorsMultiverseLogo";
import CreditsBar from "@/components/CreditsBar";
import ThemeToggle from "@/components/ThemeToggle";
import { CompanySelector } from "@/components/CompanySelector";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
  const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { selectedCompany } = useCompany();
  const navigate = useNavigate();
  const homeMenuRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (homeMenuRef.current && !homeMenuRef.current.contains(event.target as Node)) {
        setIsHomeMenuOpen(false);
      }
    };

    if (isHomeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHomeMenuOpen]);

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

  // Main navigation items - same for both authenticated and anonymous users
  // Auth guards are handled at the feature/page level
  const mainNavItems = [
    { name: "Content Generator", href: "/content-generator" },
    { name: "Media Studio", href: "/media-studio" },
    { name: "Library", href: "/post-manager" },
    { name: "SEO Agent", href: "/seo-agent" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <CreatorsMultiverseLogo className="w-10 h-10 lg:w-14 lg:h-14" />
            <span className="text-base lg:text-xl font-bold text-white whitespace-nowrap hidden sm:inline">Creators Multiverse</span>
          </Link>

          {/* Desktop Navigation - Same for both auth and anon users */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 xl:space-x-8">
            {/* Collapsible Home Menu */}
            <div className="relative" ref={homeMenuRef}>
              <button
                onClick={() => setIsHomeMenuOpen(!isHomeMenuOpen)}
                className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 whitespace-nowrap text-sm lg:text-base"
              >
                Home
                <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${isHomeMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isHomeMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 shadow-lg z-50 nav-dropdown-content">
                  <div className="py-2">
                    {publicNavItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors nav-dropdown-item"
                        onClick={() => setIsHomeMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main navigation items - same for all users */}
            {mainNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-300 hover:text-white transition-colors px-2 py-1 whitespace-nowrap text-sm lg:text-base"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            {/* Theme Toggle - Always visible */}
            <ThemeToggle />

            {user ? (
              <div className="flex items-center space-x-2 lg:space-x-4">
                <div className="text-right hidden lg:block max-w-[180px] xl:max-w-none">
                  <span className="text-white text-sm block truncate">Welcome, {user.email}</span>
                  {selectedCompany && (
                    <span className="text-gray-400 text-xs block truncate">
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

                    {/* Current Company - Clickable to change */}
                    {selectedCompany && (
                      <>
                        <DropdownMenuItem
                          onClick={() => setIsCompanySelectorOpen(true)}
                          className="text-white hover:bg-white/10 cursor-pointer"
                        >
                          <Building2 className="w-4 h-4 mr-2" />
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="text-xs text-gray-400">Current Company</span>
                            <span className="truncate text-sm font-medium">{selectedCompany.name}</span>
                          </div>
                          <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-primary/20" />
                      </>
                    )}

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
              // Sign in buttons
              <>
                <Link to="/auth">
                  <button className="px-2 lg:px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors text-sm lg:text-base whitespace-nowrap">
                    Sign In
                  </button>
                </Link>
                <Link to="/auth">
                  <button className="cosmic-button px-3 lg:px-6 py-2 rounded-md text-sm lg:text-base whitespace-nowrap">
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
              {/* Mobile Credits Bar - only for authenticated users */}
              {user && <CreditsBar />}

              {/* Mobile Home Menu - same for all users */}
              <div>
                <button
                  onClick={() => setIsHomeMenuOpen(!isHomeMenuOpen)}
                  className="text-gray-300 hover:text-white transition-colors w-full flex justify-between items-center py-2"
                >
                  Home
                  <ChevronDown className={`w-4 h-4 transition-transform ${isHomeMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isHomeMenuOpen && (
                  <div className="ml-4 mt-2 space-y-2">
                    {publicNavItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="block text-gray-300 hover:text-white transition-colors py-2"
                        onClick={() => {
                          setIsOpen(false);
                          setIsHomeMenuOpen(false);
                        }}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Main navigation items - same for all users */}
              {mainNavItems.map((item) => (
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
                    {/* Current Company - Mobile */}
                    {selectedCompany && (
                      <button
                        onClick={() => {
                          setIsCompanySelectorOpen(true);
                          setIsOpen(false);
                        }}
                        className="flex items-center px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors w-full text-left"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        <div className="flex flex-col items-start flex-1">
                          <span className="text-xs text-gray-400">Current Company</span>
                          <span className="text-sm font-medium">{selectedCompany.name}</span>
                        </div>
                      </button>
                    )}

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

      {/* Company Selector Dialog */}
      <Dialog open={isCompanySelectorOpen} onOpenChange={setIsCompanySelectorOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-sm border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-white">Select Company</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose which company you want to work on
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CompanySelector />
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default Navigation;