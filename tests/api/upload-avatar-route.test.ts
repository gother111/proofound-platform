import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/uploads/lifecycle', () => ({
  UPLOAD_KINDS: {
    AVATAR: 'avatar',
  },
  ingestUploadedFile: vi.fn(),
  deleteUploadedFile: vi.fn(),
}));

import { POST } from '@/app/api/upload/avatar/route';
import { getCurrentUser } from '@/lib/auth';
import { ingestUploadedFile } from '@/lib/uploads/lifecycle';
import { MULTIPART_UPLOAD_OVERHEAD_BYTES } from '@/lib/uploads/request-size';

describe('POST /api/upload/avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-1' } as any);
  });

  it('rejects oversized requests before parsing multipart form data', async () => {
    const formData = vi.fn(async () => {
      throw new Error('formData should not be parsed for oversized uploads');
    });

    const response = await POST({
      headers: new Headers({
        'content-length': String(5 * 1024 * 1024 + MULTIPART_UPLOAD_OVERHEAD_BYTES + 1),
      }),
      formData,
    } as unknown as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(413);
    expect(payload).toEqual({
      error: 'Upload rejected',
      message: 'The upload request is too large for this flow.',
    });
    expect(formData).not.toHaveBeenCalled();
    expect(ingestUploadedFile).not.toHaveBeenCalled();
  });

  it('rejects malformed multipart form data before storage ingest', async () => {
    const response = await POST({
      headers: new Headers({ 'content-type': 'multipart/form-data' }),
      formData: vi.fn(async () => {
        throw new Error('invalid multipart boundary');
      }),
    } as unknown as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid form data' });
    expect(ingestUploadedFile).not.toHaveBeenCalled();
  });
});
