ALTER TABLE matching_profiles
  ADD COLUMN IF NOT EXISTS comp_period text NOT NULL DEFAULT 'annual';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'matching_profiles_comp_period_check'
  ) THEN
    ALTER TABLE matching_profiles
      ADD CONSTRAINT matching_profiles_comp_period_check
      CHECK (comp_period IN ('annual', 'monthly', 'hourly'));
  END IF;
END $$;
