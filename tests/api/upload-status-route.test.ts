import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/uploads/lifecycle', () => ({
  getUploadedFileStatus: vi.fn(),
}));

import { GET } from '@/app/api/upload/status/[fileId]/route';
import { getCurrentUser } from '@/lib/auth';
import { getUploadedFileStatus } from '@/lib/uploads/lifecycle';

describe('GET /api/upload/status/[fileId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-1' } as any);
  });

  it('returns held manual-review status for privacy-risk uploads', async () => {
    vi.mocked(getUploadedFileStatus).mockResolvedValue({
      id: 'upload-1',
      status: 'manual_review',
      lifecycleState: 'quarantined',
      safetyStatus: 'manual_review',
      safetyReason: 'privacy_review_required:metadata_exif,filename_sanitized',
      metadataStatus: 'extracted',
      attachStatus: 'pending',
      privacyReviewRequired: true,
      privacyReviewReasons: ['metadata_exif', 'filename_sanitized'],
      sanitizedFilename: 'safe_name.pdf',
    } as any);

    const response = await GET(new NextRequest('http://localhost/api/upload/status/upload-1'), {
      params: Promise.resolve({ fileId: 'upload-1' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      upload: expect.objectContaining({
        status: 'manual_review',
        privacyReviewRequired: true,
        privacyReviewReasons: ['metadata_exif', 'filename_sanitized'],
      }),
    });
  });

  it('does not leak storage paths when the upload does not belong to the user', async () => {
    vi.mocked(getUploadedFileStatus).mockResolvedValue(null);

    const response = await GET(
      new NextRequest('http://localhost/api/upload/status/upload-foreign'),
      {
        params: Promise.resolve({ fileId: 'upload-foreign' }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({ error: 'Upload not found' });
    expect(JSON.stringify(payload)).not.toContain('user-uploads');
    expect(JSON.stringify(payload)).not.toContain('individual_profile');
  });
});
