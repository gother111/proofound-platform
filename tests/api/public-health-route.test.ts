/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db-health-check', () => ({
  checkDatabaseHealth: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(),
  isMockSupabaseEnabled: vi.fn(() => false),
}));

import { GET } from '@/app/api/health/route';
import { checkDatabaseHealth } from '@/lib/db-health-check';
import { getEnv } from '@/lib/env';

const FORBIDDEN_PUBLIC_HEALTH_KEYS = [
  'database',
  'environment',
  'warnings',
  'version',
  'commit',
  'commitSha',
  'usingMockDb',
  'mockDatabaseModes',
  'deployment',
  'env',
] as const;

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnv).mockReturnValue({
      SUPABASE_URL: 'https://supabase.example',
      SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-present',
      DATABASE_URL: 'postgres://example',
      SITE_URL: 'https://proofound.io',
    } as any);
    vi.mocked(checkDatabaseHealth).mockResolvedValue(true);
  });

  it('returns public liveness without internal diagnostics', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toEqual(expect.any(String));
    expect(Object.keys(body).sort()).toEqual(['status', 'timestamp']);
    for (const key of FORBIDDEN_PUBLIC_HEALTH_KEYS) {
      expect(JSON.stringify(body)).not.toContain(key);
    }
    expect(body.error).toBeUndefined();
  });

  it('returns a minimal degraded status without leaking why readiness failed', async () => {
    vi.mocked(checkDatabaseHealth).mockResolvedValue(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: 'degraded',
      timestamp: expect.any(String),
    });
    for (const key of FORBIDDEN_PUBLIC_HEALTH_KEYS) {
      expect(JSON.stringify(body)).not.toContain(key);
    }
  });
});
