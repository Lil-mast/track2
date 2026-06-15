-- =============================================================
-- RecoveryAI — Aurora PostgreSQL Schema
-- File   : database/sql/001_schema.sql
-- Target : Aurora PostgreSQL (Serverless v2, PostgreSQL 15+)
-- Run    : psql $DATABASE_URL -f database/sql/001_schema.sql
--
-- Scope:
--   Lenders  → full Cognito auth, sign up, log in, manage portfolio
--   Borrowers → data records only, created by lenders, no login
--   Borrower portal is a post-hackathon feature
-- =============================================================


-- =============================================================
-- EXTENSIONS
-- pgcrypto: provides gen_random_uuid() — auto-generates UUID
-- primary keys on every table. You never pass an id on INSERT.
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================
-- ENUMS
-- =============================================================

-- Who a user is in the system
CREATE TYPE user_role AS ENUM (
  'lender',    -- has Cognito account, logs in, manages portfolio
  'borrower',  -- data record only, created by lender, no login (v1)
  'admin'      -- reserved for future platform admin use
);

-- Lifecycle state of a loan
-- Aligns with frontend LoanStatus type
CREATE TYPE loan_status AS ENUM (
  'active',      -- repayments on track
  'overdue',     -- one or more payments past due
  'default',     -- lender has marked the loan as unrecoverable
  'paid_off',    -- all payments completed
  'charged_off'  -- loan written off as a loss
);

-- What triggered a notification (drives bell icon + SES email)
CREATE TYPE notif_type AS ENUM (
  'loan_created',       -- lender created a new loan
  'loan_overdue',       -- loan was flagged as overdue
  'loan_defaulted',     -- loan moved to default
  'loan_repaid',        -- loan fully paid off
  'payment_received',   -- a payment was recorded
  'payment_due_soon',   -- upcoming payment within 3 days (future cron)
  'risk_score_updated', -- AI calculated a new risk score
  'strategy_generated'  -- AI generated a new recovery strategy draft
);

-- Lifecycle of an AI-generated recovery strategy / recommendation
-- Aligns with frontend RecommendationStatus type
CREATE TYPE strategy_status AS ENUM (
  'draft',       -- AI-generated, awaiting review (legacy — use 'pending' for new rows)
  'pending',     -- AI-generated, awaiting loan officer review
  'approved',    -- loan officer approved
  'rejected',    -- loan officer rejected
  'executed',    -- strategy has been acted upon
  'dispatched',  -- legacy alias for executed
  'expired'      -- past expires_at date — no longer actionable
);

-- Risk band derived from numeric risk score
-- Aligns with frontend RiskLevel type
CREATE TYPE risk_level AS ENUM (
  'low',      -- score 0–30
  'medium',   -- score 31–60
  'high',     -- score 61–80
  'critical'  -- score 81–100
);

-- Explicit payment state on repayment_schedule and payments rows
-- Aligns with frontend PaymentStatus type
CREATE TYPE payment_status AS ENUM (
  'scheduled',  -- payment is upcoming, not yet due
  'paid',       -- payment was made in full
  'missed',     -- due date passed with no payment
  'partial',    -- payment was made but below amount_due
  'failed'      -- payment attempt failed
);

-- Trigger condition for a lender rule
-- Aligns with frontend RuleTrigger type
CREATE TYPE rule_trigger AS ENUM (
  'days_overdue',
  'missed_payments',
  'risk_score',
  'balance_threshold'
);

-- Comparison operator for a lender rule condition
-- Aligns with frontend RuleOperator type
CREATE TYPE rule_operator AS ENUM (
  'gte',  -- >=
  'lte',  -- <=
  'eq',   -- =
  'gt',   -- >
  'lt'    -- <
);

-- Recovery action the system can take or recommend
-- Aligns with frontend RecoveryAction type
CREATE TYPE recovery_action AS ENUM (
  'email_reminder',
  'sms_reminder',
  'phone_call',
  'payment_plan',
  'hardship_review',
  'legal_notice',
  'collections_referral'
);

-- Action type for audit log entries
-- Aligns with frontend AuditAction type
CREATE TYPE audit_action AS ENUM (
  'login',
  'view',
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'execute',
  'export'
);

-- Entity type for audit log entries
-- Aligns with frontend AuditEntityType type
CREATE TYPE audit_entity_type AS ENUM (
  'borrower',
  'loan',
  'payment',
  'recommendation',
  'rule',
  'user',
  'settings'
);


