import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  getCanonicalActiveOrgMembership: vi.fn(),
}));

vi.mock('@/lib/authz', () => ({
  authorize: vi.fn(),
}));

vi.mock('@/lib/uploads/lifecycle', () => ({
  UPLOAD_KINDS: {
    COVER: 'cover',
  },
  ingestUploadedFile: vi.fn(),
  deleteUploadedFile: vi.fn(),
}));

import { POST } from '@/app/api/upload/cover/route';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getCanonicalActiveOrgMembership } from '@/lib/api/auth';
import { authorize } from '@/lib/authz';
import { deleteUploadedFile, ingestUploadedFile } from '@/lib/uploads/lifecycle';
import { MULTIPART_UPLOAD_OVERHEAD_BYTES } from '@/lib/uploads/request-size';

function makeFormDataRequest(formData: FormData) {
  return {
    formData: async () => formData,
  } as NextRequest;
}

describe('POST /api/upload/cover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn() } as any);
  });

  it('rejects oversized requests before parsing multipart form data', async () => {
    const formData = vi.fn(async () => {
      throw new Error('formData should not be parsed for oversized uploads');
    });

    const response = await POST({
      headers: new Headers({
        'content-length': String(10 * 1024 * 1024 + MULTIPART_UPLOAD_OVERHEAD_BYTES + 1),
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

  it('rejects unauthorized organization uploads before storage ingest', async () => {
    vi.mocked(getCanonicalActiveOrgMembership).mockResolvedValue({
      role: 'org_manager',
      state: 'active',
      status: 'active',
    });
    vi.mocked(authorize).mockReturnValue({ allowed: false });

    const formData = new FormData();
    formData.set('profileType', 'organization');
    formData.set('orgId', '123e4567-e89b-42d3-a456-426614174000');
    formData.set('file', new File(['cover'], 'cover.png', { type: 'image/png' }));

    const response = await POST(makeFormDataRequest(formData));

    expect(response.status).toBe(403);
    expect(vi.mocked(ingestUploadedFile)).not.toHaveBeenCalled();
  });

  it('cleans up uploaded files when the organization update fails after ingest', async () => {
    const orgId = '123e4567-e89b-42d3-a456-426614174000';
    const eq = vi.fn().mockResolvedValue({
      error: { message: 'update failed' },
    });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn((table: string) => {
      if (table === 'organizations') {
        return { update };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue({ from } as any);
    vi.mocked(getCanonicalActiveOrgMembership).mockResolvedValue({
      role: 'org_owner',
      state: 'active',
      status: 'active',
    });
    vi.mocked(authorize).mockReturnValue({ allowed: true });
    vi.mocked(ingestUploadedFile).mockResolvedValue({
      uploadedFileId: 'upload-1',
      status: 'ready',
      url: 'https://cdn.example/cover.png',
      storagePath: 'organization/org-1/cover/cover.png',
    } as any);
    vi.mocked(deleteUploadedFile).mockResolvedValue(true as any);

    const formData = new FormData();
    formData.set('profileType', 'organization');
    formData.set('orgId', orgId);
    formData.set('file', new File(['cover'], 'cover.png', { type: 'image/png' }));

    const response = await POST(makeFormDataRequest(formData));

    expect(response.status).toBe(500);
    expect(vi.mocked(deleteUploadedFile)).toHaveBeenCalledWith('upload-1', orgId);
  });
});
