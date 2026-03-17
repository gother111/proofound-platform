import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/uploads/lifecycle', () => ({
  UPLOAD_KINDS: {
    PROOF: 'proof',
    CERTIFICATE: 'certificate',
    ARTIFACT: 'artifact',
    DOCUMENT: 'document',
  },
  ingestUploadedFile: vi.fn(),
  deleteUploadedFile: vi.fn(),
}));

import { POST } from '@/app/api/upload/document/route';
import { getCurrentUser } from '@/lib/auth';
import { ingestUploadedFile } from '@/lib/uploads/lifecycle';

describe('POST /api/upload/document', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-1' } as any);
  });

  it('returns a manual-review response with a sanitized filename for risky uploads', async () => {
    vi.mocked(ingestUploadedFile).mockResolvedValue({
      uploadedFileId: 'upload-1',
      status: 'manual_review',
      url: null,
      storagePath: 'individual_profile/user-1/proof/123-safe_name.pdf',
      safetyReason: 'privacy_review_required:metadata_exif',
      detectedMime: 'application/pdf',
      displayName: 'safe_name.pdf',
    } as any);

    const formData = new FormData();
    formData.set('category', 'proof');
    formData.set(
      'file',
      new File(['proof'], '../unsafe name.pdf', {
        type: 'application/pdf',
      })
    );

    const response = await POST({
      formData: async () => formData,
    } as NextRequest);

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        status: 'manual_review',
        fileName: 'safe_name.pdf',
        message: expect.stringContaining('privacy review'),
      })
    );
  });
});
