# Backend Setup & Functionality Guide

This document provides a comprehensive overview of the RecoveryAI backend architecture, its core functionalities, and instructions on how to set up and run the environment.

## 🏗️ Architecture Overview

The RecoveryAI backend is built with **Next.js (App Router)** and designed to be a secure orchestrator between the frontend, the database, and AI services.

### Core Tech Stack
| Component | Technology |
|---|---|
| **Package Manager** | **pnpm** |
| **API Runtime** | Vercel Functions (Node.js) via Next.js |
| **Database** | AWS Aurora PostgreSQL (Serverless v2) |
| **Authentication** | AWS Cognito (Lender Dashboard) |
| **AI Engine** | AWS Bedrock (Nova Pro & Nova Lite) |

---

## 📂 Backend Structure

The entire backend application is consolidated within this `backend/` directory:

- **`ai-engine/`**: The heart of the platform's intelligence.
    - `handlers/`: Pure business logic for AI operations.
    - `services/`: Low-level utilities for Bedrock and DB connections.
    - `sql/`: AI-specific database schemas.
- **`database/`**: General database documentation and core schemas.
- **`app/`**: Next.js application directory containing API routes and layout.
    - `app/api/ai/`: API routes that delegate to handlers.

---

## 🗄️ AWS Aurora Database

We use **AWS Aurora PostgreSQL** for its serverless scalability and relational integrity.

### Schema Management
Apply the schemas from within the `backend/` directory:
1.  **Core Schema**: `database/sql/001_schema.sql`
2.  **AI Schema**: `ai-engine/sql/schema.sql`

---

## 🤖 AI Engine Functionality

The AI Engine utilizes **AWS Nova** models (Pro/Lite) via AWS Bedrock. It features:
- **Risk Scoring**: payment trend analysis.
- **Strategy Generation**: Markdown-formatted recovery plans.
- **Fallback**: Automatic switch to Nova Lite during Pro throttling.

---

## 🚀 Setup & Execution

**All commands must be run from within the `backend/` directory.**

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Create a `.env` file in the `backend/` directory (refer to `.env.example`).

### 3. Initialize Database
```bash
# configure to AWS Aurora
psql $DATABASE_URL -f database/sql/001_schema.sql
psql $DATABASE_URL -f ai-engine/sql/schema.sql
```

### 4. Run Development Server
```bash
pnpm dev
```
The application will be available at `http://localhost:3000`.

---

## 🧪 Testing
See **`ai-engine/TESTING.md`** for detailed API testing instructions and `curl` examples.
