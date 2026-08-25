# Frontend — RecoveryAI

This repo uses **Next.js 15 (App Router)** with **TypeScript** and **Tailwind CSS**.

---

## Prerequisites

- Node.js 18+
- Package manager: `pnpm`

---

## Quick Start

```bash
pnpm install
pnpm run dev        # http://localhost:3000
```

### Build (production)
```bash
pnpm run build
pnpm run start
```

### Lint / Typecheck
```bash
pnpm run lint
pnpm exec tsc --noEmit
```

---

## Entry Points

| File | Purpose |
|------|---------|
| `public/index.html` | Static HTML entry point. Auto-redirects to the Next.js app via `<meta http-equiv="refresh">`. Provides a branded fallback screen while the app loads. |
| `src/app/layout.tsx` | Root Next.js layout — sets `<html>`, `<body>`, global fonts, and metadata. |
| `src/app/page.tsx` | Landing page route (`/`). A lean orchestrator that composes section components. |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell layout — sidebar, navigation. |
| `src/app/(dashboard)/page.tsx` | Dashboard home (`/dashboard`). Displays stats, recent AI recommendations, overdue accounts. |

---

## Directory Structure

```
track2/
├── public/
│   └── index.html                        ← Static entry / redirect stub
│
└── src/
    ├── app/                              ← Next.js App Router
    │   ├── layout.tsx                    ← Root layout
    │   ├── globals.css                   ← Global CSS variables & Tailwind
    │   ├── page.tsx                      ← Landing page (/) — imports section components
    │   ├── (dashboard)/                  ← Route group: authenticated dashboard
    │   │   ├── layout.tsx
    │   │   ├── page.tsx                  ← Dashboard home
    │   │   ├── borrowers/
    │   │   │   ├── page.tsx
    │   │   │   └── [id]/page.tsx
    │   │   ├── loans/
    │   │   │   ├── page.tsx
    │   │   │   └── [id]/page.tsx
    │   │   ├── recovery/
    │   │   │   ├── page.tsx
    │   │   │   └── [id]/page.tsx
    │   │   ├── rules/page.tsx
    │   │   ├── audit-logs/page.tsx
    │   │   └── (no demo page — data is live via Convex)
    │   └── api/                          ← Next.js API routes
    │
    ├── components/
    │   ├── pages/                        ← Page-level section components
    │   │   └── landing/                  ← Landing page sections
    │   │       ├── hero-section.tsx          Hero, CTA buttons, dashboard mockup
    │   │       ├── trusted-by-section.tsx    Logo strip
    │   │       ├── features-section.tsx      3-column feature cards
    │   │       ├── intelligence-layer-section.tsx  Pipeline flow
    │   │       ├── api-preview-section.tsx   Code/JSON terminal block
    │   │       ├── cta-section.tsx           Final call-to-action
    │   │       └── footer-section.tsx        Footer with nav links
    │   ├── layout/                       ← Shell components (sidebar, nav)
    │   ├── recovery/                     ← Recovery-specific components
    │   ├── shared/                       ← Reusable across pages
    │   │   ├── page-header.tsx
    │   │   ├── stat-card.tsx
    │   │   ├── status-badge.tsx
    │   │   └── empty-state.tsx
    │   └── ui/                           ← Base UI primitives (shadcn/ui)
    │
    ├── config/                           ← App configuration
    ├── convex/                           ← Live database (schema, queries, seed)
    ├── lib/                              ← Utilities, constants, labels
    │   ├── constants.ts
    │   ├── labels.ts
    │   └── utils.ts
    ├── services/                         ← Data repository abstraction
    └── types/                            ← Shared TypeScript types
```

---

## Landing Page Architecture

The landing page (`src/app/page.tsx`) is a **client component** that:

1. Registers an `IntersectionObserver` for scroll-triggered `.fade-in-up` animations
2. Renders the fixed navigation header directly (since it owns the `z-50` stacking context)
3. Delegates each visual section to its own component in `src/components/pages/landing/`

### Section Components

| Component | Route section |
|-----------|--------------|
| `HeroSection` | Badge · Headline · CTA buttons · Dashboard mockup SVG |
| `TrustedBySection` | "Trusted by industry leaders" logos |
| `FeaturesSection` | Dynamic Workflows · Predictive Risk · Sentiment Analysis |
| `IntelligenceLayerSection` | Data Ingestion → AI Analysis → Action Execution |
| `ApiPreviewSection` | "See Into The Engine" copy + JSON terminal |
| `CtaSection` | "Transform Loan Recovery With AI" final CTA |
| `FooterSection` | Brand · Legal & Security · Company links |

---

## Styling

- **Tailwind CSS v3** — configured in `tailwind.config.ts`
- **CSS custom properties** defined in `src/app/globals.css` (colors, typography tokens)
- Custom Tailwind tokens: `max-w-container-max`, `px-margin-desktop`, `px-margin-mobile`, `gap-gutter`
- Utility classes: `glass-panel`, `glass-panel-heavy`, `glow-primary`, `hover-glow-primary`, `text-gradient`, `fade-in-up`, `float`, `shimmer-line`

---

## Key Conventions

- **Server Components by default** — only add `"use client"` when hooks or browser APIs are needed
- **`@/` path alias** → resolves to `src/`
- Dashboard pages use `async` server components and call `getDataRepository()` directly
- Landing page sections are pure functional components with no data fetching
