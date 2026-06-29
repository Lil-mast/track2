# AI_WORKFLOWS.md — AWS Bedrock AI Pipeline (RecoveryAI)

## 1) Purpose

RecoveryAI uses AWS Bedrock (currently AWS Nova Pro/Lite) to generate **risk scores** and **recovery strategies** for loans. The system is designed for:

- **Tenant isolation** (each lender only sees/affects its own data)
- **Human-in-the-loop** for any high-impact actions
- **Security & compliance** patterns (prompt injection hardening, secret handling, audit trails)
- **Operational resilience** (fallback from Nova Pro to Nova Lite on throttling)

This document describes the current architecture as implemented in the repo.

---

## 2) High-level architecture

### Components

- **Next.js (Vercel)**
  - UI
  - API routes for AI operations and human review
- **Aurora PostgreSQL**
  - Stores portfolio data and AI outputs
- **AWS Cognito**
  - Auth for lenders (JWT → tenant scoping)
- **AWS Bedrock Runtime**
  - Hosts the model (Nova Pro / Nova Lite)
- **(Planned) AWS orchestration**
  - `Step Functions` + `EventBridge` are mentioned in data architecture docs for pipelining/automation

### Data stores

- `ai_insights`: stores AI risk scoring runs (score + reasoning + model id)
- `strategies`: stores AI-drafted recovery plans (draft/approved/rejected/executed)
- `audit_logs`: compliance-grade audit trail for AI + human actions

---

## 3) Core pipeline flows

### Flow A — Risk scoring pipeline (`POST /api/ai/risk-score`)

**Entry point:** `src/app/api/ai/risk-score/route.ts`

1. **Feature flag**
   - If `BEDROCK_ENABLED=false`, returns `503`.

2. **Input validation**
   - Zod schema validates `loanId`, `borrowerId`, `lenderId` are UUIDs.

3. **Tenant-scoped DB reads (authorization by query)**
   - Loads the loan joined with borrower fields:
     - `WHERE l.id = :loanId AND l.borrower_id = :borrowerId AND l.lender_id = :lenderId`
   - Loads repayment schedule:
     - `SELECT * FROM repayment_schedule WHERE loan_id = :loanId ...`

4. **Prompt injection & unsafe content hardening**
   - The route builds an input object and sanitizes it via:
     - `src/services/ai/bedrock.ts -> sanitizeForAI(aiInput)`
   - Hardening includes:
     - trimming overly long inputs (`MAX_INPUT_LENGTH = 50000`)
     - stripping dangerous Unicode control characters
     - redacting common prompt-injection patterns by regex and replacing with
       `"[REDACTED:<label>]"`

5. **Model invocation**
   - `invokeNova(systemPrompt, userPrompt)` calls Bedrock Runtime:
     - uses `InvokeModelCommand`
     - sends `{ system, messages:[{ role:"user", content:[{ text }] }], inferenceConfig }`
   - If Nova Pro throttles, it falls back to Nova Lite.

6. **Output parsing**
   - The handler extracts a JSON object from the model output using a regex match:
     - `aiResponse.match(/\{[\s\S]*\}/)`
   - Parses `{ risk_score, reasoning }`.

7. **Persist results**
   - Inserts into `ai_insights` (includes `model_id`):
     - `INSERT INTO ai_insights (...) VALUES (...)`
   - Updates cached score:
     - `UPDATE loans SET latest_risk_score = :riskScore WHERE id = :loanId`

**Result:** JSON response includes `riskScore` and `reasoning`.

---

### Flow B — Strategy generation pipeline (`POST /api/ai/generate-strategy`)

**Entry point:** `src/app/api/ai/generate-strategy/route.ts`

1. **Feature flag**
   - If `BEDROCK_ENABLED=false`, returns `503`.

2. **Input validation**
   - Zod validates:
     - `loanId` UUID
     - `riskScore` numeric bounds `[0..100]`
     - `lenderId` UUID

3. **Tenant-scoped loan read**
   - Loads loan + borrower:
     - `WHERE l.id = :loanId AND l.lender_id = :lenderId`

4. **Prompt injection & unsafe content hardening**
   - Sanitizes context via `sanitizeForAI()` before constructing prompts.

5. **Model invocation**
   - Uses a dedicated recovery-strategist system prompt with required structure
     and instructs Markdown output.

