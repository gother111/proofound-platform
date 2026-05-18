import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, desc, eq, notInArray, sql } from 'drizzle-orm';
import { analyticsEvents, revealEvents } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';
import { db } from '@/db';

export const dynamic = 'force-dynamic';

// Validation schema for query parameters
const AuditLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const USER_VISIBLE_AUDIT_EVENT_EXCLUSIONS = ['performance_metric', 'web_vital'];

/**
 * GET /api/user/audit-log
 *
 * GDPR Article 15 (Right to Access) - Audit Log
 *
 * Fetches recent user activity from the user_audit_log view (backed by analytics_events)
 * Returns last 50 events by default with pagination support
 *
 * Query params:
 * - limit: Number of events to return (default: 50, max: 200)
 * - offset: Pagination offset (default: 0)
 *
 * Response includes:
 * - timestamp: When the action occurred
 * - action: Type of event (e.g., "profile_updated", "match_accepted")
 * - ipHash: Abbreviated hashed IP (first 8 chars + "...")
 * - device: Parsed device info from user agent hash
 * - metadata: Additional event details
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = AuditLogQuerySchema.parse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    const [analyticsCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, user.id),
          notInArray(analyticsEvents.eventType, USER_VISIBLE_AUDIT_EVENT_EXCLUSIONS)
        )
      );
    const [revealCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(revealEvents)
      .where(eq(revealEvents.profileId, user.id));

    const totalEvents =
      Number(analyticsCountResult.count || 0) + Number(revealCountResult.count || 0);

    const analyticsLogEvents = await db
      .select({
        id: analyticsEvents.id,
        timestamp: analyticsEvents.createdAt,
        action: analyticsEvents.eventType,
        ipHash: analyticsEvents.ipHash,
        userAgentHash: analyticsEvents.userAgentHash,
        sessionId: analyticsEvents.sessionId,
        entityType: analyticsEvents.entityType,
        entityId: analyticsEvents.entityId,
        properties: analyticsEvents.properties,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, user.id),
          notInArray(analyticsEvents.eventType, USER_VISIBLE_AUDIT_EVENT_EXCLUSIONS)
        )
      )
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(queryParams.limit)
      .offset(queryParams.offset);

    const revealLogEvents = await db
      .select({
        id: revealEvents.id,
        timestamp: revealEvents.occurredAt,
        action: sql<string>`'identity_reveal_event'`,
        ipHash: sql<string>`NULL`,
        userAgentHash: sql<string>`NULL`,
        sessionId: sql<string>`NULL`,
        entityType: sql<string>`'match'`,
        entityId: revealEvents.matchId,
        properties: sql`
          jsonb_build_object(
            'requested_scope', ${revealEvents.requestedScope},
            'granted_scope', ${revealEvents.grantedScope},
            'reason_code', ${revealEvents.reasonCode},
            'source_surface', ${revealEvents.sourceSurface},
            'outcome', ${revealEvents.outcome}
          )
        `,
      })
      .from(revealEvents)
      .where(eq(revealEvents.profileId, user.id))
      .orderBy(desc(revealEvents.occurredAt))
      .limit(queryParams.limit);

    const events = [...analyticsLogEvents, ...revealLogEvents]
      .sort(
        (a, b) => new Date(String(b.timestamp)).getTime() - new Date(String(a.timestamp)).getTime()
      )
      .slice(0, queryParams.limit);

    // Transform events for user-friendly display
    const transformedEvents = events.map((event) => {
      // Abbreviate IP hash for display (first 8 chars + "...")
      const abbreviatedIpHash = event.ipHash ? `${event.ipHash.substring(0, 8)}...` : 'N/A';

      // Parse device from user agent hash (simplified - in production, use a proper UA parser)
      // For now, we'll extract from properties if available, or show hash
      const device =
        event.properties && typeof event.properties === 'object' && 'device' in event.properties
          ? String(event.properties.device)
          : event.userAgentHash
            ? `Device (${event.userAgentHash.substring(0, 8)}...)`
            : 'Unknown';

      // Convert event type to human-readable action
      const humanReadableAction = convertEventTypeToHumanReadable(event.action);

      return {
        id: event.id,
        timestamp: event.timestamp,
        eventType: event.action,
        eventDescription: humanReadableAction,
        action: humanReadableAction,
        ipHash: abbreviatedIpHash,
        device,
        metadata: event.properties,
      };
    });

    // Calculate pagination info
    const hasMore = queryParams.offset + queryParams.limit < totalEvents;

    // Track audit log view
    log.info('privacy.audit_log.viewed', {
      userId: user.id,
      limit: queryParams.limit,
      offset: queryParams.offset,
    });

    return NextResponse.json({
      events: transformedEvents,
      total: totalEvents,
      limit: queryParams.limit,
      offset: queryParams.offset,
      hasMore,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    log.error('privacy.audit_log.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch audit log',
        message: 'An error occurred while fetching your activity log. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * Convert event type to human-readable action description
 */
function convertEventTypeToHumanReadable(eventType: string): string {
  const actionMap: Record<string, string> = {
    // Profile actions
    profile_created: 'Created profile',
    profile_updated: 'Updated profile',
    profile_viewed: 'Viewed profile',
    public_portfolio_viewed: 'Viewed Public Page',
    public_snippet_viewed: 'Viewed public snippet',
    public_snippet_unavailable: 'Attempted unavailable public snippet',

    // Skills & expertise
    skill_added: 'Added skill',
    skill_updated: 'Updated skill',
    capability_verified: 'Skill verified',

    // Matching
    match_viewed: 'Viewed match',
    match_accepted: 'Accepted match',
    match_declined: 'Declined match',
    interest_expressed: 'Expressed interest',

    // Messaging
    message_sent: 'Sent message',
    conversation_started: 'Started conversation',
    identity_reveal_event: 'Identity reveal event',

    // Projects
    project_created: 'Created project',
    project_updated: 'Updated project',

    // Auth
    signed_in: 'Signed in',
    signed_out: 'Signed out',
    password_changed: 'Changed password',

    // Privacy
    data_exported: 'Downloaded data',
    account_deletion_requested: 'Requested account deletion',
    account_deletion_cancelled: 'Cancelled account deletion',

    // Analytics
    page_view: 'Viewed page',
  };

  return (
    actionMap[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
