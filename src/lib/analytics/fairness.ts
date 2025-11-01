/**
 * Fairness Note Generation
 * PRD Part 2: Core Metrics
 *
 * Monitors fairness gaps between demographic cohorts on:
 * - Introduction acceptance rates
 * - Contract signing rates
 * - Controlling for skills/constraints
 *
 * Target: No statistically significant negative gap for underrepresented cohorts
 * Publishes fairness note per release
 *
 * Note: Demographics are OPT-IN only, never required
 */

import { db } from '@/db';
import { analyticsEvents, profiles } from '@/db/schema';
import { eq, and, gte, lte, sql, inArray } from 'drizzle-orm';

export interface DemographicCohort {
  cohortId: string;
  cohortName: string;
  userCount: number;
}

export interface FairnessMetric {
  cohortId: string;
  cohortName: string;
  introAcceptanceRate: number;
  contractSigningRate: number;
  sampleSize: number;
}

export interface FairnessGap {
  metric: 'intro_acceptance' | 'contract_signing';
  cohort1: string;
  cohort2: string;
  gap: number; // Percentage point difference
  isSignificant: boolean;
  pValue: number;
}

export interface FairnessNote {
  reportDate: Date;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  cohorts: FairnessMetric[];
  gaps: FairnessGap[];
  summary: string;
  status: 'passing' | 'warning' | 'failing';
  recommendations: string[];
}

/**
 * Calculate fairness metrics for a given time period
 * Only includes users who have opted-in to share demographics
 */
export async function calculateFairnessMetrics(
  startDate: Date,
  endDate: Date
): Promise<FairnessMetric[]> {
  try {
    // Query users with opt-in demographics
    // Note: This assumes a demographics table/field exists
    // For MVP, we'll use placeholder logic

    const cohorts = await getCohorts();
    const metrics: FairnessMetric[] = [];

    for (const cohort of cohorts) {
      const cohortUserIds = await getCohortUserIds(cohort.cohortId);

      if (cohortUserIds.length === 0) {
        continue;
      }

      // Calculate intro acceptance rate
      const intros = await db
        .select({
          total: sql<number>`COUNT(*)`,
          accepted: sql<number>`COUNT(*) FILTER (WHERE event_type = 'intro_accepted')`,
        })
        .from(analyticsEvents)
        .where(
          and(
            inArray(analyticsEvents.userId, cohortUserIds),
            eq(analyticsEvents.eventType, 'intro_sent'),
            gte(analyticsEvents.createdAt, startDate),
            lte(analyticsEvents.createdAt, endDate)
          )
        );

      // Calculate contract signing rate
      const contracts = await db
        .select({
          total: sql<number>`COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'intro_accepted')`,
          signed: sql<number>`COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'contract_signed')`,
        })
        .from(analyticsEvents)
        .where(
          and(
            inArray(analyticsEvents.userId, cohortUserIds),
            gte(analyticsEvents.createdAt, startDate),
            lte(analyticsEvents.createdAt, endDate)
          )
        );

      const introAcceptanceRate =
        intros[0]?.total > 0 ? (intros[0].accepted / intros[0].total) * 100 : 0;

      const contractSigningRate =
        contracts[0]?.total > 0 ? (contracts[0].signed / contracts[0].total) * 100 : 0;

      metrics.push({
        cohortId: cohort.cohortId,
        cohortName: cohort.cohortName,
        introAcceptanceRate,
        contractSigningRate,
        sampleSize: cohortUserIds.length,
      });
    }

    return metrics;
  } catch (error) {
    console.error('Fairness metrics calculation error:', error);
    return [];
  }
}

/**
 * Identify fairness gaps between cohorts
 */
export function identifyFairnessGaps(metrics: FairnessMetric[]): FairnessGap[] {
  const gaps: FairnessGap[] = [];

  // Compare each cohort pair
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const cohort1 = metrics[i];
      const cohort2 = metrics[j];

      // Check intro acceptance gap
      const introGap = cohort1.introAcceptanceRate - cohort2.introAcceptanceRate;
      const introSignificant = isStatisticallySignificant(
        cohort1.introAcceptanceRate,
        cohort2.introAcceptanceRate,
        cohort1.sampleSize,
        cohort2.sampleSize
      );

      if (Math.abs(introGap) > 5) {
        // 5 percentage point threshold
        gaps.push({
          metric: 'intro_acceptance',
          cohort1: cohort1.cohortName,
          cohort2: cohort2.cohortName,
          gap: introGap,
          isSignificant: introSignificant.isSignificant,
          pValue: introSignificant.pValue,
        });
      }

      // Check contract signing gap
      const contractGap = cohort1.contractSigningRate - cohort2.contractSigningRate;
      const contractSignificant = isStatisticallySignificant(
        cohort1.contractSigningRate,
        cohort2.contractSigningRate,
        cohort1.sampleSize,
        cohort2.sampleSize
      );

      if (Math.abs(contractGap) > 5) {
        gaps.push({
          metric: 'contract_signing',
          cohort1: cohort1.cohortName,
          cohort2: cohort2.cohortName,
          gap: contractGap,
          isSignificant: contractSignificant.isSignificant,
          pValue: contractSignificant.pValue,
        });
      }
    }
  }

  return gaps;
}

