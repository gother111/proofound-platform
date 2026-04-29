/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db-health-check', () => ({
  checkDatabaseHealth: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(),
}));

import { GET } from '@/app/api/health/route';
import { checkDatabaseHealth } from '@/lib/db-health-check';
import { getEnv } from '@/lib/env';

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
    expect(body.status).toBe('healthy');
    expect(body.version).toBeDefined();
    expect(body.database).toBeUndefined();
    expect(body.environment).toBeUndefined();
    expect(body.warnings).toBeUndefined();
    expect(body.error).toBeUndefined();
  });
});