-- =============================================================
-- SHARED TRIGGER FUNCTION
-- Attached to every table that has an updated_at column.
-- Any UPDATE automatically sets updated_at = NOW().
-- =============================================================
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================
-- TABLE: users
--
-- Single table for both lenders and borrowers.
--
-- LENDERS:
--   role = 'lender', organization = set, lender_id = NULL
--   cognito_sub = set after email verification
--   → Can log in and access the dashboard
--
-- BORROWERS:
--   role = 'borrower', lender_id = UUID of managing lender
--   cognito_sub = NULL — no login in v1
--   → Data records created by lenders, no portal access yet
--
-- cognito_sub is TEXT not UUID: AWS does not guarantee the
-- Cognito sub is valid UUID format so TEXT is the safe type.
-- Aurora-generated users.id (gen_random_uuid) is unrelated.
-- =============================================================
CREATE TABLE users (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cognito identity — TEXT, not UUID (see note above)
  -- NULL until lender completes email verification
  -- Always NULL for borrowers
  cognito_sub      TEXT          UNIQUE,

  -- Core profile
  name             TEXT          NOT NULL,
  email            TEXT          NOT NULL UNIQUE,
  role             user_role     NOT NULL,
  phone            TEXT,                           -- reserved for future SNS SMS

  -- Lender-only: name of the lending institution
  organization     TEXT,

  -- Borrower-only: name of the borrower's business
  company          TEXT,

  -- Borrower-only: human-readable URL/display ID (e.g. "BRW-1042")
  -- Auto-generated by application from borrower_ref_seq sequence
  reference_id     TEXT          UNIQUE,

  -- Borrower-only: FK to the lender who manages this borrower
  lender_id        UUID          REFERENCES users(id) ON DELETE SET NULL,

  -- Borrower-only: address fields
  -- Stored flat for simplicity; maps to frontend Borrower.address object
  address_street   TEXT,
  address_city     TEXT,
  address_state    TEXT,
  address_zip      TEXT,

  -- Borrower-only: AI-computed risk fields (cached from ai_insights)
  -- Updated by the AI pipeline each time a new score is written
  risk_score       NUMERIC(5,2)  CHECK (risk_score BETWEEN 0 AND 100),
  risk_level       risk_level,

  -- Audit
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT lender_requires_org
    CHECK (role != 'lender' OR organization IS NOT NULL),

  CONSTRAINT borrower_requires_lender
    CHECK (role != 'borrower' OR lender_id IS NOT NULL)
);

CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_users_lender_id    ON users(lender_id);
CREATE INDEX idx_users_role         ON users(role);
CREATE INDEX idx_users_cognito_sub  ON users(cognito_sub) WHERE cognito_sub IS NOT NULL;
CREATE INDEX idx_users_reference_id ON users(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_users_risk_level   ON users(lender_id, risk_level) WHERE lender_id IS NOT NULL;

-- Sequence: numeric part of BRW-XXXX borrower reference IDs
CREATE SEQUENCE borrower_ref_seq START 1000;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();


-- =============================================================
-- TABLE: cognito_links
--
-- Maps a Cognito sub to a local Aurora user row.
-- Created by the post-confirm Vercel Function after a lender
-- completes email verification. Only ever contains lenders in v1.
-- =============================================================
CREATE TABLE cognito_links (
  cognito_sub  TEXT         PRIMARY KEY,           -- Cognito sub — TEXT not UUID
  user_id      UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email        TEXT         NOT NULL,              -- cached from Cognito
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cognito_links_user_id ON cognito_links(user_id);

CREATE TRIGGER trg_cognito_links_updated_at
  BEFORE UPDATE ON cognito_links
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();


-- =============================================================
-- SEQUENCE + FUNCTION: auto-assign human-readable loan numbers
-- Generates LN-XXXX on every INSERT where loan_number is NULL
-- =============================================================
CREATE SEQUENCE loan_number_seq START 1000;

CREATE OR REPLACE FUNCTION fn_assign_loan_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loan_number IS NULL THEN
    NEW.loan_number := 'LN-' || LPAD(nextval('loan_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================
-- TABLE: loans
--
-- Core business entity. A lender creates a loan for a borrower.
-- NUMERIC(15,2) for all money — never use REAL/FLOAT for
-- financial data due to floating-point precision errors.
-- =============================================================
CREATE TABLE loans (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable ID (e.g. "LN-1042") — auto-assigned by trigger
  loan_number       TEXT          UNIQUE,

  -- Parties
  borrower_id       UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  lender_id         UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Financial terms
  principal         NUMERIC(15,2) NOT NULL CHECK (principal > 0),
  interest_rate     NUMERIC(5,2)  NOT NULL CHECK (interest_rate >= 0),
  duration_months   INTEGER       NOT NULL CHECK (duration_months > 0),

  -- Loan context
  purpose           TEXT          NOT NULL DEFAULT 'unspecified',  -- why the loan was taken
  collateral        TEXT,                                          -- optional security description

  -- Timeline
  disbursement_date TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  start_date        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  last_payment_date TIMESTAMPTZ,  -- updated each time a payment is recorded

  -- State
  status            loan_status   NOT NULL DEFAULT 'active',

  -- Risk (cached from latest ai_insights row — avoids JOIN on every dashboard load)
  latest_risk_score NUMERIC(5,2)  CHECK (latest_risk_score BETWEEN 0 AND 100),
  risk_level        risk_level,   -- derived band: low/medium/high/critical

  -- Optional lender free-text notes
  notes             TEXT,

  -- Audit
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loans_loan_number     ON loans(loan_number);
CREATE INDEX idx_loans_lender_id       ON loans(lender_id);
CREATE INDEX idx_loans_borrower_id     ON loans(borrower_id);
CREATE INDEX idx_loans_status          ON loans(status);
CREATE INDEX idx_loans_lender_status   ON loans(lender_id, status);
CREATE INDEX idx_loans_borrower_status ON loans(borrower_id, status);
CREATE INDEX idx_loans_risk_level      ON loans(lender_id, risk_level);

CREATE TRIGGER trg_loans_loan_number
  BEFORE INSERT ON loans
  FOR EACH ROW EXECUTE FUNCTION fn_assign_loan_number();

CREATE TRIGGER trg_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();


-- =============================================================
-- TABLE: repayment_schedule
--
-- One row per expected monthly installment for a loan.
-- Normalises what the original app stored as a JSON blob.
-- Enables SQL-level overdue detection without loading loans
-- into application memory.
--
-- Overdue detection query:
--   UPDATE loans SET status = 'overdue'
--   WHERE status = 'active' AND id IN (
--     SELECT DISTINCT loan_id FROM repayment_schedule
--     WHERE due_date < NOW() AND paid_at IS NULL
--   )
-- =============================================================
CREATE TABLE repayment_schedule (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id     UUID           NOT NULL REFERENCES loans(id) ON DELETE CASCADE,

  due_date    TIMESTAMPTZ    NOT NULL,
  amount_due  NUMERIC(15,2)  NOT NULL,

  -- NULL = unpaid; set = when payment was received
  paid_at     TIMESTAMPTZ,

  -- Explicit status — aligns with frontend PaymentStatus
  -- Back-filled from paid_at / due_date; updated when payment is recorded
  status      payment_status NOT NULL DEFAULT 'scheduled',

  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_loan_id ON repayment_schedule(loan_id);
CREATE INDEX idx_schedule_overdue ON repayment_schedule(due_date) WHERE paid_at IS NULL;
CREATE INDEX idx_schedule_status  ON repayment_schedule(loan_id, status);


-- =============================================================
-- TABLE: payments
--
-- Actual payments made by borrowers as recorded by the lender.
-- This table was entirely missing from the original app — the
-- "Make a Payment" button existed in the UI but had no backend.
--
-- Each row optionally links to the repayment_schedule installment
-- it covers. Partial payments are supported (amount != amount_due).
-- =============================================================
CREATE TABLE payments (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),

  loan_id              UUID           NOT NULL,
  borrower_id          UUID           REFERENCES users(id) ON DELETE SET NULL,  -- denorm for fast queries
  schedule_id          UUID           REFERENCES repayment_schedule(id) ON DELETE SET NULL,

  amount               NUMERIC(15,2)  NOT NULL CHECK (amount > 0),
  payment_date         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  -- Explicit status — aligns with frontend PaymentStatus
  status               payment_status NOT NULL DEFAULT 'paid',

  -- Payment channel / reference
  payment_method       TEXT,            -- e.g. "M-Pesa", "Bank Transfer"
  confirmation_number  TEXT UNIQUE,     -- e.g. "QK7XYZ"

  notes                TEXT,
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  -- RESTRICT: a loan with payment history must not be deleted
  CONSTRAINT fk_payments_loan
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT
);

CREATE INDEX idx_payments_loan_id     ON payments(loan_id);
CREATE INDEX idx_payments_borrower_id ON payments(borrower_id);
CREATE INDEX idx_payments_date        ON payments(payment_date DESC);


-- =============================================================
-- TABLE: lender_rules
--
-- Automation rules configured by lenders that trigger recovery
-- actions when loan conditions are met. Evaluated by the
-- recovery engine on each at-risk loan assessment.
--
-- When auto_execute = true  → action fires automatically
-- When auto_execute = false → creates a recommendation for review
--
-- Aligns with frontend LenderRule type (entirely missing in v1 schema)
-- =============================================================
CREATE TABLE lender_rules (
  id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name          TEXT            NOT NULL,
  description   TEXT            NOT NULL DEFAULT '',

  -- Condition: when <trigger> <operator> <threshold> → fire
  trigger       rule_trigger    NOT NULL,
  operator      rule_operator   NOT NULL,
  threshold     NUMERIC(15,2)   NOT NULL,

  -- What to do when the rule fires
  action        recovery_action NOT NULL,

  -- Lower number = evaluated first when multiple rules match
  priority      INTEGER         NOT NULL DEFAULT 50,

  is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
  auto_execute  BOOLEAN         NOT NULL DEFAULT FALSE,

  -- Min days between firings of this rule for the same loan
  cooldown_days INTEGER         NOT NULL DEFAULT 7 CHECK (cooldown_days >= 0),

  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rules_lender_id ON lender_rules(lender_id);
CREATE INDEX idx_rules_active    ON lender_rules(lender_id, priority) WHERE is_active = TRUE;

CREATE TRIGGER trg_lender_rules_updated_at
  BEFORE UPDATE ON lender_rules
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();


-- =============================================================
-- TABLE: notifications
--
-- In-app notification store (bell icon) + email audit trail.
-- Every state change writes a row here AND triggers SES email.
-- The read flag drives the unread count badge in the dashboard.
--
-- NOTE: This is NOT an audit log. See audit_logs table below.
-- =============================================================
CREATE TABLE notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loan_id     UUID        REFERENCES loans(id) ON DELETE SET NULL,
  type        notif_type  NOT NULL,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  email_sent  BOOLEAN     NOT NULL DEFAULT FALSE,  -- FALSE in v1 (SES mocked)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_unread  ON notifications(user_id) WHERE read = FALSE;
CREATE INDEX idx_notif_loan_id ON notifications(loan_id) WHERE loan_id IS NOT NULL;


-- =============================================================
-- TABLE: audit_logs
--
-- Full compliance-grade action audit trail.
-- Records every user-initiated action: who, what, which record,
-- from which IP, with which client. Used by the audit-logs
-- dashboard page and compliance exports.
--
-- Distinct from notifications — notifications drive the bell
-- icon and emails; audit_logs record what loan officers did.
--
-- Aligns with frontend AuditLog type (entirely missing in v1 schema)
-- =============================================================
CREATE TABLE audit_logs (
  id            UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id     UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Who acted
  user_id       UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name     TEXT               NOT NULL,
  user_email    TEXT               NOT NULL,

  -- What they did and to what
  action        audit_action       NOT NULL,
  entity_type   audit_entity_type  NOT NULL,
  entity_id     TEXT               NOT NULL,
  entity_label  TEXT               NOT NULL DEFAULT '',
  description   TEXT               NOT NULL DEFAULT '',

  -- Request context for forensics
  ip_address    TEXT,
  user_agent    TEXT,

  -- Optional change diff or extra context
  metadata      JSONB,

  created_at    TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_lender_id ON audit_logs(lender_id, created_at DESC);
CREATE INDEX idx_audit_user_id   ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_entity    ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action    ON audit_logs(lender_id, action);


-- =============================================================
-- TABLE: ai_insights
--
-- Stores every risk score the AI calculates for a loan.
-- One row per run — history enables trend analysis
-- (score rising 40 → 65 → 82 signals worsening liquidity).
--
-- The AI pipeline:
--   1. Reads loans + payments + repayment_schedule for context
--   2. Sends sanitised data to AWS Nova via Bedrock
--   3. Writes result here
--   4. Updates loans.latest_risk_score for fast dashboard display
--
-- input_params JSONB stores what was sent to the model —
-- required for compliance auditing (AI-DOCS spec).
-- =============================================================
CREATE TABLE ai_insights (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id       UUID          NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  lender_id     UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- 0 = low risk, 100 = high risk
  risk_score    NUMERIC(5,2)  NOT NULL CHECK (risk_score BETWEEN 0 AND 100),

  -- e.g. "amazon.nova-pro-v1:0" — for compliance audit trail
  model_id      TEXT          NOT NULL,

  -- Sanitised data sent to model (JSONB for indexed querying)
  input_params  JSONB,

  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_loan_id   ON ai_insights(loan_id, created_at DESC);
CREATE INDEX idx_ai_insights_lender_id ON ai_insights(lender_id);
-- Partial index: score > 70 triggers strategy generation
CREATE INDEX idx_ai_insights_high_risk ON ai_insights(loan_id) WHERE risk_score > 70;


-- =============================================================
-- TABLE: strategies
--
-- AI-drafted and lender-reviewed recovery plans.
-- Implements Human-in-the-Loop pattern:
--   1. AI writes a 'pending' row
--   2. Loan officer reviews in the dashboard
--   3. Officer approves → status = 'approved', approved_at set
--   4. Strategy acted upon → status = 'executed', executed_at set
--
-- This table serves double duty as the recovery_recommendations
-- store — the extra columns (confidence_score, priority,
-- expected_recovery_amount etc.) align with the frontend
-- RecoveryRecommendation type.
--
-- Legacy status values 'draft' and 'dispatched' are preserved
-- for backward compatibility. New rows should use 'pending'
-- and 'executed' respectively.
-- =============================================================
CREATE TABLE strategies (
  id                       UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id                  UUID             NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  lender_id                UUID             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Link to the ai_insights run that triggered this strategy (optional)
  insight_id               UUID             REFERENCES ai_insights(id) ON DELETE SET NULL,

  -- Risk snapshot at generation time (preserved for audit even if score changes)
  risk_score_at_creation   NUMERIC(5,2)     CHECK (risk_score_at_creation BETWEEN 0 AND 100),

  -- Full Markdown recovery plan from AWS Nova
  content                  TEXT             NOT NULL,

  -- Short 1-2 sentence summary for dashboard cards and feeds
  summary                  TEXT,

  -- Legacy human-readable action label (e.g. "Restructuring Call")
  -- Used for existing UI badges — prefer recovery_action for new code
  recommended_action       TEXT
    CHECK (recommended_action IN (
      'Automated Reminder',
      'Restructuring Call',
      'Personal Outreach',
      'Escalate to Collections',
      'No Action Needed'
    )),

  -- Structured action enum — aligns with frontend RecoveryAction type
  recovery_action          recovery_action,

  -- Lifecycle
  status                   strategy_status  NOT NULL DEFAULT 'pending',

  -- AI provenance
  model_id                 TEXT             NOT NULL,
  ai_model_version         TEXT,

  -- Confidence and financial projections
  confidence_score         NUMERIC(4,3)     CHECK (confidence_score BETWEEN 0 AND 1),
  priority                 INTEGER          NOT NULL DEFAULT 50,
  expected_recovery_amount NUMERIC(15,2),
  expected_recovery_rate   NUMERIC(5,2)     CHECK (expected_recovery_rate BETWEEN 0 AND 100),

  -- Optional call/email script for loan officer to use
  suggested_script         TEXT,

  -- Human-in-the-loop tracking
  reviewed_by              UUID             REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at              TIMESTAMPTZ,
  approved_at              TIMESTAMPTZ,
  executed_at              TIMESTAMPTZ,

  -- Stale after this date
  expires_at               TIMESTAMPTZ,

  -- Arbitrary extra context from AI pipeline
  metadata                 JSONB,

  created_at               TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_strategies_loan_id   ON strategies(loan_id, created_at DESC);
CREATE INDEX idx_strategies_lender_id ON strategies(lender_id);
CREATE INDEX idx_strategies_pending   ON strategies(lender_id, created_at DESC)
  WHERE status IN ('pending', 'draft');
CREATE INDEX idx_strategies_action    ON strategies(lender_id, recommended_action)
  WHERE recommended_action IS NOT NULL;

CREATE TRIGGER trg_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();


-- =============================================================
-- SEED DATA
-- Demo records ready to show on first deploy.
-- All loan statuses covered. Real Kenyan institutions for
-- authenticity. All frontend-required fields populated.
-- =============================================================

-- ── Reference lenders (no Cognito — reference data only) ─────
INSERT INTO users (id, name, email, role, organization) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'M-shwari',   'mshwari@ref.lendwise.app',  'lender', 'Safaricom'),
  ('a0000001-0000-0000-0000-000000000002', 'Branch',     'branch@ref.lendwise.app',   'lender', 'Branch International'),
  ('a0000001-0000-0000-0000-000000000003', 'Tala',       'tala@ref.lendwise.app',     'lender', 'Tala'),
  ('a0000001-0000-0000-0000-000000000004', 'Eazzy Loan', 'eazzy@ref.lendwise.app',    'lender', 'Equity Bank'),
  ('a0000001-0000-0000-0000-000000000005', 'KCB-Mpesa',  'kcbmpesa@ref.lendwise.app', 'lender', 'KCB Group')
ON CONFLICT (id) DO NOTHING;

-- ── Demo lender (can log in to dashboard) ─────────────────────
INSERT INTO users (id, name, email, role, organization) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Demo Lender', 'lender@demo.lendwise.app', 'lender', 'Demo Bank')
ON CONFLICT (id) DO NOTHING;

-- ── Demo borrowers ────────────────────────────────────────────
INSERT INTO users (
  id, name, email, role, lender_id, company, reference_id, phone,
  address_street, address_city, address_state, address_zip,
  risk_score, risk_level
) VALUES
  ('b0000002-0000-0000-0000-000000000002',
   'Alice Wanjiru', 'alice@demo.lendwise.app', 'borrower',
   'b0000001-0000-0000-0000-000000000001',
   'Wanjiru Enterprises', 'BRW-1001', '+254 712 000 001',
   '14 Kimathi Street', 'Nairobi', 'Nairobi County', '00100',
   18.00, 'low'),

  ('b0000003-0000-0000-0000-000000000003',
   'James Otieno', 'james@demo.lendwise.app', 'borrower',
   'b0000001-0000-0000-0000-000000000001',
   'Otieno Logistics Ltd', 'BRW-1002', '+254 722 000 002',
   '7 Oginga Odinga Road', 'Kisumu', 'Kisumu County', '40100',
   82.50, 'high'),

  ('b0000004-0000-0000-0000-000000000004',
   'Grace Muthoni', 'grace@demo.lendwise.app', 'borrower',
   'b0000001-0000-0000-0000-000000000001',
   'Muthoni Textiles', 'BRW-1003', '+254 733 000 003',
   '23 Kenyatta Avenue', 'Nakuru', 'Nakuru County', '20100',
   95.00, 'critical'),

  ('b0000005-0000-0000-0000-000000000005',
   'David Kamau', 'david@demo.lendwise.app', 'borrower',
   'b0000001-0000-0000-0000-000000000001',
   'Kamau Dairy Co.', 'BRW-1004', '+254 744 000 004',
   '5 Moi Avenue', 'Mombasa', 'Mombasa County', '80100',
   5.00, 'low')
ON CONFLICT (id) DO NOTHING;

-- ── Demo loans ─────────────────────────────────────────────────
INSERT INTO loans (
  id, loan_number, borrower_id, lender_id,
  principal, interest_rate, duration_months,
  purpose, status,
  disbursement_date, start_date,
  latest_risk_score, risk_level
) VALUES
  -- Alice: active, low risk
  ('c0000001-0000-0000-0000-000000000001', 'LN-1001',
   'b0000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001',
   15000.00, 9.5, 12, 'working_capital', 'active',
   NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days',
   18.00, 'low'),

  -- James: overdue, high risk
  ('c0000002-0000-0000-0000-000000000002', 'LN-1002',
   'b0000003-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001',
   8500.00, 12.0, 6, 'inventory_purchase', 'overdue',
   NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days',
   82.50, 'high'),

  -- Grace: default, critical risk
  ('c0000003-0000-0000-0000-000000000003', 'LN-1003',
   'b0000004-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001',
   5000.00, 18.5, 3, 'equipment_financing', 'default',
   NOW() - INTERVAL '180 days', NOW() - INTERVAL '180 days',
   95.00, 'critical'),

  -- David: paid_off, low risk
  ('c0000004-0000-0000-0000-000000000004', 'LN-1004',
   'b0000005-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000001',
   3000.00, 7.2, 6, 'working_capital', 'paid_off',
   NOW() - INTERVAL '200 days', NOW() - INTERVAL '200 days',
   5.00, 'low')
ON CONFLICT (id) DO NOTHING;

-- ── Repayment schedule: Alice's active loan (12 installments) ──
INSERT INTO repayment_schedule (loan_id, due_date, amount_due, status) VALUES
  ('c0000001-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days',  1312.50, 'paid'),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '0 days',   1312.50, 'scheduled'),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '30 days',  1312.50, 'scheduled'),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '60 days',  1312.50, 'scheduled'),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '90 days',  1312.50, 'scheduled'),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '120 days', 1312.50, 'scheduled'),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '150 days', 1312.50, 'scheduled'),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '180 days', 1312.50, 'scheduled'),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '210 days', 1312.50, 'scheduled'),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '240 days', 1312.50, 'scheduled'),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '270 days', 1312.50, 'scheduled'),
  ('c0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '300 days', 1312.50, 'scheduled');

-- ── Repayment schedule: James's overdue loan (3 missed) ────────
INSERT INTO repayment_schedule (loan_id, due_date, amount_due, status) VALUES
  ('c0000002-0000-0000-0000-000000000002', NOW() - INTERVAL '60 days', 1479.17, 'missed'),
  ('c0000002-0000-0000-0000-000000000002', NOW() - INTERVAL '30 days', 1479.17, 'missed'),
  ('c0000002-0000-0000-0000-000000000002', NOW() - INTERVAL '0 days',  1479.17, 'missed'),
  ('c0000002-0000-0000-0000-000000000002', NOW() + INTERVAL '30 days', 1479.17, 'scheduled'),
  ('c0000002-0000-0000-0000-000000000002', NOW() + INTERVAL '60 days', 1479.17, 'scheduled'),
  ('c0000002-0000-0000-0000-000000000002', NOW() + INTERVAL '90 days', 1479.17, 'scheduled');

-- ── Repayment schedule: David's paid_off loan (all paid) ───────
INSERT INTO repayment_schedule (loan_id, due_date, amount_due, paid_at, status) VALUES
  ('c0000004-0000-0000-0000-000000000004', NOW() - INTERVAL '200 days', 520.00, NOW() - INTERVAL '200 days', 'paid'),
  ('c0000004-0000-0000-0000-000000000004', NOW() - INTERVAL '170 days', 520.00, NOW() - INTERVAL '169 days', 'paid'),
  ('c0000004-0000-0000-0000-000000000004', NOW() - INTERVAL '140 days', 520.00, NOW() - INTERVAL '140 days', 'paid'),
  ('c0000004-0000-0000-0000-000000000004', NOW() - INTERVAL '110 days', 520.00, NOW() - INTERVAL '110 days', 'paid'),
  ('c0000004-0000-0000-0000-000000000004', NOW() - INTERVAL '80 days',  520.00, NOW() - INTERVAL '79 days',  'paid'),
  ('c0000004-0000-0000-0000-000000000004', NOW() - INTERVAL '50 days',  520.00, NOW() - INTERVAL '50 days',  'paid');

-- ── Cognito link for demo lender ───────────────────────────────
-- TODO: Replace 'REPLACE_WITH_REAL_COGNITO_SUB' with the actual
-- Cognito sub from AWS Console → Cognito → User Pools →
-- lender@demo.lendwise.app → User attributes → sub
-- Without this the demo lender cannot log in.
INSERT INTO cognito_links (cognito_sub, user_id, email) VALUES
  ('REPLACE_WITH_REAL_COGNITO_SUB', 'b0000001-0000-0000-0000-000000000001', 'lender@demo.lendwise.app')
ON CONFLICT (cognito_sub) DO NOTHING;

-- ── Lender rules ───────────────────────────────────────────────
INSERT INTO lender_rules
  (lender_id, name, description, trigger, operator, threshold, action, priority, is_active, auto_execute, cooldown_days)
VALUES
  ('b0000001-0000-0000-0000-000000000001',
   'Auto Email at 7 Days Overdue',
   'Send automated email reminder when a loan is 7 or more days overdue.',
   'days_overdue', 'gte', 7, 'email_reminder', 10, TRUE, TRUE, 7),

  ('b0000001-0000-0000-0000-000000000001',
   'Escalate After 3 Missed Payments',
   'Flag loan for collections referral after 3 or more missed payments.',
   'missed_payments', 'gte', 3, 'collections_referral', 20, TRUE, FALSE, 30)
ON CONFLICT DO NOTHING;

-- ── AI insights ────────────────────────────────────────────────
INSERT INTO ai_insights (loan_id, lender_id, risk_score, model_id, input_params) VALUES
  ('c0000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001',
   82.50, 'amazon.nova-pro-v1:0',
   '{"missed_payments": 3, "days_overdue": 60, "trend": "increasing"}'::jsonb),

  ('c0000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001',
   74.00, 'amazon.nova-pro-v1:0',
   '{"missed_payments": 2, "days_overdue": 30, "trend": "increasing"}'::jsonb),

  ('c0000003-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001',
   95.00, 'amazon.nova-pro-v1:0',
   '{"missed_payments": 3, "days_overdue": 180, "loan_status": "default", "trend": "severe"}'::jsonb),

  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001',
   18.00, 'amazon.nova-lite-v1:0',
   '{"missed_payments": 0, "days_overdue": 0, "trend": "stable"}'::jsonb);

