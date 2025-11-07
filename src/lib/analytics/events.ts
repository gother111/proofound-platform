/**
 * Analytics Event Emission System
 *
 * Centralized event tracking for all key user actions
 * Supports PRD metrics: TTFQI, TTV, TTSC, PAC lift, SUS, Well-Being Delta, Fairness Gap
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';

// ============================================================================
// TYPES
// ============================================================================

export type EventType =
  // Profile events
  | 'profile_created'
  | 'profile_activated'
  | 'profile_updated'
  | 'profile_viewed'

  // Matching events
  | 'match_generated'
  | 'match_viewed'
  | 'match_interested'
  | 'match_introduced'
  | 'match_snoozed'
  | 'match_hidden'

  // Interview events
  | 'interview_scheduled'
  | 'interview_rescheduled'
  | 'interview_completed'
  | 'interview_cancelled'

  // Decision events
  | 'decision_made'
  | 'decision_reminder_sent'

  // Contract events
  | 'contract_offered'
  | 'contract_signed'
  | 'contract_declined'

  // Well-being events
  | 'wellbeing_checkin'
  | 'wellbeing_reflection'
  | 'wellbeing_opt_in'

  // Verification events
  | 'verification_started'
  | 'verification_completed'
  | 'attestation_requested'
  | 'attestation_provided'

  // System events
  | 'first_match_shown'
  | 'sus_survey_completed'
  | 'tour_completed';

export interface AnalyticsEvent {
  eventType: EventType;
  userId: string;
  profileId?: string;
  organizationId?: string;
  entityType?: 'match' | 'interview' | 'contract' | 'profile' | 'assignment';
  entityId?: string;
  properties?: Record<string, any>;
  privacyPartition?: string; // For demographic segmentation (opt-in)
}

// ============================================================================
// EVENT EMISSION
// ============================================================================

/**
 * Emit an analytics event
 * Stores event in database for later metric calculation
 */
