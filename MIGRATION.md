# RecoveryAI — Vercel Migration Guide

**Branch:** `migration`  
**Goal:** Collapse the fragmented `frontend/` + `backend/` structure into a single Next.js app at the project root (`./`), deployable directly from Vercel with root directory set to `./`.

---

## Current State on `migration` Branch

The following work is **already done** on this branch. Team members do not need to repeat these steps:

| What | Status |
|---|---|
| Root `package.json` with all deps including `@aws-sdk/client-rds-data` | ✅ Done |
| `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs` at root | ✅ Done |
| `src/app/layout.tsx` + `src/app/globals.css` — real root layout | ✅ Done |
| `src/lib/constants.ts` — real constants | ✅ Done |
| `src/app/(dashboard)/layout.tsx` — minimal stub (replace with real one in Step 1) | ✅ Done (stub) |
| All skeleton page and route stubs in `src/` — valid exports, return null or 501 | ✅ Done (stubs — replace with real code) |
| Demo pipeline — `/demo` page + `/api/demo/aurora-ping` route | ✅ Done — working, tested |
| `.gitignore` updated — `.env.local`, `.env*.local`, `.next/` excluded | ✅ Done |

The `frontend/ backend/` directory still exists and is untouched. Steps 1–9 below describe what the team needs to complete.

---

## Demo Pipeline (Aurora Wake-Up Demo)

**Two files exist solely to demonstrate the full pipeline end-to-end:**

```
src/app/(dashboard)/demo/page.tsx         ← "Good Morning Aurora" button page
src/app/api/demo/aurora-ping/route.ts     ← GET route, runs SELECT NOW() against Aurora
```

These are **not part of the real application**. They prove the Vercel → Next.js API Route → RDS Data API → Aurora Serverless v2 pipeline works before the real migration is complete.

The demo handles Aurora's 0 ACU cold start gracefully:
- API route returns `HTTP 202` when Aurora is still resuming (not an error)
- Frontend detects `202`, shows a waking animation, retries with exponential backoff (3s → 4.5s → ... capped at 15s, up to 12 attempts ~2 min total)
- On success shows server time, database name, total elapsed time, and attempt count

**Remove both files once the real `AuroraDataRepository` is wired in (after Steps 4 + 6).**

---

## Why This Migration Is Needed

The current project has three separate packages:

```
track2/
├── frontend/   → Next.js app (correct technology, wrong location)
├── backend/    → Express server (WRONG — not deployable on Vercel)
└── infra/      → AWS CDK (correct, stays as-is)
```

Vercel deploys a single Next.js project. It cannot run a standalone Express server. The Express server in `backend/` will never deploy — Vercel runs serverless functions only.

The fix is:
- Move the Next.js app (`frontend/`) up to the project root
- Port the Express handlers into Next.js API Route Handlers
- Port the Express services (Bedrock, RDS) into the frontend service layer
- Delete `backend/` entirely

The `infra/` and `database/` directories are **not touched** — they are run locally and are never part of the Vercel deployment.

---

## Target Structure After Migration

