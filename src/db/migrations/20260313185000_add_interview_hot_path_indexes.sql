CREATE INDEX IF NOT EXISTS interviews_match_id_idx
  ON public.interviews(match_id);

CREATE INDEX IF NOT EXISTS interviews_scheduled_at_idx
  ON public.interviews(scheduled_at);

CREATE INDEX IF NOT EXISTS interviews_status_idx
  ON public.interviews(status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'interviews'
      AND column_name = 'host_user_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS interviews_host_user_id_idx ON public.interviews(host_user_id)';
  END IF;
END $$;
