ALTER TABLE public.skill_verification_requests
  ADD COLUMN IF NOT EXISTS verifier_relationship TEXT,
  ADD COLUMN IF NOT EXISTS request_kind TEXT NOT NULL DEFAULT 'generic_verification',
  ADD COLUMN IF NOT EXISTS attestation_request JSONB,
  ADD COLUMN IF NOT EXISTS attestation_response JSONB;

ALTER TABLE public.custom_verification_requests
  ADD COLUMN IF NOT EXISTS request_kind TEXT NOT NULL DEFAULT 'generic_verification',
  ADD COLUMN IF NOT EXISTS attestation_request JSONB,
  ADD COLUMN IF NOT EXISTS attestation_response JSONB;

UPDATE public.skill_verification_requests
SET request_kind = 'generic_verification'
WHERE request_kind IS NULL;

UPDATE public.custom_verification_requests
SET request_kind = 'generic_verification'
WHERE request_kind IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'skill_verification_requests_request_kind_check'
  ) THEN
    ALTER TABLE public.skill_verification_requests
      ADD CONSTRAINT skill_verification_requests_request_kind_check
      CHECK (request_kind IN ('generic_verification', 'human_observed_attestation'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'custom_verification_requests_request_kind_check'
  ) THEN
    ALTER TABLE public.custom_verification_requests
      ADD CONSTRAINT custom_verification_requests_request_kind_check
      CHECK (request_kind IN ('generic_verification', 'human_observed_attestation'));
  END IF;
END
$$;
