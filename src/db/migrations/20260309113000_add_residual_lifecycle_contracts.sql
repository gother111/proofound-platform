BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lifecycle_state TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS matchable_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS restricted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_lifecycle_state_ck'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_lifecycle_state_ck
      CHECK (lifecycle_state IN ('draft', 'active_private', 'active_matchable', 'restricted', 'deleted'));
  END IF;
END $$;

UPDATE public.profiles
SET
  deleted_at = COALESCE(deleted_at, deletion_requested_at)
WHERE deleted = true
  AND deleted_at IS NULL;

UPDATE public.profiles
SET
  lifecycle_state = CASE
    WHEN COALESCE(deleted, false) OR deleted_at IS NOT NULL THEN 'deleted'
    WHEN restricted_at IS NOT NULL THEN 'restricted'
    WHEN matching_enabled IS TRUE THEN 'active_matchable'
    WHEN handle IS NOT NULL OR display_name IS NOT NULL OR avatar_url IS NOT NULL THEN 'active_private'
    ELSE 'draft'
  END,
  activated_at = CASE
    WHEN activated_at IS NOT NULL THEN activated_at
    WHEN handle IS NOT NULL OR display_name IS NOT NULL OR avatar_url IS NOT NULL THEN created_at
    ELSE activated_at
  END,
  matchable_at = CASE
    WHEN matchable_at IS NOT NULL THEN matchable_at
    WHEN matching_enabled IS TRUE THEN created_at
    ELSE matchable_at
  END;

CREATE INDEX IF NOT EXISTS profiles_lifecycle_state_idx
  ON public.profiles(lifecycle_state, updated_at);

ALTER TABLE public.org_invitations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_invitations_status_ck'
      AND conrelid = 'public.org_invitations'::regclass
  ) THEN
    ALTER TABLE public.org_invitations
      ADD CONSTRAINT org_invitations_status_ck
      CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'));
  END IF;
END $$;

UPDATE public.org_invitations
SET
  last_sent_at = COALESCE(last_sent_at, created_at),
  status = CASE
    WHEN accepted_at IS NOT NULL THEN 'accepted'
    WHEN revoked_at IS NOT NULL THEN 'revoked'
    WHEN expires_at < NOW() THEN 'expired'
    ELSE 'pending'
  END,
  expired_at = CASE
    WHEN expired_at IS NOT NULL THEN expired_at
    WHEN accepted_at IS NULL AND revoked_at IS NULL AND expires_at < NOW() THEN expires_at
    ELSE expired_at
  END,
  updated_at = NOW();

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY org_id, lower(email), status
      ORDER BY created_at DESC, id DESC
    ) AS row_num
  FROM public.org_invitations
  WHERE status = 'pending'
)
UPDATE public.org_invitations invite
SET
  status = 'expired',
  expired_at = COALESCE(invite.expired_at, invite.expires_at),
  updated_at = NOW()
WHERE invite.id IN (
  SELECT id
  FROM ranked
  WHERE row_num > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS org_invitations_pending_email_unique_idx
  ON public.org_invitations(org_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS org_invitations_status_expiry_idx
  ON public.org_invitations(status, expires_at);

ALTER TABLE public.proof_artifacts
  ADD COLUMN IF NOT EXISTS lifecycle_state TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'proof_artifacts_lifecycle_state_ck'
      AND conrelid = 'public.proof_artifacts'::regclass
  ) THEN
    ALTER TABLE public.proof_artifacts
      ADD CONSTRAINT proof_artifacts_lifecycle_state_ck
      CHECK (lifecycle_state IN ('draft', 'active', 'expiring', 'expired', 'revoked', 'deleted'));
  END IF;
END $$;

UPDATE public.proof_artifacts
SET
  expired_at = CASE
    WHEN expired_at IS NOT NULL THEN expired_at
    WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN expires_at
    ELSE expired_at
  END,
  activated_at = CASE
    WHEN activated_at IS NOT NULL THEN activated_at
    WHEN deleted_at IS NULL AND COALESCE(revoked_at, expired_at) IS NULL THEN created_at
    ELSE activated_at
  END,
  lifecycle_state = CASE
    WHEN deleted_at IS NOT NULL THEN 'deleted'
    WHEN revoked_at IS NOT NULL THEN 'revoked'
    WHEN expired_at IS NOT NULL THEN 'expired'
    WHEN expires_at IS NOT NULL AND expires_at <= NOW() + INTERVAL '14 days' THEN 'expiring'
    WHEN activated_at IS NOT NULL OR created_at IS NOT NULL THEN 'active'
    ELSE 'draft'
  END;

CREATE INDEX IF NOT EXISTS proof_artifacts_lifecycle_idx
  ON public.proof_artifacts(lifecycle_state, expires_at);

ALTER TABLE public.proof_packs
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT,
  ADD COLUMN IF NOT EXISTS cleanup_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cleanup_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS export_excluded_reason TEXT,
  ADD COLUMN IF NOT EXISTS public_surface_disabled_at TIMESTAMPTZ;

ALTER TABLE public.custom_verification_requests
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

ALTER TABLE public.skill_verification_requests
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

ALTER TABLE public.impact_story_verification_requests
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

UPDATE public.custom_verification_requests
SET expired_at = COALESCE(expired_at, expires_at)
WHERE status = 'expired'
  AND expired_at IS NULL;

UPDATE public.skill_verification_requests
SET expired_at = COALESCE(expired_at, expires_at)
WHERE status = 'expired'
  AND expired_at IS NULL;

UPDATE public.impact_story_verification_requests
SET expired_at = COALESCE(expired_at, expires_at)
WHERE status = 'expired'
  AND expired_at IS NULL;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS lifecycle_state TEXT NOT NULL DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS shortlisted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS passed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS intro_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interview_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS close_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'matches_lifecycle_state_ck'
      AND conrelid = 'public.matches'::regclass
  ) THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_lifecycle_state_ck
      CHECK (
        lifecycle_state IN (
          'generated',
          'shortlisted',
          'passed',
          'intro_in_progress',
          'interview_in_progress',
          'stale',
          'hidden_due_to_policy',
          'closed'
        )
      );
  END IF;
