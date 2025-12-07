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
  | 'user_signup' // Added missing type

  // Skill events (PRD F3)
  | 'skill_added'
  | 'skill_updated'
  | 'skill_deleted'
  | 'skill_proof_added'
  | 'skill_proof_deleted'

  // Matching events
  | 'match_generated'
  | 'match_viewed'
  | 'match_interested'
  | 'match_introduced'
  | 'match_snoozed'
  | 'match_hidden'
  | 'match_actioned' // Added missing type
  | 'first_match_shown'
  | 'first_qualified_intro' // Added missing type
  | 'ttfqi_warning_emitted'

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
  | 'sus_survey_completed'
  | 'tour_started' // Added missing type
  | 'tour_completed'
  | 'tour_skipped' // Added missing type

  // Assignment events
  | 'assignment_published' // Added missing type

  // Privacy events
  | 'visibility_changed' // Added missing type
  | 'redact_mode_toggled'; // Added missing type

export interface AnalyticsEvent {
  eventType: EventType;
  userId: string;
  profileId?: string;
  organizationId?: string;
  entityType?: 'match' | 'interview' | 'contract' | 'profile' | 'assignment' | 'survey' | 'tour';
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
    // MOCK ANALYTICS FOR LOCAL DEV
    if (process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
      log.info('analytics.event.mocked', {
        eventType: event.eventType,
        userId: event.userId,
        entityId: event.entityId,
        properties: event.properties,
      });
      return;
    }

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

// Alias for emitAnalyticsEvent
export const emitEvent = emitAnalyticsEvent;
export const trackEvent = emitAnalyticsEvent;

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

export async function emitUserSignup(
  userId: string,
  method: string,
  options?: { persona?: string; marketingOptIn?: boolean }
) {
  await emitAnalyticsEvent({
    eventType: 'user_signup',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: userId,
    properties: { method, ...options },
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
) {
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

export async function emitVisibilityChanged(userId: string, field: string, isVisible: boolean) {
  await emitAnalyticsEvent({
    eventType: 'visibility_changed',
    userId,
    entityType: 'profile',
    entityId: userId,
    properties: { field, is_visible: isVisible },
  });
}

export async function emitRedactModeToggled(userId: string, isEnabled: boolean) {
  await emitAnalyticsEvent({
    eventType: 'redact_mode_toggled',
    userId,
    entityType: 'profile',
    entityId: userId,
    properties: { enabled: isEnabled },
  });
}

// ============================================================================
// SKILL EVENTS (PRD F3 - Expertise Atlas)
// ============================================================================

export async function emitSkillAdded(
  userId: string,
  skillId: string,
  properties: {
    skill_code?: string;
    skill_name: string;
    level: number;
    is_custom: boolean;
    total_skills: number;
  }
) {
  await emitAnalyticsEvent({
    eventType: 'skill_added',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: skillId,
    properties,
  });
}

export function emitSkillAddedAsync(
  userId: string,
  skillId: string,
  properties: {
    skill_code?: string;
    skill_name: string;
    level: number;
    is_custom: boolean;
    total_skills: number;
  }
) {
  emitAnalyticsEventAsync({
    eventType: 'skill_added',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: skillId,
    properties,
  });
}

export async function emitSkillUpdated(
  userId: string,
  skillId: string,
  properties: {
    skill_name: string;
    changes: string[];
  }
) {
  await emitAnalyticsEvent({
    eventType: 'skill_updated',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: skillId,
    properties,
  });
}

export function emitSkillUpdatedAsync(
  userId: string,
  skillId: string,
  properties: {
    skill_name: string;
    changes: string[];
  }
) {
  emitAnalyticsEventAsync({
    eventType: 'skill_updated',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: skillId,
    properties,
  });
}

export async function emitSkillDeleted(
  userId: string,
  skillId: string,
  properties: {
    skill_name: string;
    remaining_skills: number;
  }
) {
  await emitAnalyticsEvent({
    eventType: 'skill_deleted',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: skillId,
    properties,
  });
}

export function emitSkillDeletedAsync(
  userId: string,
  skillId: string,
  properties: {
    skill_name: string;
    remaining_skills: number;
  }
) {
  emitAnalyticsEventAsync({
    eventType: 'skill_deleted',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: skillId,
    properties,
  });
}

export async function emitSkillProofAdded(
  userId: string,
  skillId: string,
  proofId: string,
  properties: {
    skill_name: string;
    proof_type: string;
  }
) {
  await emitAnalyticsEvent({
    eventType: 'skill_proof_added',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: proofId,
    properties: {
      skill_id: skillId,
      ...properties,
    },
  });
}

export function emitSkillProofAddedAsync(
  userId: string,
  skillId: string,
  proofId: string,
  properties: {
    skill_name: string;
    proof_type: string;
  }
) {
  emitAnalyticsEventAsync({
    eventType: 'skill_proof_added',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: proofId,
    properties: {
      skill_id: skillId,
      ...properties,
    },
  });
}

export async function emitSkillProofDeleted(
  userId: string,
  skillId: string,
  proofId: string,
  properties: {
    skill_name: string;
    proof_type: string;
  }
) {
  await emitAnalyticsEvent({
    eventType: 'skill_proof_deleted',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: proofId,
    properties: {
      skill_id: skillId,
      ...properties,
    },
  });
}

export function emitSkillProofDeletedAsync(
  userId: string,
  skillId: string,
  proofId: string,
  properties: {
    skill_name: string;
    proof_type: string;
  }
) {
  emitAnalyticsEventAsync({
    eventType: 'skill_proof_deleted',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: proofId,
    properties: {
      skill_id: skillId,
      ...properties,
    },
  });
}

export async function emitVerificationRequested(
  userId: string,
  requestId: string,
  properties: {
    skill_id: string;
    skill_name: string;
    verifier_source: string;
  }
) {
  await emitAnalyticsEvent({
    eventType: 'attestation_requested',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: requestId,
    properties,
  });
}

export function emitVerificationRequestedAsync(
  userId: string,
  requestId: string,
  properties: {
    skill_id: string;
    skill_name: string;
    verifier_source: string;
  }
) {
  emitAnalyticsEventAsync({
    eventType: 'attestation_requested',
    userId,
    profileId: userId,
    entityType: 'profile',
    entityId: requestId,
    properties,
  });
}

export async function emitVerificationProvided(
  requestId: string,
  properties: {
    skill_id: string;
    requester_id: string;
    action: 'accepted' | 'declined';
  }
) {
  await emitAnalyticsEvent({
    eventType: 'attestation_provided',
    userId: properties.requester_id, // Track under requester's profile
    entityType: 'profile',
    entityId: requestId,
    properties,
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

export async function emitFirstQualifiedIntroAsync(
  userId: string,
  matchId: string,
  properties: {
    assignment_id: string;
    match_id: string;
    ttfqi_hours?: number;
  }
) {
  emitAnalyticsEventAsync({
    eventType: 'first_qualified_intro',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties,
  });
}

export async function emitFirstMatchShown(
  userId: string,
  matchId: string,
  metadata?: {
    score?: number;
    mode?: string;
    pac_contribution?: number;
  }
) {
  await emitAnalyticsEvent({
    eventType: 'first_match_shown',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties: metadata,
  });
}

export async function emitMatchActioned(
  userId: string,
  matchId: string,
  action: string,
  reason?: string
) {
  await emitAnalyticsEvent({
    eventType: 'match_actioned',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties: { action, reason },
  });
}

// ============================================================================
// ASSIGNMENT EVENTS
// ============================================================================

export async function emitAssignmentPublished(
  userId: string,
  assignmentId: string,
  organizationId: string,
  properties?: Record<string, any>
) {
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
    entityType: 'survey',
    properties,
  });
}

export function emitSUSSurveyCompletedAsync(
  userId: string,
  properties: {
    total_score: number;
    individual_scores: number[];
    trigger_point: string;
  }
) {
  emitAnalyticsEventAsync({
    eventType: 'sus_survey_completed',
    userId,
    entityType: 'survey',
    properties,
  });
}

// ============================================================================
// TOUR EVENTS
// ============================================================================

export async function emitTourStarted(userId: string, tourId: string) {
  await emitAnalyticsEvent({
    eventType: 'tour_started',
    userId,
    entityType: 'tour',
    entityId: tourId,
  });
}

export async function emitTourCompleted(userId: string, tourId: string) {
  await emitAnalyticsEvent({
    eventType: 'tour_completed',
    userId,
    entityType: 'tour',
    entityId: tourId,
  });
}

export async function emitTourSkipped(userId: string, tourId: string) {
  await emitAnalyticsEvent({
    eventType: 'tour_skipped',
    userId,
    entityType: 'tour',
    entityId: tourId,
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
  return result as any[];
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

  const row = result[0] as any;
  return parseInt(row?.count || '0');
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

  const row = result[0] as any;
  return parseInt(row?.count || '0');
}
