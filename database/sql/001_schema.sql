-- =============================================================
-- RecoveryAI — Aurora PostgreSQL Schema
-- File   : scripts/sql/001_schema.sql
-- Target : Aurora PostgreSQL (Serverless v2, PostgreSQL 15+)
-- Run    : psql $DATABASE_URL -f scripts/sql/001_schema.sql
--
-- Hackathon scope:
--   Lenders  → full Cognito auth, sign up, log in, manage portfolio
--   Borrowers → data records only, created by lenders, no login
--   Borrower portal is a post-hackathon feature
-- =============================================================


-- -------------------------------------------------------------
-- EXTENSIONS
--
-- pgcrypto adds the gen_random_uuid() function.
-- This function generates a random UUID like:
--   f47ac10b-58cc-4372-a567-0e02b2c3d479
-- It is used as the DEFAULT value on every id column so Aurora
-- auto-generates a unique ID for every new row you insert.
-- You never pass an id when inserting — Aurora creates it.
-- This has nothing to do with Cognito sub values.
-- -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================
-- ENUMS
-- Using PostgreSQL native enums keeps invalid values out at
-- the database level — no need to validate in application code.
-- =============================================================

-- user_role:
--   lender   → has Cognito account, logs in, sees dashboard
--   borrower → data record only, created by lender, no login (hackathon scope)
--              borrower portal is a post-hackathon feature
--   admin    → reserved for future platform admin use
CREATE TYPE user_role AS ENUM (
  'lender',
  'borrower',
  'admin'
);

-- loan_status: lifecycle state of a loan
CREATE TYPE loan_status AS ENUM (
  'active',     -- loan is current and repayments are on track
  'overdue',    -- one or more repayment dates have passed without payment
  'defaulted',  -- lender has marked the loan as unrecoverable
  'repaid'      -- all payments completed
);

-- notif_type: what triggered a notification
CREATE TYPE notif_type AS ENUM (
  'loan_created',         -- lender created a new loan for this borrower
  'loan_overdue',         -- loan was flagged as overdue
  'loan_defaulted',       -- loan status moved to defaulted
  'loan_repaid',          -- loan fully repaid
  'payment_received',     -- a payment was recorded
  'payment_due_soon',     -- upcoming payment within 3 days (future cron job)
  'risk_score_updated',   -- AI calculated a new risk score for a loan
  'strategy_generated'    -- AI generated a new recovery strategy draft
);

-- strategy_status: lifecycle state of an AI-generated recovery strategy
CREATE TYPE strategy_status AS ENUM (
  'draft',       -- AI-generated, awaiting loan officer review
  'approved',    -- loan officer approved the strategy
  'dispatched'   -- strategy has been sent / acted upon
);


-- =============================================================
-- TABLE: users
--
-- Single table for both lenders and borrowers.
--
-- LENDERS (hackathon scope — full Cognito auth):
--   role         = 'lender'
--   organization = set (e.g. "KCB Group")
--   lender_id    = NULL (they are not linked to another lender)
--   cognito_sub  = set after email verification completes
--   → They sign up, verify email, log in, manage portfolio
--
-- BORROWERS (hackathon scope — data records only, no login):
--   role         = 'borrower'
--   organization = NULL
--   lender_id    = UUID of the lender who created them
--   cognito_sub  = NULL — borrowers never authenticate in this version
--   → Created by lender via dashboard form, never log in
--   → Post-hackathon: add Cognito auth + borrower portal
--
-- cognito_sub is TEXT not UUID:
--   Aurora generates users.id via gen_random_uuid() — always valid UUID.
--   Cognito sub is a completely separate value from an external system.
--   AWS does not guarantee it is valid UUID format so TEXT is safe.
--   These two are unrelated — gen_random_uuid() never touches cognito_sub.
-- =============================================================
CREATE TABLE users (
  -- Aurora generates this automatically — always valid UUID
  -- You never pass this when inserting, Aurora creates it
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cognito sub — TEXT because AWS format is not guaranteed UUID
  -- NULL for all borrowers (no Cognito account in hackathon scope)
  -- NULL for lenders until they complete email verification
  cognito_sub      TEXT         UNIQUE,

  -- Core profile
  name             TEXT         NOT NULL,
  email            TEXT         NOT NULL UNIQUE,
  role             user_role    NOT NULL,
  phone            TEXT,                            -- optional, for future SMS via SNS

  -- Lender-only: name of their lending organization
  organization     TEXT,

  -- Borrower-only: business or company name (e.g. "Otieno Logistics Ltd")
  -- Distinct from organization which is the lender institution name
  company          TEXT,

  -- Human-readable reference ID for URL routing and display (e.g. "BRW-1042")
  -- Generated by application on INSERT using borrower_ref_seq sequence
  -- NULL for lenders — they are identified by cognito_sub
  reference_id     TEXT         UNIQUE,

  -- Borrower-only: which lender created/manages this borrower
  lender_id        UUID         REFERENCES users(id) ON DELETE SET NULL,

  -- Audit
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Lenders must have an organization name
  CONSTRAINT lender_requires_org
    CHECK (role != 'lender' OR organization IS NOT NULL),

  -- Borrowers must be linked to a lender
  CONSTRAINT borrower_requires_lender
    CHECK (role != 'borrower' OR lender_id IS NOT NULL)
);

