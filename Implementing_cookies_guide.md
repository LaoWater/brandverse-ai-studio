# Implementing Cookie Consent in React + Vite Projects

> A practical, copy-adapt-ship guide for the development team.
> Based on our production implementation — zero dependencies, ePrivacy Directive compliant.

---

## Table of Contents

1. [The Problem](#1-the-problem)
2. [Core Principles](#2-core-principles)
3. [Architecture at a Glance](#3-architecture-at-a-glance)
4. [Step-by-Step Implementation](#4-step-by-step-implementation)
   - [4.1 Type Definitions](#41-type-definitions)
   - [4.2 Cookie Persistence Utilities](#42-cookie-persistence-utilities)
   - [4.3 Script Loaders](#43-script-loaders)
   - [4.4 Category Metadata](#44-category-metadata)
   - [4.5 Consent Context](#45-consent-context)
   - [4.6 Banner Component](#46-banner-component)
   - [4.7 Settings Modal](#47-settings-modal)
   - [4.8 Re-Open Settings Button](#48-re-open-settings-button)
   - [4.9 Wiring Into Your App](#49-wiring-into-your-app)
5. [Removing Scripts From index.html](#5-removing-scripts-from-indexhtml)
6. [Adding a New Tracker](#6-adding-a-new-tracker)
7. [Forcing Re-Consent](#7-forcing-re-consent)
8. [Common Patterns & Recipes](#8-common-patterns--recipes)
9. [Testing Checklist](#9-testing-checklist)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. The Problem

The ePrivacy Directive (and GDPR) requires **explicit opt-in consent** before setting any non-essential cookies or running tracking scripts. That means:

- Google Analytics **cannot** be in your `index.html`
- Meta Pixel, TikTok Pixel, LinkedIn tags — same rule
- Marketing, analytics, and functional cookies must be **blocked by default**
- Only strictly necessary cookies (auth, sessions, CSRF) can run without consent

If your `index.html` currently has a `<script async src="https://www.googletagmanager.com/gtag/js?...">` tag, you're non-compliant. This guide fixes that.

---

## 2. Core Principles

These rules apply to every project:

| Principle | What it means |
|---|---|
| **Block first, load later** | No non-essential script executes until the user says yes |
| **Consent is persisted** | Store the user's choice in a first-party cookie (not localStorage — cookies travel to the server if you ever need SSR gating) |
| **Consent is versioned** | Bump a version number to force all users to re-consent (e.g., when you add new trackers) |
| **Consent is revocable** | The user can change their mind at any time via a persistent settings button |
| **Scripts are injectable AND removable** | Every `loadX()` has a matching `removeX()` that cleans up script tags, cookies, and globals |
| **Categories, not individual scripts** | Group trackers into categories (analytics, marketing, functional) — users don't need to know about individual pixels |

---

## 3. Architecture at a Glance

```
src/
├── types/
│   └── cookieConsent.ts          # Types for consent categories, preferences, cookie data
├── utils/
│   ├── cookieUtils.ts            # Read / write / delete the consent cookie
│   └── cookieScripts.ts          # load*() and remove*() for each tracking script
├── lib/
│   └── consentCategories.ts      # Static metadata array for UI rendering
├── contexts/
│   └── CookieConsentContext.tsx   # React Context — the brain of the system
└── components/
    └── cookie-consent/
        ├── index.ts              # Barrel export
        ├── CookieConsentBanner.tsx    # "Accept / Reject / Customize" banner
        ├── CookieConsentSettings.tsx  # Per-category toggle modal
        └── CookieSettingsButton.tsx   # Floating button to reopen settings
```

**Data flow:**

```
User clicks Accept All
  → Context calls persistAndApply()
    → writeConsentCookie() stores JSON in cookie_consent cookie
    → applyScripts() calls loadGoogleAnalytics() (or whichever scripts match)
      → <script> tag dynamically injected into <head>
  → hasInteracted → true → banner hides, settings button appears

Page reload
  → Context useEffect reads cookie_consent cookie
  → If found: applyScripts() re-loads consented scripts, no banner shown
  → If not found (or version mismatch): banner shown, nothing loads
```

---

## 4. Step-by-Step Implementation

### 4.1 Type Definitions

Create `src/types/cookieConsent.ts`:

```typescript
/** Toggleable consent categories (excludes "necessary" — always on) */
export type ConsentCategory = 'analytics' | 'functional' | 'marketing';

/** Boolean map of user preferences for each toggleable category */
export interface ConsentPreferences {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

/** Shape of data persisted in the cookie */
export interface CookieConsentData extends ConsentPreferences {
  timestamp: string;   // ISO 8601
  version: number;     // bump to force re-consent
}

/** Metadata for rendering each category in the settings panel */
export interface ConsentCategoryInfo {
  id: ConsentCategory | 'necessary';
  label: string;
  description: string;
  isRequired: boolean;       // true = always on, toggle disabled
  cookies: string[];         // displayed to user
  isImplemented: boolean;    // false = "Coming soon", toggle disabled
}

/** Context value shape */
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

/** Extend Window for tracker globals (add yours as needed) */
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;    // Meta Pixel
    ttq: Record<string, unknown>;         // TikTok Pixel
  }
}
```

**Adapt for your project:**
- Add or remove categories from `ConsentCategory` and `ConsentPreferences`
- Add Window declarations for any tracker globals you use

---

### 4.2 Cookie Persistence Utilities

Create `src/utils/cookieUtils.ts`:

```typescript
import type { ConsentPreferences, CookieConsentData } from '@/types/cookieConsent';

const COOKIE_NAME = 'cookie_consent';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const CURRENT_VERSION = 1;

/** Read and parse the consent cookie. Returns null if absent, malformed, or wrong version. */
export function readConsentCookie(): CookieConsentData | null {
  try {
    const cookies = document.cookie.split(';');
    const match = cookies
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`));

    if (!match) return null;

    const value = match.substring(COOKIE_NAME.length + 1);
    const data: CookieConsentData = JSON.parse(decodeURIComponent(value));

    // Version mismatch → force re-consent
    if (data.version !== CURRENT_VERSION) return null;

    // Validate fields
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

/** Write consent preferences to a first-party cookie. */
export function writeConsentCookie(preferences: ConsentPreferences): void {
  const data: CookieConsentData = {
    ...preferences,
    timestamp: new Date().toISOString(),
    version: CURRENT_VERSION,
  };
  const value = encodeURIComponent(JSON.stringify(data));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`;
}

/** Delete the consent cookie. */
export function deleteConsentCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
```

**Why a cookie and not localStorage?**
- Cookies are sent with HTTP requests — if you add SSR or server-side analytics gating later, you can read consent server-side
- Cookies have built-in expiry (`max-age`), localStorage doesn't
- `SameSite=Lax` + `Secure` gives you standard web security for free

**Why versioning?**
When `readConsentCookie()` finds a version mismatch, it returns `null`, which makes the context think the user hasn't interacted yet, re-showing the banner. One constant change → all users re-consent.

---

### 4.3 Script Loaders

Create `src/utils/cookieScripts.ts`.

Every tracker follows the same pattern:

```
1. A unique DOM ID constant (to prevent duplicate injection)
2. A load function (creates <script>, initializes globals)
3. A remove function (removes <script>, cleans cookies, deletes globals)
```

**Google Analytics — full working example:**

```typescript
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';  // ← your ID
const GA_SCRIPT_ID = 'ga-gtag-script';

export function loadGoogleAnalytics(): void {
  if (document.getElementById(GA_SCRIPT_ID)) return; // guard

  // Inject gtag.js
  const script = document.createElement('script');
  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialise
  window.dataLayer = window.dataLayer || [];
  function gtag(..._args: any[]) {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
}

export function removeGoogleAnalytics(): void {
  // Remove script
  document.getElementById(GA_SCRIPT_ID)?.remove();

  // Remove GA cookies from all domain variants
  const gaCookies = document.cookie
    .split(';')
    .map((c) => c.trim().split('=')[0])
    .filter((name) => /^(_ga|_gid|_gat)/.test(name));

  const hostname = window.location.hostname;
  for (const name of gaCookies) {
    document.cookie = `${name}=; path=/; domain=${hostname}; max-age=0`;
    document.cookie = `${name}=; path=/; domain=.${hostname}; max-age=0`;
    document.cookie = `${name}=; path=/; max-age=0`;
  }

  // Clean globals
  try {
    delete (window as any).dataLayer;
    delete (window as any).gtag;
  } catch { /* some envs block delete on window */ }
}
```

**Meta Pixel — template:**

```typescript
const META_PIXEL_SCRIPT_ID = 'meta-pixel-script';

export function loadMetaPixel(pixelId: string): void {
  if (document.getElementById(META_PIXEL_SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = META_PIXEL_SCRIPT_ID;
  script.innerHTML = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
    n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
    s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init','${pixelId}');
    fbq('track','PageView');
  `;
  document.head.appendChild(script);
}

export function removeMetaPixel(): void {
  document.getElementById(META_PIXEL_SCRIPT_ID)?.remove();
  // Clean _fbp cookie
  document.cookie = `_fbp=; path=/; max-age=0`;
  document.cookie = `_fbp=; path=/; domain=.${window.location.hostname}; max-age=0`;
  try { delete (window as any).fbq; } catch {}
}
```

**TikTok Pixel — template:**

```typescript
const TIKTOK_PIXEL_SCRIPT_ID = 'tiktok-pixel-script';

export function loadTikTokPixel(pixelId: string): void {
  if (document.getElementById(TIKTOK_PIXEL_SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = TIKTOK_PIXEL_SCRIPT_ID;
  script.innerHTML = `
    !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
    ttq.methods=["page","track","identify","instances","debug","on","off",
    "once","ready","alias","group","enableCookie","disableCookie"];
    ttq.setAndDefer=function(t,e){t[e]=function(){
    t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
    for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
    ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)
    ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){
    var i="https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};
    ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
    var o=document.createElement("script");o.type="text/javascript";
    o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
    var a=document.getElementsByTagName("script")[0];
    a.parentNode.insertBefore(o,a)};
    ttq.load('${pixelId}');ttq.page();}
    (window,document,'ttq');
  `;
  document.head.appendChild(script);
}

export function removeTikTokPixel(): void {
  document.getElementById(TIKTOK_PIXEL_SCRIPT_ID)?.remove();
  document.cookie = `_ttp=; path=/; max-age=0`;
  document.cookie = `_ttp=; path=/; domain=.${window.location.hostname}; max-age=0`;
  try { delete (window as any).ttq; } catch {}
}
```

**LinkedIn Insight Tag — template:**

```typescript
const LINKEDIN_INSIGHT_SCRIPT_ID = 'linkedin-insight-script';

export function loadLinkedInInsight(partnerId: string): void {
  if (document.getElementById(LINKEDIN_INSIGHT_SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = LINKEDIN_INSIGHT_SCRIPT_ID;
  script.innerHTML = `
    _linkedin_partner_id="${partnerId}";
    window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];
    window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    (function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};
    window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];
    var b=document.createElement("script");b.type="text/javascript";
    b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
    s.parentNode.insertBefore(b,s);})(window.lintrk);
  `;
  document.head.appendChild(script);
}

export function removeLinkedInInsight(): void {
  document.getElementById(LINKEDIN_INSIGHT_SCRIPT_ID)?.remove();
  ['li_sugr', 'AnalyticsSyncHistory'].forEach((name) => {
    document.cookie = `${name}=; path=/; max-age=0`;
    document.cookie = `${name}=; path=/; domain=.${window.location.hostname}; max-age=0`;
  });
  try {
    delete (window as any).lintrk;
    delete (window as any)._linkedin_data_partner_ids;
  } catch {}
}
```

---

### 4.4 Category Metadata

Create `src/lib/consentCategories.ts`:

```typescript
import type { ConsentCategoryInfo } from '@/types/cookieConsent';

export const CONSENT_CATEGORIES: ConsentCategoryInfo[] = [
  {
    id: 'necessary',
    label: 'Strictly Necessary',
    description: 'Essential cookies for authentication, session management, and security. Cannot be disabled.',
    isRequired: true,
    cookies: ['session_id', 'auth_token'],       // ← list yours
    isImplemented: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Help us understand how visitors interact with the platform via anonymous usage data.',
    isRequired: false,
    cookies: ['_ga', '_ga_*', '_gid'],
    isImplemented: true,                          // ← flip when ready
  },
  {
    id: 'functional',
    label: 'Functional',
    description: 'Enable personalization such as theme preferences and display settings.',
    isRequired: false,
    cookies: ['theme'],
    isImplemented: false,                         // ← flip when ready
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Used to deliver relevant advertisements and measure campaign effectiveness.',
    isRequired: false,
    cookies: ['_fbp', '_ttp', 'li_sugr'],
    isImplemented: false,                         // ← flip when ready
  },
];
```

**Adapt for your project:** Change descriptions, cookie names, and `isImplemented` flags.

---

### 4.5 Consent Context

Create `src/contexts/CookieConsentContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { readConsentCookie, writeConsentCookie } from '@/utils/cookieUtils';
import { loadGoogleAnalytics, removeGoogleAnalytics } from '@/utils/cookieScripts';
import type { ConsentPreferences, ConsentCategory, CookieConsentContextType } from '@/types/cookieConsent';

const DEFAULT_PREFERENCES: ConsentPreferences = {
  analytics: false,
  functional: false,
  marketing: false,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consentState, setConsentState] = useState<ConsentPreferences>(DEFAULT_PREFERENCES);
  const [hasInteracted, setHasInteracted] = useState(true);   // true = no flash on mount
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ── The single dispatch point ──
  // Map each category to its script loaders here.
  // Adding a tracker = adding one if/else block.
  const applyScripts = useCallback((prefs: ConsentPreferences) => {
    // Analytics
    if (prefs.analytics) loadGoogleAnalytics();
    else removeGoogleAnalytics();

    // Marketing (uncomment when ready)
    // if (prefs.marketing) {
    //   loadMetaPixel('YOUR_PIXEL_ID');
    //   loadTikTokPixel('YOUR_PIXEL_ID');
    //   loadLinkedInInsight('YOUR_PARTNER_ID');
    // } else {
    //   removeMetaPixel();
    //   removeTikTokPixel();
    //   removeLinkedInInsight();
    // }

    // Functional (uncomment when ready)
    // if (prefs.functional) { ... } else { ... }
  }, []);

  const persistAndApply = useCallback((prefs: ConsentPreferences) => {
    setConsentState(prefs);
    setHasInteracted(true);
    writeConsentCookie(prefs);
    applyScripts(prefs);
  }, [applyScripts]);

  // On mount: restore consent
  useEffect(() => {
    const stored = readConsentCookie();
    if (stored) {
      const prefs: ConsentPreferences = {
        analytics: stored.analytics,
        functional: stored.functional,
        marketing: stored.marketing,
      };
      setConsentState(prefs);
      setHasInteracted(true);
      applyScripts(prefs);
    } else {
      setHasInteracted(false);
    }
  }, [applyScripts]);

  const acceptAll = useCallback(() => {
    persistAndApply({ analytics: true, functional: true, marketing: true });
  }, [persistAndApply]);

  const rejectAll = useCallback(() => {
    persistAndApply({ analytics: false, functional: false, marketing: false });
  }, [persistAndApply]);

  // Local-only toggle (does NOT persist — user must click Save)
  const updateConsent = useCallback((category: ConsentCategory, value: boolean) => {
    setConsentState((prev) => ({ ...prev, [category]: value }));
  }, []);

  const savePreferences = useCallback((prefs: ConsentPreferences) => {
    persistAndApply(prefs);
    setIsSettingsOpen(false);
  }, [persistAndApply]);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  return (
    <CookieConsentContext.Provider value={{
      consentState, hasInteracted, isSettingsOpen,
      acceptAll, rejectAll, updateConsent, savePreferences, openSettings, closeSettings,
    }}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
};
```

**Why `hasInteracted` defaults to `true`?**
Prevents a flash-of-banner on mount. The `useEffect` runs synchronously after the first render — `readConsentCookie()` reads `document.cookie` (synchronous), so the state update happens before paint. If no cookie exists, `hasInteracted` flips to `false` and the banner appears with no visible flash.

---

### 4.6 Banner Component

Create `src/components/cookie-consent/CookieConsentBanner.tsx`.

This is the first thing users see. It must:
- Be fixed to the bottom of the viewport
- Have the **highest z-index** of any floating UI (above chat buttons, FABs, etc.)
- Provide three actions: **Accept All**, **Reject All**, **Customize**
- Link to your Cookie Policy page
- Animate in (slide up)
- Disappear immediately once the user makes a choice

```typescript
import React from 'react';
import { Link } from 'react-router-dom';      // or <a> if not using react-router
import { Shield } from 'lucide-react';          // or any icon
import { Button } from '@/components/ui/button'; // your button component
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { cn } from '@/lib/utils';

const CookieConsentBanner: React.FC = () => {
  const { hasInteracted, acceptAll, rejectAll, openSettings } = useCookieConsent();

  if (hasInteracted) return null;

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-[1100]',  // above ALL other floating UI
      'p-4 md:p-6',
      'animate-[slide-up-banner_0.4s_ease-out]',
    )}>
      <div className="max-w-4xl mx-auto rounded-xl border backdrop-blur-xl bg-white/95 dark:bg-gray-950/95 border-gray-200 dark:border-gray-800 shadow-lg p-5 md:p-6">

        {/* Message */}
        <div className="flex items-start gap-3 mb-4">
          <Shield className="w-5 h-5 mt-0.5 text-blue-500 flex-shrink-0" />
          <div>
            <h3 className="text-base font-semibold mb-1">Cookie Preferences</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              We use cookies to enhance your experience and analyze usage.{' '}
              <Link to="/cookies" className="underline underline-offset-2 hover:opacity-80">
                Cookie Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Actions — mobile: stacked, desktop: row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end">
          <Button variant="ghost"   onClick={openSettings} className="order-3 sm:order-1">Customize</Button>
          <Button variant="outline" onClick={rejectAll}     className="order-2">Reject All</Button>
          <Button                   onClick={acceptAll}     className="order-1 sm:order-3">Accept All</Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
```

**Add this keyframe to your CSS** (e.g., `index.css` or `globals.css`):

```css
@keyframes slide-up-banner {
  from { opacity: 0; transform: translateY(100%); }
  to   { opacity: 1; transform: translateY(0);    }
}
```

**Adapt for your project:** Replace the styling with your design system. The structure (fixed bottom, z-index, three buttons, animation, conditional render) stays the same.

---

### 4.7 Settings Modal

Create `src/components/cookie-consent/CookieConsentSettings.tsx`.

Key design decisions:
- **Local state for toggles** — the user can flip switches without instantly loading/removing scripts. Only "Save Preferences" persists and applies.
- **Disabled toggles** for `isRequired: true` (necessary cookies) and `isImplemented: false` (coming soon categories)
- Bottom sheet on mobile, centered modal on desktop

```typescript
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';          // or any toggle
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { CONSENT_CATEGORIES } from '@/lib/consentCategories';
import type { ConsentPreferences, ConsentCategory } from '@/types/cookieConsent';

const CookieConsentSettings: React.FC = () => {
  const { consentState, isSettingsOpen, closeSettings, savePreferences, acceptAll, rejectAll } = useCookieConsent();
  const [local, setLocal] = useState<ConsentPreferences>(consentState);

  // Sync when panel opens
  useEffect(() => {
    if (isSettingsOpen) setLocal(consentState);
  }, [isSettingsOpen, consentState]);

  if (!isSettingsOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1200]" onClick={closeSettings} />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cookie settings"
        className="fixed z-[1201] overflow-y-auto
          bottom-0 left-0 right-0 max-h-[85vh]
          md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:max-w-lg md:w-full md:max-h-[80vh]
          rounded-t-2xl md:rounded-2xl
          bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b bg-white dark:bg-gray-950 rounded-t-2xl">
          <h2 className="text-lg font-bold">Cookie Settings</h2>
          <button onClick={closeSettings} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="p-5 space-y-4">
          {CONSENT_CATEGORIES.map((cat) => {
            const isChecked = cat.isRequired ? true : local[cat.id as ConsentCategory] ?? false;

            return (
              <div key={cat.id} className="rounded-xl p-4 border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold">{cat.label}</span>
                      {cat.isRequired && (
                        <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                          Always on
                        </span>
                      )}
                      {!cat.isImplemented && !cat.isRequired && (
                        <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{cat.description}</p>
                  </div>
                  <Switch
                    checked={isChecked}
                    onCheckedChange={(v) => !cat.isRequired && setLocal((p) => ({ ...p, [cat.id]: v }))}
                    disabled={cat.isRequired || !cat.isImplemented}
                    aria-label={`Toggle ${cat.label}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-5 border-t bg-white dark:bg-gray-950">
          <Button variant="ghost"   onClick={() => { rejectAll(); closeSettings(); }}>Reject All</Button>
          <div className="flex-1 hidden sm:block" />
          <Button variant="outline" onClick={() => { acceptAll(); closeSettings(); }}>Accept All</Button>
          <Button                   onClick={() => savePreferences(local)}>Save Preferences</Button>
        </div>
      </div>
    </>
  );
};

export default CookieConsentSettings;
```

---

### 4.8 Re-Open Settings Button

Create `src/components/cookie-consent/CookieSettingsButton.tsx`:

```typescript
import React from 'react';
import { Shield } from 'lucide-react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

const CookieSettingsButton: React.FC = () => {
  const { hasInteracted, openSettings } = useCookieConsent();

  if (!hasInteracted) return null;

  return (
    <button
      onClick={openSettings}
      aria-label="Cookie settings"
      className="fixed bottom-6 left-6 z-[998] w-10 h-10 rounded-full flex items-center justify-center
        bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
        text-gray-500 hover:text-gray-900 dark:hover:text-white
        shadow-md transition-all duration-300 hover:scale-110 cursor-pointer"
    >
      <Shield className="w-4 h-4" />
    </button>
  );
};

export default CookieSettingsButton;
```

**Positioning:** Bottom-left so it doesn't collide with chat widgets (usually bottom-right). Adjust `z-index` relative to your app's floating elements.

---

Create the barrel export `src/components/cookie-consent/index.ts`:

```typescript
export { default as CookieConsentBanner } from './CookieConsentBanner';
export { default as CookieConsentSettings } from './CookieConsentSettings';
export { default as CookieSettingsButton } from './CookieSettingsButton';
```

---

### 4.9 Wiring Into Your App

In `App.tsx` (or your root layout):

```tsx
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import { CookieConsentBanner, CookieConsentSettings, CookieSettingsButton } from '@/components/cookie-consent';

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* CookieConsentProvider goes INSIDE your ThemeProvider (if you have one)
        so consent UI components can access theme, and OUTSIDE AuthProvider
        since consent doesn't depend on auth. */}
    <ThemeProvider>
      <CookieConsentProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Routes>{/* ... */}</Routes>
              <CookieSettingsButton />   {/* floating, inside layout */}
            </div>
            <CookieConsentBanner />      {/* fixed overlay, outside layout */}
            <CookieConsentSettings />    {/* modal overlay, outside layout */}
          </BrowserRouter>
        </AuthProvider>
      </CookieConsentProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
```

**Context placement rule:** `CookieConsentProvider` needs to wrap `BrowserRouter` (because the banner uses `<Link>`). It needs to be inside `ThemeProvider` (for theme-aware styling). It does NOT need Auth/User context.

---

## 5. Removing Scripts From index.html

**This is the most critical step.** Any tracking script in `index.html` fires before React mounts, which means before consent can be checked.

**Before (non-compliant):**
```html
<head>
  <!-- This fires IMMEDIATELY — before any consent check -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXX');
  </script>
</head>
```

**After (compliant):**
```html
<head>
  <!-- Google Analytics is loaded dynamically via CookieConsentContext after user consent -->
</head>
```

The script is now injected by `loadGoogleAnalytics()` inside React, which only runs after the user clicks Accept All (or has a stored consent cookie with `analytics: true`).

Also remove any related `<link rel="preconnect">` tags for tracker domains (e.g., `www.googletagmanager.com`). These hints aren't needed when the script is loaded dynamically.

---

## 6. Adding a New Tracker

Three files, three changes. That's it.

**Example: Adding Hotjar**

**Step 1 — `src/utils/cookieScripts.ts`** (add load/remove pair):

```typescript
const HOTJAR_SCRIPT_ID = 'hotjar-script';

export function loadHotjar(siteId: string): void {
  if (document.getElementById(HOTJAR_SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = HOTJAR_SCRIPT_ID;
  script.innerHTML = `
    (function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:${siteId},hjsv:6};a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j;
    a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=6');
  `;
  document.head.appendChild(script);
}

export function removeHotjar(): void {
  document.getElementById(HOTJAR_SCRIPT_ID)?.remove();
  // Hotjar uses _hj* cookies
  document.cookie.split(';')
    .map(c => c.trim().split('=')[0])
    .filter(n => n.startsWith('_hj'))
    .forEach(name => {
      document.cookie = `${name}=; path=/; max-age=0`;
      document.cookie = `${name}=; path=/; domain=.${window.location.hostname}; max-age=0`;
    });
  try { delete (window as any).hj; } catch {}
}
```

**Step 2 — `src/contexts/CookieConsentContext.tsx`** (add to `applyScripts`):

```typescript
// Inside applyScripts:
if (prefs.analytics) {
  loadGoogleAnalytics();
  loadHotjar('YOUR_SITE_ID');    // ← add
} else {
  removeGoogleAnalytics();
  removeHotjar();                 // ← add
}
```

**Step 3 — `src/lib/consentCategories.ts`** (update cookie list):

```typescript
{
  id: 'analytics',
  cookies: ['_ga', '_ga_*', '_gid', '_hj*'],   // ← add Hotjar cookies
  // ...
}
```

Done. No UI changes needed — the existing toggle for "Analytics" now controls Hotjar too.

If it belongs in a **different category** (e.g., a new "Personalization" category), you'd also add a new entry to `ConsentCategory`, `ConsentPreferences`, and `CONSENT_CATEGORIES`.

---

## 7. Forcing Re-Consent

When you add new trackers or change categories, you want all existing users to re-consent.

Open `src/utils/cookieUtils.ts` and change one number:

```typescript
const CURRENT_VERSION = 2;  // was 1
```

Every user whose stored cookie has `version: 1` will see the banner again on their next visit. Their old consent is silently discarded.

---

## 8. Common Patterns & Recipes

### Accessing consent state from any component

```typescript
import { useCookieConsent } from '@/contexts/CookieConsentContext';

function MyComponent() {
  const { consentState } = useCookieConsent();

  if (consentState.analytics) {
    // Safe to use GA-specific features (e.g., send custom events)
    window.gtag?.('event', 'button_click', { label: 'signup' });
  }
}
```

### Opening settings from your Cookie Policy page

```typescript
import { useCookieConsent } from '@/contexts/CookieConsentContext';

function CookiePolicyPage() {
  const { openSettings } = useCookieConsent();

  return (
    <article>
      <h2>Manage Your Preferences</h2>
      <p>You can change your cookie preferences at any time.</p>
      <button onClick={openSettings}>
        Manage Cookie Preferences
      </button>
    </article>
  );
}
```

### Opening settings from footer links

```typescript
<footer>
  <button onClick={openSettings}>Cookie Settings</button>
</footer>
```

### Sending GA events only when consented

```typescript
function trackEvent(name: string, params?: Record<string, unknown>) {
  // window.gtag only exists if analytics consent was given
  window.gtag?.('event', name, params);
}
```

---

## 9. Testing Checklist

Run through these scenarios before shipping:

| # | Scenario | Expected Result |
|---|---|---|
| 1 | **Fresh visit** (clear cookies first) | Banner slides up. Open DevTools Network tab — no GA requests. No `_ga` cookies. |
| 2 | **Click "Accept All"** | Banner disappears. GA script appears in `<head>`. `_ga` cookie set. `cookie_consent` cookie set with `analytics: true`. |
| 3 | **Reload page** | No banner. GA loads automatically. Settings button visible (bottom-left). |
| 4 | **Click settings button → toggle Analytics off → Save** | GA script removed from DOM. `_ga` cookies cleaned. `cookie_consent` updated with `analytics: false`. |
| 5 | **Click "Reject All"** from banner | No scripts load. `cookie_consent` set with all `false`. |
| 6 | **Click "Customize"** from banner | Settings panel opens with all categories visible. Necessary = locked on. Unimplemented = disabled + "Coming soon". |
| 7 | **Dark/Light mode** | Banner, settings panel, and settings button all adapt correctly. |
| 8 | **Mobile viewport** | Banner buttons stack vertically. Settings panel is a bottom sheet (not centered modal). |
| 9 | **Cookie Policy page** | "Manage Cookie Preferences" button opens the settings modal. |
| 10 | **Version bump** | Change `CURRENT_VERSION` to 2, reload. Banner reappears even though a consent cookie exists. |

**DevTools tips:**
- **Application tab → Cookies** — verify `cookie_consent` content, check `_ga` appears/disappears
- **Network tab** — filter by `google` to confirm GA requests only fire after consent
- **Elements tab → `<head>`** — confirm the `<script id="ga-gtag-script">` tag appears/disappears dynamically

---

## 10. Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Banner flashes on load | `hasInteracted` initialized to `false` | Set initial state to `true`, let `useEffect` flip to `false` |
| GA still fires on first load | Script tag still in `index.html` | Remove ALL GA/tracking scripts from `index.html` |
| GA cookies not cleaning | Domain mismatch when deleting | Try both `hostname` and `.hostname` variants, plus without domain |
| Banner appears on every reload | Cookie parse error or version mismatch | Check `readConsentCookie()` — use `try/catch`, validate fields |
| Settings modal behind other UI | z-index collision | Banner: `1100`, backdrop: `1200`, modal: `1201` — adjust if your app has higher values |
| TypeScript errors on `window.gtag` | Missing global declaration | Add `declare global { interface Window { ... } }` in your types file |
| CSP blocking dynamic scripts | Content Security Policy too strict | Add tracker domains to `script-src` in your CSP header |

---

## Quick Reference Card

```
ADD A TRACKER           → cookieScripts.ts (load/remove) + Context (applyScripts) + categories.ts (cookie list)
ENABLE A CATEGORY       → consentCategories.ts: isImplemented → true
FORCE RE-CONSENT        → cookieUtils.ts: CURRENT_VERSION++
READ CONSENT ANYWHERE   → const { consentState } = useCookieConsent()
OPEN SETTINGS FROM CODE → const { openSettings } = useCookieConsent()
```