END $$;

UPDATE public.matches m
SET
  shortlisted_at = COALESCE(m.shortlisted_at, mrs.shortlisted_at),
  passed_at = CASE
    WHEN m.passed_at IS NOT NULL THEN m.passed_at
    WHEN mrs.review_stage = 'passed' THEN COALESCE(mrs.decision_at, m.created_at)
    ELSE m.passed_at
  END,
  intro_started_at = CASE
    WHEN m.intro_started_at IS NOT NULL THEN m.intro_started_at
    WHEN iw.state IN (
      'pending_candidate_interest',
      'pending_org_interest',
      'mutual',
      'conversation_open',
      'interview_handoff'
    ) THEN iw.created_at
    ELSE m.intro_started_at
  END,
  interview_started_at = CASE
    WHEN m.interview_started_at IS NOT NULL THEN m.interview_started_at
    WHEN iw.state = 'interview_handoff' THEN COALESCE(iw.updated_at, iw.created_at)
    ELSE m.interview_started_at
  END,
  closed_at = CASE
    WHEN m.closed_at IS NOT NULL THEN m.closed_at
    WHEN mrs.review_stage = 'closed' THEN COALESCE(mrs.decision_at, NOW())
    ELSE m.closed_at
  END,
  lifecycle_state = CASE
    WHEN m.hidden_due_to_policy_at IS NOT NULL OR m.score_state = 'hidden_due_to_policy' THEN 'hidden_due_to_policy'
    WHEN m.stale_at IS NOT NULL OR m.score_state = 'stale' THEN 'stale'
    WHEN iw.state = 'interview_handoff' THEN 'interview_in_progress'
    WHEN iw.state IN (
      'pending_candidate_interest',
      'pending_org_interest',
      'mutual',
      'conversation_open'
    ) THEN 'intro_in_progress'
    WHEN mrs.review_stage = 'passed' THEN 'passed'
    WHEN mrs.review_stage = 'shortlisted' THEN 'shortlisted'
    WHEN mrs.review_stage = 'closed' THEN 'closed'
    ELSE 'generated'
  END,
  updated_at = NOW()
FROM public.match_review_states mrs
LEFT JOIN public.intro_workflows iw
  ON iw.match_id = mrs.match_id
  AND iw.state IN (
    'pending_candidate_interest',
    'pending_org_interest',
    'mutual',
    'conversation_open',
    'interview_handoff'
  )
WHERE mrs.match_id = m.id;

CREATE INDEX IF NOT EXISTS matches_lifecycle_state_idx
  ON public.matches(lifecycle_state, updated_at);

