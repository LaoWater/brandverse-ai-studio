import type { ConsentCategoryInfo } from '@/types/cookieConsent';

/**
 * Static metadata for the 4 consent categories.
 * Used by the CookieConsentSettings panel to render category cards.
 *
 * To activate a future category:
 *   1. Set isImplemented → true
 *   2. Wire up the corresponding script loader in CookieConsentContext
 */
export const CONSENT_CATEGORIES: ConsentCategoryInfo[] = [
  {
    id: 'necessary',
    label: 'Strictly Necessary',
    description:
      'Essential cookies that enable core functionality like authentication, session management, and security. These cannot be disabled.',
    isRequired: true,
    cookies: ['session_id', 'auth_token', 'sidebar:state', 'sb-*-auth-token'],
    isImplemented: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description:
      'Help us understand how visitors interact with our platform by collecting anonymous usage data. This includes Google Analytics and Web Vitals performance metrics.',
    isRequired: false,
    cookies: ['_ga', '_ga_*', '_gid'],
    isImplemented: true,
  },
  {
    id: 'functional',
    label: 'Functional',
    description:
      'Enable enhanced functionality and personalization, such as remembering your theme preference and display settings.',
    isRequired: false,
    cookies: ['brandverse-theme'],
    isImplemented: false,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description:
      'Used to deliver relevant advertisements and measure campaign effectiveness across platforms like Meta, TikTok, and LinkedIn.',
    isRequired: false,
    cookies: ['_fbp', '_ttp', 'li_sugr', 'AnalyticsSyncHistory'],
    isImplemented: false,
  },
];
