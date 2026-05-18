import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { orgCandidateInvites, proofPacks } from '@/db/schema';
import {
  CANDIDATE_INVITE_FLOW_TYPE,
  CANDIDATE_INVITE_STATUS,
  isInviteExpired,
} from '@/lib/candidate-invites';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import { createClient } from '@/lib/supabase/server';
import {
  buildCandidateInvitePolicyError,
  resolveCandidateInvitePolicyContext,
} from '@/lib/candidate-invite-policy';
import { CAPABILITY_TOKEN_CLASSES, inspectCapabilityToken } from '@/lib/security/capability-tokens';
import { upsertCanonicalProofCardSubmission } from '@/lib/canonical/submissions';
import {
  candidateInviteVisualFixturesEnabled,
  VISUAL_CANDIDATE_INVITE_TOKENS,
} from '@/lib/candidate-invites/visual-fixtures';

export const dynamic = 'force-dynamic';

const PRIVATE_PROOF_WORKSPACE_URL = '/app/i/profile?profileView=full&tab=proof_packs';
const PROFILE_VISIBILITY_URL = '/app/i/profile?profileView=full&tab=visibility';
const PRIVACY_DATA_CONTROLS_URL = '/app/i/settings/privacy';
const VERIFICATION_WORKSPACE_URL = '/app/i/verifications';

function buildAssignmentReviewUrl(conversationId: string | null | undefined) {
  return conversationId
    ? `/app/i/communications?section=messages&conversation=${encodeURIComponent(conversationId)}`
    : '/app/i/matching';
}

