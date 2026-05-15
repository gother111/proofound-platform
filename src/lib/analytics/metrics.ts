/**
 * Metrics Calculation Library
 *
 * Implements PRD Part 7 Metrics:
 * - TTFQI: Time to First Qualified Introduction
 * - TTV: Time to Video Interview
 * - TTSC: Time to Signed Contract
 * - Proof Fit Lift
 * - SUS: System Usability Scale
 * - Well-Being Delta: Change in well-being scores
 * - Fairness Gap: Demographic disparity in outcomes
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { getRows } from '@/lib/db/rows';

// ============================================================================
// TYPES
// ============================================================================

export interface MetricResult {
  metric: string;
  value: number;
  unit: string;
  target: number;
  onTrack: boolean;
  cohort?: string;
  percentile?: {
    p50: number;
    p75: number;
    p90: number;
  };
  sampleSize: number;
  calculatedAt: Date;
}

export interface TTFQIResult extends MetricResult {
  metric: 'TTFQI';
  unit: 'hours';
  target: 72; // PRD: ≤72 hours
}

export interface TTVResult extends MetricResult {
  metric: 'TTV';
  unit: 'days';
  target: 7; // PRD: ≤7 days
}

export interface TTSCResult extends MetricResult {
  metric: 'TTSC';
  unit: 'days';
  target: 30; // PRD: ≤30 days
}

export interface PACLiftResult {
  metric: 'PAC_LIFT';
  withPAC: number; // Average match score with PAC
  withoutPAC: number; // Average match score without PAC
  lift: number; // Percentage increase
  targetLift: number; // PRD: ≥20%
  onTrack: boolean;
  sampleSize: { withPAC: number; withoutPAC: number };
  calculatedAt: Date;
}

export interface SUSResult extends MetricResult {
  metric: 'SUS';
  unit: 'score';
  target: 75; // PRD: ≥75
  responses: number;
}

export interface WellBeingDeltaResult {
  metric: 'WELLBEING_DELTA';
  averageDelta: number;
  byDimension: Record<string, number>;
  positiveChange: number; // Percentage of users with improvement
  target: number; // PRD: ≥70% users improve
  onTrack: boolean;
  sampleSize: number;
  calculatedAt: Date;
}

export interface FirstTenMinuteActivationRate {
  numerator: number;
  denominator: number;
  rate: number;
}

export interface FirstTenMinuteActivationMetrics {
  windowMinutes: 10;
  individual: FirstTenMinuteActivationRate;
  company: FirstTenMinuteActivationRate;
  calculatedAt: Date;
}

// ============================================================================
// TIME TO FIRST QUALIFIED INTRODUCTION (TTFQI)
// ============================================================================

/**
 * Calculate TTFQI: Time from profile activation to first match introduction
 * PRD Target: ≤72 hours (median)
 */
