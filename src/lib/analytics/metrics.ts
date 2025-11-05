/**
 * PRD Part 2: Core Metrics
 *
 * Implements tracking and calculation for:
 * - TTSC (Time to Signed Contract): Median ≤30 days
 * - TTFQI (Time to First Qualified Introduction): Median ≤72 hours
 * - TTV (Time to Value): Median ≤7 days
 * - PAC (Purpose-Alignment Contribution): ≥20% higher intro acceptance
 * - SUS (System Usability Scale): ≥75
 * - Well-Being Delta: ≥60% show +1 improvement
 */

import { db } from '@/db';
import { analyticsEvents, wellbeingCheckins, matches } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface MetricResult {
  value: number;
  unit: 'hours' | 'days' | 'percentage' | 'score';
  timestamp: Date;
  sampleSize: number;
  metadata?: Record<string, any>;
}

export interface TTSCResult extends MetricResult {
  median: number;
  p25: number;
  p75: number;
  mean: number;
}

export async function calculateTTSC(startDate?: Date, endDate?: Date): Promise<TTSCResult | null> {
  const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  try {
    const contractEvents = await db
      .select({
        userId: analyticsEvents.userId,
        contractDate: analyticsEvents.createdAt,
        activationDate: sql<Date>`(
          SELECT MIN(created_at)
          FROM analytics_events
          WHERE user_id = ${analyticsEvents.userId}
          AND event_type = 'profile_activated'
        )`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'contract_signed'),
          gte(analyticsEvents.createdAt, start),
          lte(analyticsEvents.createdAt, end)
        )
      );

    if (contractEvents.length === 0) return null;

    const timeToContract = contractEvents
      .filter((e) => e.activationDate)
      .map((e) => {
        const diff = e.contractDate.getTime() - e.activationDate!.getTime();
        return diff / (1000 * 60 * 60 * 24);
      })
      .sort((a, b) => a - b);

    if (timeToContract.length === 0) return null;

    const median = calculatePercentile(timeToContract, 50);
    const p25 = calculatePercentile(timeToContract, 25);
    const p75 = calculatePercentile(timeToContract, 75);
    const mean = timeToContract.reduce((a, b) => a + b, 0) / timeToContract.length;

    return {
      value: median,
      median,
      p25,
      p75,
      mean,
      unit: 'days',
      timestamp: new Date(),
      sampleSize: timeToContract.length,
      metadata: {
        target: 30,
        status: median <= 30 ? 'meeting_target' : 'below_target',
      },
    };
  } catch (error) {
    console.error('TTSC calculation error:', error);
    return null;
  }
}

/**
 * Calculate TTFQI (Time to First Qualified Introduction)
 * Target: Median ≤72 hours
 *
 * Measures time from profile/assignment activation to first qualified match introduction
 */
