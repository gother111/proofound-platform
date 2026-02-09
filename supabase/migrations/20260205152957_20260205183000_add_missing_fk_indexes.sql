-- =========================================================================
-- Add Missing Foreign Key Indexes
-- Migration: 20260205_add_missing_fk_indexes
-- Date: 2026-02-05
-- Purpose: Create indexes for FK columns lacking coverage.
-- =========================================================================

DO $$
DECLARE
  r record;
  idx_name text;
  idx_sql text;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schemaname,
      c.relname AS table_name,
      a.attname AS column_name
    FROM pg_constraint cst
    JOIN pg_class c ON c.oid = cst.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(cst.conkey)
    WHERE cst.contype = 'f'
      AND c.relkind = 'r'
      AND n.nspname IN ('public', 'expertise_atlas')
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = c.oid
          AND a.attnum = ANY(i.indkey)
      )
  LOOP
    idx_name := format('idx_%s_%s', r.table_name, r.column_name);

    -- Ensure index name length <= 63 characters
    IF length(idx_name) > 63 THEN
      idx_name := substr(idx_name, 1, 54) || '_' || substr(md5(idx_name), 1, 8);
    END IF;

    idx_sql := format(
      'CREATE INDEX IF NOT EXISTS %I ON %I.%I (%I)',
      idx_name,
      r.schemaname,
      r.table_name,
      r.column_name
    );

    EXECUTE idx_sql;
  END LOOP;
END $$;
