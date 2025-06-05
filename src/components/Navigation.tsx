
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = user ? [
    { name: "Dashboard", href: "/" },
    { name: "Content Generator", href: "/content-generator" },
    { name: "Settings", href: "/settings" },
  ] : [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-primary" />
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
                <span className="text-white text-sm">Welcome, {user.email}</span>
                <button 
                  onClick={handleSignOut}
                  className="px-4 py-2 border border-white/20 text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  Sign Out
                </button>
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
          <div className="md:hidden py-4 border-t border-white/10">
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
                <div className="pt-4 border-t border-white/10">
                  <p className="text-white text-sm mb-2">Welcome, {user.email}</p>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="px-4 py-2 border border-white/20 text-white hover:bg-white/10 rounded-md transition-colors w-full"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-white/10">
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
