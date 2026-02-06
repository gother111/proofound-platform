-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251107193744
-- name: add_sus_responses
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- SUS (System Usability Scale) Responses Table

CREATE TABLE IF NOT EXISTS sus_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Individual question scores (1-5 scale)
  q1_score INT NOT NULL CHECK (q1_score BETWEEN 1 AND 5),
  q2_score INT NOT NULL CHECK (q2_score BETWEEN 1 AND 5),
  q3_score INT NOT NULL CHECK (q3_score BETWEEN 1 AND 5),
  q4_score INT NOT NULL CHECK (q4_score BETWEEN 1 AND 5),
  q5_score INT NOT NULL CHECK (q5_score BETWEEN 1 AND 5),
  q6_score INT NOT NULL CHECK (q6_score BETWEEN 1 AND 5),
  q7_score INT NOT NULL CHECK (q7_score BETWEEN 1 AND 5),
  q8_score INT NOT NULL CHECK (q8_score BETWEEN 1 AND 5),
  q9_score INT NOT NULL CHECK (q9_score BETWEEN 1 AND 5),
  q10_score INT NOT NULL CHECK (q10_score BETWEEN 1 AND 5),
  
  -- Calculated total score (0-100)
  total_score DECIMAL(5,2) NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  
  -- When/where the survey was triggered
  trigger_point TEXT,
  
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sus_responses_user ON sus_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_sus_responses_submitted ON sus_responses(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_sus_responses_score ON sus_responses(total_score);

-- RLS Policies
ALTER TABLE sus_responses ENABLE ROW LEVEL SECURITY;

-- Users can read their own responses
CREATE POLICY "Users can read own SUS responses"
  ON sus_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Platform admins can read all responses (for metrics)
CREATE POLICY "Admins can read all SUS responses"
  ON sus_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role IN ('platform_admin', 'super_admin')
    )
  );

-- Service role can insert responses
CREATE POLICY "Service role can insert SUS responses"
  ON sus_responses
  FOR INSERT
  WITH CHECK (true);
