import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getInternalApiSecret: vi.fn(),
  resolvePythonInternalServiceBaseUrl: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  getInternalApiSecret: mocks.getInternalApiSecret,
}));

vi.mock('@/archive/non_launch_python_internal/lib/python-internal/service', () => ({
  resolvePythonInternalServiceBaseUrl: mocks.resolvePythonInternalServiceBaseUrl,
}));

import { triggerPythonInternalWorker } from '@/archive/non_launch_python_internal/lib/python-internal/trigger';

describe('triggerPythonInternalWorker', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    mocks.getInternalApiSecret.mockReturnValue('top-secret');
    mocks.resolvePythonInternalServiceBaseUrl.mockReturnValue('https://proofound.io');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the worker endpoint with internal auth', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

    const ok = await triggerPythonInternalWorker();

    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://proofound.io/api/cron/python-internal-worker',
      expect.objectContaining({
        method: 'GET',
        headers: {
          authorization: 'Bearer top-secret',
        },
      })
    );
  });

  it('returns false when the worker wake request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const ok = await triggerPythonInternalWorker();

    expect(ok).toBe(false);
  });

  it('returns false when the internal secret is missing', async () => {
    mocks.getInternalApiSecret.mockReturnValue('');

    const ok = await triggerPythonInternalWorker();

    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