-- Index: login and user lookup by email
CREATE INDEX idx_users_email       ON users(email);

-- Index: filter all borrowers for a given lender (lender dashboard)
CREATE INDEX idx_users_lender_id   ON users(lender_id);

-- Index: role-based queries
CREATE INDEX idx_users_role        ON users(role);

-- Index: post-confirm lookup by Cognito sub
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub)
  WHERE cognito_sub IS NOT NULL;

-- Sequence: generates the numeric part of borrower reference IDs (BRW-XXXX)
-- Application uses: 'BRW-' || LPAD(nextval('borrower_ref_seq')::text, 4, '0')
CREATE SEQUENCE borrower_ref_seq START 1000;

-- Index: fast lookup by reference_id (used on every borrower URL route load)
CREATE INDEX idx_users_reference_id ON users(reference_id)
  WHERE reference_id IS NOT NULL;


-- =============================================================
-- TABLE: cognito_links
--
-- Explicit mapping between a Cognito identity and a local user row.
-- In hackathon scope this table ONLY contains lender entries —
-- borrowers have no Cognito account so they never appear here.
--
-- Created by the post-confirm Vercel Function after a lender
-- completes email verification.
--
-- cognito_sub: TEXT — same reason as users.cognito_sub above.
-- =============================================================
CREATE TABLE cognito_links (
  -- Cognito sub as primary key — TEXT, not UUID
  cognito_sub  TEXT         PRIMARY KEY,

  -- One-to-one link to the local user
  user_id      UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Cached email from Cognito (avoids extra lookup)
  email        TEXT         NOT NULL,

  -- Audit
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index: reverse lookup — local user ID → Cognito sub
CREATE INDEX idx_cognito_links_user_id ON cognito_links(user_id);


-- =============================================================
-- TABLE: loans
--
-- Core business entity. Created by a lender for a borrower.
-- Both borrower_id and lender_id are UUIDs referencing users.
--
-- NUMERIC(15,2) for all money — never store financial values
-- as REAL/FLOAT due to floating point precision errors.
--
-- repayment_schedule is normalized into its own table below —
-- not stored as a JSON blob like the original SQLite schema.
-- =============================================================
CREATE TABLE loans (
  -- Primary key
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parties
  borrower_id       UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  lender_id         UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Financial terms
  principal         NUMERIC(15,2) NOT NULL CHECK (principal > 0),
  interest_rate     NUMERIC(5,2)  NOT NULL CHECK (interest_rate >= 0),
  duration_months   INTEGER       NOT NULL CHECK (duration_months > 0),

  -- Timeline
  disbursement_date TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  start_date        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  last_payment_date TIMESTAMPTZ,                    -- updated on each payment record

  -- State
  status            loan_status   NOT NULL DEFAULT 'active',

  -- Optional lender notes (free text)
  notes             TEXT,

  -- Audit
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index: lender dashboard — "show all my loans"
CREATE INDEX idx_loans_lender_id ON loans(lender_id);

-- Index: borrower dashboard — "show my loans"
CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);

-- Index: flag_overdues — "find all active loans"
CREATE INDEX idx_loans_status ON loans(status);

-- Compound index: lender dashboard filtered by status
-- covers queries like: WHERE lender_id = $x AND status = 'overdue'
CREATE INDEX idx_loans_lender_status ON loans(lender_id, status);

-- Compound index: borrower dashboard — their loans by status
CREATE INDEX idx_loans_borrower_status ON loans(borrower_id, status);


-- =============================================================
-- TABLE: repayment_schedule
--
-- Replaces the JSON blob stored in the SQLite loans.repayment_schedule.
-- One row per expected monthly payment. This makes it possible to:
--   - Query "which payments are overdue?" in pure SQL
--   - Mark individual payments as paid
--   - Calculate how many payments have been missed
--
-- The flag_overdues operation becomes a single SQL UPDATE instead
-- of loading all loans into application memory and iterating.
-- =============================================================
CREATE TABLE repayment_schedule (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id      UUID          NOT NULL REFERENCES loans(id) ON DELETE CASCADE,

  -- When this payment was expected
  due_date     TIMESTAMPTZ   NOT NULL,

  -- Expected amount for this installment — always known at schedule creation time
  amount_due   NUMERIC(15,2) NOT NULL,

  -- When borrower actually paid this installment (NULL = unpaid)
  paid_at      TIMESTAMPTZ,

  -- Audit
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index: load full schedule for a loan
CREATE INDEX idx_schedule_loan_id ON repayment_schedule(loan_id);

-- Partial index: only unpaid future/overdue payments
-- Efficient for: find all overdue unpaid installments
CREATE INDEX idx_schedule_overdue ON repayment_schedule(due_date)
  WHERE paid_at IS NULL;


-- =============================================================
-- TABLE: payments
--
-- Records actual payments made by borrowers.
-- Missing entirely from the original app — "Make a Payment"
-- button existed in the UI but was never wired to any backend.
--
-- Each payment optionally links to a specific schedule row
-- (which installment this payment covers).
-- =============================================================
CREATE TABLE payments (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- RESTRICT is intentional: a loan with payment history must not be deleted.
  -- To close a loan use status='repaid' or status='defaulted' instead.
  loan_id       UUID          NOT NULL,

  -- Which scheduled installment this payment covers (optional)
  schedule_id   UUID          REFERENCES repayment_schedule(id) ON DELETE SET NULL,

  -- Amount paid (may differ from amount_due for partial payments)
  amount        NUMERIC(15,2) NOT NULL CHECK (amount > 0),

  -- When money was received
  payment_date  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Optional notes (e.g. "paid via M-Pesa, reference: QK7XYZ")
  notes         TEXT,

  -- Audit
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Explicit RESTRICT: a loan with payment history must not be deleted.
  -- To close a loan use status='repaid' or status='defaulted' instead.
  CONSTRAINT fk_payments_loan
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT
);

-- Index: all payments for a loan
CREATE INDEX idx_payments_loan_id ON payments(loan_id);

-- Index: payments by date (for reporting)
CREATE INDEX idx_payments_date ON payments(payment_date DESC);


-- =============================================================
-- TABLE: notifications
--
-- In-app notification store AND audit log for emails sent via SES.
-- Every state change (loan overdue, payment received etc.)
-- writes a row here AND triggers an SES email.
-- The read flag drives the bell icon unread count on the dashboard.
-- =============================================================
CREATE TABLE notifications (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who receives this notification
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Which loan triggered it (optional — some notifications are account-level)
  loan_id      UUID         REFERENCES loans(id) ON DELETE SET NULL,

  -- What type of event
  type         notif_type   NOT NULL,

  -- Display content
  title        TEXT         NOT NULL,
  body         TEXT         NOT NULL,

  -- Read state — drives unread count badge in UI
  read         BOOLEAN      NOT NULL DEFAULT FALSE,

  -- Was an SES email successfully sent for this notification?
  email_sent   BOOLEAN      NOT NULL DEFAULT FALSE,

  -- Audit
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index: user's notification feed (newest first)
CREATE INDEX idx_notif_user_id ON notifications(user_id, created_at DESC);

-- Partial index: unread notifications only
-- Efficient for: SELECT COUNT(*) FROM notifications WHERE user_id=$x AND read=FALSE
CREATE INDEX idx_notif_unread ON notifications(user_id)
  WHERE read = FALSE;

-- Index: notifications by loan (for loan detail view)
CREATE INDEX idx_notif_loan_id ON notifications(loan_id)
  WHERE loan_id IS NOT NULL;


-- =============================================================
-- TRIGGER FUNCTION: update updated_at automatically
--
-- Attached to users, loans, and cognito_links.
-- Any UPDATE on those rows automatically sets updated_at = NOW().
-- You never need to remember to set it in application code.
-- =============================================================
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to users
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- Attach to loans
CREATE TRIGGER trg_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- Attach to cognito_links
CREATE TRIGGER trg_cognito_links_updated_at
  BEFORE UPDATE ON cognito_links
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();


-- =============================================================
-- SEED DATA
-- Demo records that load on first deploy.
-- Gives judges something to look at immediately.
-- All four loan statuses represented.
-- Real Kenyan lender names for authenticity.
-- =============================================================

-- Reference lenders (no Cognito account — just reference data
-- borrowers can pick from during registration)
INSERT INTO users (id, name, email, role, organization) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'M-shwari',   'mshwari@ref.lendwise.app',   'lender', 'Safaricom'),
  ('a0000001-0000-0000-0000-000000000002', 'Branch',     'branch@ref.lendwise.app',    'lender', 'Branch International'),
  ('a0000001-0000-0000-0000-000000000003', 'Tala',       'tala@ref.lendwise.app',      'lender', 'Tala'),
  ('a0000001-0000-0000-0000-000000000004', 'Eazzy Loan', 'eazzy@ref.lendwise.app',     'lender', 'Equity Bank'),
  ('a0000001-0000-0000-0000-000000000005', 'KCB-Mpesa',  'kcbmpesa@ref.lendwise.app',  'lender', 'KCB Group')
ON CONFLICT (id) DO NOTHING;

-- Demo lender (has a Cognito account, can log in to lender dashboard)
INSERT INTO users (id, name, email, role, organization) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Demo Lender', 'lender@demo.lendwise.app', 'lender', 'Demo Bank')
ON CONFLICT (id) DO NOTHING;

-- Demo borrowers (linked to demo lender)
INSERT INTO users (id, name, email, role, lender_id, company, reference_id) VALUES
  ('b0000002-0000-0000-0000-000000000002', 'Alice Wanjiru', 'alice@demo.lendwise.app',  'borrower', 'b0000001-0000-0000-0000-000000000001', 'Wanjiru Enterprises',  'BRW-1001'),
  ('b0000003-0000-0000-0000-000000000003', 'James Otieno',  'james@demo.lendwise.app',  'borrower', 'b0000001-0000-0000-0000-000000000001', 'Otieno Logistics Ltd', 'BRW-1002'),
  ('b0000004-0000-0000-0000-000000000004', 'Grace Muthoni', 'grace@demo.lendwise.app',  'borrower', 'b0000001-0000-0000-0000-000000000001', 'Muthoni Textiles',     'BRW-1003'),
  ('b0000005-0000-0000-0000-000000000005', 'David Kamau',   'david@demo.lendwise.app',  'borrower', 'b0000001-0000-0000-0000-000000000001', 'Kamau Dairy Co.',      'BRW-1004')
ON CONFLICT (id) DO NOTHING;

-- Demo loans — one per status so every dashboard state is visible
INSERT INTO loans (id, borrower_id, lender_id, principal, interest_rate, duration_months, status, disbursement_date, start_date) VALUES
  -- Active: Alice has a current loan, repayments on track
  ('c0000001-0000-0000-0000-000000000001',
   'b0000002-0000-0000-0000-000000000002',
   'b0000001-0000-0000-0000-000000000001',
   15000.00, 9.5, 12, 'active',
   NOW() - INTERVAL '30 days',
   NOW() - INTERVAL '30 days'),

  -- Overdue: James missed payments, flagged by lender
  ('c0000002-0000-0000-0000-000000000002',
   'b0000003-0000-0000-0000-000000000003',
   'b0000001-0000-0000-0000-000000000001',
   8500.00, 12.0, 6, 'overdue',
   NOW() - INTERVAL '90 days',
   NOW() - INTERVAL '90 days'),

  -- Defaulted: Grace's loan marked unrecoverable
  ('c0000003-0000-0000-0000-000000000003',
   'b0000004-0000-0000-0000-000000000004',
   'b0000001-0000-0000-0000-000000000001',
   5000.00, 18.5, 3, 'defaulted',
   NOW() - INTERVAL '180 days',
   NOW() - INTERVAL '180 days'),

  -- Repaid: David completed all payments
  ('c0000004-0000-0000-0000-000000000004',
   'b0000005-0000-0000-0000-000000000005',
   'b0000001-0000-0000-0000-000000000001',
   3000.00, 7.2, 6, 'repaid',
   NOW() - INTERVAL '200 days',
   NOW() - INTERVAL '200 days')
ON CONFLICT (id) DO NOTHING;

-- Repayment schedule for Alice's active loan (12 monthly installments)
INSERT INTO repayment_schedule (loan_id, due_date, amount_due) VALUES
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '0 days',   1312.50),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '30 days',  1312.50),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '60 days',  1312.50),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '90 days',  1312.50),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '120 days', 1312.50),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '150 days', 1312.50),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '180 days', 1312.50),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '210 days', 1312.50),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '240 days', 1312.50),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '270 days', 1312.50),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '300 days', 1312.50),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '330 days', 1312.50);

