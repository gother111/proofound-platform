import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createRequestId: vi.fn(),
  jsonWithRequestId: vi.fn(),
  getPythonInternalJob: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/expertise/cv-import-runtime', () => ({
  createRequestId: mocks.createRequestId,
  jsonWithRequestId: mocks.jsonWithRequestId,
}));

vi.mock('@/lib/python-internal/job-queue', () => ({
  getPythonInternalJob: mocks.getPythonInternalJob,
}));

import { GET } from '@/app/api/expertise/cv-import/wizard-extract/status/route';

function jsonResponse(_requestId: string, body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  });
}

describe('/api/expertise/cv-import/wizard-extract/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createRequestId.mockReturnValue('req-status');
    mocks.jsonWithRequestId.mockImplementation(jsonResponse);
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: '11111111-1111-4111-8111-111111111111' } },
        }),
      },
    });
  });

  it('returns completed extracted documents for the owning user', async () => {
    mocks.getPythonInternalJob.mockResolvedValue({
      id: 'job-1',
      jobType: 'document_intelligence_extract_only',
      status: 'completed',
      payload: {
        user_id: '11111111-1111-4111-8111-111111111111',
        requested_at: '2026-03-06T12:00:00.000Z',
        documents: [
          {
            document_id: 'doc_1',
            file_name: 'cv.pdf',
            storage_path: 'user/job/doc_1-cv.pdf',
            content_type: 'application/pdf',
            context: 'cv',
          },
        ],
      },
      result: {
        documents: [
          {
            document_id: 'doc_1',
            file_name: 'cv.pdf',
            text: 'React TypeScript',
            context: 'cv',
          },
        ],
        failed_documents: [],
        cleanup_pending: false,
      },
    });

    const request = new NextRequest(
      'http://localhost/api/expertise/cv-import/wizard-extract/status?job_id=job-1'
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('completed');
    expect(body.documents).toEqual([
      {
        document_id: 'doc_1',
        file_name: 'cv.pdf',
        text: 'React TypeScript',
        context: 'cv',
      },
    ]);
  });

  it('returns 404 when the current user does not own the job', async () => {
    mocks.getPythonInternalJob.mockResolvedValue({
      id: 'job-1',
      jobType: 'document_intelligence_extract_only',
      status: 'pending',
      payload: {
        user_id: '22222222-2222-4222-8222-222222222222',
        requested_at: '2026-03-06T12:00:00.000Z',
        documents: [
          {
            document_id: 'doc_1',
            file_name: 'cv.pdf',
            storage_path: 'user/job/doc_1-cv.pdf',
            content_type: 'application/pdf',
            context: 'cv',
          },
        ],
      },
      result: null,
    });

    const request = new NextRequest(
      'http://localhost/api/expertise/cv-import/wizard-extract/status?job_id=job-1'
    );

    const response = await GET(request);

    expect(response.status).toBe(404);
  });

  it('returns normalized failure payloads for failed jobs', async () => {
    mocks.getPythonInternalJob.mockResolvedValue({
      id: 'job-1',
      jobType: 'document_intelligence_extract_only',
      status: 'failed',
      lastError: 'Python extract unavailable',
      payload: {
        user_id: '11111111-1111-4111-8111-111111111111',
        requested_at: '2026-03-06T12:00:00.000Z',
        documents: [
          {
            document_id: 'doc_1',
            file_name: 'cv.pdf',
            storage_path: 'user/job/doc_1-cv.pdf',
            content_type: 'application/pdf',
            context: 'cv',
          },
        ],
      },
      result: {
        error: 'PythonCvExtractError',
        message: 'Python extract unavailable',
        code: 'CV_IMPORT_PROXY_UNAVAILABLE',
      },
    });

    const request = new NextRequest(
      'http://localhost/api/expertise/cv-import/wizard-extract/status?job_id=job-1'
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      job_id: 'job-1',
      status: 'failed',
      error: 'Python extract unavailable',
      message: 'Python extract unavailable',
      code: 'CV_IMPORT_PROXY_UNAVAILABLE',
    });
  });
});
