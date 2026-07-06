import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import { internalOpsQueueItems } from '@/db/schema';
import { isSchemaCompatibilityError } from '@/lib/db/schemaCompatibility';
import { log } from '@/lib/log';
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

export type InternalOpsQueueDetailField = {
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
};

export type InternalOpsQueueDetail = {
  privacyScope: 'admin_minimum_necessary';
  recordKind: InternalOpsQueueEntityType;
  operatorSummary: string;
  fields: InternalOpsQueueDetailField[];
  flags: string[];
  checklist: string[];
};

export type InternalOpsQueueSummary = {
  id: string;
  queueType: InternalOpsQueueType;
  status: InternalOpsQueueStatus;
  priority: InternalOpsQueuePriority;
  linkedEntityType: InternalOpsQueueEntityType;
  linkedEntityId: string;
  summary: string;
  metadata: Record<string, unknown>;
  detail: InternalOpsQueueDetail;
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
      'Privacy-safe reveal disputes, exception requests, and reveal-flow issues that need operator review.',
  },
  correction_revocation: {
    label: 'Redaction / risky upload',
    description:
      'Redaction holds, risky uploads, contradictions, and trust reversals that need auditable handling.',
  },
  pilot_ops: {
    label: 'Pilot ops',
    description: 'Pilot coordination tasks that keep the assignment-review workflow narrow and moving.',
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

const SAFE_METADATA_KEYS = new Set([
  'assignmentStatus',
  'candidateConsentStatus',
  'claimId',
  'claimLabel',
  'decisionId',
  'decisionState',
  'deletionStatus',
  'disputeState',
  'exportStatus',
  'fallbackSurface',
  'filenameReviewLabel',
  'freshnessState',
  'latestOperatorAction',
  'latestOperatorActionAt',
  'metadataStatus',
  'monitoringStatus',
  'organizationConsentStatus',
  'organizationTrustPageStatus',
  'pendingParty',
  'privacyExceptionType',
  'publicPortfolioStatus',
  'revealStage',
  'reviewReasons',
  'safeForPublic',
  'schemaCompatibilityFallback',
  'safetyReason',
  'safetyStatus',
  'smokeStatus',
  'sourceSurface',
  'sensitivityReason',
  'recommendedRevealGate',
  'recommendedVisibility',
  'trustTier',
  'uploadKind',
  'uploadReviewAction',
  'attachStatus',
  'lifecycleState',
  'uploadedFileAttachStatus',
  'uploadedFileLifecycleState',
  'uploadedFileSafeForPublic',
  'verificationOutcome',
  'verificationStatus',
  'verdict',
  'workflowStatus',
]);

function toMetadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function sanitizeMetadataValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter(
      (item) =>
        item === null ||
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean'
    );
  }

  return undefined;
}

export function sanitizeInternalOpsQueueMetadata(
  metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const safeMetadata: Record<string, unknown> = {};

  Object.entries(metadata ?? {}).forEach(([key, value]) => {
    if (!SAFE_METADATA_KEYS.has(key)) {
      return;
    }

    const safeValue = sanitizeMetadataValue(value);
    if (safeValue !== undefined) {
      safeMetadata[key] = safeValue;
    }
  });

  return safeMetadata;
}

function getString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getBoolean(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'boolean' ? value : null;
}

