import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import { anonymizeIP, anonymizeUserAgent } from '@/lib/utils/privacy';

/**
 * Analytics Event Tracking System
 * 
 * This module provides GDPR-compliant event tracking by:
 * - Hashing IP addresses and user agents before storage
 * - Tracking key user actions for product metrics
 * - Supporting both authenticated and anonymous events
 * 
 * Reference: 
 * - CROSS_DOCUMENT_PRIVACY_AUDIT.md Section 6.1
 * - CRITICAL_GAPS_IMPLEMENTATION_GUIDE.md Section 2.2
 */

// =============================================================================
// EVENT TYPES (From PRD Section 6 - Key Metrics)
// =============================================================================

export type AnalyticsEventType =
  // Auth events
  | 'signed_up'
  | 'signed_in'
  | 'signed_out'
  // Profile events
  | 'created_profile'
  | 'profile_ready_for_match'
  | 'profile_updated'
  // Matching events
  | 'match_suggested'
  | 'match_viewed'
  | 'match_accepted'
  | 'match_declined'
  // Verification events
  | 'verification_requested'
  | 'verification_completed'
  | 'verification_appealed'
  // Messaging events
  | 'conversation_started'
  | 'conversation_revealed'
  | 'message_sent'
  // Assignment events
  | 'assignment_created'
  | 'assignment_published'
  | 'assignment_closed'
  // Org events
  | 'org_created'
  | 'org_verified'
  | 'org_member_invited'
  // Moderation events
  | 'content_reported'
  | 'moderation_action_taken'
  // Privacy dashboard events (GDPR compliance)
  | 'privacy_dashboard_viewed'
  | 'data_export_requested'
  | 'audit_log_viewed'
  | 'account_deletion_requested'
  | 'account_deletion_cancelled'
  | 'account_deletion_reminder_sent';

// =============================================================================
// CORE TRACKING FUNCTION
// =============================================================================

/**
 * Track an analytics event with GDPR-compliant IP/UA hashing.
 * 
 * This function:
 * 1. Extracts IP address and User Agent from request headers
 * 2. Hashes them using SHA-256 (one-way, irreversible)
 * 3. Stores the event in the database with hashed values
 * 
 * @param eventType - Type of event being tracked
 * @param properties - Additional event metadata (JSON object)
 * @param request - Next.js Request object (to extract IP/UA)
 * @param userId - Optional user ID (for authenticated events)
 * @param orgId - Optional organization ID
 * 
 * @example
 * ```typescript
 * // Track a signup event
 * await trackEvent('signed_up', { method: 'email' }, request, user.id);
 * 
 * // Track a match view
 * await trackEvent('match_viewed', { matchId, score: 0.87 }, request, user.id);
 * ```
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  properties: Record<string, any>,
  request: Request,
  userId?: string,
  orgId?: string
): Promise<void> {
  try {
    // Extract IP address from request headers
    // Try x-forwarded-for first (Vercel/proxy), then x-real-ip, then fallback
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Extract User Agent from request headers
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Hash PII before storage (GDPR Article 4(5) - Pseudonymisation)
    const ipHash = anonymizeIP(ip);
    const userAgentHash = anonymizeUserAgent(userAgent);

    // Extract session ID if available (can be passed in properties)
    const sessionId = (properties.sessionId as string | undefined) || null;

    // Insert event into database
    await db.insert(analyticsEvents).values({
      eventType,
      userId: userId || null,
      orgId: orgId || null,
      properties: properties as any,
      sessionId,
      ipHash, // ✅ Hashed, not raw IP
      userAgentHash, // ✅ Hashed, not raw UA
      createdAt: new Date(),
    });

    // Log to console in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [Analytics] ${eventType}`, {
        userId,
        orgId,
        properties,
        ipHash: ipHash.substring(0, 8) + '...', // Show first 8 chars only
      });
    }
  } catch (error) {
    // Don't throw - analytics failures shouldn't break the app
    // But log the error for monitoring
    console.error('[Analytics] Failed to track event:', {
      eventType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS FOR COMMON EVENTS
// =============================================================================

/**
 * Track user signup event.
 * 
 * @param userId - User ID (from auth system)
 * @param method - Signup method (email, google, linkedin)
 * @param request - Next.js Request object
 */
export async function trackSignUp(
  userId: string,
  method: 'email' | 'google' | 'linkedin',
  request: Request
): Promise<void> {
  await trackEvent('signed_up', { method }, request, userId);
}

/**
 * Track profile creation event.
 * 
 * @param userId - User ID
 * @param persona - User persona type (individual or organization)
 * @param request - Next.js Request object
 */
export async function trackProfileCreated(
  userId: string,
  persona: 'individual' | 'organization',
  request: Request
): Promise<void> {
  await trackEvent('created_profile', { persona }, request, userId);
}

