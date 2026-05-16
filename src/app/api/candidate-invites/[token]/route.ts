import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db';
import { orgCandidateInvites, proofPacks } from '@/db/schema';
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
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const existingRedeemSessionNonce =
      request.cookies.get(
        getCapabilityRedeemSessionCookieName(CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM)
      )?.value ?? null;
    const preview = await beginCapabilityTokenRedeemSession(token, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
      actor: {
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      },
      metadata: { surface: 'candidate_invite.preview' },
      maxAgeSeconds: CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS,
      existingRedeemSessionNonce,
    });

    if (!preview.ok) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
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
      if (
        invite.status === CANDIDATE_INVITE_STATUS.PENDING &&
        !invite.claimedByProfileId &&
        !invite.proofSubmittedAt
      ) {
        await db
          .update(orgCandidateInvites)
          .set({
            status: CANDIDATE_INVITE_STATUS.EXPIRED,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(orgCandidateInvites.id, invite.id),
              eq(orgCandidateInvites.status, CANDIDATE_INVITE_STATUS.PENDING),
              isNull(orgCandidateInvites.claimedByProfileId),
              isNull(orgCandidateInvites.proofSubmittedAt)
            )
          );
      }

      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status === CANDIDATE_INVITE_STATUS.EXPIRED) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const canShowPrivateProofPacks = Boolean(
      user &&
        invite.flowType === 'proof_card' &&
        invite.claimedByProfileId === user.id &&
        (invite.status === CANDIDATE_INVITE_STATUS.CLAIMED ||
          invite.status === CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED)
    );
    const claimedByCurrentUser = Boolean(user && invite.claimedByProfileId === user.id);
    const acceptedByCurrentUser = Boolean(user && invite.acceptedByProfileId === user.id);
    const communicationsUrl =
      claimedByCurrentUser && invite.conversationId
        ? `/app/i/communications?section=messages&conversation=${encodeURIComponent(invite.conversationId)}`
        : null;

    const availableProofPacks = canShowPrivateProofPacks
      ? await db
          .select({
            id: proofPacks.id,
            title: proofPacks.title,
            summary: proofPacks.summary,
            evidenceSummary: proofPacks.evidenceSummary,
            outcomesSummary: proofPacks.outcomesSummary,
            verificationSummary: proofPacks.verificationSummary,
            updatedAt: proofPacks.updatedAt,
          })
          .from(proofPacks)
          .where(
            and(
              eq(proofPacks.ownerType, 'individual_profile'),
              eq(proofPacks.ownerId, user!.id),
              eq(proofPacks.visibility, 'owner_only'),
              eq(proofPacks.revealGate, 'none'),
              isNull(proofPacks.publishedAt),
              isNull(proofPacks.deletedAt)
            )
          )
          .orderBy(desc(proofPacks.updatedAt))
          .limit(10)
      : [];

    const response = NextResponse.json({
      invite: {
        id: invite.id,
        status: invite.status,
        flowType: invite.flowType,
        assignmentId: invite.assignmentId,
        maskedEmail: maskInviteEmail(invite.inviteeEmail),
        expiresAt: invite.expiresAt,
        claimedAt: invite.claimedAt,
        claimedByCurrentUser,
        acceptedAt: invite.acceptedAt,
        acceptedByCurrentUser,
        communicationsUrl,
        proofSubmittedAt: invite.proofSubmittedAt,
      },
      organization: org,
      assignment: assignment
        ? {
            id: assignment.id,
            role: assignment.role,
            description: assignment.description,
            status: assignment.status,
            creationStatus: assignment.creationStatus,
            engagementType: assignment.engagementType,
            businessValue: assignment.businessValue,
            expectedImpact: assignment.expectedImpact,
            mustHaveSkills: assignment.mustHaveSkills ?? [],
            niceToHaveSkills: assignment.niceToHaveSkills ?? [],
            locationMode: assignment.locationMode,
            country: assignment.country,
            city: assignment.city,
            compMin: assignment.compMin,
            compMax: assignment.compMax,
            currency: assignment.currency,
            hoursMin: assignment.hoursMin,
            hoursMax: assignment.hoursMax,
            startEarliest: assignment.startEarliest,
            startLatest: assignment.startLatest,
            verificationGates: assignment.verificationGates ?? [],
            createdAt: assignment.createdAt,
          }
        : null,
      availableProofPacks,
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