-- Repayment schedule for James's overdue loan (3 missed payments)
INSERT INTO repayment_schedule (loan_id, due_date, amount_due) VALUES
  ('c0000002-0000-0000-0000-000000000002', NOW() - INTERVAL '60 days',  1479.17),
  ('c0000002-0000-0000-0000-000000000002', NOW() - INTERVAL '30 days',  1479.17),
  ('c0000002-0000-0000-0000-000000000002', NOW() - INTERVAL '0 days',   1479.17),
  ('c0000002-0000-0000-0000-000000000002', NOW() + INTERVAL '30 days',  1479.17),
  ('c0000002-0000-0000-0000-000000000002', NOW() + INTERVAL '60 days',  1479.17),
  ('c0000002-0000-0000-0000-000000000002', NOW() + INTERVAL '90 days',  1479.17);

-- =============================================================
-- TODO (REQUIRED BEFORE LIVE DEMO):
-- After creating the demo lender in AWS Cognito and completing
-- email verification, replace 'REPLACE_WITH_REAL_COGNITO_SUB'
-- below with the actual Cognito sub value from your user pool.
-- You can find it in the AWS Console → Cognito → User Pools →
-- your pool → Users → lender@demo.lendwise.app → User attributes → sub
--
-- Without this row, lender@demo.lendwise.app cannot log in —
-- the post-confirm handler writes this row in production but
-- seed data bypasses that flow.
-- =============================================================
INSERT INTO cognito_links (cognito_sub, user_id, email) VALUES
  ('REPLACE_WITH_REAL_COGNITO_SUB', 'b0000001-0000-0000-0000-000000000001', 'lender@demo.lendwise.app')
