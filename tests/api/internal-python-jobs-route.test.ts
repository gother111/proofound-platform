import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireInternalApiRequest: vi.fn(),
  enqueuePythonInternalJobs: vi.fn(),
  countPendingPythonInternalJobs: vi.fn(),
  isPythonInternalJobsEnabled: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  requireInternalApiRequest: mocks.requireInternalApiRequest,
}));

vi.mock('@/lib/python-internal/job-queue', () => ({
  enqueuePythonInternalJobs: mocks.enqueuePythonInternalJobs,
  countPendingPythonInternalJobs: mocks.countPendingPythonInternalJobs,
  isPythonInternalJobsEnabled: mocks.isPythonInternalJobsEnabled,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    error: mocks.logError,
  },
}));

import { POST } from '@/app/api/internal/python-jobs/route';

describe('/api/internal/python-jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireInternalApiRequest.mockReturnValue(null);
    mocks.isPythonInternalJobsEnabled.mockReturnValue(true);
    mocks.enqueuePythonInternalJobs.mockResolvedValue([
      {
        id: '7f3fa932-5187-420f-ab86-0408a42fd2f5',
        jobType: 'document_intelligence_quality_report',
      },
    ]);
    mocks.countPendingPythonInternalJobs.mockResolvedValue(1);
  });

  it('enqueues validated Python internal jobs', async () => {
    const response = await POST(
      new Request('https://example.com/api/internal/python-jobs', {
        method: 'POST',
        headers: {
          authorization: 'Bearer top-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          jobs: [
            {
              job_type: 'document_intelligence_quality_report',
              payload: {
                documents: [
                  {
                    document_id: 'doc-1',
                    file_name: 'cv.pdf',
                    text: 'React TypeScript',
                    context: 'cv',
                  },
                ],
              },
            },
          ],
        }),
      }) as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pending).toBe(1);
    expect(mocks.enqueuePythonInternalJobs).toHaveBeenCalledTimes(1);
  });

  it('returns 400 on invalid payloads', async () => {
    const response = await POST(
      new Request('https://example.com/api/internal/python-jobs', {
        method: 'POST',
        headers: {
          authorization: 'Bearer top-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          jobs: [
            {
              job_type: 'document_intelligence_quality_report',
              payload: {
                documents: [],
              },
            },
          ],
        }),
      }) as any
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid request payload');
    expect(mocks.enqueuePythonInternalJobs).not.toHaveBeenCalled();
  });
});
