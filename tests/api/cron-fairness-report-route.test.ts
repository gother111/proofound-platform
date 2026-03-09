import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  returning: vi.fn(),
  values: vi.fn(),
  insert: vi.fn(),
  calculateFairnessGaps: vi.fn(),
  generateFairnessMarkdown: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      fairnessReports: {
        findFirst: (...args: unknown[]) => mocks.findFirst(...args),
      },
    },
    insert: (...args: unknown[]) => mocks.insert(...args),
  },
}));

vi.mock('@/lib/analytics/fairness', () => ({
  calculateFairnessGaps: (...args: unknown[]) => mocks.calculateFairnessGaps(...args),
}));

vi.mock('@/lib/reports/fairness-note', () => ({
  generateFairnessMarkdown: (...args: unknown[]) => mocks.generateFairnessMarkdown(...args),
  generateFairnessSummary: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    warn: mocks.logWarn,
    error: mocks.logError,
  },
}));

import { GET } from '@/app/api/cron/fairness-report/route';

describe('GET /api/cron/fairness-report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    process.env.VERCEL_GIT_COMMIT_REF = 'master';

    mocks.findFirst.mockResolvedValue(null);
    mocks.returning.mockResolvedValue([{ id: 'report-1' }]);
    mocks.values.mockReturnValue({ returning: mocks.returning });
    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.generateFairnessMarkdown.mockReturnValue('# Fairness report');
    mocks.calculateFairnessGaps.mockResolvedValue({
      releaseVersion: 'master',
      generatedAt: new Date('2026-03-06T12:00:00.000Z'),
      overallMetrics: {
        totalMatches: 4,
        totalIntroductions: 2,
        totalInterviews: 1,
        totalContracts: 0,
      },
      segments: [],
      summary:
        'Demographic fairness analysis is unavailable for the current production schema because demographic_opt_ins does not yet include age, gender, location, or ethnicity columns. Overall matching metrics were recorded successfully.',
      recommendations: [
        'Add demographic segment columns to demographic_opt_ins before re-enabling demographic fairness segmentation.',
      ],
    });
  });

  it('stores a degraded but successful report when demographic columns are unavailable', async () => {
    const response = await GET(
      new NextRequest('https://example.com/api/cron/fairness-report', {
        headers: { authorization: 'Bearer cron-secret' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.significantGaps).toBe(0);
    expect(body.summary).toContain('Demographic fairness analysis is unavailable');
    expect(mocks.calculateFairnessGaps).toHaveBeenCalledWith('master');
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it('rejects unauthorized requests', async () => {
    const response = await GET(
      new NextRequest('https://example.com/api/cron/fairness-report', {
        headers: { authorization: 'Bearer wrong-secret' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(mocks.calculateFairnessGaps).not.toHaveBeenCalled();
  });
});
