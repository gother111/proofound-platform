import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  processCvImportExtractJob: vi.fn(),
  executePythonInternalJob: vi.fn(),
  markPythonInternalJobSuccess: vi.fn(),
  markPythonInternalJobFailure: vi.fn(),
}));

vi.mock('@/archive/non_launch_python_internal/lib/expertise/cv-import-extract-worker', () => ({
  processCvImportExtractJob: mocks.processCvImportExtractJob,
}));

vi.mock('@/archive/non_launch_python_internal/lib/python-internal/client', () => ({
  executePythonInternalJob: mocks.executePythonInternalJob,
}));

vi.mock('@/archive/non_launch_python_internal/lib/python-internal/job-queue', async () => {
  const actual = await vi.importActual<
    typeof import('@/archive/non_launch_python_internal/lib/python-internal/job-queue')
  >('@/archive/non_launch_python_internal/lib/python-internal/job-queue');

  return {
    ...actual,
    markPythonInternalJobSuccess: mocks.markPythonInternalJobSuccess,
    markPythonInternalJobFailure: mocks.markPythonInternalJobFailure,
  };
});

import { executeClaimedPythonInternalJob } from '@/archive/non_launch_python_internal/lib/python-internal/worker';

describe('executeClaimedPythonInternalJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.markPythonInternalJobSuccess.mockResolvedValue(undefined);
    mocks.markPythonInternalJobFailure.mockResolvedValue(undefined);
  });

  it('marks extract-only jobs as successful', async () => {
    mocks.processCvImportExtractJob.mockResolvedValue({
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
      cleanup_failed_paths: [],
    });

    const result = await executeClaimedPythonInternalJob({
      request: new Request('https://example.com/api/cron/python-internal-worker') as any,
      job: {
        id: 'job-1',
        jobType: 'document_intelligence_extract_only',
        attempts: 1,
        maxAttempts: 3,
        source: 'manual',
        payload: {
          user_id: '11111111-1111-4111-8111-111111111111',
        },
      },
    });

    expect(result.status).toBe('completed');
    expect(mocks.markPythonInternalJobSuccess).toHaveBeenCalledWith('job-1', {
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
      cleanup_failed_paths: [],
    });
  });

  it('records failures exactly once when execution throws', async () => {
    mocks.executePythonInternalJob.mockRejectedValue(new Error('Python worker unavailable'));

    const result = await executeClaimedPythonInternalJob({
      request: new Request('https://example.com/api/cron/python-internal-worker') as any,
      job: {
        id: 'job-1',
        jobType: 'document_intelligence_quality_report',
        attempts: 1,
        maxAttempts: 3,
        source: 'manual',
        payload: {},
      },
    });

    expect(result).toMatchObject({
      status: 'failed',
      error: 'Python worker unavailable',
    });
    expect(mocks.markPythonInternalJobFailure).toHaveBeenCalledTimes(1);
    expect(mocks.markPythonInternalJobFailure).toHaveBeenCalledWith(
      'job-1',
      'Python worker unavailable',
      {
        error: 'Error',
        message: 'Python worker unavailable',
        code: undefined,
      }
    );
    expect(mocks.markPythonInternalJobSuccess).not.toHaveBeenCalled();
  });
});
