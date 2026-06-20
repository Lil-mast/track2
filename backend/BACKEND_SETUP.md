# RecoveryAI Backend Setup (Node.js/Express)

This backend has been migrated from Next.js to a standard Node.js application using the Express framework and JavaScript (ES Modules).

## Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm
- AWS Account with access to Aurora Serverless (Data API) and Amazon Bedrock

## Directory Structure

```text
backend/
├── src/
│   ├── index.js          # Entry point and Express app configuration
│   ├── handlers/         # API route handlers
│   │   ├── generate-strategy.js
│   │   ├── get-strategies.js
│   │   └── risk-score.js
│   └── services/         # Shared services (Database, AI)
│       ├── ai.js
│       └── db.js
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── ...
```

## Setup Instructions

1.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in the `backend/` directory with the following variables:
    ```env
    # --- AWS Credentials ---
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=your_access_key
    AWS_SECRET_ACCESS_KEY=your_secret_key

    # --- Aurora Database (Data API) ---
    AURORA_CLUSTER_ARN=arn:aws:rds:region:account:cluster/cluster-name
    AURORA_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:secret-name
    AURORA_DATABASE=recoveryai
    ```

    > **⚠️ Production Security Note:**  
    > Using `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` directly is acceptable for local development, but is a **security risk for production deployments**. In production, prefer:
    > - **IAM Roles** (for EC2, ECS, Lambda, etc.) — the AWS SDK will automatically pick up credentials from the instance metadata.
    > - **AWS SSO / Temporary credentials** via `AWS_SESSION_TOKEN`.
    > - **Environment injection** by your CI/CD pipeline (e.g., GitHub Actions OIDC, AWS CodeBuild).
    >
    > Never commit long-lived access keys to source control.

3.  **Running the Server:**
    -   Development mode (with auto-reload):
        ```bash
        pnpm dev
        ```
    -   Production mode:
        ```bash
        pnpm start
        ```

## Database

This backend connects to **Amazon Aurora Serverless v2** via the **RDS Data API** (`@aws-sdk/client-rds-data`). It does **not** use a direct PostgreSQL driver like `pg` — all queries are sent through the Data API using the cluster and secret ARNs.

The `db.js` service automatically validates that `AURORA_CLUSTER_ARN` and `AURORA_SECRET_ARN` are present at startup and will log a clear error if they are missing.

## API Routes

-   `POST /api/ai/risk-score`: Calculates a dynamic risk score for a borrower.
-   `POST /api/ai/generate-strategy`: Generates an AI-powered recovery strategy for a loan.
-   `GET /api/ai/strategies/:loanId`: Retrieves all strategies associated with a specific loan.
-   `GET /health`: Basic health check endpoint.

## AI Engine

The backend integrates with **AWS Bedrock (Amazon Nova Pro)** to perform risk analysis and strategy generation. Serverless foundation models are automatically enabled across all AWS commercial regions when first invoked, so no manual activation in the Bedrock console is required.

### Security

The AI service includes multi-layered sanitization to protect against prompt injection attacks:
- **Input length limiting** — truncates excessively long payloads.
- **Unicode normalization** — strips zero-width and invisible characters used for obfuscation.
- **Pattern-based redaction** — detects and redacts 30+ known injection techniques including role hijacking, delimiter injection, encoding tricks, and data exfiltration attempts.
- **XML boundary wrapping** — clearly delineates user-supplied data from system instructions.

### Resilience

Automatic fallback to **Nova Lite** in case of throttling or service unavailability.
