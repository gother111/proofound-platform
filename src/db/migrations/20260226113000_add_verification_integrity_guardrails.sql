-- Migration: Verification integrity guardrails across skill + impact verification
-- Date: 2026-02-26
-- Description: Adds risk/integrity metadata, responder audit fields, and contradiction-ready indices.

BEGIN;

-- ============================================================================
-- SKILL VERIFICATION REQUESTS
-- ============================================================================

ALTER TABLE public.skill_verification_requests
  ADD COLUMN IF NOT EXISTS requester_email_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS requester_domain_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS verifier_domain_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS risk_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS requires_authenticated_verifier BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS integrity_status TEXT NOT NULL DEFAULT 'clear',
  ADD COLUMN IF NOT EXISTS integrity_reason TEXT,
  ADD COLUMN IF NOT EXISTS integrity_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS integrity_flagged_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS requester_ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS requester_user_agent_hash TEXT,
  ADD COLUMN IF NOT EXISTS responder_ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS responder_user_agent_hash TEXT,
  ADD COLUMN IF NOT EXISTS response_auth_method TEXT,
  ADD COLUMN IF NOT EXISTS response_actor_email TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'skill_verification_requests_integrity_status_check'
  ) THEN
    ALTER TABLE public.skill_verification_requests
      ADD CONSTRAINT skill_verification_requests_integrity_status_check
      CHECK (integrity_status IN ('clear', 'flagged'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'skill_verification_requests_response_auth_method_check'
  ) THEN
    ALTER TABLE public.skill_verification_requests
      ADD CONSTRAINT skill_verification_requests_response_auth_method_check
      CHECK (
        response_auth_method IS NULL
        OR response_auth_method IN ('token', 'authenticated')
      );
  END IF;
END $$;

-- ============================================================================
-- IMPACT STORY VERIFICATION REQUESTS
-- ============================================================================

ALTER TABLE public.impact_story_verification_requests
  ADD COLUMN IF NOT EXISTS verifier_profile_id UUID,
  ADD COLUMN IF NOT EXISTS requester_email_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS requester_domain_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS verifier_domain_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS risk_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS requires_authenticated_verifier BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS integrity_status TEXT NOT NULL DEFAULT 'clear',
  ADD COLUMN IF NOT EXISTS integrity_reason TEXT,
  ADD COLUMN IF NOT EXISTS integrity_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS integrity_flagged_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS requester_ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS requester_user_agent_hash TEXT,
  ADD COLUMN IF NOT EXISTS responder_ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS responder_user_agent_hash TEXT,
  ADD COLUMN IF NOT EXISTS response_auth_method TEXT,
  ADD COLUMN IF NOT EXISTS response_actor_email TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'impact_story_verification_requests_verifier_profile_id_fkey'
  ) THEN
    ALTER TABLE public.impact_story_verification_requests
      ADD CONSTRAINT impact_story_verification_requests_verifier_profile_id_fkey
      FOREIGN KEY (verifier_profile_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'impact_story_verification_requests_integrity_status_check'
  ) THEN
    ALTER TABLE public.impact_story_verification_requests
      ADD CONSTRAINT impact_story_verification_requests_integrity_status_check
      CHECK (integrity_status IN ('clear', 'flagged'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'impact_story_verification_requests_response_auth_method_check'
  ) THEN
    ALTER TABLE public.impact_story_verification_requests
      ADD CONSTRAINT impact_story_verification_requests_response_auth_method_check
      CHECK (
        response_auth_method IS NULL
        OR response_auth_method IN ('token', 'authenticated')
      );
  END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_skill_verification_verifier_status_integrity
  ON public.skill_verification_requests(verifier_email, status, integrity_status);

CREATE INDEX IF NOT EXISTS idx_impact_story_verifier_status_integrity
  ON public.impact_story_verification_requests(verifier_email, status, integrity_status);

CREATE INDEX IF NOT EXISTS idx_skill_verification_accepted_clear
  ON public.skill_verification_requests(requester_profile_id, skill_id)
  WHERE status = 'accepted' AND integrity_status = 'clear';

CREATE INDEX IF NOT EXISTS idx_impact_verification_accepted_clear
  ON public.impact_story_verification_requests(impact_story_id)
  WHERE status = 'accepted' AND integrity_status = 'clear';

COMMIT;
