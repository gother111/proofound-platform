-- ============================================
-- Two-Way Post-Interview Feedback Table
-- Migration: 002_interview_feedback
-- Purpose: Store candidate/org feedback with one submission per side
-- ============================================

CREATE TABLE IF NOT EXISTS interview_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('candidate', 'org')),
  fairness_rating integer NOT NULL CHECK (fairness_rating BETWEEN 1 AND 5),
  clarity_rating integer NOT NULL CHECK (clarity_rating BETWEEN 1 AND 5),
  experience_rating integer NOT NULL CHECK (experience_rating BETWEEN 1 AND 5),
  comments text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT interview_feedback_interview_role_unique UNIQUE (interview_id, author_role)
);

CREATE INDEX IF NOT EXISTS interview_feedback_interview_id_idx
  ON interview_feedback (interview_id);

