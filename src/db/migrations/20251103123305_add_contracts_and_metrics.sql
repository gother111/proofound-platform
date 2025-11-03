-- Migration: Add Contracts and Metrics Infrastructure
-- Created: 2025-11-03
-- Purpose: Support TTSC metric tracking and metrics caching

-- ========================================
-- CONTRACTS TABLE
-- ========================================
-- Tracks signed contracts/agreements between individuals and organizations
-- Required for TTSC (Time to Signed Contract) metric calculation

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Attestation flags (mutual confirmation model)
  user_attestation BOOLEAN DEFAULT FALSE,
  org_attestation BOOLEAN DEFAULT FALSE,

  -- Contract details
  contract_type TEXT CHECK (contract_type IN ('full-time', 'part-time', 'contract', 'internship', 'volunteer')),
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  start_date DATE,
  end_date DATE,

  -- Compensation details (optional)
  compensation_amount INTEGER,
  compensation_currency TEXT DEFAULT 'USD',
  compensation_period TEXT CHECK (compensation_period IN ('hourly', 'weekly', 'monthly', 'yearly', 'one-time')),

  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT unique_contract_per_assignment UNIQUE (assignment_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_contracts_assignment_id ON contracts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_contracts_signed_at ON contracts(signed_at);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);

-- RLS Policies for contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Users can view their own contracts
CREATE POLICY contracts_select_own ON contracts
  FOR SELECT
  USING (user_id = auth.uid());

-- Organization members can view their org's contracts
CREATE POLICY contracts_select_org ON contracts
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Users can attest to their own contracts
CREATE POLICY contracts_update_own ON contracts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Organization members can attest to their org's contracts
CREATE POLICY contracts_update_org ON contracts
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Organization members can create contracts for their assignments
CREATE POLICY contracts_insert_org ON contracts
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ========================================
-- METRIC SNAPSHOTS TABLE
-- ========================================
-- Caches calculated metrics for performance and historical tracking

CREATE TABLE IF NOT EXISTS metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metric identification
  metric_type TEXT NOT NULL CHECK (metric_type IN ('ttsc', 'ttfqi', 'ttv', 'pac', 'sus', 'wellbeing_delta')),
  cohort TEXT, -- e.g., 'student', 'senior-engineer', 'us-remote', etc.

  -- Metric values
  value NUMERIC NOT NULL, -- Primary metric value (e.g., median days)
  median NUMERIC,
  p25 NUMERIC, -- 25th percentile
  p75 NUMERIC, -- 75th percentile
  mean NUMERIC,
  sample_size INTEGER,

  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Additional metadata
  metadata JSONB DEFAULT '{}', -- Store additional context (e.g., breakdown by sub-cohort)

  -- Audit fields
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT unique_metric_snapshot UNIQUE (metric_type, cohort, period_start, period_end)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_type ON metric_snapshots(metric_type);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_cohort ON metric_snapshots(cohort);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_period ON metric_snapshots(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_calculated_at ON metric_snapshots(calculated_at);

-- RLS Policies for metric_snapshots (admin only)
ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;

-- Only admins can view metrics (via service role or admin flag)
-- For now, we'll allow service role access only
CREATE POLICY metric_snapshots_service_role ON metric_snapshots
  FOR ALL
  USING (auth.uid() IS NOT NULL); -- Adjust this based on your admin identification logic

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contracts table
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE contracts IS 'Tracks signed employment/engagement agreements for TTSC metric calculation';
COMMENT ON COLUMN contracts.user_attestation IS 'User has confirmed they signed the contract';
COMMENT ON COLUMN contracts.org_attestation IS 'Organization has confirmed the contract was signed';
COMMENT ON COLUMN contracts.signed_at IS 'Date when contract was signed (used as TTSC endpoint)';
COMMENT ON COLUMN contracts.metadata IS 'Additional contract details (e.g., benefits, terms, document URLs)';

COMMENT ON TABLE metric_snapshots IS 'Caches calculated metrics for performance and historical analysis';
COMMENT ON COLUMN metric_snapshots.metric_type IS 'Type of metric: ttsc, ttfqi, ttv, pac, sus, wellbeing_delta';
COMMENT ON COLUMN metric_snapshots.cohort IS 'User cohort for segmented analysis (e.g., student, senior-engineer)';
COMMENT ON COLUMN metric_snapshots.value IS 'Primary metric value (typically median)';
COMMENT ON COLUMN metric_snapshots.metadata IS 'Additional context like breakdowns, confidence intervals, etc.';
