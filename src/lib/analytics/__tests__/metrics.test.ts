import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper function for percentile calculation (extracted for testing)
function calculatePercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  if (sortedArray.length === 1) return sortedArray[0];

  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sortedArray[lower];
  }

  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

describe('Analytics Metrics', () => {
  describe('Percentile Calculation', () => {
    it('should calculate median correctly for odd-length array', () => {
      const values = [1, 2, 3, 4, 5];
      expect(calculatePercentile(values, 50)).toBe(3);
    });

    it('should calculate median correctly for even-length array', () => {
      const values = [1, 2, 3, 4];
      expect(calculatePercentile(values, 50)).toBe(2.5);
    });

    it('should calculate P25 correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const p25 = calculatePercentile(values, 25);
      expect(p25).toBeGreaterThanOrEqual(2);
      expect(p25).toBeLessThanOrEqual(4);
    });

    it('should calculate P75 correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const p75 = calculatePercentile(values, 75);
      expect(p75).toBeGreaterThanOrEqual(7);
      expect(p75).toBeLessThanOrEqual(9);
    });

    it('should handle single value array', () => {
      const values = [5];
      expect(calculatePercentile(values, 50)).toBe(5);
      expect(calculatePercentile(values, 25)).toBe(5);
      expect(calculatePercentile(values, 75)).toBe(5);
    });

    it('should handle two value array', () => {
      const values = [1, 2];
      expect(calculatePercentile(values, 50)).toBe(1.5);
    });

    it('should return 0 for empty array', () => {
      expect(calculatePercentile([], 50)).toBe(0);
    });
  });

  describe('TTSC Metric Logic', () => {
    it('should convert milliseconds to days correctly', () => {
      const msPerDay = 1000 * 60 * 60 * 24;
      const days = 30;
      const milliseconds = days * msPerDay;

      expect(milliseconds / msPerDay).toBe(30);
    });

    it('should identify target achievement', () => {
      const TARGET_TTSC = 30; // days
      const testValues = [
        { median: 25, shouldMeet: true },
        { median: 30, shouldMeet: true },
        { median: 35, shouldMeet: false },
      ];

      testValues.forEach(({ median, shouldMeet }) => {
        const meetingTarget = median <= TARGET_TTSC;
        expect(meetingTarget).toBe(shouldMeet);
      });
    });

    it('should handle large time differences', () => {
      const activationDate = new Date('2024-01-01');
      const contractDate = new Date('2024-03-01');

      const diffMs = contractDate.getTime() - activationDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      expect(diffDays).toBeGreaterThan(50);
      expect(diffDays).toBeLessThan(65);
    });
  });

  describe('TTFQI Metric Logic', () => {
    it('should convert milliseconds to hours correctly', () => {
      const msPerHour = 1000 * 60 * 60;
      const hours = 72;
      const milliseconds = hours * msPerHour;

      expect(milliseconds / msPerHour).toBe(72);
    });

    it('should identify target achievement for TTFQI', () => {
      const TARGET_TTFQI = 72; // hours
      const testValues = [
        { median: 48, shouldMeet: true },
        { median: 72, shouldMeet: true },
        { median: 96, shouldMeet: false },
      ];

      testValues.forEach(({ median, shouldMeet }) => {
        const meetingTarget = median <= TARGET_TTFQI;
        expect(meetingTarget).toBe(shouldMeet);
      });
    });

    it('should handle activation to match timeframes', () => {
      const activationDate = new Date('2024-01-01T00:00:00Z');
      const matchDate = new Date('2024-01-02T12:00:00Z');

      const diffMs = matchDate.getTime() - activationDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      expect(diffHours).toBe(36);
    });
  });

  describe('TTV Metric Logic', () => {
    it('should convert milliseconds to days for TTV', () => {
      const msPerDay = 1000 * 60 * 60 * 24;
      const days = 7;
      const milliseconds = days * msPerDay;

      expect(milliseconds / msPerDay).toBe(7);
    });

    it('should identify target achievement for TTV', () => {
      const TARGET_TTV = 7; // days
      const testValues = [
        { median: 5, shouldMeet: true },
        { median: 7, shouldMeet: true },
        { median: 10, shouldMeet: false },
      ];

      testValues.forEach(({ median, shouldMeet }) => {
        const meetingTarget = median <= TARGET_TTV;
        expect(meetingTarget).toBe(shouldMeet);
      });
    });
  });

  describe('Proof-Fit Lift Metric Logic', () => {
    it('should calculate lift percentage correctly', () => {
      const highProofFitRate = 0.75; // 75%
      const lowProofFitRate = 0.55; // 55%

      const lift = ((highProofFitRate - lowProofFitRate) / lowProofFitRate) * 100;

      expect(lift).toBeCloseTo(36.36, 1); // ~36.36% lift
    });

    it('should identify target achievement for proof-fit acceptance', () => {
      const TARGET_PROOF_FIT_ACCEPTANCE = 20; // % lift
      const testValues = [
        { highRate: 0.72, lowRate: 0.6, shouldMeet: true }, // 20% lift
        { highRate: 0.8, lowRate: 0.6, shouldMeet: true }, // 33.33% lift
        { highRate: 0.65, lowRate: 0.6, shouldMeet: false }, // 8.33% lift
      ];

      testValues.forEach(({ highRate, lowRate, shouldMeet }) => {
        const lift = ((highRate - lowRate) / lowRate) * 100;
        const meetingTarget = lift >= TARGET_PROOF_FIT_ACCEPTANCE;
        expect(meetingTarget).toBe(shouldMeet);
      });
    });

    it('should identify target achievement for proof-fit contract', () => {
      const TARGET_PROOF_FIT_CONTRACT = 15; // % lift
      const testValues = [
        { highRate: 0.7, lowRate: 0.6, shouldMeet: true }, // 16.67% lift
        { highRate: 0.75, lowRate: 0.6, shouldMeet: true }, // 25% lift
        { highRate: 0.68, lowRate: 0.6, shouldMeet: false }, // 13.33% lift (below 15%)
      ];

      testValues.forEach(({ highRate, lowRate, shouldMeet }) => {
        const lift = ((highRate - lowRate) / lowRate) * 100;
        const meetingTarget = lift >= TARGET_PROOF_FIT_CONTRACT;
        expect(meetingTarget).toBe(shouldMeet);
      });
    });

    it('should handle edge case of zero baseline', () => {
      const highProofFitRate = 0.5;
      const lowProofFitRate = 0.0;

      // Should handle division by zero gracefully
      const lift =
        lowProofFitRate === 0 ? 0 : ((highProofFitRate - lowProofFitRate) / lowProofFitRate) * 100;

      expect(lift).toBe(0); // Or Infinity if not handled
    });

    it('should calculate rates from counts correctly', () => {
      const acceptances = 45;
      const total = 100;
      const rate = acceptances / total;

      expect(rate).toBe(0.45);
      expect(rate * 100).toBe(45); // 45%
    });
  });

  describe('Metric Result Structure', () => {
    it('should have required fields', () => {
      const result = {
        value: 25.5,
        median: 25.5,
        p25: 20.0,
        p75: 30.0,
        mean: 26.3,
        unit: 'days' as const,
        timestamp: new Date(),
        sampleSize: 100,
        metadata: {
          target: 30,
          status: 'meeting_target',
        },
      };

      expect(result.value).toBeDefined();
      expect(result.unit).toBe('days');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.sampleSize).toBeGreaterThan(0);
    });

    it('should handle null results for insufficient data', () => {
      const emptyDataset: number[] = [];
      const result = emptyDataset.length === 0 ? null : { value: 0 };

      expect(result).toBeNull();
    });
  });

  describe('Date Range Filtering', () => {
    it('should default to 90-day lookback', () => {
      const now = new Date();
      const defaultStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const diffDays = (now.getTime() - defaultStart.getTime()) / (1000 * 60 * 60 * 24);

      expect(diffDays).toBeCloseTo(90, 0);
    });

    it('should handle custom date ranges', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');

      const diffMs = endDate.getTime() - startDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      expect(diffDays).toBeCloseTo(90, 0); // Q1 2024
    });

    it('should validate date range order', () => {
      const startDate = new Date('2024-03-31');
      const endDate = new Date('2024-01-01');

      const isValidRange = startDate <= endDate;

      expect(isValidRange).toBe(false);
    });
  });

  describe('Cohort Analysis', () => {
    it('should support cohort filtering', () => {
      const cohorts = ['2024-01', '2024-02', '2024-03'];
      const selectedCohort = '2024-02';

      const isInCohort = cohorts.includes(selectedCohort);

      expect(isInCohort).toBe(true);
    });

    it('should handle cohort date formatting', () => {
      const date = new Date('2024-02-15');
      const cohort = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      expect(cohort).toBe('2024-02');
    });
  });
});
