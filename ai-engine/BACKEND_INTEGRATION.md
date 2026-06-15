# Backend Integration: AI Engine

This document outlines the technical implementation for integrating the AI Engine (AWS Nova) with the Node.js backend.

## 🏗️ Architecture Overview

The backend acts as the secure bridge between the client (UI) and the AWS Bedrock environment. It handles authentication, data validation, and state persistence.

## 🛣️ API Endpoints

### 1. `POST /api/ai/risk-score`
- **Description:** Triggers a dynamic risk assessment for a specific loan/borrower.
- **Input:** `loanId`, `borrowerId`.
- **Logic:** Fetches transaction history from Aurora -> **Sanitizes data (Prompt Injection Prevention)** -> Sends to AWS Nova -> Updates `ai_insights` table.

### 2. `POST /api/ai/generate-strategy`
- **Description:** Generates a draft recovery plan.
- **Input:** `riskScore`, `loanTerms`, `borrowerContext`.
- **Logic:** **Sanitizes input context** -> Passes structured prompt to AWS Nova -> Returns Markdown-formatted strategy -> Saves to `strategies` table.

### 3. `GET /api/ai/strategies/[loanId]`
- **Description:** Retrieves all generated strategies for a loan.
- **Output:** List of strategy objects (Draft/Approved).

## 🔐 Security & Middleware

- **Authentication:** All AI-related endpoints are protected by **AWS Cognito**. The session token must be validated before any AI processing occurs.
- **Multi-Tenancy:** Every request must include a `lender_id` (extracted from the Cognito token) to ensure data isolation.
- **Rate Limiting:** AWS Bedrock has specific throughput limits (tokens per minute). The backend implements **token-bucket rate limiting** at the API route level and utilizes exponential backoff for SDK retries to manage Bedrock's `ThrottlingException`.
- **Prompt Injection Prevention:** All user-provided or database-sourced data included in AI prompts must be sanitized. We use XML-style delimiters (`<data>...</data>`) and a strong System Prompt to ensure the model treats input as data, not instructions.

## 🛠️ Implementation Details

### Core Utilities (`ai-engine/services/`)

- **Database Client:** `db.ts` - Manages PostgreSQL connections.
- **AI Utility:** `ai.ts` - Handles AWS Bedrock communication and sanitization.

### API Handlers (`ai-engine/handlers/`)

These handlers contain the core logic for the AI features and are called by thin wrappers in the `app/api` directory.

1. **Risk Scoring:** `risk-score.ts`
2. **Strategy Generation:** `generate-strategy.ts`
3. **Strategy Retrieval:** `get-strategies.ts`

### Database Schema

- **AI Schema:** `ai-engine/sql/schema.sql` - Defines `ai_insights` and `strategies` tables.

### Next.js API Wrappers (`app/api/ai/`)

These files act as the entry points for Next.js routing and delegate logic to the handlers in `ai-engine`.

- `risk-score/route.ts`
- `generate-strategy/route.ts`
- `strategies/[loanId]/route.ts`

### Security & Sanitization

Input sanitization is implemented in `lib/ai.ts` via the `sanitizeForAI` function. It wraps data in `<data>` tags and redacts common injection keywords (e.g., "ignore all previous instructions").

### Fallback Logic

The system automatically falls back to `amazon.nova-lite-v1:0` if `amazon.nova-pro-v1:0` encounters throttling or service availability issues, ensuring high availability for risk assessments.

## 📊 Error Handling
- **Model Timeouts:** Implement retries with exponential backoff.
- **Data Truncation:** Ensure input data fits within the model's context window (token limit).
- **Fallback Logic:** If Nova Pro (high reasoning) is unavailable or encounters high latency, the system fails over to **Nova Lite**. 
    *   **Implementation:** A wrapper function catches Bedrock errors and re-attempts the request with the `amazon.nova-lite-v1:0` model ID.
    *   **Implications:** Fallback results may have reduced nuance in strategy generation but ensure high availability for core risk scoring.
