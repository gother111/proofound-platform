-- =========================================================================
-- Optimize RLS Policies for InitPlan Evaluation
-- Migration: 20260205_optimize_rls_initplan
-- Date: 2026-02-05
-- Purpose: Wrap auth.*() and current_setting() calls in (select ...)
--          to avoid per-row re-evaluation in RLS policies.
-- =========================================================================

DO $$
DECLARE
  r record;
  new_qual text;
  new_with_check text;
  sql text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        qual ILIKE '%auth.%'
        OR with_check ILIKE '%auth.%'
        OR qual ILIKE '%current_setting%'
        OR with_check ILIKE '%current_setting%'
      )
  LOOP
    new_qual := r.qual;
    new_with_check := r.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, 'auth\.([a-z_]+)\(\)', '(select auth.\1())', 'g');
      new_qual := regexp_replace(new_qual, 'current_setting\(([^)]*)\)', '(select current_setting(\1))', 'g');
      new_qual := regexp_replace(new_qual, E'\\(select\\s+\\(select\\s+auth\\.([a-z_]+)\\(\\)\\)\\)', '(select auth.\1())', 'g');
      new_qual := regexp_replace(new_qual, E'\\(select\\s+\\(select\\s+current_setting\\(([^)]*)\\)\\)\\)', '(select current_setting(\1))', 'g');
    END IF;

    IF new_with_check IS NOT NULL THEN
      new_with_check := regexp_replace(new_with_check, 'auth\.([a-z_]+)\(\)', '(select auth.\1())', 'g');
      new_with_check := regexp_replace(new_with_check, 'current_setting\(([^)]*)\)', '(select current_setting(\1))', 'g');
      new_with_check := regexp_replace(new_with_check, E'\\(select\\s+\\(select\\s+auth\\.([a-z_]+)\\(\\)\\)\\)', '(select auth.\1())', 'g');
      new_with_check := regexp_replace(new_with_check, E'\\(select\\s+\\(select\\s+current_setting\\(([^)]*)\\)\\)\\)', '(select current_setting(\1))', 'g');
    END IF;

    IF new_qual IS DISTINCT FROM r.qual OR new_with_check IS DISTINCT FROM r.with_check THEN
      sql := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);

      IF new_qual IS NOT NULL THEN
        sql := sql || ' USING (' || new_qual || ')';
      END IF;

      IF new_with_check IS NOT NULL THEN
        sql := sql || ' WITH CHECK (' || new_with_check || ')';
      END IF;

      EXECUTE sql;
    END IF;
  END LOOP;
END $$;
