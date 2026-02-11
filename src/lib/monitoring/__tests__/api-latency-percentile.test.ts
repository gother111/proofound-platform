import { describe, expect, it } from 'vitest';
import { calculatePercentile } from '@/lib/monitoring/api-latency';

describe('calculatePercentile', () => {
  it('returns 0 for empty arrays', () => {
    expect(calculatePercentile([], 95)).toBe(0);
  });

  it('returns the only value for single-item arrays', () => {
    expect(calculatePercentile([420], 95)).toBe(420);
  });

  it('uses interpolation for percentile values', () => {
    expect(calculatePercentile([100, 200, 300, 400], 95)).toBeCloseTo(385, 10);
  });

  it('sorts unsorted inputs before percentile calculation', () => {
    expect(calculatePercentile([400, 100, 300, 200], 50)).toBeCloseTo(250, 10);
  });
});
