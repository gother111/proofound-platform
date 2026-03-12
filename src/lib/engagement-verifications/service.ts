import { desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import {
  decisions,
  engagementVerificationStateTransitions,
  engagementVerifications,
  matchingProfiles,
} from '@/db/schema';
import { log } from '@/lib/log';
import { attachUploadedFile } from '@/lib/uploads/lifecycle';
import {
  assertAllowedTransition,
  getAllowedActions,
  getWorkflowLabel,
  type EngagementVerificationWorkflowState,
  type WorkflowActorType,
} from '@/lib/workflow/contracts';

export type CanonicalEngagementType =
  | 'full_time'
  | 'part_time'
  | 'contract_consulting'
  | 'fractional_project';

export type EngagementProofHookStatus = 'not_ready' | 'eligible';

export type EngagementVerificationSummary = {
  id: string;
  decisionId: string;
  status: EngagementVerificationWorkflowState;
  statusLabel: string;
  engagementType: CanonicalEngagementType | null;
  candidateConfirmedAt: string | null;
  organizationConfirmedAt: string | null;
  uploadedEvidencePresent: boolean;
  proofHookStatus: EngagementProofHookStatus;
  verifiedAt: string | null;
  workflow: {
    state: EngagementVerificationWorkflowState;
    displayState: string;
    allowedActions: string[];
  };
};

type EngagementVerificationRow = typeof engagementVerifications.$inferSelect;

const LEGACY_ENGAGEMENT_TYPE_MAP: Record<string, CanonicalEngagementType> = {
  full_time: 'full_time',
  'full-time': 'full_time',
  part_time: 'part_time',
  'part-time': 'part_time',
  contract: 'contract_consulting',
  consulting: 'contract_consulting',
  contract_consulting: 'contract_consulting',
  fractional: 'fractional_project',
  project: 'fractional_project',
  project_based: 'fractional_project',
  fractional_project: 'fractional_project',
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function buildWorkflow(state: EngagementVerificationWorkflowState) {
  return {
    state,
    displayState: getWorkflowLabel('engagement_verification', state),
    allowedActions: getAllowedActions('engagement_verification', state),
  };
}

function toSummary(record: EngagementVerificationRow): EngagementVerificationSummary {
  return {
    id: record.id,
    decisionId: record.decisionId,
    status: record.state,
    statusLabel: getWorkflowLabel('engagement_verification', record.state),
    engagementType: record.engagementType as CanonicalEngagementType | null,
    candidateConfirmedAt: toIso(record.candidateConfirmedAt),
    organizationConfirmedAt: toIso(record.organizationConfirmedAt),
    uploadedEvidencePresent: Boolean(record.uploadedFileId),
    proofHookStatus: record.proofHookStatus as EngagementProofHookStatus,
    verifiedAt: toIso(record.verifiedAt),
    workflow: buildWorkflow(record.state as EngagementVerificationWorkflowState),
  };
}

export function normalizeEngagementType(
  value: string | null | undefined
): CanonicalEngagementType | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
  return LEGACY_ENGAGEMENT_TYPE_MAP[normalized] ?? null;
}

export function deriveEngagementVerificationState(params: {
  candidateConfirmed: boolean;
  organizationConfirmed: boolean;
}): EngagementVerificationWorkflowState {
  if (params.candidateConfirmed && params.organizationConfirmed) {
    return 'verified';
  }

  if (params.candidateConfirmed) {
    return 'pending_organization_confirmation';
  }

  if (params.organizationConfirmed) {
    return 'pending_candidate_confirmation';
  }

  return 'pending_both_confirmations';
}

async function appendEngagementVerificationTransition(params: {
  engagementVerificationId: string;
  fromState: EngagementVerificationWorkflowState | null;
  toState: EngagementVerificationWorkflowState;
  trigger: string;
  actorType: WorkflowActorType;
  actorId?: string | null;
  reasonCode?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(engagementVerificationStateTransitions).values({
    engagementVerificationId: params.engagementVerificationId,
    fromState: params.fromState,
    toState: params.toState,
    trigger: params.trigger,
    reasonCode: params.reasonCode ?? null,
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    metadata: params.metadata ?? {},
  });
}

export async function getEngagementVerificationById(id: string) {
  const record = await db.query.engagementVerifications.findFirst({
    where: eq(engagementVerifications.id, id),
  });

  return record ? toSummary(record) : null;
}

export async function ensureEngagementVerificationForDecision(params: {
  decision: Pick<
    typeof decisions.$inferSelect,
    'id' | 'introId' | 'assignmentId' | 'candidateProfileId' | 'orgId'
  >;
  actorType: WorkflowActorType;
  actorId?: string | null;
}) {
  const existing = await db.query.engagementVerifications.findFirst({
    where: eq(engagementVerifications.decisionId, params.decision.id),
  });

  if (existing) {
    return toSummary(existing);
  }

  const matchingProfile = await db.query.matchingProfiles.findFirst({
    where: eq(matchingProfiles.profileId, params.decision.candidateProfileId),
    orderBy: [desc(matchingProfiles.updatedAt)],
  });

  const normalizedEngagementType = normalizeEngagementType(matchingProfile?.engagementType);

  const [inserted] = await db
    .insert(engagementVerifications)
    .values({
      decisionId: params.decision.id,
      introId: params.decision.introId,
      assignmentId: params.decision.assignmentId,
      candidateProfileId: params.decision.candidateProfileId,
      orgId: params.decision.orgId,
      engagementType: normalizedEngagementType,
      state: 'pending_both_confirmations',
      candidateConfirmed: false,
      organizationConfirmed: false,
      proofHookStatus: 'not_ready',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  await appendEngagementVerificationTransition({
    engagementVerificationId: inserted.id,
    fromState: null,
    toState: 'pending_both_confirmations',
    trigger: 'engagement_verification_created_after_hire',
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    metadata: {
      decisionId: params.decision.id,
      engagementType: normalizedEngagementType,
    },
  });

  return toSummary(inserted);
}

export async function confirmEngagementVerification(params: {
  engagementVerificationId: string;
  actorType: Extract<WorkflowActorType, 'candidate' | 'organization_member'>;
  actorId: string;
  engagementType?: string | null;
  uploadedFileId?: string | null;
  evidenceNote?: string | null;
}) {
  const existing = await db.query.engagementVerifications.findFirst({
    where: eq(engagementVerifications.id, params.engagementVerificationId),
  });

  if (!existing) {
    throw new Error('Engagement verification not found');
  }

  const normalizedEngagementType =
    params.engagementType !== undefined
      ? normalizeEngagementType(params.engagementType)
      : (existing.engagementType as CanonicalEngagementType | null);

  if (params.engagementType !== undefined && !normalizedEngagementType) {
    throw new Error('Unsupported engagement type');
  }

  if (params.uploadedFileId) {
    const attachedUpload = await attachUploadedFile(
      params.uploadedFileId,
      params.actorId,
      'engagement_verification',
      existing.id
    );

    if (!attachedUpload) {
      throw new Error('Uploaded evidence must belong to the current user and be attachable');
    }
  }

  const now = new Date();
  const nextCandidateConfirmed =
    params.actorType === 'candidate' ? true : Boolean(existing.candidateConfirmed);
  const nextOrganizationConfirmed =
    params.actorType === 'organization_member' ? true : Boolean(existing.organizationConfirmed);
  const nextState = deriveEngagementVerificationState({
    candidateConfirmed: nextCandidateConfirmed,
    organizationConfirmed: nextOrganizationConfirmed,
  });

  if (existing.state !== nextState) {
    assertAllowedTransition('engagement_verification', existing.state, nextState);
  }

  const reachedVerified = nextState === 'verified' && existing.state !== 'verified';
  const nextEvidenceNote =
    params.evidenceNote === undefined
      ? existing.evidenceNote
      : params.evidenceNote?.trim()
        ? params.evidenceNote.trim()
        : null;

  const [updated] = await db
    .update(engagementVerifications)
    .set({
      engagementType: normalizedEngagementType,
      state: nextState,
      candidateConfirmed: nextCandidateConfirmed,
      candidateConfirmedAt:
        params.actorType === 'candidate'
          ? (existing.candidateConfirmedAt ?? now)
          : existing.candidateConfirmedAt,
      candidateConfirmedBy:
        params.actorType === 'candidate'
          ? (existing.candidateConfirmedBy ?? params.actorId)
          : existing.candidateConfirmedBy,
      organizationConfirmed: nextOrganizationConfirmed,
      organizationConfirmedAt:
        params.actorType === 'organization_member'
          ? (existing.organizationConfirmedAt ?? now)
          : existing.organizationConfirmedAt,
      organizationConfirmedBy:
        params.actorType === 'organization_member'
          ? (existing.organizationConfirmedBy ?? params.actorId)
          : existing.organizationConfirmedBy,
      uploadedFileId: params.uploadedFileId ?? existing.uploadedFileId,
      evidenceNote: nextEvidenceNote,
      proofHookStatus: reachedVerified ? 'eligible' : existing.proofHookStatus,
      proofHookEligibleAt: reachedVerified ? now : existing.proofHookEligibleAt,
      verifiedAt: reachedVerified ? now : existing.verifiedAt,
      updatedAt: now,
    })
    .where(eq(engagementVerifications.id, existing.id))
    .returning();

  if (existing.state !== nextState) {
    await appendEngagementVerificationTransition({
      engagementVerificationId: existing.id,
      fromState: existing.state as EngagementVerificationWorkflowState,
      toState: nextState,
      trigger: `${params.actorType}_confirmation`,
      actorType: params.actorType,
      actorId: params.actorId,
      metadata: {
        engagementType: normalizedEngagementType,
        uploadedEvidencePresent: Boolean(params.uploadedFileId ?? existing.uploadedFileId),
      },
    });
  }

  if (reachedVerified) {
    log.info('engagement_verification.proof_hook_eligible', {
      engagementVerificationId: existing.id,
      decisionId: existing.decisionId,
      assignmentId: existing.assignmentId,
      candidateProfileId: existing.candidateProfileId,
      orgId: existing.orgId,
      engagementType: normalizedEngagementType,
    });
  }

  return toSummary(updated);
}

export async function listEngagementVerificationsByInterviewIds(interviewIds: string[]) {
  if (interviewIds.length === 0) {
    return new Map<string, EngagementVerificationSummary>();
  }

  const rows = await db
    .select({
      interviewId: decisions.latestInterviewId,
      record: engagementVerifications,
    })
    .from(decisions)
    .innerJoin(engagementVerifications, eq(engagementVerifications.decisionId, decisions.id))
    .where(inArray(decisions.latestInterviewId, interviewIds));

  return new Map(
    rows
      .filter((row) => typeof row.interviewId === 'string')
      .map((row) => [row.interviewId as string, toSummary(row.record)])
  );
}
