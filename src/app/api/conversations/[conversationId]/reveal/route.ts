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
import { safeApiErrorResponse } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { db, conversations, organizations, profiles } from '@/db';
import { matchReviewStates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';
import { Resend } from 'resend';
import { EMAIL_CONFIG } from '@/lib/email/config';
import {
  buildRevealConversationUrl,
  buildRevealNotificationEmail,
  type RevealNotificationRole,
} from '@/lib/email/privacy';
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

type ConversationRow = typeof conversations.$inferSelect;
type MatchReviewStateRow = typeof matchReviewStates.$inferSelect;

type RevealNotificationRecipient = {
  id: string;
  role: RevealNotificationRole;
  recipientName: string;
  revealedName: string | null;
  conversationUrl: string;
};

type RevealNotificationContext = {
  candidate: RevealNotificationRecipient;
  organization: RevealNotificationRecipient;
};

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

async function resolveRevealNotificationContext(
  conversation: ConversationRow,
  revealContext: MatchReviewStateRow | null,
  conversationId: string
): Promise<RevealNotificationContext | null> {
  if (!revealContext) {
    log.error('reveal_notification.role_context_missing', {
      conversationId,
      hasMatchId: Boolean(conversation.matchId),
    });
    return null;
  }

  const candidateParticipantId = revealContext.profileId;
  const organizationParticipantId =
    conversation.participantOneId === candidateParticipantId
      ? conversation.participantTwoId
      : conversation.participantTwoId === candidateParticipantId
        ? conversation.participantOneId
        : null;

  if (!organizationParticipantId) {
    log.error('reveal_notification.participant_role_mismatch', {
      conversationId,
      matchId: revealContext.matchId,
    });
    return null;
  }

  const [candidateProfile, organizationProfile, organization] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.id, candidateParticipantId),
      columns: {
        id: true,
        displayName: true,
      },
    }),
    db.query.profiles.findFirst({
      where: eq(profiles.id, organizationParticipantId),
      columns: {
        id: true,
        displayName: true,
      },
    }),
    db.query.organizations.findFirst({
      where: eq(organizations.id, revealContext.orgId),
      columns: {
        id: true,
        slug: true,
        displayName: true,
      },
    }),
  ]);

  const candidateUrl = buildRevealConversationUrl({
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
    conversationId,
    role: 'candidate',
  });
  const organizationUrl = buildRevealConversationUrl({
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
    conversationId,
    role: 'organization',
    orgSlug: organization?.slug,
  });

  if (!candidateUrl || !organizationUrl) {
    log.error('reveal_notification.url_unavailable', {
      conversationId,
      hasSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      hasOrgSlug: Boolean(organization?.slug),
    });
    return null;
  }

  return {
    candidate: {
      id: candidateParticipantId,
      role: 'candidate',
      recipientName: candidateProfile?.displayName || 'there',
      revealedName: organization?.displayName ?? null,
      conversationUrl: candidateUrl,
    },
    organization: {
      id: organizationParticipantId,
      role: 'organization',
      recipientName: organizationProfile?.displayName || 'there',
      revealedName: candidateProfile?.displayName ?? null,
      conversationUrl: organizationUrl,
    },
  };
}

