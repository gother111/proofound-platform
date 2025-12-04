import { describe, it, expect, vi, beforeEach } from 'vitest';

const okJson = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

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
    expect(fetchMock.mock.calls[0][0]).toContain('/api/csrf-token');
    const csrfInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect(csrfInit.credentials).toBe('include');

    // Second call should carry the header
    const secondCallInit = fetchMock.mock.calls[1][1] as RequestInit;
    const headers = new Headers(secondCallInit.headers as HeadersInit);
    expect(headers.get('x-csrf-token')).toBe('abc123');
    expect(secondCallInit.credentials).toBe('include');
  });
});

