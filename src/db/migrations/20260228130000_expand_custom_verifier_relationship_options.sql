-- Expand custom verifier relationship options while preserving legacy values.

ALTER TABLE public.custom_verification_requests
  DROP CONSTRAINT IF EXISTS custom_verification_requests_verifier_relationship_check;

ALTER TABLE public.custom_verification_requests
  DROP CONSTRAINT IF EXISTS chk_custom_verification_requests_verifier_relationship;

ALTER TABLE public.custom_verification_requests
  ADD CONSTRAINT chk_custom_verification_requests_verifier_relationship
  CHECK (
    verifier_relationship IN (
      'colleague',
      'peer',
      'manager',
      'skip_level_manager',
      'direct_report',
      'client',
      'partner',
      'mentor_coach',
      'external'
    )
  );