6. **Persist strategy draft**
   - Inserts into `strategies` as `status='draft'`:
     - `INSERT INTO strategies (loan_id, lender_id, content, status, model_id, risk_score_at_creation) ...`

**Result:** returns the new draft strategy record (`id`, `content`, `status`, `createdAt`).

---

### Flow C — Human-in-the-loop review & execution (`PATCH /api/ai/strategy/[id]`)

**Entry point:** `src/app/api/ai/strategy/[id]/route.ts`

1. **Input validation**
   - Zod validates:
     - `action ∈ { approve, reject, execute }`
     - `lenderId` UUID

2. **Tenant-scoped update**
   - Updates only rows owned by the lender:
     - `WHERE id = :id AND lender_id = :lenderId`

3. **Status transition rules**
   - `approve` sets `status='approved'`, `approved_at`, `reviewed_at`
   - `reject` sets `status='rejected'`, `reviewed_at`
   - `execute` sets `status='executed'`, `executed_at`, ensures `approved_at` exists

4. **Best-effort audit logging**
   - Attempts an `audit_logs` insert containing:
     - actor identity (using lender name/email as “actor” for this log)
     - action verb (Approved/Rejected/Executed)
     - entity type `recommendation`
     - `ip_address` and `user_agent` from request headers
   - Logging failures are non-fatal.

**Result:** returns `success:true` and the updated strategy row.

---

## 4) Deterministic “Recovery Engine” orchestration (AI + rules + audit)

Even when Bedrock is used for actual model calls, the repo also includes a deterministic recovery engine to:
- structure context,
- compute a risk score,
- generate an AI-style recommendation (local logic),
- validate against lender rules,
- decide manual vs auto execution,
- and write audit logs.

**Entry point:** `src/services/recovery-engine/index.ts`  
**Subcomponents:**
- `context-builder.ts`: creates `WorkflowInputContext` (mock vs Aurora)
- `risk-scorer.ts`: deterministic scoring → level mapping (0-100)
- `ai-generator.ts`: selects action (`remind/renegotiate/escalate`) and produces reasoning/nextStep (mock logic)
- `rules-validator.ts`: matches active lender rules and refines/adjusts actions
- `audit-logger.ts`: writes `audit_logs` (Aurora path) or mock runtime store

This engine acts as a clear pattern/template for the full AI pipeline:
**context → risk → recommendation → rule validation → final action → audit**

---

## 5) Bedrock client & security controls

### 5.1 Credentials & invocation security

**File:** `src/services/ai/bedrock.ts`

- Uses AWS SDK:
  - `BedrockRuntimeClient`
  - `InvokeModelCommand`
- Uses Vercel OIDC credentials provider:
  - `awsCredentialsProvider({ roleArn })` when `AWS_ROLE_ARN` is present
- Otherwise, falls back to default environment credentials (typically for local development).

### 5.2 Prompt injection hardening

**File:** `src/services/ai/bedrock.ts`

Before sending any user/record data to the model, `sanitizeForAI()`:

- Enforces a maximum serialized length (`MAX_INPUT_LENGTH`)
- Removes dangerous Unicode control characters and bidi markers
- Redacts prompt injection patterns using a curated regex list, replacing matched text with:
  - `"[REDACTED:<label>]"`

The intention is to reduce the chance that malicious content embedded in loan metadata or notes can:
- override system instructions
- exfiltrate hidden prompt content
- trigger role/policy hijacks

### 5.3 Input/output safety expectations

- **Input** is sanitized with redaction + delimiter-like wrapping:
  - returns a string in the form: `<data>...sanitized json...</data>`
- **Output parsing** in `/risk-score` expects JSON inside the model response.
  - It uses regex extraction of `{ ... }` and then `JSON.parse`.

In a production hardening phase, consider:
- stricter output validation (schema validation for all fields)
- enforcing model output formatting (where supported)
- adding retry logic on parsing failure

---

## 6) Tenant isolation & authorization model

The repo follows a **server-enforced multi-tenant** design:

- Tenant identity is passed into API routes as `lenderId`
- DB queries are explicitly tenant-scoped using:
  - `... WHERE ... AND lender_id = :lenderId`

Examples:
- `risk-score` route checks both:
  - `l.id = :loanId`
  - `l.borrower_id = :borrowerId`
  - `l.lender_id = :lenderId`
