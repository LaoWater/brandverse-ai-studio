import React from 'react';
import { Shield } from 'lucide-react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

/**
 * Persistent floating button (bottom-left) to reopen cookie settings
 * after the user has dismissed the banner.
 */
const CookieSettingsButton: React.FC = () => {
  const { hasInteracted, openSettings } = useCookieConsent();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Only show after the user has made a consent choice
  if (!hasInteracted) return null;

  return (
    <button
      onClick={openSettings}
      aria-label="Cookie settings"
      className={cn(
        // Positioning: bottom-left, below ChatButton z-index (999)
        'fixed bottom-6 left-6 z-[998]',
        // Size & shape
        'w-10 h-10 rounded-full',
        'flex items-center justify-center',
        // Interaction
        'transition-all duration-300 hover:scale-110 cursor-pointer',
        // Theme
        isDark
          ? 'bg-[#1A1A2E] border border-[rgba(91,95,238,0.3)] text-gray-400 hover:text-white hover:border-[rgba(91,95,238,0.5)] shadow-[0_2px_12px_rgba(91,95,238,0.15)]'
          : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-[rgba(91,95,238,0.3)] shadow-md',
      )}
    >
      <Shield className="w-4 h-4" />
    </button>
  );
};

export default CookieSettingsButton;
