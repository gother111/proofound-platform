/**
 * Analytics Event Emission
 *
 * Helper functions to emit analytics events for tracking user lifecycle
 * and calculating PRD metrics (TTFQI, TTV, TTSC, PAC, Well-Being Delta).
 *
 * PRD References:
 * - Part 2: Goals & Success Metrics
 * - Part 7: Functional Requirements - Event Tracking
 * - Part 8: Non-Functional Requirements - Performance (async, non-blocking)
 */

import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import { log } from '@/lib/log';
import {
  EventType,
  type EventTypeValue,
  type ProfileActivatedProperties,
  type MatchViewedProperties,
  type MatchActionedProperties,
  type InterviewScheduledProperties,
  type ContractSignedProperties,
  type WellbeingCheckinProperties,
  type SUSSurveyProperties,
} from './constants';

// ============================================================================
// CORE EMIT FUNCTION
// ============================================================================

/**
 * Base event emission function
 *
 * Per PRD Part 8: Event emission must not block user actions (async)
 * Per PRD Part 7: No PII in properties; use IDs/enums
 */
async function emitEvent(
  eventType: EventTypeValue,
  userId: string | null,
  orgId: string | null = null,
  properties: Record<string, unknown> = {},
  entityType: string | null = null,
  entityId: string | null = null
): Promise<void> {
  try {
    await db.insert(analyticsEvents).values({
      eventType,
      userId: userId || undefined,
      orgId: orgId || undefined,
      properties,
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      sessionId: undefined, // Could be populated from request headers
      ipHash: undefined, // Could be populated from request (hashed)
      userAgentHash: undefined, // Could be populated from request (hashed)
    });

    log.info(`Analytics event emitted: ${eventType}`, {
      userId,
      eventType,
      entityType,
      entityId,
    });
  } catch (error) {
    // Never throw - analytics failures should not break user experience
    log.error('Failed to emit analytics event', {
      error,
      eventType,
      userId,
    });
  }
}

/**
 * Non-blocking wrapper for event emission
 * Ensures events are emitted asynchronously without awaiting
 */
export function emitEventAsync(
  eventType: EventTypeValue,
  userId: string | null,
  orgId: string | null = null,
  properties: Record<string, unknown> = {},
  entityType: string | null = null,
  entityId: string | null = null
): void {
  // Fire and forget - don't await
  emitEvent(eventType, userId, orgId, properties, entityType, entityId).catch((error) => {
    log.error('Event emission failed (async)', { error, eventType, userId });
  });
}

// ============================================================================
// PROFILE & ACTIVATION EVENTS
// ============================================================================

/**
 * Emit profile activated event
 *
 * CRITICAL: This marks the start of TTFQI and TTSC tracking
 *
 * Per PRD Part 2: Profile activation = minimum L4 count + matchable status
 * Per PRD Part 7 (F3): Time-to-activation ≤20 minutes P50
 */
export async function emitProfileActivated(
  userId: string,
  properties: ProfileActivatedProperties
): Promise<void> {
  return emitEvent(EventType.PROFILE_ACTIVATED, userId, null, properties, 'profile', userId);
}

/**
 * Non-blocking version
 */
export function emitProfileActivatedAsync(
  userId: string,
  properties: ProfileActivatedProperties
): void {
  emitEventAsync(EventType.PROFILE_ACTIVATED, userId, null, properties, 'profile', userId);
}

/**
 * Emit profile updated event
 */
export function emitProfileUpdated(userId: string, fieldsChanged: string[]): void {
  emitEventAsync(
    EventType.PROFILE_UPDATED,
    userId,
    null,
    { fields_changed: fieldsChanged },
    'profile',
    userId
  );
}

// ============================================================================
// EXPERTISE & SKILLS EVENTS
// ============================================================================

/**
 * Emit L4 skill added event
 */
export function emitL4SkillAdded(
  userId: string,
  skillId: string,
  source: 'manual' | 'suggested' | 'imported',
  level: number,
  visibility: string
): void {
  emitEventAsync(
    EventType.L4_SKILL_ADDED,
    userId,
    null,
    { skill_id: skillId, source, level, visibility },
    'skill',
    skillId
  );
}

/**
 * Emit proof uploaded event
 */
export function emitProofUploaded(
  userId: string,
  skillId: string,
  fileType: string,
  sizeKb: number
): void {
  emitEventAsync(
    EventType.PROOF_UPLOADED,
    userId,
    null,
    { skill_id: skillId, file_type: fileType, size_kb: sizeKb },
    'proof',
    skillId
  );
}

/**
 * Emit CV imported event
 */
export function emitCVImported(userId: string, pages: number, bytes: number): void {
  emitEventAsync(EventType.CV_IMPORTED, userId, null, { pages, bytes }, 'cv', null);
}

// ============================================================================
// MATCHING EVENTS
// ============================================================================

/**
 * Emit shortlist generated event
 */
