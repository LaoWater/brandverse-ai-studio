import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { readConsentCookie, writeConsentCookie } from '@/utils/cookieUtils';
import { loadGoogleAnalytics, removeGoogleAnalytics } from '@/utils/cookieScripts';
import type {
  ConsentPreferences,
  ConsentCategory,
  CookieConsentContextType,
} from '@/types/cookieConsent';

// ============================================
// Cookie Consent Context
// ============================================

const DEFAULT_PREFERENCES: ConsentPreferences = {
  analytics: false,
  functional: false,
  marketing: false,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default hasInteracted to true to prevent the banner from flashing
  // on mount. The useEffect below sets it to false if no cookie is found.
  const [consentState, setConsentState] = useState<ConsentPreferences>(DEFAULT_PREFERENCES);
  const [hasInteracted, setHasInteracted] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  /**
   * Load or remove tracking scripts based on current consent.
   * This is the single dispatch point — adding a new category
   * means adding one if/else block here.
   */
  const applyScripts = useCallback((preferences: ConsentPreferences) => {
    // ── Analytics (ACTIVE) ──
    if (preferences.analytics) {
      loadGoogleAnalytics();
    } else {
      removeGoogleAnalytics();
    }

    // ── Functional (BLUEPRINT) ──
    // if (preferences.functional) { loadFunctionalScripts(); }
    // else { removeFunctionalScripts(); }

    // ── Marketing (BLUEPRINT) ──
    // if (preferences.marketing) {
    //   loadMetaPixel('YOUR_PIXEL_ID');
    //   loadTikTokPixel('YOUR_PIXEL_ID');
    //   loadLinkedInInsight('YOUR_PARTNER_ID');
    // } else {
    //   removeMetaPixel();
    //   removeTikTokPixel();
    //   removeLinkedInInsight();
    // }
  }, []);

  /**
   * Persist preferences, update state, and apply script changes.
   */
  const persistAndApply = useCallback(
    (preferences: ConsentPreferences) => {
      setConsentState(preferences);
      setHasInteracted(true);
      writeConsentCookie(preferences);
      applyScripts(preferences);
    },
    [applyScripts],
  );

  // ── On mount: read existing consent ──
  useEffect(() => {
    const stored = readConsentCookie();
    if (stored) {
      const preferences: ConsentPreferences = {
        analytics: stored.analytics,
        functional: stored.functional,
        marketing: stored.marketing,
      };
      setConsentState(preferences);
      setHasInteracted(true);
      applyScripts(preferences);
    } else {
      // No valid consent cookie → show the banner
      setHasInteracted(false);
    }
  }, [applyScripts]);

  // ── Public actions ──

  const acceptAll = useCallback(() => {
    persistAndApply({ analytics: true, functional: true, marketing: true });
  }, [persistAndApply]);

  const rejectAll = useCallback(() => {
    persistAndApply({ analytics: false, functional: false, marketing: false });
  }, [persistAndApply]);

  /** Update a single category in local state (does NOT persist until savePreferences). */
  const updateConsent = useCallback((category: ConsentCategory, value: boolean) => {
    setConsentState((prev) => ({ ...prev, [category]: value }));
  }, []);

  /** Persist the given preferences and close the settings panel. */
  const savePreferences = useCallback(
    (preferences: ConsentPreferences) => {
      persistAndApply(preferences);
      setIsSettingsOpen(false);
    },
    [persistAndApply],
  );

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  return (
    <CookieConsentContext.Provider
      value={{
        consentState,
        hasInteracted,
        isSettingsOpen,
        acceptAll,
        rejectAll,
        updateConsent,
        savePreferences,
        openSettings,
        closeSettings,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

/**
 * Hook to access cookie consent state and actions.
 * Must be used within a <CookieConsentProvider>.
 */
export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
