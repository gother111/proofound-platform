-- Add canonical verification tiers and explicit LinkedIn verification levels

BEGIN;

ALTER TABLE public.individual_profiles
  ADD COLUMN IF NOT EXISTS verification_tier TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_tier_source TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS linkedin_verification_level TEXT NOT NULL DEFAULT 'unverified';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'individual_profiles_verification_tier_check'
  ) THEN
    ALTER TABLE public.individual_profiles
      ADD CONSTRAINT individual_profiles_verification_tier_check
      CHECK (verification_tier IN ('unverified', 'workplace_verified', 'identity_verified'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'individual_profiles_verification_tier_source_check'
  ) THEN
    ALTER TABLE public.individual_profiles
      ADD CONSTRAINT individual_profiles_verification_tier_source_check
      CHECK (
        verification_tier_source IN (
          'linkedin_identity',
          'linkedin_workplace',
          'work_email',
          'veriff',
          'unknown'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'individual_profiles_linkedin_verification_level_check'
  ) THEN
    ALTER TABLE public.individual_profiles
      ADD CONSTRAINT individual_profiles_linkedin_verification_level_check
      CHECK (linkedin_verification_level IN ('unverified', 'pending', 'workplace', 'identity', 'failed'));
  END IF;
END $$;

-- Derive explicit LinkedIn verification level from official signal payloads first.
UPDATE public.individual_profiles
SET linkedin_verification_level = 'identity'
WHERE
  COALESCE(linkedin_verification_data ->> 'hasIdentityVerification', 'false') = 'true'
  OR COALESCE(linkedin_verification_data -> 'apiReport' ->> 'hasIdentityVerification', 'false') = 'true'
  OR COALESCE((linkedin_verification_data -> 'apiReport' -> 'verifications')::text, '') ~* '(IDENTITY|GOVERNMENT_ID|GOVT_ID)';

UPDATE public.individual_profiles
SET linkedin_verification_level = 'workplace'
WHERE linkedin_verification_level <> 'identity'
  AND (
    COALESCE((linkedin_verification_data -> 'apiReport' -> 'verifications')::text, '') ~* 'WORKPLACE'
    OR (
      linkedin_verification_status = 'verified'
      AND COALESCE((linkedin_verification_data -> 'apiReport' -> 'verifications')::text, '') = ''
    )
  );

UPDATE public.individual_profiles
SET linkedin_verification_level = CASE
  WHEN linkedin_verification_status = 'pending' THEN 'pending'
  WHEN linkedin_verification_status = 'failed' THEN 'failed'
  WHEN linkedin_verification_status = 'unverified' THEN 'unverified'
  ELSE linkedin_verification_level
END
WHERE linkedin_verification_level NOT IN ('identity', 'workplace');

-- Canonical verification tier and source precedence:
-- identity_verified > workplace_verified > unverified.
UPDATE public.individual_profiles
SET
  verification_tier = CASE
    WHEN (
      (verification_method = 'veriff' AND (verification_status = 'verified' OR verified = true))
      OR linkedin_verification_level = 'identity'
    ) THEN 'identity_verified'
    WHEN (
      (work_email_verified = true)
      OR linkedin_verification_level = 'workplace'
    ) THEN 'workplace_verified'
    ELSE 'unverified'
  END,
  verification_tier_source = CASE
    WHEN (verification_method = 'veriff' AND (verification_status = 'verified' OR verified = true)) THEN 'veriff'
    WHEN linkedin_verification_level = 'identity' THEN 'linkedin_identity'
    WHEN work_email_verified = true THEN 'work_email'
    WHEN linkedin_verification_level = 'workplace' THEN 'linkedin_workplace'
    ELSE 'unknown'
  END;

COMMENT ON COLUMN public.individual_profiles.verification_tier
  IS 'Canonical assurance tier used for identity/workplace/unverified access semantics';
COMMENT ON COLUMN public.individual_profiles.verification_tier_source
  IS 'Source of canonical verification tier';
COMMENT ON COLUMN public.individual_profiles.linkedin_verification_level
  IS 'LinkedIn verification level: pending, workplace, identity, failed, unverified';

COMMIT;
