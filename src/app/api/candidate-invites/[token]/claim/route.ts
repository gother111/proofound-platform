import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { orgCandidateInvites, profiles } from '@/db/schema';
import {
  CANDIDATE_INVITE_STATUS,
  hashCandidateInviteToken,
  isInviteExpired,
  normalizeInviteEmail,
} from '@/lib/candidate-invites';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await params;
    const tokenHash = hashCandidateInviteToken(token);

    const [invite] = await db
      .select({
        id: orgCandidateInvites.id,
        orgId: orgCandidateInvites.orgId,
        inviteeEmailNormalized: orgCandidateInvites.inviteeEmailNormalized,
        status: orgCandidateInvites.status,
        expiresAt: orgCandidateInvites.expiresAt,
        claimedByProfileId: orgCandidateInvites.claimedByProfileId,
      })
      .from(orgCandidateInvites)
      .where(eq(orgCandidateInvites.tokenHash, tokenHash))
      .limit(1);

    if (!invite || invite.status === CANDIDATE_INVITE_STATUS.REVOKED) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
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

    if (invite.status === CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED) {
      return NextResponse.json({ error: 'Invite is already completed' }, { status: 409 });
    }

    const userEmail = normalizeInviteEmail(user.email ?? '');
    if (!userEmail || userEmail !== invite.inviteeEmailNormalized) {
      return NextResponse.json(
        {
          error: 'You must sign in with the same email address that received this invite.',
        },
        { status: 403 }
      );
    }

    const [profile] = await db
      .select({
        id: profiles.id,
        persona: profiles.persona,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.persona === 'org_member') {
      return NextResponse.json(
        { error: 'This invite must be completed with an individual account.' },
        { status: 409 }
      );
    }

    if (invite.status === CANDIDATE_INVITE_STATUS.CLAIMED) {
      if (invite.claimedByProfileId !== user.id) {
        return NextResponse.json(
          { error: 'Invite already claimed by another user.' },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        status: CANDIDATE_INVITE_STATUS.CLAIMED,
      });
    }

    await db
      .update(orgCandidateInvites)
      .set({
        status: CANDIDATE_INVITE_STATUS.CLAIMED,
        claimedByProfileId: user.id,
        claimedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orgCandidateInvites.id, invite.id));

    emitAnalyticsEventAsync({
      eventType: 'candidate_invite_claimed',
      userId: user.id,
      organizationId: invite.orgId,
      entityType: 'profile',
      entityId: invite.id,
    });

    return NextResponse.json({
      success: true,
      status: CANDIDATE_INVITE_STATUS.CLAIMED,
    });
  } catch (error) {
    console.error('Failed to claim candidate invite:', error);
    return NextResponse.json({ error: 'Failed to claim invite' }, { status: 500 });
  }
}
