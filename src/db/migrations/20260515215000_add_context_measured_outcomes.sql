ALTER TABLE public.education
  ADD COLUMN IF NOT EXISTS measured_outcomes JSONB DEFAULT '[]'::jsonb;

UPDATE public.education
SET measured_outcomes = '[]'::jsonb
WHERE measured_outcomes IS NULL;

ALTER TABLE public.education
  ALTER COLUMN measured_outcomes SET DEFAULT '[]'::jsonb,
  ALTER COLUMN measured_outcomes SET NOT NULL;

ALTER TABLE public.volunteering
  ADD COLUMN IF NOT EXISTS measured_outcomes JSONB DEFAULT '[]'::jsonb;

UPDATE public.volunteering
SET measured_outcomes = '[]'::jsonb
WHERE measured_outcomes IS NULL;

ALTER TABLE public.volunteering
  ALTER COLUMN measured_outcomes SET DEFAULT '[]'::jsonb,
  ALTER COLUMN measured_outcomes SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'education_measured_outcomes_array_check'
  ) THEN
    ALTER TABLE public.education
      ADD CONSTRAINT education_measured_outcomes_array_check
      CHECK (jsonb_typeof(measured_outcomes) = 'array');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'volunteering_measured_outcomes_array_check'
  ) THEN
    ALTER TABLE public.volunteering
      ADD CONSTRAINT volunteering_measured_outcomes_array_check
      CHECK (jsonb_typeof(measured_outcomes) = 'array');
  END IF;
END $$;