-- ── AI strategies / recommendations ───────────────────────────
INSERT INTO strategies (
  loan_id, lender_id, risk_score_at_creation,
  content, summary, recommended_action, recovery_action,
  confidence_score, priority,
  expected_recovery_amount, expected_recovery_rate,
  status, model_id, ai_model_version,
  expires_at
) VALUES
  -- James: draft strategy, payment plan recommended
  ('c0000002-0000-0000-0000-000000000002',
   'b0000001-0000-0000-0000-000000000001',
   82.50,
   '## Recovery Strategy — James Otieno

**Risk Level:** High (82.5/100)
**Trigger:** 3 missed payments, 60 days overdue

### Recommended Actions

1. **Immediate Outreach** — Contact borrower within 24 hours via phone. Tone: empathetic, solution-focused.
2. **Grace Period Offer** — Offer a 30-day grace period with no penalty to allow borrower to stabilise cash flow.
3. **Restructuring Option** — If borrower cannot resume full payments, propose extending loan term by 3 months to reduce monthly instalment.
4. **Payment Plan** — Offer a catch-up plan: 50% of arrears this month, remainder over the next 2 months.

### Escalation Trigger
If no response within 7 days, escalate to formal collections notice.',
   'Three missed payments on an overdue loan signals cash-flow stress. A restructuring call is recommended before escalating to collections.',
   'Restructuring Call', 'payment_plan',
   0.87, 10, 5500.00, 64.71,
   'pending', 'amazon.nova-pro-v1:0', 'v1:0',
   NOW() + INTERVAL '30 days'),

  -- Grace: approved strategy, escalate to collections
  ('c0000003-0000-0000-0000-000000000003',
   'b0000001-0000-0000-0000-000000000001',
   95.00,
   '## Recovery Strategy — Grace Muthoni

**Risk Level:** Critical (95/100)
**Trigger:** Loan status defaulted, 180 days overdue

### Recommended Actions

1. **Final Settlement Offer** — Offer a one-time settlement at 70% of outstanding balance to close the loan.
2. **Asset Review** — Review any collateral associated with this loan for recovery proceedings.
3. **Legal Referral** — If settlement is declined within 14 days, refer to legal team for formal recovery.

### Notes
Sentiment from last communication log: unresponsive. Recommend certified mail as primary channel.',
   'Loan has been defaulted for 180 days with no borrower response. A final settlement offer has been made and legal referral is pending.',
   'Escalate to Collections', 'collections_referral',
   0.94, 5, 3500.00, 70.00,
   'approved', 'amazon.nova-pro-v1:0', 'v1:0',
   NOW() + INTERVAL '14 days')
