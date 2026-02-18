// ============================================
// Cookie Consent Type Definitions
// ============================================

/** Toggleable consent categories (excludes "necessary" which is always on) */
export type ConsentCategory = 'analytics' | 'functional' | 'marketing';

/** Boolean map of user preferences for each toggleable category */
export interface ConsentPreferences {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

/** Shape of data persisted in the cookie_consent cookie */
export interface CookieConsentData extends ConsentPreferences {
  timestamp: string;  // ISO 8601 date string
  version: number;    // schema version — bump to force re-consent
}

/** Metadata for rendering each category in the settings panel */
export interface ConsentCategoryInfo {
  id: ConsentCategory | 'necessary';
  label: string;
  description: string;
  isRequired: boolean;       // true only for 'necessary'
  cookies: string[];         // cookie names shown to the user
  isImplemented: boolean;    // false = "Coming soon" badge, toggle disabled
}

/** Shape of the CookieConsent context value */
export interface CookieConsentContextType {
  consentState: ConsentPreferences;
  hasInteracted: boolean;
  isSettingsOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  updateConsent: (category: ConsentCategory, value: boolean) => void;
  savePreferences: (preferences: ConsentPreferences) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

// ============================================
// Window interface extension for GA globals
// ============================================
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}
