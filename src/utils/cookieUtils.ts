import type { ConsentPreferences, CookieConsentData } from '@/types/cookieConsent';

// ============================================
// Cookie Consent Persistence Utilities
// ============================================

const COOKIE_NAME = 'cookie_consent';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds
const CURRENT_VERSION = 1;

/**
 * Read and parse the cookie_consent cookie.
 * Returns null if the cookie doesn't exist, is malformed,
 * or has an outdated version (which forces re-consent).
 */
export function readConsentCookie(): CookieConsentData | null {
  try {
    const cookies = document.cookie.split(';');
    const consentCookie = cookies
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`));

    if (!consentCookie) return null;

    const value = consentCookie.substring(COOKIE_NAME.length + 1);
    const data: CookieConsentData = JSON.parse(decodeURIComponent(value));

    // Version mismatch → treat as no consent (re-prompts user)
    if (data.version !== CURRENT_VERSION) return null;

    // Validate required fields exist
    if (
      typeof data.analytics !== 'boolean' ||
      typeof data.functional !== 'boolean' ||
      typeof data.marketing !== 'boolean'
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Write consent preferences to a first-party cookie.
 * Uses Secure + SameSite=Lax for standard security.
 */
export function writeConsentCookie(preferences: ConsentPreferences): void {
  const data: CookieConsentData = {
    ...preferences,
    timestamp: new Date().toISOString(),
    version: CURRENT_VERSION,
  };

  const value = encodeURIComponent(JSON.stringify(data));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`;
}

/**
 * Delete the consent cookie (useful for testing/debugging).
 */
export function deleteConsentCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
