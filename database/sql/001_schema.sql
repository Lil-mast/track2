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
  'loan_created',       -- lender created a new loan for this borrower
  'loan_overdue',       -- loan was flagged as overdue
  'loan_defaulted',     -- loan status moved to defaulted
  'loan_repaid',        -- loan fully repaid
  'payment_received',   -- a payment was recorded
  'payment_due_soon'    -- upcoming payment within 3 days (future cron job)
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
INSERT INTO users (id, name, email, role, lender_id) VALUES
  ('b0000002-0000-0000-0000-000000000002', 'Alice Wanjiru', 'alice@demo.lendwise.app',  'borrower', 'b0000001-0000-0000-0000-000000000001'),
  ('b0000003-0000-0000-0000-000000000003', 'James Otieno',  'james@demo.lendwise.app',  'borrower', 'b0000001-0000-0000-0000-000000000001'),
  ('b0000004-0000-0000-0000-000000000004', 'Grace Muthoni', 'grace@demo.lendwise.app',  'borrower', 'b0000001-0000-0000-0000-000000000001'),
  ('b0000005-0000-0000-0000-000000000005', 'David Kamau',   'david@demo.lendwise.app',  'borrower', 'b0000001-0000-0000-0000-000000000001')
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
-- END OF SCHEMA
-- =============================================================
