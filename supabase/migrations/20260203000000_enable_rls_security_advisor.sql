-- =========================================================================
-- Security Advisor RLS Remediation
-- Migration: 20260203_enable_rls_security_advisor
-- Date: 2026-02-03
-- Purpose: Enable RLS + least-privilege policies for tables flagged by
--          Supabase Security Advisor. Includes token-based RPCs for
--          external invite flows without exposing tables directly.
-- =========================================================================

-- -------------------------------------------------------------------------
-- Helper functions (safe search_path)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND status = 'active'
  );
END;
$function$;

COMMENT ON FUNCTION public.is_org_member IS
  'Check if user is an active member of an organization. SECURITY DEFINER to avoid RLS recursion.';

CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_user_id
      AND platform_role IN ('platform_admin', 'super_admin')
  );
END;
$function$;

COMMENT ON FUNCTION public.is_platform_admin IS
  'Check if user is a platform admin. SECURITY DEFINER to avoid RLS recursion.';

-- -------------------------------------------------------------------------
-- Enable RLS + drop existing policies for target tables
-- -------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  pol record;
  tables text[] := ARRAY[
    'active_ties',
    'application_stages',
    'application_timeline',
    'assignment_invitations',
    'assignment_submissions',
    'assignment_templates',
    'assignment_version_history',
    'blocked_users',
    'content_reports',
    'dashboard_layouts',
    'demographic_opt_ins',
    'editorial_matches',
    'fairness_metrics',
    'fairness_notes',
    'interview_reflections',
    'match_rank_history',
    'match_suggestions',
    'moderation_actions',
    'org_verification',
    'organization_follows',
    'performance_alerts',
    'performance_metrics',
    'purpose_edit_log',
    'survey_display_log',
    'sus_survey_prompts',
    'sus_surveys',
    'user_consents',
    'user_violations',
    'verification_appeals',
    'verification_responses'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

      FOR pol IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- -------------------------------------------------------------------------
-- OWNER-ONLY TABLES
-- -------------------------------------------------------------------------
-- dashboard_layouts
CREATE POLICY "dashboard_layouts_owner_select"
  ON dashboard_layouts FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "dashboard_layouts_owner_insert"
  ON dashboard_layouts FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "dashboard_layouts_owner_update"
  ON dashboard_layouts FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "dashboard_layouts_owner_delete"
  ON dashboard_layouts FOR DELETE
  USING ((select auth.uid()) = user_id);

-- demographic_opt_ins
CREATE POLICY "demographic_opt_ins_owner_select"
  ON demographic_opt_ins FOR SELECT
  USING ((select auth.uid()) = profile_id);

CREATE POLICY "demographic_opt_ins_owner_insert"
  ON demographic_opt_ins FOR INSERT
  WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "demographic_opt_ins_owner_update"
  ON demographic_opt_ins FOR UPDATE
  USING ((select auth.uid()) = profile_id)
  WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "demographic_opt_ins_owner_delete"
  ON demographic_opt_ins FOR DELETE
  USING ((select auth.uid()) = profile_id);

-- sus_surveys
CREATE POLICY "sus_surveys_owner_select"
  ON sus_surveys FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "sus_surveys_owner_insert"
  ON sus_surveys FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- sus_survey_prompts
CREATE POLICY "sus_survey_prompts_owner_select"
  ON sus_survey_prompts FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "sus_survey_prompts_owner_insert"
  ON sus_survey_prompts FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "sus_survey_prompts_owner_update"
  ON sus_survey_prompts FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- survey_display_log
CREATE POLICY "survey_display_log_owner_select"
  ON survey_display_log FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "survey_display_log_owner_insert"
  ON survey_display_log FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- purpose_edit_log (append-only)
CREATE POLICY "purpose_edit_log_owner_select"
  ON purpose_edit_log FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "purpose_edit_log_owner_or_service_insert"
  ON purpose_edit_log FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (select current_setting('role', true)) = 'service_role'
  );

-- blocked_users
CREATE POLICY "blocked_users_owner_all"
  ON blocked_users FOR ALL
  USING ((select auth.uid()) = blocker_id)
  WITH CHECK ((select auth.uid()) = blocker_id);

