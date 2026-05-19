import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockExecute = vi.fn();
const mockLogInfo = vi.fn();
const mockLogError = vi.fn();

vi.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mockLogInfo,
    error: mockLogError,
  },
}));

describe('calculateFairnessGaps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a degraded report instead of failing when demographic opt-in fields are absent', async () => {
    mockExecute
      .mockResolvedValueOnce([
        {
          total_matches: '12',
          total_introductions: '4',
          total_interviews: '2',
          total_contracts: '1',
        },
      ])
      .mockResolvedValueOnce([]);

    const { calculateFairnessGaps } = await import(
      '@/archive/non_launch_admin_ui/lib/analytics/fairness'
    );
    const report = await calculateFairnessGaps('release-1');

    expect(report.overallMetrics).toEqual({
      totalMatches: 12,
      totalIntroductions: 4,
      totalInterviews: 2,
      totalContracts: 1,
    });
    expect(report.segments).toEqual([]);
    expect(report.summary).toContain('Demographic fairness analysis is unavailable');
    expect(report.recommendations[0]).toContain('demographic_opt_ins');
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });
});
