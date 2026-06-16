# Backend Integration: AI Engine

This document outlines the technical implementation for integrating the AI Engine (AWS Nova) with the Node.js backend. All AI-related code is centralized in `backend/ai-engine/`.

## 🏗️ Architecture Overview

The backend acts as the secure bridge between the client (UI) and the AWS Bedrock environment. It handles authentication, data validation, and state persistence.

## 🛣️ API Endpoints (Delegated to Handlers)

### 1. `POST /api/ai/risk-score` -> `handlers/risk-score.ts`
- **Description:** Triggers a dynamic risk assessment for a specific loan/borrower.
- **Logic:** Fetches history from Aurora -> Sanitizes data -> Sends to AWS Nova -> Updates `ai_insights`.

### 2. `POST /api/ai/generate-strategy` -> `handlers/generate-strategy.ts`
- **Description:** Generates a draft recovery plan.
- **Logic:** Sanitizes context -> Passes to AWS Nova -> Returns Markdown strategy -> Saves to `strategies`.

### 3. `GET /api/ai/strategies/[loanId]` -> `handlers/get-strategies.ts`
- **Description:** Retrieves all generated strategies for a loan.

---

## 🛠️ Implementation Details

### Core Utilities (`services/`)

- **Database Client:** `db.ts` - Manages PostgreSQL connections.
- **AI Utility:** `ai.ts` - Handles AWS Bedrock communication and sanitization.

### API Handlers (`handlers/`)

1. **Risk Scoring:** `risk-score.ts`
2. **Strategy Generation:** `generate-strategy.ts`
3. **Strategy Retrieval:** `get-strategies.ts`

### Database Schema

- **AI Schema:** `sql/schema.sql` - Defines `ai_insights` and `strategies` tables.

### Next.js API Wrappers (`app/api/ai/`)

These files act as the entry points for Next.js routing and delegate logic to the handlers in `ai-engine`.

- `risk-score/route.ts`
- `generate-strategy/route.ts`
- `strategies/[loanId]/route.ts`

---

## 🔐 Security & Sanitization
Input sanitization is implemented in `services/ai.ts` via the `sanitizeForAI` function.

## 📊 Error Handling & Fallback
If Nova Pro is unavailable or throttled, the system fails over to **Nova Lite** via the `invokeNova` utility in `services/ai.ts`.
