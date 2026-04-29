import { describe, expect, it } from 'vitest';

import { buildPortableUploadManifest } from '@/lib/uploads/export';

describe('upload export manifest', () => {
  it('exports owner-only original filenames with a sensitive marker', () => {
    const manifest = buildPortableUploadManifest([
      {
        id: 'file-1',
        upload_kind: 'document',
        original_filename: 'Jane Doe Resume.pdf',
        original_filename_sensitive: true,
        sanitized_filename: 'Jane_Doe_Resume.pdf',
        detected_mime: 'application/pdf',
        durable_path: 'durable/file-1',
        public_path: null,
        deleted_at: null,
      },
      {
        id: 'file-2',
        upload_kind: 'document',
        original_filename: null,
        original_filename_sensitive: true,
        sanitized_filename: null,
        detected_mime: 'application/pdf',
        durable_path: null,
        public_path: null,
        deleted_at: '2026-03-01T00:00:00.000Z',
      },
    ]);

    expect(manifest.includedFiles).toEqual([
      {
        fileId: 'file-1',
        uploadKind: 'document',
        displayLabel: 'Uploaded PDF document',
        originalFilename: 'Jane Doe Resume.pdf',
        originalFilenameSensitive: true,
        storagePath: 'durable/file-1',
      },
    ]);
    expect(manifest.omittedFiles).toEqual([
      {
        fileId: 'file-2',
        reason: 'deleted_before_export',
        uploadKind: 'document',
        displayLabel: 'Uploaded PDF document',
        originalFilename: null,
        originalFilenameSensitive: true,
      },
    ]);
  });
});
