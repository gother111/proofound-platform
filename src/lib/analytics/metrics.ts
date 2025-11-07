/**
 * Analytics Metrics Calculations
 *
 * Calculate PRD-defined metrics from analytics events:
 * - TTFQI (Time-to-First Qualified Introduction)
 * - TTV (Time-to-Value)
 * - TTSC (Time-to-Signed-Contract) - North Star Metric
 * - Well-Being Delta
 * - PAC Lift (Purpose-Alignment Contribution)
 *
 * PRD References:
 * - Part 2: Goals & Success Metrics
 * - Part 7: Functional Requirements
 * - Part 8: Performance (cache for 1 hour)
 */

import { db } from '@/db';
import { analyticsEvents, matches } from '@/db/schema';
import { and, eq, gte, lte, desc, sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import {
  EventType,
  TTFQI_TARGET_HOURS,
  TTV_TARGET_DAYS,
  TTSC_TARGET_DAYS,
  WELLBEING_DELTA_TARGET_PERCENT,
} from './constants';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TTFQIResult {
  userId: string;
  activatedAt: Date;
  firstIntroAt: Date;
  hoursToFirstIntro: number;
}

export interface TTVResult {
  userId: string;
  activatedAt: Date;
  firstInterviewAt: Date;
  daysToFirstInterview: number;
}

export interface TTSCResult {
  userId: string;
  activatedAt: Date;
  contractSignedAt: Date;
  daysToContract: number;
}

export interface WellBeingDeltaResult {
  userId: string;
  periodDays: number;
  startStress: number;
  endStress: number;
  startControl: number;
  endControl: number;
  stressDelta: number;
  controlDelta: number;
  improved: boolean;
}

export interface PACContribution {
  matchId: string;
  overallScore: number;
  pacScore: number;
  skillsScore: number;
  constraintsScore: number;
  verificationScore: number;
  pacPercentage: number; // PAC as % of overall score
}

export interface CohortMetrics {
  cohort: string;
  count: number;
  medianValue: number;
  p75Value: number;
  p95Value: number;
  targetMet: boolean;
}

// ============================================================================
// TTFQI (Time-to-First Qualified Introduction)
// ============================================================================

/**
 * Calculate TTFQI for a specific user
 *
 * Per PRD Part 2: TTFQI = Activation → First Qualified Introduction
 * Target: Median ≤72 hours
 */
export async function calculateTTFQI(userId: string): Promise<TTFQIResult | null> {
  try {
    // Get activation event
    const activationEvent = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          eq(analyticsEvents.eventType, EventType.PROFILE_ACTIVATED)
        )
      )
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(1);

    if (activationEvent.length === 0) {
      return null;
    }

    // Get first qualified intro event
    const firstIntroEvent = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          eq(analyticsEvents.eventType, EventType.FIRST_QUALIFIED_INTRO),
          gte(analyticsEvents.createdAt, activationEvent[0].createdAt)
        )
      )
      .orderBy(analyticsEvents.createdAt)
      .limit(1);

    if (firstIntroEvent.length === 0) {
      return null;
    }

    const activatedAt = activationEvent[0].createdAt;
    const firstIntroAt = firstIntroEvent[0].createdAt;
    const diffMs = firstIntroAt.getTime() - activatedAt.getTime();
    const hoursToFirstIntro = diffMs / (1000 * 60 * 60);

    return {
      userId,
      activatedAt,
      firstIntroAt,
      hoursToFirstIntro,
    };
  } catch (error) {
    log.error('Failed to calculate TTFQI', { error, userId });
    return null;
  }
}

/**
 * Calculate median TTFQI across all users (or cohort)
 */