export function emitShortlistGenerated(
  userId: string,
  count: number,
  minScore: number,
  cohort?: string
): void {
  emitEventAsync(
    EventType.SHORTLIST_GENERATED,
    userId,
    null,
    { count, min_score: minScore, cohort },
    'shortlist',
    null
  );
}

/**
 * Emit match viewed event
 *
 * IMPORTANT: Tracks PAC (Purpose-Alignment Contribution) engagement
 *
 * Per PRD Part 2: PAC tracking for lift measurement
 */
export async function emitMatchViewed(
  userId: string,
  matchId: string,
  properties: MatchViewedProperties
): Promise<void> {
  return emitEvent(EventType.MATCH_VIEWED, userId, null, properties, 'match', matchId);
}

/**
 * Non-blocking version
 */
export function emitMatchViewedAsync(
  userId: string,
  matchId: string,
  properties: MatchViewedProperties
): void {
  emitEventAsync(EventType.MATCH_VIEWED, userId, null, properties, 'match', matchId);
}

/**
 * Emit match actioned event (introduce, pass, snooze)
 */
export function emitMatchActioned(
  userId: string,
  matchId: string,
  properties: MatchActionedProperties
): void {
  emitEventAsync(EventType.MATCH_ACTIONED, userId, null, properties, 'match', matchId);
}

// ============================================================================
// INTRODUCTION EVENTS (TTFQI)
// ============================================================================

/**
 * Emit first qualified introduction event
 *
 * CRITICAL: This marks the end of TTFQI tracking
 *
 * Per PRD Part 2: TTFQI = Activation → First Qualified Introduction
 * Target: Median ≤72 hours
 */
export async function emitFirstQualifiedIntro(
  userId: string,
  matchId: string,
  assignmentId: string
): Promise<void> {
  return emitEvent(
    EventType.FIRST_QUALIFIED_INTRO,
    userId,
    null,
    { match_id: matchId, assignment_id: assignmentId },
    'introduction',
    matchId
  );
}

/**
 * Non-blocking version
 */
export function emitFirstQualifiedIntroAsync(
  userId: string,
  matchId: string,
  assignmentId: string
): void {
  emitEventAsync(
    EventType.FIRST_QUALIFIED_INTRO,
    userId,
    null,
    { match_id: matchId, assignment_id: assignmentId },
    'introduction',
    matchId
  );
}

// ============================================================================
// INTERVIEW EVENTS (TTV)
// ============================================================================

/**
 * Emit interview scheduled event
 *
 * CRITICAL: This marks the end of TTV tracking
 *
 * Per PRD Part 2: TTV = Activation → First Interview Scheduled
 * Target: Median ≤7 days
 *
 * Per PRD Part 4 (I-21): 30-min max, 7-day window from match acceptance
 */
export async function emitInterviewScheduled(
  userId: string,
  interviewId: string,
  properties: InterviewScheduledProperties
): Promise<void> {
  return emitEvent(
    EventType.INTERVIEW_SCHEDULED,
    userId,
    null,
    properties,
    'interview',
    interviewId
  );
}

/**
 * Non-blocking version
 */
export function emitInterviewScheduledAsync(
  userId: string,
  interviewId: string,
  properties: InterviewScheduledProperties
): void {
  emitEventAsync(EventType.INTERVIEW_SCHEDULED, userId, null, properties, 'interview', interviewId);
}

/**
 * Emit interview completed event
 */
export function emitInterviewCompleted(userId: string, interviewId: string): void {
  emitEventAsync(
    EventType.INTERVIEW_COMPLETED,
    userId,
    null,
    { interview_id: interviewId },
    'interview',
    interviewId
  );
}

// ============================================================================
// CONTRACT EVENTS (TTSC)
// ============================================================================

/**
 * Emit contract signed event
 *
 * CRITICAL: This marks the end of TTSC tracking (North Star Metric)
 *
 * Per PRD Part 2: TTSC = Activation → Signed Contract
 * Target: Median ≤30 days for entry/mid roles
 */
export async function emitContractSigned(
  userId: string,
  contractId: string,
  properties: ContractSignedProperties
): Promise<void> {
  return emitEvent(EventType.CONTRACT_SIGNED, userId, null, properties, 'contract', contractId);
}

/**
 * Non-blocking version
 */
export function emitContractSignedAsync(
  userId: string,
  contractId: string,
  properties: ContractSignedProperties
): void {
  emitEventAsync(EventType.CONTRACT_SIGNED, userId, null, properties, 'contract', contractId);
}

// ============================================================================
// ORGANIZATION EVENTS
// ============================================================================

/**
 * Emit assignment published event
 */
export function emitAssignmentPublished(orgId: string, assignmentId: string): void {
  emitEventAsync(
    EventType.ASSIGNMENT_PUBLISHED,
    null,
    orgId,
    { assignment_id: assignmentId },
    'assignment',
    assignmentId
  );
}

// ============================================================================
// WELL-BEING EVENTS (ZEN HUB)
// ============================================================================