function getStringList(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function formatBooleanState(value: boolean | null, fallback: string) {
  if (value === null) {
    return fallback;
  }

  return value ? 'Yes' : 'No';
}

function pushField(
  fields: InternalOpsQueueDetailField[],
  label: string,
  value: string | null,
  tone: InternalOpsQueueDetailField['tone'] = 'default'
) {
  if (!value) {
    return;
  }

  fields.push({ label, value, tone });
}

export function buildInternalOpsQueueDetail(
  linkedEntityType: InternalOpsQueueEntityType,
  metadata: Record<string, unknown>
): InternalOpsQueueDetail {
  const fields: InternalOpsQueueDetailField[] = [];
  const flags = getStringList(metadata, 'reviewReasons');
  let operatorSummary = 'Review the linked launch-critical record using minimum necessary data.';
  let checklist = [
    'Open the linked record only when the queue summary is not enough.',
    'Keep notes factual and free of private user content.',
  ];

  switch (linkedEntityType) {
    case 'uploaded_file': {
      operatorSummary =
        'Review upload risk without exposing raw filenames, storage paths, or hidden document context.';
      pushField(
        fields,
        'Filename review label',
        getString(metadata, 'filenameReviewLabel') ?? 'Raw filename withheld',
        getString(metadata, 'filenameReviewLabel') ? 'default' : 'warning'
      );
      pushField(fields, 'Upload kind', getString(metadata, 'uploadKind'));
      pushField(fields, 'Source surface', getString(metadata, 'sourceSurface'));
      pushField(
        fields,
        'Lifecycle',
        getString(metadata, 'uploadedFileLifecycleState') ?? getString(metadata, 'lifecycleState')
      );
      pushField(
        fields,
        'Safety status',
        getString(metadata, 'safetyStatus') ?? getString(metadata, 'safetyReason'),
        'warning'
      );
      pushField(
        fields,
        'Attach status',
        getString(metadata, 'uploadedFileAttachStatus') ?? getString(metadata, 'attachStatus')
      );
      pushField(fields, 'Metadata status', getString(metadata, 'metadataStatus'));
      pushField(fields, 'Sensitivity reason', getString(metadata, 'sensitivityReason'), 'warning');
      pushField(fields, 'Recommended visibility', getString(metadata, 'recommendedVisibility'));
      pushField(fields, 'Recommended reveal gate', getString(metadata, 'recommendedRevealGate'));
      pushField(
        fields,
        'Public-safe flag',
        formatBooleanState(
          getBoolean(metadata, 'uploadedFileSafeForPublic') ??
            getBoolean(metadata, 'safeForPublic'),
          'Not public-safe by default'
        ),
        (getBoolean(metadata, 'uploadedFileSafeForPublic') ?? getBoolean(metadata, 'safeForPublic'))
          ? 'success'
          : 'warning'
      );
      checklist = [
        'Approve only through the upload review action after privacy inspection.',
        'Reject uploads with unsafe metadata, identity-bearing filenames, or unclear provenance.',
        'Do not copy raw filename, object path, or document text into notes.',
      ];
      break;
    }
    case 'verification_request':
    case 'verification_bundle': {
      operatorSummary =
        'Inspect claim-scoped verification progress, corrections, or stale verification checks.';
      pushField(
        fields,
        'Claim',
        getString(metadata, 'claimLabel') ?? getString(metadata, 'claimId')
      );
      pushField(fields, 'Verification status', getString(metadata, 'verificationStatus'));
      pushField(
        fields,
        'Outcome',
        getString(metadata, 'verificationOutcome') ?? getString(metadata, 'verdict')
      );
      pushField(fields, 'Freshness', getString(metadata, 'freshnessState'));
      pushField(fields, 'Dispute state', getString(metadata, 'disputeState'), 'warning');
      checklist = [
        'Keep review claim-scoped.',
        'Escalate contradictions, stale verification, or revocation signals.',
        'Avoid adding identity details unless needed for support.',
      ];
      break;
    }
    case 'conversation':
    case 'match': {
      operatorSummary =
        'Inspect reveal or consent workflow state without exposing participant identity details.';
      pushField(fields, 'Reveal stage', getString(metadata, 'revealStage'));
      pushField(
        fields,
        'Proof-review participant consent',
        getString(metadata, 'candidateConsentStatus')
      );
      pushField(fields, 'Organization consent', getString(metadata, 'organizationConsentStatus'));
      pushField(
        fields,
        'Privacy exception',
        getString(metadata, 'privacyExceptionType'),
        'warning'
      );
      checklist = [
        'Check consent state before supporting reveal workflow issues.',
        'Resolve privacy exceptions before identity-bearing support.',
      ];
      break;
    }
    case 'decision': {
      operatorSummary = 'Inspect decision workflow state needed for launch support.';
      pushField(fields, 'Decision state', getString(metadata, 'decisionState'));
      pushField(
        fields,
        'Proof-review participant consent',
        getString(metadata, 'candidateConsentStatus')
      );
      pushField(fields, 'Export status', getString(metadata, 'exportStatus'));
      checklist = [
        'Support stuck decision workflow without exposing private review notes.',
        'Confirm consent before any reveal-related intervention.',
      ];
      break;
    }
    case 'engagement_verification': {
      operatorSummary =
        'Inspect intro, interview, decision, hire, or engagement verification status.';
      pushField(fields, 'Workflow status', getString(metadata, 'workflowStatus'));
      pushField(fields, 'Pending party', getString(metadata, 'pendingParty'));
      pushField(fields, 'Decision record', getString(metadata, 'decisionId'));
      checklist = [
        'Support only stuck pilot workflow steps.',
        'Keep participant private context out of notes.',
      ];
      break;
    }
    case 'organization': {
      operatorSummary = 'Inspect pilot organization readiness, assignment, and trust page state.';
      pushField(fields, 'Trust tier', getString(metadata, 'trustTier'));
      pushField(fields, 'Assignment status', getString(metadata, 'assignmentStatus'));
      pushField(fields, 'Trust page', getString(metadata, 'organizationTrustPageStatus'));
      checklist = [
        'Limit support to pilot readiness and assignment state.',
        'Do not expand into non-MVP account administration.',
      ];
      break;
    }
    default:
      break;
  }

  pushField(fields, 'Public Page', getString(metadata, 'publicPortfolioStatus'));
  pushField(fields, 'Export status', getString(metadata, 'exportStatus'));
  pushField(fields, 'Deletion status', getString(metadata, 'deletionStatus'));
  pushField(fields, 'Smoke status', getString(metadata, 'smokeStatus'));
  pushField(fields, 'Monitoring status', getString(metadata, 'monitoringStatus'));

  return {
    privacyScope: 'admin_minimum_necessary',
    recordKind: linkedEntityType,
    operatorSummary,
    fields,
    flags,
    checklist,
  };
}

function toSummary(row: typeof internalOpsQueueItems.$inferSelect): InternalOpsQueueSummary {
  const metadata = sanitizeInternalOpsQueueMetadata(toMetadataRecord(row.metadata));

  return {
    id: row.id,
    queueType: row.queueType as InternalOpsQueueType,
    status: row.status as InternalOpsQueueStatus,
    priority: row.priority as InternalOpsQueuePriority,
    linkedEntityType: row.linkedEntityType as InternalOpsQueueEntityType,
    linkedEntityId: row.linkedEntityId,
    summary: row.summary,
    metadata,
    detail: buildInternalOpsQueueDetail(
      row.linkedEntityType as InternalOpsQueueEntityType,
      metadata
    ),
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
  log.warn(`internal_ops_queue.${operation}.compatibility_fallback`, { error });
}

function buildCompatibilityFallbackItem(
  params: Pick<
    Parameters<typeof ensureInternalOpsQueueItem>[0],
    'queueType' | 'linkedEntityType' | 'linkedEntityId' | 'summary' | 'metadata' | 'priority'
  >,
  now: Date
): InternalOpsQueueSummary {
  const metadata = sanitizeInternalOpsQueueMetadata({
    ...(params.metadata ?? {}),
    schemaCompatibilityFallback: true,
    fallbackSurface: 'internal_ops_queue_items',
  });

  return {
    id: `compat-fallback:${params.queueType}:${params.linkedEntityId}`,
    queueType: params.queueType,
    status: 'open',
    priority: params.priority ?? 'normal',
    linkedEntityType: params.linkedEntityType,
    linkedEntityId: params.linkedEntityId,
    summary: params.summary,
    metadata,
    detail: buildInternalOpsQueueDetail(params.linkedEntityType, metadata),
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

export async function getInternalOpsQueueItem(id: string): Promise<InternalOpsQueueSummary | null> {
  try {
    const row = await db.query.internalOpsQueueItems.findFirst({
      where: eq(internalOpsQueueItems.id, id),
    });

    return row ? toSummary(row) : null;
  } catch (error) {
    if (!isInternalOpsQueueCompatibilityError(error)) {
      throw error;
    }

    throw new InternalOpsQueueMutationError(
      'compatibility_fallback_unavailable',
      'Queue detail requires the internal ops queue table to be available.'
    );
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