```
track2/                                  ← Vercel root (Next.js project root)
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/                 ← All dashboard pages (unchanged)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── borrowers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── loans/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── recovery/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── rules/
│   │   │   │   └── page.tsx
│   │   │   ├── audit-logs/
│   │   │   │   └── page.tsx
│   │   │   └── demo/                    ← DEMO ONLY — delete after Steps 4 + 6
│   │   │       └── page.tsx             ← Aurora wake-up demo page
│   │   │
│   │   ├── api/
│   │   │   ├── recovery/
│   │   │   │   └── recommend/
│   │   │   │       └── route.ts         ← KEEP AS-IS (already Next.js)
│   │   │   ├── ai/                      ← NEW — migrated from backend/
│   │   │   │   ├── risk-score/
│   │   │   │   │   └── route.ts         ← FROM backend/src/handlers/risk-score.js
│   │   │   │   ├── generate-strategy/
│   │   │   │   │   └── route.ts         ← FROM backend/src/handlers/generate-strategy.js
│   │   │   │   └── strategies/
│   │   │   │       └── [loanId]/
│   │   │   │           └── route.ts     ← FROM backend/src/handlers/get-strategies.js
│   │   │   └── demo/                    ← DEMO ONLY — delete after Steps 4 + 6
│   │   │       └── aurora-ping/
│   │   │           └── route.ts         ← delete once AuroraDataRepository is wired in
│   │   │
│   │   ├── globals.css                  ← KEEP AS-IS
│   │   └── layout.tsx                   ← KEEP AS-IS
│   │
│   ├── components/                      ← KEEP AS-IS (all components unchanged)
│   │   ├── layout/
│   │   │   ├── app-header.tsx
│   │   │   └── app-sidebar.tsx
│   │   ├── recovery/
│   │   │   └── recovery-workflow-panel.tsx
│   │   ├── shared/
│   │   │   ├── empty-state.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── stat-card.tsx
│   │   │   └── status-badge.tsx
│   │   └── ui/
│   │       └── (all shadcn components)
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   └── bedrock.ts               ← COMPLETE THIS STUB
│   │   │                                   port invokeNova() + sanitizeForAI()
│   │   │                                   from backend/src/services/ai.js
│   │   ├── aurora/
│   │   │   └── AuroraDataRepository.ts  ← COMPLETE THIS STUB
│   │   │                                   port query() from backend/src/services/db.js
│   │   │                                   implement full IDataRepository interface
│   │   ├── auth/
│   │   │   └── cognito.ts               ← COMPLETE THIS STUB (currently hardcoded)
│   │   ├── interfaces/
│   │   │   └── IDataRepository.ts       ← KEEP AS-IS
│   │   ├── mock/
│   │   │   └── MockDataRepository.ts    ← KEEP AS-IS (used for local dev)
│   │   ├── recovery-engine/             ← KEEP AS-IS
│   │   │   ├── index.ts
│   │   │   ├── ai-generator.ts
│   │   │   ├── audit-logger.ts
│   │   │   ├── context-builder.ts
│   │   │   ├── risk-scorer.ts
│   │   │   └── rules-validator.ts
│   │   └── index.ts                     ← UPDATE: switch to AuroraDataRepository
│   │                                       when AURORA_ENABLED=true
│   │
│   ├── config/
│   │   ├── aws.ts                       ← KEEP AS-IS
│   │   └── navigation.ts                ← KEEP AS-IS
│   │
│   ├── data/
│   │   └── mock/                        ← KEEP AS-IS (local dev only)
│   │       ├── index.ts
│   │       ├── borrowers.ts
│   │       ├── loans.ts
│   │       ├── lenders.ts
│   │       ├── payments.ts
│   │       ├── recommendations.ts
│   │       ├── rules.ts
│   │       ├── audit-logs.ts
│   │       └── runtime-store.ts
│   │
│   ├── lib/
│   │   ├── constants.ts                 ← KEEP AS-IS
│   │   ├── labels.ts                    ← KEEP AS-IS
│   │   └── utils.ts                     ← KEEP AS-IS
│   │
│   └── types/                           ← KEEP AS-IS (all type definitions)
│       ├── index.ts
│       ├── audit.ts
│       ├── borrower.ts
│       ├── lender.ts
│       ├── loan.ts
│       ├── payment.ts
│       ├── recovery.ts
│       ├── recovery-engine.ts
│       └── rules.ts
│
├── database/                            ← NOT TOUCHED — local use only
│   └── sql/
│       └── 001_schema.sql
│
├── infra/                               ← NOT TOUCHED — CDK, local use only
│   ├── lib/track2-stack.ts
│   ├── scripts/
│   │   ├── create-app-user.mjs
│   │   ├── migrate.mjs
│   │   └── verify-app-user.mjs
│   └── package.json
│
├── package.json                         ← FROM frontend/package.json (moved to root)
├── next.config.ts                       ← FROM frontend/next.config.ts
├── tsconfig.json                        ← FROM frontend/tsconfig.json
├── tailwind.config.ts                   ← FROM frontend/tailwind.config.ts
├── postcss.config.mjs                   ← FROM frontend/postcss.config.mjs
├── components.json                      ← FROM frontend/components.json
├── eslint.config.mjs                    ← FROM frontend/eslint.config.mjs
├── .env.local                           ← gitignored — project owner only, not needed by team
├── .gitignore                           ← FROM frontend/.gitignore
└── MIGRATION.md                         ← This file
```

