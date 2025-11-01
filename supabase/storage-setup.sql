-- Storage Setup for Proofound
-- This script creates storage buckets and policies for file uploads

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create user-uploads bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true, -- Public bucket for user profile images, etc.
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public files are viewable by everyone" ON storage.objects;

-- Policy: Users can upload their own files
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Public files in user-uploads are viewable by everyone
-- (This allows viewing avatars, cover images, etc.)
CREATE POLICY "Public files are viewable by everyone"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'user-uploads' AND
  (
    (storage.foldername(name))[2] IN ('avatars', 'covers')
  )
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Note: storage.foldername() is a Supabase function that extracts folder names
-- from a file path. For example:
--   storage.foldername('avatars/user-123/file.jpg') returns ['avatars', 'user-123', 'file.jpg']
--
-- Our naming convention:
--   avatars/{user_id}-{timestamp}.{ext}
--   covers/{user_id}-{timestamp}.{ext}
--   proof/{user_id}-{timestamp}-{filename}.{ext}
--   certificate/{user_id}-{timestamp}-{filename}.{ext}
--   artifact/{user_id}-{timestamp}-{filename}.{ext}
--   documents/{user_id}-{timestamp}-{filename}.{ext}

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check bucket was created
SELECT * FROM storage.buckets WHERE id = 'user-uploads';

-- Check policies were created
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