- `generate-strategy` route ensures:
  - strategies are created only for the lender’s loan
- `strategy PATCH` ensures updates only occur for:
  - `WHERE id = :id AND lender_id = :lenderId`

**Key principle:** the frontend must not be trusted for authorization. Tenant scoping is enforced by server-side SQL conditions.

---

## 7) Auditability & compliance logging

### 7.1 Aurora `audit_logs` writes

**File:** `src/services/recovery-engine/audit-logger.ts`

- Writes an `audit_logs` record with:
  - `lender_id`
  - `user_id` (system_ai for engine workflow logs)
  - action (audit action)
  - entity type/id/label
  - description (includes risk score and rules decision)
  - `ip_address` and `user_agent`
- Uses a fire-and-forget write:
  - failures are non-fatal

### 7.2 Strategy review audit

**File:** `src/app/api/ai/strategy/[id]/route.ts`

- Best-effort audit log insert after status change
- Non-fatal on error

### 7.3 Mock compliance endpoint

**File:** `src/app/api/compliance/route.ts`

- Provides mock compliance logs and regulatory checks.
- Sets `Cache-Control: no-store`.

---

## 8) Secrets, secrets manager, and runtime credential posture

**File:** `infra/README.md`

Security model goals implemented (for infrastructure portion):

- **Secrets Manager separation**
  - `recoveryai_admin` (master secret) used locally for migrations/DDL only
  - `app_user` (DML-only secret) is the only secret Vercel can read at runtime
- **Vercel OIDC federation**
  - avoids long-lived AWS access keys
- **NAT-free VPC**
  - uses service endpoints instead of NAT for Aurora Data API access
- **No secret leakage**
  - stack outputs are ARNs/identifiers only
  - `.env` and logs are git-ignored

---

## 9) Configuration knobs

**File:** `src/config/aws.ts`

- `BEDROCK_ENABLED` (feature flag)
- `BEDROCK_MODEL_ID` (default: `amazon.nova-pro-v1:0`)
- `BEDROCK_REGION`
- `AWS_ROLE_ARN` (enables role-based Bedrock Runtime access)

---

## 10) Operational note: Where Step Functions/EventBridge fit

The data architecture doc describes an intended orchestration style:
- `EventBridge scheduled job` or lender actions trigger AI steps
- `Step Functions` executes:
  - data aggregation
  - risk assessment (Nova)
  - persist insights
  - conditional strategy generation
  - notification writes

Current API routes demonstrate the same logic paths, executed in HTTP request handlers.
This repo already includes a deterministic orchestration engine (`runRecoveryEngine`) that matches the intended pipeline structure.

When the automation stack is wired:
- Step Functions can call the same services or refactor the core logic into callable modules
- ensure the tenant context (lenderId/loanId) is carried through securely

---

## 11) Code-to-workflow mapping (quick reference)

- **Bedrock sanitation + invocation**
  - `src/services/ai/bedrock.ts` (`sanitizeForAI`, `invokeNova`)
- **Risk scoring**
  - `src/app/api/ai/risk-score/route.ts`
- **Strategy generation**
  - `src/app/api/ai/generate-strategy/route.ts`
- **Strategy retrieval**
  - `src/app/api/ai/strategies/[loanId]/route.ts` (tenant-scoped join)
- **Human review**
  - `src/app/api/ai/strategy/[id]/route.ts`
- **Deterministic orchestration pattern**
  - `src/services/recovery-engine/index.ts`
  - `context-builder.ts`, `risk-scorer.ts`, `ai-generator.ts`, `rules-validator.ts`, `audit-logger.ts`

---

## 12) Security checklist (recommended hardening)

Based on the current code + architecture:

- ✅ Tenant enforcement via SQL `lender_id` predicates
- ✅ Prompt injection redaction + dangerous unicode stripping in `sanitizeForAI`
- ✅ Bedrock credential access via Vercel OIDC role assumption
- ✅ Audit logs for AI workflow completion and human strategy actions
- ⚠️ Output parsing robustness
  - Consider strict JSON schema validation and error-retry loops
- ⚠️ Prompt injection coverage
  - Expand regex patterns and consider structured input encoding limits
- ⚠️ Rate limiting / abuse prevention
  - Add per-tenant throttling on AI endpoints
