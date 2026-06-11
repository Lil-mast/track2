# RecoveryAI — Data Architecture Summary

## Schema Diagram

Visual diagram: [https://dbdiagram.io/d/65b10635ac844320ae9fd252](https://dbdiagram.io/d/65b10635ac844320ae9fd252)

SQL schema file: `database/sql/001_schema.sql`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Database | AWS Aurora PostgreSQL (Serverless v2) |
| Auth | AWS Cognito (lenders only, v1) |
| Frontend + API | Next.js on Vercel (Vercel Functions) |
| Email Notifications | Amazon SES (mocked in v1 — infrastructure ready, not wired) |
| Future SMS | Amazon SNS (schema ready, implementation post-hackathon) |

---

## Users & Roles

The system has two user types — both stored in a single `users` table separated by a `role` column.

**Lenders** are the primary users of the platform. They are lending institutions or loan officers. They sign up through the registration page, verify their email via AWS Cognito, and log into the lender dashboard to manage their entire loan portfolio. Each lender belongs to an organization (e.g. KCB Group, Safaricom, Branch International).

**Borrowers** are individuals who take loans. In version 1 (hackathon scope) they do not log into the platform — they are data records created and managed by their lender. A borrower belongs to exactly one lender. A borrower portal where borrowers can log in and view their own loans is planned for a future release.

Data isolation is multi-tenant by design. Every database query is scoped by the authenticated lender's ID extracted from their Cognito JWT token. A lender can only ever see their own borrowers and their own loans — never another lender's data. This is enforced server-side in every Vercel Function, not in the frontend.

---

## Database Tables

### Table 1: `users`

**What it stores:** Every person in the system — both lenders and borrowers — in one table.

**Why one table:** Both types share the same core fields (id, name, email, role). Keeping them together simplifies loan queries since a loan has two user references (borrower and lender) that can both be resolved with a single JOIN.

**Lender rows:**
- `role` = `lender`
- `organization` = name of their lending institution (required)
- `lender_id` = NULL (they are not linked to another lender)
- `cognito_sub` = set after email verification completes
- These users can log in and access the dashboard

**Borrower rows:**
- `role` = `borrower`
- `lender_id` = UUID of the lender who manages them (required)
- `organization` = NULL
- `cognito_sub` = NULL (no Cognito account in v1)
- These users cannot log in — they are portfolio records

**Self-referential relationship:** The `lender_id` column on a borrower row is a foreign key that points back to another row in the same `users` table — specifically a lender row. This is what scopes a borrower to their lender.

**Key columns:**
```
id            UUID    Aurora-generated primary key
cognito_sub   TEXT    Cognito sub (TEXT not UUID — AWS format not guaranteed)
name          TEXT    Full name
email         TEXT    Unique email address
role          ENUM    'lender' | 'borrower' | 'admin'
organization  TEXT    Lenders only — e.g. "KCB Group"
lender_id     UUID    Borrowers only — FK → users.id (their lender)
phone         TEXT    Optional — reserved for future SMS notifications
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ (auto-updated by trigger)
```

**Constraints enforced at database level:**
- Lenders must have an organization name
- Borrowers must have a lender_id

**Indexes:**
- `email` — fast login lookup
- `lender_id` — fast "get all borrowers for this lender" query
- `role` — fast role-based filtering
- `cognito_sub` — fast JWT-to-user resolution on every request

---

### Table 2: `cognito_links`

**What it stores:** A mapping between a Cognito identity and a local Aurora user record.

**Why it exists:** When a lender logs in, their request carries a Cognito JWT containing a `sub` value (Cognito's user identifier). The application needs to translate that `sub` into the Aurora `users.id` to query loan and borrower data. This table is that bridge.

**When it is created:** After a lender completes email verification. The post-confirm Vercel Function calls Cognito to read the user's attributes, then writes one row here linking `cognito_sub → user_id`.

**In hackathon scope:** This table only ever contains lender rows. Borrowers have no Cognito account so they never appear here.

**Demo lender seed requirement:** The seed data inserts a demo lender (`lender@demo.lendwise.app`) directly into `users`, bypassing the normal post-confirm flow. A corresponding `cognito_links` row is included in the seed with a placeholder `cognito_sub`. **Before running a live demo, replace the placeholder with the real Cognito sub** from your user pool (AWS Console → Cognito → User Pools → Users → lender@demo.lendwise.app → sub attribute). Without this, login will fail.

**Why `cognito_sub` is TEXT not UUID:** AWS does not guarantee that the Cognito sub is a valid UUID format. Some user pools receive UUID v4, others UUID v7, others prefixed strings. Storing as TEXT is safe for all formats. The Aurora-generated `users.id` (via `gen_random_uuid()`) is completely unrelated — that is Aurora generating its own IDs, not anything from Cognito.

**Key columns:**
```
cognito_sub   TEXT    Primary key — Cognito sub value (any string format)
user_id       UUID    FK → users.id (one-to-one, unique)
email         TEXT    Cached from Cognito to avoid extra lookup
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ
```

---

### Table 3: `loans`

**What it stores:** Every loan issued by a lender to a borrower. This is the core business table.

**How it works:** A lender creates a loan by selecting one of their borrowers from a dropdown (populated from their borrower records) and entering the financial terms. The system records the loan and generates the repayment schedule automatically.

**The dropdown only shows borrowers belonging to the logged-in lender** — this is enforced by the query `WHERE role = 'borrower' AND lender_id = $currentLenderId`. A lender never sees another lender's borrowers.

**One borrower can have multiple loans.** A borrower is registered once and can be assigned multiple loans over time. This is why borrower registration is a separate step from loan creation.

**Loan status lifecycle:**
```
active → overdue → defaulted
active → repaid
```
- `active`: loan is current
- `overdue`: one or more scheduled payments have passed without payment
- `defaulted`: lender has marked the loan as unrecoverable
- `repaid`: all payments completed

**Key columns:**
```
id                UUID        Aurora-generated primary key
borrower_id       UUID        FK → users.id (the borrower)
lender_id         UUID        FK → users.id (the lender)
principal         NUMERIC(15,2)  Loan amount (exact decimal, not float)
interest_rate     NUMERIC(5,2)   Annual rate as percentage
duration_months   INTEGER     Term length
disbursement_date TIMESTAMPTZ When money was issued
start_date        TIMESTAMPTZ When repayments begin
last_payment_date TIMESTAMPTZ Updated each time a payment is recorded
status            ENUM        active | overdue | defaulted | repaid
notes             TEXT        Optional lender free-text notes
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ (auto-updated by trigger)
```

**Why NUMERIC not REAL for money:** Floating point types (REAL, FLOAT) cannot represent decimal values exactly. For financial data this causes rounding errors. NUMERIC(15,2) stores exact values — critical for loan amounts and interest calculations.

**Indexes:**
- `lender_id` — lender dashboard "show all my loans"
- `borrower_id` — future borrower portal "show my loans"
- `status` — flag_overdues operation "find all active loans"
- `(lender_id, status)` compound — "show overdue loans for this lender"

---

### Table 4: `repayment_schedule`

**What it stores:** One row per expected monthly payment for each loan.

**Why it exists:** The original SQLite application stored the repayment schedule as a JSON array blob inside the loans table. This meant the application had to load every loan into memory, parse the JSON, and iterate through dates in application code to find overdue loans. With a normalized table, overdue detection becomes a single SQL query.

**How it is populated:** When a lender creates a 12-month loan, the Vercel Function inserts 12 rows into this table — one per month for the duration of the loan.

**The `paid_at` column is the key field.** It starts as NULL (unpaid). When a borrower makes a payment, the corresponding row is updated to `SET paid_at = NOW()`. This makes it trivial to answer questions like:
- Which payments are overdue? → `WHERE due_date < NOW() AND paid_at IS NULL`
- How many payments has this borrower missed? → `COUNT(*) WHERE paid_at IS NULL AND due_date < NOW()`
- What is the next payment due? → `WHERE paid_at IS NULL ORDER BY due_date ASC LIMIT 1`

**Key columns:**
```
id          UUID          Aurora-generated primary key
loan_id     UUID          FK → loans.id (CASCADE delete — removed with loan)
due_date    TIMESTAMPTZ   When this payment was expected
amount_due  NUMERIC(15,2) NOT NULL — always known at schedule creation time
paid_at     TIMESTAMPTZ   NULL = unpaid, set = when payment was made
created_at  TIMESTAMPTZ
```

**Indexes:**
- `loan_id` — load full schedule for a loan
- Partial index on `due_date WHERE paid_at IS NULL` — only unpaid rows, keeps overdue queries fast as data grows

---

### Table 5: `payments`

**What it stores:** Actual payments made by borrowers as recorded by the lender.

**Why it exists:** This table was completely missing from the original application. The "Make a Payment" button existed in the borrower dashboard UI but was never connected to any backend logic. This table is the implementation of that feature.

**How it works:** When a lender records that a borrower has paid, the Vercel Function:
1. Inserts a row in `payments`
2. Updates the corresponding `repayment_schedule` row (`paid_at = NOW()`)
3. Updates `loans.last_payment_date`
4. Inserts a notification row

**Partial payments:** The `amount` column on a payment row can differ from `amount_due` on the schedule row. This handles real-world situations where borrowers pay partial amounts.

**Key columns:**
```
id          UUID          Aurora-generated primary key
loan_id     UUID          FK → loans.id (RESTRICT — loan with payments cannot be deleted)
schedule_id UUID          FK → repayment_schedule.id (optional — which installment)
amount      NUMERIC(15,2) Actual amount paid
payment_date  TIMESTAMPTZ   When payment was received
notes         TEXT          Optional — e.g. "M-Pesa ref: QK7XYZ"
created_at    TIMESTAMPTZ
```

---

### Table 6: `notifications`

**What it stores:** In-app notifications for the lender dashboard bell icon AND an audit log for emails sent via Amazon SES.

**Why one table for both:** Every notification-worthy event needs both an in-app record (so the lender sees it when they open the dashboard) and an email (so they know immediately even if the dashboard isn't open). Combining them in one table means one INSERT handles both concerns. The `email_sent` flag separates the two channels.

**How the in-app bell works:**
- On dashboard load: `SELECT COUNT(*) WHERE user_id = $id AND read = false` → shows badge number
- On bell click: `SELECT * WHERE user_id = $id ORDER BY created_at DESC LIMIT 20` → shows list
- On notification click: `UPDATE SET read = true WHERE id = $notifId AND user_id = $id`

**How SES email works (v1 — mocked):**
- Row is inserted with `email_sent = false`
- In v1 no actual email is sent — `email_sent` stays `false`
- The Vercel Function shows a success toast in the UI to simulate delivery
- The notification row is fully written to Aurora and visible in the in-app bell
- Wiring real SES is a one-function change post-hackathon — the schema and infrastructure are ready

**Notification types:**
```
loan_created      → lender created a new loan
loan_overdue      → loan was flagged as overdue
loan_defaulted    → loan marked as defaulted
loan_repaid       → loan fully repaid
payment_received  → a payment was recorded
payment_due_soon  → payment due within 3 days (future scheduled job)
```

**Key columns:**
```
id          UUID       Aurora-generated primary key
user_id     UUID       FK → users.id (who receives this)
loan_id     UUID       FK → loans.id (optional — which loan triggered it)
type        ENUM       notification type (see above)
title       TEXT       Short heading shown in bell dropdown
body        TEXT       Full message shown in notification detail
read        BOOLEAN    false = unread (drives badge count)
email_sent  BOOLEAN    false = email not yet sent (drives retry logic)
created_at  TIMESTAMPTZ
```

**Indexes:**
- `(user_id, created_at DESC)` — notification feed newest first
- Partial index on `user_id WHERE read = false` — fast unread count
- `loan_id` — notifications for a specific loan in loan detail view

---

## How They Connect in a Real Flow

### Flow 1: Lender Onboarding

```
Lender fills signup form (name, email, password, organization)
        │
        ▼
Frontend calls Cognito.signUp() — public API, no server needed
Cognito creates UNCONFIRMED account, sends verification email
        │
        ▼
Lender enters code from email
Frontend calls Cognito.confirmSignUp() — public API
Account status → CONFIRMED
        │
        ▼
Frontend calls POST /api/auth/post-confirm { email }
Vercel Function:
  → Calls Cognito.AdminGetUser to read name, organization
  → Calls Cognito.AdminAddUserToGroup("Lenders")
  → INSERT INTO users (name, email, role='lender', organization)
  → INSERT INTO cognito_links (cognito_sub, user_id, email)
        │
        ▼
Lender redirected to /login
Logs in → Cognito returns JWT with cognito:groups: ["Lenders"]
JWT stored in httpOnly cookie
        │
        ▼
Every subsequent request:
  middleware.ts verifies JWT with Cognito
  Reads cognito:groups → allows /lender/* routes
  Looks up cognito_links → gets user_id for Aurora queries
```

---

### Flow 2: Adding a Borrower and Creating a Loan

```
Lender clicks "Add Borrower"
Fills: name, email, phone
        │
        ▼
POST /api/users
  INSERT INTO users (name, email, role='borrower', lender_id=$lenderId)
  lender_id = lender's id from their JWT — enforced server-side
  Returns new borrower id
        │
        ▼
Lender clicks "New Loan"
Opens modal — borrower dropdown populated by:
  SELECT id, name FROM users
  WHERE role='borrower' AND lender_id=$lenderId  ← only their borrowers
        │
        ▼
Lender selects Alice, enters: principal=15000, rate=9.5%, duration=12
        │
        ▼
POST /api/loans
  INSERT INTO loans (borrower_id=alice, lender_id=$lenderId, ...)
  INSERT INTO repayment_schedule × 12 rows (one per month)
  INSERT INTO notifications (type='loan_created', user_id=$lenderId)
  SES.SendEmail → mocked in v1 (toast shown in UI, email_sent stays false)
  -- Post-hackathon: replace mock with real SES call, UPDATE email_sent=true
```

---

### Flow 3: Flagging Overdue Loans

```
Lender clicks "Flag Overdue Loans"
        │
        ▼
POST /api/overdues
  UPDATE loans SET status='overdue'
  WHERE status='active'
  AND id IN (
    SELECT DISTINCT loan_id FROM repayment_schedule
    WHERE due_date < NOW() AND paid_at IS NULL
  )
  RETURNING id, borrower_id, principal
        │
        ▼
For each flagged loan:
  INSERT INTO notifications (type='loan_overdue', user_id=$lenderId, loan_id=...)
        │
        ▼
SES.SendEmail → mocked in v1 (toast shown in UI, email_sent stays false)
        │
        ▼
Lender dashboard refreshes:
  Bell badge shows new unread count
  Loan table shows updated statuses with risk scores
  AI panel shows recovery recommendations per flagged loan
```

---

### Flow 4: Recording a Payment

```
Lender clicks "Record Payment" on a loan row
Enters: amount, payment date, optional notes
        │
        ▼
POST /api/payments
  INSERT INTO payments (loan_id, amount, payment_date, notes)
        │
        ▼
Find the earliest unpaid schedule row for this loan:
  SELECT id FROM repayment_schedule
  WHERE loan_id=$loanId AND paid_at IS NULL
  ORDER BY due_date ASC LIMIT 1
        │
        ▼
UPDATE repayment_schedule SET paid_at=NOW() WHERE id=$scheduleId
UPDATE loans SET last_payment_date=NOW() WHERE id=$loanId
        │
        ▼
Check if all schedule rows are now paid:
  SELECT COUNT(*) FROM repayment_schedule
  WHERE loan_id=$loanId AND paid_at IS NULL
  → If 0 remaining: UPDATE loans SET status='repaid'
        │
        ▼
INSERT INTO notifications (type='payment_received', ...)
SES.SendEmail → mocked in v1 (toast shown in UI, email_sent stays false)
```

---

## Key Design Decisions

**Single users table for both roles** — simplifies loan queries. A loan has two user references (borrower and lender). With one table both can be resolved in one JOIN without cross-table complexity.

**Borrowers have no auth in v1** — reduces scope. Cognito is configured only for lenders. Borrower portal is the natural next feature after the hackathon.

**Repayment schedule as normalized rows not JSON blob** — enables server-side overdue detection with a single SQL query. No application-side date parsing loops. Enables per-installment tracking, partial payments, and payment history analytics.

**NUMERIC not REAL/FLOAT for all money** — floating point cannot represent decimal values exactly. Financial calculations on FLOAT accumulate rounding errors. NUMERIC(15,2) is exact.

**Cognito sub as TEXT not UUID** — AWS does not guarantee Cognito sub is valid UUID format. TEXT accepts any string. Aurora-generated IDs use gen_random_uuid() which is unrelated to Cognito.

**All queries tenant-scoped from JWT** — the lender ID is always extracted from the verified Cognito JWT server-side. Frontend never controls which lender's data is returned. Multi-tenancy enforced at the API layer not the UI layer.

**Notifications dual-purpose with SES mocked in v1** — one table drives both the in-app bell and the email audit trail. In v1 the `email_sent` flag stays `false` — no real SES call is made. A success toast in the UI simulates email delivery. Wiring real SES is a single Vercel Function change post-hackathon — the schema, the `email_sent` column, and the notification rows are all production-ready.

---

## Out of Scope for Hackathon (Post-v1 Roadmap)

- Borrower login and borrower portal
- SMS notifications via Amazon SNS (phone column already in schema)
- Bulk CSV loan import
- Currency conversion server-side (frontend has exchange rate logic, DB stores in base currency)
- Payment due soon scheduled job (cron) — notif_type already defined in schema
- Admin dashboard
- Loan restructuring / term modification history
