-- Storage Setup for Proofound
-- Canonical MVP posture: proof/artifact uploads use private or quarantine buckets only.

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'user-uploads-quarantine',
    'user-uploads-quarantine',
    false,
    26214400,
    ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
  ),
  (
    'user-uploads-private',
    'user-uploads-private',
    false,
    26214400,
    ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Archive legacy public bucket behavior if this script is run against older projects.
UPDATE storage.buckets
SET public = false
WHERE id = 'user-uploads';

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public files are viewable by everyone" ON storage.objects;

DROP POLICY IF EXISTS "Proofound quarantine service select" ON storage.objects;
CREATE POLICY "Proofound quarantine service select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-uploads-quarantine' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Proofound quarantine service insert" ON storage.objects;
CREATE POLICY "Proofound quarantine service insert"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'user-uploads-quarantine' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Proofound quarantine service update" ON storage.objects;
CREATE POLICY "Proofound quarantine service update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'user-uploads-quarantine' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'user-uploads-quarantine' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Proofound quarantine service delete" ON storage.objects;
CREATE POLICY "Proofound quarantine service delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'user-uploads-quarantine' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Proofound private uploads service select" ON storage.objects;
CREATE POLICY "Proofound private uploads service select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-uploads-private' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Proofound private uploads service insert" ON storage.objects;
CREATE POLICY "Proofound private uploads service insert"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'user-uploads-private' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Proofound private uploads service update" ON storage.objects;
CREATE POLICY "Proofound private uploads service update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'user-uploads-private' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'user-uploads-private' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Proofound private uploads service delete" ON storage.objects;
CREATE POLICY "Proofound private uploads service delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'user-uploads-private' AND auth.role() = 'service_role');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT id, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('user-uploads-quarantine', 'user-uploads-private', 'user-uploads');