/**
 * Emit well-being opt-in event
 */
export function emitWellbeingOptIn(userId: string, enabled: boolean): void {
  emitEventAsync(EventType.WELLBEING_OPT_IN, userId, null, { enabled }, 'wellbeing', null);
}

/**
 * Emit well-being check-in event
 *
 * Per PRD Part 2: Well-Being Delta = change in stress/control over 14/30 days
 * Per PRD Part 5 (F5): Non-diagnostic, opt-in, private-by-default
 */
export async function emitWellbeingCheckin(
  userId: string,
  checkinId: string,
  properties: WellbeingCheckinProperties
): Promise<void> {
  return emitEvent(
    EventType.WELLBEING_CHECKIN,
    userId,
    null,
    properties,
    'wellbeing_checkin',
    checkinId
  );
}

/**
 * Non-blocking version
 */
export function emitWellbeingCheckinAsync(
  userId: string,
  checkinId: string,
  properties: WellbeingCheckinProperties
): void {
  emitEventAsync(
    EventType.WELLBEING_CHECKIN,
    userId,
    null,
    properties,
    'wellbeing_checkin',
    checkinId
  );
}

/**
 * Emit well-being reflection event
 */
export function emitWellbeingReflection(
  userId: string,
  reflectionId: string,
  wordCount: number
): void {
  emitEventAsync(
    EventType.WELLBEING_REFLECTION,
    userId,
    null,
    { word_count: wordCount },
    'wellbeing_reflection',
    reflectionId
  );
}

// ============================================================================
// USABILITY EVENTS
// ============================================================================

/**
 * Emit SUS survey completed event
 *
 * Per PRD Part 2: SUS target ≥75
 */
export async function emitSUSSurveyCompleted(
  userId: string,
  surveyId: string,
  properties: SUSSurveyProperties
): Promise<void> {
  return emitEvent(
    EventType.SUS_SURVEY_COMPLETED,
    userId,
    null,
    properties,
    'sus_survey',
    surveyId
  );
}

/**
 * Non-blocking version
 */
export function emitSUSSurveyCompletedAsync(
  userId: string,
  surveyId: string,
  properties: SUSSurveyProperties
): void {
  emitEventAsync(EventType.SUS_SURVEY_COMPLETED, userId, null, properties, 'sus_survey', surveyId);
}

/**
 * Emit tour events
 */
export function emitTourStarted(userId: string): void {
  emitEventAsync(EventType.TOUR_STARTED, userId, null, {}, 'tour', null);
}

export function emitTourCompleted(userId: string): void {
  emitEventAsync(EventType.TOUR_COMPLETED, userId, null, {}, 'tour', null);
}

export function emitTourSkipped(userId: string, stepNumber: number): void {
  emitEventAsync(EventType.TOUR_SKIPPED, userId, null, { step_number: stepNumber }, 'tour', null);
}

// ============================================================================
// PRIVACY EVENTS
// ============================================================================

/**
 * Emit visibility changed event
 */
export function emitVisibilityChanged(
  userId: string,
  field: string,
  fromVisibility: string,
  toVisibility: string
): void {
  emitEventAsync(
    EventType.VISIBILITY_CHANGED,
    userId,
    null,
    { field, from: fromVisibility, to: toVisibility },
    'privacy',
    null
  );
}

/**
 * Emit redact mode toggled event
 */
export function emitRedactModeToggled(userId: string, enabled: boolean): void {
  emitEventAsync(EventType.REDACT_MODE_TOGGLED, userId, null, { enabled }, 'privacy', null);
}

/**
 * Emit first match shown event (for TTFQI tracking)
 * Used by matching algorithm when first showing matches to a user
 */
export async function emitFirstMatchShown(
  userId: string,
  assignmentId: string,
  properties?: { score?: number; mode?: string }
): Promise<void> {
  await emitEvent(EventType.FIRST_MATCH_SHOWN, userId, null, {
    assignment_id: assignmentId,
    ...properties,
  });
}

/**
 * Generic emit event function (backward compatibility)
 * For new code, use specific emit functions above
 */
export async function emitEvent(eventData: {
  eventType: string;
  userId: string;
  orgId?: string | null;
  entityType?: string;
  entityId?: string;
  properties?: Record<string, any>;
  sessionId?: string;
  ipHash?: string;
  userAgentHash?: string;
}): Promise<void> {
  try {
    await db.insert(analyticsEvents).values({
      eventType: eventData.eventType,
      userId: eventData.userId,
      orgId: eventData.orgId || null,
      entityType: eventData.entityType || null,
      entityId: eventData.entityId || null,
      properties: eventData.properties || {},
      sessionId: eventData.sessionId || null,
      ipHash: eventData.ipHash || null,
      userAgentHash: eventData.userAgentHash || null,
      createdAt: new Date(),
    });
  } catch (error) {
    log.error('emit-event.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType: eventData.eventType,
      userId: eventData.userId,
    });
    throw error;
  }
}
