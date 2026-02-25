-- Ensure skill verification requests support secure token-based links.
ALTER TABLE public.skill_verification_requests
ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- Normalize verifier emails for deterministic matching.
UPDATE public.skill_verification_requests
SET verifier_email = lower(trim(verifier_email))
WHERE verifier_email IS NOT NULL
  AND verifier_email <> lower(trim(verifier_email));

-- Backfill missing tokens.
UPDATE public.skill_verification_requests
SET verification_token = encode(gen_random_bytes(32), 'hex')
WHERE verification_token IS NULL
  OR btrim(verification_token) = '';

-- Resolve any accidental duplicate tokens before unique index creation.
WITH duplicate_tokens AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY verification_token ORDER BY created_at, id) AS row_num
  FROM public.skill_verification_requests
  WHERE verification_token IS NOT NULL
)
UPDATE public.skill_verification_requests target
SET verification_token = encode(gen_random_bytes(32), 'hex')
FROM duplicate_tokens dupes
WHERE target.id = dupes.id
  AND dupes.row_num > 1;

ALTER TABLE public.skill_verification_requests
ALTER COLUMN verification_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_verification_token_unique
ON public.skill_verification_requests (verification_token);
