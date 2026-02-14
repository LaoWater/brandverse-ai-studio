# Creators Multiverse — Design System & Brand Guide

> Comprehensive design handoff document covering all hex codes, fonts, logos, gradients, and visual identity tokens used across the Creators Multiverse (BrandVerse AI Studio) platform.
>
> **Last updated:** 2026-02-14

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Logo System](#2-logo-system)
3. [Color Palette](#3-color-palette)
4. [Typography](#4-typography)
5. [Gradients](#5-gradients)
6. [Dark Mode Theme](#6-dark-mode-theme-default)
7. [Light Mode Theme](#7-light-mode-theme)
8. [Effects & Elevation](#8-effects--elevation)
9. [Spacing & Radius](#9-spacing--radius)
10. [Animations](#10-animations)
11. [Social Platform Colors](#11-social-platform-brand-colors)
12. [Icon System](#12-icon-system)
13. [Social & Meta Assets](#13-social--meta-assets)
14. [Brand Messaging](#14-brand-messaging)
15. [File Reference Index](#15-file-reference-index)

---

## 1. Brand Identity

| Property | Value |
|----------|-------|
| **Brand Name** | Creators Multiverse |
| **Product Name** | BrandVerse AI Studio |
| **Short Name** | Creators |
| **Monogram** | CM |
| **Tagline** | "AI-Powered Multi-Platform Content Generation" |
| **Domain** | creators-multiverse.com |
| **Brand Personality** | Tech-forward, cosmic, innovative, creator-first |
| **Visual Motif** | Orbiting particles, cosmic space, glassmorphism |

---

## 2. Logo System

### 2.1 Logo Variants

| Variant | File | Dimensions | Format | Usage |
|---------|------|-----------|--------|-------|
| **Logomark (Simple)** | `public/logo-simple.png` | 1024×1024 | PNG (RGBA) | Favicon, app icon, small contexts |
| **Logomark (Detailed)** | `public/logo.png` | 1024×1024 | PNG | General use, square contexts |
| **Logo + Wordmark** | `public/logo-caption.png` | 1024×1024 | PNG | Full lockup with "Creators Multiverse" text |
| **OG / Social Preview** | `public/logo-og.png` | 1536×1024 | PNG | Open Graph, social sharing |
| **Animated SVG** | `src/components/CreatorsMultiverseLogo.tsx` | Scalable (200×200 viewBox) | React SVG | In-app navigation |
| **Favicon** | `public/favicon.ico` | Multi-size | ICO | Browser tab |

### 2.2 Logo Description

The logo is a **"CM" monogram** with three orbiting elliptical rings and particle nodes:
- **C** — A curved arc (gradient stroke from `#00D4FF` → `#5B5FEE`)
- **M** — Angular letterform in white (`#FFFFFF`) stroke
- **Orbits** — Three elliptical rings at different tilts (25°, 0°, -35°) rotating at 20s, 15s (reverse), and 25s
- **Particles** — Small circles at orbit endpoints: cyan (`#00D4FF`), white (`#FFFFFF`), purple (`#5B5FEE`)
- **Glow filter** — 3.5px Gaussian blur applied to orbits

### 2.3 Logo Colors

| Element | Hex | RGB | Usage |
|---------|-----|-----|-------|
| Gradient Start | `#00D4FF` | 0, 212, 255 | Logo gradient (cyan) |
| Gradient End | `#5B5FEE` | 91, 95, 238 | Logo gradient (indigo) |
| Monogram "M" | `#FFFFFF` | 255, 255, 255 | Letter stroke |
| Particle 1 | `#00D4FF` | 0, 212, 255 | Orbit 1 dot |
| Particle 2 | `#FFFFFF` | 255, 255, 255 | Orbit 2 dot |
| Particle 3 | `#5B5FEE` | 91, 95, 238 | Orbit 3 dot |

### 2.4 Logo Sizing

| Context | Size |
|---------|------|
| Navigation (mobile) | 40×40px (`w-10 h-10`) |
| Navigation (desktop) | 56×56px (`w-14 h-14`) |
| Favicon | 192×192, 512×512 (PWA manifest) |

---

## 3. Color Palette

### 3.1 Primary — Indigo/Purple

The main brand color. Used for buttons, links, active states, focus rings.

| Shade | Hex | RGB | Usage |
|-------|-----|-----|-------|
| 50 | `#F0F0FF` | 240, 240, 255 | Lightest tint, hover backgrounds |
| 100 | `#E6E6FF` | 230, 230, 255 | Light backgrounds |
| 200 | `#D4D4FF` | 212, 212, 255 | Subtle fills |
| 300 | `#B8B8FF` | 184, 184, 255 | Borders, light accents |
| 400 | `#9999FF` | 153, 153, 255 | Muted interactive elements |
| **500** | **`#5B5FEE`** | **91, 95, 238** | **DEFAULT — Primary brand color** |
| 600 | `#4A4ED4` | 74, 78, 212 | Hover state |
| 700 | `#3A3DB8` | 58, 61, 184 | Active/pressed state |
| 800 | `#2E3199` | 46, 49, 153 | Dark variant |
| 900 | `#242680` | 36, 38, 128 | Darkest shade |
| Foreground | `#FFFFFF` | 255, 255, 255 | Text on primary |

### 3.2 Accent — Cyan/Electric Blue

Secondary brand color. Used for highlights, gradients, callouts.

| Shade | Hex | RGB | Usage |
|-------|-----|-----|-------|
| 50 | `#E6FAFF` | 230, 250, 255 | Lightest tint |
| 100 | `#CCF5FF` | 204, 245, 255 | Light backgrounds |
| 200 | `#99EBFF` | 153, 235, 255 | Subtle fills |
| 300 | `#66E0FF` | 102, 224, 255 | Light accents |
| 400 | `#33D6FF` | 51, 214, 255 | Medium accent |
| **500** | **`#00D4FF`** | **0, 212, 255** | **DEFAULT — Accent brand color** |
| 600 | `#00AACC` | 0, 170, 204 | Hover state |
| 700 | `#008099` | 0, 128, 153 | Active state |
| 800 | `#005566` | 0, 85, 102 | Dark variant |
| 900 | `#002B33` | 0, 43, 51 | Darkest shade |
| Foreground | `#0A0A0F` | 10, 10, 15 | Text on accent |

### 3.3 Semantic Colors

| Role | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Destructive / Error** | `#EF4444` | 239, 68, 68 | Delete, errors, warnings |
| Destructive Foreground | `#FFFFFF` | 255, 255, 255 | Text on destructive |
| **Success** | `#22C55E` | 34, 197, 94 | Confirmations, published status |
| **Warning** | `#EAB308` | 234, 179, 8 | Pending, caution states |
| **Info** | `#0EA5E9` | 14, 165, 233 | Informational elements |

### 3.4 Neutral Palette (Dark Mode Surfaces)

| Token | RGB Value | Hex (approx.) | Usage |
|-------|-----------|---------------|-------|
| Background | 10, 10, 15 | `#0A0A0F` | Page background |
| Card | 15, 15, 25 | `#0F0F19` | Card surfaces |
| Secondary | 20, 20, 35 | `#141423` | Elevated surfaces |
| Border | 30, 30, 50 | `#1E1E32` | Borders, dividers |
| Muted Foreground | ~165, 165, 175 | `#A5A5AF` | Secondary text |
| Foreground | ~250, 251, 255 | `#FAFBFF` | Primary text |

### 3.5 Neutral Palette (Light Mode Surfaces)

| Token | RGB Value | Hex (approx.) | Usage |
|-------|-----------|---------------|-------|
| Background | 250, 251, 252 | `#FAFBFC` | Page background |
| Card | 255, 255, 255 | `#FFFFFF` | Card surfaces |
| Secondary | 245, 245, 250 | `#F5F5FA` | Elevated surfaces |
| Border | 229, 231, 235 | `#E5E7EB` | Borders, dividers |
| Muted Foreground | ~117, 117, 125 | `#75757D` | Secondary text |
| Foreground | 15, 15, 23 | `#0F0F17` | Primary text |

### 3.6 PWA & Browser Chrome

| Property | Hex | Usage |
|----------|-----|-------|
| Theme Color | `#8B5CF6` | Browser toolbar, PWA chrome |
| PWA Background | `#0A0A0B` | Splash screen background |

---

## 4. Typography

### 4.1 Primary Fonts

| Font | Classification | Weights | Source | Usage |
|------|---------------|---------|--------|-------|
| **Poppins** | Sans-serif (Geometric) | 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold) | Google Fonts | **Default UI font** — body text, buttons, navigation, labels |
| **Cinzel** | Serif (Display) | 400 (Regular), 600 (SemiBold) | Google Fonts | Heading accents, serif alternative |

**Google Fonts URL:**
```
https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Cinzel:wght@400;600&display=swap
```

**Local Font Preload:**
```
/fonts/poppins-regular.woff2
```

### 4.2 Tailwind Font Stack

```
font-sans: 'Poppins', sans-serif  (default body)
font-serif: 'Cinzel', serif       (display/headings)
```

### 4.3 Type Scale (Tailwind)

| Class | Size | Rem | Typical Use |
|-------|------|-----|-------------|
| `text-xs` | 12px | 0.75rem | Badges, fine print, metadata |
| `text-sm` | 14px | 0.875rem | Labels, helper text, captions |
| `text-base` | 16px | 1rem | Body text, descriptions |
| `text-lg` | 18px | 1.125rem | Sub-headings, emphasized body |
| `text-xl` | 20px | 1.25rem | Section headers, card titles |
| `text-2xl` | 24px | 1.5rem | Page section titles |
| `text-3xl` | 30px | 1.875rem | Major headings |
| `text-4xl` | 36px | 2.25rem | Hero sub-headings |
| `text-5xl` | 48px | 3rem | Hero headlines |

### 4.4 Font Weight Scale

| Class | Weight | Usage |
|-------|--------|-------|
| `font-light` | 300 | Delicate/secondary text |
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, nav items |
| `font-semibold` | 600 | Card titles, buttons |
| `font-bold` | 700 | Headlines, CTAs |
| `font-extrabold` | 800 | Hero headlines (rare) |

### 4.5 Brand Name Typography

The brand name "Creators Multiverse" is rendered in:
- **Font:** Poppins
- **Weight:** Bold (700)
- **Navigation:** `text-base lg:text-xl font-bold text-white`
- **Footer:** `text-xl font-bold text-white`

### 4.6 Video Editor Fonts (Additional)

These fonts are dynamically loaded for the text overlay / video editor feature:

| Font | Weights | Style |
|------|---------|-------|
| Inter | 300, 400, 700 | Clean, minimal |
| Montserrat | 300, 400, 700 | Bold, geometric |
| Roboto | 300, 400, 700 | Neutral, readable |
| Playfair Display | 400, 700 | Elegant, serif |
| Oswald | 300, 400, 700 | Condensed, impact |
| Open Sans | 300, 400, 700 | Friendly, professional |
| Lato | 300, 400, 700 | Warm, casual |

---

## 5. Gradients

### 5.1 Brand Gradients

| Name | CSS | Usage |
|------|-----|-------|
| **Primary Gradient** | `linear-gradient(135deg, #5B5FEE 0%, #00D4FF 100%)` | CTAs, buttons, highlighted elements |
| **Cosmic Gradient** | `linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 50%, #16213E 100%)` | Dark mode page background |
| **Light Background** | `linear-gradient(135deg, #FFFFFF 0%, #F0F4FF 50%, #FFFFFF 100%)` | Light mode page background |
| **Card Gradient** | `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)` | Card overlays |

### 5.2 Logo Gradient

```css
linear-gradient(135deg, #00D4FF 0%, #5B5FEE 100%)
```

### 5.3 Cosmic Text Gradient

```css
.text-cosmic {
  background: linear-gradient(135deg, #5B5FEE 0%, #00D4FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 5.4 Cosmic Card Background

```css
/* Dark Mode */
background: linear-gradient(135deg, rgba(91, 95, 238, 0.08) 0%, rgba(0, 212, 255, 0.03) 100%);
border: 1px solid rgba(91, 95, 238, 0.25);
backdrop-filter: blur(12px);

/* Light Mode */
background: rgba(255, 255, 255, 0.85);
border: 1px solid rgba(91, 95, 238, 0.15);
```

---

## 6. Dark Mode Theme (Default)

The app defaults to dark mode. CSS custom properties on `:root`:

| Token | CSS Variable | RGB | Hex |
|-------|-------------|-----|-----|
| Background | `--background` | — | HSL `222.2 84% 4.9%` ≈ `#020617` |
| Foreground | `--foreground` | — | HSL `210 40% 98%` ≈ `#F8FAFC` |
| Card | `--card` | 15, 15, 25 | `#0F0F19` |
| Card Foreground | `--card-foreground` | 255, 255, 255 | `#FFFFFF` |
| Popover | `--popover` | 15, 15, 25 | `#0F0F19` |
| Popover Foreground | `--popover-foreground` | 255, 255, 255 | `#FFFFFF` |
| Primary | `--primary` | 91, 95, 238 | `#5B5FEE` |
| Primary Foreground | `--primary-foreground` | 255, 255, 255 | `#FFFFFF` |
| Secondary | `--secondary` | 20, 20, 35 | `#141423` |
| Secondary Foreground | `--secondary-foreground` | 255, 255, 255 | `#FFFFFF` |
| Muted | `--muted` | — | HSL `240 10% 11%` ≈ `#1A1A1F` |
| Muted Foreground | `--muted-foreground` | — | HSL `220 9% 65%` ≈ `#9CA3AF` |
| Accent | `--accent` | 0, 212, 255 | `#00D4FF` |
| Accent Foreground | `--accent-foreground` | 10, 10, 15 | `#0A0A0F` |
| Destructive | `--destructive` | 239, 68, 68 | `#EF4444` |
| Border | `--border` | 30, 30, 50 | `#1E1E32` |
| Input | `--input` | 30, 30, 50 | `#1E1E32` |
| Ring | `--ring` | 91, 95, 238 | `#5B5FEE` |
| Radius | `--radius` | — | `0.75rem` (12px) |

### Sidebar (Dark)

| Token | RGB | Hex |
|-------|-----|-----|
| Background | 10, 10, 15 | `#0A0A0F` |
| Foreground | 255, 255, 255 | `#FFFFFF` |
| Primary | 91, 95, 238 | `#5B5FEE` |
| Accent | 20, 20, 35 | `#141423` |
| Border | 30, 30, 50 | `#1E1E32` |

---

## 7. Light Mode Theme

CSS custom properties on `.light`:

| Token | CSS Variable | RGB | Hex |
|-------|-------------|-----|-----|
| Background | `--background` | 250, 251, 252 | `#FAFBFC` |
| Foreground | `--foreground` | 15, 15, 23 | `#0F0F17` |
| Card | `--card` | 255, 255, 255 | `#FFFFFF` |
| Card Foreground | `--card-foreground` | 15, 15, 23 | `#0F0F17` |
| Primary | `--primary` | 91, 95, 238 | `#5B5FEE` |
| Secondary | `--secondary` | 245, 245, 250 | `#F5F5FA` |
| Secondary Foreground | `--secondary-foreground` | 15, 15, 23 | `#0F0F17` |
| Muted | `--muted` | — | HSL `240 20% 97%` ≈ `#F7F7FA` |
| Muted Foreground | `--muted-foreground` | — | HSL `220 9% 46%` ≈ `#6B7280` |
| Accent | `--accent` | 0, 212, 255 | `#00D4FF` |
| Accent Foreground | `--accent-foreground` | 15, 15, 23 | `#0F0F17` |
| Border | `--border` | 229, 231, 235 | `#E5E7EB` |
| Input | `--input` | 229, 231, 235 | `#E5E7EB` |

### Sidebar (Light)

| Token | RGB | Hex |
|-------|-----|-----|
| Background | 255, 255, 255 | `#FFFFFF` |
| Foreground | 15, 15, 23 | `#0F0F17` |
| Primary | 91, 95, 238 | `#5B5FEE` |
| Accent | 245, 245, 250 | `#F5F5FA` |
| Border | 229, 231, 235 | `#E5E7EB` |

---

## 8. Effects & Elevation

### 8.1 Cosmic Glow (Brand Signature Effect)

```css
/* Standard glow */
box-shadow: 0 0 14px rgba(91, 95, 238, 0.25);

/* Enhanced glow */
box-shadow: 0 0 16px rgba(91, 95, 238, 0.3),
            0 0 28px rgba(0, 212, 255, 0.15);
```

### 8.2 Cosmic Button Shadow

```css
/* Default */
box-shadow: 0 4px 15px rgba(91, 95, 238, 0.3),
            0 0 16px rgba(0, 212, 255, 0.25);

/* Hover */
box-shadow: 0 8px 25px rgba(91, 95, 238, 0.4),
            0 0 28px rgba(0, 212, 255, 0.35);
transform: translateY(-2px);
```

### 8.3 Cosmic Card Shadow (Dark)

```css
box-shadow: 0 8px 32px rgba(91, 95, 238, 0.3),
            0 0 64px rgba(0, 212, 255, 0.25);
```

### 8.4 Cosmic Card Shadow (Light)

```css
box-shadow: 0 4px 16px rgba(91, 95, 238, 0.08),
            0 0 32px rgba(0, 212, 255, 0.05);
```

### 8.5 Glassmorphism

```css
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.05); /* dark */
background: rgba(255, 255, 255, 0.85); /* light */
```

---

## 9. Spacing & Radius

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.75rem` (12px) | Base radius |
| `rounded-lg` | `var(--radius)` = 12px | Cards, containers |
| `rounded-md` | `calc(var(--radius) - 2px)` = 10px | Buttons, inputs |
| `rounded-sm` | `calc(var(--radius) - 4px)` = 8px | Small elements, badges |

### Container

```css
max-width: 1400px (2xl breakpoint)
padding: 2rem (32px)
center: true
```

---

## 10. Animations

| Name | Duration | Easing | Description |
|------|----------|--------|-------------|
| `fade-in` | 0.3s | ease-out | Fade in + slide up 10px |
| `slide-in-right` | 0.3s | ease-out | Slide in from right |
| `pulse-glow` | 2s | ease-in-out, infinite | Pulsing brand glow (`#5B5FEE` shadow 20px→40px) |
| `cosmic-drift` | 20s | linear, infinite | Orbital rotation (used in logo) |
| `accordion-down` | 0.2s | ease-out | Expand from 0 height |
| `accordion-up` | 0.2s | ease-out | Collapse to 0 height |

### Logo Orbit Animations

| Orbit | Duration | Direction |
|-------|----------|-----------|
| Orbit 1 | 20s | Clockwise (tilted 25°) |
| Orbit 2 | 15s | Counter-clockwise (circular) |
| Orbit 3 | 25s | Clockwise (tilted -35°) |

---

## 11. Social Platform Brand Colors

Used in PostManager, HeroSection, and Footer components:

| Platform | Primary Hex | Gradient (if used) |
|----------|------------|-------------------|
| **Facebook** | `#1877F2` | `from-blue-600 to-blue-700` |
| **Instagram** | `#E4405F` | `from-[#833AB4] via-[#E1306C] to-[#F77737]` |
| **LinkedIn** | `#0A66C2` | `from-blue-700 to-blue-800` |
| **X (Twitter)** | `#000000` | `from-sky-400 to-sky-600` |

### Status Colors

| Status | Hex | Tailwind |
|--------|-----|----------|
| Pending/Draft | `#EAB308` | `yellow-500` |
| Published | `#22C55E` | `green-500` |
| Scheduled | `#10B981` | `emerald-500` |
| Default/Inactive | `#6B7280` | `gray-500` |

---

## 12. Icon System

| Library | Package | Usage |
|---------|---------|-------|
| **Lucide React** | `lucide-react` | Primary icon set — all UI icons (Rocket, Globe, Zap, Brain, Camera, etc.) |
| **React Icons (FA6)** | `react-icons/fa6` | Social media icons only (`FaFacebookF`, `FaInstagram`, `FaLinkedinIn`, `FaXTwitter`) |

---

## 13. Social & Meta Assets

### Open Graph Image

```html
<meta property="og:image" content="https://creators-multiverse.com/logo-og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### Twitter Card

```html
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:image" content="https://creators-multiverse.com/logo-og.png" />
<meta name="twitter:site" content="@CreatorsMultiverse" />
<meta name="twitter:creator" content="@CreatorsMultiverse" />
```

### Social Handles

| Platform | Handle |
|----------|--------|
| Instagram | `@creators.multiv` |
| Facebook | `creators-multiverse` |
| LinkedIn | `creatorsmultiv` |
| X / Twitter | `@Creators_M777` |

### PWA Manifest

```json
{
  "name": "Creators Multiverse",
  "short_name": "Creators",
  "background_color": "#0a0a0b",
  "theme_color": "#8B5CF6",
  "icons": [
    { "src": "/logo-simple.png", "sizes": "192x192" },
    { "src": "/logo-simple.png", "sizes": "512x512" }
  ]
}
```

---

## 14. Brand Messaging

| Element | Text |
|---------|------|
| **Primary Tagline** | "Launch Your Startup Into The Spotlight Everywhere That Matters" |
| **Product Description** | "AI-Powered Content Generation Platform" |
| **Philosophy Quote** | "You thought creating a beautiful product is enough? Not if it never sees the light of day." |
| **Focus Tagline** | "Your Quiet Edge" |
| **Creative CTA** | "Unleash Your Creativity" |
| **Ecosystem Note** | "Part of the Creators Multiverse ecosystem" |

---

## 15. File Reference Index

| Purpose | File Path |
|---------|-----------|
| Tailwind Config (colors, fonts, gradients) | `tailwind.config.ts` |
| CSS Variables & Themes | `src/index.css` |
| HTML Meta, Font Loading, SEO | `index.html` |
| PWA Manifest | `public/manifest.json` |
| Animated Logo Component | `src/components/CreatorsMultiverseLogo.tsx` |
| Logo PNG (simple) | `public/logo-simple.png` |
| Logo PNG (detailed) | `public/logo.png` |
| Logo + Wordmark | `public/logo-caption.png` |
| OG Social Image | `public/logo-og.png` |
| Favicon | `public/favicon.ico` |
| Text Overlay Presets | `src/components/editor/text-overlay/TextOverlayPanel.tsx` |
| Font Loading (Video Editor) | `src/components/editor/text-overlay/TextStyleControls.tsx` |
| Editor Type Definitions | `src/types/editor.ts` |

---

## Quick Reference Card

```
PRIMARY:    #5B5FEE  (Indigo)
ACCENT:     #00D4FF  (Cyan)
ERROR:      #EF4444  (Red)
SUCCESS:    #22C55E  (Green)
WARNING:    #EAB308  (Yellow)

DARK BG:    #0A0A0F
LIGHT BG:   #FAFBFC

FONT:       Poppins (300–700)
SERIF:      Cinzel (400, 600)

GRADIENT:   135deg, #5B5FEE → #00D4FF
RADIUS:     12px (0.75rem)
```