export async function calculateTTFQI(
  startDate?: Date,
  endDate?: Date,
  cohort?: string
): Promise<TTSCResult | null> {
  const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  try {
    // Get all qualified introductions (match_actioned with action='introduce')
    const introEvents = await db
      .select({
        userId: analyticsEvents.userId,
        introDate: analyticsEvents.createdAt,
        qualificationMet: sql<boolean>`(properties->>'qualificationMet')::boolean`,
        activationDate: sql<Date>`(
          SELECT MIN(created_at)
          FROM analytics_events
          WHERE user_id = ${analyticsEvents.userId}
          AND event_type IN ('profile_activated', 'assignment_published')
        )`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'match_actioned'),
          sql`properties->>'action' = 'introduce'`,
          gte(analyticsEvents.createdAt, start),
          lte(analyticsEvents.createdAt, end)
        )
      );

    if (introEvents.length === 0) return null;

    // Filter for first introduction per user and calculate time in hours
    const userFirstIntros = new Map<string, number>();

    introEvents
      .filter((e) => e.activationDate && e.qualificationMet && e.userId)
      .forEach((e) => {
        if (!userFirstIntros.has(e.userId!)) {
          const diff = e.introDate.getTime() - e.activationDate!.getTime();
          const hours = diff / (1000 * 60 * 60);
          userFirstIntros.set(e.userId!, hours);
        }
      });

    const timeToFirstIntro = Array.from(userFirstIntros.values()).sort((a, b) => a - b);

    if (timeToFirstIntro.length === 0) return null;

    const median = calculatePercentile(timeToFirstIntro, 50);
    const p25 = calculatePercentile(timeToFirstIntro, 25);
    const p75 = calculatePercentile(timeToFirstIntro, 75);
    const mean = timeToFirstIntro.reduce((a, b) => a + b, 0) / timeToFirstIntro.length;

    return {
      value: median,
      median,
      p25,
      p75,
      mean,
      unit: 'hours',
      timestamp: new Date(),
      sampleSize: timeToFirstIntro.length,
      metadata: {
        target: 72,
        status: median <= 72 ? 'meeting_target' : 'below_target',
        cohort,
      },
    };
  } catch (error) {
    console.error('TTFQI calculation error:', error);
    return null;
  }
}

/**
 * Calculate TTV (Time to Value)
 * Target: Median ≤7 days
 *
 * Measures time from activation to first meaningful step (interview scheduled OR async task accepted)
 */
export async function calculateTTV(
  startDate?: Date,
  endDate?: Date,
  cohort?: string
): Promise<TTSCResult | null> {
  const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  try {
    // Get all "value" events (interview_scheduled or async_task_accepted)
    const valueEvents = await db
      .select({
        userId: analyticsEvents.userId,
        valueDate: analyticsEvents.createdAt,
        eventType: analyticsEvents.eventType,
        activationDate: sql<Date>`(
          SELECT MIN(created_at)
          FROM analytics_events
          WHERE user_id = ${analyticsEvents.userId}
          AND event_type = 'profile_activated'
        )`,
      })
      .from(analyticsEvents)
      .where(
        and(
          sql`event_type IN ('interview_scheduled', 'async_task_accepted')`,
          gte(analyticsEvents.createdAt, start),
          lte(analyticsEvents.createdAt, end)
        )
      );

    if (valueEvents.length === 0) return null;

    // Filter for first value event per user and calculate time in days
    const userFirstValue = new Map<string, number>();

    valueEvents
      .filter((e) => e.activationDate && e.userId)
      .forEach((e) => {
        if (!userFirstValue.has(e.userId!)) {
          const diff = e.valueDate.getTime() - e.activationDate!.getTime();
          const days = diff / (1000 * 60 * 60 * 24);
          userFirstValue.set(e.userId!, days);
        }
      });

    const timeToValue = Array.from(userFirstValue.values()).sort((a, b) => a - b);

    if (timeToValue.length === 0) return null;

    const median = calculatePercentile(timeToValue, 50);
    const p25 = calculatePercentile(timeToValue, 25);
    const p75 = calculatePercentile(timeToValue, 75);
    const mean = timeToValue.reduce((a, b) => a + b, 0) / timeToValue.length;

    return {
      value: median,
      median,
      p25,
      p75,
      mean,
      unit: 'days',
      timestamp: new Date(),
      sampleSize: timeToValue.length,
      metadata: {
        target: 7,
        status: median <= 7 ? 'meeting_target' : 'below_target',
        cohort,
      },
    };
  } catch (error) {
    console.error('TTV calculation error:', error);
    return null;
  }
}

/**
 * Calculate PAC (Purpose-Alignment Contribution) Lift
 * Target: ≥20% higher intro acceptance and ≥15% higher contract rate for high-PAC matches
 *
 * Compares acceptance and contract rates between high-PAC (top decile) and low-PAC matches
 */