---

## Migration Steps

### Step 1 — Move the Next.js app to root (Frontend Dev)

Move all files from `frontend/` up to the project root. This is a flat file move, no code changes.

```
frontend/src/               → src/
frontend/package.json        → package.json
frontend/next.config.ts      → next.config.ts
frontend/tsconfig.json       → tsconfig.json
frontend/tailwind.config.ts  → tailwind.config.ts
frontend/postcss.config.mjs  → postcss.config.mjs
frontend/components.json     → components.json
frontend/eslint.config.mjs   → eslint.config.mjs
frontend/.gitignore          → .gitignore (merge with root .gitignore)
```

After moving, delete the now-empty `frontend/` directory.

Verify it builds:
```bash
npm install
npm run build
```

---

### Step 2 — Add remaining AWS SDK dependencies (Frontend Dev)

`@aws-sdk/client-rds-data` is already in `package.json` (added on the migration branch). Add the remaining packages needed for Bedrock and Zod validation:

```bash
npm install @aws-sdk/client-bedrock-runtime zod
```

---

### Step 3 — Port the AI service (Backend Dev)

**Source:** `backend/src/services/ai.js`  
**Target:** `src/services/ai/bedrock.ts`

Port these two functions into the existing stub:
- `sanitizeForAI(data)` — the full prompt injection sanitizer (all 4 layers)
- `invokeNova(systemPrompt, userPrompt, modelId?)` — the Bedrock invocation with Nova fallback

Remove `dotenv` calls — Next.js reads env vars from `.env.local` automatically.  
Convert to TypeScript — add types for parameters and return values.

---

### Step 4 — Port the database service (Backend Dev)

**Source:** `backend/src/services/db.js`  
**Target:** `src/services/aurora/AuroraDataRepository.ts`

Port the `query()` function and the RDS Data API client setup into this file. Then implement all methods defined in `src/services/interfaces/IDataRepository.ts` using that `query()` function.

Each method maps to one or more SQL queries against Aurora via the RDS Data API. The mock data shapes in `src/data/mock/` show exactly what each method must return.

Remove `dotenv` calls — not needed in Next.js.

---

### Step 5 — Port the API route handlers (Backend Dev)

**Source:** `backend/src/handlers/`  
**Target:** `src/app/api/ai/`

Three handlers need to become three Next.js Route Handler files.

#### Handler signature change

Express:
```js
export const calculateRiskScore = async (req, res) => {
  const body = req.body
  return res.status(200).json({ ... })
}
```

Next.js:
```ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({ ... }, { status: 200 })
}
```

#### Mapping

| Express handler | Next.js route file | HTTP method |
|---|---|---|
| `handlers/risk-score.js` | `app/api/ai/risk-score/route.ts` | `POST` |
| `handlers/generate-strategy.js` | `app/api/ai/generate-strategy/route.ts` | `POST` |
| `handlers/get-strategies.js` | `app/api/ai/strategies/[loanId]/route.ts` | `GET` |

For the `GET` strategies route, query params are accessed via:
```ts
export async function GET(request: NextRequest, { params }: { params: { loanId: string } }) {
  const loanId = params.loanId
  const lenderId = request.nextUrl.searchParams.get('lenderId')
}
```

Drop: `express`, `cors`, `helmet`, `morgan`, `nodemon` — none are needed or supported in Next.js API routes.

---

### Step 6 — Wire the real data repository (Frontend Dev)

**File:** `src/services/index.ts`

Currently hardcoded to always return the mock repository:
```ts
export function getDataRepository(): IDataRepository {
  return mockDataRepository   // ← change this
}
```

