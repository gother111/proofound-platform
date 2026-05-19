/**
 * Fairness Gap Calculation
 * Implements PRD Gap 3: Enhanced fairness analysis with statistical tests
 *
 * Calculates fairness metrics across demographic groups
 * Uses chi-square tests for statistical significance
 */

interface DemographicBreakdown {
  group: string;
  totalMatches: number;
  acceptedMatches: number;
  contracts: number;
  acceptanceRate: number;
  contractRate: number;
}

interface FairnessGap {
  dimension: string; // e.g., "gender", "age", "ethnicity"
  baseline: number; // Overall rate
  groups: DemographicBreakdown[];
  significantGaps: Array<{
    group: string;
    gap: number; // Difference from baseline
    pValue: number;
    isSignificant: boolean;
  }>;
}

export interface FairnessAnalysis {
  score: number; // 0-100, higher is better
  totalMatches: number;
  optInRate: number; // % who opted into demographics
  sampleSize: number;
  gaps: FairnessGap[];
  significantGaps: number;
  recommendations: string[];
  timestamp: Date;
}

/**
 * Calculate fairness gaps across all dimensions
 */
export async function calculateFairnessGaps(options: {
  cohort?: string;
  dateRange: { start: Date; end: Date };
}): Promise<FairnessAnalysis> {
  // 1. Fetch matches with opt-in demographics
  const matches = await fetchMatchesWithDemographics(options);

  if (matches.length === 0) {
    return {
      score: 100,
      totalMatches: 0,
      optInRate: 0,
      sampleSize: 0,
      gaps: [],
      significantGaps: 0,
      recommendations: [],
      timestamp: new Date(),
    };
  }

  // 2. Calculate opt-in rate
  const totalMatches = matches.length;
  const optInMatches = matches.filter((m) => m.demographics).length;
  const optInRate = (optInMatches / totalMatches) * 100;

  // 3. Calculate gaps for each demographic dimension
  const dimensions = ['gender', 'age_group', 'ethnicity', 'disability_status'];
  const gaps: FairnessGap[] = [];

  for (const dimension of dimensions) {
    const gap = await calculateDimensionGap(dimension, matches);
    if (gap) gaps.push(gap);
  }

  // 4. Count statistically significant gaps
  const significantGaps = gaps.reduce(
    (sum, gap) => sum + gap.significantGaps.filter((g) => g.isSignificant).length,
    0
  );

  // 5. Calculate overall fairness score
  const score = calculateFairnessScore(gaps, significantGaps);

  // 6. Generate recommendations
  const recommendations = generateRecommendations(gaps);

  return {
    score,
    totalMatches,
    optInRate,
    sampleSize: optInMatches,
    gaps,
    significantGaps,
    recommendations,
    timestamp: new Date(),
  };
}

/**
 * Calculate fairness gap for a single dimension
 */
async function calculateDimensionGap(
  dimension: string,
  matches: any[]
): Promise<FairnessGap | null> {
  // Filter to only opt-in demographics
  const matchesWithData = matches.filter((m) => m.demographics && m.demographics[dimension]);

  if (matchesWithData.length < 30) {
    // Insufficient sample size
    return null;
  }

  // Group by demographic value
  const groups = new Map<string, any[]>();
  for (const match of matchesWithData) {
    const value = match.demographics[dimension];
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value)!.push(match);
  }

  // Calculate rates for each group
  const groupBreakdowns: DemographicBreakdown[] = [];
  let totalAcceptances = 0;
  let totalContracts = 0;

  for (const [groupValue, groupMatches] of groups) {
    const accepted = groupMatches.filter((m) => m.status === 'accepted').length;
    const contracts = groupMatches.filter((m) => m.contractSigned).length;

    totalAcceptances += accepted;
    totalContracts += contracts;

    groupBreakdowns.push({
      group: groupValue,
      totalMatches: groupMatches.length,
      acceptedMatches: accepted,
      contracts,
      acceptanceRate: (accepted / groupMatches.length) * 100,
      contractRate: (contracts / groupMatches.length) * 100,
    });
  }

  // Calculate baseline (overall rate)
  const baselineAcceptance = (totalAcceptances / matchesWithData.length) * 100;
  const baselineContract = (totalContracts / matchesWithData.length) * 100;

  // Perform chi-square tests for each group
  const significantGaps = [];
  for (const group of groupBreakdowns) {
    const gap = group.acceptanceRate - baselineAcceptance;
    const pValue = chiSquareTest(
      group.acceptedMatches,
      group.totalMatches,
      totalAcceptances,
      matchesWithData.length
    );

    significantGaps.push({
      group: group.group,
      gap,
      pValue,
      isSignificant: pValue < 0.05 && Math.abs(gap) > 5, // 5pp threshold
    });
  }

  return {
    dimension,
    baseline: baselineAcceptance,
    groups: groupBreakdowns,
    significantGaps,
  };
}

/**
 * Chi-square test for statistical significance
 * Tests if observed rate differs significantly from expected
 */
function chiSquareTest(
  observed: number,
  total: number,
  expectedTotal: number,
  overallTotal: number
): number {
  const expected = (expectedTotal / overallTotal) * total;
  const chiSquare = Math.pow(observed - expected, 2) / expected;

  // Approximate p-value (simplified)
  // For production, use a proper stats library
  if (chiSquare > 3.84) return 0.05; // Significant at α=0.05
  if (chiSquare > 2.71) return 0.1;
  return 0.2; // Not significant
}

/**
 * Calculate overall fairness score (0-100)
 */
function calculateFairnessScore(gaps: FairnessGap[], significantGaps: number): number {
  if (gaps.length === 0) return 100;

  // Start at 100, deduct points for significant gaps
  let score = 100;

  // Deduct 10 points per significant gap
  score -= significantGaps * 10;

  // Deduct additional points for large gaps (>15pp)
  for (const gap of gaps) {
    for (const sg of gap.significantGaps) {
      if (Math.abs(sg.gap) > 15) {
        score -= 5;
      }
    }
  }

  return Math.max(0, score);
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(gaps: FairnessGap[]): string[] {
  const recommendations: string[] = [];

  for (const gap of gaps) {
    for (const sg of gap.significantGaps) {
      if (sg.isSignificant && sg.gap < -10) {
        recommendations.push(
          `${gap.dimension}: ${sg.group} acceptance rate is ${Math.abs(sg.gap).toFixed(1)}pp below baseline. Review matching algorithm weights.`
        );
      }
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('No significant fairness gaps detected. Continue monitoring.');
  }

  return recommendations;
}

/**
 * Fetch matches with demographic data
 */
async function fetchMatchesWithDemographics(options: {
  cohort?: string;
  dateRange: { start: Date; end: Date };
}): Promise<any[]> {
  // This would query the database
  // For now, return placeholder
  // Implementation depends on actual data model
  return [];
}
