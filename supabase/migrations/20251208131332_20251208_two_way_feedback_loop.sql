-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251208131332
-- name: 20251208_two_way_feedback_loop
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Two-Way Interview Feedback Loop schema
-- Tables: templates, questions, responses, answers, tokens

CREATE TABLE IF NOT EXISTS feedback_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('candidate_to_org', 'org_to_candidate')),
  description TEXT,
  rubric JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feedback_templates_unique_name_dir UNIQUE (name, direction)
);

CREATE TABLE IF NOT EXISTS feedback_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES feedback_templates(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('scale', 'text')),
  scale_min INTEGER DEFAULT 1,
  scale_max INTEGER DEFAULT 5,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  helper_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES feedback_templates(id),
  direction TEXT NOT NULL CHECK (direction IN ('candidate_to_org', 'org_to_candidate')),
  submitted_by UUID REFERENCES profiles(id),
  submitted_via TEXT NOT NULL DEFAULT 'dashboard' CHECK (submitted_via IN ('dashboard', 'token')),
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  overall_score NUMERIC,
  shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feedback_responses_unique_per_submitter UNIQUE (interview_id, direction, submitted_by)
);

CREATE TABLE IF NOT EXISTS feedback_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES feedback_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES feedback_questions(id),
  score NUMERIC,
  text_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feedback_answers_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 10))
);

CREATE TABLE IF NOT EXISTS feedback_tokens (
  token TEXT PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES feedback_templates(id),
  direction TEXT NOT NULL CHECK (direction IN ('candidate_to_org', 'org_to_candidate')),
  recipient_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_questions_template ON feedback_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_interview ON feedback_responses(interview_id, direction);
CREATE INDEX IF NOT EXISTS idx_feedback_answers_response ON feedback_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tokens_interview ON feedback_tokens(interview_id);

-- Updated_at trigger for responses/templates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedback_templates_updated ON feedback_templates;
CREATE TRIGGER trg_feedback_templates_updated
BEFORE UPDATE ON feedback_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_feedback_responses_updated ON feedback_responses;
CREATE TRIGGER trg_feedback_responses_updated
BEFORE UPDATE ON feedback_responses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row Level Security
ALTER TABLE feedback_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_tokens ENABLE ROW LEVEL SECURITY;

-- Templates/questions readable by authenticated users (service role bypasses)
CREATE POLICY "Feedback templates readable" ON feedback_templates
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Feedback questions readable" ON feedback_questions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Responses: only interview host/participants may insert/select
CREATE POLICY "Feedback responses insert" ON feedback_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews i
      WHERE i.id = feedback_responses.interview_id
        AND (i.host_user_id = auth.uid() OR auth.uid() = ANY(i.participant_user_ids))
    )
  );

CREATE POLICY "Feedback responses select" ON feedback_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interviews i
      WHERE i.id = feedback_responses.interview_id
        AND (i.host_user_id = auth.uid() OR auth.uid() = ANY(i.participant_user_ids))
    )
  );

-- Answers follow response access
CREATE POLICY "Feedback answers insert" ON feedback_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM feedback_responses r
      JOIN interviews i ON i.id = r.interview_id
      WHERE r.id = feedback_answers.response_id
        AND (i.host_user_id = auth.uid() OR auth.uid() = ANY(i.participant_user_ids))
    )
  );

CREATE POLICY "Feedback answers select" ON feedback_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM feedback_responses r
      JOIN interviews i ON i.id = r.interview_id
      WHERE r.id = feedback_answers.response_id
        AND (i.host_user_id = auth.uid() OR auth.uid() = ANY(i.participant_user_ids))
    )
  );

-- Tokens: created by service role only; no select for anon/authenticated users
CREATE POLICY "Feedback tokens insert (service)" ON feedback_tokens
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Seed default templates and questions (idempotent)
INSERT INTO feedback_templates (name, direction, description, rubric)
VALUES
  ('Candidate → Org Default', 'candidate_to_org', 'Candidate rates the organization experience post-interview.', '[]'::jsonb),
  ('Org → Candidate Default', 'org_to_candidate', 'Organization provides structured feedback to candidate.', '[]'::jsonb)
ON CONFLICT (name, direction) DO UPDATE SET updated_at = NOW();

-- Candidate template questions
INSERT INTO feedback_questions (template_id, prompt, question_type, scale_min, scale_max, required, sort_order, helper_text)
SELECT id, prompt, question_type, scale_min, scale_max, required, sort_order, helper_text FROM (
  VALUES
    ('Candidate → Org Default', 'Clarity of role expectations', 'scale', 1, 5, TRUE, 1, 'Did you understand the role and expectations?'),
    ('Candidate → Org Default', 'Interview fairness and inclusivity', 'scale', 1, 5, TRUE, 2, 'Was the process respectful and inclusive?'),
    ('Candidate → Org Default', 'Interviewer preparedness & structure', 'scale', 1, 5, TRUE, 3, 'Was the conversation organized and on-time?'),
    ('Candidate → Org Default', 'Overall experience', 'scale', 1, 5, TRUE, 4, 'How likely are you to continue?'),
    ('Candidate → Org Default', 'What went well?', 'text', NULL, NULL, FALSE, 5, NULL),
    ('Candidate → Org Default', 'What could be improved?', 'text', NULL, NULL, FALSE, 6, NULL)
) AS q(template_name, prompt, question_type, scale_min, scale_max, required, sort_order, helper_text)
JOIN feedback_templates t ON t.name = q.template_name AND t.direction = 'candidate_to_org'
ON CONFLICT DO NOTHING;

-- Org template questions
INSERT INTO feedback_questions (template_id, prompt, question_type, scale_min, scale_max, required, sort_order, helper_text)
SELECT id, prompt, question_type, scale_min, scale_max, required, sort_order, helper_text FROM (
  VALUES
    ('Org → Candidate Default', 'Role alignment and motivation', 'scale', 1, 5, TRUE, 1, 'How well does the candidate fit the role?'),
    ('Org → Candidate Default', 'Skills demonstrated for this role', 'scale', 1, 5, TRUE, 2, 'Depth of skills shown in the session'),
    ('Org → Candidate Default', 'Communication and clarity', 'scale', 1, 5, TRUE, 3, 'How clearly did they articulate answers?'),
    ('Org → Candidate Default', 'Culture add potential', 'scale', 1, 5, TRUE, 4, 'Values alignment and collaboration style'),
    ('Org → Candidate Default', 'Strengths observed', 'text', NULL, NULL, FALSE, 5, NULL),
    ('Org → Candidate Default', 'Areas to grow or prepare', 'text', NULL, NULL, FALSE, 6, NULL)
) AS q(template_name, prompt, question_type, scale_min, scale_max, required, sort_order, helper_text)
JOIN feedback_templates t ON t.name = q.template_name AND t.direction = 'org_to_candidate'
ON CONFLICT DO NOTHING;

-- Grants
GRANT SELECT ON feedback_templates TO authenticated;
GRANT SELECT ON feedback_questions TO authenticated;
GRANT SELECT, INSERT ON feedback_responses TO authenticated;
GRANT SELECT, INSERT ON feedback_answers TO authenticated;
GRANT INSERT ON feedback_tokens TO service_role;
GRANT ALL ON feedback_templates, feedback_questions, feedback_responses, feedback_answers, feedback_tokens TO service_role;
