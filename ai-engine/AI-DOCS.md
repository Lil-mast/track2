# AI Engine Documentation

The AI Engine is the core intelligence layer of RecoveryAI, leveraging **AWS Nova** (via AWS Bedrock) to transform raw financial data into actionable recovery strategies. It focuses on moving from reactive debt collection to proactive, data-driven borrower engagement.

## 🚀 Core Functionality

### 1. Risk Scoring (Dynamic Assessment)
- **Objective:** Predict the probability of default before it happens.
- **Mechanism:** Analyzes payment patterns, **sliding dates** (the trend of a borrower making payments progressively later each month, signaling liquidity stress), and historical behavior.
- **Output:** A dynamic risk score (0-100) that triggers specific workflows.

### 2. Strategy Generation (Automated Drafting)
- **Objective:** Create customized recovery plans for at-risk borrowers.
- **Mechanism:** Uses LLMs to draft **"Human-in-the-Loop"** recommendations.
- **Interaction:** AI-generated strategies are presented as editable "Drafts" in the dashboard. Loan officers must review, modify, or approve the strategy before it is dispatched to the borrower, ensuring compliance and empathy.
- **Output:** Structured recovery plans (e.g., restructuring terms, grace periods, or specific outreach scripts).

### 3. Sentiment Analysis (Future Feature)
- **Objective:** Tailor outreach based on the tone of previous communications.
- **Mechanism:** Analyzes email transcripts and call logs.
- **Output:** Communication style flags (e.g., "Frustrated," "Cooperative") to guide recovery officers.

---

## 🔄 Backend Synchronization

The AI Engine is integrated into the **Next.js API Routes**, which serve as the primary backend orchestrator. These routes handle the business logic and use the AWS SDK to interface directly with Bedrock and Step Functions.

### Integration Flow:
1. **Trigger:** A scheduled job (Amazon EventBridge) or a manual UI action triggers an analysis.
2. **Orchestration:** **AWS Step Functions** manage the multi-step pipeline to ensure reliability and observability:
    *   **Step 1: Data Aggregation:** Fetches borrower history and loan terms from Amazon Aurora.
    *   **Step 2: Risk Assessment:** Invokes AWS Nova to calculate the dynamic risk score.
    *   **Step 3: Conditional Logic:** If risk exceeds a threshold (e.g., >70), proceeds to strategy generation.
    *   **Step 4: Strategy Generation:** Invokes AWS Nova to draft a tailored recovery plan.
    *   **Step 5: Persistence:** Saves scores and drafts to the database and notifies the lender.
3. **Execution:** The backend calls the Bedrock SDK using the `aws-nova` model family.

---

## 🗄️ Database Synchronization (Amazon Aurora PostgreSQL)

The AI Engine interacts with the relational database to ensure data integrity and multi-tenancy.

### Data Input:
- **Borrower Data:** Demographics, historical repayment rates.
- **Loan Data:** Interest rates, term progress, current delinquency status.
- **Tenant Context:** Uses **`lender_id`** to ensure multi-tenancy. This ID is extracted from the authenticated AWS Cognito JWT and enforced as a mandatory filter in all database queries and AI prompts to prevent cross-tenant data leakage.

### Data Persistence:
- **AI Insights Table:** Stores history of risk scores for trend analysis.
- **Strategy Table:** Stores drafted and approved recovery plans.
- **Audit Logs:** Every AI recommendation is logged with the model version and input parameters for compliance and auditing.

---

## 🛠️ Tech Stack
- **Model:** AWS Nova (Pro/Lite) via Amazon Bedrock.
- **SDK:** AWS SDK for JavaScript (v3).
- **Orchestration:** AWS Step Functions & Amazon EventBridge.
- **Storage:** Amazon Aurora PostgreSQL.
