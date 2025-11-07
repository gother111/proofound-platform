-- Migration: Add SUS (System Usability Scale) Survey Tables
-- PRD: Part 2 (lines 83-84), Part 12
-- Target: SUS ≥75

-- SUS survey responses table
CREATE TABLE IF NOT EXISTS sus_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Collection point trigger
  trigger TEXT NOT NULL CHECK (trigger IN ('profile_activation', 'first_assignment', '10_matches', 'quarterly_checkin')),
  
  -- Individual question responses (1-5 Likert scale)
  q1 INTEGER NOT NULL CHECK (q1 >= 1 AND q1 <= 5),
  q2 INTEGER NOT NULL CHECK (q2 >= 1 AND q2 <= 5),
  q3 INTEGER NOT NULL CHECK (q3 >= 1 AND q3 <= 5),
  q4 INTEGER NOT NULL CHECK (q4 >= 1 AND q4 <= 5),
  q5 INTEGER NOT NULL CHECK (q5 >= 1 AND q5 <= 5),
  q6 INTEGER NOT NULL CHECK (q6 >= 1 AND q6 <= 5),
  q7 INTEGER NOT NULL CHECK (q7 >= 1 AND q7 <= 5),
  q8 INTEGER NOT NULL CHECK (q8 >= 1 AND q8 <= 5),
  q9 INTEGER NOT NULL CHECK (q9 >= 1 AND q9 <= 5),
  q10 INTEGER NOT NULL CHECK (q10 >= 1 AND q10 <= 5),
  
  -- Calculated SUS score (0-100)
  score NUMERIC(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  
  -- Grade (A, B, C, D, F)
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sus_surveys_user_id ON sus_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_sus_surveys_trigger ON sus_surveys(trigger);
CREATE INDEX IF NOT EXISTS idx_sus_surveys_created_at ON sus_surveys(created_at);
CREATE INDEX IF NOT EXISTS idx_sus_surveys_score ON sus_surveys(score);

-- Track which surveys have been shown to users to avoid spam
CREATE TABLE IF NOT EXISTS sus_survey_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger TEXT NOT NULL CHECK (trigger IN ('profile_activation', 'first_assignment', '10_matches', 'quarterly_checkin')),
  
  -- Status: pending, completed, skipped, expired
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'expired')),
  
  -- When the prompt should be shown
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- When the prompt was shown
  shown_at TIMESTAMPTZ,
  
  -- When the user took action (completed/skipped)
  actioned_at TIMESTAMPTZ,
  
  -- Link to completed survey
  survey_id UUID REFERENCES sus_surveys(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sus_prompts_user_id ON sus_survey_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_sus_prompts_status ON sus_survey_prompts(status);
CREATE INDEX IF NOT EXISTS idx_sus_prompts_trigger ON sus_survey_prompts(trigger);
CREATE INDEX IF NOT EXISTS idx_sus_prompts_scheduled_at ON sus_survey_prompts(scheduled_at);

-- Ensure one prompt per trigger per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_sus_prompts_unique_active 
ON sus_survey_prompts(user_id, trigger) 
WHERE status = 'pending';

-- Comments
COMMENT ON TABLE sus_surveys IS 'System Usability Scale (SUS) survey responses';
COMMENT ON TABLE sus_survey_prompts IS 'Tracks when SUS surveys should be shown to users';
COMMENT ON COLUMN sus_surveys.score IS 'Calculated SUS score (0-100), target is ≥75';
COMMENT ON COLUMN sus_surveys.trigger IS 'Event that triggered the survey';

