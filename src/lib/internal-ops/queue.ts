import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import { internalOpsQueueItems } from '@/db/schema';
import { isSchemaCompatibilityError } from '@/lib/db/schemaCompatibility';
import type {
  canonicalInternalOpsQueueEntityTypes,
  canonicalInternalOpsQueuePriorities,
  canonicalInternalOpsQueueStatuses,
  canonicalInternalOpsQueueTypes,
  canonicalWorkflowActorTypes,
} from '@/db/schema';

export type InternalOpsQueueType = (typeof canonicalInternalOpsQueueTypes)[number];
export type InternalOpsQueueStatus = (typeof canonicalInternalOpsQueueStatuses)[number];
export type InternalOpsQueuePriority = (typeof canonicalInternalOpsQueuePriorities)[number];
export type InternalOpsQueueEntityType = (typeof canonicalInternalOpsQueueEntityTypes)[number];
export type InternalOpsQueueActorType = (typeof canonicalWorkflowActorTypes)[number];

export type InternalOpsQueueSummary = {
  id: string;
  queueType: InternalOpsQueueType;
  status: InternalOpsQueueStatus;
  priority: InternalOpsQueuePriority;
  linkedEntityType: InternalOpsQueueEntityType;
  linkedEntityId: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export const INTERNAL_OPS_QUEUE_META = {
  verification: {
    label: 'Verification queue',
    description: 'Manual trust review items that need scoped verification follow-up.',
  },
  privacy_reveal_exception: {
    label: 'Privacy / reveal exception queue',
    description: 'Reveal corridor issues that need privacy-safe operator review.',
  },
  correction_revocation: {
    label: 'Correction / revocation queue',
    description: 'Contradictions, corrections, and trust reversals that need auditable handling.',
  },
  pilot_ops: {
    label: 'Pilot ops queue',
    description: 'Pilot coordination tasks that keep the hiring corridor narrow and moving.',
  },
} satisfies Record<
  InternalOpsQueueType,
  {
    label: string;
    description: string;
  }
>;

function toSummary(row: typeof internalOpsQueueItems.$inferSelect): InternalOpsQueueSummary {
  return {
    id: row.id,
    queueType: row.queueType as InternalOpsQueueType,
    status: row.status as InternalOpsQueueStatus,
    priority: row.priority as InternalOpsQueuePriority,
    linkedEntityType: row.linkedEntityType as InternalOpsQueueEntityType,
    linkedEntityId: row.linkedEntityId,
    summary: row.summary,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  };
}

function isInternalOpsQueueCompatibilityError(error: unknown) {
  return isSchemaCompatibilityError(error, {
    relations: ['internal_ops_queue_items'],
    columns: [
      'queue_type',
      'status',
      'priority',
      'linked_entity_type',
      'linked_entity_id',
      'summary',
      'metadata',
      'created_by_actor_type',
      'created_by_actor_id',
      'resolved_at',
      'resolved_by_actor_id',
      'created_at',
      'updated_at',
    ],
  });
}

function warnCompatibilityFallback(operation: 'ensure' | 'list', error: unknown) {
  console.warn(`internal_ops_queue.${operation}.compatibility_fallback`, error);
}

function buildCompatibilityFallbackItem(
  params: Pick<
    Parameters<typeof ensureInternalOpsQueueItem>[0],
    'queueType' | 'linkedEntityType' | 'linkedEntityId' | 'summary' | 'metadata' | 'priority'
  >,
  now: Date
): InternalOpsQueueSummary {
  return {
    id: `compat-fallback:${params.queueType}:${params.linkedEntityId}`,
    queueType: params.queueType,
    status: 'open',
    priority: params.priority ?? 'normal',
    linkedEntityType: params.linkedEntityType,
    linkedEntityId: params.linkedEntityId,
    summary: params.summary,
    metadata: {
      ...(params.metadata ?? {}),
      schemaCompatibilityFallback: true,
      fallbackSurface: 'internal_ops_queue_items',
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    resolvedAt: null,
  };
}

function buildEmptyQueueGroups() {
  return Object.entries(INTERNAL_OPS_QUEUE_META).map(([queueType, meta]) => ({
    id: queueType as InternalOpsQueueType,
    label: meta.label,
    description: meta.description,
    items: [],
    openCount: 0,
  }));
}

export async function ensureInternalOpsQueueItem(params: {
  queueType: InternalOpsQueueType;
  linkedEntityType: InternalOpsQueueEntityType;
  linkedEntityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  priority?: InternalOpsQueuePriority;
  actorType: InternalOpsQueueActorType;
  actorId?: string | null;
}) {
  const now = new Date();
  const nextMetadata = params.metadata ?? {};

  try {
    const existing = await db.query.internalOpsQueueItems.findFirst({
      where: and(
        eq(internalOpsQueueItems.queueType, params.queueType),
        eq(internalOpsQueueItems.linkedEntityType, params.linkedEntityType),
        eq(internalOpsQueueItems.linkedEntityId, params.linkedEntityId),
        inArray(internalOpsQueueItems.status, ['open', 'in_progress'])
      ),
      orderBy: [desc(internalOpsQueueItems.updatedAt)],
    });

    if (existing) {
      const [updated] = await db
        .update(internalOpsQueueItems)
        .set({
          summary: params.summary,
          priority: params.priority ?? existing.priority,
          metadata: {
            ...(existing.metadata as Record<string, unknown> | null),
            ...nextMetadata,
          },
          updatedAt: now,
        })
        .where(eq(internalOpsQueueItems.id, existing.id))
        .returning();

      return toSummary(updated);
    }

    const [inserted] = await db
      .insert(internalOpsQueueItems)
      .values({
        queueType: params.queueType,
        status: 'open',
        priority: params.priority ?? 'normal',
        linkedEntityType: params.linkedEntityType,
        linkedEntityId: params.linkedEntityId,
        summary: params.summary,
        metadata: nextMetadata,
        createdByActorType: params.actorType,
        createdByActorId: params.actorId ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toSummary(inserted);
  } catch (error) {
    if (!isInternalOpsQueueCompatibilityError(error)) {
      throw error;
    }

    warnCompatibilityFallback('ensure', error);
    return buildCompatibilityFallbackItem(params, now);
  }
}

export async function listInternalOpsQueueItems() {
  try {
    const rows = await db.query.internalOpsQueueItems.findMany({
      orderBy: [asc(internalOpsQueueItems.queueType), desc(internalOpsQueueItems.updatedAt)],
    });

    return Object.entries(INTERNAL_OPS_QUEUE_META).map(([queueType, meta]) => {
      const items = rows.filter((row) => row.queueType === queueType).map((row) => toSummary(row));

      return {
        id: queueType as InternalOpsQueueType,
        label: meta.label,
        description: meta.description,
        items,
        openCount: items.filter((item) => item.status === 'open' || item.status === 'in_progress')
          .length,
      };
    });
  } catch (error) {
    if (!isInternalOpsQueueCompatibilityError(error)) {
      throw error;
    }

    warnCompatibilityFallback('list', error);
    return buildEmptyQueueGroups();
  }
}
