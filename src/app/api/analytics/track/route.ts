import { NextRequest, NextResponse } from 'next/server';
import { emitEvent, EVENT_TYPES, type EventType } from '@/lib/analytics/events';
import { isActiveOrgMember, isTrustedInternalRequest, requireApiAuth } from '@/lib/api/auth';

/**
 * POST /api/analytics/track
 *
 * Track analytics events from client-side code.
 * Identity is resolved server-side unless request is explicitly trusted-internal.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { eventType, userId, orgId, entityType, entityId, properties, sessionId } = body;

    if (!eventType || typeof eventType !== 'string') {
      return NextResponse.json(
        { error: 'eventType is required and must be a string' },
        { status: 400 }
      );
    }

    if (!EVENT_TYPES.includes(eventType as EventType)) {
      return NextResponse.json({ error: `Invalid eventType: ${eventType}` }, { status: 400 });
    }

    const trustedInternalCall = isTrustedInternalRequest(req);
    const authResult = await requireApiAuth();
    if (!trustedInternalCall && authResult instanceof NextResponse) {
      return authResult;
    }
    const authContext = authResult instanceof NextResponse ? null : authResult;

    const resolvedUserId = trustedInternalCall
      ? typeof userId === 'string'
        ? userId
        : undefined
      : authContext!.user.id;

    let resolvedOrgId: string | undefined;
    if (typeof orgId === 'string' && orgId.trim().length > 0) {
      if (trustedInternalCall) {
        resolvedOrgId = orgId;
      } else if (
        await isActiveOrgMember(authContext!.supabase, authContext!.user.id, orgId, [
          'owner',
          'admin',
          'member',
        ])
      ) {
        resolvedOrgId = orgId;
      } else {
        return NextResponse.json(
          { error: 'Forbidden: orgId is not accessible for current user' },
          { status: 403 }
        );
      }
    }

    const eventId = await emitEvent({
      eventType: eventType as EventType,
      userId: resolvedUserId,
      orgId: resolvedOrgId,
      entityType,
      entityId,
      properties,
      sessionId,
    });

    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
