-- Migration: add explicit parent foreign keys for skills_taxonomy
-- Date: 2026-02-26
-- Purpose:
--   - Provide stable relationship names for PostgREST schema cache joins.
--   - Normalize direct parent links from skills_taxonomy to L1 and L2 tables.

DO $$
BEGIN
  IF to_regclass('public.skills_taxonomy') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'skills_taxonomy_cat_id_fkey'
      AND conrelid = 'public.skills_taxonomy'::regclass
  ) THEN
    ALTER TABLE public.skills_taxonomy
      ADD CONSTRAINT skills_taxonomy_cat_id_fkey
      FOREIGN KEY (cat_id)
      REFERENCES public.skills_categories(cat_id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'skills_taxonomy_cat_id_subcat_id_fkey'
      AND conrelid = 'public.skills_taxonomy'::regclass
  ) THEN
    ALTER TABLE public.skills_taxonomy
      ADD CONSTRAINT skills_taxonomy_cat_id_subcat_id_fkey
      FOREIGN KEY (cat_id, subcat_id)
      REFERENCES public.skills_subcategories(cat_id, subcat_id)
      ON DELETE CASCADE;
  END IF;
END $$;