export async function calculateTTFQI(
  cohort?: string,
  startDate?: Date,
  endDate?: Date
): Promise<TTFQIResult> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = endDate || new Date();

    const result = await db.execute(sql`
      WITH activations AS (
        SELECT 
          user_id,
          MIN(occurred_at) as activated_at
        FROM analytics_events
        WHERE event_type = 'profile_activated'
          AND occurred_at >= ${start.toISOString()}
          AND occurred_at <= ${end.toISOString()}
        GROUP BY user_id
      ),
      first_intros AS (
        SELECT
          user_id,
          MIN(occurred_at) as introduced_at
        FROM analytics_events
        WHERE event_type = 'match_introduced'
        GROUP BY user_id
      ),
      ttfqi_values AS (
        SELECT
          a.user_id,
          EXTRACT(EPOCH FROM (i.introduced_at - a.activated_at)) / 3600 as hours
        FROM activations a
        INNER JOIN first_intros i ON a.user_id = i.user_id
        WHERE i.introduced_at > a.activated_at
      )
      SELECT
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hours) as p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY hours) as p75,
        PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY hours) as p90,
        COUNT(*) as sample_size
      FROM ttfqi_values
    `);

    const row = (getRows(result)[0] ?? {}) as any;
    const median = parseFloat(row.p50 || '0');
    const p75 = parseFloat(row.p75 || '0');
    const p90 = parseFloat(row.p90 || '0');
    const sampleSize = parseInt(row.sample_size || '0');

    log.info('metrics.ttfqi.calculated', {
      median,
      p75,
      p90,
      sampleSize,
      cohort,
    });

    return {
      metric: 'TTFQI',
      value: median,
      unit: 'hours',
      target: 72,
      onTrack: median <= 72,
      cohort,
      percentile: { p50: median, p75, p90 },
      sampleSize,
      calculatedAt: new Date(),
    };
  } catch (error) {
    log.error('metrics.ttfqi.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ============================================================================
// TIME TO VIDEO INTERVIEW (TTV)
// ============================================================================

/**
 * Calculate TTV: Time from match introduction to video interview scheduled
 * PRD Target: ≤7 days (median)
 */
export async function calculateTTV(
  cohort?: string,
  startDate?: Date,
  endDate?: Date
): Promise<TTVResult> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const result = await db.execute(sql`
      WITH introductions AS (
        SELECT
          (properties->>'match_id')::uuid as match_id,
          MIN(occurred_at) as introduced_at
        FROM analytics_events
        WHERE event_type = 'match_introduced'
          AND occurred_at >= ${start.toISOString()}
          AND occurred_at <= ${end.toISOString()}
        GROUP BY (properties->>'match_id')::uuid
      ),
      interviews AS (
        SELECT
          (properties->>'match_id')::uuid as match_id,
          MIN(occurred_at) as scheduled_at
        FROM analytics_events
        WHERE event_type = 'interview_scheduled'
        GROUP BY (properties->>'match_id')::uuid
      ),
      ttv_values AS (
        SELECT
          intro.match_id,
          EXTRACT(EPOCH FROM (int.scheduled_at - intro.introduced_at)) / (24 * 3600) as days
        FROM introductions intro
        INNER JOIN interviews int ON intro.match_id = int.match_id
        WHERE int.scheduled_at > intro.introduced_at
      )
      SELECT
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days) as p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY days) as p75,
        PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY days) as p90,
        COUNT(*) as sample_size
      FROM ttv_values
    `);

    const row = (getRows(result)[0] ?? {}) as any;
    const median = parseFloat(row.p50 || '0');
    const p75 = parseFloat(row.p75 || '0');
    const p90 = parseFloat(row.p90 || '0');
    const sampleSize = parseInt(row.sample_size || '0');

    log.info('metrics.ttv.calculated', {
      median,
      p75,
      p90,
      sampleSize,
      cohort,
    });

    return {
      metric: 'TTV',
      value: median,
      unit: 'days',
      target: 7,
      onTrack: median <= 7,
      cohort,
      percentile: { p50: median, p75, p90 },
      sampleSize,
      calculatedAt: new Date(),
    };
  } catch (error) {
    log.error('metrics.ttv.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ============================================================================
// TIME TO SIGNED CONTRACT (TTSC)
// ============================================================================

/**
 * Calculate TTSC: Time from match introduction to contract signed
 * PRD Target: ≤30 days (median)
 */
export async function calculateTTSC(
  cohort?: string,
  startDate?: Date,
  endDate?: Date
): Promise<TTSCResult> {
  try {
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
    const end = endDate || new Date();

    const result = await db.execute(sql`
      WITH introductions AS (
        SELECT
          (properties->>'match_id')::uuid as match_id,
          MIN(occurred_at) as introduced_at
        FROM analytics_events
        WHERE event_type = 'match_introduced'
          AND occurred_at >= ${start.toISOString()}
          AND occurred_at <= ${end.toISOString()}
        GROUP BY (properties->>'match_id')::uuid
      ),
      contracts AS (
        SELECT
          (properties->>'match_id')::uuid as match_id,
          MIN(occurred_at) as signed_at
        FROM analytics_events
        WHERE event_type = 'contract_signed'
        GROUP BY (properties->>'match_id')::uuid
      ),
      ttsc_values AS (
        SELECT
          intro.match_id,
          EXTRACT(EPOCH FROM (cont.signed_at - intro.introduced_at)) / (24 * 3600) as days
        FROM introductions intro
        INNER JOIN contracts cont ON intro.match_id = cont.match_id
        WHERE cont.signed_at > intro.introduced_at
      )
      SELECT
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days) as p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY days) as p75,
        PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY days) as p90,
        COUNT(*) as sample_size
      FROM ttsc_values
    `);

    const row = (getRows(result)[0] ?? {}) as any;
    const median = parseFloat(row.p50 || '0');
    const p75 = parseFloat(row.p75 || '0');
    const p90 = parseFloat(row.p90 || '0');
    const sampleSize = parseInt(row.sample_size || '0');

    log.info('metrics.ttsc.calculated', {
      median,
      p75,
      p90,
      sampleSize,
      cohort,
    });

    return {
      metric: 'TTSC',
      value: median,
      unit: 'days',
      target: 30,
      onTrack: median <= 30,
      cohort,
      percentile: { p50: median, p75, p90 },
      sampleSize,
      calculatedAt: new Date(),
    };
  } catch (error) {
    log.error('metrics.ttsc.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ============================================================================
// PROOF-FIT LIFT
// ============================================================================

/**
 * Calculate proof-fit lift.
 * PRD Target: at least 20% lift in acceptance rate for high-fit matches.
 */
export async function calculatePACLift(startDate?: Date, endDate?: Date): Promise<PACLiftResult> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Legacy metric buckets retained for compatibility with existing analytics data.
    const result = await db.execute(sql`
      WITH matches_with_pac AS (
        SELECT
          entity_id as match_id,
          (properties->>'score')::float as score,
          (properties->>'pac_contribution')::float as pac,
          CASE
            WHEN (properties->>'pac_contribution')::float >= 0.70 THEN 'high_pac'
            WHEN (properties->>'pac_contribution')::float < 0.30 THEN 'low_pac'
            ELSE 'medium_pac'
          END as pac_bucket
        FROM analytics_events
        WHERE event_type = 'match_generated'
          AND occurred_at >= ${start.toISOString()}
          AND occurred_at <= ${end.toISOString()}
          AND properties ? 'pac_contribution'
      ),
      match_acceptance AS (
        SELECT DISTINCT
          entity_id as match_id
        FROM analytics_events
        WHERE event_type = 'match_introduced'
      )
      SELECT
        m.pac_bucket,
        AVG(m.score) as avg_score,
        COUNT(*) as total_matches,
        COUNT(DISTINCT a.match_id) as accepted_matches,
        (COUNT(DISTINCT a.match_id)::float / COUNT(*)::float) as acceptance_rate
      FROM matches_with_pac m
      LEFT JOIN match_acceptance a ON m.match_id = a.match_id
      WHERE m.pac_bucket IN ('high_pac', 'low_pac')
      GROUP BY m.pac_bucket
    `);

    const rows = getRows(result) as any[];
    const highPAC = rows.find((r) => r.pac_bucket === 'high_pac');
    const lowPAC = rows.find((r) => r.pac_bucket === 'low_pac');

    const withPAC = highPAC ? parseFloat(highPAC.acceptance_rate) * 100 : 0;
    const withoutPAC = lowPAC ? parseFloat(lowPAC.acceptance_rate) * 100 : 0;
    const lift = withoutPAC > 0 ? ((withPAC - withoutPAC) / withoutPAC) * 100 : 0;

    log.info('metrics.pac_lift.calculated', {
      withPAC,
      withoutPAC,
      lift,
      sampleSizeHigh: highPAC?.total_matches || 0,
      sampleSizeLow: lowPAC?.total_matches || 0,
    });

    return {
      metric: 'PAC_LIFT',
      withPAC,
      withoutPAC,
      lift,
      targetLift: 20,
      onTrack: lift >= 20,
      sampleSize: {
        withPAC: parseInt(highPAC?.total_matches || '0'),
        withoutPAC: parseInt(lowPAC?.total_matches || '0'),
      },
      calculatedAt: new Date(),
    };
  } catch (error) {
    log.error('metrics.pac_lift.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ============================================================================
// SYSTEM USABILITY SCALE (SUS)
// ============================================================================

/**
 * Calculate SUS: System usability score from surveys
 * PRD Target: ≥75 (above average)
 */
export async function calculateSUS(startDate?: Date, endDate?: Date): Promise<SUSResult> {
  try {
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const result = await db.execute(sql`
      SELECT
        AVG((properties->>'total_score')::float) as avg_score,
        COUNT(*) as responses
      FROM analytics_events
      WHERE event_type = 'sus_survey_completed'
        AND occurred_at >= ${start.toISOString()}
        AND occurred_at <= ${end.toISOString()}
    `);

    const row = (getRows(result)[0] ?? {}) as any;
    const avgScore = parseFloat(row.avg_score || '0');
    const responses = parseInt(row.responses || '0');

    log.info('metrics.sus.calculated', {
      avgScore,
      responses,
    });

    return {
      metric: 'SUS',
      value: avgScore,
      unit: 'score',
      target: 75,
      onTrack: avgScore >= 75,
      responses,
      sampleSize: responses,
      calculatedAt: new Date(),
    };
  } catch (error) {
    log.error('metrics.sus.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ============================================================================
// WELL-BEING DELTA
// ============================================================================

/**
 * Calculate Well-Being Delta: Change in user well-being over time
 * PRD Target: ≥70% of users show improvement
 */
export async function calculateWellBeingDelta(
  startDate?: Date,
  endDate?: Date
): Promise<WellBeingDeltaResult> {
  try {
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Get first and last checkin for each user
    const result = await db.execute(sql`
      WITH ranked_checkins AS (
        SELECT
          user_id,
          (properties->>'overall_score')::float as score,
          properties->'dimensions' as dimensions,
          occurred_at,
          ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY occurred_at ASC) as first_rank,
          ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY occurred_at DESC) as last_rank
        FROM analytics_events
        WHERE event_type = 'wellbeing_checkin'
          AND occurred_at >= ${start.toISOString()}
          AND occurred_at <= ${end.toISOString()}
      ),
      first_last AS (
        SELECT
          user_id,
          MAX(CASE WHEN first_rank = 1 THEN score END) as first_score,
          MAX(CASE WHEN last_rank = 1 THEN score END) as last_score
        FROM ranked_checkins
        GROUP BY user_id
        HAVING COUNT(*) >= 2
      )
      SELECT
        AVG(last_score - first_score) as avg_delta,
        COUNT(*) as sample_size,
        SUM(CASE WHEN last_score > first_score THEN 1 ELSE 0 END) as improved_count
      FROM first_last
    `);

    const row = (getRows(result)[0] ?? {}) as any;
    const avgDelta = parseFloat(row.avg_delta || '0');
    const sampleSize = parseInt(row.sample_size || '0');
    const improvedCount = parseInt(row.improved_count || '0');
    const positiveChange = sampleSize > 0 ? (improvedCount / sampleSize) * 100 : 0;

    log.info('metrics.wellbeing_delta.calculated', {
      avgDelta,
      positiveChange,
      sampleSize,
    });

    return {
      metric: 'WELLBEING_DELTA',
      averageDelta: avgDelta,
      byDimension: {}, // TODO: Calculate per dimension if needed
      positiveChange,
      target: 70,
      onTrack: positiveChange >= 70,
      sampleSize,
      calculatedAt: new Date(),
    };
  } catch (error) {
    log.error('metrics.wellbeing_delta.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ============================================================================
// CONSOLIDATED METRICS
// ============================================================================

/**
 * Calculate all key metrics at once
 */
export async function calculateAllMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  ttfqi: TTFQIResult;
  ttv: TTVResult;
  ttsc: TTSCResult;
  pacLift: PACLiftResult;
  sus: SUSResult;
  wellBeingDelta: WellBeingDeltaResult;
}> {
  const [ttfqi, ttv, ttsc, pacLift, sus, wellBeingDelta] = await Promise.all([
    calculateTTFQI(undefined, startDate, endDate),
    calculateTTV(undefined, startDate, endDate),
    calculateTTSC(undefined, startDate, endDate),
    calculatePACLift(startDate, endDate),
    calculateSUS(startDate, endDate),
    calculateWellBeingDelta(startDate, endDate),
  ]);

  return {
    ttfqi,
    ttv,
    ttsc,
    pacLift,
    sus,
    wellBeingDelta,
  };
}

// ============================================================================
// FAIRNESS GAP (placeholder to unblock build)
// ============================================================================

export type FairnessGapResult = {
  cohortA: { name: string; introductionRate: number; contractRate: number; sampleSize: number };
  cohortB: { name: string; introductionRate: number; contractRate: number; sampleSize: number };
  gap: number;
  pValue: number;
  isSignificant: boolean;
  confidence: 'high' | 'medium' | 'low';
};

function normalCdf(value: number): number {
  // Abramowitz and Stegun approximation.
  const abs = Math.abs(value);
  const t = 1 / (1 + 0.2316419 * abs);
  const d = 0.3989423 * Math.exp((-value * value) / 2);
  const probability =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + 1.330274 * t))));
  return value > 0 ? 1 - probability : probability;
}

function twoProportionPValue(successA: number, totalA: number, successB: number, totalB: number) {
  if (totalA === 0 || totalB === 0) {
    return 1;
  }

  const pooled = (successA + successB) / (totalA + totalB);
  const denominator = Math.sqrt(pooled * (1 - pooled) * (1 / totalA + 1 / totalB));
  if (denominator === 0) {
    return 1;
  }

  const z = (successA / totalA - successB / totalB) / denominator;
  const pOneTail = 1 - normalCdf(Math.abs(z));
  return Math.max(0, Math.min(1, pOneTail * 2));
}

function inferConfidence(sampleSizeA: number, sampleSizeB: number): 'high' | 'medium' | 'low' {
  const minSample = Math.min(sampleSizeA, sampleSizeB);
  if (minSample >= 100) return 'high';
  if (minSample >= 40) return 'medium';
  return 'low';
}

async function querySingleCohortAnalytics(cohort: string, startIso: string, endIso: string) {
  const result = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE e.event_type = 'match_generated')::int as generated,
      COUNT(*) FILTER (WHERE e.event_type = 'match_introduced')::int as introduced,
      COUNT(*) FILTER (WHERE e.event_type = 'contract_signed')::int as contracted
    FROM analytics_events e
    INNER JOIN demographic_opt_ins d ON d.profile_id = e.user_id
    WHERE d.opted_in = true
      AND (
        LOWER(COALESCE(d.gender, '')) = LOWER(${cohort})
        OR LOWER(COALESCE(d.ethnicity, '')) = LOWER(${cohort})
        OR LOWER(COALESCE(d.age_range, '')) = LOWER(${cohort})
      )
      AND e.created_at >= ${startIso}
      AND e.created_at <= ${endIso}
  `);

  const row = (getRows(result)[0] ?? {}) as {
    generated?: number | string | null;
    introduced?: number | string | null;
    contracted?: number | string | null;
  };

  return {
    generated: Number(row.generated || 0),
    introduced: Number(row.introduced || 0),
    contracted: Number(row.contracted || 0),
  };
}

export async function calculateFairnessGap(
  cohortA: string,
  cohortB: string,
  startDate?: Date,
  endDate?: Date
): Promise<FairnessGapResult | null> {
  try {
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const [cohortAStats, cohortBStats] = await Promise.all([
      querySingleCohortAnalytics(cohortA, startIso, endIso),
      querySingleCohortAnalytics(cohortB, startIso, endIso),
    ]);

    const toStats = (
      cohortName: string,
      stats: { generated: number; introduced: number; contracted: number }
    ) => {
      const generated = stats.generated;
      const introduced = stats.introduced;
      const contracted = stats.contracted;
      const introductionRate = generated > 0 ? (introduced / generated) * 100 : 0;
      const contractRate = generated > 0 ? (contracted / generated) * 100 : 0;
      return {
        name: cohortName,
        generated,
        introduced,
        contracted,
        introductionRate,
        contractRate,
      };
    };

    const statsA = toStats(cohortA, cohortAStats);
    const statsB = toStats(cohortB, cohortBStats);

    if (statsA.generated === 0 || statsB.generated === 0) {
      return null;
    }

    const pValue = twoProportionPValue(
      statsA.introduced,
      statsA.generated,
      statsB.introduced,
      statsB.generated
    );
    const gap = statsA.introductionRate - statsB.introductionRate;
    const confidence = inferConfidence(statsA.generated, statsB.generated);
    const isSignificant = pValue < 0.05 && Math.abs(gap) >= 5;

    log.info('metrics.fairness_gap.calculated', {
      cohortA,
      cohortB,
      gap,
      pValue,
      confidence,
      sampleA: statsA.generated,
      sampleB: statsB.generated,
    });

    return {
      cohortA: {
        name: statsA.name,
        introductionRate: statsA.introductionRate,
        contractRate: statsA.contractRate,
        sampleSize: statsA.generated,
      },
      cohortB: {
        name: statsB.name,
        introductionRate: statsB.introductionRate,
        contractRate: statsB.contractRate,
        sampleSize: statsB.generated,
      },
      gap,
      pValue,
      isSignificant,
      confidence,
    };
  } catch (error) {
    log.error('metrics.fairness_gap.failed', {
      cohortA,
      cohortB,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

function toRate(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

async function calculatePersonaFirstTenMinuteRate(
  onboardingEventType: string,
  actionEventOne: string,
  actionEventTwo: string,
  startIso: string,
  endIso: string
): Promise<FirstTenMinuteActivationRate> {
  const result = await db.execute(sql`
    WITH onboarding AS (
      SELECT
        user_id,
        MIN(created_at) as onboarding_at
      FROM analytics_events
      WHERE event_type = ${onboardingEventType}
        AND user_id IS NOT NULL
        AND created_at >= ${startIso}
        AND created_at <= ${endIso}
      GROUP BY user_id
    ),
    windowed_actions AS (
      SELECT
        o.user_id,
        COALESCE(BOOL_OR(e.event_type = ${actionEventOne}), false) as has_action_one,
        COALESCE(BOOL_OR(e.event_type = ${actionEventTwo}), false) as has_action_two
      FROM onboarding o
      LEFT JOIN analytics_events e
        ON e.user_id = o.user_id
       AND e.created_at >= o.onboarding_at
       AND e.created_at <= (o.onboarding_at + INTERVAL '10 minutes')
       AND e.event_type IN (${actionEventOne}, ${actionEventTwo})
      GROUP BY o.user_id
    )
    SELECT
      COUNT(*)::int as denominator,
      COUNT(*) FILTER (WHERE has_action_one AND has_action_two)::int as numerator
    FROM windowed_actions
  `);

  const row = (getRows(result)[0] ?? {}) as {
    numerator?: number | string | null;
    denominator?: number | string | null;
  };

  const numerator = Number(row.numerator || 0);
  const denominator = Number(row.denominator || 0);

  return {
    numerator,
    denominator,
    rate: toRate(numerator, denominator),
  };
}

export async function calculateFirstTenMinuteActivationMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<FirstTenMinuteActivationMetrics> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const [individual, company] = await Promise.all([
    calculatePersonaFirstTenMinuteRate(
      'individual_onboarding_completed',
      'portfolio_share_link_copied',
      'portfolio_pdf_export_succeeded',
      startIso,
      endIso
    ),
    calculatePersonaFirstTenMinuteRate(
      'organization_onboarding_completed',
      'assignment_template_applied',
      'assignment_publish_succeeded',
      startIso,
      endIso
    ),
  ]);

  return {
    windowMinutes: 10,
    individual,
    company,
    calculatedAt: new Date(),
  };
}

// ============================================================================
// GET ALL (lightweight)
// ============================================================================

export async function getAllMetrics(): Promise<Record<string, any>> {
  try {
    const [ttsc, ttfqi, ttv, pac, firstTenMinuteActivation] = await Promise.all([
      calculateTTSC(),
      calculateTTFQI(),
      calculateTTV(),
      calculatePACLift(),
      calculateFirstTenMinuteActivationMetrics(),
    ]);

    return { ttsc, ttfqi, ttv, pac, firstTenMinuteActivation };
  } catch (error) {
    log.error('metrics.get_all.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { ttsc: null, ttfqi: null, ttv: null, pac: null, firstTenMinuteActivation: null };
  }
}
