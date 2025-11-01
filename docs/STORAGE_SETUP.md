# Supabase Storage Setup Guide

This guide explains how to configure Supabase Storage for file uploads in Proofound.

## Overview

Proofound uses Supabase Storage for:

- **Avatars**: User profile pictures (5MB max, public)
- **Cover Images**: Profile/organization banner images (10MB max, public)
- **Documents**: Skill proofs, certificates, artifacts (10MB max, user-private)

## Quick Setup

### Option 1: Using Supabase Dashboard (Recommended for First-Time Setup)

1. **Navigate to Storage in Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Click "Storage" in the left sidebar

2. **Create the Bucket**
   - Click "New bucket"
   - Name: `user-uploads`
   - Public bucket: **Yes** ✓
   - File size limit: `10485760` (10MB)
   - Allowed MIME types:
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - Click "Create bucket"

3. **Configure Policies**
   - Click on the `user-uploads` bucket
   - Go to "Policies" tab
   - Click "New Policy"
   - Click "Create policy from scratch"
   - Add the following policies (see SQL file for exact definitions):
     - Users can upload their own files
     - Users can view their own files
     - Public files are viewable by everyone (for avatars/covers)
     - Users can update their own files
     - Users can delete their own files

### Option 2: Using SQL Script (Recommended for Production)

1. **Run the SQL Migration**

   ```bash
   # Using Supabase CLI
   supabase db push

   # Or execute the SQL file directly
   psql $DATABASE_URL -f supabase/storage-setup.sql
   ```

2. **Verify Setup**

   ```sql
   -- Check bucket
   SELECT * FROM storage.buckets WHERE id = 'user-uploads';

   -- Check policies
   SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
   ```

## File Organization

Files are organized in the following structure:

```
user-uploads/
├── avatars/
│   └── {user_id}-{timestamp}.{ext}
├── covers/
│   └── {user_id}-{timestamp}.{ext}
├── proof/
│   └── {user_id}-{timestamp}-{filename}.{ext}
├── certificate/
│   └── {user_id}-{timestamp}-{filename}.{ext}
├── artifact/
│   └── {user_id}-{timestamp}-{filename}.{ext}
└── documents/
    └── {user_id}-{timestamp}-{filename}.{ext}
```

## API Endpoints

### Upload Avatar

```typescript
POST /api/upload/avatar
Content-Type: multipart/form-data

FormData:
- file: File (required)

Response:
{
  success: true,
  url: "https://...",
  path: "avatars/..."
}
```

### Upload Cover Image

```typescript
POST /api/upload/cover
Content-Type: multipart/form-data

FormData:
- file: File (required)
- profileType: 'individual' | 'organization' (optional)
- orgId: string (required if profileType='organization')

Response:
{
  success: true,
  url: "https://...",
  path: "covers/..."
}
```

### Upload Document

```typescript
POST /api/upload/document
Content-Type: multipart/form-data

FormData:
- file: File (required)
- category: 'proof' | 'certificate' | 'artifact' (optional)

Response:
{
  success: true,
  url: "https://...",
  path: "proof/...",
  fileName: "original-name.pdf",
  fileSize: 123456,
  fileType: "PDF"
}
```

### Delete Avatar

```typescript
DELETE / api / upload / avatar;

Response: {
  success: true;
}
```

### Delete Document

```typescript
DELETE /api/upload/document?path=proof/user-123-file.pdf

Response:
{
  success: true
}
```

## Usage in Components

```typescript
import { uploadFile, validateFile, formatFileSize } from '@/lib/upload';

// Upload avatar
const handleAvatarUpload = async (file: File) => {
  // Validate
  const validation = validateFile(file, 'avatar');
  if (!validation.valid) {
    toast.error(validation.error);
    return;
  }

  // Upload with progress
  const result = await uploadFile({
    file,
    type: 'avatar',
    onProgress: (progress) => {
      console.log(`Upload progress: ${progress}%`);
    },
  });

  if (result.success) {
    toast.success('Avatar uploaded successfully');
    // Update UI with result.url
  } else {
    toast.error(result.error || 'Upload failed');
  }
};

// Upload document
const handleDocumentUpload = async (file: File) => {
  const result = await uploadFile({
    file,
    type: 'document',
    category: 'proof',
  });

  if (result.success) {
    // Save to database
    await saveProof({
      url: result.url,
      fileName: result.fileName,
      fileSize: result.fileSize,
    });
  }
};
```

## Security

### Row-Level Security (RLS)

Storage policies ensure:

- ✅ Users can only upload files with their user ID in the path
- ✅ Users can only view/update/delete their own files
- ✅ Avatars and covers are publicly viewable (for profile display)
- ✅ Documents (proofs, certificates) are private by default

### File Validation

All uploads are validated for:

- ✅ File type (MIME type whitelist)
- ✅ File size limits (5-10MB)
- ✅ User authentication
- ✅ Proper file naming/sanitization

### CORS

Supabase Storage automatically handles CORS for your domain. No additional configuration needed.

## File Size Limits

| File Type | Max Size | Accepted Formats                |
| --------- | -------- | ------------------------------- |
| Avatar    | 5MB      | JPEG, PNG, WebP                 |
| Cover     | 10MB     | JPEG, PNG, WebP                 |
| Document  | 10MB     | PDF, JPEG, PNG, WebP, DOC, DOCX |

## Troubleshooting

### "Failed to upload file"

1. Check that the `user-uploads` bucket exists
2. Verify storage policies are configured correctly
3. Check Supabase logs for detailed error messages

### "Forbidden" errors

1. Ensure user is authenticated
2. Check that file path includes user ID
3. Verify RLS policies are active

### "File too large" errors

1. Compress images before upload (see `AvatarUpload` component for compression example)
2. Check bucket file size limit in Supabase dashboard
3. Consider increasing limits if needed

### Public URLs not accessible

1. Ensure bucket is set to "Public"
2. Check storage policies allow SELECT for public
3. Verify CORS settings in Supabase

## Performance Optimization

### Image Compression

The `AvatarUpload` component uses `browser-image-compression` to compress images before upload:

```typescript
import imageCompression from 'browser-image-compression';

const compressed = await imageCompression(file, {
  maxSizeMB: 0.75,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
});
```

### Caching

Files are served with `Cache-Control: 3600` (1 hour). Adjust in upload routes if needed:

```typescript
const { data, error } = await supabase.storage.from('user-uploads').upload(filePath, buffer, {
  contentType: file.type,
  cacheControl: '3600', // 1 hour
});
```

## Monitoring

### Storage Usage

Check storage usage in Supabase Dashboard:

- Navigate to Settings → Billing
- View "Storage" usage

### File Cleanup

Consider implementing a cron job to clean up:

- Orphaned files (files not referenced in database)
- Deleted user files (after 30-day grace period)
- Temporary uploads

Example cleanup query:

```sql
-- Find files not referenced in profiles
SELECT name FROM storage.objects
WHERE bucket_id = 'user-uploads'
  AND name LIKE 'avatars/%'
  AND name NOT IN (
    SELECT avatar_url FROM profiles WHERE avatar_url IS NOT NULL
  );
```

## Next Steps

After setting up storage:

1. ✅ Update `AvatarUpload` component to use new API
2. ✅ Update `CoverUpload` component to use new API
3. ✅ Implement document upload UI for skill proofs
4. ✅ Add file cleanup cron job
5. ✅ Monitor storage usage and costs

## Support

For issues with Supabase Storage:

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Discord](https://discord.supabase.com)
- Check Supabase Dashboard → Logs for detailed error messages
