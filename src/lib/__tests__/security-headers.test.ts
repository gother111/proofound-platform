import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware } from '@/middleware';

function cspDirective(csp: string, directive: string): string {
  return (
    csp
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${directive} `)) ?? ''
  );
}

async function getMiddlewareResponse(url: string) {
  return middleware(new NextRequest(url, { method: 'GET' }));
}

describe('security headers middleware', () => {
  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_READ_ONLY_TOKEN;
    delete process.env.PROOFOUND_ENABLE_HSTS;
    delete process.env.ENABLE_HSTS;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends HSTS in production responses when explicitly enabled', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('PROOFOUND_ENABLE_HSTS', 'true');

    const response = await getMiddlewareResponse('https://preview.proofound.test/app/i/home');

    expect(response.status).toBe(200);
    expect(response.headers.get('Strict-Transport-Security')).toBe(
      'max-age=63072000; includeSubDomains; preload'
    );
  });

  it('does not infer HSTS from hostname when disabled by config', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('PROOFOUND_ENABLE_HSTS', 'false');

    const response = await getMiddlewareResponse('https://proofound.io/app/i/home');

    expect(response.status).toBe(200);
    expect(response.headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('sets a production CSP without broad script, default, or frame origins', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');

    const response = await getMiddlewareResponse('https://proofound.io/app/i/home');
    const csp = response.headers.get('Content-Security-Policy');

    expect(csp).toBeTruthy();
    expect(cspDirective(csp ?? '', 'default-src')).toBe("default-src 'self'");
    expect(cspDirective(csp ?? '', 'script-src').split(/\s+/)).not.toContain('https:');
    expect(cspDirective(csp ?? '', 'frame-src')).toBe("frame-src 'self'");
    expect(cspDirective(csp ?? '', 'frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(csp).not.toContain('frame-ancestors *');
  });

  it('keeps archived public embed routes from loosening frame policy', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');

    const response = await getMiddlewareResponse('https://proofound.io/p/token-value/embed');
    const csp = response.headers.get('Content-Security-Policy');

    expect(response.status).toBe(404);
    expect(cspDirective(csp ?? '', 'frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(csp).not.toContain('frame-ancestors *');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('keeps baseline headers on key MVP routes', async () => {
    const routes = [
      'https://proofound.io/app/i/home',
      'https://proofound.io/app/o/acme/matching',
      'https://proofound.io/portfolio/alex',
      'https://proofound.io/verify/token-1',
      'https://proofound.io/api/health',
    ];

    for (const route of routes) {
      const response = await getMiddlewareResponse(route);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('Permissions-Policy')).toContain('camera=()');
    }
  });
});
