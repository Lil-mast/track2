# Testing Guide: RecoveryAI Backend

This guide explains how to verify the AI Engine and the Database connection. 

## 1. Responsibilities
- **AI Engine (You):** Focus on AWS Bedrock and AI logic.
- **Database (Specialist):** Manages Aurora and Data API infrastructure.

## 2. Environment Variable Validation

Ensure your `backend/.env` has the following. **Note:** AI models (Nova) require `us-east-1`.

```env
# --- AWS Credentials ---
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET

# --- Database (Aurora Data API) ---
AURORA_CLUSTER_ARN=arn:aws:rds:region:account:cluster/cluster-name
AURORA_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:secret-name
AURORA_DATABASE=recoveryai
```

> **Note:** The backend uses the **RDS Data API** via `@aws-sdk/client-rds-data`, not a direct PostgreSQL connection. There is no `DATABASE_URL` needed — authentication and connectivity are handled through the cluster and secret ARNs above.

## 3. Automated Connection Test

Run this to verify if both components are talking to each other:
```bash
node src/verify-connection.js
```

The script will check:
- ✅ All required environment variables are present
- ✅ Database connectivity via Aurora Data API
- ✅ AI Engine connectivity via AWS Bedrock

---

## 4. Manual API Testing

You can use `curl` or tools like Postman/Insomnia to test the endpoints.

### A. Health Check
Verify the server is running:
```bash
curl http://localhost:3001/health
```

### B. Calculate Risk Score
This tests both **Database (Read)** and **AI (Bedrock)**.
```bash
curl -X POST http://localhost:3001/api/ai/risk-score \
     -H "Content-Type: application/json" \
     -d '{
           "loanId": "c0000001-0000-0000-0000-000000000001",
           "borrowerId": "b0000002-0000-0000-0000-000000000002",
           "lenderId": "b0000001-0000-0000-0000-000000000001"
         }'
```
*Expected Result:* A JSON response with `riskScore` and `reasoning`.

### C. Generate Recovery Strategy
This tests **Database (Read/Write)** and **AI (Bedrock)**.
```bash
curl -X POST http://localhost:3001/api/ai/generate-strategy \
     -H "Content-Type: application/json" \
     -d '{
           "loanId": "c0000002-0000-0000-0000-000000000002",
           "riskScore": 75,
           "lenderId": "b0000001-0000-0000-0000-000000000001"
         }'
```
*Expected Result:* A JSON response with the generated strategy content.

### D. Get Strategies
This tests **Database (Read)**.
```bash
curl "http://localhost:3001/api/ai/strategies/c0000001-0000-0000-0000-000000000001?lenderId=b0000001-0000-0000-0000-000000000001"
```

---

## 5. Sample UUIDs (from Seed Data)

Use these IDs for your tests:

| Entity | Sample UUID |
| :--- | :--- |
| **Lender ID** | `b0000001-0000-0000-0000-000000000001` |
| **Borrower ID (Alice)** | `b0000002-0000-0000-0000-000000000002` |
| **Loan ID (Active)** | `c0000001-0000-0000-0000-000000000001` |
| **Loan ID (Overdue)** | `c0000002-0000-0000-0000-000000000002` |

---

## Troubleshooting

- **Database Connection Failed:** Verify that `AURORA_CLUSTER_ARN` and `AURORA_SECRET_ARN` are set correctly and that your AWS credentials have the `AmazonRDSDataFullAccess` policy attached.
- **AWS Authentication Error:** Verify your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` have permissions for `bedrock:InvokeModel`.
- **Model Not Found:** Ensure your `AWS_REGION` is set to one where `amazon.nova-pro-v1:0` is available (e.g., `us-east-1`).
