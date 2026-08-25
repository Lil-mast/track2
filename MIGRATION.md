# RecoveryAI — Migration Guide

**Current stack:** Next.js on Vercel + **Convex** (database) + **AWS Bedrock** (AI).

---

## Convex migration (complete)

The app previously used mock data locally and Aurora PostgreSQL in production. That dual-path has been replaced with a **single Convex data layer**.

| Removed | Replaced by |
|---------|-------------|
| `src/data/mock/` | `convex/seed.ts` + `pnpm seed` |
| `MockDataRepository` | `ConvexDataRepository` |
| `AuroraDataRepository` + RDS Data API | Convex queries/mutations in `convex/repository.ts` |
| `infra/` (Aurora CDK) | Convex cloud deployment |
| Orphan mock API routes | Repository reads in Server Components |
| `/demo` Aurora ping | N/A — Convex is always live |

---

## Local development

1. **Terminal 1 — Convex**
   ```bash
   pnpm run dev:convex
   ```
   Links a Convex project and syncs functions. Copies `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.

2. **Seed demo data (first time)**
   ```bash
   pnpm seed
   ```

3. **Terminal 2 — Next.js**
   ```bash
   pnpm dev
   ```

Dashboard loads the demo lender (`b0000001-0000-0000-0000-000000000001`) with borrowers, loans, strategies, rules, and audit logs.

---

## Vercel deployment

Set in the Vercel project:

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_CONVEX_URL` | From Convex dashboard |
| `CONVEX_DEPLOY_KEY` | Production deploy key for server `fetchQuery` |
| `BEDROCK_ENABLED` | `true` to enable AI routes |
| `BEDROCK_REGION` | `us-east-1` (Nova) |
| `AWS_REGION` | Same as Bedrock region |

Deploy Convex functions before or with each release:
```bash
npx convex deploy
```

---

## Repository pattern

```typescript
// src/services/index.ts
export function getDataRepository(): IDataRepository {
  return convexDataRepository;
}
```

All dashboard pages use `getDataRepository()`. API routes use `fetchQuery` / `fetchMutation` from `@/lib/convex/server`.

---

## AI routes (Bedrock)

| Route | Reads | Writes |
|-------|-------|--------|
| `POST /api/ai/risk-score` | Convex loan + schedule | `aiInsights`, loan risk score |
| `POST /api/ai/generate-strategy` | Convex loan | `strategies` |
| `GET /api/ai/strategies/[loanId]` | Convex strategies | — |
| `PATCH /api/ai/strategy/[id]` | — | strategy status + audit log |
| `POST /api/recovery/recommend` | Convex via repository | strategy + audit log |

---

## Regenerating Convex types

After changing `convex/` functions:
```bash
npx convex codegen
```
Commit updated `convex/_generated/` or run codegen in CI with `CONVEX_DEPLOY_KEY` set.

---

## Legacy reference

SQL schema and entity documentation remain in `database/sql/001_schema.sql` and `database/DATA_ARCHITECTURE.md` for domain reference. Convex schema is defined in `convex/schema.ts`.
