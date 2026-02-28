BEGIN;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS organization_name TEXT,
  ADD COLUMN IF NOT EXISTS organization_type TEXT,
  ADD COLUMN IF NOT EXISTS organization_industry TEXT,
  ADD COLUMN IF NOT EXISTS organization_employee_amount TEXT,
  ADD COLUMN IF NOT EXISTS measured_outcomes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS project_entries JSONB DEFAULT '[]'::jsonb;

UPDATE public.experiences
SET measured_outcomes = '[]'::jsonb
WHERE measured_outcomes IS NULL;

UPDATE public.experiences
SET project_entries = '[]'::jsonb
WHERE project_entries IS NULL;

ALTER TABLE public.experiences
  ALTER COLUMN measured_outcomes SET DEFAULT '[]'::jsonb,
  ALTER COLUMN measured_outcomes SET NOT NULL,
  ALTER COLUMN project_entries SET DEFAULT '[]'::jsonb,
  ALTER COLUMN project_entries SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'experiences_organization_type_check'
  ) THEN
    ALTER TABLE public.experiences
      ADD CONSTRAINT experiences_organization_type_check
      CHECK (
        organization_type IS NULL OR organization_type IN (
          'company',
          'ngo',
          'government',
          'academic',
          'network',
          'other'
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'experiences_organization_employee_amount_check'
  ) THEN
    ALTER TABLE public.experiences
      ADD CONSTRAINT experiences_organization_employee_amount_check
      CHECK (
        organization_employee_amount IS NULL OR organization_employee_amount IN (
          '1-10',
          '11-50',
          '51-200',
          '201-500',
          '501-1000',
          '1001-5000',
          '5001+'
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'experiences_measured_outcomes_array_check'
  ) THEN
    ALTER TABLE public.experiences
      ADD CONSTRAINT experiences_measured_outcomes_array_check
      CHECK (jsonb_typeof(measured_outcomes) = 'array');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'experiences_project_entries_array_check'
  ) THEN
    ALTER TABLE public.experiences
      ADD CONSTRAINT experiences_project_entries_array_check
      CHECK (jsonb_typeof(project_entries) = 'array');
  END IF;
END
$$;

COMMIT;
