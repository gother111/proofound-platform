import { describe, expect, it, vi } from 'vitest';

import {
  checkDeploymentQuota,
  evaluateDeploymentQuota,
} from '../../scripts/lib/vercel-deploy-quota-check.mjs';

const NOW = Date.parse('2026-06-13T12:00:00.000Z');

function deployment(createdAt: number | string) {
  return { createdAt };
}

describe('vercel deploy quota check', () => {
  it('allows deploys when fewer than the daily limit are returned', () => {
    const result = evaluateDeploymentQuota([deployment(NOW - 60_000), deployment(NOW - 120_000)], {
      dailyLimit: 3,
      now: NOW,
    });

    expect(result).toMatchObject({
      available: true,
      reason: 'under-daily-limit',
      count: 2,
    });
  });

  it('blocks deploy attempts when the whole returned daily window is full', () => {
    const result = evaluateDeploymentQuota(
      [deployment(NOW - 60_000), deployment(NOW - 120_000), deployment(NOW - 180_000)],
      {
        dailyLimit: 3,
        now: NOW,
      }
    );

    expect(result).toMatchObject({
      available: false,
      reason: 'daily-limit-window-exhausted',
      count: 3,
    });
  });

  it('allows deploy attempts once the oldest tracked deployment is outside the quota window', () => {
    const result = evaluateDeploymentQuota(
      [deployment(NOW - 60_000), deployment(NOW - 120_000), deployment(NOW - 25 * 60 * 60 * 1000)],
      {
        dailyLimit: 3,
        now: NOW,
      }
    );

    expect(result).toMatchObject({
      available: true,
      reason: 'daily-limit-window-has-capacity',
      count: 3,
    });
  });

  it('queries Vercel deployments with the configured project id', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        deployments: [
          deployment('2026-06-13T11:59:00.000Z'),
          deployment('2026-06-13T11:58:00.000Z'),
        ],
      }),
    });

    const result = await checkDeploymentQuota({
      now: NOW,
      fetchImpl,
      env: {
        VERCEL_TOKEN: 'token',
        VERCEL_PROJECT_ID: 'project_123',
        VERCEL_DEPLOYMENT_DAILY_LIMIT: '3',
      },
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.vercel.com/v6/deployments?projectId=project_123&limit=3',
      {
        headers: {
          Authorization: 'Bearer token',
        },
      }
    );
    expect(result.available).toBe(true);
  });
});