CREATE TABLE IF NOT EXISTS public.residual_lifecycle_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type TEXT NOT NULL,
  object_id UUID NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger TEXT NOT NULL,
  reason_code TEXT,
  actor_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'residual_lifecycle_transitions_object_type_ck'
      AND conrelid = 'public.residual_lifecycle_transitions'::regclass
  ) THEN
    ALTER TABLE public.residual_lifecycle_transitions
      ADD CONSTRAINT residual_lifecycle_transitions_object_type_ck
      CHECK (
        object_type IN (
          'profile',
          'proof_artifact',
          'match',
          'verification_invite',
          'org_invite',
          'export',
          'import',
          'deletion'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'residual_lifecycle_transitions_actor_type_ck'
      AND conrelid = 'public.residual_lifecycle_transitions'::regclass
  ) THEN
    ALTER TABLE public.residual_lifecycle_transitions
      ADD CONSTRAINT residual_lifecycle_transitions_actor_type_ck
      CHECK (
        actor_type IN (
          'candidate',
          'organization_member',
          'platform_admin',
          'system',
          'service_account'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS residual_lifecycle_transitions_object_created_idx
  ON public.residual_lifecycle_transitions(object_type, object_id, created_at);

CREATE TABLE IF NOT EXISTS public.data_portability_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lifecycle_state TEXT NOT NULL DEFAULT 'requested',
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  lifecycle_operation_id UUID,
  export_format TEXT NOT NULL DEFAULT 'json',
  payload_version TEXT NOT NULL DEFAULT '3.0.0',
  payload_checksum TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  preparing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  failure_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'data_portability_exports_lifecycle_state_ck'
      AND conrelid = 'public.data_portability_exports'::regclass
  ) THEN
    ALTER TABLE public.data_portability_exports
      ADD CONSTRAINT data_portability_exports_lifecycle_state_ck
      CHECK (lifecycle_state IN ('requested', 'preparing', 'ready', 'downloaded', 'expired', 'failed', 'cancelled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS data_portability_exports_profile_requested_idx
  ON public.data_portability_exports(profile_id, requested_at);

CREATE INDEX IF NOT EXISTS data_portability_exports_lifecycle_idx
  ON public.data_portability_exports(lifecycle_state, expires_at);

CREATE TABLE IF NOT EXISTS public.data_portability_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lifecycle_state TEXT NOT NULL DEFAULT 'uploaded',
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source_filename TEXT,
  source_checksum TEXT,
  import_mode TEXT NOT NULL DEFAULT 'merge',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  consent_confirmed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  failure_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'data_portability_imports_lifecycle_state_ck'
      AND conrelid = 'public.data_portability_imports'::regclass
  ) THEN
    ALTER TABLE public.data_portability_imports
      ADD CONSTRAINT data_portability_imports_lifecycle_state_ck
      CHECK (
        lifecycle_state IN (
          'uploaded',
          'validating',
          'awaiting_confirmation',
          'applying',
          'completed',
          'rejected',
          'expired',
          'failed',
          'cancelled'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'data_portability_imports_mode_ck'
      AND conrelid = 'public.data_portability_imports'::regclass
  ) THEN
    ALTER TABLE public.data_portability_imports
      ADD CONSTRAINT data_portability_imports_mode_ck
      CHECK (import_mode IN ('merge', 'replace'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS data_portability_imports_profile_uploaded_idx
  ON public.data_portability_imports(profile_id, uploaded_at);

CREATE INDEX IF NOT EXISTS data_portability_imports_lifecycle_idx
  ON public.data_portability_imports(lifecycle_state, uploaded_at);

CREATE TABLE IF NOT EXISTS public.profile_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lifecycle_state TEXT NOT NULL DEFAULT 'requested',
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  lifecycle_operation_id UUID,
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_started_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_code TEXT,
  block_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profile_deletion_requests_lifecycle_state_ck'
      AND conrelid = 'public.profile_deletion_requests'::regclass
  ) THEN
    ALTER TABLE public.profile_deletion_requests
      ADD CONSTRAINT profile_deletion_requests_lifecycle_state_ck
      CHECK (
        lifecycle_state IN (
          'requested',
          'blocked_legal_hold',
          'processing',
          'deleted',
          'failed_requires_manual_review'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profile_deletion_requests_profile_requested_idx
  ON public.profile_deletion_requests(profile_id, requested_at);

CREATE INDEX IF NOT EXISTS profile_deletion_requests_lifecycle_idx
  ON public.profile_deletion_requests(lifecycle_state, requested_at);

ALTER TABLE public.residual_lifecycle_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_portability_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_portability_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_deletion_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'data_portability_exports'
      AND policyname = 'data_portability_exports_select_own'
  ) THEN
    CREATE POLICY data_portability_exports_select_own
      ON public.data_portability_exports
      FOR SELECT
      TO authenticated
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'data_portability_exports'
      AND policyname = 'data_portability_exports_insert_own'
  ) THEN
    CREATE POLICY data_portability_exports_insert_own
      ON public.data_portability_exports
      FOR INSERT
      TO authenticated
      WITH CHECK (
        profile_id = auth.uid()
        AND (requested_by IS NULL OR requested_by = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'data_portability_imports'
      AND policyname = 'data_portability_imports_select_own'
  ) THEN
    CREATE POLICY data_portability_imports_select_own
      ON public.data_portability_imports
      FOR SELECT
      TO authenticated
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'data_portability_imports'
      AND policyname = 'data_portability_imports_insert_own'
  ) THEN
    CREATE POLICY data_portability_imports_insert_own
      ON public.data_portability_imports
      FOR INSERT
      TO authenticated
      WITH CHECK (
        profile_id = auth.uid()
        AND (requested_by IS NULL OR requested_by = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_deletion_requests'
      AND policyname = 'profile_deletion_requests_select_own'
  ) THEN
    CREATE POLICY profile_deletion_requests_select_own
      ON public.profile_deletion_requests
      FOR SELECT
      TO authenticated
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_deletion_requests'
      AND policyname = 'profile_deletion_requests_insert_own'
  ) THEN
    CREATE POLICY profile_deletion_requests_insert_own
      ON public.profile_deletion_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (
        profile_id = auth.uid()
        AND (requested_by IS NULL OR requested_by = auth.uid())
      );
  END IF;
END $$;

COMMIT;
