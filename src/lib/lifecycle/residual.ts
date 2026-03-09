import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  canonicalDeletionLifecycleStates,
  canonicalExportLifecycleStates,
  canonicalMatchLifecycleStates,
  canonicalResidualLifecycleObjectTypes,
  canonicalWorkflowActorTypes,
  dataPortabilityExports,
  profileDeletionRequests,
  residualLifecycleTransitions,
} from '@/db/schema';

export type ResidualLifecycleObjectType = (typeof canonicalResidualLifecycleObjectTypes)[number];
export type ResidualLifecycleActorType = (typeof canonicalWorkflowActorTypes)[number];
export type ExportLifecycleState = (typeof canonicalExportLifecycleStates)[number];
export type DeletionLifecycleState = (typeof canonicalDeletionLifecycleStates)[number];
export type MatchLifecycleState = (typeof canonicalMatchLifecycleStates)[number];

type TransitionInput = {
  objectType: ResidualLifecycleObjectType;
  objectId: string;
  fromState?: string | null;
  toState: string;
  trigger: string;
  reasonCode?: string | null;
  actorType: ResidualLifecycleActorType;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordResidualLifecycleTransition(input: TransitionInput) {
  await db.insert(residualLifecycleTransitions).values({
    objectType: input.objectType,
    objectId: input.objectId,
    fromState: input.fromState ?? null,
    toState: input.toState,
    trigger: input.trigger,
    reasonCode: input.reasonCode ?? null,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function createDataPortabilityExport(params: {
  profileId: string;
  requestedBy?: string | null;
  lifecycleOperationId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const [row] = await db
    .insert(dataPortabilityExports)
    .values({
      profileId: params.profileId,
      requestedBy: params.requestedBy ?? null,
      lifecycleOperationId: params.lifecycleOperationId ?? null,
      lifecycleState: 'requested',
      metadata: params.metadata ?? {},
    })
    .returning();

  await recordResidualLifecycleTransition({
    objectType: 'export',
    objectId: row.id,
    fromState: null,
    toState: 'requested',
    trigger: 'export_requested',
    actorType: 'candidate',
    actorId: params.requestedBy ?? params.profileId,
    metadata: params.metadata,
  });

  return row;
}

export async function updateDataPortabilityExportState(params: {
  exportId: string;
  toState: ExportLifecycleState;
  actorType: ResidualLifecycleActorType;
  actorId?: string | null;
  trigger: string;
  reasonCode?: string | null;
  expiresAt?: Date | null;
  payloadChecksum?: string | null;
  failureCode?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const [existing] = await db
    .select()
    .from(dataPortabilityExports)
    .where(eq(dataPortabilityExports.id, params.exportId))
    .limit(1);

  if (!existing) {
    throw new Error(`Export ${params.exportId} not found`);
  }

  const now = new Date();
  const nextValues: Record<string, unknown> = {
    lifecycleState: params.toState,
    updatedAt: now,
  };

  if (params.toState === 'preparing') {
    nextValues.preparingAt = now;
  }
  if (params.toState === 'ready') {
    nextValues.readyAt = now;
    nextValues.expiresAt = params.expiresAt ?? existing.expiresAt ?? null;
    nextValues.payloadChecksum = params.payloadChecksum ?? existing.payloadChecksum ?? null;
  }
  if (params.toState === 'downloaded') {
    nextValues.downloadedAt = now;
  }
  if (params.toState === 'failed') {
    nextValues.failedAt = now;
    nextValues.failureCode = params.failureCode ?? params.reasonCode ?? null;
  }
  if (params.toState === 'cancelled') {
    nextValues.cancelledAt = now;
  }

  await db
    .update(dataPortabilityExports)
    .set(nextValues)
    .where(eq(dataPortabilityExports.id, params.exportId));

  await recordResidualLifecycleTransition({
    objectType: 'export',
    objectId: params.exportId,
    fromState: existing.lifecycleState,
    toState: params.toState,
    trigger: params.trigger,
    reasonCode: params.reasonCode,
    actorType: params.actorType,
    actorId: params.actorId,
    metadata: params.metadata,
  });
}

export async function createProfileDeletionRequest(params: {
  profileId: string;
  requestedBy?: string | null;
  lifecycleOperationId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const [row] = await db
    .insert(profileDeletionRequests)
    .values({
      profileId: params.profileId,
      requestedBy: params.requestedBy ?? null,
      lifecycleOperationId: params.lifecycleOperationId ?? null,
      lifecycleState: 'requested',
      reason: params.reason ?? null,
      metadata: params.metadata ?? {},
    })
    .returning();

  await recordResidualLifecycleTransition({
    objectType: 'deletion',
    objectId: row.id,
    fromState: null,
    toState: 'requested',
    trigger: 'deletion_requested',
    actorType: 'candidate',
    actorId: params.requestedBy ?? params.profileId,
    metadata: params.metadata,
  });

  return row;
}

export async function updateProfileDeletionRequestState(params: {
  deletionRequestId: string;
  toState: DeletionLifecycleState;
  actorType: ResidualLifecycleActorType;
  actorId?: string | null;
  trigger: string;
  reasonCode?: string | null;
  failureCode?: string | null;
  blockReason?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const [existing] = await db
    .select()
    .from(profileDeletionRequests)
    .where(eq(profileDeletionRequests.id, params.deletionRequestId))
    .limit(1);

  if (!existing) {
    throw new Error(`Deletion request ${params.deletionRequestId} not found`);
  }

  const now = new Date();
  const nextValues: Record<string, unknown> = {
    lifecycleState: params.toState,
    updatedAt: now,
  };

  if (params.toState === 'processing') {
    nextValues.processingStartedAt = now;
  }
  if (params.toState === 'blocked_legal_hold') {
    nextValues.blockedAt = now;
    nextValues.blockReason = params.blockReason ?? params.reasonCode ?? null;
  }
  if (params.toState === 'deleted') {
    nextValues.deletedAt = now;
  }
  if (params.toState === 'failed_requires_manual_review') {
    nextValues.failedAt = now;
    nextValues.failureCode = params.failureCode ?? params.reasonCode ?? null;
  }

  await db
    .update(profileDeletionRequests)
    .set(nextValues)
    .where(eq(profileDeletionRequests.id, params.deletionRequestId));

  await recordResidualLifecycleTransition({
    objectType: 'deletion',
    objectId: params.deletionRequestId,
    fromState: existing.lifecycleState,
    toState: params.toState,
    trigger: params.trigger,
    reasonCode: params.reasonCode,
    actorType: params.actorType,
    actorId: params.actorId,
    metadata: params.metadata,
  });
}

export async function getLatestProfileDeletionRequest(profileId: string) {
  const [row] = await db
    .select()
    .from(profileDeletionRequests)
    .where(eq(profileDeletionRequests.profileId, profileId))
    .orderBy(desc(profileDeletionRequests.requestedAt))
    .limit(1);

  return row ?? null;
}

export async function hasOpenProfileDeletionRequest(profileId: string) {
  const [row] = await db
    .select()
    .from(profileDeletionRequests)
    .where(
      and(
        eq(profileDeletionRequests.profileId, profileId),
        eq(profileDeletionRequests.lifecycleState, 'requested')
      )
    )
    .limit(1);

  return Boolean(row);
}

type MatchStateDerivationInput = {
  scoreState?: string | null;
  reviewStage?: string | null;
  introState?: string | null;
  decisionState?: string | null;
};

const INTERVIEW_INTRO_STATES = new Set(['interview_handoff']);
const ACTIVE_INTRO_STATES = new Set([
  'pending_candidate_interest',
  'pending_org_interest',
  'mutual',
  'conversation_open',
  'interview_handoff',
]);

export function deriveLegacyMatchLifecycleState(
  input: MatchStateDerivationInput
): MatchLifecycleState {
  if (input.decisionState === 'closed' || input.reviewStage === 'closed') {
    return 'closed';
  }
  if (input.scoreState === 'hidden_due_to_policy') {
    return 'hidden_due_to_policy';
  }
  if (input.scoreState === 'stale') {
    return 'stale';
  }
  if (input.introState && INTERVIEW_INTRO_STATES.has(input.introState)) {
    return 'interview_in_progress';
  }
  if (input.introState && ACTIVE_INTRO_STATES.has(input.introState)) {
    return 'intro_in_progress';
  }
  if (input.reviewStage === 'passed') {
    return 'passed';
  }
  if (input.reviewStage === 'shortlisted') {
    return 'shortlisted';
  }
  return 'generated';
}
