CREATE TABLE IF NOT EXISTS public.start_from_cv_import_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'cv' CHECK (source_type = 'cv'),
  status text NOT NULL DEFAULT 'created' CHECK (
    status IN (
      'created',
      'extraction_failed',
      'manual_fallback',
      'ready_for_review',
      'accepted',
      'discarded',
      'deleted'
    )
  ),
  consent_confirmed_at timestamptz,
  extraction_status text NOT NULL DEFAULT 'not_started',
  privacy_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  draft_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  discarded_unsafe_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  accepted_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_mime_type text,
  file_size_bytes integer,
  page_count integer,
  extracted_text_hash text,
  redaction_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  ocr_provider_used text,
  model_used text,
  usage_log_id uuid,
  source_deleted_at timestamptz,
  expires_at timestamptz NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_start_from_cv_sessions_user_created
  ON public.start_from_cv_import_sessions (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_start_from_cv_sessions_status
  ON public.start_from_cv_import_sessions (status);

ALTER TABLE public.start_from_cv_import_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS start_from_cv_sessions_owner_select
  ON public.start_from_cv_import_sessions;
CREATE POLICY start_from_cv_sessions_owner_select
  ON public.start_from_cv_import_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS start_from_cv_sessions_owner_insert
  ON public.start_from_cv_import_sessions;
CREATE POLICY start_from_cv_sessions_owner_insert
  ON public.start_from_cv_import_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS start_from_cv_sessions_owner_update
  ON public.start_from_cv_import_sessions;
CREATE POLICY start_from_cv_sessions_owner_update
  ON public.start_from_cv_import_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