/**
 * Track when profile is ready for matching.
 * 
 * @param userId - User ID
 * @param completionScore - Profile completion percentage (0-100)
 * @param request - Next.js Request object
 */
export async function trackProfileReadyForMatch(
  userId: string,
  completionScore: number,
  request: Request
): Promise<void> {
  await trackEvent('profile_ready_for_match', { completionScore }, request, userId);
}

/**
 * Track match acceptance event.
 * 
 * @param matchId - Match ID
 * @param score - Match score (0-1)
 * @param userId - User ID
 * @param request - Next.js Request object
 */
export async function trackMatchAccepted(
  matchId: string,
  score: number,
  userId: string,
  request: Request
): Promise<void> {
  await trackEvent('match_accepted', { matchId, score }, request, userId);
}

/**
 * Track match decline event.
 * 
 * @param matchId - Match ID
 * @param reason - Optional decline reason
 * @param userId - User ID
 * @param request - Next.js Request object
 */
export async function trackMatchDeclined(
  matchId: string,
  userId: string,
  request: Request,
  reason?: string
): Promise<void> {
  await trackEvent('match_declined', { matchId, reason }, request, userId);
}

/**
 * Track verification completion event.
 * 
 * @param requestId - Verification request ID
 * @param status - Verification status
 * @param userId - User ID (verifier)
 * @param request - Next.js Request object
 */
export async function trackVerificationCompleted(
  requestId: string,
  status: 'accepted' | 'declined' | 'cannot_verify',
  userId: string,
  request: Request
): Promise<void> {
  await trackEvent('verification_completed', { requestId, status }, request, userId);
}

/**
 * Track assignment publication event.
 * 
 * @param assignmentId - Assignment ID
 * @param orgId - Organization ID
 * @param userId - User ID (poster)
 * @param request - Next.js Request object
 */
export async function trackAssignmentPublished(
  assignmentId: string,
  orgId: string,
  userId: string,
  request: Request
): Promise<void> {
  await trackEvent('assignment_published', { assignmentId }, request, userId, orgId);
}

/**
 * Track organization verification event.
 * 
 * @param orgId - Organization ID
 * @param verifierType - Type of verifier (admin, manual, automated)
 * @param request - Next.js Request object
 */
export async function trackOrgVerified(
  orgId: string,
  verifierType: string,
  request: Request
): Promise<void> {
  await trackEvent('org_verified', { verifierType }, request, undefined, orgId);
}

/**
 * Track content report event.
 * 
 * @param entityType - Type of entity being reported (profile, message, assignment)
 * @param entityId - Entity ID
 * @param reason - Report reason
 * @param userId - Reporter user ID
 * @param request - Next.js Request object
 */
export async function trackContentReported(
  entityType: string,
  entityId: string,
  reason: string,
  userId: string,
  request: Request
): Promise<void> {
  await trackEvent('content_reported', { entityType, entityId, reason }, request, userId);
}

// =============================================================================
// PRIVACY DASHBOARD TRACKING (GDPR Compliance)
// =============================================================================

/**
 * Track privacy dashboard view event.
 * 
 * @param userId - User ID
 * @param request - Next.js Request object
 */
export async function trackPrivacyDashboardViewed(
  userId: string,
  request: Request
): Promise<void> {
  await trackEvent('privacy_dashboard_viewed', {}, request, userId);
}

/**
 * Track data export request event.
 * 
 * @param userId - User ID
 * @param dataCategories - Array of data categories being exported
 * @param request - Next.js Request object
 */
export async function trackDataExportRequested(
  userId: string,
  dataCategories: string[],
  request: Request
): Promise<void> {
  await trackEvent('data_export_requested', { dataCategories }, request, userId);
}

/**
 * Track audit log view event.
 * 
 * @param userId - User ID
 * @param eventsViewed - Number of events viewed
 * @param request - Next.js Request object
 */
export async function trackAuditLogViewed(
  userId: string,
  eventsViewed: number,
  request: Request
): Promise<void> {
  await trackEvent('audit_log_viewed', { eventsViewed }, request, userId);
}

/**
 * Track account deletion request event.
 * 
 * @param userId - User ID
 * @param scheduledFor - ISO date string when deletion will occur
 * @param reason - Optional reason for deletion
 * @param request - Next.js Request object
 */
export async function trackAccountDeletionRequested(
  userId: string,
  scheduledFor: string,
  request: Request,
  reason?: string
): Promise<void> {
  await trackEvent('account_deletion_requested', { scheduledFor, reason }, request, userId);
}

/**
 * Track account deletion cancellation event.
 * 
 * @param userId - User ID
 * @param daysRemaining - Number of days remaining in grace period
 * @param request - Next.js Request object
 */
export async function trackAccountDeletionCancelled(
  userId: string,
  daysRemaining: number,
  request: Request
): Promise<void> {
  await trackEvent('account_deletion_cancelled', { daysRemaining }, request, userId);
}

