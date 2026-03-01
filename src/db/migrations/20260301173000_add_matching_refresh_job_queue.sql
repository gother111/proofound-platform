-- Add durable queue for match refresh jobs.
-- Supports cron enqueue + worker draining with retry and leasing.

BEGIN;

CREATE TABLE IF NOT EXISTS public.matching_refresh_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  lease_expires_at timestamptz,
  last_error text,
  source text NOT NULL DEFAULT 'cron',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'matching_refresh_jobs_status_ck'
      AND conrelid = 'public.matching_refresh_jobs'::regclass
  ) THEN
    ALTER TABLE public.matching_refresh_jobs
      ADD CONSTRAINT matching_refresh_jobs_status_ck
      CHECK (status IN ('pending', 'leased', 'completed', 'failed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'matching_refresh_jobs_attempts_ck'
      AND conrelid = 'public.matching_refresh_jobs'::regclass
  ) THEN
    ALTER TABLE public.matching_refresh_jobs
      ADD CONSTRAINT matching_refresh_jobs_attempts_ck
      CHECK (attempts >= 0 AND max_attempts > 0 AND attempts <= max_attempts + 1);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS matching_refresh_jobs_status_next_run_idx
  ON public.matching_refresh_jobs(status, next_run_at);

CREATE INDEX IF NOT EXISTS matching_refresh_jobs_profile_id_idx
  ON public.matching_refresh_jobs(profile_id);

CREATE UNIQUE INDEX IF NOT EXISTS matching_refresh_jobs_active_profile_unique_idx
  ON public.matching_refresh_jobs(profile_id)
  WHERE status IN ('pending', 'leased');

ALTER TABLE public.matching_refresh_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Matching refresh jobs service select" ON public.matching_refresh_jobs;
CREATE POLICY "Matching refresh jobs service select"
  ON public.matching_refresh_jobs FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Matching refresh jobs service insert" ON public.matching_refresh_jobs;
CREATE POLICY "Matching refresh jobs service insert"
  ON public.matching_refresh_jobs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Matching refresh jobs service update" ON public.matching_refresh_jobs;
CREATE POLICY "Matching refresh jobs service update"
  ON public.matching_refresh_jobs FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Matching refresh jobs service delete" ON public.matching_refresh_jobs;
CREATE POLICY "Matching refresh jobs service delete"
  ON public.matching_refresh_jobs FOR DELETE
  USING (auth.role() = 'service_role');

COMMIT;

-- Rollback SQL (manual)
-- DROP POLICY IF EXISTS "Matching refresh jobs service delete" ON public.matching_refresh_jobs;
-- DROP POLICY IF EXISTS "Matching refresh jobs service update" ON public.matching_refresh_jobs;
-- DROP POLICY IF EXISTS "Matching refresh jobs service insert" ON public.matching_refresh_jobs;
-- DROP POLICY IF EXISTS "Matching refresh jobs service select" ON public.matching_refresh_jobs;
-- DROP INDEX IF EXISTS matching_refresh_jobs_active_profile_unique_idx;
-- DROP INDEX IF EXISTS matching_refresh_jobs_profile_id_idx;
-- DROP INDEX IF EXISTS matching_refresh_jobs_status_next_run_idx;
-- ALTER TABLE public.matching_refresh_jobs DROP CONSTRAINT IF EXISTS matching_refresh_jobs_attempts_ck;
-- ALTER TABLE public.matching_refresh_jobs DROP CONSTRAINT IF EXISTS matching_refresh_jobs_status_ck;
-- DROP TABLE IF EXISTS public.matching_refresh_jobs;
