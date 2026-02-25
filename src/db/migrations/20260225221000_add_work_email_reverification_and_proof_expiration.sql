-- Add work email re-verification tracking and proof expiration support

ALTER TABLE public.individual_profiles
  ADD COLUMN IF NOT EXISTS work_email_verified_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS work_email_reverify_due_at TIMESTAMP;

UPDATE public.individual_profiles
SET
  work_email_verified_at = COALESCE(work_email_verified_at, verified_at, NOW()),
  work_email_reverify_due_at = COALESCE(
    work_email_reverify_due_at,
    COALESCE(work_email_verified_at, verified_at, NOW()) + INTERVAL '1 year'
  )
WHERE work_email_verified = true;

ALTER TABLE public.skill_proofs
  ADD COLUMN IF NOT EXISTS expires_date DATE;

COMMENT ON COLUMN public.individual_profiles.work_email_verified_at
  IS 'Timestamp of the most recent successful work email verification';
COMMENT ON COLUMN public.individual_profiles.work_email_reverify_due_at
  IS 'Timestamp after which work email verification is considered stale and must be renewed';
COMMENT ON COLUMN public.skill_proofs.expires_date
  IS 'Optional expiration date for certifications and other time-bound proofs';
