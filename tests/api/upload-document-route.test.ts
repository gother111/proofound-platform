import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

import { DELETE, POST } from '@/app/api/upload/document/route';
import { getCurrentUser } from '@/lib/auth';
import { deleteUploadedFile, ingestUploadedFile } from '@/lib/uploads/lifecycle';
import { MULTIPART_UPLOAD_OVERHEAD_BYTES } from '@/lib/uploads/request-size';

describe('POST /api/upload/document', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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
        'content-length': String(25 * 1024 * 1024 + MULTIPART_UPLOAD_OVERHEAD_BYTES + 1),
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

  it('returns a manual-review response with a generic label and no storage path for risky uploads', async () => {
    vi.mocked(ingestUploadedFile).mockResolvedValue({
      uploadedFileId: 'upload-1',
      status: 'manual_review',
      url: null,
      storagePath: null,
      safetyReason: 'privacy_review_required:filename_identity_signal,metadata_exif',
      detectedMime: 'application/pdf',
      artifactDisplayName: 'Uploaded PDF document',
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
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload).toEqual(
      expect.objectContaining({
        status: 'manual_review',
        artifactDisplayName: 'Uploaded PDF document',
        fileName: 'Uploaded PDF document',
        message: expect.stringContaining('privacy review'),
      })
    );
    expect(JSON.stringify(payload)).not.toContain('../unsafe name.pdf');
    expect(payload).not.toHaveProperty('path');
    expect(payload).not.toHaveProperty('url');
  });

  it('returns attachable owner-safe labels without leaking storage paths', async () => {
    vi.mocked(ingestUploadedFile).mockResolvedValue({
      uploadedFileId: 'upload-2',
      status: 'ready',
      url: null,
      storagePath: null,
      safetyReason: null,
      detectedMime: 'application/pdf',
      artifactDisplayName: 'service_agreement.pdf',
    } as any);

    const formData = new FormData();
    formData.set(
      'file',
      new File(['agreement'], 'service agreement.pdf', {
        type: 'application/pdf',
      })
    );

    const response = await POST({
      formData: async () => formData,
    } as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual(
      expect.objectContaining({
        status: 'attachable',
        artifactDisplayName: 'service_agreement.pdf',
        fileName: 'service_agreement.pdf',
      })
    );
    expect(JSON.stringify(payload)).not.toContain('service agreement.pdf');
    expect(JSON.stringify(payload)).not.toContain('individual_profile/user-1');
    expect(payload).not.toHaveProperty('path');
    expect(payload).not.toHaveProperty('url');
  });

  it('returns a generic production response for storage failures without exposing path or filename', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.mocked(ingestUploadedFile).mockRejectedValue(
      new Error(
        'storage path individual_profile/user-1/proof/Jordan Resume.pdf failed in bucket proof_uploads'
      )
    );

    const formData = new FormData();
    formData.set(
      'file',
      new File(['proof'], 'Jordan Resume.pdf', {
        type: 'application/pdf',
      })
    );

    const response = await POST({
      formData: async () => formData,
    } as NextRequest);
    const payload = await response.json();
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: 'Upload failed' });
    expect(serialized).not.toContain('individual_profile');
    expect(serialized).not.toContain('proof_uploads');
    expect(serialized).not.toContain('Jordan Resume.pdf');
  });

  it('deletes only by owner-checked uploaded file id', async () => {
    vi.mocked(deleteUploadedFile).mockResolvedValue(true);

    const response = await DELETE(
      new NextRequest('http://localhost/api/upload/document?fileId=upload-1')
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true });
    expect(deleteUploadedFile).toHaveBeenCalledWith('upload-1', 'user-1');
  });

  it('returns a generic not-found response when owner check denies file-id deletion', async () => {
    vi.mocked(deleteUploadedFile).mockResolvedValue(false);

    const response = await DELETE(
      new NextRequest('http://localhost/api/upload/document?fileId=upload-owned-by-someone-else')
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({ error: 'Not found' });
    expect(deleteUploadedFile).toHaveBeenCalledWith('upload-owned-by-someone-else', 'user-1');
  });

  it('rejects path-only delete attempts so storage paths are not authority', async () => {
    const response = await DELETE(
      new NextRequest(
        'http://localhost/api/upload/document?path=individual_profile/user-1/proof/file.pdf'
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('File id required');
    expect(deleteUploadedFile).not.toHaveBeenCalled();
  });
});
