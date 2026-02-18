# Cookie Consent System

> ePrivacy Directive compliant consent management for BrandVerse AI Studio.
> No non-essential cookies are set until the user explicitly opts in.

---

## How It Works

1. **First visit** — a consent banner slides up from the bottom of the page.
2. The user chooses **Accept All**, **Reject All**, or **Customize**.
3. Their choice is stored in a `cookie_consent` cookie (1-year expiry, versioned).
4. On subsequent visits the stored preference is read on mount — scripts load (or don't) automatically, and no banner is shown.
5. A small shield button (bottom-left corner) lets the user reopen settings at any time.
6. The Cookie Policy page (`/cookies`) also has a **Manage Cookie Preferences** button.

**Key compliance point:** Google Analytics and Web Vitals were removed from `index.html`. They are now injected dynamically by React *only after* the user grants analytics consent.

---

## Architecture

```
src/
├── types/
│   └── cookieConsent.ts          # Shared types + Window interface for GA globals
├── utils/
│   ├── cookieUtils.ts            # Read / write / delete the consent cookie
│   └── cookieScripts.ts          # Dynamic script injection & removal (GA + blueprints)
├── lib/
│   └── consentCategories.ts      # Static metadata for the 4 consent categories
├── contexts/
│   └── CookieConsentContext.tsx   # React Context — state, persistence, script orchestration
└── components/
    └── cookie-consent/
        ├── index.ts                  # Barrel export
        ├── CookieConsentBanner.tsx    # Bottom banner (Accept / Reject / Customize)
        ├── CookieConsentSettings.tsx  # Modal with per-category toggles
        └── CookieSettingsButton.tsx   # Persistent floating button to reopen settings
```

### Context Hierarchy (in App.tsx)

```
ThemeProvider
  └── CookieConsentProvider        ← needs theme for styling
        └── AuthProvider
              └── CompanyProvider
                    └── MediaStudioProvider
                          └── BrowserRouter
                                ├── CookieConsentBanner   (fixed overlay, outside flex layout)
                                ├── CookieConsentSettings (modal overlay, outside flex layout)
                                └── CookieSettingsButton  (inside flex layout, alongside ChatButton)
```

---

## Consent Categories

| Category | Status | Toggle | Cookies | Notes |
|---|---|---|---|---|
| **Strictly Necessary** | Active | Always on (disabled) | `session_id`, `auth_token`, `sidebar:state`, `sb-*-auth-token` | Cannot be turned off |
| **Analytics** | Active | User-controlled | `_ga`, `_ga_*`, `_gid` | Google Analytics + Web Vitals |
| **Functional** | Blueprint | Disabled ("Coming soon") | `brandverse-theme` | Ready to wire up |
| **Marketing** | Blueprint | Disabled ("Coming soon") | `_fbp`, `_ttp`, `li_sugr`, `AnalyticsSyncHistory` | Ready to wire up |

---

## Cookie Storage Format

The user's choice is stored in a first-party cookie named `cookie_consent`:

```json
{
  "analytics": true,
  "functional": false,
  "marketing": false,
  "timestamp": "2025-08-01T12:00:00.000Z",
  "version": 1
}
```

| Property | Details |
|---|---|
| **Cookie name** | `cookie_consent` |
| **Max-age** | 1 year (31 536 000 seconds) |
| **SameSite** | `Lax` |
| **Secure** | `true` |
| **Path** | `/` |
| **Version** | `1` — bump this in `cookieUtils.ts` to force re-consent across all users |

---

## Key Files Reference

### `src/utils/cookieScripts.ts` — Script Loaders

Each tracker has a **load/remove** pair. The load function guards against duplicate injection via DOM element IDs.

| Function | Status | What it does |
|---|---|---|
| `loadGoogleAnalytics()` | **Implemented** | Injects gtag.js, initializes dataLayer, configures GA, loads Web Vitals |
| `removeGoogleAnalytics()` | **Implemented** | Removes script tag, cleans `_ga*`/`_gid`/`_gat` cookies, deletes window globals |
| `loadMetaPixel(pixelId)` | Stub | — |
| `removeMetaPixel()` | Stub | — |
| `loadTikTokPixel(pixelId)` | Stub | — |
| `removeTikTokPixel()` | Stub | — |
| `loadLinkedInInsight(partnerId)` | Stub | — |
| `removeLinkedInInsight()` | Stub | — |

### `src/contexts/CookieConsentContext.tsx` — Orchestration

The `applyScripts(preferences)` function is the single dispatch point that maps consent categories to script loaders. Currently only the analytics block is active; functional and marketing blocks are commented-out blueprints.

### `src/lib/consentCategories.ts` — Category Metadata

Controls what's displayed in the settings panel. Each entry has an `isImplemented` flag — when `false`, the toggle is disabled and a "Coming soon" badge is shown.

---

## UI Components

### Banner (`CookieConsentBanner.tsx`)
- Fixed to bottom of viewport, `z-index: 1100`
- Slide-up animation on first appearance
- Three buttons: **Accept All** (primary/cosmic), **Reject All** (outline), **Customize** (ghost)
- Links to `/cookies` (Cookie Policy page)
- Hidden once `hasInteracted === true`

### Settings Modal (`CookieConsentSettings.tsx`)
- Centered modal on desktop, bottom sheet on mobile
- Backdrop overlay at `z-index: 1200`
- Local state for toggles — nothing persists until "Save Preferences"
- Per-category cards with icons, descriptions, and badges
- Footer: Reject All, Accept All, Save Preferences

### Settings Button (`CookieSettingsButton.tsx`)
- Fixed `bottom-6 left-6`, `z-index: 998` (ChatButton is at `bottom-12 right-8 z-[999]`)
- 40px circle with Shield icon
- Visible only after the user has interacted with the banner

### Theme Support
All components use `useTheme()` from `ThemeContext` and conditionally apply dark/light styles. No extra CSS classes needed — everything is inline Tailwind with the `isDark` boolean.

---

## Future Work — Activating New Categories

### Activating Marketing Cookies (Meta, TikTok, LinkedIn)

Three files need changes:

**1. `src/utils/cookieScripts.ts`** — Fill in the stub functions:

```typescript
// Meta Pixel
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

// Similar pattern for TikTok and LinkedIn — see their official docs for snippet code.
```

**2. `src/contexts/CookieConsentContext.tsx`** — Uncomment the marketing block in `applyScripts()`:

```typescript
// Change this:
// if (preferences.marketing) {
//   loadMetaPixel('YOUR_PIXEL_ID');
//   loadTikTokPixel('YOUR_PIXEL_ID');
//   loadLinkedInInsight('YOUR_PARTNER_ID');
// } else {
//   removeMetaPixel();
//   removeTikTokPixel();
//   removeLinkedInInsight();
// }

// To this (with your real IDs):
if (preferences.marketing) {
  loadMetaPixel('123456789');
  loadTikTokPixel('ABCDEF123');
  loadLinkedInInsight('987654');
} else {
  removeMetaPixel();
  removeTikTokPixel();
  removeLinkedInInsight();
}
```

**3. `src/lib/consentCategories.ts`** — Flip the flag:

```typescript
{
  id: 'marketing',
  // ...
  isImplemented: true,  // was false
}
```

That's it. The banner, settings modal, and persistence all work automatically.

### Activating Functional Cookies

Same three-step process. Currently the theme is stored in `localStorage` (not a cookie), so functional cookies may not require a script loader — just flip `isImplemented` to `true` in `consentCategories.ts` if you want the toggle visible, and optionally gate `localStorage` writes in `ThemeContext.tsx` behind `consentState.functional`.

### Forcing Re-Consent (e.g., after adding new trackers)

Bump the `CURRENT_VERSION` constant in `src/utils/cookieUtils.ts`:

```typescript
const CURRENT_VERSION = 2; // was 1
```

All users with version 1 cookies will see the banner again on their next visit because `readConsentCookie()` returns `null` on version mismatch.

---

## z-index Map

| Layer | z-index | Component |
|---|---|---|
| Cookie Settings Button | `998` | `CookieSettingsButton` |
| Chat Button | `999` | `ChatButton` |
| Consent Banner | `1100` | `CookieConsentBanner` |
| Settings Backdrop | `1200` | `CookieConsentSettings` overlay |
| Settings Panel | `1201` | `CookieConsentSettings` modal |

---

## Compliance Notes

- **ePrivacy Directive:** No non-essential cookies/scripts load before explicit consent.
- **GDPR alignment:** Users can accept, reject, or customize per category. Choice is persisted and can be changed at any time.
- **Right to withdraw:** The persistent settings button and the Cookie Policy page button both allow users to change their mind.
- **Pre-existing GA cookies:** If a user visited before this system was deployed, old `_ga`/`_gid` cookies remain until they expire naturally. They are actively cleaned only when the user explicitly rejects analytics.
- **No server-side tracking:** This system is purely client-side. If server-side analytics are added in the future, the consent cookie (`cookie_consent`) is readable server-side (it's a standard cookie, not localStorage) and can gate server-side tracking.
