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
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';
import { Resend } from 'resend';
import IdentityRevealed from '@/../emails/IdentityRevealed';
import { EMAIL_CONFIG } from '@/lib/email/config';

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
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Check if already revealed
    if (conversation.stage === 'revealed') {
      return NextResponse.json(
        { error: 'Identities already revealed', alreadyRevealed: true },
        { status: 400 }
      );
    }

    // Determine which participant is making the request
    const isParticipantOne = conversation.participantOneId === user.id;

    // Check if user already requested reveal
    const alreadyRequested = isParticipantOne
      ? conversation.participantOneWantsReveal
      : conversation.participantTwoWantsReveal;

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
      .where(eq(conversations.id, conversationId))
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

      return NextResponse.json({
        success: true,
        revealed: true,
        message: "Identities revealed! You can now see each other's full profiles.",
        conversation: {
          id: revealedConversation.id,
          stage: revealedConversation.stage,
          revealedAt: revealedConversation.revealedAt,
        },
      });
    } else {
      // Waiting for other participant
      log.info('conversation.reveal_requested', {
        conversationId,
        requesterId: user.id,
        waitingForOther: true,
      });

      return NextResponse.json({
        success: true,
        revealed: false,
        waitingForOther: true,
        message: 'Reveal request sent. Waiting for the other participant to agree.',
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

    // Send to participant one
    await resend.emails.send({
      from: emailFrom,
      to: userOneEmail,
      subject: 'Identities Revealed - Continue Your Conversation',
      react: IdentityRevealed({
        recipientName: participantOne?.displayName || 'there',
        role: 'candidate',
        revealedName: participantTwo?.displayName || 'your match',
        viewConversationUrl: conversationUrl,
        viewProfileUrl: conversationUrl,
      }),
    });

    // Send to participant two
    await resend.emails.send({
      from: emailFrom,
      to: userTwoEmail,
      subject: 'Identities Revealed - Continue Your Conversation',
      react: IdentityRevealed({
        recipientName: participantTwo?.displayName || 'there',
        role: 'candidate',
        revealedName: participantOne?.displayName || 'your match',
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
