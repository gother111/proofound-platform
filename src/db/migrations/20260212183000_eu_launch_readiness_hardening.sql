-- =========================================================================
-- EU Launch Readiness Hardening
-- Date: 2026-02-12
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1) Fix assignment visibility trigger drift
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auto_populate_field_visibility()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.assignment_field_visibility (
    assignment_id,
    field_name,
    visibility_level,
    redaction_type,
    generic_label
  )
  SELECT
    NEW.id,
    d.field_name,
    d.default_visibility,
    d.default_redaction_type,
    d.default_generic_label
  FROM public.assignment_field_visibility_defaults d
  ON CONFLICT (assignment_id, field_name) DO NOTHING;

  RETURN NEW;
END;
$$;

-- -------------------------------------------------------------------------
-- 2) Harden verification_requests RLS (remove public token bypass)
-- -------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_requests FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Verifiers can view requests via token" ON public.verification_requests;
DROP POLICY IF EXISTS "verifier_reads_by_token" ON public.verification_requests;
DROP POLICY IF EXISTS "Verification requests - requester can select" ON public.verification_requests;
DROP POLICY IF EXISTS "Verification requests - requester can insert" ON public.verification_requests;
DROP POLICY IF EXISTS "Verification requests - requester can update" ON public.verification_requests;
DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Users can create verification requests for their claims" ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_requester_select ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_requester_insert ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_requester_update ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_service_role_all ON public.verification_requests;

CREATE POLICY verification_requests_requester_select
  ON public.verification_requests
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY verification_requests_requester_insert
  ON public.verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY verification_requests_requester_update
  ON public.verification_requests
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY verification_requests_service_role_all
  ON public.verification_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 3) Harden analytics_events RLS (remove permissive public policy)
-- -------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.analytics_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role can insert events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can read own events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can read all events" ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_owner_select ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_owner_insert ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_admin_select ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_service_role_all ON public.analytics_events;

CREATE POLICY analytics_events_owner_select
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY analytics_events_owner_insert
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY analytics_events_admin_select
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

CREATE POLICY analytics_events_service_role_all
  ON public.analytics_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 4) Moderation rights workflow storage (appeals + statements of reasons)
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.moderation_statements_of_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderation_action_id UUID NOT NULL REFERENCES public.moderation_actions(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.content_reports(id) ON DELETE CASCADE,
  subject_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason_summary TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  evidence_summary TEXT NOT NULL,
  appeal_available BOOLEAN NOT NULL DEFAULT TRUE,
  appeal_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT moderation_statements_unique_action UNIQUE (moderation_action_id)
);

CREATE TABLE IF NOT EXISTS public.moderation_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderation_action_id UUID NOT NULL REFERENCES public.moderation_actions(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.content_reports(id) ON DELETE CASCADE,
  appellant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'upheld', 'rejected', 'withdrawn')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT moderation_appeals_unique_appellant UNIQUE (moderation_action_id, appellant_id)
);

CREATE INDEX IF NOT EXISTS idx_moderation_statements_report_id
  ON public.moderation_statements_of_reasons(report_id);
CREATE INDEX IF NOT EXISTS idx_moderation_statements_subject_user
  ON public.moderation_statements_of_reasons(subject_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_action_id
  ON public.moderation_appeals(moderation_action_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_appellant
  ON public.moderation_appeals(appellant_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_status
  ON public.moderation_appeals(status);

ALTER TABLE public.moderation_statements_of_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_statements_of_reasons FORCE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_appeals FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moderation_statements_visibility ON public.moderation_statements_of_reasons;
DROP POLICY IF EXISTS moderation_statements_admin_insert ON public.moderation_statements_of_reasons;
DROP POLICY IF EXISTS moderation_statements_admin_update ON public.moderation_statements_of_reasons;
DROP POLICY IF EXISTS moderation_statements_service_role_all ON public.moderation_statements_of_reasons;

CREATE POLICY moderation_statements_visibility
  ON public.moderation_statements_of_reasons
  FOR SELECT
  TO authenticated
  USING (
    subject_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.content_reports cr
      WHERE cr.id = moderation_statements_of_reasons.report_id
        AND (cr.reporter_id = auth.uid() OR cr.content_owner_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.moderation_actions ma
      WHERE ma.id = moderation_statements_of_reasons.moderation_action_id
        AND ma.moderator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

CREATE POLICY moderation_statements_admin_insert
  ON public.moderation_statements_of_reasons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

CREATE POLICY moderation_statements_admin_update
  ON public.moderation_statements_of_reasons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

CREATE POLICY moderation_statements_service_role_all
  ON public.moderation_statements_of_reasons
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS moderation_appeals_appellant_select ON public.moderation_appeals;
DROP POLICY IF EXISTS moderation_appeals_appellant_insert ON public.moderation_appeals;
DROP POLICY IF EXISTS moderation_appeals_admin_select ON public.moderation_appeals;
DROP POLICY IF EXISTS moderation_appeals_admin_update ON public.moderation_appeals;
DROP POLICY IF EXISTS moderation_appeals_service_role_all ON public.moderation_appeals;

CREATE POLICY moderation_appeals_appellant_select
  ON public.moderation_appeals
  FOR SELECT
  TO authenticated
  USING (appellant_id = auth.uid());

CREATE POLICY moderation_appeals_appellant_insert
  ON public.moderation_appeals
  FOR INSERT
  TO authenticated
  WITH CHECK (appellant_id = auth.uid());

CREATE POLICY moderation_appeals_admin_select
  ON public.moderation_appeals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

CREATE POLICY moderation_appeals_admin_update
  ON public.moderation_appeals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

CREATE POLICY moderation_appeals_service_role_all
  ON public.moderation_appeals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Keep updated_at in sync
DROP TRIGGER IF EXISTS set_updated_at_moderation_statements_of_reasons ON public.moderation_statements_of_reasons;
CREATE TRIGGER set_updated_at_moderation_statements_of_reasons
  BEFORE UPDATE ON public.moderation_statements_of_reasons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_moderation_appeals ON public.moderation_appeals;
CREATE TRIGGER set_updated_at_moderation_appeals
  BEFORE UPDATE ON public.moderation_appeals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
