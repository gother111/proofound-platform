-- Prevent duplicate active verification requests for skill and impact flows.
-- Date: 2026-02-27

BEGIN;

-- Normalize verifier email casing/whitespace for deterministic matching.
UPDATE public.skill_verification_requests
SET verifier_email = lower(trim(verifier_email))
WHERE verifier_email IS NOT NULL
  AND verifier_email <> lower(trim(verifier_email));

UPDATE public.impact_story_verification_requests
SET verifier_email = lower(trim(verifier_email))
WHERE verifier_email IS NOT NULL
  AND verifier_email <> lower(trim(verifier_email));

-- Collapse duplicate active skill verification requests.
WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY requester_profile_id, skill_id, lower(trim(verifier_email))
      ORDER BY
        CASE WHEN status = 'accepted' THEN 0 ELSE 1 END,
        created_at DESC NULLS LAST,
        id DESC
    ) AS keep_id,
    row_number() OVER (
      PARTITION BY requester_profile_id, skill_id, lower(trim(verifier_email))
      ORDER BY
        CASE WHEN status = 'accepted' THEN 0 ELSE 1 END,
        created_at DESC NULLS LAST,
        id DESC
    ) AS row_num
  FROM public.skill_verification_requests
  WHERE status IN ('pending', 'accepted')
)
DELETE FROM public.skill_verification_requests target
USING ranked
WHERE target.id = ranked.id
  AND ranked.row_num > 1
  AND ranked.keep_id <> ranked.id;

-- Collapse duplicate active impact verification requests.
WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY requester_profile_id, impact_story_id, lower(trim(verifier_email))
      ORDER BY
        CASE WHEN status = 'accepted' THEN 0 ELSE 1 END,
        created_at DESC NULLS LAST,
        id DESC
    ) AS keep_id,
    row_number() OVER (
      PARTITION BY requester_profile_id, impact_story_id, lower(trim(verifier_email))
      ORDER BY
        CASE WHEN status = 'accepted' THEN 0 ELSE 1 END,
        created_at DESC NULLS LAST,
        id DESC
    ) AS row_num
  FROM public.impact_story_verification_requests
  WHERE status IN ('pending', 'accepted')
),
repointed_responses AS (
  UPDATE public.impact_story_verification_responses responses
  SET request_id = ranked.keep_id
  FROM ranked
  WHERE responses.request_id = ranked.id
    AND ranked.row_num > 1
    AND ranked.keep_id <> ranked.id
  RETURNING responses.id
)
DELETE FROM public.impact_story_verification_requests target
USING ranked
WHERE target.id = ranked.id
  AND ranked.row_num > 1
  AND ranked.keep_id <> ranked.id;

-- Enforce active duplicate prevention at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_verification_active_unique_verifier
  ON public.skill_verification_requests (
    requester_profile_id,
    skill_id,
    lower(trim(verifier_email))
  )
  WHERE status IN ('pending', 'accepted');

CREATE UNIQUE INDEX IF NOT EXISTS idx_impact_verification_active_unique_verifier
  ON public.impact_story_verification_requests (
    requester_profile_id,
    impact_story_id,
    lower(trim(verifier_email))
  )
  WHERE status IN ('pending', 'accepted');

COMMIT;
