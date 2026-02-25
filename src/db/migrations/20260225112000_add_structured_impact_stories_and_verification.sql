-- Migration: Structured impact stories + claim-based verification
-- Date: 2026-02-25
-- Description: Adds structured fields for impact stories and dedicated verification request/response tables

-- ============================================================================
-- IMPACT STORIES: structured fields
-- ============================================================================

ALTER TABLE public.impact_stories
  ADD COLUMN IF NOT EXISTS timeline_structured JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS affiliation_type TEXT,
  ADD COLUMN IF NOT EXISTS affiliation_details TEXT,
  ADD COLUMN IF NOT EXISTS role_title TEXT,
  ADD COLUMN IF NOT EXISTS role_scope TEXT,
  ADD COLUMN IF NOT EXISTS primary_cause TEXT,
  ADD COLUMN IF NOT EXISTS secondary_causes TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS measured_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS supporting_artifacts JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'impact_stories_affiliation_type_check'
  ) THEN
    ALTER TABLE public.impact_stories
      ADD CONSTRAINT impact_stories_affiliation_type_check
      CHECK (affiliation_type IS NULL OR affiliation_type IN ('organization', 'individual'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'impact_stories_role_scope_check'
  ) THEN
    ALTER TABLE public.impact_stories
      ADD CONSTRAINT impact_stories_role_scope_check
      CHECK (role_scope IS NULL OR role_scope IN ('owned', 'co_led', 'contributed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_impact_stories_primary_cause
  ON public.impact_stories(primary_cause);

CREATE INDEX IF NOT EXISTS idx_impact_stories_role_scope
  ON public.impact_stories(role_scope);

-- ============================================================================
-- IMPACT STORY VERIFICATION REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.impact_story_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impact_story_id UUID NOT NULL REFERENCES public.impact_stories(id) ON DELETE CASCADE,
  requester_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verifier_email TEXT NOT NULL,
  verifier_name TEXT,
  verifier_relationship TEXT,
  message TEXT,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'failed')),
  expires_at TIMESTAMP NOT NULL,
  claim_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_message TEXT,
  responded_at TIMESTAMP,
  email_sent_at TIMESTAMP,
  email_error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_impact_story_verification_requests_story
  ON public.impact_story_verification_requests(impact_story_id);

CREATE INDEX IF NOT EXISTS idx_impact_story_verification_requests_requester
  ON public.impact_story_verification_requests(requester_profile_id);

CREATE INDEX IF NOT EXISTS idx_impact_story_verification_requests_status
  ON public.impact_story_verification_requests(status);

CREATE INDEX IF NOT EXISTS idx_impact_story_verification_requests_token
  ON public.impact_story_verification_requests(token);

CREATE INDEX IF NOT EXISTS idx_impact_story_verification_requests_expires
  ON public.impact_story_verification_requests(expires_at);

-- ============================================================================
-- IMPACT STORY VERIFICATION RESPONSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.impact_story_verification_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.impact_story_verification_requests(id) ON DELETE CASCADE,
  responder_email TEXT,
  action TEXT NOT NULL CHECK (action IN ('accept', 'decline')),
  confirmed_role BOOLEAN NOT NULL DEFAULT false,
  confirmed_artifacts BOOLEAN NOT NULL DEFAULT false,
  confirmed_outcome_ids TEXT[] NOT NULL DEFAULT '{}'::text[],
  response_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_impact_story_verification_responses_request
  ON public.impact_story_verification_responses(request_id);

-- ============================================================================
-- RLS policies
-- ============================================================================

ALTER TABLE public.impact_story_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_story_verification_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Impact story verification requests - requester can select" ON public.impact_story_verification_requests;
CREATE POLICY "Impact story verification requests - requester can select"
  ON public.impact_story_verification_requests FOR SELECT
  USING (requester_profile_id = auth.uid());

DROP POLICY IF EXISTS "Impact story verification requests - requester can insert" ON public.impact_story_verification_requests;
CREATE POLICY "Impact story verification requests - requester can insert"
  ON public.impact_story_verification_requests FOR INSERT
  WITH CHECK (requester_profile_id = auth.uid());

DROP POLICY IF EXISTS "Impact story verification requests - requester can update" ON public.impact_story_verification_requests;
CREATE POLICY "Impact story verification requests - requester can update"
  ON public.impact_story_verification_requests FOR UPDATE
  USING (requester_profile_id = auth.uid())
  WITH CHECK (requester_profile_id = auth.uid());

DROP POLICY IF EXISTS "Impact story verification responses - requester can select" ON public.impact_story_verification_responses;
CREATE POLICY "Impact story verification responses - requester can select"
  ON public.impact_story_verification_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.impact_story_verification_requests req
      WHERE req.id = impact_story_verification_responses.request_id
        AND req.requester_profile_id = auth.uid()
    )
  );

COMMENT ON TABLE public.impact_story_verification_requests IS 'One-time verification requests for structured impact stories';
COMMENT ON TABLE public.impact_story_verification_responses IS 'Verifier claim-level responses for impact story verification requests';
COMMENT ON COLUMN public.impact_story_verification_requests.claim_snapshot IS 'Snapshot of claims available for verification (role, outcomes, artifacts)';
COMMENT ON COLUMN public.impact_story_verification_responses.confirmed_outcome_ids IS 'Outcome row IDs explicitly confirmed by verifier';
