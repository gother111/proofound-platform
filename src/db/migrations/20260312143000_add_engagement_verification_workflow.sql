BEGIN;

CREATE TABLE IF NOT EXISTS public.engagement_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  intro_id UUID NOT NULL REFERENCES public.intro_workflows(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  candidate_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  engagement_type TEXT,
  state TEXT NOT NULL DEFAULT 'pending_both_confirmations',
  candidate_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  candidate_confirmed_at TIMESTAMPTZ,
  candidate_confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  organization_confirmed_at TIMESTAMPTZ,
  organization_confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_file_id UUID REFERENCES public.uploaded_files(id) ON DELETE SET NULL,
  evidence_note TEXT,
  proof_hook_status TEXT NOT NULL DEFAULT 'not_ready',
  proof_hook_eligible_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_verifications_decision_unique
  ON public.engagement_verifications (decision_id);
CREATE INDEX IF NOT EXISTS engagement_verifications_org_state_idx
  ON public.engagement_verifications (org_id, state);
CREATE INDEX IF NOT EXISTS engagement_verifications_candidate_state_idx
  ON public.engagement_verifications (candidate_profile_id, state);
CREATE INDEX IF NOT EXISTS engagement_verifications_assignment_state_idx
  ON public.engagement_verifications (assignment_id, state);

ALTER TABLE public.engagement_verifications
  ADD CONSTRAINT engagement_verifications_engagement_type_check
  CHECK (
    engagement_type IS NULL
    OR engagement_type = ANY(
      ARRAY['full_time', 'part_time', 'contract_consulting', 'fractional_project']
    )
  );

ALTER TABLE public.engagement_verifications
  ADD CONSTRAINT engagement_verifications_state_check
  CHECK (
    state = ANY(
      ARRAY[
        'pending_both_confirmations',
        'pending_candidate_confirmation',
        'pending_organization_confirmation',
        'verified'
      ]
    )
  );

ALTER TABLE public.engagement_verifications
  ADD CONSTRAINT engagement_verifications_proof_hook_status_check
  CHECK (proof_hook_status = ANY(ARRAY['not_ready', 'eligible']));

CREATE TABLE IF NOT EXISTS public.engagement_verification_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_verification_id UUID NOT NULL REFERENCES public.engagement_verifications(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger TEXT NOT NULL,
  reason_code TEXT,
  actor_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS engagement_verification_state_transitions_created_at_idx
  ON public.engagement_verification_state_transitions (engagement_verification_id, created_at);

ALTER TABLE public.engagement_verification_state_transitions
  ADD CONSTRAINT engagement_verification_state_transitions_from_state_check
  CHECK (
    from_state IS NULL
    OR from_state = ANY(
      ARRAY[
        'pending_both_confirmations',
        'pending_candidate_confirmation',
        'pending_organization_confirmation',
        'verified'
      ]
    )
  );

ALTER TABLE public.engagement_verification_state_transitions
  ADD CONSTRAINT engagement_verification_state_transitions_to_state_check
  CHECK (
    to_state = ANY(
      ARRAY[
        'pending_both_confirmations',
        'pending_candidate_confirmation',
        'pending_organization_confirmation',
        'verified'
      ]
    )
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'set_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_updated_at_engagement_verifications ON public.engagement_verifications;
    CREATE TRIGGER set_updated_at_engagement_verifications
      BEFORE UPDATE ON public.engagement_verifications
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

ALTER TABLE public.engagement_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_verification_state_transitions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'engagement_verifications'
      AND policyname = 'engagement_verifications_owner_access'
  ) THEN
    CREATE POLICY engagement_verifications_owner_access
      ON public.engagement_verifications
      FOR ALL
      USING (
        candidate_profile_id = public.current_profile_id()
        OR org_id = ANY(public.current_org_ids())
      )
      WITH CHECK (
        candidate_profile_id = public.current_profile_id()
        OR org_id = ANY(public.current_org_ids())
      );
  END IF;
END $$;

DROP POLICY IF EXISTS "Workflow engagement verifications service select" ON public.engagement_verifications;
CREATE POLICY "Workflow engagement verifications service select"
  ON public.engagement_verifications FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow engagement verifications service insert" ON public.engagement_verifications;
CREATE POLICY "Workflow engagement verifications service insert"
  ON public.engagement_verifications FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow engagement verifications service update" ON public.engagement_verifications;
CREATE POLICY "Workflow engagement verifications service update"
  ON public.engagement_verifications FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow engagement verifications service delete" ON public.engagement_verifications;
CREATE POLICY "Workflow engagement verifications service delete"
  ON public.engagement_verifications FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow engagement transitions service select" ON public.engagement_verification_state_transitions;
CREATE POLICY "Workflow engagement transitions service select"
  ON public.engagement_verification_state_transitions FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow engagement transitions service insert" ON public.engagement_verification_state_transitions;
CREATE POLICY "Workflow engagement transitions service insert"
  ON public.engagement_verification_state_transitions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow engagement transitions service update" ON public.engagement_verification_state_transitions;
CREATE POLICY "Workflow engagement transitions service update"
  ON public.engagement_verification_state_transitions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow engagement transitions service delete" ON public.engagement_verification_state_transitions;
CREATE POLICY "Workflow engagement transitions service delete"
  ON public.engagement_verification_state_transitions FOR DELETE
  USING (auth.role() = 'service_role');

COMMIT;
