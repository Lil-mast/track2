# RecoverIQ — B2B Loan Recovery SaaS

AI-powered loan recovery platform for B2B lenders. Lenders use RecoverIQ to monitor delinquent loans, configure recovery rules, review AI-generated recommendations, and maintain a full audit trail.

Built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**. Uses mock data today; architecture is ready for **AWS Aurora PostgreSQL**, **Cognito**, and **Bedrock / Nova**.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check without building |

### Troubleshooting

**SWC binary failed to download** — Next.js needs `@next/swc-win32-x64-msvc` (or your platform equivalent). If the auto-download times out:

```bash
npm install @next/swc-win32-x64-msvc --save-optional
npm run dev
```

**Port in use** — run on another port: `npm run dev -- -p 3001`

---

## Features

### Dashboard & Portfolio
- Portfolio KPIs: total loans, active, overdue, high-risk accounts
- Recent AI recommendations and top overdue accounts
- Borrower and loan list/detail views with risk badges and payment history

### Recovery Rules
- Lender-specific rules (days overdue, missed payments, risk score, balance threshold)
- Priority ordering, auto-execute flags, and cooldown settings

### AI Recovery Engine (simulated)
End-to-end pipeline that processes loan context and produces an actionable recovery decision:

```
Loan Data + Payment History + Days Overdue + Contact History
        ↓
   Risk Scoring Engine
        ↓
   Mock AI Recommendation
        ↓
   Business Rule Validation
        ↓
   Final Action
        ↓
   Audit Log
```

The full workflow is visualized on **`/recovery/[id]`** with a step-by-step panel and **Re-run Simulation** button.

### Audit Logs
- Compliance trail for user actions and AI engine runs
- Runtime audit entries appended when the recovery engine executes

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — portfolio stats, recent AI recommendations, overdue accounts |
| `/borrowers` | Borrower list |
| `/borrowers/[id]` | Borrower profile, risk score, linked loans |
| `/loans` | Loan portfolio with status filters |
| `/loans/[id]` | Loan detail, payment history, linked recommendations |
| `/recovery` | AI recovery recommendations list |
| `/recovery/[id]` | Recommendation detail + **live AI engine workflow** |
| `/rules` | Lender recovery rule configuration |
| `/audit-logs` | Compliance audit trail |

---

## API

### `POST /api/recovery/recommend`

Runs the AI Recovery Engine for a loan and returns the full workflow result.

**Request**
```json
{
  "loanId": "loan_011",
  "lenderId": "lender_001"
}
```

`lenderId` is optional — defaults to `lender_001`.

**Response** (excerpt)
```json
{
  "workflowId": "wf_...",
  "loanId": "loan_011",
  "riskAssessment": { "score": 82, "level": "critical", "factors": [...] },
  "aiRecommendation": {
    "recommendedAction": "escalate",
    "riskScore": 82,
    "reasoning": "...",
    "nextStep": "..."
  },
  "ruleValidation": {
    "matchedRules": [...],
    "finalRecoveryAction": "legal_notice",
    "requiresManualApproval": true
  },
  "finalAction": {
    "action": "legal_notice",
    "label": "Legal Notice",
    "autoExecute": false
  },
  "auditLogId": "audit_013"
}
```

**AI action values:** `remind` · `renegotiate` · `escalate`

**Example**
```bash
curl -X POST http://localhost:3000/api/recovery/recommend \
  -H "Content-Type: application/json" \
  -d "{\"loanId\":\"loan_011\"}"
```

---

## Architecture

```
src/
├── app/
│   ├── (dashboard)/          # UI pages (dashboard, borrowers, loans, recovery, rules, audit)
│   ├── api/recovery/recommend/  # POST — AI Recovery Engine
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/               # AppSidebar, AppHeader
│   ├── recovery/             # RecoveryWorkflowPanel
│   ├── shared/               # StatCard, StatusBadge, PageHeader
│   └── ui/                   # shadcn primitives
├── config/
│   ├── navigation.ts
│   └── aws.ts                # Future AWS env config
├── data/mock/
│   ├── *.ts                  # Seed data (lenders, borrowers, loans, …)
│   └── runtime-store.ts      # In-memory audit log append (dev/MVP)
├── lib/                      # utils, constants, labels
├── services/
│   ├── interfaces/           # IDataRepository contract
│   ├── mock/                 # MockDataRepository (current)
│   ├── recovery-engine/      # Risk scorer, AI generator, rules validator, orchestrator
│   ├── aurora/               # Future PostgreSQL repo
│   ├── auth/                 # Future Cognito auth
│   └── ai/                   # Future Bedrock Nova client
└── types/                    # Domain + recovery-engine interfaces
```

