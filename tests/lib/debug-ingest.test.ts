import { afterEach, describe, expect, it, vi } from 'vitest';

import { sendDebugIngest } from '@/lib/debug-ingest';

const originalEnv = { ...process.env };

describe('sendDebugIngest', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('sends debug ingest only in local test or development runtimes', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    process.env.NODE_ENV = 'test';
    process.env.VERCEL_ENV = '';
    process.env.NEXT_PUBLIC_APP_ENV = '';
    process.env.APP_ENV = '';
    process.env.DEBUG_INGEST_URL = 'https://debug.example/ingest';
    process.env.NEXT_PUBLIC_DEBUG_INGEST_URL = 'https://debug.example/ingest';

    sendDebugIngest({
      sessionId: 'session-1',
      runId: 'run-1',
      hypothesisId: 'hypothesis-1',
      location: 'login',
      message: 'local debug event',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://debug.example/ingest',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('does not send debug ingest in production deploy runtimes', () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'production';
    process.env.DEBUG_INGEST_ENABLED = 'true';
    process.env.DEBUG_INGEST_URL = 'https://debug.example/ingest';
    process.env.NEXT_PUBLIC_DEBUG_INGEST_URL = 'https://debug-public.example/ingest';

    sendDebugIngest({
      sessionId: 'session-1',
      runId: 'run-1',
      hypothesisId: 'hypothesis-1',
      location: 'login',
      message: 'production debug event',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
