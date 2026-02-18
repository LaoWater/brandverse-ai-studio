import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

/**
 * Bottom-anchored cookie consent banner.
 * Shown only on first visit (before user has interacted with consent).
 * Provides Accept All / Reject All / Customize actions.
 */
const CookieConsentBanner: React.FC = () => {
  const { hasInteracted, acceptAll, rejectAll, openSettings } = useCookieConsent();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Don't render once the user has made a choice
  if (hasInteracted) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[1100]',
        'p-4 md:p-6',
        'animate-[slide-up-banner_0.4s_ease-out]',
      )}
    >
      <div
        className={cn(
          'max-w-4xl mx-auto rounded-xl border backdrop-blur-xl',
          'p-5 md:p-6',
          isDark
            ? 'bg-[rgba(10,10,15,0.95)] border-[rgba(91,95,238,0.3)] shadow-[0_-4px_30px_rgba(91,95,238,0.15),0_0_40px_rgba(0,212,255,0.08)]'
            : 'bg-[rgba(255,255,255,0.97)] border-[rgba(91,95,238,0.2)] shadow-[0_-4px_30px_rgba(91,95,238,0.1),0_0_20px_rgba(0,212,255,0.05)]',
        )}
      >
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#5B5FEE] to-[#00D4FF] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3
              className={cn(
                'text-base font-semibold mb-1',
                isDark ? 'text-white' : 'text-gray-900',
              )}
            >
              Cookie Preferences
            </h3>
            <p
              className={cn(
                'text-sm leading-relaxed',
                isDark ? 'text-gray-300' : 'text-gray-600',
              )}
            >
              We use cookies to enhance your experience and analyze platform usage.
              You can customize your preferences or accept/reject all non-essential cookies.{' '}
              <Link
                to="/cookies"
                className="text-[#5B5FEE] underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Cookie Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end">
          <Button
            variant="ghost"
            onClick={openSettings}
            className={cn(
              'order-3 sm:order-1',
              isDark
                ? 'text-gray-300 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5'
                : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 hover:bg-gray-50',
            )}
          >
            Customize
          </Button>
          <Button
            variant="outline"
            onClick={rejectAll}
            className={cn(
              'order-2',
              isDark
                ? 'border-white/20 text-gray-300 hover:bg-white/5 hover:text-white'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100',
            )}
          >
            Reject All
          </Button>
          <Button
            onClick={acceptAll}
            className="cosmic-button order-1 sm:order-3"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
