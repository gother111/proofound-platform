-- ============================================================================
-- BYOC Candidate Invites
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.org_candidate_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_email_normalized TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  proof_snippet_id UUID,
  proof_share_token TEXT,
  proof_submitted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT org_candidate_invites_status_check
    CHECK (status IN ('pending', 'claimed', 'proof_submitted', 'revoked', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_org_candidate_invites_org_id
  ON public.org_candidate_invites (org_id);

CREATE INDEX IF NOT EXISTS idx_org_candidate_invites_status
  ON public.org_candidate_invites (status);

CREATE INDEX IF NOT EXISTS idx_org_candidate_invites_expires_at
  ON public.org_candidate_invites (expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_candidate_invites_active_email
  ON public.org_candidate_invites (org_id, invitee_email_normalized)
  WHERE status IN ('pending', 'claimed');

ALTER TABLE public.org_candidate_invites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'org_candidate_invites'
      AND policyname = 'Org members can view candidate invites'
  ) THEN
    CREATE POLICY "Org members can view candidate invites"
      ON public.org_candidate_invites FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.organization_members om
          WHERE om.org_id = org_candidate_invites.org_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'org_candidate_invites'
      AND policyname = 'Org admins can create candidate invites'
  ) THEN
    CREATE POLICY "Org admins can create candidate invites"
      ON public.org_candidate_invites FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.organization_members om
          WHERE om.org_id = org_candidate_invites.org_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'org_candidate_invites'
      AND policyname = 'Org admins can update candidate invites'
  ) THEN
    CREATE POLICY "Org admins can update candidate invites"
      ON public.org_candidate_invites FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.organization_members om
          WHERE om.org_id = org_candidate_invites.org_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.organization_members om
          WHERE om.org_id = org_candidate_invites.org_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'handle_updated_at'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP TRIGGER IF EXISTS set_updated_at_org_candidate_invites
      ON public.org_candidate_invites;
    CREATE TRIGGER set_updated_at_org_candidate_invites
      BEFORE UPDATE ON public.org_candidate_invites
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;
