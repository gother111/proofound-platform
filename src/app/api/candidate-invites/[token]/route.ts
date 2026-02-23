import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { orgCandidateInvites, organizations } from '@/db/schema';
import {
  CANDIDATE_INVITE_STATUS,
  hashCandidateInviteToken,
  isInviteExpired,
  maskInviteEmail,
} from '@/lib/candidate-invites';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const tokenHash = hashCandidateInviteToken(token);

    const [invite] = await db
      .select({
        id: orgCandidateInvites.id,
        orgId: orgCandidateInvites.orgId,
        inviteeEmail: orgCandidateInvites.inviteeEmail,
        status: orgCandidateInvites.status,
        expiresAt: orgCandidateInvites.expiresAt,
        claimedByProfileId: orgCandidateInvites.claimedByProfileId,
        claimedAt: orgCandidateInvites.claimedAt,
        proofShareToken: orgCandidateInvites.proofShareToken,
        proofSubmittedAt: orgCandidateInvites.proofSubmittedAt,
      })
      .from(orgCandidateInvites)
      .where(eq(orgCandidateInvites.tokenHash, tokenHash))
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

    const [org] = await db
      .select({
        id: organizations.id,
        slug: organizations.slug,
        displayName: organizations.displayName,
        logoUrl: organizations.logoUrl,
      })
      .from(organizations)
      .where(eq(organizations.id, invite.orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    emitAnalyticsEventAsync({
      eventType: 'candidate_invite_opened',
      organizationId: org.id,
      entityType: 'profile',
      entityId: invite.id,
    });

    return NextResponse.json({
      invite: {
        id: invite.id,
        status: invite.status,
        maskedEmail: maskInviteEmail(invite.inviteeEmail),
        expiresAt: invite.expiresAt,
        claimedAt: invite.claimedAt,
        claimedByProfileId: invite.claimedByProfileId,
        proofSubmittedAt: invite.proofSubmittedAt,
        proofShareToken: invite.proofShareToken,
      },
      organization: org,
    });
  } catch (error) {
    console.error('Failed to fetch candidate invite:', error);
    return NextResponse.json({ error: 'Failed to fetch invite' }, { status: 500 });
  }
}
