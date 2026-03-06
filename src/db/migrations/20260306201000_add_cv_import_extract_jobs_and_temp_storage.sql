BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'python_internal_jobs_job_type_ck'
      AND conrelid = 'public.python_internal_jobs'::regclass
  ) THEN
    ALTER TABLE public.python_internal_jobs
      DROP CONSTRAINT python_internal_jobs_job_type_ck;
  END IF;
END $$;

ALTER TABLE public.python_internal_jobs
  ADD CONSTRAINT python_internal_jobs_job_type_ck
  CHECK (
    job_type IN (
      'document_intelligence_skill_report',
      'document_intelligence_wizard_report',
      'document_intelligence_quality_report',
      'document_intelligence_extract_only'
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-import-temp',
  'cv-import-temp',
  false,
  20971520,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "CV import temp service select" ON storage.objects;
CREATE POLICY "CV import temp service select"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cv-import-temp' AND auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "CV import temp service insert" ON storage.objects;
CREATE POLICY "CV import temp service insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cv-import-temp' AND auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "CV import temp service update" ON storage.objects;
CREATE POLICY "CV import temp service update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cv-import-temp' AND auth.role() = 'service_role'
)
WITH CHECK (
  bucket_id = 'cv-import-temp' AND auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "CV import temp service delete" ON storage.objects;
CREATE POLICY "CV import temp service delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cv-import-temp' AND auth.role() = 'service_role'
);

COMMIT;
