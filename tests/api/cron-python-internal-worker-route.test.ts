import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireInternalApiRequest: vi.fn(),
  isPythonInternalJobsEnabled: vi.fn(),
  claimPythonInternalJobs: vi.fn(),
  countPendingPythonInternalJobs: vi.fn(),
  markPythonInternalJobSuccess: vi.fn(),
  markPythonInternalJobFailure: vi.fn(),
  resolvePythonInternalWorkerBatchSize: vi.fn(),
  resolvePythonInternalWorkerConcurrency: vi.fn(),
  executePythonInternalJob: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  requireInternalApiRequest: mocks.requireInternalApiRequest,
}));

vi.mock('@/lib/python-internal/job-queue', () => ({
  isPythonInternalJobsEnabled: mocks.isPythonInternalJobsEnabled,
  claimPythonInternalJobs: mocks.claimPythonInternalJobs,
  countPendingPythonInternalJobs: mocks.countPendingPythonInternalJobs,
  markPythonInternalJobSuccess: mocks.markPythonInternalJobSuccess,
  markPythonInternalJobFailure: mocks.markPythonInternalJobFailure,
  resolvePythonInternalWorkerBatchSize: mocks.resolvePythonInternalWorkerBatchSize,
  resolvePythonInternalWorkerConcurrency: mocks.resolvePythonInternalWorkerConcurrency,
}));

vi.mock('@/lib/python-internal/client', () => ({
  executePythonInternalJob: mocks.executePythonInternalJob,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    error: mocks.logError,
  },
}));

import { GET } from '@/app/api/cron/python-internal-worker/route';

describe('/api/cron/python-internal-worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireInternalApiRequest.mockReturnValue(null);
    mocks.isPythonInternalJobsEnabled.mockReturnValue(true);
    mocks.resolvePythonInternalWorkerBatchSize.mockReturnValue(10);
    mocks.resolvePythonInternalWorkerConcurrency.mockReturnValue(2);
    mocks.countPendingPythonInternalJobs.mockResolvedValue(0);
    mocks.markPythonInternalJobSuccess.mockResolvedValue(undefined);
    mocks.markPythonInternalJobFailure.mockResolvedValue(undefined);
  });

  it('drains claimed jobs through the Python internal client', async () => {
    mocks.claimPythonInternalJobs.mockResolvedValue([
      {
        id: '7f3fa932-5187-420f-ab86-0408a42fd2f5',
        jobType: 'document_intelligence_quality_report',
        attempts: 1,
        maxAttempts: 3,
        source: 'manual',
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
    ]);
    mocks.executePythonInternalJob.mockResolvedValue({
      ok: true,
      service: 'document_intelligence',
      contract_version: '2026-03-06.python-internal.v1',
      job_id: '7f3fa932-5187-420f-ab86-0408a42fd2f5',
      job_type: 'document_intelligence_quality_report',
      result: {
        documents_total: 1,
      },
    });

    const response = await GET(
      new Request('https://example.com/api/cron/python-internal-worker', {
        headers: { authorization: 'Bearer top-secret' },
      }) as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.successCount).toBe(1);
    expect(mocks.executePythonInternalJob).toHaveBeenCalledTimes(1);
    expect(mocks.markPythonInternalJobSuccess).toHaveBeenCalledWith(
      '7f3fa932-5187-420f-ab86-0408a42fd2f5',
      { documents_total: 1 }
    );
  });

  it('records failures when Python execution throws', async () => {
    mocks.claimPythonInternalJobs.mockResolvedValue([
      {
        id: '7f3fa932-5187-420f-ab86-0408a42fd2f5',
        jobType: 'document_intelligence_quality_report',
        attempts: 1,
        maxAttempts: 3,
        source: 'manual',
        payload: {},
      },
    ]);
    mocks.executePythonInternalJob.mockRejectedValue(new Error('Python worker unavailable'));

    const response = await GET(
      new Request('https://example.com/api/cron/python-internal-worker', {
        headers: { authorization: 'Bearer top-secret' },
      }) as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.errorCount).toBe(1);
    expect(mocks.markPythonInternalJobFailure).toHaveBeenCalledWith(
      '7f3fa932-5187-420f-ab86-0408a42fd2f5',
      'Python worker unavailable'
    );
  });
});
