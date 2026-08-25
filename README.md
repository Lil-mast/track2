# RecoveryAI: AI-Assisted Smart Loan Recovery Platform

## Hackathon: H0: Hack the Zero Stack with Vercel v0 and AWS Databases
**Track 2: Monetizable B2B App**

RecoveryAI is a B2B SaaS platform designed for financial institutions and lending companies to optimize their debt recovery processes. By moving away from rigid, rule-based systems, RecoveryAI uses generative AI to provide context-aware, empathetic, and effective recovery strategies.

---

## Architecture

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend** | Next.js (App Router) | Unified UI + API on Vercel |
| **Database** | **Convex** | Live document database with real-time queries; demo portfolio seeded via `pnpm seed` |
| **AI Engine** | **AWS Bedrock (Nova)** | Risk scoring and strategy generation from live borrower data |
| **Hosting** | Vercel | Optimized for Next.js |

---

## Getting Started

### Prerequisites
- Node.js 18+
- [Convex](https://convex.dev) account
- AWS account (Bedrock only, optional for AI routes)
- pnpm

### Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Copy env template: `cp .env.example .env.local`
4. Start Convex (creates/links deployment, writes `NEXT_PUBLIC_CONVEX_URL`):
   ```bash
   pnpm run dev:convex
   ```
5. Seed the demo portfolio (once):
   ```bash
   pnpm seed
   ```
6. Run Next.js:
   ```bash
   pnpm dev
   ```

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL |
| `CONVEX_DEPLOY_KEY` | Vercel prod | Server-side Convex auth on Vercel |
| `BEDROCK_ENABLED` | No | Enable `/api/ai/*` Bedrock routes |
| `BEDROCK_REGION`, `AWS_REGION` | Bedrock | AWS region for Nova |
| `DEMO_LENDER_ID` | No | Override demo tenant UUID |

---

## Project structure

```text
track2/
├── convex/              # Schema, queries, mutations, seed
├── src/
│   ├── app/             # Next.js App Router (UI + API)
│   ├── components/
│   ├── lib/convex/      # Server-side fetchQuery helpers
│   └── services/convex/ # ConvexDataRepository
├── database/            # Legacy SQL schema reference
└── .env.example
```

---

## Data flow

Dashboard pages call `getDataRepository()` → `ConvexDataRepository` → Convex queries.  
Recovery engine and AI API routes write back via Convex mutations. Bedrock is used only for `/api/ai/risk-score` and `/api/ai/generate-strategy`.

---
*Created for the H0: Hack the Zero Stack Hackathon — 2026*
