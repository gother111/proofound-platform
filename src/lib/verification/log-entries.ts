import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { verificationLogEntries } from '@/db/schema';
import type { WorkflowActorType, VerificationWorkflowState } from '@/lib/workflow/contracts';

type VerificationLogEntryType = (typeof verificationLogEntries.$inferInsert)['entryType'];

export function deriveVerificationLogEntryType(params: {
  fromState?: VerificationWorkflowState | null;
  toState?: VerificationWorkflowState | null;
  trigger: string;
}): VerificationLogEntryType {
  if (!params.fromState && params.toState === 'pending') {
    return 'record_created';
  }

  if (params.toState === 'expired') {
    return 'expired';
  }

  if (params.toState === 'downgraded') {
    return 'downgraded';
  }

  if (params.toState === 'revoked') {
    return 'revoked';
  }

  if (params.toState === 'superseded') {
    return 'superseded';
  }

  if (
    params.toState === 'verified' &&
    params.fromState &&
    ['expired', 'downgraded', 'contradicted', 'disputed', 'revoked'].includes(params.fromState)
  ) {
    return 'restored';
  }

  if (params.toState === 'pending' && params.trigger === 'verification_requested') {
    return 'refresh_requested';
  }

  return 'state_transition';
}

export async function appendVerificationLogEntry(params: {
  verificationRecordId: string;
  entryType: VerificationLogEntryType;
  fromStatus?: VerificationWorkflowState | null;
  toStatus?: VerificationWorkflowState | null;
  reasonCode?: string | null;
  actorType: WorkflowActorType;
  actorId?: string | null;
  relatedContradictionId?: string | null;
  relatedDisputeId?: string | null;
  relatedVerificationRecordId?: string | null;
  recomputeBatchId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}) {
  const latestEntry = await db.query.verificationLogEntries.findFirst({
    where: eq(verificationLogEntries.verificationRecordId, params.verificationRecordId),
    orderBy: [desc(verificationLogEntries.sequenceNumber)],
  });

  const [entry] = await db
    .insert(verificationLogEntries)
    .values({
      verificationRecordId: params.verificationRecordId,
      sequenceNumber: (latestEntry?.sequenceNumber ?? 0) + 1,
      entryType: params.entryType,
      fromStatus: params.fromStatus ?? null,
      toStatus: params.toStatus ?? null,
      reasonCode: params.reasonCode ?? null,
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      relatedContradictionId: params.relatedContradictionId ?? null,
      relatedDisputeId: params.relatedDisputeId ?? null,
      relatedVerificationRecordId: params.relatedVerificationRecordId ?? null,
      recomputeBatchId: params.recomputeBatchId ?? null,
      metadata: params.metadata ?? {},
      occurredAt: params.occurredAt ?? new Date(),
    })
    .returning();

  return entry;
}

export async function appendVerificationTransitionLogEntry(params: {
  verificationRecordId: string;
  fromState?: VerificationWorkflowState | null;
  toState: VerificationWorkflowState;
  trigger: string;
  reasonCode?: string | null;
  actorType: WorkflowActorType;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}) {
  return appendVerificationLogEntry({
    verificationRecordId: params.verificationRecordId,
    entryType: deriveVerificationLogEntryType({
      fromState: params.fromState ?? null,
      toState: params.toState,
      trigger: params.trigger,
    }),
    fromStatus: params.fromState ?? null,
    toStatus: params.toState,
    reasonCode: params.reasonCode ?? null,
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    metadata: {
      ...(params.metadata ?? {}),
      trigger: params.trigger,
    },
    occurredAt: params.occurredAt,
  });
}

export async function appendVerificationContradictionLogEntry(params: {
  verificationRecordId: string;
  contradictionId: string;
  relatedVerificationRecordId?: string | null;
  reasonCode?: string | null;
  actorType: WorkflowActorType;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}) {
  return appendVerificationLogEntry({
    verificationRecordId: params.verificationRecordId,
    entryType: 'contradiction_detected',
    toStatus: 'contradicted',
    reasonCode: params.reasonCode ?? null,
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    relatedContradictionId: params.contradictionId,
    relatedVerificationRecordId: params.relatedVerificationRecordId ?? null,
    metadata: params.metadata,
    occurredAt: params.occurredAt,
  });
}

export async function appendVerificationDisputeLogEntry(params: {
  verificationRecordId: string;
  disputeId: string;
  entryType: 'dispute_opened' | 'dispute_updated' | 'dispute_resolved';
  toStatus?: VerificationWorkflowState | null;
  reasonCode?: string | null;
  actorType: WorkflowActorType;
  actorId?: string | null;
  relatedVerificationRecordId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}) {
  return appendVerificationLogEntry({
    verificationRecordId: params.verificationRecordId,
    entryType: params.entryType,
    toStatus: params.toStatus ?? null,
    reasonCode: params.reasonCode ?? null,
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    relatedDisputeId: params.disputeId,
    relatedVerificationRecordId: params.relatedVerificationRecordId ?? null,
    metadata: params.metadata,
    occurredAt: params.occurredAt,
  });
}

export async function appendVerificationRecomputedLogEntry(params: {
  verificationRecordId: string;
  recomputeBatchId: string;
  actorType: WorkflowActorType;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}) {
  return appendVerificationLogEntry({
    verificationRecordId: params.verificationRecordId,
    entryType: 'recomputed',
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    recomputeBatchId: params.recomputeBatchId,
    metadata: params.metadata,
    occurredAt: params.occurredAt,
  });
}