ON CONFLICT DO NOTHING;

-- ── Audit log seed entries ─────────────────────────────────────
INSERT INTO audit_logs
  (lender_id, user_id, user_name, user_email, action, entity_type, entity_id, entity_label, description, ip_address)
VALUES
  ('b0000001-0000-0000-0000-000000000001',
   'b0000001-0000-0000-0000-000000000001',
   'Demo Lender', 'lender@demo.lendwise.app',
   'approve', 'recommendation',
   'c0000003-0000-0000-0000-000000000003',
   'Grace Muthoni — Defaulted Loan',
   'Approved escalation-to-collections strategy for Grace Muthoni.',
   '127.0.0.1'),

  ('b0000001-0000-0000-0000-000000000001',
   'b0000001-0000-0000-0000-000000000001',
   'Demo Lender', 'lender@demo.lendwise.app',
   'view', 'borrower',
   'b0000003-0000-0000-0000-000000000003',
   'James Otieno',
   'Viewed borrower profile and loan detail.',
   '127.0.0.1'),

  ('b0000001-0000-0000-0000-000000000001',
   'b0000001-0000-0000-0000-000000000001',
   'Demo Lender', 'lender@demo.lendwise.app',
   'create', 'rule',
   'lender_rules',
   'Auto Email at 7 Days Overdue',
   'Created new automation rule for email reminders.',
   '127.0.0.1')
ON CONFLICT DO NOTHING;


-- =============================================================
-- END OF SCHEMA
-- =============================================================
