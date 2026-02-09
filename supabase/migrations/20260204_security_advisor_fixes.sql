-- =========================================================================
-- Security Advisor Fixes
-- Migration: 20260204_security_advisor_fixes
-- Date: 2026-02-04
-- Purpose: Address Supabase Security Advisor warnings
--          - Move extensions out of public schema
--          - Set explicit search_path for flagged functions
--          - Replace permissive RLS policies with least-privilege checks
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1) Move extensions to dedicated schema
-- -------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'vector' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'ALTER EXTENSION vector SET SCHEMA extensions';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'ALTER EXTENSION pg_trgm SET SCHEMA extensions';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'unaccent' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'ALTER EXTENSION unaccent SET SCHEMA extensions';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 2) Fix function_search_path_mutable warnings
-- -------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS proc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'set_updated_at',
        'update_referrals_updated_at',
        'find_similar_profiles_by_embedding',
        'find_similar_assignments_by_embedding',
        'search_skills_smart'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = public, extensions, pg_catalog',
      r.proc
    );
  END LOOP;
END $$;

-- -------------------------------------------------------------------------
-- 3) RLS policy hardening
-- -------------------------------------------------------------------------

-- 3.1 Service-role only system writes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='analytics_events') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Service role can insert events" ON public.analytics_events';
    EXECUTE '
      CREATE POLICY "Service role can insert events"
      ON public.analytics_events
      FOR INSERT
      TO service_role
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Service can insert audit logs" ON public.audit_logs';
    EXECUTE '
      CREATE POLICY "Service can insert audit logs"
      ON public.audit_logs
      FOR INSERT
      TO service_role
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='decision_reminders') THEN
    EXECUTE 'DROP POLICY IF EXISTS "System can insert reminders" ON public.decision_reminders';
    EXECUTE '
      CREATE POLICY "System can insert reminders"
      ON public.decision_reminders
      FOR INSERT
      TO service_role
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='matches') THEN
    EXECUTE 'DROP POLICY IF EXISTS "System can create matches" ON public.matches';
    EXECUTE '
      CREATE POLICY "System can create matches"
      ON public.matches
      FOR INSERT
      TO service_role
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='notifications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications';
    EXECUTE '
      CREATE POLICY "Service role can insert notifications"
      ON public.notifications
      FOR INSERT
      TO service_role
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='rate_limits') THEN
    EXECUTE 'DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits';
    EXECUTE '
      CREATE POLICY "System can manage rate limits"
      ON public.rate_limits
      FOR ALL
      TO service_role
      USING (current_setting(''role'', true) = ''service_role'')
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sus_responses') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Service role can insert SUS responses" ON public.sus_responses';
    EXECUTE '
      CREATE POLICY "Service role can insert SUS responses"
      ON public.sus_responses
      FOR INSERT
      TO service_role
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='skill_adjacency') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access to adjacency" ON public.skill_adjacency';
    EXECUTE '
      CREATE POLICY "Service role full access to adjacency"
      ON public.skill_adjacency
      FOR ALL
      TO service_role
      USING (current_setting(''role'', true) = ''service_role'')
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

-- 3.2 Taxonomy tables: public read, service-role writes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='skills_taxonomy') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='skills_taxonomy'
        AND policyname='Public can read taxonomy'
    ) THEN
      EXECUTE 'CREATE POLICY "Public can read taxonomy" ON public.skills_taxonomy FOR SELECT USING (true)';
    END IF;
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access to taxonomy" ON public.skills_taxonomy';
    EXECUTE '
      CREATE POLICY "Service role full access to taxonomy"
      ON public.skills_taxonomy
      FOR ALL
      TO service_role
      USING (current_setting(''role'', true) = ''service_role'')
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='skills_categories') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='skills_categories'
        AND policyname='Public can read categories'
    ) THEN
      EXECUTE 'CREATE POLICY "Public can read categories" ON public.skills_categories FOR SELECT USING (true)';
    END IF;
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access to categories" ON public.skills_categories';
    EXECUTE '
      CREATE POLICY "Service role full access to categories"
      ON public.skills_categories
      FOR ALL
      TO service_role
      USING (current_setting(''role'', true) = ''service_role'')
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='skills_subcategories') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='skills_subcategories'
        AND policyname='Public can read subcategories'
    ) THEN
      EXECUTE 'CREATE POLICY "Public can read subcategories" ON public.skills_subcategories FOR SELECT USING (true)';
    END IF;
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access to subcategories" ON public.skills_subcategories';
    EXECUTE '
      CREATE POLICY "Service role full access to subcategories"
      ON public.skills_subcategories
      FOR ALL
      TO service_role
      USING (current_setting(''role'', true) = ''service_role'')
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='skills_l3') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='skills_l3'
        AND policyname='Public can read L3'
    ) THEN
      EXECUTE 'CREATE POLICY "Public can read L3" ON public.skills_l3 FOR SELECT USING (true)';
    END IF;
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access to L3" ON public.skills_l3';
    EXECUTE '
      CREATE POLICY "Service role full access to L3"
      ON public.skills_l3
      FOR ALL
      TO service_role
      USING (current_setting(''role'', true) = ''service_role'')
      WITH CHECK (current_setting(''role'', true) = ''service_role'')
    ';
  END IF;
END $$;

-- 3.3 Anonymous insert policies with validation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='profile_snippet_views') THEN
    EXECUTE 'DROP POLICY IF EXISTS "System can insert snippet views" ON public.profile_snippet_views';
    EXECUTE '
      CREATE POLICY "System can insert snippet views"
      ON public.profile_snippet_views
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        snippet_id IS NOT NULL
        AND (
          COALESCE(LENGTH(viewer_ip), 0) > 0
          OR COALESCE(LENGTH(viewer_user_agent), 0) > 0
          OR COALESCE(LENGTH(referrer), 0) > 0
        )
      )
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='web_vitals_metrics') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous web vitals recording" ON public.web_vitals_metrics';
    EXECUTE '
      CREATE POLICY "Allow anonymous web vitals recording"
      ON public.web_vitals_metrics
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        metric_id IS NOT NULL AND LENGTH(metric_id) > 0
        AND page_path IS NOT NULL AND LENGTH(page_path) > 0
        AND value IS NOT NULL
        AND delta IS NOT NULL
      )
    ';
  END IF;
END $$;
