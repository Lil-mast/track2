-- =============================================================
-- RecoveryAI — AI Engine Schema
-- File   : ai-engine/sql/schema.sql
-- Target : Aurora PostgreSQL (Serverless v2, PostgreSQL 15+)
-- =============================================================

-- strategy_status: lifecycle state of an AI-generated recovery strategy
CREATE TYPE strategy_status AS ENUM (
  'draft',
  'approved',
  'rejected'
);

-- =============================================================
-- TABLE: ai_insights
-- Stores history of risk scores for trend analysis.
-- =============================================================
CREATE TABLE ai_insights (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id      UUID         NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  
  -- Dynamic risk score (0-100)
  risk_score   INTEGER      NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  
  -- AI reasoning for the score
  reasoning    TEXT         NOT NULL,
  
  -- Model details for auditing
  model_id     TEXT         NOT NULL,
  
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index: lookup insights for a specific loan
CREATE INDEX idx_ai_insights_loan_id ON ai_insights(loan_id);

-- =============================================================
-- TABLE: strategies
-- Stores drafted and approved recovery plans.
-- =============================================================
CREATE TABLE strategies (
  id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id      UUID            NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  
  -- The strategy content (Markdown formatted)
  content      TEXT            NOT NULL,
  
  -- Current state of the strategy
  status       strategy_status NOT NULL DEFAULT 'draft',
  
  -- Metadata
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Index: lookup strategies for a specific loan
CREATE INDEX idx_strategies_loan_id ON strategies(loan_id);

-- Attach updated_at trigger
CREATE TRIGGER trg_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
