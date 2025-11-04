/**
 * Analytics Event Emission
 *
 * Helper functions for emitting analytics events
 * Ensures PII scrubbing and schema validation
 */

import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';

export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  orgId?: string;
  entityType?: string;
  entityId?: string;
  properties?: Record<string, any>;
  sessionId?: string;
}

/**
 * PII fields to scrub from event properties
 */
const PII_FIELDS = [
  'email',
  'name',
  'firstName',
  'lastName',
  'phone',
  'phoneNumber',
  'address',
  'ssn',
  'dateOfBirth',
  'creditCard',
  'password',
  'token',
  'accessToken',
  'refreshToken',
];

/**
 * Scrub PII from properties object
 */
function scrubPII(properties: Record<string, any>): Record<string, any> {
  const scrubbed = { ...properties };

  for (const field of PII_FIELDS) {
    if (scrubbed[field]) {
      delete scrubbed[field];
    }
  }

  // Recursively scrub nested objects
  for (const key in scrubbed) {
    if (
      typeof scrubbed[key] === 'object' &&
      scrubbed[key] !== null &&
      !Array.isArray(scrubbed[key])
    ) {
      scrubbed[key] = scrubPII(scrubbed[key]);
    }
  }

  return scrubbed;
}

/**
 * Emit an analytics event
 *
 * @param event - Event data
 * @returns Event ID
 */
export async function emitEvent(event: AnalyticsEvent): Promise<string> {
  try {
    // 1. Validate event schema
    if (!event.eventType || typeof event.eventType !== 'string') {
      throw new Error('eventType is required and must be a string');
    }

    if (event.userId && typeof event.userId !== 'string') {
      throw new Error('userId must be a string');
    }

    if (event.orgId && typeof event.orgId !== 'string') {
      throw new Error('orgId must be a string');
    }

    // 2. Scrub PII from properties
    const scrubbedProperties = event.properties ? scrubPII(event.properties) : {};

    // 3. Insert into analytics_events table
    const [inserted] = await db
      .insert(analyticsEvents)
      .values({
        eventType: event.eventType,
        userId: event.userId || null,
        orgId: event.orgId || null,
        entityType: event.entityType || null,
        entityId: event.entityId || null,
        properties: scrubbedProperties as any,
        sessionId: event.sessionId || null,
        // IP/UA hashing is handled by trackEvent() from analytics.ts
        // These fields are optional and can be set by caller if needed
        createdAt: new Date(),
      })
      .returning({ id: analyticsEvents.id });

    // 4. Return event ID
    if (!inserted?.id) {
      throw new Error('Failed to insert event - no ID returned');
    }

    return inserted.id;
  } catch (error) {
    console.error('Event emission failed:', error);
    console.error('Event details:', {
      eventType: event.eventType,
      userId: event.userId,
      orgId: event.orgId,
      entityType: event.entityType,
      entityId: event.entityId,
    });
    throw error;
  }
}

/**
 * Emit profile activated event
 */
export async function emitProfileActivated(userId: string, properties?: Record<string, any>) {
  return emitEvent({
    eventType: 'profile_activated',
    userId,
    properties: properties || {},
  });
}

/**
 * Emit shortlist generated event
 */
export async function emitShortlistGenerated(
  userId: string,
  assignmentId: string,
  count: number,
  minScore: number
) {
  return emitEvent({
    eventType: 'shortlist_generated',
    userId,
    entityType: 'assignment',
    entityId: assignmentId,
    properties: { count, minScore },
  });
}

/**
 * Emit match viewed event
 */
export async function emitMatchViewed(userId: string, matchId: string, score: number, pac: number) {
  return emitEvent({
    eventType: 'match_viewed',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties: { score, pac },
  });
}

/**
 * Emit match actioned event (introduce/pass/snooze)
 */
export async function emitMatchActioned(
  userId: string,
  matchId: string,
  action: 'introduce' | 'pass' | 'snooze',
  properties?: {
    reason?: string;
    score?: number;
    pac?: number;
    qualificationMet?: boolean;
  }
) {
  return emitEvent({
    eventType: 'match_actioned',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties: { action, ...properties },
  });
}

/**
 * Emit assignment published event
 */
export async function emitAssignmentPublished(
  orgId: string,
  assignmentId: string,
  properties?: Record<string, any>
) {
  return emitEvent({
    eventType: 'assignment_published',
    orgId,
    entityType: 'assignment',
    entityId: assignmentId,
    properties: properties || {},
  });
}

