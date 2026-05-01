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

export type InternalOpsQueueGroup = {
  id: InternalOpsQueueType;
  label: string;
  description: string;
  items: InternalOpsQueueSummary[];
  openCount: number;
};

export const INTERNAL_OPS_QUEUE_META = {
  verification: {
    label: 'Verification',
    description: 'Manual trust review items that need scoped verification follow-up.',
  },
  privacy_reveal_exception: {
    label: 'Privacy / reveal disputes',
    description:
      'Privacy-safe reveal disputes, exception requests, and reveal corridor issues that need operator review.',
  },
  correction_revocation: {
    label: 'Redaction / risky upload',
    description:
      'Redaction holds, risky uploads, contradictions, and trust reversals that need auditable handling.',
  },
  pilot_ops: {
    label: 'Pilot ops',
    description: 'Pilot coordination tasks that keep the hiring corridor narrow and moving.',
  },
} satisfies Record<
  InternalOpsQueueType,
  {
    label: string;
    description: string;
  }
>;

export class InternalOpsQueueMutationError extends Error {
  constructor(
    readonly code:
      | 'not_found'
      | 'invalid_transition'
      | 'note_required'
      | 'compatibility_fallback_unavailable',
    message: string
  ) {
    super(message);
    this.name = 'InternalOpsQueueMutationError';
  }
}

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

function isInternalOpsQueueLegacyEntityConstraintError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const typed = error as { code?: string | number; message?: string; detail?: string | null };
  const code = typeof typed.code === 'string' ? typed.code : String(typed.code ?? '');
  const text = [typed.message, typed.detail]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase();

  return (
    code === '23514' &&
    text.includes('internal_ops_queue_items') &&
    text.includes('linked_entity_type')
  );
}

function isInternalOpsQueueCompatibilityError(error: unknown) {
  return (
    isSchemaCompatibilityError(error, {
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
    }) || isInternalOpsQueueLegacyEntityConstraintError(error)
  );
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

function buildEmptyQueueGroups(): InternalOpsQueueGroup[] {
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

export async function listInternalOpsQueueItems(): Promise<InternalOpsQueueGroup[]> {
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

const INTERNAL_OPS_QUEUE_ALLOWED_TRANSITIONS: Record<
  InternalOpsQueueStatus,
  InternalOpsQueueStatus[]
> = {
  open: ['in_progress', 'resolved', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved: ['open'],
  cancelled: ['open'],
};

export async function transitionInternalOpsQueueItem(params: {
  id: string;
  nextStatus: InternalOpsQueueStatus;
  actorId: string;
  note?: string | null;
}) {
  try {
    if (params.id.startsWith('compat-fallback:')) {
      throw new InternalOpsQueueMutationError(
        'compatibility_fallback_unavailable',
        'Queue mutations require the internal ops queue table to be available.'
      );
    }

    const existing = await db.query.internalOpsQueueItems.findFirst({
      where: eq(internalOpsQueueItems.id, params.id),
    });

    if (!existing) {
      throw new InternalOpsQueueMutationError('not_found', 'Queue item not found.');
    }

    const allowedTransitions =
      INTERNAL_OPS_QUEUE_ALLOWED_TRANSITIONS[existing.status as InternalOpsQueueStatus];

    if (!allowedTransitions.includes(params.nextStatus)) {
      throw new InternalOpsQueueMutationError(
        'invalid_transition',
        `Cannot move queue item from ${existing.status} to ${params.nextStatus}.`
      );
    }

    const trimmedNote = params.note?.trim() ?? null;
    const noteRequired =
      params.nextStatus === 'resolved' ||
      params.nextStatus === 'cancelled' ||
      (params.nextStatus === 'open' &&
        (existing.status === 'resolved' || existing.status === 'cancelled'));

    if (noteRequired && !trimmedNote) {
      throw new InternalOpsQueueMutationError(
        'note_required',
        'An operator note is required for resolve, cancel, and reopen actions.'
      );
    }

    if (existing.linkedEntityType === 'uploaded_file' && params.nextStatus === 'resolved') {
      throw new InternalOpsQueueMutationError(
        'invalid_transition',
        'Uploaded file queue items must be approved or rejected through the upload review action.'
      );
    }

    const now = new Date();
    const nextMetadata = {
      ...((existing.metadata as Record<string, unknown> | null) ?? {}),
      latestOperatorAction:
        params.nextStatus === 'open' && existing.status !== 'open' ? 'reopened' : params.nextStatus,
      latestOperatorActionAt: now.toISOString(),
      latestOperatorActorId: params.actorId,
      ...(trimmedNote ? { latestOperatorNote: trimmedNote } : {}),
    };

    const [updated] = await db
      .update(internalOpsQueueItems)
      .set({
        status: params.nextStatus,
        metadata: nextMetadata,
        resolvedAt:
          params.nextStatus === 'resolved' || params.nextStatus === 'cancelled' ? now : null,
        resolvedByActorId:
          params.nextStatus === 'resolved' || params.nextStatus === 'cancelled'
            ? params.actorId
            : null,
        updatedAt: now,
      })
      .where(eq(internalOpsQueueItems.id, existing.id))
      .returning();

    return {
      previous: toSummary(existing),
      current: toSummary(updated),
      note: trimmedNote,
    };
  } catch (error) {
    if (error instanceof InternalOpsQueueMutationError) {
      throw error;
    }

    if (isInternalOpsQueueCompatibilityError(error)) {
      throw new InternalOpsQueueMutationError(
        'compatibility_fallback_unavailable',
        'Queue mutations require the internal ops queue table to be available.'
      );
    }

    throw error;
  }
}
