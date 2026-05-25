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

function cspTokens(csp: string, directive: string): string[] {
  return cspDirective(csp, directive).split(/\s+/).filter(Boolean);
}

function expectProductionScriptCsp(csp: string | null) {
  const scriptSrc = cspTokens(csp ?? '', 'script-src');

  expect(csp).toBeTruthy();
  expect(scriptSrc[0]).toBe('script-src');
  expect(scriptSrc).toContain("'self'");
  expect(scriptSrc).toContain("'strict-dynamic'");
  expect(scriptSrc.some((token) => /^'nonce-[A-Za-z0-9+/]+=*'$/.test(token))).toBe(true);
  expect(scriptSrc).not.toContain("'unsafe-inline'");
  expect(scriptSrc).not.toContain('https:');
  expect(scriptSrc.filter((token) => token.startsWith('https://'))).toEqual([]);
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

  it('sets a nonce-based production CSP without inline or broad script origins', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project-ref.supabase.co');

    const response = await getMiddlewareResponse('https://proofound.io/app/i/home');
    const csp = response.headers.get('Content-Security-Policy');

    expectProductionScriptCsp(csp);
    expect(cspDirective(csp ?? '', 'default-src')).toBe("default-src 'self'");
    expect(cspDirective(csp ?? '', 'style-src')).toBe(
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
    );
    expect(cspDirective(csp ?? '', 'img-src')).toBe(
      "img-src 'self' data: blob: https://project-ref.supabase.co https://*.supabase.co https://images.unsplash.com"
    );
    expect(cspDirective(csp ?? '', 'font-src')).toBe(
      "font-src 'self' data: https://fonts.gstatic.com"
    );
    expect(cspDirective(csp ?? '', 'connect-src')).toBe(
      "connect-src 'self' https://project-ref.supabase.co https://*.supabase.co wss://*.supabase.co"
    );
    expect(csp).not.toContain('img-src https:');
    expect(csp).not.toContain('connect-src https:');
    expect(csp).not.toContain('font-src https:');
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

  it('keeps nonce-based CSP headers on key MVP page routes', async () => {
    const routes = [
      'https://proofound.io/',
      'https://proofound.io/app/i/home',
      'https://proofound.io/app/i/messages',
      'https://proofound.io/app/o/acme/assignments/assignment-1/review',
      'https://proofound.io/app/o/acme/matching',
      'https://proofound.io/portfolio/alex',
      'https://proofound.io/verify/token-1',
    ];

    for (const route of routes) {
      vi.stubEnv('VERCEL_ENV', 'production');
      const response = await getMiddlewareResponse(route);

      expect(response.status).toBe(200);
      expectProductionScriptCsp(response.headers.get('Content-Security-Policy'));
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('Permissions-Policy')).toContain('camera=()');
    }
  });

  it('keeps baseline headers on API routes without allowing inline scripts', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');

    const response = await getMiddlewareResponse('https://proofound.io/api/health');
    const csp = response.headers.get('Content-Security-Policy');
    const scriptSrc = cspTokens(csp ?? '', 'script-src');

    expect(response.status).toBe(200);
    expect(csp).toBeTruthy();
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain('https:');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