ON CONFLICT (cognito_sub) DO NOTHING;

-- =============================================================
-- AI ENGINE TABLES
-- =============================================================

-- =============================================================
-- COLUMN: loans.latest_risk_score
--
-- Cached latest risk score (0-100) on the loan row itself.
-- Avoids a JOIN to ai_insights on every dashboard load.
-- Updated by the AI pipeline each time a new score is written
-- to ai_insights. NULL means no AI analysis has run yet.
-- =============================================================
ALTER TABLE loans ADD COLUMN latest_risk_score NUMERIC(5,2)
  CHECK (latest_risk_score BETWEEN 0 AND 100);


-- =============================================================
-- TABLE: ai_insights
--
-- Stores every risk score the AI calculates for a loan.
-- One row per analysis run — keeps full history for trend analysis
-- (e.g. risk score rising over time signals worsening liquidity).
--
-- The AI engine reads from loans, payments, and repayment_schedule
-- to build the borrower context, then writes the result here and
-- updates loans.latest_risk_score for fast dashboard display.
--
-- input_params (JSONB): stores the sanitized data sent to the model
-- for compliance auditing — required by the AI-DOCS specification.
-- model_id: records exactly which Nova model version produced the score.
-- =============================================================
CREATE TABLE ai_insights (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which loan this score belongs to
  loan_id       UUID          NOT NULL REFERENCES loans(id) ON DELETE CASCADE,

  -- Tenant scoping — every AI query is scoped to a lender
  lender_id     UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- The computed default-risk score (0 = low risk, 100 = high risk)
  risk_score    NUMERIC(5,2)  NOT NULL CHECK (risk_score BETWEEN 0 AND 100),

  -- Which model produced this score (e.g. "amazon.nova-pro-v1:0")
  model_id      TEXT          NOT NULL,

  -- Audit: sanitized input sent to the model — stored as JSONB for
  -- compliance logging and model performance analysis
  input_params  JSONB,

  -- Audit
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index: all scores for a loan (newest first — trend chart)
CREATE INDEX idx_ai_insights_loan_id ON ai_insights(loan_id, created_at DESC);

-- Index: all scores for a lender's portfolio (dashboard overview)
CREATE INDEX idx_ai_insights_lender_id ON ai_insights(lender_id);

-- Partial index: high-risk loans only (score > 70 triggers strategy generation)
CREATE INDEX idx_ai_insights_high_risk ON ai_insights(loan_id)
  WHERE risk_score > 70;


-- =============================================================
-- TABLE: strategies
--
-- Stores AI-drafted and lender-approved recovery plans.
-- Implements the "Human-in-the-Loop" pattern from AI-DOCS:
--   1. AI writes a 'draft' row
--   2. Loan officer reviews in the dashboard
--   3. Officer approves → status moves to 'approved', approved_at set
--   4. Strategy is acted upon → status moves to 'dispatched'
--
-- content: Markdown-formatted recovery plan from AWS Nova.
-- risk_score_at_creation: snapshot of the score that triggered
--   this strategy — preserved even if new scores are computed later.
-- =============================================================
CREATE TABLE strategies (
  id                    UUID             PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which loan this strategy covers
  loan_id               UUID             NOT NULL REFERENCES loans(id) ON DELETE CASCADE,

  -- Tenant scoping
  lender_id             UUID             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- The ai_insights row that triggered this strategy generation (optional —
  -- allows tracing which exact score run produced which strategy)
  insight_id            UUID             REFERENCES ai_insights(id) ON DELETE SET NULL,

  -- Risk score at the time this strategy was generated (audit snapshot)
  risk_score_at_creation NUMERIC(5,2)   CHECK (risk_score_at_creation BETWEEN 0 AND 100),

  -- The full Markdown strategy text returned by AWS Nova
  content               TEXT             NOT NULL,

  -- Short 1-2 sentence insight for dashboard display and insights feed.
  -- Condensed version of content — Nova writes this as the opening paragraph.
  -- Used in borrower table, insights feed, and borrower detail card.
  summary               TEXT,

  -- Discrete action label extracted by AI alongside the full strategy.
  -- Maps directly to the frontend RecommendedAction type (lib/data.ts).
  -- Used for table badges, risk filters, and action breakdown charts.
  recommended_action    TEXT
    CHECK (recommended_action IN (
      'Automated Reminder',
      'Restructuring Call',
      'Personal Outreach',
      'Escalate to Collections',
      'No Action Needed'
    )),

  -- Draft → Approved → Dispatched lifecycle
  status                strategy_status  NOT NULL DEFAULT 'draft',

  -- Which model version produced this strategy
  model_id              TEXT             NOT NULL,

  -- Set when a loan officer approves the draft
  approved_at           TIMESTAMPTZ,

  -- Audit
  created_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Index: all strategies for a loan (loan detail view)
CREATE INDEX idx_strategies_loan_id ON strategies(loan_id, created_at DESC);

-- Index: lender's full strategy queue
CREATE INDEX idx_strategies_lender_id ON strategies(lender_id);

-- Partial index: only pending drafts — drives the "Review Queue" dashboard panel
CREATE INDEX idx_strategies_drafts ON strategies(lender_id, created_at DESC)
  WHERE status = 'draft';

-- Index: action breakdown chart — GROUP BY recommended_action per lender
CREATE INDEX idx_strategies_action ON strategies(lender_id, recommended_action)
  WHERE recommended_action IS NOT NULL;

-- Trigger: auto-update updated_at on strategies
CREATE TRIGGER trg_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();


-- =============================================================
-- SEED DATA: Demo AI insights and strategies
-- Gives the demo dashboard populated AI panels out of the box.
-- James (overdue loan) and Grace (defaulted loan) have scores
-- that trigger strategy generation (score > 70).
-- Alice (active) has a low score — no strategy needed.
-- =============================================================

-- AI insights for James's overdue loan — high risk, trending upward
INSERT INTO ai_insights (loan_id, lender_id, risk_score, model_id, input_params) VALUES
  ('c0000002-0000-0000-0000-000000000002',
   'b0000001-0000-0000-0000-000000000001',
   82.50,
   'amazon.nova-pro-v1:0',
   '{"missed_payments": 3, "days_overdue": 60, "sliding_date_trend": "increasing"}'::jsonb),
  ('c0000002-0000-0000-0000-000000000002',
   'b0000001-0000-0000-0000-000000000001',
   74.00,
   'amazon.nova-pro-v1:0',
   '{"missed_payments": 2, "days_overdue": 30, "sliding_date_trend": "increasing"}'::jsonb);

-- AI insights for Grace's defaulted loan — maximum risk
INSERT INTO ai_insights (loan_id, lender_id, risk_score, model_id, input_params) VALUES
  ('c0000003-0000-0000-0000-000000000003',
   'b0000001-0000-0000-0000-000000000001',
   95.00,
   'amazon.nova-pro-v1:0',
   '{"missed_payments": 3, "days_overdue": 180, "loan_status": "defaulted", "sliding_date_trend": "severe"}'::jsonb);

-- AI insights for Alice's active loan — low risk
INSERT INTO ai_insights (loan_id, lender_id, risk_score, model_id, input_params) VALUES
  ('c0000001-0000-0000-0000-000000000001',
   'b0000001-0000-0000-0000-000000000001',
   18.00,
   'amazon.nova-lite-v1:0',
   '{"missed_payments": 0, "days_overdue": 0, "sliding_date_trend": "stable"}'::jsonb);

-- Update loans.latest_risk_score from seed data
UPDATE loans SET latest_risk_score = 82.50 WHERE id = 'c0000002-0000-0000-0000-000000000002';
UPDATE loans SET latest_risk_score = 95.00 WHERE id = 'c0000003-0000-0000-0000-000000000003';
UPDATE loans SET latest_risk_score = 18.00 WHERE id = 'c0000001-0000-0000-0000-000000000001';

-- Draft strategy for James's overdue loan
INSERT INTO strategies (loan_id, lender_id, risk_score_at_creation, content, summary, recommended_action, status, model_id) VALUES
  ('c0000002-0000-0000-0000-000000000002',
   'b0000001-0000-0000-0000-000000000001',
   82.50,
   '## Recovery Strategy — James Otieno

**Risk Level:** High (82.5/100)
**Trigger:** 3 missed payments, 60 days overdue

### Recommended Actions

1. **Immediate Outreach** — Contact borrower within 24 hours via phone. Tone: empathetic, solution-focused.
2. **Grace Period Offer** — Offer a 30-day grace period with no penalty to allow borrower to stabilize cash flow.
3. **Restructuring Option** — If borrower cannot resume full payments, propose extending the loan term by 3 months to reduce monthly installment amount.
4. **Payment Plan** — Offer a catch-up plan: borrower pays 50% of arrears this month and the remainder over the next 2 months.

### Escalation Trigger
If no response within 7 days, escalate to formal collections notice.',
   'Three missed payments on an overdue loan signals cash-flow stress. A restructuring call is recommended before escalating to collections.',
   'Restructuring Call',
   'draft',
   'amazon.nova-pro-v1:0');

-- Approved strategy for Grace's defaulted loan
INSERT INTO strategies (loan_id, lender_id, risk_score_at_creation, content, summary, recommended_action, status, model_id, approved_at) VALUES
  ('c0000003-0000-0000-0000-000000000003',
   'b0000001-0000-0000-0000-000000000001',
   95.00,
   '## Recovery Strategy — Grace Muthoni

**Risk Level:** Critical (95/100)
**Trigger:** Loan status defaulted, 180 days overdue

### Recommended Actions

1. **Final Settlement Offer** — Offer a one-time settlement at 70% of outstanding balance to close the loan.
2. **Asset Review** — Review any collateral associated with this loan for recovery proceedings.
3. **Legal Referral** — If settlement is declined within 14 days, refer to legal team for formal recovery process.

### Notes
Sentiment from last communication log: unresponsive. Recommend certified mail as primary channel.',
   'Loan has been defaulted for 180 days with no borrower response. A final settlement offer has been made and legal referral is pending.',
   'Escalate to Collections',
   'approved',
   'amazon.nova-pro-v1:0',
   NOW() - INTERVAL '5 days');


-- =============================================================
-- END OF SCHEMA
-- =============================================================
