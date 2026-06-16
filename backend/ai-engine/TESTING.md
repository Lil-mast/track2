# Testing Guide: AI Engine API Endpoints

This guide provides instructions and examples for testing the RecoveryAI AI Engine API endpoints.

## 🚀 Prerequisites

1.  **Environment Variables:** Ensure your `.env` file is configured based on `.env.example` inside the `backend/` directory.
2.  **Database Seed:** Ensure the database has been seeded (run from `backend/`):
    ```bash
    psql $DATABASE_URL -f database/sql/001_schema.sql
    psql $DATABASE_URL -f ai-engine/sql/schema.sql
    ```
3.  **Local Server:** `pnpm dev` (run from `backend/`)

---

## 🛣️ API Endpoints & Test Commands

### 1. Risk Scoring
**Endpoint:** `POST /api/ai/risk-score`

```bash
curl -X POST http://localhost:3000/api/ai/risk-score \
-H "Content-Type: application/json" \
-d '{
  "loanId": "c0000001-0000-0000-0000-000000000001",
  "borrowerId": "b0000002-0000-0000-0000-000000000002",
  "lenderId": "b0000001-0000-0000-0000-000000000001"
}'
```

---

### 2. Strategy Generation
**Endpoint:** `POST /api/ai/generate-strategy`

```bash
curl -X POST http://localhost:3000/api/ai/generate-strategy \
-H "Content-Type: application/json" \
-d '{
  "loanId": "c0000001-0000-0000-0000-000000000001",
  "riskScore": 75,
  "lenderId": "b0000001-0000-0000-0000-000000000001"
}'
```

---

### 3. Retrieve Strategies
**Endpoint:** `GET /api/ai/strategies/[loanId]?lenderId=[lenderId]`

```bash
curl "http://localhost:3000/api/ai/strategies/c0000001-0000-0000-0000-000000000001?lenderId=b0000001-0000-0000-0000-000000000001"
```
