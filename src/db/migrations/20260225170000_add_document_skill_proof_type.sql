-- Migration: allow document proof type for skill proofs
-- Date: 2026-02-25

DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  IF to_regclass('public.skill_proofs') IS NULL THEN
    RETURN;
  END IF;

  -- Drop any prior proof_type check so we can replace it with the expanded enum.
  FOR constraint_row IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'skill_proofs'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%proof_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.skill_proofs DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;

  ALTER TABLE public.skill_proofs
    ADD CONSTRAINT skill_proofs_proof_type_check
    CHECK (proof_type IN ('project', 'certification', 'media', 'reference', 'link', 'document'));
END $$;
