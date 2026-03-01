import { describe, it, expect, vi, beforeEach } from 'vitest';

const okJson = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const forbiddenJson = (body: unknown) => new Response(JSON.stringify(body), { status: 403 });

describe('apiFetch', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('does not request CSRF token for GET', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({}));
    vi.stubGlobal('fetch', fetchMock);
    const { apiFetch, __resetCsrfCacheForTests } = await import('@/lib/api/fetch');
    __resetCsrfCacheForTests();

    await apiFetch('https://example.com/api/test');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.com/api/test');
    expect(init?.method).toBe('GET');
  });

  it('requests CSRF token and includes it for POST', async () => {
    const fetchMock = vi.fn();
    // First call: csrf token endpoint
    fetchMock.mockResolvedValueOnce(okJson({ token: 'abc123' }));
    // Second call: actual request
    fetchMock.mockResolvedValueOnce(okJson({ success: true }));

    vi.stubGlobal('fetch', fetchMock);
    const { apiFetch, __resetCsrfCacheForTests } = await import('@/lib/api/fetch');
    __resetCsrfCacheForTests();

    await apiFetch('https://example.com/api/thing', { method: 'POST' });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    // First call should be to csrf-token endpoint
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/csrf-token?ts=');
    const csrfInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect(csrfInit.credentials).toBe('include');
    expect(csrfInit.cache).toBe('no-store');

    // Second call should carry the header
    const secondCallInit = fetchMock.mock.calls[1][1] as RequestInit;
    const headers = new Headers(secondCallInit.headers as HeadersInit);
    expect(headers.get('x-csrf-token')).toBe('abc123');
    expect(secondCallInit.credentials).toBe('include');
  });

  it('fails fast on mutating requests when CSRF token cannot be fetched', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: 'unavailable' }), { status: 503 }));

    vi.stubGlobal('fetch', fetchMock);
    const { apiFetch, __resetCsrfCacheForTests } = await import('@/lib/api/fetch');
    __resetCsrfCacheForTests();

    await expect(
      apiFetch('/api/expertise/cv-import/wizard-suggest', { method: 'POST' })
    ).rejects.toThrow('Security token could not be initialized. Please refresh and try again.');

    // Only token endpoint fetch should run. Protected endpoint fetch should not be attempted.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/csrf-token?ts=');
  });

  it('retries once after CSRF 403 with refreshed token', async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(okJson({ token: 'stale-token' })) // initial token fetch
      .mockResolvedValueOnce(
        forbiddenJson({
          error: 'CSRF validation failed',
          message: 'Invalid or missing CSRF token',
        })
      ) // first protected request
      .mockResolvedValueOnce(okJson({ token: 'fresh-token' })) // refresh token fetch
      .mockResolvedValueOnce(okJson({ success: true })); // retry protected request

    vi.stubGlobal('fetch', fetchMock);
    const { apiFetch, __resetCsrfCacheForTests } = await import('@/lib/api/fetch');
    __resetCsrfCacheForTests();

    const response = await apiFetch('/api/expertise/cv-import/wizard-suggest', {
      method: 'POST',
      body: JSON.stringify({ documents: [] }),
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/csrf-token?ts=');
    expect(String(fetchMock.mock.calls[2][0])).toContain('/api/csrf-token?ts=');

    const firstProtectedHeaders = new Headers(fetchMock.mock.calls[1][1]?.headers as HeadersInit);
    expect(firstProtectedHeaders.get('x-csrf-token')).toBe('stale-token');

    const retriedProtectedHeaders = new Headers(fetchMock.mock.calls[3][1]?.headers as HeadersInit);
    expect(retriedProtectedHeaders.get('x-csrf-token')).toBe('fresh-token');
  });

  it('does not retry indefinitely when CSRF mismatch persists after refresh', async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(okJson({ token: 'token-1' })) // initial token fetch
      .mockResolvedValueOnce(
        forbiddenJson({
          error: 'CSRF validation failed',
          message: 'Invalid or missing CSRF token',
        })
      ) // first protected request
      .mockResolvedValueOnce(okJson({ token: 'token-2' })) // refresh token fetch
      .mockResolvedValueOnce(
        forbiddenJson({
          error: 'CSRF validation failed',
          message: 'Invalid or missing CSRF token',
        })
      ); // retried protected request

    vi.stubGlobal('fetch', fetchMock);
    const { apiFetch, __resetCsrfCacheForTests } = await import('@/lib/api/fetch');
    __resetCsrfCacheForTests();

    const response = await apiFetch('/api/expertise/cv-import/wizard-suggest', {
      method: 'POST',
      body: JSON.stringify({ documents: [] }),
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
