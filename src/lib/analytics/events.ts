/**
 * Analytics Event Emission System
 *
 * Centralized event tracking for all key user actions
 * Supports PRD metrics: TTFQI, TTV, TTSC, PAC lift, SUS, Well-Being Delta, Fairness Gap
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { getRows } from '@/lib/db/rows';
import { EventType as EventTypeConstants, type EventTypeValue } from '@/lib/analytics/constants';

// ============================================================================
// TYPES
// ============================================================================

export const EVENT_TYPES = Object.values(EventTypeConstants);

export type EventType = EventTypeValue;

export interface AnalyticsEvent {
  eventType: EventType;
  userId?: string;
  profileId?: string;
  organizationId?: string;
  entityType?:
    | 'match'
    | 'interview'
    | 'contract'
    | 'profile'
    | 'assignment'
    | 'page'
    | 'api'
    | 'web_vital'
    | 'custom';
  entityId?: string;
  properties?: Record<string, any>;
  privacyPartition?: string; // For demographic segmentation (opt-in)
  sessionId?: string; // For anonymous session stitching (non-PII)
}

export type WellbeingCheckinSubmittedProps = {
  checkin_id: string;
  scores: { stress: number; control: number };
  from_trigger?: 'manual' | 'rejection' | 'interview' | 'offer';
};

export type WellbeingOptInChangedProps = {
  enabled: boolean;
};

export type ReflectionAddedProps = {
  word_count: number;
  from_trigger?: 'rejection' | 'interview' | 'offer';
};

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
        org_id,
        entity_type,
        entity_id,
        properties,
        privacy_partition,
        session_id,
        occurred_at
      ) VALUES (
        ${event.eventType},
        ${event.userId || null},
        ${event.profileId || null},
        ${event.organizationId || null},
        ${event.organizationId || null},
        ${event.entityType || null},
        ${event.entityId || null},
        ${JSON.stringify(event.properties || {})},
        ${event.privacyPartition || 'default'},
        ${event.sessionId || null},
        NOW()
      )
      ON CONFLICT DO NOTHING
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

/**
 * Lightweight wrapper to emit arbitrary analytics events (fire-and-forget)
 */
export function trackEvent(event: AnalyticsEvent): void {
  emitAnalyticsEventAsync(event);
}

// ============================================================================
// ASSIGNMENT EVENTS
// ============================================================================

export async function emitAssignmentPublished(
  userId: string,
  assignmentId: string,
  organizationId?: string,
  properties?: Record<string, any>
): Promise<void> {
  await emitAnalyticsEvent({
    eventType: 'assignment_published',
    userId,
    organizationId,
    entityType: 'assignment',
    entityId: assignmentId,
    properties,
  });
}

// ============================================================================
// MATCHING EVENTS (additional)
// ============================================================================

export async function emitMatchActioned(
  userId: string,
  matchId: string,
  actionOrProperties:
    | 'accept'
    | 'decline'
    | 'snooze'
    | 'introduce'
    | { action: string; [key: string]: any }
): Promise<void> {
  const properties =
    typeof actionOrProperties === 'string' ? { action: actionOrProperties } : actionOrProperties;

  await emitAnalyticsEvent({
    eventType: 'match_actioned',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties,
  });
}

export async function emitFirstQualifiedIntro(
  userId: string,
  matchId: string,
  assignmentId?: string
): Promise<void> {
  await emitAnalyticsEvent({
    eventType: 'first_qualified_intro',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties: assignmentId ? { assignment_id: assignmentId } : undefined,
  });
}

export function emitFirstQualifiedIntroAsync(
  userId: string,
  matchId: string,
  assignmentId?: string
): void {
  void emitFirstQualifiedIntro(userId, matchId, assignmentId);
}

export async function emitFirstMatchShown(
  userId: string,
  matchId: string,
  properties?: Record<string, any>
): Promise<void> {
  await emitAnalyticsEvent({
    eventType: 'first_match_shown',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties,
  });
}

// ============================================================================
// SKILL PROOF EVENTS
// ============================================================================

export function emitSkillProofAddedAsync(
  userId: string,
  proofId: string,
  skillId?: string,
  properties?: Record<string, any>
): void {
  emitAnalyticsEventAsync({
    eventType: 'skill_proof_added',
    userId,
    entityType: 'profile',
    entityId: proofId,
    properties: { skill_id: skillId, ...properties },
  });
}

export function emitSkillProofDeletedAsync(
  userId: string,
  proofId: string,
  skillId?: string,
  properties?: Record<string, any>
): void {
  emitAnalyticsEventAsync({
    eventType: 'skill_proof_deleted',
    userId,
    entityType: 'profile',
    entityId: proofId,
    properties: { skill_id: skillId, ...properties },
  });
}

export function emitSkillAddedAsync(
  userId: string,
  skillId: string,
  properties?: Record<string, any>
): void {
  emitAnalyticsEventAsync({
    eventType: 'l4_skill_added',
    userId,
    entityType: 'profile',
    entityId: skillId,
    properties,
  });
}

export function emitSkillUpdatedAsync(
  userId: string,
  skillId: string,
  properties?: Record<string, any>
): void {
  emitAnalyticsEventAsync({
    eventType: 'profile_updated',
    userId,
    entityType: 'profile',
    entityId: skillId,
    properties: {
      change: 'skill_updated',
      ...properties,
    },
  });
}

