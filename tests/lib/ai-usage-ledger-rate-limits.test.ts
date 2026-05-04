// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mocks.execute(...args),
  },
}));

import { enforceAiDailyRateLimits } from '@/lib/ai/usage-ledger';

const originalEnv = { ...process.env };

function countResult(count: number) {
  return [{ count }];
}

describe('AI usage ledger daily rate limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AI_GLOBAL_DAILY_LIMIT = '250';
    process.env.AI_USER_DAILY_LIMIT = '20';
    process.env.AI_ORG_DAILY_LIMIT = '50';
    process.env.AI_TEST_FEATURE_DAILY_LIMIT = '3';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('enforces the per-user daily limit', async () => {
    mocks.execute.mockResolvedValueOnce(countResult(20));

    await expect(
      enforceAiDailyRateLimits({
        userId: '00000000-0000-0000-0000-000000000001',
        orgId: '00000000-0000-0000-0000-000000000002',
        feature: 'test_feature',
      })
    ).resolves.toEqual({
      ok: false,
      scope: 'user',
      limit: 20,
      count: 20,
    });
  });

  it('enforces the per-organization daily limit', async () => {
    mocks.execute.mockResolvedValueOnce(countResult(19)).mockResolvedValueOnce(countResult(50));

    await expect(
      enforceAiDailyRateLimits({
        userId: '00000000-0000-0000-0000-000000000001',
        orgId: '00000000-0000-0000-0000-000000000002',
        feature: 'test_feature',
      })
    ).resolves.toEqual({
      ok: false,
      scope: 'organization',
      limit: 50,
      count: 50,
    });
  });

  it('enforces configurable per-feature daily limits', async () => {
    mocks.execute
      .mockResolvedValueOnce(countResult(19))
      .mockResolvedValueOnce(countResult(49))
      .mockResolvedValueOnce(countResult(3));

    await expect(
      enforceAiDailyRateLimits({
        userId: '00000000-0000-0000-0000-000000000001',
        orgId: '00000000-0000-0000-0000-000000000002',
        feature: 'test_feature',
      })
    ).resolves.toEqual({
      ok: false,
      scope: 'feature',
      limit: 3,
      count: 3,
    });
  });

  it('enforces the global daily limit', async () => {
    mocks.execute
      .mockResolvedValueOnce(countResult(19))
      .mockResolvedValueOnce(countResult(49))
      .mockResolvedValueOnce(countResult(2))
      .mockResolvedValueOnce(countResult(250));

    await expect(
      enforceAiDailyRateLimits({
        userId: '00000000-0000-0000-0000-000000000001',
        orgId: '00000000-0000-0000-0000-000000000002',
        feature: 'test_feature',
      })
    ).resolves.toEqual({
      ok: false,
      scope: 'global',
      limit: 250,
      count: 250,
    });
  });
});
