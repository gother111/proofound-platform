-- Add LinkedIn-specific verification workflow state tracking

BEGIN;

ALTER TABLE public.individual_profiles
  ADD COLUMN IF NOT EXISTS linkedin_verification_status TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS linkedin_verified_at TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'individual_profiles_linkedin_verification_status_check'
  ) THEN
    ALTER TABLE public.individual_profiles
      ADD CONSTRAINT individual_profiles_linkedin_verification_status_check
      CHECK (linkedin_verification_status IN ('unverified', 'pending', 'verified', 'failed'));
  END IF;
END $$;

-- Backfill legacy LinkedIn pending requests that were previously mapped into global identity status.
UPDATE public.individual_profiles
SET linkedin_verification_status = 'pending'
WHERE linkedin_verification_status = 'unverified'
  AND verification_status = 'pending'
  AND (linkedin_profile_url IS NOT NULL OR linkedin_verification_data IS NOT NULL);

-- Backfill already approved LinkedIn identity checks.
UPDATE public.individual_profiles
SET
  linkedin_verification_status = 'verified',
  linkedin_verified_at = COALESCE(linkedin_verified_at, verified_at, NOW())
WHERE verification_method = 'linkedin'
  AND (
    verification_status = 'verified'
    OR verified = true
  );

COMMENT ON COLUMN public.individual_profiles.linkedin_verification_status
  IS 'LinkedIn workflow status independent of the global identity verification status';
COMMENT ON COLUMN public.individual_profiles.linkedin_verified_at
  IS 'Timestamp of LinkedIn verification workflow approval';

COMMIT;