### Data flow

1. **Pages** call `getDataRepository()` and read via `IDataRepository`.
2. **Recovery engine** loads loan context from mock data, scores risk, generates AI output, validates lender rules, writes audit log.
3. **Swap point** — change `getDataRepository()` to return `AuroraDataRepository` when the database is connected; pages and API stay unchanged.

### Mock data (seed)

| Entity | Count | Notes |
|--------|-------|-------|
| Lenders | 2 | Default tenant: `lender_001` (Meridian Capital) |
| Borrowers | 8 | B2B companies, risk scores, contact history |
| Loans | 14 | Active, overdue, default, paid off |
| Payments | 20 | Paid, missed, partial |
| Recommendations | 8 | Pending, approved, executed, rejected |
| Rules | 10 | 9 active, 1 inactive |
| Audit logs | 12+ | Grows when engine runs |

Borrowers are **seed data only** — they do not have login accounts in this MVP.

---

## AI Recovery Engine modules

| File | Responsibility |
|------|----------------|
| `context-builder.ts` | Assembles loan, payments, contact history |
| `risk-scorer.ts` | Weighted composite score (0–100) + risk level |
| `ai-generator.ts` | Mock AI → `remind` / `renegotiate` / `escalate` |
| `rules-validator.ts` | Matches lender rules, may escalate final action |
| `audit-logger.ts` | Persists workflow result to audit trail |
| `index.ts` | `runRecoveryEngine()` orchestrator |

To connect **Amazon Nova**, replace `generateAIRecommendation()` in `ai-generator.ts` with a Bedrock call — the rest of the pipeline is unchanged.

---

## Deploy to Vercel

```bash
npm run build
```

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Deploy — no environment variables required for the mock MVP.

---

## Future AWS integration

Configuration stubs live in `src/config/aws.ts`. Enable services via environment variables:

```env
# Aurora PostgreSQL
AURORA_ENABLED=true
AURORA_HOST=your-cluster.cluster-xxx.us-east-1.rds.amazonaws.com
AURORA_PORT=5432
AURORA_DATABASE=recoveriq
AURORA_SSL=true

# Cognito
COGNITO_ENABLED=true
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxx
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxx

# Bedrock / Nova
BEDROCK_ENABLED=true
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
BEDROCK_REGION=us-east-1
AWS_REGION=us-east-1
```

| Service | Integration point |
|---------|-------------------|
| **Aurora** | Implement `AuroraDataRepository` → swap in `getDataRepository()` |
| **Cognito** | Replace mock session in `services/auth/cognito.ts` + Next.js middleware |
| **Bedrock** | Replace mock generator in `services/recovery-engine/ai-generator.ts` |

---

## What to do now

Recommended order for taking this from MVP to production:

### 1. Run and explore locally
- Start the app and walk through every page.
- Open **`/recovery/rec_001`** (or any recommendation) and review the **AI Recovery Engine Workflow** panel.
- Hit **`POST /api/recovery/recommend`** with different `loanId` values (`loan_001`, `loan_011`) to see remind vs renegotiate vs escalate outcomes.
- Re-run the simulation and confirm new entries appear on **`/audit-logs`**.

### 2. Initialize Git and deploy
```bash
git init
git add .
git commit -m "Initial RecoverIQ MVP with AI Recovery Engine"
```
Connect to GitHub and deploy to Vercel for a shareable preview URL.

### 3. Wire approve / reject / execute (next feature)
The recovery detail page has placeholder buttons. Add server actions that:
- Update recommendation status in the data layer
- Log approve/reject/execute to audit trail
- Optionally trigger the final action (email/SMS simulation)

### 4. Connect Aurora PostgreSQL
- Add Drizzle or Prisma with schemas matching `src/types/*`
- Implement `AuroraDataRepository`
- Migrate seed data to SQL
- Replace `runtime-store` audit append with database inserts

### 5. Add Cognito authentication
- User Pool with lender org groups
- Middleware to protect `(dashboard)` routes
- Pass real `lenderId` from session instead of `DEFAULT_LENDER_ID`

### 6. Replace mock AI with Bedrock Nova
- Implement `services/ai/bedrock.ts` with structured JSON prompts
- Swap `ai-generator.ts` to call Bedrock while keeping risk scoring and rule validation

### 7. Production hardening
- Rate-limit `/api/recovery/recommend`
- Add error monitoring (Sentry)
- Scheduled jobs for overdue loan scans and auto-recommendations
- Export/reporting for audit logs

---

## License

Private — B2B Loan Recovery SaaS MVP.
