-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20260205153126
-- name: 20260205184000_drop_duplicate_indexes
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- =========================================================================
-- Drop Duplicate Indexes (Keep idx_* when non-constraint)
-- Migration: 20260205_drop_duplicate_indexes
-- Date: 2026-02-05
-- Purpose: Remove identical non-constraint duplicate indexes while
--          preserving primary/unique constraints.
-- =========================================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    WITH idx AS (
      SELECT
        n.nspname AS schemaname,
        tbl.relname AS tablename,
        irel.relname AS indexname,
        pg_get_indexdef(irel.oid) AS indexdef,
        regexp_replace(
          pg_get_indexdef(irel.oid),
          '^CREATE( UNIQUE)? INDEX [^ ]+ ON ',
          'CREATE\1 INDEX ON '
        ) AS normdef,
        EXISTS (
          SELECT 1
          FROM pg_constraint con
          WHERE con.conindid = irel.oid
            AND con.contype IN ('p', 'u')
        ) AS is_constraint
      FROM pg_index idx
      JOIN pg_class irel ON irel.oid = idx.indexrelid
      JOIN pg_class tbl ON tbl.oid = idx.indrelid
      JOIN pg_namespace n ON n.oid = tbl.relnamespace
      WHERE n.nspname IN ('public', 'expertise_atlas')
        AND irel.relkind = 'i'
    ),
    ranked AS (
      SELECT
        *,
        row_number() OVER (
          PARTITION BY schemaname, tablename, normdef
          ORDER BY
            is_constraint DESC,
            (indexname ~ '^idx_') DESC,
            length(indexname) ASC,
            indexname ASC
        ) AS rn,
        count(*) OVER (PARTITION BY schemaname, tablename, normdef) AS cnt
      FROM idx
    )
    SELECT schemaname, indexname
    FROM ranked
    WHERE cnt > 1
      AND rn > 1
      AND is_constraint = false
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', r.schemaname, r.indexname);
  END LOOP;
END $$;
