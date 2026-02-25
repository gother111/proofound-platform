-- Replace legacy experience reflection fields with structured experience sections
-- PRO-41: learning/growth -> outcomes/projects/colleagues/achievements

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'experiences'
      AND column_name = 'learning'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'experiences'
      AND column_name = 'outcomes'
  ) THEN
    ALTER TABLE public.experiences
      RENAME COLUMN learning TO outcomes;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'experiences'
      AND column_name = 'growth'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'experiences'
      AND column_name = 'achievements'
  ) THEN
    ALTER TABLE public.experiences
      RENAME COLUMN growth TO achievements;
  END IF;
END $$;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS projects TEXT;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS colleagues TEXT;

UPDATE public.experiences
SET projects = 'Not specified'
WHERE projects IS NULL OR btrim(projects) = '';

UPDATE public.experiences
SET colleagues = 'Not specified'
WHERE colleagues IS NULL OR btrim(colleagues) = '';

ALTER TABLE public.experiences
  ALTER COLUMN projects SET DEFAULT 'Not specified',
  ALTER COLUMN projects SET NOT NULL,
  ALTER COLUMN colleagues SET DEFAULT 'Not specified',
  ALTER COLUMN colleagues SET NOT NULL;
