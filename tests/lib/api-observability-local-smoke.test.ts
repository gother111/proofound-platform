import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const insertValuesMock = vi.fn(async () => undefined);
const logWarnMock = vi.fn();
const logErrorMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: insertValuesMock,
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(async () => []),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/log', () => ({
  logContext: {
    run: (_ctx: unknown, fn: () => unknown) => fn(),
  },
  log: {
    warn: logWarnMock,
    error: logErrorMock,
  },
}));

vi.mock('@sentry/nextjs', () => ({
  withScope: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe('API observability local smoke behavior', () => {
  const envBackup = { ...process.env };

  function clearLocalSmokeEnv() {
    vi.stubEnv('PLAYWRIGHT', '');
    vi.stubEnv('PLAYWRIGHT_SERVER_MODE', '');
    vi.stubEnv('PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK', '');
    vi.stubEnv('PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE', '');
    vi.stubEnv('VERCEL', '');
    vi.stubEnv('VERCEL_ENV', '');
  }

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...envBackup };
    clearLocalSmokeEnv();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    process.env = { ...envBackup };
  });

  it('does not persist API performance samples during local Playwright smoke runs', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PLAYWRIGHT_SERVER_MODE', 'prod');
    const { withPerformanceMonitoring } = await import('@/lib/performance/api-monitor');

    await withPerformanceMonitoring(
      new NextRequest('http://localhost/api/assignments'),
      '/api/assignments',
      async () => NextResponse.json({ ok: true })
    );

    await Promise.resolve();

    expect(insertValuesMock).not.toHaveBeenCalled();
  });

  it('keeps local smoke latency above production SLA out of api.slow logs', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PLAYWRIGHT_SERVER_MODE', 'prod');
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(6000)
      .mockReturnValueOnce(6000);
    const { withApiObservability } = await import('@/lib/api/observability');

    await withApiObservability(
      new NextRequest('http://localhost/api/assignments'),
      '/api/assignments',
      async () => NextResponse.json({ ok: true })
    );

    expect(logWarnMock).not.toHaveBeenCalledWith(
      'api.slow',
      expect.objectContaining({ route: '/api/assignments' })
    );
  });

  it('keeps production-like non-smoke requests on the 1.5s slow threshold', async () => {
    clearLocalSmokeEnv();
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(1600);
    const { withApiObservability } = await import('@/lib/api/observability');

    await withApiObservability(
      new NextRequest('https://proofound.test/api/assignments'),
      '/api/assignments',
      async () => NextResponse.json({ ok: true })
    );

    expect(logWarnMock).toHaveBeenCalledWith(
      'api.slow',
      expect.objectContaining({
        route: '/api/assignments',
        durationMs: 1600,
      })
    );
  });
});
