import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import {
  analyticsEvents,
  wellbeingCheckins,
  wellbeingOptIns,
  wellbeingReflections,
  zenAuditEvents,
  type WellbeingCheckin,
} from '@/db/schema';

export const ZEN_MILESTONE_TYPES = [
  'rejection',
  'interview',
  'offer',
  'withdrawal',
  'no_show',
] as const;

export type ZenMilestoneType = (typeof ZEN_MILESTONE_TYPES)[number];

export const ZEN_AUDIT_EVENT_TYPES = [
  'zen_opt_in_changed',
  'zen_export_requested',
  'zen_export_completed',
  'zen_delete_requested',
  'zen_delete_completed',
  'zen_checkin_written',
  'zen_reflection_written',
] as const;

export type ZenAuditEventType = (typeof ZEN_AUDIT_EVENT_TYPES)[number];

const MILESTONE_EVENT_MAP = {
  application_rejected: 'rejection',
  decision_made: 'rejection',
  interview_completed: 'interview',
  interview_scheduled: 'interview',
  contract_signed: 'offer',
  intro_workflow_withdrawn: 'withdrawal',
  interview_no_show_recorded: 'no_show',
} as const satisfies Record<string, ZenMilestoneType>;

type ZenAuditMetadata = Record<string, string | number | boolean | null | string[] | undefined>;

function escapeCsv(value: string | number | null | undefined) {
  if (value == null) {
    return '';
  }

  const normalized = String(value);
  if (/[,"\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

export async function getZenOptIn(userId: string) {
  return (
    (await db.query.wellbeingOptIns.findFirst({
      where: eq(wellbeingOptIns.userId, userId),
    })) ?? null
  );
}

export async function requireZenOptIn(userId: string) {
  const optIn = await getZenOptIn(userId);
  return Boolean(optIn?.optedIn);
}

export async function recordZenAuditEvent(input: {
  userId: string;
  eventType: ZenAuditEventType;
  actorType?: 'candidate' | 'organization_member' | 'platform_admin' | 'system' | 'service_account';
  routeSource?: string | null;
  metadata?: ZenAuditMetadata;
}) {
  await db.insert(zenAuditEvents).values({
    userId: input.userId,
    eventType: input.eventType,
    actorType: input.actorType ?? 'candidate',
    routeSource: input.routeSource ?? null,
    metadata: sanitizeZenAuditMetadata(input.metadata),
  });
}

function sanitizeZenAuditMetadata(metadata?: ZenAuditMetadata) {
  if (!metadata) {
    return {};
  }

  const entries = Object.entries(metadata).filter(([, value]) => {
    if (value == null) return true;
    if (typeof value === 'string') return value.length <= 200;
    if (typeof value === 'number' || typeof value === 'boolean') return true;
    if (Array.isArray(value)) return value.every((item) => typeof item === 'string');
    return false;
  });

  return Object.fromEntries(entries);
}

export async function listZenMilestones(userId: string, days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      eventType: analyticsEvents.eventType,
      createdAt: analyticsEvents.createdAt,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.userId, userId),
        inArray(analyticsEvents.eventType, Object.keys(MILESTONE_EVENT_MAP))
      )
    )
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(20);

  return rows
    .filter((row) => row.createdAt >= since)
    .map((row) => ({
      type: MILESTONE_EVENT_MAP[row.eventType as keyof typeof MILESTONE_EVENT_MAP] ?? null,
      occurredAt: row.createdAt,
      sourceEvent: row.eventType,
    }))
    .filter((row): row is { type: ZenMilestoneType; occurredAt: Date; sourceEvent: string } =>
      Boolean(row.type)
    );
}

export function buildZenCheckinsCsv(
  checkins: Array<
    Pick<
      WellbeingCheckin,
      'id' | 'stressLevel' | 'controlLevel' | 'milestoneTriggerId' | 'createdAt'
    >
  >
) {
  const rows = [
    ['id', 'stress_level', 'control_level', 'milestone_type', 'created_at'].join(','),
    ...checkins.map((checkin) =>
      [
        escapeCsv(checkin.id),
        escapeCsv(checkin.stressLevel),
        escapeCsv(checkin.controlLevel),
        escapeCsv(checkin.milestoneTriggerId),
        escapeCsv(checkin.createdAt.toISOString()),
      ].join(',')
    ),
  ];

  return rows.join('\n');
}

export async function buildZenExport(userId: string) {
  const [optIn, checkins, reflections, auditTrail] = await Promise.all([
    getZenOptIn(userId),
    db.query.wellbeingCheckins.findMany({
      where: eq(wellbeingCheckins.userId, userId),
      orderBy: [asc(wellbeingCheckins.createdAt)],
    }),
    db.query.wellbeingReflections.findMany({
      where: eq(wellbeingReflections.userId, userId),
      orderBy: [asc(wellbeingReflections.createdAt)],
    }),
    db.query.zenAuditEvents.findMany({
      where: eq(zenAuditEvents.userId, userId),
      orderBy: [asc(zenAuditEvents.createdAt)],
    }),
  ]);

  return {
    version: 'zen-export/v1',
    exportedAt: new Date().toISOString(),
    privacyBoundary:
      'Zen Hub is private to the individual and excluded from matching, ranking, reveal, fairness, and org analytics.',
    optIn: optIn
      ? {
          optedIn: optIn.optedIn,
          privacyBannerAcknowledged: Boolean(optIn.privacyBannerAcknowledged),
          optedInAt: optIn.optedInAt?.toISOString() ?? null,
          optedOutAt: optIn.optedOutAt?.toISOString() ?? null,
          updatedAt: optIn.updatedAt.toISOString(),
        }
      : null,
    checkins: checkins.map((checkin) => ({
      id: checkin.id,
      stressLevel: checkin.stressLevel,
      controlLevel: checkin.controlLevel,
      milestoneType: checkin.milestoneTriggerId,
      createdAt: checkin.createdAt.toISOString(),
    })),
    reflections: reflections.map((reflection) => ({
      id: reflection.id,
      reflectionText: reflection.reflectionText,
      milestoneType: reflection.milestoneType,
      linkedCheckinId: reflection.linkedCheckinId,
      createdAt: reflection.createdAt.toISOString(),
    })),
    auditTrail: auditTrail.map((event) => ({
      eventType: event.eventType,
      actorType: event.actorType,
      routeSource: event.routeSource,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    })),
    checkinsCsv: buildZenCheckinsCsv(checkins),
  };
}

export async function deleteZenData(userId: string) {
  await db.delete(wellbeingReflections).where(eq(wellbeingReflections.userId, userId));
  await db.delete(wellbeingCheckins).where(eq(wellbeingCheckins.userId, userId));
  await db.delete(wellbeingOptIns).where(eq(wellbeingOptIns.userId, userId));
}
