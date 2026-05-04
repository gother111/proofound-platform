import { describe, expect, it, vi } from 'vitest';

import {
  GCP_CV_OCR_SAFE_STATUSES,
  resolveGcpCvOcrSafeStatus,
} from '@/lib/expertise/gcp-cv-ocr-status';

const NOW = new Date('2026-05-03T12:00:00.000Z');
const FUTURE = '2026-05-04T12:00:00.000Z';

function enabledEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    GCP_CV_OCR_ENABLED: 'true',
    GCP_CV_OCR_EXPIRES_AT: FUTURE,
    GCP_CV_OCR_BASE_URL: 'https://gcp-cv-ocr.example/run',
    GCP_CV_OCR_AUTH_MODE: 'hmac',
    GCP_CV_OCR_SHARED_SECRET: 'test-secret',
    GCP_CV_OCR_PROJECT_ID: 'hidden-project',
    GCP_CV_OCR_DOCUMENT_AI_PROCESSOR_ID: 'hidden-processor',
    ...overrides,
  };
}

function enabledOidcEnv(overrides: Record<string, string | undefined> = {}) {
  return enabledEnv({
    GCP_CV_OCR_AUTH_MODE: 'oidc',
    GCP_CV_OCR_SHARED_SECRET: '',
    GCP_CV_OCR_OIDC_PROJECT_NUMBER: '617801124609',
    GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_POOL_ID: 'vercel',
    GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_PROVIDER_ID: 'vercel',
    GCP_CV_OCR_OIDC_SERVICE_ACCOUNT_EMAIL:
      'vercel-cv-ocr-invoker@pf-cv-ocr-20260503.iam.gserviceaccount.com',
    ...overrides,
  });
}

describe('GCP CV OCR safe status', () => {
  it('reports disabled without probing the provider', async () => {
    const fetchSpy = vi.fn();

    await expect(
      resolveGcpCvOcrSafeStatus({
        env: { GCP_CV_OCR_ENABLED: 'false' },
        now: NOW,
        probeProvider: true,
        fetchImpl: fetchSpy as typeof fetch,
      })
    ).resolves.toEqual({ status: 'disabled' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('reports expired without probing the provider', async () => {
    const fetchSpy = vi.fn();

    await expect(
      resolveGcpCvOcrSafeStatus({
        env: enabledEnv({ GCP_CV_OCR_EXPIRES_AT: '2026-05-02T12:00:00.000Z' }),
        now: NOW,
        probeProvider: true,
        fetchImpl: fetchSpy as typeof fetch,
      })
    ).resolves.toEqual({ status: 'expired' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('reports fallback for enabled but incomplete config', async () => {
    await expect(
      resolveGcpCvOcrSafeStatus({
        env: enabledEnv({ GCP_CV_OCR_SHARED_SECRET: '' }),
        now: NOW,
        probeProvider: true,
      })
    ).resolves.toEqual({ status: 'fallback' });
  });

  it('reports configured when provider probing is disabled', async () => {
    await expect(
      resolveGcpCvOcrSafeStatus({
        env: enabledEnv(),
        now: NOW,
        probeProvider: false,
      })
    ).resolves.toEqual({ status: 'configured' });
  });

  it('reports provider reachable only from the safe health response', async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: 'ok', processorId: 'hidden-processor' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
    );

    const result = await resolveGcpCvOcrSafeStatus({
      env: enabledEnv(),
      now: NOW,
      probeProvider: true,
      fetchImpl: fetchSpy as typeof fetch,
    });

    expect(result).toEqual({ status: 'provider reachable' });
    expect(GCP_CV_OCR_SAFE_STATUSES).toContain(result.status);
    expect(JSON.stringify(result)).not.toMatch(/secret|processor|project|text|gcp-cv-ocr/i);
    expect(fetchSpy).toHaveBeenCalledWith('https://gcp-cv-ocr.example/health', {
      method: 'GET',
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    });
  });

  it('uses OIDC bearer auth for provider health when configured', async () => {
    const fetchSpy = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const target = String(url);
      if (target === 'https://sts.googleapis.com/v1/token') {
        return new Response(JSON.stringify({ access_token: 'google-access-token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (target.includes(':generateIdToken')) {
        return new Response(JSON.stringify({ token: 'cloud-run-id-token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      expect(target).toBe('https://gcp-cv-ocr.example/health');
      expect(init?.headers).toEqual({
        authorization: 'Bearer cloud-run-id-token',
      });
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    await expect(
      resolveGcpCvOcrSafeStatus({
        env: enabledOidcEnv(),
        now: NOW,
        probeProvider: true,
        fetchImpl: fetchSpy as typeof fetch,
        vercelOidcTokenFactory: () => 'vercel-oidc-token',
      })
    ).resolves.toEqual({ status: 'provider reachable' });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('reports fallback when the provider health check fails', async () => {
    const fetchSpy = vi.fn(
      async () => new Response(JSON.stringify({ status: 'error' }), { status: 503 })
    );

    await expect(
      resolveGcpCvOcrSafeStatus({
        env: enabledEnv(),
        now: NOW,
        probeProvider: true,
        fetchImpl: fetchSpy as typeof fetch,
      })
    ).resolves.toEqual({ status: 'fallback' });
  });
});
