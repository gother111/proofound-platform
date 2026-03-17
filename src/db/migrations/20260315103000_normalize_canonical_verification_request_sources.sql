BEGIN;

UPDATE public.verification_records
SET
  source_request_table = 'verification_records',
  source_request_id = id
WHERE metadata->>'requestTransport' IN (
    'skill_verification_request',
    'impact_verification_request'
  )
  AND source_request_table IN (
    'skill_verification_requests',
    'impact_story_verification_requests'
  );

UPDATE public.verification_records
SET
  source_response_table = 'verification_records',
  source_response_id = id
WHERE metadata->>'requestTransport' IN (
    'skill_verification_request',
    'impact_verification_request'
  )
  AND source_response_table IN (
    'skill_verification_requests',
    'impact_story_verification_requests'
  );

COMMIT;
