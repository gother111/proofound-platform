-- ============================================================================
-- RLS Hardening Helpers + Sensitive Table Policy Normalization
-- Date: 2026-02-12
-- ============================================================================

-- Current authenticated profile helper.
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Organization membership helper (optionally role-constrained).
CREATE OR REPLACE FUNCTION public.is_org_member(
  p_org_id uuid,
  p_roles text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.org_id = p_org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND (
        p_roles IS NULL
        OR cardinality(p_roles) = 0
        OR om.role = ANY(p_roles)
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, text[]) TO authenticated, service_role;

-- Ensure RLS is explicitly enabled for all public tables.
DO $$
DECLARE
  table_record record;
BEGIN
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
  END LOOP;
END $$;

-- Force RLS on sensitive domains.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'notifications',
    'notification_preferences',
    'user_consents',
    'skill_proofs',
    'skill_verification_requests',
    'verification_requests',
    'content_reports',
    'moderation_actions',
    'user_violations',
    'decisions',
    'decision_reminders'
  ] LOOP
    IF to_regclass(format('public.%s', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    END IF;
  END LOOP;
END $$;

-- Notifications: owner-only access.
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'notifications'
         AND policyname = 'rls_v2_notifications_owner'
     ) THEN
    EXECUTE '
      CREATE POLICY rls_v2_notifications_owner
      ON public.notifications
      FOR ALL
      USING (user_id = public.current_profile_id())
      WITH CHECK (user_id = public.current_profile_id())
    ';
  END IF;
END $$;

-- Notification preferences: owner-only access.
DO $$
BEGIN
  IF to_regclass('public.notification_preferences') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'notification_preferences'
         AND policyname = 'rls_v2_notification_preferences_owner'
     ) THEN
    EXECUTE '
      CREATE POLICY rls_v2_notification_preferences_owner
      ON public.notification_preferences
      FOR ALL
      USING (user_id = public.current_profile_id())
      WITH CHECK (user_id = public.current_profile_id())
    ';
  END IF;
END $$;

-- User consent rows: owner-only access.
DO $$
BEGIN
  IF to_regclass('public.user_consents') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'user_consents'
         AND policyname = 'rls_v2_user_consents_owner'
     ) THEN
    EXECUTE '
      CREATE POLICY rls_v2_user_consents_owner
      ON public.user_consents
      FOR ALL
      USING (profile_id = public.current_profile_id())
      WITH CHECK (profile_id = public.current_profile_id())
    ';
  END IF;
END $$;

-- Skill proofs: owner-only access.
DO $$
BEGIN
  IF to_regclass('public.skill_proofs') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'skill_proofs'
         AND policyname = 'rls_v2_skill_proofs_owner'
     ) THEN
    EXECUTE '
      CREATE POLICY rls_v2_skill_proofs_owner
      ON public.skill_proofs
      FOR ALL
      USING (profile_id = public.current_profile_id())
      WITH CHECK (profile_id = public.current_profile_id())
    ';
  END IF;
END $$;

-- Skill verification requests: requester and selected verifier access.
DO $$
BEGIN
  IF to_regclass('public.skill_verification_requests') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'skill_verification_requests'
         AND policyname = 'rls_v2_skill_verification_requests_participants'
     ) THEN
    EXECUTE '
      CREATE POLICY rls_v2_skill_verification_requests_participants
      ON public.skill_verification_requests
      FOR ALL
      USING (
        requester_profile_id = public.current_profile_id()
        OR verifier_profile_id = public.current_profile_id()
      )
      WITH CHECK (
        requester_profile_id = public.current_profile_id()
        OR verifier_profile_id = public.current_profile_id()
      )
    ';
  END IF;
END $$;

-- Moderation reports: reporter or content owner can read; reporter can write.
DO $$
BEGIN
  IF to_regclass('public.content_reports') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'content_reports'
         AND policyname = 'rls_v2_content_reports_reporter_owner'
     ) THEN
    EXECUTE '
      CREATE POLICY rls_v2_content_reports_reporter_owner
      ON public.content_reports
      FOR ALL
      USING (
        reporter_id = public.current_profile_id()
        OR content_owner_id = public.current_profile_id()
      )
      WITH CHECK (reporter_id = public.current_profile_id())
    ';
  END IF;
END $$;

-- Moderation actions: visible to moderator or report participants.
DO $$
BEGIN
  IF to_regclass('public.moderation_actions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'moderation_actions'
         AND policyname = 'rls_v2_moderation_actions_visibility'
     ) THEN
    EXECUTE '
      CREATE POLICY rls_v2_moderation_actions_visibility
      ON public.moderation_actions
      FOR ALL
      USING (
        moderator_id = public.current_profile_id()
        OR EXISTS (
          SELECT 1
          FROM public.content_reports cr
          WHERE cr.id = moderation_actions.report_id
            AND (
              cr.reporter_id = public.current_profile_id()
              OR cr.content_owner_id = public.current_profile_id()
            )
        )
      )
      WITH CHECK (moderator_id = public.current_profile_id())
    ';
  END IF;
END $$;

-- User violations: owner-only visibility.
DO $$
BEGIN
  IF to_regclass('public.user_violations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'user_violations'
         AND policyname = 'rls_v2_user_violations_owner'
     ) THEN
    EXECUTE '
      CREATE POLICY rls_v2_user_violations_owner
      ON public.user_violations
      FOR SELECT
      USING (user_id = public.current_profile_id())
    ';
  END IF;
END $$;
