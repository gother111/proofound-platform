import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  enforceCvImportUserRateLimit: vi.fn(),
  createRequestId: vi.fn(),
  jsonWithRequestId: vi.fn(),
  uploadCvImportTempPdf: vi.fn(),
  removeCvImportTempPdfs: vi.fn(),
  enqueuePythonInternalJobs: vi.fn(),
  isPythonInternalJobsEnabled: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock('@/lib/expertise/cv-import-runtime', () => ({
  createRequestId: mocks.createRequestId,
  enforceCvImportUserRateLimit: mocks.enforceCvImportUserRateLimit,
  jsonWithRequestId: mocks.jsonWithRequestId,
}));

vi.mock('@/lib/expertise/cv-import-temp-storage', () => ({
  uploadCvImportTempPdf: mocks.uploadCvImportTempPdf,
  removeCvImportTempPdfs: mocks.removeCvImportTempPdfs,
}));

vi.mock('@/lib/python-internal/job-queue', () => ({
  enqueuePythonInternalJobs: mocks.enqueuePythonInternalJobs,
  isPythonInternalJobsEnabled: mocks.isPythonInternalJobsEnabled,
}));

import { POST } from '@/app/api/expertise/cv-import/wizard-extract/route';

function jsonResponse(_requestId: string, body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  });
}

describe('/api/expertise/cv-import/wizard-extract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createRequestId.mockReturnValue('req-test');
    mocks.jsonWithRequestId.mockImplementation(jsonResponse);
    mocks.enforceCvImportUserRateLimit.mockReturnValue({ allowed: true });
    mocks.isPythonInternalJobsEnabled.mockReturnValue(true);
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: '11111111-1111-4111-8111-111111111111' } },
        }),
      },
    });
    mocks.createAdminClient.mockReturnValue({ storage: {} });
    mocks.uploadCvImportTempPdf.mockImplementation(
      async ({
        jobId,
        documentId,
        fileName,
      }: {
        jobId: string;
        documentId: string;
        fileName: string;
      }) => ({
        storagePath: `11111111-1111-4111-8111-111111111111/${jobId}/${documentId}-${fileName}`,
      })
    );
    mocks.removeCvImportTempPdfs.mockResolvedValue({ failedPaths: [] });
    mocks.enqueuePythonInternalJobs.mockResolvedValue(undefined);
  });

  it('queues an async extract job for authenticated pdf uploads', async () => {
    const formData = new FormData();
    formData.append('files', new File(['dummy'], 'cv.pdf', { type: 'application/pdf' }));
    formData.append('document_ids', 'doc_1');
    formData.append('contexts', 'cv');

    const request = {
      formData: async () => formData,
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/expertise/cv-import/wizard-extract'),
      url: 'http://localhost/api/expertise/cv-import/wizard-extract',
    } as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.status).toBe('queued');
    expect(typeof body.job_id).toBe('string');
    expect(body.poll_after_ms).toBeGreaterThan(0);
    expect(mocks.uploadCvImportTempPdf).toHaveBeenCalledTimes(1);
    expect(mocks.enqueuePythonInternalJobs).toHaveBeenCalledWith([
      expect.objectContaining({
        id: body.job_id,
        jobType: 'document_intelligence_extract_only',
        source: 'manual',
        payload: expect.objectContaining({
          user_id: '11111111-1111-4111-8111-111111111111',
          documents: [
            expect.objectContaining({
              document_id: 'doc_1',
              file_name: 'cv.pdf',
              context: 'cv',
              content_type: 'application/pdf',
            }),
          ],
        }),
      }),
    ]);
  });

  it('returns 429 when the extract route is rate limited', async () => {
    mocks.enforceCvImportUserRateLimit.mockReturnValue({
      allowed: false,
      retryAfterSeconds: 42,
    });

    const formData = new FormData();
    formData.append('files', new File(['dummy'], 'cv.pdf', { type: 'application/pdf' }));

    const request = {
      formData: async () => formData,
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/expertise/cv-import/wizard-extract'),
      url: 'http://localhost/api/expertise/cv-import/wizard-extract',
    } as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.code).toBe('CV_IMPORT_RATE_LIMIT_EXCEEDED');
    expect(response.headers.get('Retry-After')).toBe('42');
    expect(mocks.uploadCvImportTempPdf).not.toHaveBeenCalled();
    expect(mocks.enqueuePythonInternalJobs).not.toHaveBeenCalled();
  });
});
