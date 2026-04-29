/** @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  getCronAuthStatus,
  getPrimaryServerOnlyInternalSecret,
  normalizeInternalSecret,
} from '@/lib/api/cron-auth';

function requestWithBearer(token: string) {
  return new Request('https://example.com/api/cron/decision-reminders', {
    headers: { authorization: `Bearer ${token}` },
  });
}

describe('cron/internal auth helper', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(['', '   ', 'undefined', 'null', 'too-short'])(
    'rejects invalid configured secret value %j',
    (value) => {
      expect(normalizeInternalSecret(value)).toBeNull();
    }
  );

  it('does not use NEXT_PUBLIC_CRON_SECRET as an internal secret', () => {
    vi.stubEnv('CRON_SECRET', '');
    vi.stubEnv('INTERNAL_API_SECRET', '');
    vi.stubEnv('NEXT_PUBLIC_CRON_SECRET', 'public-cron-secret-value');

    expect(getCronAuthStatus(requestWithBearer('public-cron-secret-value'))).toBe('misconfigured');
  });

  it('accepts only a matching server-only bearer token', () => {
    vi.stubEnv('CRON_SECRET', 'server-only-cron-secret');
    vi.stubEnv('INTERNAL_API_SECRET', '');

    expect(getCronAuthStatus(requestWithBearer('wrong-secret-value'))).toBe('unauthorized');
    expect(getCronAuthStatus(requestWithBearer('undefined'))).toBe('unauthorized');
    expect(getCronAuthStatus(requestWithBearer('null'))).toBe('unauthorized');
    expect(getCronAuthStatus(requestWithBearer('server-only-cron-secret'))).toBe('authorized');
  });

  it('prefers INTERNAL_API_SECRET for internal worker forwarding', () => {
    vi.stubEnv('INTERNAL_API_SECRET', 'internal-api-secret-value');
    vi.stubEnv('CRON_SECRET', 'server-only-cron-secret');

    expect(getPrimaryServerOnlyInternalSecret()).toBe('internal-api-secret-value');
  });

  it('keeps cron route handlers off direct env-secret comparisons', () => {
    const cronRouteFiles = [
      'src/app/api/cron/decision-reminders/route.ts',
      'src/app/api/cron/health-check/route.ts',
      'src/app/api/cron/launch-synthetic-checks/route.ts',
      'src/app/api/cron/performance-check/route.ts',
      'src/app/api/cron/refresh-matches/route.ts',
      'src/app/api/cron/refresh-matches-worker/route.ts',
      'src/app/api/cron/sla-enforcement/route.ts',
    ];

    for (const file of cronRouteFiles) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8');

      expect(source).not.toContain('process.env.CRON_SECRET');
      expect(source).not.toContain('NEXT_PUBLIC_CRON_SECRET');
      expect(source).toMatch(/requireInternal(?:Ops|Api)Request/);
    }
  });
});