export interface PACResult {
  highPacAcceptanceRate: number;
  lowPacAcceptanceRate: number;
  acceptanceLift: number;
  highPacContractRate: number;
  lowPacContractRate: number;
  contractLift: number;
  meetsAcceptanceTarget: boolean; // ≥20% lift
  meetsContractTarget: boolean; // ≥15% lift
  timestamp: Date;
  sampleSize: {
    highPac: number;
    lowPac: number;
  };
}

export async function calculatePACLift(
  startDate?: Date,
  endDate?: Date
): Promise<PACResult | null> {
  const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  try {
    // Get all matches with their PAC scores
    const allMatches = await db
      .select({
        id: matches.id,
        profileId: matches.profileId,
        assignmentId: matches.assignmentId,
        score: matches.score,
        vector: matches.vector,
        createdAt: matches.createdAt,
      })
      .from(matches)
      .where(and(gte(matches.createdAt, start), lte(matches.createdAt, end)));

    if (allMatches.length === 0) return null;

    // Extract PAC scores and calculate top decile threshold
    const matchesWithPAC = allMatches
      .map((m) => {
        const vector = m.vector as any;
        const pac = vector?.subscores?.pac || 0;
        return { ...m, pac };
      })
      .sort((a, b) => b.pac - a.pac);

    const topDecileIndex = Math.floor(matchesWithPAC.length * 0.1);
    const topDecileThreshold = matchesWithPAC[topDecileIndex]?.pac || 0;

    const highPacMatches = matchesWithPAC.filter((m) => m.pac >= topDecileThreshold);
    const lowPacMatches = matchesWithPAC.filter((m) => m.pac < topDecileThreshold);

    if (highPacMatches.length === 0 || lowPacMatches.length === 0) return null;

    // Get introduction events for these matches
    const introEvents = await db
      .select({
        matchId: analyticsEvents.entityId,
        action: sql<string>`properties->>'action'`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'match_actioned'),
          sql`entity_id IN (${sql.join(
            matchesWithPAC.map((m) => sql`${m.id}`),
            sql`, `
          )})`
        )
      );

    // Get contract events
    const contractEvents = await db
      .select({
        assignmentId: analyticsEvents.entityId,
      })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, 'contract_signed'));

    const contractedAssignments = new Set(contractEvents.map((e) => e.assignmentId));

    // Calculate acceptance rates (introductions / total matches)
    const highPacAccepted = introEvents.filter((e) =>
      highPacMatches.some((m) => m.id === e.matchId)
    ).length;
    const highPacAcceptanceRate = (highPacAccepted / highPacMatches.length) * 100;

    const lowPacAccepted = introEvents.filter((e) =>
      lowPacMatches.some((m) => m.id === e.matchId)
    ).length;
    const lowPacAcceptanceRate = (lowPacAccepted / lowPacMatches.length) * 100;

    // Calculate contract rates
    const highPacContracts = highPacMatches.filter((m) =>
      contractedAssignments.has(m.assignmentId)
    ).length;
    const highPacContractRate = (highPacContracts / highPacMatches.length) * 100;

    const lowPacContracts = lowPacMatches.filter((m) =>
      contractedAssignments.has(m.assignmentId)
    ).length;
    const lowPacContractRate = (lowPacContracts / lowPacMatches.length) * 100;

    // Calculate lifts
    const acceptanceLift =
      lowPacAcceptanceRate > 0
        ? ((highPacAcceptanceRate - lowPacAcceptanceRate) / lowPacAcceptanceRate) * 100
        : 0;

    const contractLift =
      lowPacContractRate > 0
        ? ((highPacContractRate - lowPacContractRate) / lowPacContractRate) * 100
        : 0;

    return {
      highPacAcceptanceRate,
      lowPacAcceptanceRate,
      acceptanceLift,
      highPacContractRate,
      lowPacContractRate,
      contractLift,
      meetsAcceptanceTarget: acceptanceLift >= 20,
      meetsContractTarget: contractLift >= 15,
      timestamp: new Date(),
      sampleSize: {
        highPac: highPacMatches.length,
        lowPac: lowPacMatches.length,
      },
    };
  } catch (error) {
    console.error('PAC calculation error:', error);
    return null;
  }
}

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Calculate Fairness Gap between two cohorts
 * Target: No statistically significant gaps (p < 0.05) in introduction or contract rates
 *
 * Compares rates between two demographic cohorts with statistical significance testing
 */
