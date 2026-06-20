# track2 — Infrastructure (CDK)

Deploys **only Aurora** for the track2 (RecoveryAI) project:

- Aurora PostgreSQL Serverless v2, **Data API** enabled, **scale-to-zero** (0 ACU when idle, 5-min auto-pause)
- NAT-free VPC, isolated subnets (Data API reached over AWS service endpoint — no NAT cost)
- **Master secret** (`recoveryai_admin`) — generated server-side, used **locally only** for migrations/DDL
- **App-user secret** (`app_user`) — DML-only role, the **only** secret Vercel can read at runtime
- **Vercel OIDC federation** — production-only trust, no long-lived AWS keys

Region: **eu-west-2 (London)** · Database: **recoveryai**

## Secret-handling policy

- Passwords are generated **inside AWS Secrets Manager**, never in code, the template, `cdk.out/`, outputs, or logs.
- Stack outputs are **ARNs/identifiers only** — never secret values.
- The Vercel role can read **only the app-user secret** and call the Data API. It **cannot** read the master secret.
- `cdk.out/`, compiled `*.js`/`*.d.ts`, and any `.env`/log files are git-ignored. **The committed repo stays clean.**

> Deploying locally prints output ARNs to your terminal (safe — they are not secrets). To read the actual passwords, use the AWS Console or `aws secretsmanager get-secret-value` locally — never paste them into the repo.

## Prerequisites

- Node 18+
- AWS CLI configured with a profile that can deploy to your account in **eu-west-2**
- CDK bootstrapped once per account/region:
  ```bash
  npx cdk bootstrap aws://<ACCOUNT_ID>/eu-west-2
  ```

## Deploy

```bash
cd infra
npm install
npm run build        # tsc — optional, ts-node runs directly
npx cdk diff         # review changes
npx cdk deploy       # deploy; outputs print ARNs/IDs only
```

## Outputs (set these in Vercel — all non-secret)

| Output | Vercel env var | Notes |
|---|---|---|
| `AWSRegion` | `AWS_REGION` | `eu-west-2` |
| `AuroraClusterArn` | `AURORA_CLUSTER_ARN` | |
| `AppUserSecretArn` | `AURORA_SECRET_ARN` | **app-user** secret (runtime) |
| `AuroraDatabaseName` | `AURORA_DATABASE` | `recoveryai` |
| `VercelRoleArn` | `AWS_ROLE_ARN` | assumed via OIDC |
| `AuroraSecretArn` | _(local only)_ | **master** secret — for migrations, do NOT put in Vercel |

## Next steps (after infra is deployed)

- Create the `app_user` Postgres role + DML grants (local script, reads the app-user secret) — _to be added_.
- Run the schema migration (`database/sql/001_schema.sql`) using the master secret locally — _to be added_.

## Teardown

```bash
cd infra
npx cdk destroy
```

> `removalPolicy: DESTROY` and `deletionProtection: false` are set for easy teardown. Review before any production use.
