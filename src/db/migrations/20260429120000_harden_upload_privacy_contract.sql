BEGIN;

ALTER TABLE public.uploaded_files
  ADD COLUMN IF NOT EXISTS original_filename_sensitive BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE public.uploaded_files
SET
  original_filename_sensitive = TRUE,
  safe_for_public = FALSE
WHERE upload_kind IN ('proof', 'certificate', 'artifact', 'document')
  AND deleted_at IS NULL;

UPDATE storage.buckets
SET public = FALSE
WHERE id IN ('user-uploads', 'user-uploads-private', 'user-uploads-quarantine');

DROP POLICY IF EXISTS "Public files are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

COMMIT;