export interface FairnessGapResult {
  cohortA: {
    name: string;
    introductionRate: number;
    contractRate: number;
    sampleSize: number;
  };
  cohortB: {
    name: string;
    introductionRate: number;
    contractRate: number;
    sampleSize: number;
  };
  introductionGap: number; // Percentage point difference
  contractGap: number; // Percentage point difference
  pValueIntroduction: number; // Statistical significance
  pValueContract: number; // Statistical significance
  isSignificant: boolean; // p < 0.05 for either metric
  timestamp: Date;
}

export async function calculateFairnessGap(
  cohortAName: string,
  cohortBName: string,
  startDate?: Date,
  endDate?: Date
): Promise<FairnessGapResult | null> {
  const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  try {
    // Get demographic opt-ins with their cohort information
    const { demographicOptIns } = await import('@/db/schema');

    const optIns = await db
      .select()
      .from(demographicOptIns)
      .where(eq(demographicOptIns.optedIn, true));

    // Filter users by cohort (simplified - in production would use more sophisticated cohort definition)
    const cohortAUsers = optIns
      .filter((opt) => {
        const cohortData = [
          opt.gender,
          opt.ethnicity,
          opt.ageRange,
          opt.disability,
          opt.veteranStatus,
        ];
        return cohortData.some((data) => data?.toLowerCase().includes(cohortAName.toLowerCase()));
      })
      .map((opt) => opt.profileId);

    const cohortBUsers = optIns
      .filter((opt) => {
        const cohortData = [
          opt.gender,
          opt.ethnicity,
          opt.ageRange,
          opt.disability,
          opt.veteranStatus,
        ];
        return cohortData.some((data) => data?.toLowerCase().includes(cohortBName.toLowerCase()));
      })
      .map((opt) => opt.profileId);

    if (cohortAUsers.length === 0 || cohortBUsers.length === 0) {
      return null;
    }

    // Get all matches for these users
    const allMatches = await db
      .select({
        id: matches.id,
        profileId: matches.profileId,
        assignmentId: matches.assignmentId,
        createdAt: matches.createdAt,
      })
      .from(matches)
      .where(and(gte(matches.createdAt, start), lte(matches.createdAt, end)));

    const cohortAMatches = allMatches.filter((m) => cohortAUsers.includes(m.profileId));
    const cohortBMatches = allMatches.filter((m) => cohortBUsers.includes(m.profileId));

    if (cohortAMatches.length < 40 || cohortBMatches.length < 40) {
      // Insufficient sample size for statistical validity
      return null;
    }

    // Get introduction events
    const introEvents = await db
      .select({
        matchId: analyticsEvents.entityId,
        action: sql<string>`properties->>'action'`,
      })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, 'match_actioned'));

    const introMatchIds = new Set(
      introEvents.filter((e) => e.action === 'introduce').map((e) => e.matchId)
    );

    // Calculate introduction rates
    const cohortAIntros = cohortAMatches.filter((m) => introMatchIds.has(m.id)).length;
    const cohortAIntroRate = (cohortAIntros / cohortAMatches.length) * 100;

    const cohortBIntros = cohortBMatches.filter((m) => introMatchIds.has(m.id)).length;
    const cohortBIntroRate = (cohortBIntros / cohortBMatches.length) * 100;

    // Get contract events
    const contractEvents = await db
      .select({
        assignmentId: analyticsEvents.entityId,
      })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, 'contract_signed'));

    const contractedAssignments = new Set(contractEvents.map((e) => e.assignmentId));

    // Calculate contract rates
    const cohortAContracts = cohortAMatches.filter((m) =>
      contractedAssignments.has(m.assignmentId)
    ).length;
    const cohortAContractRate = (cohortAContracts / cohortAMatches.length) * 100;

    const cohortBContracts = cohortBMatches.filter((m) =>
      contractedAssignments.has(m.assignmentId)
    ).length;
    const cohortBContractRate = (cohortBContracts / cohortBMatches.length) * 100;

    // Calculate statistical significance using two-proportion z-test
    const pValueIntro = calculateTwoProportionZTest(
      cohortAIntros,
      cohortAMatches.length,
      cohortBIntros,
      cohortBMatches.length
    );

    const pValueContract = calculateTwoProportionZTest(
      cohortAContracts,
      cohortAMatches.length,
      cohortBContracts,
      cohortBMatches.length
    );

    return {
      cohortA: {
        name: cohortAName,
        introductionRate: cohortAIntroRate,
        contractRate: cohortAContractRate,
        sampleSize: cohortAMatches.length,
      },
      cohortB: {
        name: cohortBName,
        introductionRate: cohortBIntroRate,
        contractRate: cohortBContractRate,
        sampleSize: cohortBMatches.length,
      },
      introductionGap: cohortAIntroRate - cohortBIntroRate,
      contractGap: cohortAContractRate - cohortBContractRate,
      pValueIntroduction: pValueIntro,
      pValueContract: pValueContract,
      isSignificant: pValueIntro < 0.05 || pValueContract < 0.05,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Fairness gap calculation error:', error);
    return null;
  }
}