const submitProofCardSchema = z
  .object({
    proofPackId: z.string().uuid().optional(),
    reviewConfirmed: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.proofPackId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['proofPackId'],
        message: 'Owner-only Proof Pack ID is required.',
      });
    }

    if (value.reviewConfirmed !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reviewConfirmed'],
        message: 'Confirm the final visibility review before submitting.',
      });
    }
  });

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await params;
    if (
      candidateInviteVisualFixturesEnabled() &&
      token === VISUAL_CANDIDATE_INVITE_TOKENS.proofCardClaimed
    ) {
      const body = await request.json();
      const parsed = submitProofCardSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid proof card payload', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        status: CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED,
        canonicalPackId: parsed.data.proofPackId,
        canonicalSubmissionId: 'visual-candidate-invite-submission',
        accountSave: {
          state: 'saved_private_workspace',
          accountId: user.id,
          proofPackId: parsed.data.proofPackId,
          canonicalSubmissionId: 'visual-candidate-invite-submission',
          assignmentReviewState: {
            inviteId: 'visual-candidate-invite-1',
            assignmentId: 'visual-assignment-candidate-proof',
            matchId: null,
            conversationId: null,
          },
          controls: {
            proofWorkspaceUrl: PRIVATE_PROOF_WORKSPACE_URL,
            profileVisibilityUrl: PROFILE_VISIBILITY_URL,
            privacyDataControlsUrl: PRIVACY_DATA_CONTROLS_URL,
            verificationWorkspaceUrl: VERIFICATION_WORKSPACE_URL,
            assignmentReviewUrl: buildAssignmentReviewUrl(null),
          },
          publication: {
            publicPageChanged: false,
            publicDirectoryEntryCreated: false,
            defaultVisibility: 'owner_only',
          },
        },
      });
    }

    const inspectedInviteToken = await inspectCapabilityToken(token, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
      actor: {
        email: user.email ?? null,
        profileId: user.id,
        principalType: 'user_account',
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      },
      metadata: { surface: 'candidate_invite.proof_card' },
    });

    if (!inspectedInviteToken.ok) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }
    const body = await request.json();
    const parsed = submitProofCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid proof card payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [invite] = await db
      .select({
        id: orgCandidateInvites.id,
        orgId: orgCandidateInvites.orgId,
        flowType: orgCandidateInvites.flowType,
        status: orgCandidateInvites.status,
        expiresAt: orgCandidateInvites.expiresAt,
        claimedByProfileId: orgCandidateInvites.claimedByProfileId,
        assignmentId: orgCandidateInvites.assignmentId,
        matchId: orgCandidateInvites.matchId,
        conversationId: orgCandidateInvites.conversationId,
      })
      .from(orgCandidateInvites)
      .where(eq(orgCandidateInvites.capabilityTokenId, inspectedInviteToken.token.id))
      .limit(1);

    if (!invite || invite.status === CANDIDATE_INVITE_STATUS.REVOKED) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.flowType !== CANDIDATE_INVITE_FLOW_TYPE.PROOF_CARD) {
      return NextResponse.json(
        { error: 'Proof Card submission is not required for this invite.' },
        { status: 409 }
      );
    }

    if (isInviteExpired(invite.expiresAt)) {
      if (invite.status !== CANDIDATE_INVITE_STATUS.EXPIRED) {
        await db
          .update(orgCandidateInvites)
          .set({
            status: CANDIDATE_INVITE_STATUS.EXPIRED,
            updatedAt: new Date(),
          })
          .where(eq(orgCandidateInvites.id, invite.id));
      }
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (!invite.claimedByProfileId || invite.claimedByProfileId !== user.id) {
      return NextResponse.json({ error: 'Invite must be claimed first.' }, { status: 403 });
    }

    const { assignment, policyEvaluation } = await resolveCandidateInvitePolicyContext(
      invite.orgId,
      invite.assignmentId
    );

    if (invite.assignmentId && !assignment) {
      return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
    }

    if (policyEvaluation.decision !== 'allow') {
      return NextResponse.json(
        {
          error: buildCandidateInvitePolicyError(policyEvaluation.decision, invite.flowType),
          code:
            policyEvaluation.decision === 'blocked'
              ? 'INVITE_PROOF_SUBMISSION_BLOCKED'
              : 'INVITE_PROOF_SUBMISSION_ON_HOLD',
          details: {
            decision: policyEvaluation.decision,
            orgTrustTier: policyEvaluation.orgTrustTier,
            reasons: policyEvaluation.reasons.map((reason) => reason.code),
          },
        },
        { status: policyEvaluation.decision === 'blocked' ? 403 : 409 }
      );
    }

    if (
      invite.status !== CANDIDATE_INVITE_STATUS.CLAIMED &&
      invite.status !== CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED
    ) {
      return NextResponse.json({ error: 'Invite is not in a submittable state.' }, { status: 409 });
    }

    let canonicalPackId: string | null = null;

    if (parsed.data.proofPackId) {
      const [proofPack] = await db
        .select({
          id: proofPacks.id,
          visibility: proofPacks.visibility,
          revealGate: proofPacks.revealGate,
          publishedAt: proofPacks.publishedAt,
        })
        .from(proofPacks)
        .where(
          and(
            eq(proofPacks.id, parsed.data.proofPackId),
            eq(proofPacks.ownerType, 'individual_profile'),
            eq(proofPacks.ownerId, user.id),
            isNull(proofPacks.deletedAt)
          )
        )
        .limit(1);

      if (!proofPack) {
        return NextResponse.json({ error: 'Proof Pack not found.' }, { status: 404 });
      }

      if (
        proofPack.visibility !== 'owner_only' ||
        proofPack.revealGate !== 'none' ||
        proofPack.publishedAt
      ) {
        return NextResponse.json(
          {
            error:
              'Assignment applications can only submit an owner-only Proof Pack. Public pages and share links are not accepted for this flow.',
          },
          { status: 409 }
        );
      }

      canonicalPackId = proofPack.id;
    }

    await db.execute(sql`
      UPDATE org_candidate_invites
      SET
        status = ${CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED},
        proof_snippet_id = NULL,
        proof_capability_token_id = NULL,
        proof_share_token = NULL,
        proof_submitted_at = NOW(),
        public_surface_disabled_at = NOW(),
        updated_at = NOW()
      WHERE id = ${invite.id}::uuid
    `);

    const canonicalSubmission = await upsertCanonicalProofCardSubmission({
      inviteId: invite.id,
      ownerProfileId: user.id,
      orgId: invite.orgId,
      assignmentId: invite.assignmentId ?? null,
      matchId: invite.matchId ?? null,
      proofPackId: canonicalPackId,
      proofSnippetId: null,
      conversationId: invite.conversationId ?? null,
    });

    emitAnalyticsEventAsync({
      eventType: 'candidate_proof_card_submitted',
      userId: user.id,
      organizationId: invite.orgId,
      entityType: 'profile',
      entityId: invite.id,
    });

    return NextResponse.json({
      success: true,
      status: CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED,
      canonicalPackId,
      canonicalSubmissionId: canonicalSubmission.id,
      accountSave: {
        state: 'saved_private_workspace',
        accountId: user.id,
        proofPackId: canonicalPackId,
        canonicalSubmissionId: canonicalSubmission.id,
        assignmentReviewState: {
          inviteId: invite.id,
          assignmentId: invite.assignmentId ?? null,
          matchId: invite.matchId ?? null,
          conversationId: invite.conversationId ?? null,
        },
        controls: {
          proofWorkspaceUrl: PRIVATE_PROOF_WORKSPACE_URL,
          profileVisibilityUrl: PROFILE_VISIBILITY_URL,
          privacyDataControlsUrl: PRIVACY_DATA_CONTROLS_URL,
          verificationWorkspaceUrl: VERIFICATION_WORKSPACE_URL,
          assignmentReviewUrl: buildAssignmentReviewUrl(invite.conversationId),
        },
        publication: {
          publicPageChanged: false,
          publicDirectoryEntryCreated: false,
          defaultVisibility: 'owner_only',
        },
      },
    });
  } catch (error) {
    console.error('Failed to submit proof card for invite:', error);
    return NextResponse.json({ error: 'Failed to submit Proof Card' }, { status: 500 });
  }
}
