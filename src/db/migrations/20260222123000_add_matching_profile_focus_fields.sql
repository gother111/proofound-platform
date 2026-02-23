-- Add first-class focus area fields for individual matching profiles.
ALTER TABLE matching_profiles
  ADD COLUMN IF NOT EXISTS desired_roles text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS desired_industries text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS org_types text[] NOT NULL DEFAULT '{}'::text[];