export async function calculateTTFQIMedian(cohort?: string): Promise<number | null> {
  try {
    // Get all users with both activation and first intro events
    const results = await db.execute<{ hours_to_intro: number }>(sql`
      WITH activations AS (
        SELECT 
          user_id,
          created_at as activated_at
        FROM analytics_events
        WHERE event_type = ${EventType.PROFILE_ACTIVATED}
      ),
      first_intros AS (
        SELECT DISTINCT ON (user_id)
          user_id,
          created_at as first_intro_at
        FROM analytics_events
        WHERE event_type = ${EventType.FIRST_QUALIFIED_INTRO}
        ORDER BY user_id, created_at ASC
      )
      SELECT 
        EXTRACT(EPOCH FROM (fi.first_intro_at - a.activated_at)) / 3600 as hours_to_intro
      FROM activations a
      INNER JOIN first_intros fi ON a.user_id = fi.user_id
      WHERE fi.first_intro_at >= a.activated_at
      ORDER BY hours_to_intro
    `);

    if (results.rows.length === 0) {
      return null;
    }

    const values = results.rows.map((r) => r.hours_to_intro);
    return calculateMedian(values);
  } catch (error) {
    log.error('Failed to calculate TTFQI median', { error, cohort });
    return null;
  }
}

// ============================================================================
// TTV (Time-to-Value)
// ============================================================================

/**
 * Calculate TTV for a specific user
 *
 * Per PRD Part 2: TTV = Activation → First Interview Scheduled
 * Target: Median ≤7 days
 */
export async function calculateTTV(userId: string): Promise<TTVResult | null> {
  try {
    // Get activation event
    const activationEvent = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          eq(analyticsEvents.eventType, EventType.PROFILE_ACTIVATED)
        )
      )
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(1);

    if (activationEvent.length === 0) {
      return null;
    }

    // Get first interview scheduled event
    const firstInterviewEvent = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          eq(analyticsEvents.eventType, EventType.INTERVIEW_SCHEDULED),
          gte(analyticsEvents.createdAt, activationEvent[0].createdAt)
        )
      )
      .orderBy(analyticsEvents.createdAt)
      .limit(1);

    if (firstInterviewEvent.length === 0) {
      return null;
    }

    const activatedAt = activationEvent[0].createdAt;
    const firstInterviewAt = firstInterviewEvent[0].createdAt;
    const diffMs = firstInterviewAt.getTime() - activatedAt.getTime();
    const daysToFirstInterview = diffMs / (1000 * 60 * 60 * 24);

    return {
      userId,
      activatedAt,
      firstInterviewAt,
      daysToFirstInterview,
    };
  } catch (error) {
    log.error('Failed to calculate TTV', { error, userId });
    return null;
  }
}

/**
 * Calculate median TTV across all users
 */
export async function calculateTTVMedian(): Promise<number | null> {
  try {
    const results = await db.execute<{ days_to_interview: number }>(sql`
      WITH activations AS (
        SELECT 
          user_id,
          created_at as activated_at
        FROM analytics_events
        WHERE event_type = ${EventType.PROFILE_ACTIVATED}
      ),
      first_interviews AS (
        SELECT DISTINCT ON (user_id)
          user_id,
          created_at as first_interview_at
        FROM analytics_events
        WHERE event_type = ${EventType.INTERVIEW_SCHEDULED}
        ORDER BY user_id, created_at ASC
      )
      SELECT 
        EXTRACT(EPOCH FROM (fi.first_interview_at - a.activated_at)) / 86400 as days_to_interview
      FROM activations a
      INNER JOIN first_interviews fi ON a.user_id = fi.user_id
      WHERE fi.first_interview_at >= a.activated_at
      ORDER BY days_to_interview
    `);

    if (results.rows.length === 0) {
      return null;
    }

    const values = results.rows.map((r) => r.days_to_interview);
    return calculateMedian(values);
  } catch (error) {
    log.error('Failed to calculate TTV median', { error });
    return null;
  }
}

// ============================================================================
// TTSC (Time-to-Signed-Contract) - NORTH STAR METRIC
// ============================================================================

