import { beforeEach, describe, expect, it, vi } from 'vitest';

const executeMock = vi.fn();
const uploadMock = vi.fn();
const removeMock = vi.fn();
const ensureInternalOpsQueueItemMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    execute: (...args: any[]) => executeMock(...args),
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({
        upload: (...args: any[]) => uploadMock(...args),
        remove: (...args: any[]) => removeMock(...args),
      }),
    },
  }),
}));

vi.mock('@/lib/internal-ops/queue', () => ({
  ensureInternalOpsQueueItem: (...args: any[]) => ensureInternalOpsQueueItemMock(...args),
}));

import { ingestUploadedFile, UPLOAD_KINDS } from '@/lib/uploads/lifecycle';

describe('upload lifecycle internal ops queue handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockReset();
    uploadMock.mockResolvedValue({ error: null });
    removeMock.mockResolvedValue({ error: null });
    ensureInternalOpsQueueItemMock.mockResolvedValue({
      id: 'queue-1',
    });
    executeMock.mockImplementationOnce(async () => [{ id: 'upload-1' }]).mockResolvedValue({});
  });

  it('creates a correction queue item when an evidence upload is held for privacy review', async () => {
    const buffer = Buffer.from('%PDF- Exif GPS /Author xmp:meta');
    const file = {
      name: '../risk?.pdf',
      type: 'application/pdf',
      size: buffer.length,
      arrayBuffer: async () => buffer,
    } as File;

    const result = await ingestUploadedFile(file, {
      ownerType: 'individual_profile',
      ownerId: '11111111-1111-1111-1111-111111111111',
      sourceSurface: 'document_upload',
      uploadKind: UPLOAD_KINDS.DOCUMENT,
    });

    expect(result.status).toBe('manual_review');
    expect(result.uploadedFileId).toBe('upload-1');
    expect(ensureInternalOpsQueueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queueType: 'correction_revocation',
        linkedEntityType: 'uploaded_file',
        linkedEntityId: 'upload-1',
        actorType: 'candidate',
        actorId: '11111111-1111-1111-1111-111111111111',
        metadata: expect.objectContaining({
          sanitizedFilename: 'risk_.pdf',
          uploadKind: 'document',
          safetyReason: expect.stringContaining('privacy_review_required:'),
          reviewReasons: expect.arrayContaining(['filename_sanitized', 'metadata_exif']),
        }),
      })
    );
  });
});
