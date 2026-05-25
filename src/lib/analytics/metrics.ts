/**
 * Metrics Calculation Library
 *
 * Implements PRD Part 7 Metrics:
 * - TTFQI: Time to First Qualified Introduction
 * - TTV: Time to Video Interview
 * - TTSC: Time to Signed Contract
 * - Proof-fit acceptance lift
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

export interface ProofFitLiftResult {
  metric: 'PROOF_FIT_ACCEPTANCE_LIFT';
  highProofFitAcceptanceRate: number;
  lowProofFitAcceptanceRate: number;
  lift: number; // Percentage increase
  targetLift: number; // PRD: ≥20%
  onTrack: boolean;
  sampleSize: { highProofFit: number; lowProofFit: number };
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
// PROOF-FIT ACCEPTANCE LIFT
// ============================================================================

/**
 * Calculate proof-fit acceptance lift.
 * PRD Target: at least 20% lift in acceptance rate for high-fit matches.
 *
 * The historical event payload used `pac_contribution`; keep reading it for
 * compatibility, but expose the runtime metric through proof-fit terminology.
 */
export async function calculateProofFitLift(
  startDate?: Date,
  endDate?: Date
): Promise<ProofFitLiftResult> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Legacy property buckets retained for compatibility with existing analytics data.
    const result = await db.execute(sql`
      WITH matches_with_proof_fit AS (
        SELECT
          entity_id as match_id,
          CASE
            WHEN (properties->>'pac_contribution')::float >= 0.70 THEN 'high_proof_fit'
            WHEN (properties->>'pac_contribution')::float < 0.30 THEN 'low_proof_fit'
            ELSE 'medium_proof_fit'
          END as proof_fit_bucket
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
        m.proof_fit_bucket,
        COUNT(*) as total_matches,
        COUNT(DISTINCT a.match_id) as accepted_matches,
        (COUNT(DISTINCT a.match_id)::float / COUNT(*)::float) as acceptance_rate
      FROM matches_with_proof_fit m
      LEFT JOIN match_acceptance a ON m.match_id = a.match_id
      WHERE m.proof_fit_bucket IN ('high_proof_fit', 'low_proof_fit')
      GROUP BY m.proof_fit_bucket
    `);

    const rows = getRows(result) as any[];
    const highProofFit = rows.find((r) => r.proof_fit_bucket === 'high_proof_fit');
    const lowProofFit = rows.find((r) => r.proof_fit_bucket === 'low_proof_fit');

    const highProofFitAcceptanceRate = highProofFit
      ? parseFloat(highProofFit.acceptance_rate) * 100
      : 0;
    const lowProofFitAcceptanceRate = lowProofFit
      ? parseFloat(lowProofFit.acceptance_rate) * 100
      : 0;
    const lift =
      lowProofFitAcceptanceRate > 0
        ? ((highProofFitAcceptanceRate - lowProofFitAcceptanceRate) / lowProofFitAcceptanceRate) *
          100
        : 0;

    log.info('metrics.proof_fit_lift.calculated', {
      highProofFitAcceptanceRate,
      lowProofFitAcceptanceRate,
      lift,
      sampleSizeHigh: highProofFit?.total_matches || 0,
      sampleSizeLow: lowProofFit?.total_matches || 0,
    });

    return {
      metric: 'PROOF_FIT_ACCEPTANCE_LIFT',
      highProofFitAcceptanceRate,
      lowProofFitAcceptanceRate,
      lift,
      targetLift: 20,
      onTrack: lift >= 20,
      sampleSize: {
        highProofFit: parseInt(highProofFit?.total_matches || '0'),
        lowProofFit: parseInt(lowProofFit?.total_matches || '0'),
      },
      calculatedAt: new Date(),
    };
  } catch (error) {
    log.error('metrics.proof_fit_lift.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
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
    const [ttsc, ttfqi, ttv, proofFitLift, firstTenMinuteActivation] = await Promise.all([
      calculateTTSC(),
      calculateTTFQI(),
      calculateTTV(),
      calculateProofFitLift(),
      calculateFirstTenMinuteActivationMetrics(),
    ]);

    return { ttsc, ttfqi, ttv, proofFitLift, firstTenMinuteActivation };
  } catch (error) {
    log.error('metrics.get_all.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      ttsc: null,
      ttfqi: null,
      ttv: null,
      proofFitLift: null,
      firstTenMinuteActivation: null,
    };
  }
}