-- user_consents
CREATE POLICY "user_consents_owner_select"
  ON user_consents FOR SELECT
  USING ((select auth.uid()) = profile_id);

CREATE POLICY "user_consents_owner_insert"
  ON user_consents FOR INSERT
  WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "user_consents_service_insert"
  ON user_consents FOR INSERT
  WITH CHECK ((select current_setting('role', true)) = 'service_role');

-- -------------------------------------------------------------------------
-- ORG-MEMBER TABLES
-- -------------------------------------------------------------------------
-- assignment_templates
CREATE POLICY "assignment_templates_select"
  ON assignment_templates FOR SELECT
  USING (
    is_global = true
    OR is_org_member(org_id, (select auth.uid()))
    OR (select is_platform_admin())
  );

CREATE POLICY "assignment_templates_insert"
  ON assignment_templates FOR INSERT
  WITH CHECK (
    is_org_member(org_id, (select auth.uid()))
    OR (select is_platform_admin())
  );

CREATE POLICY "assignment_templates_update"
  ON assignment_templates FOR UPDATE
  USING (
    (is_global = false AND is_org_member(org_id, (select auth.uid())))
    OR (select is_platform_admin())
  )
  WITH CHECK (
    (is_global = false AND is_org_member(org_id, (select auth.uid())))
    OR (select is_platform_admin())
  );

CREATE POLICY "assignment_templates_delete"
  ON assignment_templates FOR DELETE
  USING (
    (is_global = false AND is_org_member(org_id, (select auth.uid())))
    OR (select is_platform_admin())
  );

-- assignment_invitations
CREATE POLICY "assignment_invitations_select"
  ON assignment_invitations FOR SELECT
  USING (
    is_org_member(org_id, (select auth.uid()))
    OR created_by = (select auth.uid())
    OR (select is_platform_admin())
  );

CREATE POLICY "assignment_invitations_insert"
  ON assignment_invitations FOR INSERT
  WITH CHECK (
    is_org_member(org_id, (select auth.uid()))
    OR (select is_platform_admin())
  );

CREATE POLICY "assignment_invitations_update"
  ON assignment_invitations FOR UPDATE
  USING (
    is_org_member(org_id, (select auth.uid()))
    OR created_by = (select auth.uid())
    OR (select is_platform_admin())
  )
  WITH CHECK (
    is_org_member(org_id, (select auth.uid()))
    OR created_by = (select auth.uid())
    OR (select is_platform_admin())
  );

CREATE POLICY "assignment_invitations_delete"
  ON assignment_invitations FOR DELETE
  USING (
    is_org_member(org_id, (select auth.uid()))
    OR created_by = (select auth.uid())
    OR (select is_platform_admin())
  );

-- assignment_submissions
CREATE POLICY "assignment_submissions_select"
  ON assignment_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM assignment_invitations ai
      WHERE ai.id = invitation_id
        AND (
          is_org_member(ai.org_id, (select auth.uid()))
          OR ai.created_by = (select auth.uid())
          OR (select is_platform_admin())
        )
    )
  );

CREATE POLICY "assignment_submissions_update"
  ON assignment_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM assignment_invitations ai
      WHERE ai.id = invitation_id
        AND (
          is_org_member(ai.org_id, (select auth.uid()))
          OR ai.created_by = (select auth.uid())
          OR (select is_platform_admin())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM assignment_invitations ai
      WHERE ai.id = invitation_id
        AND (
          is_org_member(ai.org_id, (select auth.uid()))
          OR ai.created_by = (select auth.uid())
          OR (select is_platform_admin())
        )
    )
  );

CREATE POLICY "assignment_submissions_delete"
  ON assignment_submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM assignment_invitations ai
      WHERE ai.id = invitation_id
        AND (
          is_org_member(ai.org_id, (select auth.uid()))
          OR ai.created_by = (select auth.uid())
          OR (select is_platform_admin())
        )
    )
  );

-- assignment_version_history
CREATE POLICY "assignment_version_history_select"
  ON assignment_version_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM assignment_submissions s
      INNER JOIN assignment_invitations ai ON ai.id = s.invitation_id
      WHERE s.id = submission_id
        AND (
          is_org_member(ai.org_id, (select auth.uid()))
          OR ai.created_by = (select auth.uid())
          OR (select is_platform_admin())
        )
    )
  );

