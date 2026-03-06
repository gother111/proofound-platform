-- Add shared durable queue for internal Python batch and reporting jobs.
-- Supports lease-based worker draining with retries and service-role-only access.

BEGIN;

CREATE TABLE IF NOT EXISTS public.python_internal_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  lease_expires_at timestamptz,
  last_error text,
  source text NOT NULL DEFAULT 'manual',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'python_internal_jobs_job_type_ck'
      AND conrelid = 'public.python_internal_jobs'::regclass
  ) THEN
    ALTER TABLE public.python_internal_jobs
      ADD CONSTRAINT python_internal_jobs_job_type_ck
      CHECK (
        job_type IN (
          'document_intelligence_skill_report',
          'document_intelligence_wizard_report',
          'document_intelligence_quality_report'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'python_internal_jobs_status_ck'
      AND conrelid = 'public.python_internal_jobs'::regclass
  ) THEN
    ALTER TABLE public.python_internal_jobs
      ADD CONSTRAINT python_internal_jobs_status_ck
      CHECK (status IN ('pending', 'leased', 'completed', 'failed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'python_internal_jobs_attempts_ck'
      AND conrelid = 'public.python_internal_jobs'::regclass
  ) THEN
    ALTER TABLE public.python_internal_jobs
      ADD CONSTRAINT python_internal_jobs_attempts_ck
      CHECK (attempts >= 0 AND max_attempts > 0 AND attempts <= max_attempts + 1);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS python_internal_jobs_status_next_run_idx
  ON public.python_internal_jobs(status, next_run_at);

CREATE INDEX IF NOT EXISTS python_internal_jobs_type_status_next_run_idx
  ON public.python_internal_jobs(job_type, status, next_run_at);

ALTER TABLE public.python_internal_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Python internal jobs service select" ON public.python_internal_jobs;
CREATE POLICY "Python internal jobs service select"
  ON public.python_internal_jobs FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Python internal jobs service insert" ON public.python_internal_jobs;
CREATE POLICY "Python internal jobs service insert"
  ON public.python_internal_jobs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Python internal jobs service update" ON public.python_internal_jobs;
CREATE POLICY "Python internal jobs service update"
  ON public.python_internal_jobs FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Python internal jobs service delete" ON public.python_internal_jobs;
CREATE POLICY "Python internal jobs service delete"
  ON public.python_internal_jobs FOR DELETE
  USING (auth.role() = 'service_role');

COMMIT;

-- Rollback SQL (manual)
-- DROP POLICY IF EXISTS "Python internal jobs service delete" ON public.python_internal_jobs;
-- DROP POLICY IF EXISTS "Python internal jobs service update" ON public.python_internal_jobs;
-- DROP POLICY IF EXISTS "Python internal jobs service insert" ON public.python_internal_jobs;
-- DROP POLICY IF EXISTS "Python internal jobs service select" ON public.python_internal_jobs;
-- DROP INDEX IF EXISTS python_internal_jobs_type_status_next_run_idx;
-- DROP INDEX IF EXISTS python_internal_jobs_status_next_run_idx;
-- ALTER TABLE public.python_internal_jobs DROP CONSTRAINT IF EXISTS python_internal_jobs_attempts_ck;
-- ALTER TABLE public.python_internal_jobs DROP CONSTRAINT IF EXISTS python_internal_jobs_status_ck;
-- ALTER TABLE public.python_internal_jobs DROP CONSTRAINT IF EXISTS python_internal_jobs_job_type_ck;
-- DROP TABLE IF EXISTS public.python_internal_jobs;
