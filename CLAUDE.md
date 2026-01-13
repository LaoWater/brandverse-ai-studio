# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrandVerse AI Studio is a creator-first frontend for brand-consistent, multi-platform content generation. The agentic generation system (LLM pipelines, orchestration) lives in a private repository - this repo contains only the frontend application.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite 5
- **UI**: Tailwind CSS + shadcn/ui + Radix UI primitives
- **State**: React Context (Auth, Company, Theme, MediaStudio) + TanStack Query
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Payments**: Stripe via Supabase Edge Functions
- **Hosting**: Google App Engine (Node runtime serving built Vite app via `server.js`)

### Data Flow
```
[User] -> [BrandVerse Frontend] -> [Private Agentic API (separate repo)]
                                -> [Supabase (auth, data, edge functions/Stripe)]
```

### Key Directories
- `src/contexts/` - React contexts: AuthContext, CompanyContext, ThemeContext, MediaStudioContext
- `src/pages/` - Route components (Index, Auth, BrandSetup, ContentGenerator, PostManager, MediaStudio, SeoAgent, etc.)
- `src/components/ui/` - shadcn/ui components
- `src/integrations/supabase/` - Supabase client and auto-generated types
- `src/services/` - API composition (supabaseService for posts CRUD)
- `supabase/functions/` - Edge functions (create-credit-checkout, verify-payment, seo-engine, generate-media-image, generate-media-video)
- `supabase/migrations/` - SQL migrations

### Context Hierarchy (in App.tsx)
```
QueryClientProvider > TooltipProvider > ThemeProvider > AuthProvider > CompanyProvider > BrowserRouter
```

### Database Schema (Supabase)
Key tables: `users`, `companies`, `posts`, `platforms`, `available_credits`, `purchase_history`, `image_control`, `influencer_profiles`

### Import Alias
Use `@/` for src imports (configured in vite.config.ts and tsconfig):
```typescript
import { supabase } from "@/integrations/supabase/client";
```

### Theme System
Dark/light mode via ThemeContext. Theme class applied to `<html>` element. CSS variables defined for colors in Tailwind config using `hsl(var(--*))` pattern.



### Content Generation Flow
ContentGenerator page connects to external agentic API. Progress stages: init → planning → crafting → media → finalizing → saving. Generated posts saved to Supabase via `saveGeneratedPostsToSupabase`.

## Environment Variables

```
VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_API_BASE_URL="https://your-private-agentic-api.example.com"
```

Note: Currently Supabase client has inline values in `src/integrations/supabase/client.ts`.

