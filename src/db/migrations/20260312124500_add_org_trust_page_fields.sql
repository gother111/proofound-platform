ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS working_context TEXT,
  ADD COLUMN IF NOT EXISTS hiring_process_summary TEXT;