function getOtherRevealRecipient(
  notificationContext: RevealNotificationContext,
  requesterId: string
) {
  if (notificationContext.candidate.id === requesterId) {
    return notificationContext.organization;
  }
  if (notificationContext.organization.id === requesterId) {
    return notificationContext.candidate;
  }
  return null;
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

    let revealContext: MatchReviewStateRow | null = syncedConversation.matchId
      ? ((await db.query.matchReviewStates.findFirst({
          where: eq(matchReviewStates.matchId, syncedConversation.matchId),
        })) ?? null)
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
        reasonCode: 'reveal_timed_out',
        sourceSurface: 'conversation_reveal_route',
        context: {
          conversationId,
          auditEvent: 'reveal_timed_out',
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
        if (!revealContext || revealContext.matchId !== revealedConversation.matchId) {
          revealContext =
            (await db.query.matchReviewStates.findFirst({
              where: eq(matchReviewStates.matchId, revealedConversation.matchId),
            })) ?? null;
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
            reasonCode: 'reveal_approved',
            sourceSurface: 'conversation_reveal_route',
            context: {
              conversationId,
              auditEvent: 'reveal_approved',
              consentApprovedByBothParticipants: true,
            },
            outcome: 'no_op',
          });
        }

        await unlockFullIdentityForMatch({
          matchId: revealedConversation.matchId,
          actorId: user.id,
          actorRole: 'conversation_participant',
          actorType: 'user_account',
          triggerType: 'user',
          sourceSurface: 'conversation_reveal_route',
          reasonCode: 'reveal_unlocked',
          unlockTrigger: 'conversation_reveal',
          context: {
            conversationId,
            auditEvent: 'reveal_unlocked',
            consentApprovedByBothParticipants: true,
            participantOneApprovedAt:
              revealedConversation.participantOneRevealRequestedAt?.toISOString?.() ?? null,
            participantTwoApprovedAt:
              revealedConversation.participantTwoRevealRequestedAt?.toISOString?.() ?? null,
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
      await sendIdentityRevealedEmails(revealedConversation, revealContext, conversationId);

      const corridor = await getCorridorPayload(revealedConversation.matchId, user.id);

      return NextResponse.json({
        success: true,
        revealed: true,
        message: 'Reveal approved. Continue in the approved conversation stage.',
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
          revealContext =
            (await db.query.matchReviewStates.findFirst({
              where: eq(matchReviewStates.matchId, updated.matchId),
            })) ?? null;
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
            reasonCode: 'reveal_requested',
            sourceSurface: 'conversation_reveal_route',
            context: {
              conversationId,
              auditEvent: 'reveal_requested',
              waitingForOther: true,
              expiredAndReset: revealRequestExpired,
            },
            outcome: 'no_op',
          });
        }
      }

      const notificationContext = await resolveRevealNotificationContext(
        updated,
        revealContext,
        conversationId
      );
      const requestRecipient = notificationContext
        ? getOtherRevealRecipient(notificationContext, user.id)
        : null;
      if (requestRecipient) {
        await sendRevealNotificationEmail({
          recipient: requestRecipient,
          conversationId,
          kind: 'request',
        });
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
    return safeApiErrorResponse({
      event: 'conversation.reveal_failed',
      error,
      status: 500,
      publicMessage: 'Unable to process reveal request',
      context: {
        conversationId: (await params).conversationId,
      },
    });
  }
}

async function getParticipantEmail(userId: string, conversationId: string) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.getUserById(userId);

  if (error) {
    log.error('reveal_notification.email_lookup_failed', {
      conversationId,
      participantId: userId,
    });
    return null;
  }

  return data.user?.email ?? null;
}

async function sendRevealNotificationEmail(input: {
  recipient: RevealNotificationRecipient;
  conversationId: string;
  kind: 'request' | 'approved';
}) {
  const resend = getResendClient();
  if (!resend) {
    log.error('reveal_notification.missing_resend_api_key', {
      conversationId: input.conversationId,
      kind: input.kind,
      recipientRole: input.recipient.role,
    });
    return;
  }

  const recipientEmail = await getParticipantEmail(input.recipient.id, input.conversationId);
  if (!recipientEmail) {
    log.error('reveal_notification.missing_email', {
      conversationId: input.conversationId,
      kind: input.kind,
      recipientRole: input.recipient.role,
      hasEmail: false,
    });
    return;
  }

  const email = buildRevealNotificationEmail({
    kind: input.kind,
    recipientRole: input.recipient.role,
    conversationUrl: input.recipient.conversationUrl,
    revealedName: input.kind === 'approved' ? input.recipient.revealedName : null,
  });

  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: recipientEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

/**
 * Send role-safe reveal-approved emails to both participants.
 */
async function sendIdentityRevealedEmails(
  conversation: ConversationRow,
  revealContext: MatchReviewStateRow | null,
  conversationId: string
): Promise<void> {
  try {
    const notificationContext = await resolveRevealNotificationContext(
      conversation,
      revealContext,
      conversationId
    );
    if (!notificationContext) {
      return;
    }

    await Promise.all([
      sendRevealNotificationEmail({
        recipient: notificationContext.candidate,
        conversationId,
        kind: 'approved',
      }),
      sendRevealNotificationEmail({
        recipient: notificationContext.organization,
        conversationId,
        kind: 'approved',
      }),
    ]);

    log.info('identity_revealed_emails.sent', {
      conversationId,
      candidateParticipantId: notificationContext.candidate.id,
      organizationParticipantId: notificationContext.organization.id,
    });
  } catch (error) {
    log.error('identity_revealed_emails.failed', {
      error: sanitizeErrorForLog(error),
      conversationId,
    });
    // Don't throw - email failure shouldn't block reveal
  }
}
