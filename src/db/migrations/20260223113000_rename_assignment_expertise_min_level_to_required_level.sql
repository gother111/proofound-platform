-- Align assignment_expertise_matrix column naming with application contract.
-- Canonical column is required_level.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignment_expertise_matrix'
      AND column_name = 'min_level'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignment_expertise_matrix'
      AND column_name = 'required_level'
  ) THEN
    ALTER TABLE public.assignment_expertise_matrix
      RENAME COLUMN min_level TO required_level;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    INNER JOIN pg_class t ON t.oid = c.conrelid
    INNER JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'assignment_expertise_matrix'
      AND c.conname = 'assignment_expertise_matrix_min_level_check'
  ) THEN
    ALTER TABLE public.assignment_expertise_matrix
      RENAME CONSTRAINT assignment_expertise_matrix_min_level_check
      TO assignment_expertise_matrix_required_level_check;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignment_expertise_matrix'
      AND column_name = 'required_level'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    INNER JOIN pg_class t ON t.oid = c.conrelid
    INNER JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'assignment_expertise_matrix'
      AND c.conname = 'assignment_expertise_matrix_required_level_check'
  ) THEN
    ALTER TABLE public.assignment_expertise_matrix
      ADD CONSTRAINT assignment_expertise_matrix_required_level_check
      CHECK (required_level BETWEEN 1 AND 5) NOT VALID;

    ALTER TABLE public.assignment_expertise_matrix
      VALIDATE CONSTRAINT assignment_expertise_matrix_required_level_check;
  END IF;
END $$;
