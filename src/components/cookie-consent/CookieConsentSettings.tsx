import React, { useState, useEffect } from 'react';
import { X, Lock, BarChart3, Settings2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CONSENT_CATEGORIES } from '@/lib/consentCategories';
import { cn } from '@/lib/utils';
import type { ConsentPreferences, ConsentCategory } from '@/types/cookieConsent';

// Map category IDs to icons
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  necessary: Lock,
  analytics: BarChart3,
  functional: Settings2,
  marketing: Megaphone,
};

/**
 * Modal / bottom-sheet panel showing per-category cookie toggles.
 * Local state is used for toggles — nothing persists until "Save Preferences".
 */
const CookieConsentSettings: React.FC = () => {
  const {
    consentState,
    isSettingsOpen,
    closeSettings,
    savePreferences,
    acceptAll,
    rejectAll,
  } = useCookieConsent();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Local toggle state (not persisted until Save)
  const [localPreferences, setLocalPreferences] = useState<ConsentPreferences>(consentState);

  // Re-sync local state when the panel opens or external state changes
  useEffect(() => {
    if (isSettingsOpen) {
      setLocalPreferences(consentState);
    }
  }, [isSettingsOpen, consentState]);

  if (!isSettingsOpen) return null;

  const handleToggle = (category: ConsentCategory, checked: boolean) => {
    setLocalPreferences((prev) => ({ ...prev, [category]: checked }));
  };

  const handleSave = () => {
    savePreferences(localPreferences);
  };

  const handleAcceptAll = () => {
    acceptAll();
    closeSettings();
  };

  const handleRejectAll = () => {
    rejectAll();
    closeSettings();
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1200] animate-[fade-in_0.3s_ease-out]"
        onClick={closeSettings}
        aria-hidden="true"
      />

      {/* Settings panel */}
      <div
        role="dialog"
        aria-label="Cookie settings"
        aria-modal="true"
        className={cn(
          'fixed z-[1201] overflow-y-auto',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 max-h-[85vh]',
          // Desktop: centered modal
          'md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
          'md:max-w-lg md:w-full md:max-h-[80vh]',
          // Shape & animation
          'rounded-t-2xl md:rounded-2xl',
          'animate-[slide-up-banner_0.3s_ease-out]',
          // Theme
          isDark
            ? 'bg-[#0F0F17] border border-[rgba(91,95,238,0.25)] shadow-[0_0_60px_rgba(91,95,238,0.15)]'
            : 'bg-white border border-[rgba(91,95,238,0.15)] shadow-[0_0_40px_rgba(91,95,238,0.08)]',
        )}
      >
        {/* ── Header ── */}
        <div
          className={cn(
            'sticky top-0 z-10 flex items-center justify-between p-5 border-b rounded-t-2xl md:rounded-t-2xl',
            isDark ? 'border-white/10 bg-[#0F0F17]' : 'border-gray-200 bg-white',
          )}
        >
          <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Cookie Settings
          </h2>
          <button
            onClick={closeSettings}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500',
            )}
            aria-label="Close cookie settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Category list ── */}
        <div className="p-5 space-y-4">
          {CONSENT_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id] || Settings2;
            const isChecked = category.isRequired
              ? true
              : localPreferences[category.id as ConsentCategory] ?? false;

            return (
              <div
                key={category.id}
                className={cn(
                  'rounded-xl p-4 border transition-colors duration-200',
                  isDark
                    ? 'bg-white/[0.03] border-white/10 hover:border-[rgba(91,95,238,0.3)]'
                    : 'bg-gray-50 border-gray-200 hover:border-[rgba(91,95,238,0.3)]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Icon + text */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5',
                        category.isRequired
                          ? 'bg-green-500/20 text-green-400'
                          : isChecked
                            ? 'bg-gradient-to-br from-[#5B5FEE]/20 to-[#00D4FF]/20 text-[#5B5FEE]'
                            : isDark
                              ? 'bg-white/5 text-gray-500'
                              : 'bg-gray-200 text-gray-400',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            isDark ? 'text-white' : 'text-gray-900',
                          )}
                        >
                          {category.label}
                        </span>

                        {category.isRequired && (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                            Always on
                          </span>
                        )}

                        {!category.isImplemented && !category.isRequired && (
                          <span
                            className={cn(
                              'text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full',
                              isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500',
                            )}
                          >
                            Coming soon
                          </span>
                        )}
                      </div>

                      <p
                        className={cn(
                          'text-xs leading-relaxed',
                          isDark ? 'text-gray-400' : 'text-gray-500',
                        )}
                      >
                        {category.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <Switch
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (!category.isRequired) {
                        handleToggle(category.id as ConsentCategory, checked);
                      }
                    }}
                    disabled={category.isRequired || !category.isImplemented}
                    className="flex-shrink-0 mt-1"
                    aria-label={`Toggle ${category.label} cookies`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer actions ── */}
        <div
          className={cn(
            'sticky bottom-0 z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-5 border-t',
            isDark ? 'border-white/10 bg-[#0F0F17]' : 'border-gray-200 bg-white',
          )}
        >
          <Button
            variant="ghost"
            onClick={handleRejectAll}
            className={cn(
              'text-sm',
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900',
            )}
          >
            Reject All
          </Button>

          <div className="flex-1 hidden sm:block" />

          <Button
            variant="outline"
            onClick={handleAcceptAll}
            className={cn(
              'text-sm',
              isDark
                ? 'border-white/20 text-gray-300 hover:bg-white/5'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50',
            )}
          >
            Accept All
          </Button>

          <Button onClick={handleSave} className="cosmic-button text-sm">
            Save Preferences
          </Button>
        </div>
      </div>
    </>
  );
};

export default CookieConsentSettings;