CREATE POLICY "assignment_version_history_service_insert"
  ON assignment_version_history FOR INSERT
  WITH CHECK ((select current_setting('role', true)) = 'service_role');

-- -------------------------------------------------------------------------
-- VERIFICATION & APPEALS
-- -------------------------------------------------------------------------
-- verification_responses
CREATE POLICY "verification_responses_select"
  ON verification_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM verification_requests vr
      WHERE vr.id = request_id
        AND vr.profile_id = (select auth.uid())
    )
    OR (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

-- verification_appeals
CREATE POLICY "verification_appeals_select"
  ON verification_appeals FOR SELECT
  USING (
    profile_id = (select auth.uid())
    OR (select is_platform_admin())
  );

CREATE POLICY "verification_appeals_insert"
  ON verification_appeals FOR INSERT
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "verification_appeals_update"
  ON verification_appeals FOR UPDATE
  USING ((select is_platform_admin()))
  WITH CHECK ((select is_platform_admin()));

-- -------------------------------------------------------------------------
-- MODERATION
-- -------------------------------------------------------------------------
-- content_reports
CREATE POLICY "content_reports_insert"
  ON content_reports FOR INSERT
  WITH CHECK (reporter_id = (select auth.uid()));

CREATE POLICY "content_reports_select"
  ON content_reports FOR SELECT
  USING (
    reporter_id = (select auth.uid())
    OR (select is_platform_admin())
  );

CREATE POLICY "content_reports_update"
  ON content_reports FOR UPDATE
  USING ((select is_platform_admin()))
  WITH CHECK ((select is_platform_admin()));

CREATE POLICY "content_reports_delete"
  ON content_reports FOR DELETE
  USING ((select is_platform_admin()));

-- moderation_actions
CREATE POLICY "moderation_actions_admin_all"
  ON moderation_actions FOR ALL
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  )
  WITH CHECK (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

-- user_violations
CREATE POLICY "user_violations_admin_select"
  ON user_violations FOR SELECT
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "user_violations_admin_insert"
  ON user_violations FOR INSERT
  WITH CHECK (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "user_violations_admin_update"
  ON user_violations FOR UPDATE
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  )
  WITH CHECK (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "user_violations_admin_delete"
  ON user_violations FOR DELETE
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

-- -------------------------------------------------------------------------
-- ORG VERIFICATION
-- -------------------------------------------------------------------------
CREATE POLICY "org_verification_select"
  ON org_verification FOR SELECT
  USING (
    is_org_member(org_id, (select auth.uid()))
    OR (select is_platform_admin())
  );

CREATE POLICY "org_verification_admin_insert"
  ON org_verification FOR INSERT
  WITH CHECK (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "org_verification_admin_update"
  ON org_verification FOR UPDATE
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  )
  WITH CHECK (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "org_verification_admin_delete"
  ON org_verification FOR DELETE
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

-- -------------------------------------------------------------------------
-- MATCHING & CURATION
-- -------------------------------------------------------------------------
-- match_suggestions
CREATE POLICY "match_suggestions_select"
  ON match_suggestions FOR SELECT
  USING (
    profile_id = (select auth.uid())
    OR (select is_platform_admin())
  );

CREATE POLICY "match_suggestions_service_insert"
  ON match_suggestions FOR INSERT
  WITH CHECK ((select current_setting('role', true)) = 'service_role');

CREATE POLICY "match_suggestions_update"
  ON match_suggestions FOR UPDATE
  USING (
    profile_id = (select auth.uid())
    OR (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  )
  WITH CHECK (
    profile_id = (select auth.uid())
    OR (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "match_suggestions_delete"
  ON match_suggestions FOR DELETE
  USING (
    profile_id = (select auth.uid())
    OR (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

-- editorial_matches
CREATE POLICY "editorial_matches_admin_select"
  ON editorial_matches FOR SELECT
  USING ((select is_platform_admin()));

CREATE POLICY "editorial_matches_admin_insert"
  ON editorial_matches FOR INSERT
  WITH CHECK (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "editorial_matches_admin_update"
  ON editorial_matches FOR UPDATE
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  )
  WITH CHECK (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "editorial_matches_admin_delete"
  ON editorial_matches FOR DELETE
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

-- active_ties (system-only)
CREATE POLICY "active_ties_service_all"
  ON active_ties FOR ALL
  USING ((select current_setting('role', true)) = 'service_role')
  WITH CHECK ((select current_setting('role', true)) = 'service_role');

-- -------------------------------------------------------------------------
-- FAIRNESS & PERFORMANCE
-- -------------------------------------------------------------------------
-- fairness_metrics
CREATE POLICY "fairness_metrics_admin_select"
  ON fairness_metrics FOR SELECT
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "fairness_metrics_service_write"
  ON fairness_metrics FOR INSERT
  WITH CHECK ((select current_setting('role', true)) = 'service_role');

CREATE POLICY "fairness_metrics_service_update"
  ON fairness_metrics FOR UPDATE
  USING ((select current_setting('role', true)) = 'service_role')
  WITH CHECK ((select current_setting('role', true)) = 'service_role');

CREATE POLICY "fairness_metrics_service_delete"
  ON fairness_metrics FOR DELETE
  USING ((select current_setting('role', true)) = 'service_role');

-- fairness_notes
CREATE POLICY "fairness_notes_admin_select"
  ON fairness_notes FOR SELECT
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "fairness_notes_service_write"
  ON fairness_notes FOR INSERT
  WITH CHECK ((select current_setting('role', true)) = 'service_role');

CREATE POLICY "fairness_notes_service_update"
  ON fairness_notes FOR UPDATE
  USING ((select current_setting('role', true)) = 'service_role')
  WITH CHECK ((select current_setting('role', true)) = 'service_role');

CREATE POLICY "fairness_notes_service_delete"
  ON fairness_notes FOR DELETE
  USING ((select current_setting('role', true)) = 'service_role');

-- performance_metrics
CREATE POLICY "performance_metrics_admin_select"
  ON performance_metrics FOR SELECT
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "performance_metrics_service_write"
  ON performance_metrics FOR INSERT
  WITH CHECK ((select current_setting('role', true)) = 'service_role');

CREATE POLICY "performance_metrics_service_update"
  ON performance_metrics FOR UPDATE
  USING ((select current_setting('role', true)) = 'service_role')
  WITH CHECK ((select current_setting('role', true)) = 'service_role');

CREATE POLICY "performance_metrics_service_delete"
  ON performance_metrics FOR DELETE
  USING ((select current_setting('role', true)) = 'service_role');

-- performance_alerts
CREATE POLICY "performance_alerts_admin_select"
  ON performance_alerts FOR SELECT
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "performance_alerts_service_insert"
  ON performance_alerts FOR INSERT
  WITH CHECK ((select current_setting('role', true)) = 'service_role');

CREATE POLICY "performance_alerts_admin_update"
  ON performance_alerts FOR UPDATE
  USING (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  )
  WITH CHECK (
    (select is_platform_admin())
    OR (select current_setting('role', true)) = 'service_role'
  );

CREATE POLICY "performance_alerts_service_delete"
  ON performance_alerts FOR DELETE
  USING ((select current_setting('role', true)) = 'service_role');

-- -------------------------------------------------------------------------
-- Token-based RPCs (invite/verification flows)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_assignment_invitation_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  org_id uuid,
  stakeholder_email text,
  stakeholder_name text,
  assigned_sections jsonb,
  message text,
  status text,
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ai.id,
    ai.org_id,
    ai.stakeholder_email,
    ai.stakeholder_name,
    ai.assigned_sections,
    ai.message,
    ai.status,
    ai.expires_at,
    ai.completed_at,
    ai.created_at
  FROM assignment_invitations ai
  WHERE ai.token = p_token
    AND ai.expires_at > NOW()
    AND ai.status NOT IN ('completed', 'expired')
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_assignment_response_by_token(
  p_token text,
  p_section_name text,
  p_section_data jsonb
)
RETURNS TABLE (
  id uuid,
  invitation_id uuid,
  section_name text,
  section_data jsonb,
  submitted_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
  v_invitation_id uuid;
BEGIN
  SELECT ai.id
  INTO v_invitation_id
  FROM assignment_invitations ai
  WHERE ai.token = p_token
    AND ai.expires_at > NOW()
    AND ai.status NOT IN ('completed', 'expired')
    AND (
      ai.assigned_sections IS NULL
      OR ai.assigned_sections ? p_section_name
    )
  LIMIT 1;

  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  -- Update invitation status on first response
  UPDATE assignment_invitations
  SET status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END,
      updated_at = NOW()
  WHERE id = v_invitation_id;

  RETURN QUERY
  INSERT INTO assignment_submissions (invitation_id, section_name, section_data)
  VALUES (v_invitation_id, p_section_name, p_section_data)
  RETURNING id, invitation_id, section_name, section_data, submitted_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_verification_response_by_token(
  p_token text,
  p_response_type text,
  p_reason text DEFAULT NULL,
  p_verifier_seniority integer DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  request_id uuid,
  response_type text,
  responded_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
  v_request_id uuid;
  v_new_status text;
BEGIN
  IF p_response_type NOT IN ('accept', 'decline', 'cannot_verify') THEN
    RAISE EXCEPTION 'Invalid response type';
  END IF;

  SELECT vr.id
  INTO v_request_id
  FROM verification_requests vr
  WHERE vr.token = p_token
    AND vr.expires_at > NOW()
    AND vr.status = 'pending'
  LIMIT 1;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired verification token';
  END IF;

  IF EXISTS (SELECT 1 FROM verification_responses WHERE request_id = v_request_id) THEN
    RAISE EXCEPTION 'Verification response already submitted';
  END IF;

  v_new_status := CASE
    WHEN p_response_type = 'accept' THEN 'accepted'
    WHEN p_response_type = 'decline' THEN 'declined'
    ELSE 'cannot_verify'
  END;

  UPDATE verification_requests
  SET status = v_new_status,
      responded_at = NOW()
  WHERE id = v_request_id;

  RETURN QUERY
  INSERT INTO verification_responses (
    request_id,
    response_type,
    reason,
    verifier_seniority,
    notes,
    ip_address,
    user_agent
  )
  VALUES (
    v_request_id,
    p_response_type,
    p_reason,
    p_verifier_seniority,
    p_notes,
    p_ip_address,
    p_user_agent
  )
  RETURNING id, request_id, response_type, responded_at;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_assignment_invitation_by_token(text) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_assignment_response_by_token(text, text, jsonb) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_verification_response_by_token(text, text, text, integer, text, text, text) TO anon, authenticated;

-- -------------------------------------------------------------------------
-- Indexes for RLS predicate columns
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);

CREATE INDEX IF NOT EXISTS idx_demographic_opt_ins_profile_id ON demographic_opt_ins(profile_id);

CREATE INDEX IF NOT EXISTS idx_sus_surveys_user_id ON sus_surveys(user_id);

CREATE INDEX IF NOT EXISTS idx_sus_survey_prompts_user_id ON sus_survey_prompts(user_id);

CREATE INDEX IF NOT EXISTS idx_survey_display_log_user_id ON survey_display_log(user_id);

CREATE INDEX IF NOT EXISTS idx_purpose_edit_log_user_id ON purpose_edit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);

CREATE INDEX IF NOT EXISTS idx_user_consents_profile_id ON user_consents(profile_id);

CREATE INDEX IF NOT EXISTS idx_assignment_templates_org_id ON assignment_templates(org_id);

CREATE INDEX IF NOT EXISTS idx_assignment_invitations_org_id ON assignment_invitations(org_id);

CREATE INDEX IF NOT EXISTS idx_assignment_invitations_created_by ON assignment_invitations(created_by);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_invitation_id ON assignment_submissions(invitation_id);

CREATE INDEX IF NOT EXISTS idx_assignment_version_history_submission_id ON assignment_version_history(submission_id);

CREATE INDEX IF NOT EXISTS idx_verification_responses_request_id ON verification_responses(request_id);

CREATE INDEX IF NOT EXISTS idx_verification_appeals_profile_id ON verification_appeals(profile_id);

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_report_id ON moderation_actions(report_id);

CREATE INDEX IF NOT EXISTS idx_user_violations_user_id ON user_violations(user_id);

CREATE INDEX IF NOT EXISTS idx_org_verification_org_id ON org_verification(org_id);

CREATE INDEX IF NOT EXISTS idx_match_suggestions_profile_id ON match_suggestions(profile_id);

-- -------------------------------------------------------------------------
-- Unknown tables (auto-policy based on columns)
-- -------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  has_user_id boolean;
  has_profile_id boolean;
  has_org_id boolean;
  owner_pred text;
  policy_sql text;
  tables text[] := ARRAY[
    'application_stages',
    'application_timeline',
    'interview_reflections',
    'match_rank_history',
    'organization_follows'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      CONTINUE;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id'
    ) INTO has_user_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'profile_id'
    ) INTO has_profile_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'org_id'
    ) INTO has_org_id;

    owner_pred := '';
    IF has_user_id THEN
      owner_pred := owner_pred || '(user_id = (select auth.uid()))';
    END IF;
    IF has_profile_id THEN
      IF owner_pred <> '' THEN
        owner_pred := owner_pred || ' OR ';
      END IF;
      owner_pred := owner_pred || '(profile_id = (select auth.uid()))';
    END IF;

    IF has_org_id AND owner_pred <> '' THEN
      policy_sql := format(
        'CREATE POLICY %I ON %I FOR ALL USING ((%s) OR is_org_member(org_id, (select auth.uid())) OR (select is_platform_admin()) OR (select current_setting(''role'', true)) = ''service_role'') WITH CHECK ((%s) OR is_org_member(org_id, (select auth.uid())) OR (select is_platform_admin()) OR (select current_setting(''role'', true)) = ''service_role'')',
        tbl || '_auto_all',
        tbl,
        owner_pred,
        owner_pred
      );
    ELSIF has_org_id THEN
      policy_sql := format(
        'CREATE POLICY %I ON %I FOR ALL USING (is_org_member(org_id, (select auth.uid())) OR (select is_platform_admin()) OR (select current_setting(''role'', true)) = ''service_role'') WITH CHECK (is_org_member(org_id, (select auth.uid())) OR (select is_platform_admin()) OR (select current_setting(''role'', true)) = ''service_role'')',
        tbl || '_auto_all',
        tbl
      );
    ELSIF owner_pred <> '' THEN
      policy_sql := format(
        'CREATE POLICY %I ON %I FOR ALL USING ((%s) OR (select is_platform_admin()) OR (select current_setting(''role'', true)) = ''service_role'') WITH CHECK ((%s) OR (select is_platform_admin()) OR (select current_setting(''role'', true)) = ''service_role'')',
        tbl || '_auto_all',
        tbl,
        owner_pred,
        owner_pred
      );
    ELSE
      policy_sql := format(
        'CREATE POLICY %I ON %I FOR ALL USING ((select is_platform_admin()) OR (select current_setting(''role'', true)) = ''service_role'') WITH CHECK ((select is_platform_admin()) OR (select current_setting(''role'', true)) = ''service_role'')',
        tbl || '_auto_all',
        tbl
      );
    END IF;

    EXECUTE policy_sql;
  END LOOP;
END $$;

-- -------------------------------------------------------------------------
-- Verification: ensure RLS enabled
-- -------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'active_ties',
    'application_stages',
    'application_timeline',
    'assignment_invitations',
    'assignment_submissions',
    'assignment_templates',
    'assignment_version_history',
    'blocked_users',
    'content_reports',
    'dashboard_layouts',
    'demographic_opt_ins',
    'editorial_matches',
    'fairness_metrics',
    'fairness_notes',
    'interview_reflections',
    'match_rank_history',
    'match_suggestions',
    'moderation_actions',
    'org_verification',
    'organization_follows',
    'performance_alerts',
    'performance_metrics',
    'purpose_edit_log',
    'survey_display_log',
    'sus_survey_prompts',
    'sus_surveys',
    'user_consents',
    'user_violations',
    'verification_appeals',
    'verification_responses'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      IF NOT (
        SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
      ) THEN
        RAISE EXCEPTION 'RLS not enabled on table: %', tbl;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE 'RLS verification passed for Security Advisor tables';
END $$;