export function emitSkillDeletedAsync(
  userId: string,
  skillId: string,
  properties?: Record<string, any>
): void {
  emitAnalyticsEventAsync({
    eventType: 'profile_updated',
    userId,
    entityType: 'profile',
    entityId: skillId,
    properties: {
      change: 'skill_deleted',
      ...properties,
    },
  });
}

// ============================================================================
// VERIFICATION EVENTS
// ============================================================================

export function emitVerificationRequestedAsync(
  userId: string,
  requestId: string,
  properties?: Record<string, any>
): void {
  emitAnalyticsEventAsync({
    eventType: 'attestation_requested',
    userId,
    entityType: 'profile',
    entityId: requestId,
    properties,
  });
}

export async function emitVerificationProvided(
  userId: string,
  requestId: string,
  properties?: Record<string, any>
): Promise<void> {
  await emitAnalyticsEvent({
    eventType: 'attestation_provided',
    userId,
    entityType: 'profile',
    entityId: requestId,
    properties,
  });
}

// ============================================================================
// SUS / FEEDBACK EVENTS
// ============================================================================

export function emitSUSSurveyCompletedAsync(
  userId: string,
  scoreOrProperties:
    | number
    | {
        total_score: number;
        individual_scores?: number[];
        trigger_point?: string;
      }
): void {
  const properties =
    typeof scoreOrProperties === 'number'
      ? { score: scoreOrProperties }
      : {
          score: scoreOrProperties.total_score,
          ...scoreOrProperties,
        };

  emitAnalyticsEventAsync({
    eventType: 'sus_survey_completed',
    userId,
    entityType: 'profile',
    entityId: userId,
    properties,
  });
}

// ============================================================================
// PRIVACY EVENTS
// ============================================================================

export function emitVisibilityChanged(
  userId: string,
  field: string,
  visibility: 'public' | 'network' | 'private'
): void {
  emitAnalyticsEventAsync({
    eventType: 'visibility_changed',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: userId,
    properties: { field, visibility },
  });
}

export function emitRedactModeToggled(userId: string, enabled: boolean): void {
  emitAnalyticsEventAsync({
    eventType: 'redact_mode_toggled',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: userId,
    properties: { enabled },
  });
}

// ============================================================================
// TOUR EVENTS
// ============================================================================

export async function emitTourStarted(userId: string): Promise<void> {
  await emitAnalyticsEvent({
    eventType: 'tour_started',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: userId,
  });
}

export async function emitTourCompleted(userId: string): Promise<void> {
  await emitAnalyticsEvent({
    eventType: 'tour_completed',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: userId,
  });
}

export async function emitTourSkipped(userId: string): Promise<void> {
  await emitAnalyticsEvent({
    eventType: 'tour_skipped',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: userId,
  });
}

// ============================================================================
// CLIENT TRACK BRIDGE
// ============================================================================

export async function emitEvent(event: {
  eventType: EventType;
  userId?: string;
  orgId?: string;
  entityType?: string;
  entityId?: string;
  properties?: Record<string, any>;
  sessionId?: string;
}): Promise<string> {
  await emitAnalyticsEvent({
    eventType: event.eventType,
    userId: event.userId,
    organizationId: event.orgId,
    entityType: event.entityType as any,
    entityId: event.entityId,
    properties: event.properties,
    sessionId: event.sessionId,
  });
  return 'ok';
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

export function emitProfileActivatedAsync(
  userId: string,
  activationDurationMs: number,
  properties?: Record<string, any>
): void {
  emitAnalyticsEventAsync({
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
    platform: 'zoom' | 'google_meet' | 'manual';
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
    platform: 'zoom' | 'google_meet' | 'manual';
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
    contract_id?: string;
    assignment_id?: string;
    match_id?: string;
    ttsc_days?: number; // Time to signed contract (from match)
    contract_type?: string;
    days_since_activation?: number;
    days_since_first_intro?: number;
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

// Preferred zen hub check-in event with explicit partition and trigger context
export async function emitWellbeingCheckinSubmitted(
  userId: string,
  properties: WellbeingCheckinSubmittedProps
) {
  await emitAnalyticsEvent({
    eventType: 'wellbeing_checkin_submitted',
    userId,
    properties,
    privacyPartition: 'wellbeing',
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

// Updated opt-in flag for Zen Hub (private partition)
export async function emitWellbeingOptInChanged(
  userId: string,
  properties: WellbeingOptInChangedProps
) {
  await emitAnalyticsEvent({
    eventType: 'wellbeing_opt_in_changed',
    userId,
    properties,
    privacyPartition: 'wellbeing',
  });
}

export async function emitReflectionAdded(userId: string, properties: ReflectionAddedProps) {
  await emitAnalyticsEvent({
    eventType: 'reflection_added',
    userId,
    properties,
    privacyPartition: 'wellbeing',
  });
}

export async function emitPrivacyBannerAcknowledged(userId: string) {
  await emitAnalyticsEvent({
    eventType: 'privacy_banner_acknowledged',
    userId,
    properties: {},
    privacyPartition: 'wellbeing',
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
  return getRows(result) as any[];
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

  return parseInt((getRows(result)[0] as any)?.count || '0');
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

  return parseInt((getRows(result)[0] as any)?.count || '0');
}
