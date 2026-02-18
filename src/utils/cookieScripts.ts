// ============================================
// Dynamic Script Injection & Removal
// Each tracker has a load/remove pair.
// Only Google Analytics is actively implemented.
// ============================================

// ─── Google Analytics (ACTIVE) ──────────────────────────────────────

const GA_MEASUREMENT_ID = 'G-Z249PRHMG9';
const GA_SCRIPT_ID = 'ga-gtag-script';

/**
 * Dynamically inject the Google Analytics gtag.js script
 * and initialise the dataLayer + Web Vitals reporting.
 */
export function loadGoogleAnalytics(): void {
  // Guard: don't inject twice
  if (document.getElementById(GA_SCRIPT_ID)) return;

  // 1. Inject the gtag.js loader
  const script = document.createElement('script');
  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // 2. Initialise dataLayer & gtag function
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function gtag(..._args: any[]) {
    // gtag expects arguments object, not rest params
    window.dataLayer.push(arguments); // eslint-disable-line prefer-rest-params
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });

  // 3. Web Vitals → GA
  loadWebVitals();
}

/**
 * Remove the GA script, clean up GA cookies, and delete globals.
 */
export function removeGoogleAnalytics(): void {
  // Remove the script tag
  const script = document.getElementById(GA_SCRIPT_ID);
  if (script) script.remove();

  // Remove GA cookies (_ga, _ga_*, _gid, _gat) from all likely domains
  const gaCookieNames = document.cookie
    .split(';')
    .map((c) => c.trim().split('=')[0])
    .filter((name) => /^(_ga|_gid|_gat)/.test(name));

  const hostname = window.location.hostname;
  const domains = [hostname, `.${hostname}`];

  for (const name of gaCookieNames) {
    for (const domain of domains) {
      document.cookie = `${name}=; path=/; domain=${domain}; max-age=0`;
    }
    // Also try without domain (lets browser match current domain)
    document.cookie = `${name}=; path=/; max-age=0`;
  }

  // Clean up window globals
  try {
    delete (window as any).dataLayer; // eslint-disable-line @typescript-eslint/no-explicit-any
    delete (window as any).gtag;       // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch {
    // Some environments don't allow delete on window props
  }
}

/**
 * Load the web-vitals library and send CLS/FID/FCP/LCP/TTFB to GA.
 */
function loadWebVitals(): void {
  if (!('performance' in window)) return;

  import('https://unpkg.com/web-vitals@3/dist/web-vitals.js' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const sendToGA = (metric: { name: string; value: number; id: string }) => {
        if (window.gtag) {
          window.gtag('event', metric.name, {
            event_category: 'Web Vitals',
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            event_label: metric.id,
            non_interaction: true,
          });
        }
      };

      getCLS(sendToGA);
      getFID(sendToGA);
      getFCP(sendToGA);
      getLCP(sendToGA);
      getTTFB(sendToGA);
    })
    .catch(() => {
      // Silently fail — web-vitals is a nice-to-have
    });
}


// ─── Meta Pixel (BLUEPRINT — NOT ACTIVE) ────────────────────────────

const META_PIXEL_SCRIPT_ID = 'meta-pixel-script';

/** Inject Meta (Facebook) Pixel base code. */
export function loadMetaPixel(_pixelId: string): void {
  if (document.getElementById(META_PIXEL_SCRIPT_ID)) return;
  // TODO: Implement when ready
  // 1. Create <script> with Meta Pixel base code
  // 2. fbq('init', pixelId)
  // 3. fbq('track', 'PageView')
}

/** Remove Meta Pixel script and clean _fbp cookie. */
export function removeMetaPixel(): void {
  const script = document.getElementById(META_PIXEL_SCRIPT_ID);
  if (script) script.remove();
  // TODO: Remove _fbp cookie
}


// ─── TikTok Pixel (BLUEPRINT — NOT ACTIVE) ──────────────────────────

const TIKTOK_PIXEL_SCRIPT_ID = 'tiktok-pixel-script';

/** Inject TikTok Pixel code. */
export function loadTikTokPixel(_pixelId: string): void {
  if (document.getElementById(TIKTOK_PIXEL_SCRIPT_ID)) return;
  // TODO: Implement when ready
}

/** Remove TikTok Pixel script and clean _ttp cookie. */
export function removeTikTokPixel(): void {
  const script = document.getElementById(TIKTOK_PIXEL_SCRIPT_ID);
  if (script) script.remove();
  // TODO: Remove _ttp cookie
}


// ─── LinkedIn Insight Tag (BLUEPRINT — NOT ACTIVE) ──────────────────

const LINKEDIN_INSIGHT_SCRIPT_ID = 'linkedin-insight-script';

/** Inject LinkedIn Insight Tag. */
export function loadLinkedInInsight(_partnerId: string): void {
  if (document.getElementById(LINKEDIN_INSIGHT_SCRIPT_ID)) return;
  // TODO: Implement when ready
}

/** Remove LinkedIn Insight Tag and clean li_sugr / AnalyticsSyncHistory cookies. */
export function removeLinkedInInsight(): void {
  const script = document.getElementById(LINKEDIN_INSIGHT_SCRIPT_ID);
  if (script) script.remove();
  // TODO: Remove li_sugr, AnalyticsSyncHistory cookies
}