/**
 * Two-proportion z-test for statistical significance
 * Returns p-value (two-tailed)
 */
function calculateTwoProportionZTest(x1: number, n1: number, x2: number, n2: number): number {
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pPool = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

  if (se === 0) return 1; // No difference

  const z = Math.abs(p1 - p2) / se;

  // Convert z-score to p-value (two-tailed)
  // Using standard normal cumulative distribution approximation
  const pValue = 2 * (1 - standardNormalCDF(z));

  return pValue;
}

/**
 * Standard normal cumulative distribution function
 * Approximation using error function
 */
function standardNormalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return z > 0 ? 1 - p : p;
}

/**
 * Calculate SUS (System Usability Scale) metrics
 * Target: ≥75 (Good usability)
 */
export async function calculateSUSMetrics(): Promise<{
  average: number;
  median: number;
  min: number;
  max: number;
  meetsTarget: boolean;
  sampleSize: number;
  responseRate: number;
} | null> {
  try {
    const { susSurveys, surveyDisplayLog } = await import('@/db/schema');

    // Get all completed SUS surveys
    const surveys = await db.select().from(susSurveys).where(eq(susSurveys.dismissed, false));

    if (surveys.length === 0) return null;

    const scores = surveys.map((s) => parseFloat(s.score));
    const sortedScores = [...scores].sort((a, b) => a - b);

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const median =
      sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)];

    // Calculate response rate
    const displayed = await db
      .select()
      .from(surveyDisplayLog)
      .where(eq(surveyDisplayLog.surveyType, 'sus'));
    const responseRate = displayed.length > 0 ? surveys.length / displayed.length : 0;

    return {
      average,
      median,
      min: sortedScores[0],
      max: sortedScores[sortedScores.length - 1],
      meetsTarget: average >= 75,
      sampleSize: surveys.length,
      responseRate,
    };
  } catch (error) {
    console.error('SUS metrics calculation error:', error);
    return null;
  }
}

export async function getAllMetrics() {
  const [ttsc, ttfqi, ttv, pac, sus] = await Promise.all([
    calculateTTSC(),
    calculateTTFQI(),
    calculateTTV(),
    calculatePACLift(),
    calculateSUSMetrics(),
  ]);

  return {
    ttsc,
    ttfqi,
    ttv,
    pac,
    sus,
    timestamp: new Date().toISOString(),
  };
}
