import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { db } from '@/db';
import {
  assignments,
  conversations,
  matches,
  orgCandidateInvites,
  organizationMembers,
  profiles,
} from '@/db/schema';
import {
  CANDIDATE_INVITE_FLOW_TYPE,
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
        assignmentId: orgCandidateInvites.assignmentId,
        flowType: orgCandidateInvites.flowType,
        inviteeEmailNormalized: orgCandidateInvites.inviteeEmailNormalized,
        status: orgCandidateInvites.status,
        expiresAt: orgCandidateInvites.expiresAt,
        invitedBy: orgCandidateInvites.invitedBy,
        claimedByProfileId: orgCandidateInvites.claimedByProfileId,
        claimedAt: orgCandidateInvites.claimedAt,
        acceptedAt: orgCandidateInvites.acceptedAt,
        matchId: orgCandidateInvites.matchId,
        conversationId: orgCandidateInvites.conversationId,
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

    if (invite.claimedByProfileId && invite.claimedByProfileId !== user.id) {
      return NextResponse.json(
        { error: 'Invite already claimed by another user.' },
        { status: 409 }
      );
    }

    if (invite.flowType !== CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH) {
      if (
        invite.status === CANDIDATE_INVITE_STATUS.CLAIMED &&
        invite.claimedByProfileId === user.id
      ) {
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
    }

    if (!invite.assignmentId) {
      return NextResponse.json(
        { error: 'Test invite is missing assignment context.' },
        { status: 409 }
      );
    }
    const assignmentId = invite.assignmentId;

    if (
      invite.status === CANDIDATE_INVITE_STATUS.CLAIMED &&
      invite.claimedByProfileId === user.id &&
      invite.matchId &&
      invite.conversationId
    ) {
      return NextResponse.json({
        success: true,
        status: CANDIDATE_INVITE_STATUS.CLAIMED,
        matchId: invite.matchId,
        conversationId: invite.conversationId,
      });
    }

    const result = await db.transaction(async (tx) => {
      const [assignment] = await tx
        .select({
          id: assignments.id,
          orgId: assignments.orgId,
        })
        .from(assignments)
        .where(and(eq(assignments.id, assignmentId), eq(assignments.orgId, invite.orgId)))
        .limit(1);

      if (!assignment) {
        throw new Error('ASSIGNMENT_NOT_FOUND');
      }

      const orgLeads = await tx
        .select({
          userId: organizationMembers.userId,
          role: organizationMembers.role,
        })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, invite.orgId),
            eq(organizationMembers.status, 'active'),
            inArray(organizationMembers.role, ['owner', 'admin'])
          )
        )
        .limit(10);

      if (orgLeads.length === 0) {
        throw new Error('ORG_REP_NOT_FOUND');
      }

      const prioritizedOrgRepId =
        (invite.invitedBy &&
          orgLeads.find((member) => member.userId === invite.invitedBy)?.userId) ||
        orgLeads.find((member) => member.role === 'owner')?.userId ||
        orgLeads[0]?.userId;

      if (!prioritizedOrgRepId) {
        throw new Error('ORG_REP_NOT_FOUND');
      }

      const [match] = await tx
        .insert(matches)
        .values({
          assignmentId,
          profileId: user.id,
          score: '0',
          vector: {},
          weights: {},
          isTestMatch: true,
        })
        .onConflictDoUpdate({
          target: [matches.assignmentId, matches.profileId],
          set: {
            isTestMatch: true,
          },
        })
        .returning({
          id: matches.id,
        });

      let conversationId: string;

      const [existingConversation] = await tx
        .select({
          id: conversations.id,
        })
        .from(conversations)
        .where(
          and(
            eq(conversations.assignmentId, assignmentId),
            or(
              and(
                eq(conversations.participantOneId, user.id),
                eq(conversations.participantTwoId, prioritizedOrgRepId)
              ),
              and(
                eq(conversations.participantOneId, prioritizedOrgRepId),
                eq(conversations.participantTwoId, user.id)
              )
            )
          )
        )
        .limit(1);

      if (existingConversation) {
        conversationId = existingConversation.id;
        await tx
          .update(conversations)
          .set({
            matchId: match.id,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, conversationId));
      } else {
        const [newConversation] = await tx
          .insert(conversations)
          .values({
            matchId: match.id,
            assignmentId,
            participantOneId: user.id,
            participantTwoId: prioritizedOrgRepId,
            stage: 'masked',
            maskedHandleOne: `Candidate #${nanoid(6).toUpperCase()}`,
            maskedHandleTwo: `Organization #${nanoid(6).toUpperCase()}`,
            lastMessageAt: new Date(),
          })
          .returning({
            id: conversations.id,
          });

        conversationId = newConversation.id;
      }

      await tx
        .update(orgCandidateInvites)
        .set({
          status: CANDIDATE_INVITE_STATUS.CLAIMED,
          claimedByProfileId: user.id,
          claimedAt: invite.claimedAt ?? new Date(),
          acceptedByProfileId: user.id,
          acceptedAt: new Date(),
          matchId: match.id,
          conversationId,
          updatedAt: new Date(),
        })
        .where(eq(orgCandidateInvites.id, invite.id));

      return {
        matchId: match.id,
        conversationId,
      };
    });

    emitAnalyticsEventAsync({
      eventType: 'candidate_invite_claimed',
      userId: user.id,
      organizationId: invite.orgId,
      entityType: 'profile',
      entityId: invite.id,
      properties: {
        flow_type: CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH,
        assignment_id: invite.assignmentId,
        match_id: result.matchId,
        conversation_id: result.conversationId,
      },
    });

    return NextResponse.json({
      success: true,
      status: CANDIDATE_INVITE_STATUS.CLAIMED,
      matchId: result.matchId,
      conversationId: result.conversationId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'ASSIGNMENT_NOT_FOUND') {
      return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
    }

    if (error instanceof Error && error.message === 'ORG_REP_NOT_FOUND') {
      return NextResponse.json(
        { error: 'No active organization owner/admin available for test messaging.' },
        { status: 409 }
      );
    }

    console.error('Failed to claim candidate invite:', error);
    return NextResponse.json({ error: 'Failed to claim invite' }, { status: 500 });
  }
}
