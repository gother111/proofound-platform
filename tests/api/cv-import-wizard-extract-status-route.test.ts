import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createRequestId: vi.fn(),
  jsonWithRequestId: vi.fn(),
  getPythonInternalJob: vi.fn(),
  triggerPythonInternalWorker: vi.fn(),
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

vi.mock('@/lib/python-internal/trigger', () => ({
  triggerPythonInternalWorker: mocks.triggerPythonInternalWorker,
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

function buildBaseJob(overrides?: Record<string, unknown>) {
  const now = Date.now();
  return {
    id: 'job-1',
    jobType: 'document_intelligence_extract_only',
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    source: 'manual',
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
    result: null,
    lastError: null,
    nextRunAt: new Date(now - 1_000),
    leaseExpiresAt: null,
    completedAt: null,
    createdAt: new Date(now - 10_000),
    updatedAt: new Date(now - 10_000),
    ...overrides,
  };
}

describe('/api/expertise/cv-import/wizard-extract/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createRequestId.mockReturnValue('req-status');
    mocks.jsonWithRequestId.mockImplementation(jsonResponse);
    mocks.triggerPythonInternalWorker.mockResolvedValue(true);
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: '11111111-1111-4111-8111-111111111111' } },
        }),
      },
    });
  });

  it('returns completed extracted documents for the owning user', async () => {
    mocks.getPythonInternalJob.mockResolvedValue(
      buildBaseJob({
        status: 'completed',
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
      })
    );

    const response = await GET(
      new NextRequest('http://localhost/api/expertise/cv-import/wizard-extract/status?job_id=job-1')
    );
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
    expect(mocks.triggerPythonInternalWorker).not.toHaveBeenCalled();
  });

  it('returns queued and nudges the worker for stale pending jobs', async () => {
    mocks.getPythonInternalJob
      .mockResolvedValueOnce(buildBaseJob())
      .mockResolvedValueOnce(buildBaseJob());

    const response = await GET(
      new NextRequest('http://localhost/api/expertise/cv-import/wizard-extract/status?job_id=job-1')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      job_id: 'job-1',
      status: 'queued',
      recovery_state: 'queued',
    });
    expect(mocks.triggerPythonInternalWorker).toHaveBeenCalledTimes(1);
  });

  it('returns retrying queued status for backoff jobs without waking the worker early', async () => {
    mocks.getPythonInternalJob.mockResolvedValue(
      buildBaseJob({
        attempts: 1,
        lastError: 'Python extract unavailable',
        nextRunAt: new Date(Date.now() + 15_000),
      })
    );

    const response = await GET(
      new NextRequest('http://localhost/api/expertise/cv-import/wizard-extract/status?job_id=job-1')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('queued');
    expect(body.recovery_state).toBe('retrying');
    expect(body.retry_after_ms).toBeGreaterThanOrEqual(14_900);
    expect(mocks.triggerPythonInternalWorker).not.toHaveBeenCalled();
  });

  it('returns processing for active leased jobs without double-running them', async () => {
    mocks.getPythonInternalJob.mockResolvedValue(
      buildBaseJob({
        status: 'leased',
        leaseExpiresAt: new Date(Date.now() + 30_000),
      })
    );

    const response = await GET(
      new NextRequest('http://localhost/api/expertise/cv-import/wizard-extract/status?job_id=job-1')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      job_id: 'job-1',
      status: 'processing',
    });
    expect(mocks.triggerPythonInternalWorker).not.toHaveBeenCalled();
  });

  it('treats expired leases as queued and wakes the worker', async () => {
    mocks.getPythonInternalJob
      .mockResolvedValueOnce(
        buildBaseJob({
          status: 'leased',
          attempts: 1,
          lastError: 'Request timed out',
          leaseExpiresAt: new Date(Date.now() - 1_000),
        })
      )
      .mockResolvedValueOnce(
        buildBaseJob({
          status: 'leased',
          attempts: 1,
          lastError: 'Request timed out',
          leaseExpiresAt: new Date(Date.now() - 1_000),
        })
      );

    const response = await GET(
      new NextRequest('http://localhost/api/expertise/cv-import/wizard-extract/status?job_id=job-1')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('queued');
    expect(body.recovery_state).toBe('retrying');
    expect(mocks.triggerPythonInternalWorker).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when the current user does not own the job', async () => {
    mocks.getPythonInternalJob.mockResolvedValue(
      buildBaseJob({
        payload: {
          user_id: '22222222-2222-4222-8222-222222222222',
          requested_at: '2026-03-06T12:00:00.000Z',
          documents: [],
        },
      })
    );

    const response = await GET(
      new NextRequest('http://localhost/api/expertise/cv-import/wizard-extract/status?job_id=job-1')
    );

    expect(response.status).toBe(404);
  });

  it('returns normalized failure payloads for permanently failed jobs', async () => {
    mocks.getPythonInternalJob.mockResolvedValue(
      buildBaseJob({
        status: 'failed',
        attempts: 3,
        lastError: 'Python extract unavailable',
        result: {
          error: 'PythonCvExtractError',
          message: 'Python extract unavailable',
          code: 'CV_IMPORT_PROXY_UNAVAILABLE',
        },
      })
    );

    const response = await GET(
      new NextRequest('http://localhost/api/expertise/cv-import/wizard-extract/status?job_id=job-1')
    );
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
