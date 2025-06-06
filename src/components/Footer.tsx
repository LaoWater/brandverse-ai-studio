
import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-black/30 backdrop-blur-lg border-t border-primary/10 py-12 mt-auto">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Creators Multiverse</h3>
            <p className="text-gray-300 max-w-xs">
              Empowering creators to build their digital presence with AI-powered tools.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-accent transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-accent transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-accent transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-accent transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-accent transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/features" className="text-gray-300 hover:text-accent transition-colors">Features</Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-300 hover:text-accent transition-colors">Pricing</Link>
              </li>
              <li>
                <Link to="/settings" className="text-gray-300 hover:text-accent transition-colors">Settings</Link>
              </li>
            </ul>
          </div>
          
          {/* Taglines */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-accent">Your Quiet Edge</h4>
              <p className="text-gray-300 text-sm">
                Work smarter, not harder with our AI tools
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-accent">Unleash Your Creativity</h4>
              <p className="text-gray-300 text-sm">
                Let AI handle the routine, you focus on creation
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-accent">Free Your Time and Grow Your Business</h4>
              <p className="text-gray-300 text-sm">
                Scale your content creation without scaling your team
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-primary/10 flex flex-col md:flex-row md:items-center md:justify-between text-gray-400 text-sm">
          <p>&copy; {currentYear} Creators Multiverse. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Created & Maintained by Free2Play</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
