/**
 * Identity Reveal API - Handle staged identity reveal requests
 *
 * POST - Request or confirm identity reveal
 *
 * Two-stage process:
 * 1. One participant requests reveal
 * 2. Both participants agree → Stage transitions to 'revealed'
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 10.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db, conversations, profiles } from '@/db';
import { matchReviewStates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';
import { Resend } from 'resend';
import IdentityRevealed from '@/../emails/IdentityRevealed';
import { EMAIL_CONFIG } from '@/lib/email/config';
import { applyWorkflowEmailPrivacy } from '@/lib/email/privacy';
import { getHiringCorridorRecordForMatch } from '@/lib/hiring-corridor/service';
import { buildHiringCorridorSnapshot } from '@/lib/hiring-corridor/snapshot';
import { recordRevealEvent, unlockFullIdentityForMatch } from '@/lib/matching/review-contract';
import { syncRevealRequestTimeoutState } from '@/lib/workflow/service';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

interface RouteParams {
  params: Promise<{
    conversationId: string;
  }>;
}

async function getCorridorPayload(matchId: string | null | undefined, userId: string) {
  if (!matchId) {
    return null;
  }

  const corridorSource = await getHiringCorridorRecordForMatch(matchId);
  if (!corridorSource) {
    return null;
  }

  const perspective = corridorSource.candidateProfileId === userId ? 'individual' : 'organization';

  return buildHiringCorridorSnapshot({
    source: corridorSource,
    viewerUserId: userId,
    perspective,
  });
}

/**
 * POST /api/conversations/[conversationId]/reveal
 *
 * Request identity reveal in a masked conversation
 *
 * Flow:
 * 1. User A clicks "Reveal my identity" → participant_one_wants_reveal = true
 * 2. User B sees "User A wants to reveal identities"
 * 3. User B clicks "Reveal my identity" → participant_two_wants_reveal = true
 * 4. Trigger fires → stage = 'revealed', revealed_at = NOW()
 * 5. Both users receive IdentityRevealed email
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch conversation
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify user is a participant
    const isParticipant =
      conversation.participantOneId === user.id || conversation.participantTwoId === user.id;

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const {
      conversation: syncedConversation,
      timeout: revealTimeout,
      reset: revealRequestExpired,
    } = await syncRevealRequestTimeoutState({
      conversation,
    });

    let revealContext = syncedConversation.matchId
      ? await db.query.matchReviewStates.findFirst({
          where: eq(matchReviewStates.matchId, syncedConversation.matchId),
        })
      : null;

    if (revealRequestExpired && revealContext) {
      await recordRevealEvent({
        matchId: revealContext.matchId,
        assignmentId: revealContext.assignmentId,
        profileId: revealContext.profileId,
        orgId: revealContext.orgId,
        actorType: 'system',
        triggerType: 'policy',
        requestedScope: 'full_identity',
        grantedScope: revealContext.revealScope,
        reasonCode: 'reveal_request_expired',
        sourceSurface: 'conversation_reveal_route',
        context: {
          conversationId,
          requestedBy: revealTimeout.requestedBy,
          requestedAt: revealTimeout.requestedAt?.toISOString() ?? null,
          expiresAt: revealTimeout.expiresAt?.toISOString() ?? null,
        },
        outcome: 'denied',
      });
    }

    // Check if already revealed
    if (syncedConversation.stage === 'revealed') {
      return NextResponse.json(
        { error: 'Identities already revealed', alreadyRevealed: true },
        { status: 400 }
      );
    }

    // Determine which participant is making the request
    const isParticipantOne = syncedConversation.participantOneId === user.id;

    // Check if user already requested reveal
    const alreadyRequested = isParticipantOne
      ? syncedConversation.participantOneWantsReveal
      : syncedConversation.participantTwoWantsReveal;

    if (alreadyRequested) {
      return NextResponse.json(
        { error: 'You have already requested to reveal identities', waitingForOther: true },
        { status: 400 }
      );
    }

    // Update reveal status
    const updatedConversation = await db
      .update(conversations)
      .set(
        isParticipantOne
          ? {
              participantOneWantsReveal: true,
              participantOneRevealRequestedAt: new Date(),
              updatedAt: new Date(),
            }
          : {
              participantTwoWantsReveal: true,
              participantTwoRevealRequestedAt: new Date(),
              updatedAt: new Date(),
            }
      )
      .where(eq(conversations.id, syncedConversation.id))
      .returning();

    const updated = updatedConversation[0];

    // Check if both participants now want to reveal
    const bothAgree = updated.participantOneWantsReveal && updated.participantTwoWantsReveal;

    if (bothAgree) {
      // Some environments apply reveal transition via DB trigger.
      // If trigger already flipped stage, use that row; otherwise perform explicit transition.
      let revealedConversation = updated;
      if (updated.stage !== 'revealed') {
        const [explicitlyRevealedConversation] = await db
          .update(conversations)
          .set({
            stage: 'revealed',
            revealedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, conversationId))
          .returning();
        revealedConversation = explicitlyRevealedConversation;
      }

      if (revealedConversation.matchId) {
        await unlockFullIdentityForMatch({
          matchId: revealedConversation.matchId,
          actorId: user.id,
          actorRole: 'conversation_participant',
          actorType: 'user_account',
          triggerType: 'user',
          sourceSurface: 'conversation_reveal_route',
          reasonCode: 'reveal_full_identity',
          unlockTrigger: 'conversation_reveal',
          context: {
            conversationId,
          },
        });
      }

      // Log reveal event
      log.info('conversation.revealed', {
        conversationId,
        participantOneId: revealedConversation.participantOneId,
        participantTwoId: revealedConversation.participantTwoId,
        revealedAt: revealedConversation.revealedAt,
      });

      // Send IdentityRevealed emails to both participants
      await sendIdentityRevealedEmails(
        revealedConversation.participantOneId,
        revealedConversation.participantTwoId,
        conversationId
      );

      const corridor = await getCorridorPayload(revealedConversation.matchId, user.id);

      return NextResponse.json({
        success: true,
        revealed: true,
        message: "Identities revealed! You can now see each other's full profiles.",
        conversation: {
          id: revealedConversation.id,
          stage: revealedConversation.stage,
          revealedAt: revealedConversation.revealedAt,
        },
        corridor,
        nextAction: corridor?.nextAction ?? null,
      });
    } else {
      // Waiting for other participant
      log.info('conversation.reveal_requested', {
        conversationId,
        requesterId: user.id,
        waitingForOther: true,
      });

      if (updated.matchId) {
        if (!revealContext || revealContext.matchId !== updated.matchId) {
          revealContext = await db.query.matchReviewStates.findFirst({
            where: eq(matchReviewStates.matchId, updated.matchId),
          });
        }

        if (revealContext) {
          await recordRevealEvent({
            matchId: revealContext.matchId,
            assignmentId: revealContext.assignmentId,
            profileId: revealContext.profileId,
            orgId: revealContext.orgId,
            actorId: user.id,
            actorRole: 'conversation_participant',
            actorType: 'user_account',
            triggerType: 'user',
            requestedScope: 'full_identity',
            grantedScope: revealContext.revealScope,
            reasonCode: 'reveal_full_identity',
            sourceSurface: 'conversation_reveal_route',
            context: {
              conversationId,
              waitingForOther: true,
              expiredAndReset: revealRequestExpired,
            },
            outcome: 'no_op',
          });
        }
      }

      const corridor = await getCorridorPayload(updated.matchId, user.id);

      return NextResponse.json({
        success: true,
        revealed: false,
        waitingForOther: true,
        message: 'Reveal request sent. Waiting for the other participant to agree.',
        corridor,
        nextAction: corridor?.nextAction ?? null,
      });
    }
  } catch (error) {
    console.error('Error processing reveal request:', error);
    log.error('conversation.reveal_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      conversationId: (await params).conversationId,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Send IdentityRevealed emails to both participants
 */
