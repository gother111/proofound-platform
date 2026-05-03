import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

async function loadMiddleware() {
  return import('@/middleware');
}

async function expectFailClosedApiResponse(response: Response, requestId: string) {
  const body = await response.json();

  expect(response.status).toBe(500);
  expect(response.headers.get('x-middleware-next')).toBeNull();
  expect(response.headers.get('x-request-id')).toBe(requestId);
  expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
  expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  expect(body).toEqual({
    error: 'Internal server error',
    message: 'Request failed',
    requestId,
  });
}

describe('middleware fail-closed behavior', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock('@/lib/launch/surface-policy');
    vi.doUnmock('@/lib/csrf');
    vi.doUnmock('@/lib/rate-limit/index');
  });

  afterEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_READ_ONLY_TOKEN;
    delete process.env.VERCEL_ENV;
    vi.resetModules();
    vi.restoreAllMocks();
    vi.doUnmock('@/lib/launch/surface-policy');
    vi.doUnmock('@/lib/csrf');
    vi.doUnmock('@/lib/rate-limit/index');
  });

  it('returns a safe JSON 500 instead of passing through when API policy lookup throws', async () => {
    vi.doMock('@/lib/launch/surface-policy', async () => {
      const actual = await vi.importActual<typeof import('@/lib/launch/surface-policy')>(
        '@/lib/launch/surface-policy'
      );

      return {
        ...actual,
        getArchivedApiPolicy: vi.fn(() => {
          throw new Error('policy lookup unavailable');
        }),
      };
    });

    const { middleware } = await loadMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost/api/contracts', {
        method: 'GET',
        headers: {
          'x-request-id': 'req-policy-failure',
        },
      })
    );

    await expectFailClosedApiResponse(response, 'req-policy-failure');
  });

  it('keeps archived APIs at 410 before downstream rate-limit failures can run', async () => {
    process.env.KV_REST_API_URL = 'https://kv.example.test';
    process.env.KV_REST_API_TOKEN = 'kv-token';

    const checkRateLimit = vi.fn(() => {
      throw new Error('rate limiter unavailable');
    });

    vi.doMock('@/lib/rate-limit/index', async () => {
      const actual =
        await vi.importActual<typeof import('@/lib/rate-limit/index')>('@/lib/rate-limit/index');

      return {
        ...actual,
        checkRateLimit,
      };
    });

    const { middleware } = await loadMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost/api/contracts/example', {
        method: 'POST',
        headers: {
          'x-request-id': 'req-archived-rate-limit',
        },
      })
    );
    const body = await response.json();

    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(response.status).toBe(410);
    expect(response.headers.get('x-request-id')).toBe('req-archived-rate-limit');
    expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
    expect(body.launchState).toBe('non_launch');
  });

  it('fails closed for active API routes when rate-limit code throws', async () => {
    process.env.KV_REST_API_URL = 'https://kv.example.test';
    process.env.KV_REST_API_TOKEN = 'kv-token';

    vi.doMock('@/lib/rate-limit/index', async () => {
      const actual =
        await vi.importActual<typeof import('@/lib/rate-limit/index')>('@/lib/rate-limit/index');

      return {
        ...actual,
        checkRateLimit: vi.fn(() => {
          throw new Error('rate limiter unavailable');
        }),
      };
    });

    const { middleware } = await loadMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost/api/conversations', {
        method: 'POST',
        headers: {
          'x-request-id': 'req-rate-limit-failure',
        },
      })
    );

    await expectFailClosedApiResponse(response, 'req-rate-limit-failure');
  });

  it('returns 429 with safe retry metadata when an endpoint profile is exhausted', async () => {
    process.env.KV_REST_API_URL = 'https://kv.example.test';
    process.env.KV_REST_API_TOKEN = 'kv-token';

    vi.doMock('@/lib/rate-limit/index', async () => {
      const actual =
        await vi.importActual<typeof import('@/lib/rate-limit/index')>('@/lib/rate-limit/index');

      return {
        ...actual,
        checkRateLimit: vi.fn(() => ({
          allowed: false,
          result: {
            success: false,
            limit: 5,
            remaining: 0,
            reset: Date.now() + 30_000,
          },
        })),
      };
    });

    const { middleware } = await loadMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost/api/verification/work-email/send', {
        method: 'POST',
        headers: {
          'x-request-id': 'req-rate-limited',
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toMatch(/^\d+$/);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('x-request-id')).toBe('req-rate-limited');
    expect(body).toEqual({
      error: 'Too many requests',
      message: 'Please slow down and try again shortly.',
      retryAfter: expect.any(Number),
    });
  });

  it('degrades high-risk public token routes when the limiter dependency is missing', async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost/api/verify/sensitive-token-value', {
        method: 'GET',
        headers: {
          'x-request-id': 'req-missing-rate-limit',
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toMatch(/^\d+$/);
    expect(response.headers.get('x-request-id')).toBe('req-missing-rate-limit');
    expect(JSON.stringify(body)).not.toContain('sensitive-token-value');
    expect(body).toEqual({
      error: 'Service temporarily unavailable',
      message: 'Request protection is temporarily unavailable. Please try again shortly.',
      retryAfter: expect.any(Number),
    });
  });

  it('keeps local assistive AI routes behind CSRF instead of missing-KV 503s', async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost/api/ai/privacy-preflight/check', {
        method: 'POST',
        headers: {
          'x-request-id': 'req-local-ai-rate-limit-fallback',
          Cookie: 'sb-localhost-auth-token=session-value',
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get('x-request-id')).toBe('req-local-ai-rate-limit-fallback');
    expect(body.error).toBe('CSRF validation failed');
  });

  it('still degrades assistive AI routes when launch env is missing the limiter dependency', async () => {
    process.env.VERCEL_ENV = 'preview';

    const { middleware } = await loadMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost/api/ai/privacy-preflight/check', {
        method: 'POST',
        headers: {
          'x-request-id': 'req-launch-ai-missing-rate-limit',
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toMatch(/^\d+$/);
    expect(response.headers.get('x-request-id')).toBe('req-launch-ai-missing-rate-limit');
    expect(body).toEqual({
      error: 'Service temporarily unavailable',
      message: 'Request protection is temporarily unavailable. Please try again shortly.',
      retryAfter: expect.any(Number),
    });
  });

  it('does not block static assets when rate limiting is unavailable', async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost/proofound-logo.png', {
        method: 'GET',
        headers: {
          'x-request-id': 'req-static-asset',
        },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('x-request-id')).toBe('req-static-asset');
  });

  it('fails closed for mutating API routes when CSRF enforcement code throws', async () => {
    vi.doMock('@/lib/csrf', async () => {
      const actual = await vi.importActual<typeof import('@/lib/csrf')>('@/lib/csrf');

      return {
        ...actual,
        csrfProtection: vi.fn(() => {
          throw new Error('csrf guard unavailable');
        }),
      };
    });

    const { middleware } = await loadMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost/api/conversations', {
        method: 'POST',
        headers: {
          'x-request-id': 'req-csrf-failure',
          Cookie: 'sb-localhost-auth-token=session-value',
        },
      })
    );

    await expectFailClosedApiResponse(response, 'req-csrf-failure');
  });

  it('keeps normal CSRF rejections fail-closed with request ID and security headers', async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost/api/conversations', {
        method: 'POST',
        headers: {
          'x-request-id': 'req-csrf-rejected',
          Cookie: 'sb-localhost-auth-token=session-value',
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get('x-middleware-next')).toBeNull();
    expect(response.headers.get('x-request-id')).toBe('req-csrf-rejected');
    expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(body).toEqual({
      error: 'CSRF validation failed',
      message: 'Request blocked',
    });
  });

  it('does not fail closed for static asset middleware errors', async () => {
    vi.doMock('@/lib/launch/surface-policy', async () => {
      const actual = await vi.importActual<typeof import('@/lib/launch/surface-policy')>(
        '@/lib/launch/surface-policy'
      );

      return {
        ...actual,
        getArchivedPagePolicy: vi.fn(() => {
          throw new Error('page policy unavailable');
        }),
      };
    });

    const { middleware } = await loadMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost/assets/app.css', {
        method: 'GET',
        headers: {
          'x-request-id': 'req-static-error',
        },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('x-request-id')).toBe('req-static-error');
  });
});
