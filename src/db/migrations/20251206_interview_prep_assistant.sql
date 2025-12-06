-- Migration: Interview Prep Assistant (Zen Hub Extension)
-- Created: 2025-12-06
-- Purpose: Support interview prep sessions, practice questions, and reflections

-- ============================================================================
-- 1. INTERVIEW PREP SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS interview_prep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  tips_viewed BOOLEAN DEFAULT false,
  questions_practiced INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interview_id)
);

CREATE INDEX IF NOT EXISTS idx_interview_prep_sessions_user ON interview_prep_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_prep_sessions_interview ON interview_prep_sessions(interview_id);

-- ============================================================================
-- 2. PRACTICE QUESTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS interview_prep_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_prep_sessions(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('behavioral', 'technical', 'role_specific', 'values_based')),
  question_text TEXT NOT NULL,
  context_hint TEXT,
  user_answer TEXT,
  answered_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_prep_questions_session ON interview_prep_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_prep_questions_type ON interview_prep_questions(question_type);

-- ============================================================================
-- 3. INTERVIEW REFLECTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS interview_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_prep_sessions(id) ON DELETE CASCADE,
  what_went_well TEXT,
  areas_to_improve TEXT,
  unexpected_questions TEXT,
  overall_feeling INTEGER CHECK (overall_feeling BETWEEN 1 AND 5),
  key_learnings TEXT,
  follow_up_actions TEXT,
  linked_checkin_id UUID REFERENCES wellbeing_checkins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_reflections_session ON interview_reflections(session_id);

-- ============================================================================
-- DONE
-- ============================================================================

