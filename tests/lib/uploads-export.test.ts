import { describe, expect, it } from 'vitest';

import { buildPortableUploadManifest } from '@/lib/uploads/export';

describe('upload export manifest', () => {
  it('exports privacy-safe display names instead of raw original filenames', () => {
    const manifest = buildPortableUploadManifest([
      {
        id: 'file-1',
        upload_kind: 'document',
        sanitized_filename: 'Jane_Doe_Resume.pdf',
        detected_mime: 'application/pdf',
        durable_path: 'durable/file-1',
        public_path: null,
        deleted_at: null,
      },
      {
        id: 'file-2',
        upload_kind: 'document',
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
        originalFilename: 'Jane_Doe_Resume.pdf',
        storagePath: 'durable/file-1',
      },
    ]);
    expect(manifest.omittedFiles).toEqual([
      {
        fileId: 'file-2',
        reason: 'deleted_before_export',
        uploadKind: 'document',
        originalFilename: 'Uploaded PDF document',
      },
    ]);
  });
});