export async function emitAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO analytics_events (
        event_type,
        user_id,
        profile_id,
        organization_id,
        entity_type,
        entity_id,
        properties,
        privacy_partition,
        occurred_at
      ) VALUES (
        ${event.eventType},
        ${event.userId},
        ${event.profileId || null},
        ${event.organizationId || null},
        ${event.entityType || null},
        ${event.entityId || null},
        ${JSON.stringify(event.properties || {})},
        ${event.privacyPartition || 'default'},
        NOW()
      )
    `);

    log.info('analytics.event.emitted', {
      eventType: event.eventType,
      userId: event.userId,
      entityId: event.entityId,
    });
  } catch (error) {
    log.error('analytics.event.failed', {
      eventType: event.eventType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - analytics should never break user flows
  }
}

/**
 * Emit event asynchronously (fire and forget)
 * Use for non-critical analytics that shouldn't block requests
 */
export function emitAnalyticsEventAsync(event: AnalyticsEvent): void {
  // Use setImmediate or process.nextTick in Node.js environment
  Promise.resolve().then(() => emitAnalyticsEvent(event));
}

// ============================================================================
// PROFILE EVENTS
// ============================================================================

export async function emitProfileCreated(userId: string, properties?: Record<string, any>) {
  await emitAnalyticsEvent({
    eventType: 'profile_created',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: userId,
    properties,
  });
}

export async function emitProfileActivated(
  userId: string,
  activationDurationMs: number,
  properties?: Record<string, any>
) {
  await emitAnalyticsEvent({
    eventType: 'profile_activated',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: userId,
    properties: {
      activation_duration_ms: activationDurationMs,
      ...properties,
    },
  });
}

// ============================================================================
// MATCHING EVENTS
// ============================================================================

export async function emitMatchGenerated(
  userId: string,
  matchId: string,
  properties: {
    assignment_id: string;
    score: number;
    pac_contribution?: number;
    subscores?: Record<string, number>;
  }
) {
  await emitAnalyticsEvent({
    eventType: 'match_generated',
    userId,
    profileId: userId,
    entityType: 'match',
    entityId: matchId,
    properties,
  });
}

export async function emitMatchViewed(userId: string, matchId: string) {
  await emitAnalyticsEvent({
    eventType: 'match_viewed',
    userId,
    entityType: 'match',
    entityId: matchId,
  });

  // Check if user has reached 10 matches milestone and trigger SUS survey
  try {
    const { checkTenMatchesMilestone } = await import('@/lib/surveys/sus-triggers');
    await checkTenMatchesMilestone(userId);
  } catch (error) {
    // Don't let survey trigger failure break match viewing
    console.error('Failed to check 10 matches milestone:', error);
  }
}

export async function emitMatchIntroduced(
  userId: string,
  matchId: string,
  properties: {
    assignment_id: string;
    match_id: string;
    ttfqi_hours?: number; // Time to first qualified introduction
  }
) {
  await emitAnalyticsEvent({
    eventType: 'match_introduced',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties,
  });
}

// ============================================================================
// INTERVIEW EVENTS
// ============================================================================

export async function emitInterviewScheduled(
  userId: string,
  interviewId: string,
  properties: {
    interview_id: string;
    assignment_id: string;
    match_id: string;
    duration_minutes: number;
    platform: 'zoom' | 'google_meet';
    days_since_match: number; // For TTV calculation
  }
) {
  await emitAnalyticsEvent({
    eventType: 'interview_scheduled',
    userId,
    entityType: 'interview',
    entityId: interviewId,
    properties,
  });
}

export function emitInterviewScheduledAsync(
  userId: string,
  interviewId: string,
  properties: {
    interview_id: string;
    assignment_id: string;
    match_id: string;
    duration_minutes: number;
    platform: 'zoom' | 'google_meet';
    days_since_match: number;
  }
) {
  emitAnalyticsEventAsync({
    eventType: 'interview_scheduled',
    userId,
    entityType: 'interview',
    entityId: interviewId,
    properties,
  });
}

export async function emitInterviewCompleted(
  userId: string,
  interviewId: string,
  properties?: Record<string, any>
) {
  await emitAnalyticsEvent({
    eventType: 'interview_completed',
    userId,
    entityType: 'interview',
    entityId: interviewId,
    properties,
  });
}

// ============================================================================
// DECISION EVENTS
// ============================================================================

export async function emitDecisionMade(
  userId: string,
  interviewId: string,
  properties: {
    interview_id: string;
    decision: 'hire' | 'advance' | 'hold' | 'reject';
    hours_since_interview: number; // For 48h SLA tracking
    feedback_provided: boolean;
  }
) {
  await emitAnalyticsEvent({
    eventType: 'decision_made',
    userId,
    entityType: 'interview',
    entityId: interviewId,
    properties,
  });
}

// ============================================================================
// CONTRACT EVENTS
// ============================================================================

export async function emitContractSigned(
  userId: string,
  contractId: string,
  properties: {
    contract_id: string;
    assignment_id: string;
    match_id: string;
    ttsc_days?: number; // Time to signed contract (from match)
  }
) {
  await emitAnalyticsEvent({
    eventType: 'contract_signed',
    userId,
    entityType: 'contract',
    entityId: contractId,
    properties,
  });
}

// ============================================================================
// WELL-BEING EVENTS
// ============================================================================

export async function emitWellbeingCheckin(
  userId: string,
  checkinId: string,
  properties: {
    checkin_id: string;
    overall_score: number;
    dimensions: Record<string, number>;
  }
) {
  await emitAnalyticsEvent({
    eventType: 'wellbeing_checkin',
    userId,
    properties,
  });
}

export async function emitWellbeingOptIn(
  userId: string,
  properties: {
    opt_in_type: 'demographic' | 'wellbeing' | 'analytics';
    demographic_fields?: string[];
  }
) {
  await emitAnalyticsEvent({
    eventType: 'wellbeing_opt_in',
    userId,
    properties,
  });
}

// ============================================================================
// SURVEY EVENTS
// ============================================================================

export async function emitSUSCompleted(
  userId: string,
  properties: {
    total_score: number;
    individual_scores: number[];
    trigger_point: string; // When/why survey was shown
  }
) {
  await emitAnalyticsEvent({
    eventType: 'sus_survey_completed',
    userId,
    properties,
  });
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get events for a user within a time range
 */
export async function getUserEvents(
  userId: string,
  startDate: Date,
  endDate: Date,
  eventTypes?: EventType[]
): Promise<any[]> {
  let query = sql`
    SELECT *
    FROM analytics_events
    WHERE user_id = ${userId}
      AND occurred_at >= ${startDate.toISOString()}
      AND occurred_at <= ${endDate.toISOString()}
  `;

  if (eventTypes && eventTypes.length > 0) {
    query = sql`${query} AND event_type = ANY(${eventTypes})`;
  }

  query = sql`${query} ORDER BY occurred_at DESC`;

  const result = await db.execute(query);
  return result.rows as any[];
}

/**
 * Get event count by type
 */
export async function getEventCount(
  eventType: EventType,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM analytics_events
    WHERE event_type = ${eventType}
      AND occurred_at >= ${startDate.toISOString()}
      AND occurred_at <= ${endDate.toISOString()}
  `);

  return parseInt((result.rows[0] as any).count || '0');
}

/**
 * Get unique users with specific event
 */
export async function getUniqueUsersWithEvent(
  eventType: EventType,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(DISTINCT user_id) as count
    FROM analytics_events
    WHERE event_type = ${eventType}
      AND occurred_at >= ${startDate.toISOString()}
      AND occurred_at <= ${endDate.toISOString()}
  `);

  return parseInt((result.rows[0] as any).count || '0');
}
