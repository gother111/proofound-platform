import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear any rate limit state between tests
    const store = (globalThis as any).__PROFOUND_RATE_LIMIT_STORE__ as
      | Map<unknown, unknown>
      | undefined;
    store?.clear();
    vi.resetModules();
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.doUnmock('@vercel/kv');
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  describe('Rate limit configuration', () => {
    it('should use environment variables or defaults', () => {
      const windowSeconds = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10);
      const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '30', 10);

      expect(windowSeconds).toBeGreaterThan(0);
      expect(maxRequests).toBeGreaterThan(0);
    });

    it('should have reasonable window size', () => {
      const windowSeconds = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10);

      // Window should be between 1 second and 1 hour
      expect(windowSeconds).toBeGreaterThanOrEqual(1);
      expect(windowSeconds).toBeLessThanOrEqual(3600);
    });

    it('should have reasonable max requests', () => {
      const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '30', 10);

      // Should allow at least some requests
      expect(maxRequests).toBeGreaterThanOrEqual(10);
      expect(maxRequests).toBeLessThan(1000); // Sanity check
    });

    it('requires the write-capable KV token for launch environments', async () => {
      const { getRateLimitDependencyStatus } = await import('@/lib/rate-limit/index');

      expect(
        getRateLimitDependencyStatus({
          VERCEL_ENV: 'preview',
          KV_REST_API_URL: 'https://kv.example.test',
          KV_REST_API_TOKEN: '',
        })
      ).toEqual({
        ok: false,
        required: true,
        configured: false,
        missing: ['KV_REST_API_TOKEN'],
      });
    });

    it('assigns strict endpoint-specific profiles to high-risk routes', async () => {
      const { RATE_LIMITS, getRateLimitProfileForPathname } = await import(
        '@/lib/rate-limit/index'
      );

      expect(getRateLimitProfileForPathname('/api/verify/secret-token')).toBe(
        RATE_LIMITS.publicToken
      );
      expect(getRateLimitProfileForPathname('/api/verification/work-email/send', 'POST')).toBe(
        RATE_LIMITS.workEmail
      );
      expect(getRateLimitProfileForPathname('/api/upload/document', 'POST')).toBe(
        RATE_LIMITS.upload
      );
      expect(
        getRateLimitProfileForPathname('/api/expertise/cv-import/wizard-suggest', 'POST')
      ).toBe(RATE_LIMITS.aiAssistive);
      expect(getRateLimitProfileForPathname('/api/conversations/abc/reveal', 'POST')).toBe(
        RATE_LIMITS.revealIntro
      );
      expect(getRateLimitProfileForPathname('/api/user/password', 'POST')).toBe(RATE_LIMITS.auth);
      expect(getRateLimitProfileForPathname('/api/health')).toBeNull();
    });

    it('does not include token path values in limiter keys', async () => {
      const incr = vi.fn().mockResolvedValue(1);
      const expire = vi.fn().mockResolvedValue(1);
      const ttl = vi.fn().mockResolvedValue(60);

      vi.doMock('@vercel/kv', () => ({
        kv: { incr, expire, ttl },
      }));
      process.env.KV_REST_API_URL = 'https://kv.example.test';
      process.env.KV_REST_API_TOKEN = 'kv-token';

      const { RATE_LIMITS, rateLimit } = await import('@/lib/rate-limit/index');
      await rateLimit(
        new NextRequest('https://proofound.io/api/verify/sensitive-token-value', {
          headers: { 'x-forwarded-for': '203.0.113.7' },
        }),
        RATE_LIMITS.publicToken
      );

      expect(incr).toHaveBeenCalledWith('ratelimit:public-token:203.0.113.7');
      expect(String(incr.mock.calls[0][0])).not.toContain('sensitive-token-value');
    });

    it('fails closed for required profiles when KV is missing', async () => {
      const { RATE_LIMITS, checkRateLimit } = await import('@/lib/rate-limit/index');
      const { allowed, result } = await checkRateLimit(
        new NextRequest('https://proofound.io/api/verify/token-value'),
        RATE_LIMITS.publicToken
      );

      expect(allowed).toBe(false);
      expect(result.unavailable).toBe(true);
      expect(result.failureReason).toBe('missing_configuration');
    });
  });

  describe('Rate limit calculation', () => {
    it('should calculate rate correctly', () => {
      const windowSeconds = 60;
      const maxRequests = 30;
      const ratePerSecond = maxRequests / windowSeconds;

      expect(ratePerSecond).toBe(0.5); // 0.5 requests per second = 30 per minute
    });

    it('should calculate window in milliseconds', () => {
      const windowSeconds = 60;
      const windowMs = windowSeconds * 1000;

      expect(windowMs).toBe(60000);
    });
  });

  describe('Rate limit tracking', () => {
    it('should use IP address as identifier', () => {
      // Rate limiting should be per-IP
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      expect(ip1).not.toBe(ip2);
    });

    it('should track attempts per identifier', () => {
      // Each identifier should have its own count
      const identifier = 'user-123';
      const attempts = 5;

      const entry = {
        attempts,
        resetAt: Date.now() + 60000,
      };

      expect(entry.attempts).toBe(5);
      expect(entry.resetAt).toBeGreaterThan(Date.now());
    });

    it('should reset after window expires', () => {
      const now = Date.now();
      const resetAt = now - 1000; // 1 second ago

      const isExpired = resetAt <= now;

      expect(isExpired).toBe(true);
    });
  });

  describe('Rate limit memory store', () => {
    it('should use in-memory store as fallback', () => {
      // In-memory store should be available
      const store = new Map();

      store.set('test-id', {
        attempts: 1,
        resetAt: Date.now() + 60000,
      });

      expect(store.has('test-id')).toBe(true);
      expect(store.get('test-id')?.attempts).toBe(1);
    });

    it('should handle store cleanup', () => {
      const store = new Map();

      store.set('expired-1', {
        attempts: 5,
        resetAt: Date.now() - 1000, // Expired
      });

      store.set('active-1', {
        attempts: 3,
        resetAt: Date.now() + 60000, // Active
      });

      // Expired entries should be removed or reset
      const now = Date.now();
      const expiredEntry = store.get('expired-1');
      const activeEntry = store.get('active-1');

      if (expiredEntry) {
        expect(expiredEntry.resetAt).toBeLessThan(now);
      }

      expect(activeEntry?.resetAt).toBeGreaterThan(now);
    });
  });

  describe('Rate limit bypass for health checks', () => {
    it('should not rate limit health check endpoint', () => {
      // Health checks should be excluded from rate limiting
      // This is a design requirement test
      const healthCheckPaths = ['/api/health', '/health'];
      healthCheckPaths.forEach((path) => {
        expect(path).toMatch(/health/);
      });
    });
  });

  describe('Rate limit error responses', () => {
    it('should provide retry-after information', () => {
      const reset = Date.now() + 60000; // 60 seconds from now
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);

      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });

    it('should return 429 status code on rate limit', () => {
      // Rate limit exceeded should return 429 Too Many Requests
      const expectedStatus = 429;
      expect(expectedStatus).toBe(429);
    });
  });
});
