import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { orgCandidateInvites, proofPacks } from '@/db/schema';
import { getRows } from '@/lib/db/rows';
import {
  CANDIDATE_INVITE_FLOW_TYPE,
  CANDIDATE_INVITE_STATUS,
  isInviteExpired,
} from '@/lib/candidate-invites';
import { buildPublicProfileURL } from '@/lib/profile/snippet-generator';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import { createClient } from '@/lib/supabase/server';
import {
  buildCandidateInvitePolicyError,
  resolveCandidateInvitePolicyContext,
} from '@/lib/candidate-invite-policy';
import {
  CAPABILITY_TOKEN_CLASSES,
  inspectCapabilityToken,
  redeemCapabilityToken,
} from '@/lib/security/capability-tokens';
import { upsertCanonicalProofCardSubmission } from '@/lib/canonical/submissions';

export const dynamic = 'force-dynamic';

const submitProofCardSchema = z
  .object({
    shareToken: z.string().min(6).max(200).optional(),
    snippetId: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.shareToken && !value.snippetId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either shareToken or snippetId must be provided.',
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
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
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

    let snippetCapabilityTokenId: string | null = null;
    if (parsed.data.shareToken) {
      const redeemedSnippet = await redeemCapabilityToken(parsed.data.shareToken, {
        tokenClass: CAPABILITY_TOKEN_CLASSES.PROFILE_SNIPPET_SHARE,
        consume: false,
        actor: { profileId: user.id, principalType: 'user_account' },
        metadata: { surface: 'candidate_invite_proof_card_submit' },
      });

      if (!redeemedSnippet.ok) {
        return NextResponse.json({ error: 'Proof Card snippet not found.' }, { status: 404 });
      }

      snippetCapabilityTokenId = redeemedSnippet.token.id;
    }

    const snippetResult = await db.execute(sql`
      SELECT id, capability_token_id
      FROM profile_snippets
      WHERE user_id = ${user.id}
        AND profile_type = 'individual'
        AND deleted_at IS NULL
        AND revoked_at IS NULL
        AND public_surface_disabled_at IS NULL
        AND (
          (${snippetCapabilityTokenId} IS NOT NULL AND capability_token_id = ${snippetCapabilityTokenId}::uuid)
          OR (${parsed.data.snippetId ?? null} IS NOT NULL AND id = ${parsed.data.snippetId ?? null})
        )
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `);

    const [snippet] = getRows<{ id: string; capability_token_id: string | null }>(
      snippetResult as any
    );
    if (!snippet) {
      return NextResponse.json({ error: 'Proof Card snippet not found.' }, { status: 404 });
    }

    await db.execute(sql`
      UPDATE org_candidate_invites
      SET
        status = ${CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED},
        proof_snippet_id = ${snippet.id}::uuid,
        proof_capability_token_id = ${snippet.capability_token_id ?? null}::uuid,
        proof_share_token = NULL,
        proof_submitted_at = NOW(),
        updated_at = NOW()
      WHERE id = ${invite.id}::uuid
    `);

    const canonicalPack = await db.query.proofPacks.findFirst({
      where: and(
        eq(proofPacks.legacySourceTable, 'profile_snippets'),
        eq(proofPacks.legacySourceId, snippet.id)
      ),
    });

    const canonicalSubmission = await upsertCanonicalProofCardSubmission({
      inviteId: invite.id,
      ownerProfileId: user.id,
      orgId: invite.orgId,
      assignmentId: invite.assignmentId ?? null,
      matchId: invite.matchId ?? null,
      proofPackId: canonicalPack?.id ?? null,
      proofSnippetId: snippet.id,
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
      proofCardUrl: parsed.data.shareToken ? buildPublicProfileURL(parsed.data.shareToken) : null,
      canonicalPackId: canonicalPack?.id ?? null,
      canonicalSubmissionId: canonicalSubmission.id,
    });
  } catch (error) {
    console.error('Failed to submit proof card for invite:', error);
    return NextResponse.json({ error: 'Failed to submit Proof Card' }, { status: 500 });
  }
}
