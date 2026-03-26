DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'feedback_tokens'
  ) THEN
    ALTER TABLE public.feedback_tokens
      ADD COLUMN IF NOT EXISTS id UUID;

    UPDATE public.feedback_tokens
    SET id = gen_random_uuid()
    WHERE id IS NULL;

    ALTER TABLE public.feedback_tokens
      ALTER COLUMN id SET DEFAULT gen_random_uuid(),
      ALTER COLUMN id SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS feedback_tokens_id_unique_idx
      ON public.feedback_tokens (id);

    UPDATE public.feedback_tokens
    SET token_hash = encode(extensions.digest(trim(token), 'sha256'), 'hex')
    WHERE token IS NOT NULL
      AND trim(token) <> ''
      AND (token_hash IS NULL OR token_hash = '');

    UPDATE public.capability_tokens capability_token
    SET source_id = feedback_token.id
    FROM public.feedback_tokens feedback_token
    WHERE capability_token.source_table = 'feedback_tokens'
      AND capability_token.source_id IS NULL
      AND (
        capability_token.id = feedback_token.capability_token_id
        OR (
          feedback_token.token_hash IS NOT NULL
          AND capability_token.token_hash = feedback_token.token_hash
        )
      );

    UPDATE public.feedback_tokens feedback_token
    SET capability_token_id = capability_token.id
    FROM public.capability_tokens capability_token
    WHERE feedback_token.capability_token_id IS NULL
      AND capability_token.source_table = 'feedback_tokens'
      AND (
        capability_token.source_id = feedback_token.id
        OR (
          feedback_token.token_hash IS NOT NULL
          AND capability_token.token_hash = feedback_token.token_hash
        )
      );
  END IF;
END $$;
