-- =========================================================================
-- De-duplicate RLS Policies (Exact Duplicates + Redundant FOR ALL)
-- Migration: 20260205_dedupe_rls_policies
-- Date: 2026-02-05
-- Purpose: Remove redundant policies without changing behavior.
-- =========================================================================

DO $$
DECLARE
  r record;
BEGIN
  -- -----------------------------------------------------------------------
  -- 1) Drop exact duplicate policies (same table/cmd/roles/qual/with_check)
  --    Keep the most descriptive name (spaces/caps preferred).
  -- -----------------------------------------------------------------------
  FOR r IN
    WITH grouped AS (
      SELECT
        schemaname,
        tablename,
        cmd,
        roles,
        coalesce(qual, '') AS qual,
        coalesce(with_check, '') AS with_check,
        array_agg(
          policyname
          ORDER BY
            (policyname ~ ' ') DESC,
            (policyname ~ '[A-Z]') DESC,
            (policyname ~ '_') ASC,
            length(policyname) DESC,
            policyname ASC
        ) AS policies
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY schemaname, tablename, cmd, roles, coalesce(qual, ''), coalesce(with_check, '')
      HAVING count(*) > 1
    )
    SELECT schemaname, tablename, unnest(policies[2:]) AS policyname
    FROM grouped
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;

  -- -----------------------------------------------------------------------
  -- 2) Drop redundant FOR ALL policies when equivalent per-action policies exist
  -- -----------------------------------------------------------------------
  FOR r IN
    SELECT a.schemaname, a.tablename, a.policyname
    FROM pg_policies a
    WHERE a.schemaname = 'public'
      AND a.cmd = 'ALL'
      AND EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = a.schemaname
          AND p.tablename = a.tablename
          AND p.roles = a.roles
          AND p.cmd = 'SELECT'
          AND coalesce(p.qual, '') = coalesce(a.qual, '')
      )
      AND EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = a.schemaname
          AND p.tablename = a.tablename
          AND p.roles = a.roles
          AND p.cmd = 'DELETE'
          AND coalesce(p.qual, '') = coalesce(a.qual, '')
      )
      AND EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = a.schemaname
          AND p.tablename = a.tablename
          AND p.roles = a.roles
          AND p.cmd = 'INSERT'
          AND coalesce(p.with_check, '') = coalesce(a.with_check, '')
      )
      AND EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = a.schemaname
          AND p.tablename = a.tablename
          AND p.roles = a.roles
          AND p.cmd = 'UPDATE'
          AND coalesce(p.qual, '') = coalesce(a.qual, '')
          AND coalesce(p.with_check, '') = coalesce(a.with_check, '')
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;