/**
 * Calculate TTSC for a specific user
 *
 * Per PRD Part 2: TTSC = Activation → Signed Contract (North Star Metric)
 * Target: Median ≤30 days for entry/mid roles
 */
export async function calculateTTSC(userId: string): Promise<TTSCResult | null> {
  try {
    // Get activation event
    const activationEvent = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          eq(analyticsEvents.eventType, EventType.PROFILE_ACTIVATED)
        )
      )
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(1);

    if (activationEvent.length === 0) {
      return null;
    }

    // Get first contract signed event
    const contractEvent = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          eq(analyticsEvents.eventType, EventType.CONTRACT_SIGNED),
          gte(analyticsEvents.createdAt, activationEvent[0].createdAt)
        )
      )
      .orderBy(analyticsEvents.createdAt)
      .limit(1);

    if (contractEvent.length === 0) {
      return null;
    }

    const activatedAt = activationEvent[0].createdAt;
    const contractSignedAt = contractEvent[0].createdAt;
    const diffMs = contractSignedAt.getTime() - activatedAt.getTime();
    const daysToContract = diffMs / (1000 * 60 * 60 * 24);

    return {
      userId,
      activatedAt,
      contractSignedAt,
      daysToContract,
    };
  } catch (error) {
    log.error('Failed to calculate TTSC', { error, userId });
    return null;
  }
}

/**
 * Calculate median TTSC across all users
 */
export async function calculateTTSCMedian(): Promise<number | null> {
  try {
    const results = await db.execute<{ days_to_contract: number }>(sql`
      WITH activations AS (
        SELECT 
          user_id,
          created_at as activated_at
        FROM analytics_events
        WHERE event_type = ${EventType.PROFILE_ACTIVATED}
      ),
      contracts AS (
        SELECT DISTINCT ON (user_id)
          user_id,
          created_at as contract_signed_at
        FROM analytics_events
        WHERE event_type = ${EventType.CONTRACT_SIGNED}
        ORDER BY user_id, created_at ASC
      )
      SELECT 
        EXTRACT(EPOCH FROM (c.contract_signed_at - a.activated_at)) / 86400 as days_to_contract
      FROM activations a
      INNER JOIN contracts c ON a.user_id = c.user_id
      WHERE c.contract_signed_at >= a.activated_at
      ORDER BY days_to_contract
    `);

    if (results.rows.length === 0) {
      return null;
    }

    const values = results.rows.map((r) => r.days_to_contract);
    return calculateMedian(values);
  } catch (error) {
    log.error('Failed to calculate TTSC median', { error });
    return null;
  }
}

// ============================================================================
// WELL-BEING DELTA
// ============================================================================

/**
 * Calculate Well-Being Delta for a user over specified period
 *
 * Per PRD Part 2: Well-Being Delta = change in stress/control over 14/30 days
 * Target: ≥60% show ≥+1 improvement on at least one dimension
 * Per PRD Part 5 (F5): Non-diagnostic, opt-in, private
 */
export async function calculateWellBeingDelta(
  userId: string,
  days: 14 | 30 = 14
): Promise<WellBeingDeltaResult | null> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get check-ins in the period
    const checkins = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          eq(analyticsEvents.eventType, EventType.WELLBEING_CHECKIN),
          gte(analyticsEvents.createdAt, startDate)
        )
      )
      .orderBy(analyticsEvents.createdAt);

    if (checkins.length < 2) {
      // Need at least 2 check-ins to calculate delta
      return null;
    }

    const firstCheckin = checkins[0];
    const lastCheckin = checkins[checkins.length - 1];

    const startStress = (firstCheckin.properties as any)?.stress_level || 3;
    const endStress = (lastCheckin.properties as any)?.stress_level || 3;
    const startControl = (firstCheckin.properties as any)?.control_level || 3;
    const endControl = (lastCheckin.properties as any)?.control_level || 3;

    const stressDelta = endStress - startStress; // Negative is improvement (lower stress)
    const controlDelta = endControl - startControl; // Positive is improvement (more control)

    // Improved if stress decreased by ≥1 OR control increased by ≥1
    const improved = stressDelta <= -1 || controlDelta >= 1;

    return {
      userId,
      periodDays: days,
      startStress,
      endStress,
      startControl,
      endControl,
      stressDelta,
      controlDelta,
      improved,
    };
  } catch (error) {
    log.error('Failed to calculate Well-Being Delta', { error, userId, days });
    return null;
  }
}

