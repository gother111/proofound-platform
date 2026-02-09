-- =========================================================================
-- Service-Role-Only RLS Policies for Unprotected Tables
-- Migration: 20260205_rls_service_role_only
-- Date: 2026-02-05
-- Purpose: Add minimal service-role policies on tables with RLS enabled
--          but no policies defined.
-- =========================================================================

DO $$
DECLARE
  tbl text;
  policy_name text;
  tables text[] := ARRAY[
    'assignment_creation_pipeline',
    'assignment_expertise_matrix',
    'assignment_field_visibility',
    'assignment_field_visibility_defaults',
    'assignment_outcomes'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

      -- Only create if table currently has no policies (expected by advisor warning)
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
      ) THEN
        policy_name := tbl || '_service_role_only';
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR ALL USING ((select current_setting(''role'', true)) = ''service_role'') WITH CHECK ((select current_setting(''role'', true)) = ''service_role'')',
          policy_name,
          tbl
        );
      END IF;
    END IF;
  END LOOP;
END $$;
