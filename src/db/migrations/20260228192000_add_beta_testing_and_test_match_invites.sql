-- PRO-115: Standardize beta testing accounts and test-match invite flow.
-- Date: 2026-02-28

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_beta_testing BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS is_test_match BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.org_candidate_invites
  ADD COLUMN IF NOT EXISTS flow_type TEXT NOT NULL DEFAULT 'proof_card',
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_candidate_invites_flow_type_check'
      AND conrelid = 'public.org_candidate_invites'::regclass
  ) THEN
    ALTER TABLE public.org_candidate_invites
      ADD CONSTRAINT org_candidate_invites_flow_type_check
      CHECK (flow_type IN ('proof_card', 'test_match'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_candidate_invites_test_match_assignment_ck'
      AND conrelid = 'public.org_candidate_invites'::regclass
  ) THEN
    ALTER TABLE public.org_candidate_invites
      ADD CONSTRAINT org_candidate_invites_test_match_assignment_ck
      CHECK (flow_type <> 'test_match' OR assignment_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_org_candidate_invites_flow_type
  ON public.org_candidate_invites(flow_type);

CREATE INDEX IF NOT EXISTS idx_org_candidate_invites_assignment_id
  ON public.org_candidate_invites(assignment_id);

CREATE INDEX IF NOT EXISTS idx_org_candidate_invites_match_id
  ON public.org_candidate_invites(match_id);

CREATE INDEX IF NOT EXISTS idx_org_candidate_invites_conversation_id
  ON public.org_candidate_invites(conversation_id);

CREATE INDEX IF NOT EXISTS matches_is_test_match_idx
  ON public.matches(is_test_match);

UPDATE public.profiles AS p
SET is_beta_testing = true
FROM auth.users AS u
WHERE u.id = p.id
  AND lower(trim(u.email)) IN ('p.samoshko97@icloud.com', 'pavlo@edgeoftalent.com');

COMMIT;
