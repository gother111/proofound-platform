import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { orgCandidateInvites } from '@/db/schema';
import {
  beginCapabilityTokenRedeemSession,
  CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS,
  CAPABILITY_TOKEN_CLASSES,
  getCapabilityRedeemSessionCookieName,
} from '@/lib/security/capability-tokens';
import { CANDIDATE_INVITE_STATUS, isInviteExpired, maskInviteEmail } from '@/lib/candidate-invites';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import {
  buildCandidateInvitePolicyError,
  resolveCandidateInvitePolicyContext,
} from '@/lib/candidate-invite-policy';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const preview = await beginCapabilityTokenRedeemSession(token, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
      actor: {
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      },
      metadata: { surface: 'candidate_invite.preview' },
      maxAgeSeconds: CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS,
    });

    if (!preview.ok) {
      const status = preview.reason === 'expired' ? 410 : preview.reason === 'revoked' ? 410 : 404;
      return NextResponse.json({ error: 'Invite not found' }, { status });
    }

    const [invite] = await db
      .select({
        id: orgCandidateInvites.id,
        orgId: orgCandidateInvites.orgId,
        inviteeEmail: orgCandidateInvites.inviteeEmail,
        status: orgCandidateInvites.status,
        flowType: orgCandidateInvites.flowType,
        assignmentId: orgCandidateInvites.assignmentId,
        expiresAt: orgCandidateInvites.expiresAt,
        claimedByProfileId: orgCandidateInvites.claimedByProfileId,
        claimedAt: orgCandidateInvites.claimedAt,
        acceptedByProfileId: orgCandidateInvites.acceptedByProfileId,
        acceptedAt: orgCandidateInvites.acceptedAt,
        matchId: orgCandidateInvites.matchId,
        conversationId: orgCandidateInvites.conversationId,
        proofSubmittedAt: orgCandidateInvites.proofSubmittedAt,
      })
      .from(orgCandidateInvites)
      .where(eq(orgCandidateInvites.capabilityTokenId, preview.token.id))
      .limit(1);

    if (!invite || invite.status === CANDIDATE_INVITE_STATUS.REVOKED) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (isInviteExpired(invite.expiresAt) && invite.status !== CANDIDATE_INVITE_STATUS.EXPIRED) {
      await db
        .update(orgCandidateInvites)
        .set({
          status: CANDIDATE_INVITE_STATUS.EXPIRED,
          updatedAt: new Date(),
        })
        .where(eq(orgCandidateInvites.id, invite.id));

      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    if (invite.status === CANDIDATE_INVITE_STATUS.EXPIRED) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    const {
      organization: org,
      assignment,
      policyEvaluation,
    } = await resolveCandidateInvitePolicyContext(invite.orgId, invite.assignmentId);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (policyEvaluation.decision !== 'allow') {
      return NextResponse.json(
        {
          error: buildCandidateInvitePolicyError(policyEvaluation.decision, invite.flowType),
          code:
            policyEvaluation.decision === 'blocked'
              ? 'CANDIDATE_INVITE_BLOCKED'
              : 'CANDIDATE_INVITE_ON_HOLD',
          details: {
            decision: policyEvaluation.decision,
            orgTrustTier: policyEvaluation.orgTrustTier,
            reasons: policyEvaluation.reasons.map((reason) => reason.code),
          },
        },
        { status: policyEvaluation.decision === 'blocked' ? 403 : 409 }
      );
    }

    emitAnalyticsEventAsync({
      eventType: 'candidate_invite_opened',
      organizationId: org.id,
      entityType: 'profile',
      entityId: invite.id,
    });

    const response = NextResponse.json({
      invite: {
        id: invite.id,
        status: invite.status,
        flowType: invite.flowType,
        assignmentId: invite.assignmentId,
        maskedEmail: maskInviteEmail(invite.inviteeEmail),
        expiresAt: invite.expiresAt,
        claimedAt: invite.claimedAt,
        claimedByProfileId: invite.claimedByProfileId,
        acceptedAt: invite.acceptedAt,
        acceptedByProfileId: invite.acceptedByProfileId,
        matchId: invite.matchId,
        conversationId: invite.conversationId,
        proofSubmittedAt: invite.proofSubmittedAt,
      },
      organization: org,
      assignment: assignment
        ? {
            id: assignment.id,
            role: assignment.role,
            status: assignment.status,
            createdAt: assignment.createdAt,
          }
        : null,
    });

    response.cookies.set(
      getCapabilityRedeemSessionCookieName(CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM),
      preview.redeemSessionNonce,
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: preview.maxAgeSeconds,
      }
    );

    return response;
  } catch (error) {
    console.error('Failed to fetch candidate invite:', error);
    return NextResponse.json({ error: 'Failed to fetch invite' }, { status: 500 });
  }
}