/**
 * Calculate percentage of users showing improvement in Well-Being
 *
 * Per PRD Part 2: Target ≥60% show improvement
 */
export async function calculateWellBeingImprovementRate(
  days: 14 | 30 = 14
): Promise<number | null> {
  try {
    // Get all users with well-being opt-in
    const usersWithCheckins = await db.execute<{ user_id: string }>(sql`
      SELECT DISTINCT user_id
      FROM analytics_events
      WHERE event_type = ${EventType.WELLBEING_CHECKIN}
        AND created_at >= NOW() - INTERVAL '${sql.raw(days.toString())} days'
      GROUP BY user_id
      HAVING COUNT(*) >= 2
    `);

    if (usersWithCheckins.rows.length === 0) {
      return null;
    }

    let improvedCount = 0;
    const totalCount = usersWithCheckins.rows.length;

    for (const row of usersWithCheckins.rows) {
      const delta = await calculateWellBeingDelta(row.user_id, days);
      if (delta?.improved) {
        improvedCount++;
      }
    }

    return (improvedCount / totalCount) * 100;
  } catch (error) {
    log.error('Failed to calculate Well-Being improvement rate', { error, days });
    return null;
  }
}

// ============================================================================
// PAC (Purpose-Alignment Contribution)
// ============================================================================

/**
 * Get PAC contribution from a match
 *
 * Per PRD Part 2: PAC = portion of match score from values/causes alignment
 * Per PRD Part 7: Store in matches.subscores JSONB field
 */
export async function getPACContribution(matchId: string): Promise<PACContribution | null> {
  try {
    const match = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);

    if (match.length === 0) {
      return null;
    }

    const matchData = match[0];
    const subscores = matchData.subscores as any;

    if (!subscores) {
      return null;
    }

    const overallScore = matchData.matchScore || 0;
    const pacScore = subscores.purpose_alignment || 0;
    const skillsScore = subscores.skills || 0;
    const constraintsScore = subscores.constraints || 0;
    const verificationScore = subscores.verification || 0;

    const pacPercentage = overallScore > 0 ? (pacScore / overallScore) * 100 : 0;

    return {
      matchId,
      overallScore,
      pacScore,
      skillsScore,
      constraintsScore,
      verificationScore,
      pacPercentage,
    };
  } catch (error) {
    log.error('Failed to get PAC contribution', { error, matchId });
    return null;
  }
}

/**
 * Calculate PAC Lift
 *
 * Per PRD Part 2: Top-decile PAC matches should show ≥20% higher intro acceptance
 */
export async function calculatePACLift(): Promise<{ topDecileLift: number } | null> {
  try {
    // This would require correlation analysis between PAC scores and acceptance rates
    // Simplified version: compare acceptance rate of top 10% PAC vs baseline

    // TODO: Implement full PAC lift calculation
    // For now, return null (requires more match acceptance data)

    return null;
  } catch (error) {
    log.error('Failed to calculate PAC lift', { error });
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate median from array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Calculate percentile from array of numbers
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;

  return sorted[Math.max(0, index)];
}

/**
 * Get cohort metrics for a metric type
 */
export async function getCohortMetrics(
  metricType: 'ttfqi' | 'ttv' | 'ttsc'
): Promise<CohortMetrics[]> {
  // TODO: Implement cohort-based metric aggregation
  // This would group by role family, seniority, geography

  return [];
}