Switch it to use Aurora when the env var is set:
```ts
export function getDataRepository(): IDataRepository {
  if (process.env.AURORA_ENABLED === 'true') {
    return auroraDataRepository
  }
  return mockDataRepository
}
```

This means local dev without AWS credentials still works on mock data. Production Vercel deployment uses Aurora.

---

### Step 7 — Set environment variables (Vercel Dashboard only)

**Aurora is only accessible from Vercel production.** The AWS IAM role is locked to Vercel OIDC federation — team members cannot access Aurora locally. Local development always runs on mock data. No `.env.local` setup is needed.

All variables are set once in **Vercel Dashboard → Project → Settings → Environment Variables** by the project owner. They are already configured. This step is listed for reference only.

| Variable | Value | Source |
|---|---|---|
| `AWS_REGION` | `eu-west-2` | CDK output: `AWSRegion` |
| `BEDROCK_REGION` | `us-east-1` | hardcoded (Nova Pro requirement) |
| `AWS_ROLE_ARN` | `arn:aws:iam::...` | CDK output: `VercelRoleArn` |
| `AURORA_CLUSTER_ARN` | `arn:aws:rds:...` | CDK output: `AuroraClusterArn` |
| `AURORA_SECRET_ARN` | `arn:aws:secretsmanager:...` | CDK output: `AppUserSecretArn` (**app-user only, NOT master**) |
| `AURORA_DATABASE` | `recoveryai` | CDK output: `AuroraDatabaseName` |
| `AURORA_ENABLED` | `true` | — |
| `BEDROCK_ENABLED` | `true` | — |

> **For team members:** You do not need to do anything for this step. Run locally with mock data (`AURORA_ENABLED` not set = mock). Deploy to Vercel to test against real Aurora.

---

### Step 8 — Delete backend/

Once Steps 3–5 are complete and verified, delete the entire `backend/` directory. It has no role in the Vercel deployment.

```bash
rm -rf backend/
```

---

### Step 9 — Verify the build

```bash
npm run build
```

Should produce zero errors. Then:

```bash
npm run dev
```

Hit the following to confirm the routes are registered:
- `POST /api/ai/risk-score`
- `POST /api/ai/generate-strategy`
- `GET /api/ai/strategies/:loanId`
- `POST /api/recovery/recommend` (existing, should still work)

---

## Responsibility Split

| Task | Owner |
|---|---|
| Step 1 — Move Next.js app to root | Frontend |
| Step 2 — Add AWS SDK deps | Frontend |
| Step 3 — Port AI service (bedrock.ts) | Backend |
| Step 4 — Port DB service (AuroraDataRepository.ts) | Backend |
| Step 5 — Port 3 route handlers | Backend |
| Step 6 — Wire real repository in services/index.ts | Frontend |
| Step 7 — Set env vars | Both |
| Step 8 — Delete backend/ | Backend (confirm with team first) |
| Step 9 — Build verification | Both |

---

## What Does NOT Change

| Item | Status |
|---|---|
| `infra/` (CDK stack) | Untouched — run locally |
| `database/sql/001_schema.sql` | Untouched — run locally |
| `infra/scripts/` (create-app-user, migrate) | Untouched — run locally |
| All frontend pages and components | Untouched — move only |
| All TypeScript types | Untouched — move only |
| Mock data layer | Untouched — kept for local dev |
| IDataRepository interface | Untouched |

---

## Notes

- The Express `backend/` was never connected to the frontend. The frontend runs entirely on mock data today. After this migration, the real Aurora + Bedrock integration gets wired in for the first time.
- Region mismatch exists: Aurora is in `eu-west-2`, Bedrock (Nova Pro) requires `us-east-1`. Use `BEDROCK_REGION` as a separate env var to handle this — the Bedrock client reads `BEDROCK_REGION`, the RDS client reads `AWS_REGION`.
- Zod validation from the Express handlers should be kept in the Next.js route handlers — it's already well structured and converts cleanly.
