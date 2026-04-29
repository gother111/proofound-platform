/** @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db-health-check', () => ({
  getDatabaseStatus: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  getEnabledMockDatabaseModes: vi.fn(),
  getEnv: vi.fn(),
}));

import { GET } from '@/app/api/monitoring/health-diagnostics/route';
import { getDatabaseStatus } from '@/lib/db-health-check';
import { getEnabledMockDatabaseModes, getEnv } from '@/lib/env';

const INTERNAL_SECRET = 'internal-health-diagnostics-secret';

function diagnosticsRequest(headers: HeadersInit = {}) {
  return new Request('https://example.com/api/monitoring/health-diagnostics', {
    headers,
  });
}

describe('GET /api/monitoring/health-diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', INTERNAL_SECRET);
    vi.stubEnv('INTERNAL_API_SECRET', '');
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'abc123');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.mocked(getDatabaseStatus).mockResolvedValue({
      healthy: true,
      connected: true,
      usingMockDb: false,
      timestamp: '2026-04-29T10:00:00.000Z',
    });
    vi.mocked(getEnabledMockDatabaseModes).mockReturnValue([]);
    vi.mocked(getEnv).mockReturnValue({
      SUPABASE_URL: 'https://supabase.example',
      SUPABASE_ANON_KEY: 'anon-present',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-present',
      DATABASE_URL: 'postgres://example',
      SITE_URL: 'https://proofound.io',
    } as any);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects unauthenticated internal diagnostics requests', async () => {
    const response = await GET(diagnosticsRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(getDatabaseStatus).not.toHaveBeenCalled();
  });

  it('returns detailed diagnostics with valid internal auth', async () => {
    const response = await GET(
      diagnosticsRequest({
        authorization: `Bearer ${INTERNAL_SECRET}`,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        ok: true,
        status: 'ok',
        timestamp: expect.any(String),
        warnings: [],
        mockDatabaseModes: [],
      })
    );
    expect(body.database).toEqual(
      expect.objectContaining({
        connected: true,
        usingMockDb: false,
      })
    );
    expect(body.environment.required).toEqual({
      supabaseUrl: true,
      supabaseAnonKey: true,
      databaseUrl: true,
      siteUrl: true,
    });
    expect(body.deployment).toEqual(
      expect.objectContaining({
        commitSha: 'abc123',
        vercelEnv: 'production',
      })
    );
  });
});
