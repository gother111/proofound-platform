import { NextRequest, NextResponse } from 'next/server';
import { emitEvent, EVENT_TYPES, type EventType } from '@/lib/analytics/events';
import { isActiveOrgMember, isTrustedInternalRequest, requireApiAuth } from '@/lib/api/auth';
import { requireAnalyticsConsentForUser } from '@/lib/privacy/analytics-consent';

type JsonRecord = Record<string, unknown>;

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function readRecord(value: unknown): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as JsonRecord;
}

export async function POST(req: NextRequest) {
  try {
    const body = readRecord(await req.json());

    const rawEventType =
      readString(body.eventType) || readString(body.event_type) || readString(body.event);
    if (!rawEventType) {
      return NextResponse.json({ error: 'event_type or eventType is required' }, { status: 400 });
    }

    const normalizedEventType: EventType = EVENT_TYPES.includes(rawEventType as EventType)
      ? (rawEventType as EventType)
      : 'custom';

    const trustedInternalCall = isTrustedInternalRequest(req);
    const authResult = await requireApiAuth();
    if (!trustedInternalCall && authResult instanceof NextResponse) {
      return authResult;
    }

    const authContext = authResult instanceof NextResponse ? null : authResult;
    const resolvedUserId = trustedInternalCall
      ? readString(body.userId) || readString(body.user_id)
      : authContext!.user.id;

    if (!trustedInternalCall && resolvedUserId) {
      const hasAnalyticsConsent = await requireAnalyticsConsentForUser(resolvedUserId);
      if (!hasAnalyticsConsent) {
        return NextResponse.json(
          { success: true, skipped: 'analytics_consent_missing' },
          { status: 202 }
        );
      }
    }

    let resolvedOrgId: string | undefined;
    const requestedOrgId = readString(body.orgId) || readString(body.org_id);
    if (requestedOrgId) {
      if (trustedInternalCall) {
        resolvedOrgId = requestedOrgId;
      } else if (
        await isActiveOrgMember(authContext!.supabase, authContext!.user.id, requestedOrgId, [
          'owner',
          'admin',
          'member',
        ])
      ) {
        resolvedOrgId = requestedOrgId;
      } else {
        return NextResponse.json(
          { error: 'Forbidden: orgId is not accessible for current user' },
          { status: 403 }
        );
      }
    }

    const mergedProperties: JsonRecord = {
      ...readRecord(body.event_data),
      ...readRecord(body.properties),
    };
    if (normalizedEventType === 'custom') {
      mergedProperties.legacy_event_type = rawEventType;
    }

    const eventId = await emitEvent({
      eventType: normalizedEventType,
      userId: resolvedUserId,
      orgId: resolvedOrgId,
      entityType: readString(body.entityType) || readString(body.entity_type),
      entityId: readString(body.entityId) || readString(body.entity_id),
      properties: mergedProperties,
      sessionId: readString(body.sessionId) || readString(body.session_id),
    });

    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error('Failed to track analytics event via compatibility route:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