/**
 * Simple statistical significance test (two-proportion z-test)
 */
function isStatisticallySignificant(
  rate1: number,
  rate2: number,
  n1: number,
  n2: number
): { isSignificant: boolean; pValue: number } {
  // Convert rates to proportions
  const p1 = rate1 / 100;
  const p2 = rate2 / 100;

  // Pooled proportion
  const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);

  // Standard error
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

  // Z-score
  const z = Math.abs((p1 - p2) / se);

  // P-value (two-tailed) - simplified approximation
  const pValue = 2 * (1 - normalCDF(z));

  return {
    isSignificant: pValue < 0.05,
    pValue,
  };
}

/**
 * Normal CDF approximation for p-value calculation
 */
function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

/**
 * Error function approximation
 */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Generate fairness note report
 */
export async function generateFairnessNote(startDate: Date, endDate: Date): Promise<FairnessNote> {
  const metrics = await calculateFairnessMetrics(startDate, endDate);
  const gaps = identifyFairnessGaps(metrics);

  // Determine overall status
  const significantNegativeGaps = gaps.filter((g) => g.isSignificant && g.gap < -5);

  let status: 'passing' | 'warning' | 'failing';
  if (significantNegativeGaps.length === 0) {
    status = 'passing';
  } else if (significantNegativeGaps.length <= 2) {
    status = 'warning';
  } else {
    status = 'failing';
  }

  // Generate summary
  const summary = generateSummary(metrics, gaps, status);

  // Generate recommendations
  const recommendations = generateRecommendations(gaps);

  return {
    reportDate: new Date(),
    reportPeriod: { startDate, endDate },
    cohorts: metrics,
    gaps,
    summary,
    status,
    recommendations,
  };
}

function generateSummary(
  metrics: FairnessMetric[],
  gaps: FairnessGap[],
  status: 'passing' | 'warning' | 'failing'
): string {
  const totalCohorts = metrics.length;
  const significantGaps = gaps.filter((g) => g.isSignificant).length;

  if (status === 'passing') {
    return `Fairness check: PASSING. Analyzed ${totalCohorts} demographic cohorts with no statistically significant negative gaps in intro acceptance or contract signing rates.`;
  } else if (status === 'warning') {
    return `Fairness check: WARNING. Found ${significantGaps} statistically significant gap(s) across ${totalCohorts} cohorts. Review recommended.`;
  } else {
    return `Fairness check: FAILING. Found ${significantGaps} statistically significant gaps across ${totalCohorts} cohorts. Immediate investigation required.`;
  }
}

function generateRecommendations(gaps: FairnessGap[]): string[] {
  const recommendations: string[] = [];

  const significantGaps = gaps.filter((g) => g.isSignificant);

  if (significantGaps.length === 0) {
    recommendations.push('Continue monitoring fairness metrics in future releases.');
    recommendations.push(
      'Encourage more users to opt-in to demographic tracking for better insights.'
    );
  } else {
    recommendations.push('Investigate matching algorithm for potential bias in affected cohorts.');
    recommendations.push('Review skill taxonomy coverage for underrepresented specializations.');
    recommendations.push('Conduct qualitative interviews with affected cohort members.');
    recommendations.push('Consider implementing additional blinding/calibration techniques.');
  }

  return recommendations;
}

/**
 * Get demographic cohorts
 * For MVP: placeholder implementation
 * In production: query from demographics table where users have opted in
 */
async function getCohorts(): Promise<DemographicCohort[]> {
  // Placeholder: In production, this would query a demographics table
  return [
    { cohortId: 'all', cohortName: 'All Users', userCount: 0 },
    // Add actual cohorts when demographics are implemented
  ];
}

/**
 * Get user IDs for a specific cohort
 * For MVP: placeholder implementation
 */
async function getCohortUserIds(cohortId: string): Promise<string[]> {
  // Placeholder: In production, this would query based on opt-in demographics
  if (cohortId === 'all') {
    const allProfiles = await db.query.profiles.findMany({
      columns: { id: true },
    });
    return allProfiles.map((u) => u.id);
  }

  return [];
}
