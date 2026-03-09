import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  proofPackItems,
  submissionArtifacts,
  submissions,
  type InsertSubmission,
} from '@/db/schema';

type AssignmentSubmissionReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_changes';

function mapAssignmentReviewStatusToSubmissionStatus(
  reviewStatus: AssignmentSubmissionReviewStatus
): (typeof submissions.$inferInsert)['status'] {
  switch (reviewStatus) {
    case 'approved':
      return 'accepted';
    case 'rejected':
      return 'rejected';
    case 'needs_changes':
      return 'under_review';
    default:
      return 'submitted';
  }
}

export async function syncSubmissionArtifactsFromProofPack(
  submissionId: string,
  proofPackId: string | null | undefined
) {
  if (!proofPackId) {
    return [];
  }

  const packItems = await db.query.proofPackItems.findMany({
    where: eq(proofPackItems.packId, proofPackId),
    orderBy: [proofPackItems.position],
  });

  if (packItems.length === 0) {
    return [];
  }

  return db
    .insert(submissionArtifacts)
    .values(
      packItems.map((item) => ({
        submissionId,
        artifactId: item.artifactId,
        position: item.position,
        includedFields: item.includedFields,
      }))
    )
    .onConflictDoNothing({
      target: [submissionArtifacts.submissionId, submissionArtifacts.artifactId],
    })
    .returning();
}

export async function upsertCanonicalAssignmentSectionSubmission(params: {
  legacySubmissionId: string;
  invitationId: string;
  orgId: string;
  sectionName: string;
  sectionData: unknown;
  reviewStatus: AssignmentSubmissionReviewStatus;
  reviewedAt?: Date | null;
  stakeholderEmail?: string | null;
  submittedAt?: Date | null;
}) {
  const [row] = await db
    .insert(submissions)
    .values({
      submissionKind: 'assignment_section',
      status: mapAssignmentReviewStatusToSubmissionStatus(params.reviewStatus),
      ownerType: 'organization',
      ownerId: params.orgId,
      requestContextType: 'assignment_invitation',
      requestContextId: params.invitationId,
      legacySourceTable: 'assignment_submissions',
      legacySourceId: params.legacySubmissionId,
      submittedAt: params.submittedAt ?? new Date(),
      reviewedAt: params.reviewedAt ?? null,
      metadata: {
        sectionName: params.sectionName,
        sectionData: params.sectionData,
        legacyReviewStatus: params.reviewStatus,
        stakeholderEmail: params.stakeholderEmail ?? null,
      },
    })
    .onConflictDoUpdate({
      target: [submissions.legacySourceTable, submissions.legacySourceId],
      set: {
        status: mapAssignmentReviewStatusToSubmissionStatus(params.reviewStatus),
        reviewedAt: params.reviewedAt ?? null,
        submittedAt: params.submittedAt ?? new Date(),
        metadata: {
          sectionName: params.sectionName,
          sectionData: params.sectionData,
          legacyReviewStatus: params.reviewStatus,
          stakeholderEmail: params.stakeholderEmail ?? null,
        },
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
}

export async function upsertCanonicalProofCardSubmission(params: {
  inviteId: string;
  ownerProfileId: string;
  assignmentId?: string | null;
  matchId?: string | null;
  proofPackId?: string | null;
  proofSnippetId?: string | null;
  conversationId?: string | null;
  orgId?: string | null;
}) {
  const existing = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.legacySourceTable, 'org_candidate_invites'),
      eq(submissions.legacySourceId, params.inviteId)
    ),
    orderBy: [desc(submissions.submittedAt)],
  });

  const values: InsertSubmission = {
    submissionKind: 'proof_card',
    status: 'submitted',
    ownerType: 'individual_profile',
    ownerId: params.ownerProfileId,
    submittedByUserId: params.ownerProfileId,
    assignmentId: params.assignmentId ?? null,
    proofPackId: params.proofPackId ?? null,
    requestContextType: 'candidate_invite',
    requestContextId: params.inviteId,
    matchId: params.matchId ?? null,
    legacySourceTable: 'org_candidate_invites',
    legacySourceId: params.inviteId,
    submittedAt: new Date(),
    metadata: {
      proofSnippetId: params.proofSnippetId ?? null,
      conversationId: params.conversationId ?? null,
      orgId: params.orgId ?? null,
    },
  };

  let submission: typeof submissions.$inferSelect;
  if (existing) {
    [submission] = await db
      .update(submissions)
      .set({
        status: 'submitted',
        assignmentId: params.assignmentId ?? existing.assignmentId ?? null,
        proofPackId: params.proofPackId ?? null,
        matchId: params.matchId ?? existing.matchId ?? null,
        submittedAt: new Date(),
        metadata: {
          ...(existing.metadata as Record<string, unknown>),
          proofSnippetId: params.proofSnippetId ?? null,
          conversationId: params.conversationId ?? null,
          orgId: params.orgId ?? null,
        },
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, existing.id))
      .returning();
  } else {
    [submission] = await db.insert(submissions).values(values).returning();
  }

  await syncSubmissionArtifactsFromProofPack(submission.id, params.proofPackId);

  return submission;
}

export async function listCanonicalSubmissionsForOwner(
  ownerType: 'individual_profile' | 'organization',
  ownerId: string
) {
  return db.query.submissions.findMany({
    where: and(eq(submissions.ownerType, ownerType), eq(submissions.ownerId, ownerId)),
    orderBy: [desc(submissions.submittedAt)],
  });
}