/**
 * Emit assignment step started event
 */
export async function emitAssignmentStepStarted(
  orgId: string,
  assignmentId: string,
  stepNumber: number,
  stepName: string
) {
  return emitEvent({
    eventType: 'assignment_step_started',
    orgId,
    entityType: 'assignment',
    entityId: assignmentId,
    properties: {
      stepNumber,
      stepName,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Emit assignment step completed event
 */
export async function emitAssignmentStepCompleted(
  orgId: string,
  assignmentId: string,
  stepNumber: number,
  stepName: string,
  timeSpentSeconds?: number
) {
  return emitEvent({
    eventType: 'assignment_step_completed',
    orgId,
    entityType: 'assignment',
    entityId: assignmentId,
    properties: {
      stepNumber,
      stepName,
      timeSpentSeconds,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Emit assignment creation started event
 */
export async function emitAssignmentCreationStarted(
  orgId: string,
  assignmentId: string
) {
  return emitEvent({
    eventType: 'assignment_creation_started',
    orgId,
    entityType: 'assignment',
    entityId: assignmentId,
    properties: {
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Emit interview scheduled event
 */
export async function emitInterviewScheduled(
  userId: string,
  matchId: string,
  scheduledAt: Date,
  platform: 'zoom' | 'google-meet'
) {
  return emitEvent({
    eventType: 'interview_scheduled',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties: {
      scheduledAt: scheduledAt.toISOString(),
      platform,
    },
  });
}

/**
 * Emit contract signed event
 */
export async function emitContractSigned(
  userId: string,
  assignmentId: string,
  properties?: Record<string, any>
) {
  return emitEvent({
    eventType: 'contract_signed',
    userId,
    entityType: 'assignment',
    entityId: assignmentId,
    properties: properties || {},
  });
}

/**
 * PRD METRICS TRACKING
 * Functions below implement PRD-specified metrics instrumentation
 */

/**
 * Emit user signup event (start of TTFQI and TTV timers)
 */
export async function emitUserSignup(userId: string, properties?: Record<string, any>) {
  return emitEvent({
    eventType: 'user_signup',
    userId,
    entityType: 'profile',
    entityId: userId,
    properties: properties || {},
  });
}

/**
 * Emit onboarding complete event
 */
export async function emitOnboardingComplete(userId: string, properties?: Record<string, any>) {
  return emitEvent({
    eventType: 'user_onboarding_complete',
    userId,
    entityType: 'profile',
    entityId: userId,
    properties: properties || {},
  });
}

/**
 * Emit first match generated event (internal, when algorithm creates match)
 */
export async function emitFirstMatchGenerated(
  userId: string,
  matchId: string,
  properties?: Record<string, any>
) {
  return emitEvent({
    eventType: 'first_match_generated',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties: properties || {},
  });
}

/**
 * Emit first match shown event (TTFQI completion)
 * This marks the end of Time to First Qualified Introduction
 */
export async function emitFirstMatchShown(
  userId: string,
  matchId: string,
  properties?: Record<string, any>
) {
  return emitEvent({
    eventType: 'first_match_shown',
    userId,
    entityType: 'match',
    entityId: matchId,
    properties: properties || {},
  });
}

/**
 * Emit first offer received event (TTV completion)
 * This marks the end of Time to Value
 */
export async function emitFirstOfferReceived(
  userId: string,
  contractId: string,
  properties?: Record<string, any>
) {
  return emitEvent({
    eventType: 'first_offer_received',
    userId,
    entityType: 'contract',
    entityId: contractId,
    properties: properties || {},
  });
}

/**
 * Emit conversation started event
 */
export async function emitConversationStarted(
  userId: string,
  conversationId: string,
  properties?: Record<string, any>
) {
  return emitEvent({
    eventType: 'conversation_started',
    userId,
    entityType: 'conversation',
    entityId: conversationId,
    properties: properties || {},
  });
}

/**
 * Emit well-being check-in event
 */
export async function emitWellbeingCheckin(userId: string, properties?: Record<string, any>) {
  return emitEvent({
    eventType: 'wellbeing_checkin',
    userId,
    properties: properties || {},
  });
}

/**
 * Emit well-being reflection event
 */
export async function emitWellbeingReflection(userId: string, properties?: Record<string, any>) {
  return emitEvent({
    eventType: 'wellbeing_reflection',
    userId,
    properties: properties || {},
  });
}