async function sendIdentityRevealedEmails(
  participantOneId: string,
  participantTwoId: string,
  conversationId: string
): Promise<void> {
  try {
    const resend = getResendClient();
    if (!resend) {
      log.error('identity_revealed_email.missing_resend_api_key', { conversationId });
      return;
    }

    const emailFrom = EMAIL_CONFIG.from;

    // Fetch participant profiles
    const participantOne = await db.query.profiles.findFirst({
      where: eq(profiles.id, participantOneId),
      columns: {
        id: true,
        displayName: true,
      },
    });

    const participantTwo = await db.query.profiles.findFirst({
      where: eq(profiles.id, participantTwoId),
      columns: {
        id: true,
        displayName: true,
      },
    });

    // Get emails from Supabase auth (RLS protected)
    const supabase = await createClient();

    // Use service role to fetch emails (admin access)
    const { data: userData } = await supabase.auth.admin.listUsers();

    const userOneEmail = userData?.users.find((u) => u.id === participantOneId)?.email;
    const userTwoEmail = userData?.users.find((u) => u.id === participantTwoId)?.email;

    if (!userOneEmail || !userTwoEmail) {
      log.error('identity_revealed_email.missing_email', {
        conversationId,
        hasUserOneEmail: !!userOneEmail,
        hasUserTwoEmail: !!userTwoEmail,
      });
      return;
    }

    const conversationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/i/messages/${conversationId}`;
    const participantOneEmail = applyWorkflowEmailPrivacy(
      {
        subject: 'Identities Revealed - Continue Your Conversation',
        revealedName: participantTwo?.displayName || 'your match',
      },
      {
        stage: 'revealed',
        neutralSubject: 'Proofound workflow update',
        identityVisible: true,
      }
    );
    const participantTwoEmail = applyWorkflowEmailPrivacy(
      {
        subject: 'Identities Revealed - Continue Your Conversation',
        revealedName: participantOne?.displayName || 'your match',
      },
      {
        stage: 'revealed',
        neutralSubject: 'Proofound workflow update',
        identityVisible: true,
      }
    );

    // Send to participant one
    await resend.emails.send({
      from: emailFrom,
      to: userOneEmail,
      subject: participantOneEmail.subject,
      react: IdentityRevealed({
        recipientName: participantOne?.displayName || 'there',
        role: 'candidate',
        revealedName: participantOneEmail.revealedName ?? 'your match',
        viewConversationUrl: conversationUrl,
        viewProfileUrl: conversationUrl,
      }),
    });

    // Send to participant two
    await resend.emails.send({
      from: emailFrom,
      to: userTwoEmail,
      subject: participantTwoEmail.subject,
      react: IdentityRevealed({
        recipientName: participantTwo?.displayName || 'there',
        role: 'candidate',
        revealedName: participantTwoEmail.revealedName ?? 'your match',
        viewConversationUrl: conversationUrl,
        viewProfileUrl: conversationUrl,
      }),
    });

    log.info('identity_revealed_emails.sent', {
      conversationId,
      participantOneId,
      participantTwoId,
    });
  } catch (error) {
    log.error('identity_revealed_emails.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      conversationId,
    });
    // Don't throw - email failure shouldn't block reveal
  }
}
