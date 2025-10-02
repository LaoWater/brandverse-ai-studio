# BrandVerse AI Studio

A creator-first frontend for brand‑consistent, multi‑platform content generation. Design your brand voice, orchestrate posts across channels, and move from idea to publish with radical clarity and speed.

> Note: The agentic generation system (planning, LLM/Gemini/GCS pipelines, orchestration) lives in a private repository. This repo contains the frontend application and public-facing integrations only.

---

## ✨ Highlights

- Supabase Authentication and account context
- Brand Setup (mission, tone of voice, colors, logo) powering generation
- Content Generator with multi-platform, tone, language, and media controls (Level 1 & Level 2)
- Visual Generation Progress with clearly defined stages
- Campaign Preview, Post Manager, Pricing, Settings, and Partner flows
- Stripe checkout via Supabase Edge Functions (create-credit-checkout, verify-payment)
- Responsive UI built with Tailwind CSS, shadcn/ui, and Radix primitives

---

## 🖼️ Visuals

<p align="center">
  <img src="public/unleash_your_productivity.jpg" alt="BrandVerse – Unleash Your Productivity" width="85%" />
</p>

<p align="center">
  <img src="public/chat-assistant.png" alt="BrandVerse Chat Assistant" width="70%" />
</p>

<p align="center">
  <img src="public/CommandCenter.jpg" alt="BrandVerse Command Center" width="70%" />
</p>

---

## 🧭 Philosophy

We believe creative teams deserve tools that amplify clarity and brand consistency. This frontend is designed to feel ergonomic and calm, while the private agentic system handles the heavy lifting behind the scenes. The result: less time wrestling complexity, more time crafting meaningful communication.

---

## 🏗️ Architecture Overview

- Frontend: React 18 + Vite 5 + TypeScript 5
- UI System: Tailwind CSS + shadcn/ui + Radix UI
- State/Data: React Query
- Authentication & Data: Supabase JS SDK
- Payments: Supabase Edge Functions (Stripe)
- Hosting: Google App Engine (Node runtime) serving a built Vite app via `server.js`
- Agentic System: Private repository exposing an HTTP API (referenced here via a base URL)

```
[User] -> [BrandVerse Frontend (this repo)] -> [Private Agentic API (separate repo)]
                                            -> [Supabase (auth, data, functions/Stripe)]
```

---

## 📁 Directory Overview

```
.
├─ public/                 # Static assets (screenshots, logo, icons)
├─ src/
│  ├─ components/          # Reusable UI components (shadcn/ui + custom)
│  ├─ contexts/            # AuthContext, CompanyContext
│  ├─ integrations/
│  │  └─ supabase/         # Supabase client and types
│  ├─ pages/               # Routes: Index, Auth, BrandSetup, ContentGenerator, etc.
│  ├─ services/            # API composition and domain helpers
│  └─ main.tsx, App.tsx    # App entry
├─ supabase/
│  ├─ functions/           # Edge functions (create-credit-checkout, verify-payment)
│  └─ migrations/          # SQL migrations
├─ server.js               # Express static file server for dist/
├─ app.yaml                # App Engine configuration
├─ vite.config.ts          # Vite config (port 8080)
├─ tailwind.config.ts      # Tailwind theme & animations
└─ package.json
```

---

## 🚀 Getting Started

Prerequisites:
- Node.js v20+
- npm 9+

Install & run locally:

```
# Install dependencies
npm install

# Start dev server (Vite on http://localhost:8080)
npm run dev

# Build production assets (outputs to dist/)
npm run build

# Preview the built app locally
npm run preview
```

---

## ⚙️ Configuration

Environment variables (recommended pattern):

```
# .env (development)
VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="{{SUPABASE_ANON_KEY}}"
VITE_API_BASE_URL="https://your-private-agentic-api.example.com"
```

Notes:
- The repo currently initializes Supabase in `src/integrations/supabase/client.ts` with inline values. For production, prefer environment variables and inject them via your hosting platform.
- The content generation endpoint is referenced in `src/pages/ContentGenerator.tsx` as an API base URL. For flexibility, set `VITE_API_BASE_URL` and consume it in code (e.g., `import.meta.env.VITE_API_BASE_URL`).

---

## 🧪 Features in Detail

- Authentication: Supabase Auth with protected routes (e.g., `/content-generator`, `/post-manager`)
- Brand Setup: Persist brand attributes (mission, tone, colors, logo) to drive consistent generation
- Content Generator:
  - Platforms: Instagram, LinkedIn, Twitter/X, Facebook
  - Tonality & Language selection
  - Media controls (Level 1 global; Level 2 per platform)
  - Progress stages: init → planning → crafting → media → finalizing → saving
- Post Manager & Campaign Preview: Review and refine generated posts
- Credits System: Track available credits; Stripe checkout flow via Supabase Edge Functions
- Legal & Compliance: Terms/Privacy pages included

---

## ☁️ Deployment (Google App Engine)

This repo includes `app.yaml` for App Engine (Node.js 20). The server process uses `server.js` to serve static files from `dist/`.

Recommended steps:

```
# Ensure a production build exists
npm ci
npm run build

# Deploy to App Engine
gcloud app deploy --quiet
```

Tips:
- If you want App Engine to run a build on deploy automatically, add a `gcp-build` script in `package.json`:
```
"scripts": {
  "gcp-build": "npm run build"
}
```
- The handlers in `app.yaml` cache static assets and route everything else to `dist/index.html`.

---

## 🧰 Supabase Functions & Database

- Edge Functions:
  - `supabase/functions/create-credit-checkout/`
  - `supabase/functions/verify-payment/`
- Migrations in `supabase/migrations/` reflect schema evolution.
- In production, store secrets in your platform’s secret manager (e.g., GCP Secret Manager) and inject into runtime.

---

## 🔐 Security & Privacy

- Do not commit secrets. Use environment variables for public and private keys.
- The private agentic system remains in a separate repository and should be exposed only via a secured API.

---

## 🗺️ Roadmap (suggested)

- Per‑platform content templates and brand presets
- Rich analytics and performance insights
- Advanced media pipeline controls and presets
- Team roles, collaboration, and approvals
- Move all runtime configuration to environment variables

---

## 🤝 Contributing

1. Fork the repo and create a feature branch
2. Install dependencies: `npm install`
3. Run locally: `npm run dev`
4. Commit with clear messages and open a PR

Code style:
- TypeScript, React 18
- Tailwind CSS for styling
- Prefer composition over complexity; small, focused components

---

## 📜 License

Please specify your preferred license. If none is specified, all rights are reserved by the project owner.
