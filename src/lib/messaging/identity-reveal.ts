/**
 * Identity Reveal Logic
 *
 * Triggers identity reveal after interview scheduling
 */

import { db } from '@/db';
import { conversations, matchReviewStates, organizations, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendIdentityRevealedEmail } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase/admin';
import { unlockFullIdentityForMatch } from '@/lib/matching/review-contract';

/**
 * Trigger identity reveal for a conversation
 *
 * Called automatically after interview is scheduled
 * Updates stage from 1 (masked) to 2 (revealed)
 */
export async function triggerIdentityReveal(conversationId: string): Promise<void> {
  try {
    // Get conversation details
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Update conversation stage
    await db
      .update(conversations)
      .set({
        stage: 'revealed',
      })
      .where(eq(conversations.id, conversationId));

    if (conversation.matchId) {
      await unlockFullIdentityForMatch({
        matchId: conversation.matchId,
        triggerType: 'automatic',
        sourceSurface: 'identity_reveal_service',
        reasonCode: 'reveal_unlocked',
        unlockTrigger: 'interview_scheduled',
        context: {
          conversationId,
          auditEvent: 'reveal_unlocked',
        },
      });
    }

    // Send email notifications to both parties
    try {
      const revealContext = conversation.matchId
        ? await db.query.matchReviewStates.findFirst({
            where: eq(matchReviewStates.matchId, conversation.matchId),
          })
        : null;
      const candidateParticipantId = revealContext?.profileId ?? null;
      const organizationParticipantId =
        candidateParticipantId && conversation.participantOneId === candidateParticipantId
          ? conversation.participantTwoId
          : candidateParticipantId && conversation.participantTwoId === candidateParticipantId
            ? conversation.participantOneId
            : null;

      if (!revealContext || !candidateParticipantId || !organizationParticipantId) {
        console.error('Failed to resolve role-safe identity reveal email context');
        return;
      }

      const [candidateProfile, organizationProfile, organization] = await Promise.all([
        db.query.profiles.findFirst({
          where: eq(profiles.id, candidateParticipantId),
        }),
        db.query.profiles.findFirst({
          where: eq(profiles.id, organizationParticipantId),
        }),
        db.query.organizations.findFirst({
          where: eq(organizations.id, revealContext.orgId),
        }),
      ]);

      if (!organization?.slug) {
        console.error('Failed to resolve organization route for identity reveal email');
        return;
      }

      // Resolve participant emails directly by id.
      const adminClient = createAdminClient();
      const { data: candidateAuth } =
        await adminClient.auth.admin.getUserById(candidateParticipantId);
      const { data: organizationAuth } =
        await adminClient.auth.admin.getUserById(organizationParticipantId);

      if (candidateProfile && candidateAuth?.user?.email && organization) {
        await sendIdentityRevealedEmail(
          candidateAuth.user.email,
          candidateProfile.displayName || 'User',
          'candidate',
          {
            revealedName: organization.displayName || 'the organization',
            conversationId,
            profileId: organization.id,
          }
        );
      }

      if (organizationProfile && organizationAuth?.user?.email && candidateProfile) {
        await sendIdentityRevealedEmail(
          organizationAuth.user.email,
          organizationProfile.displayName || 'User',
          'organization',
          {
            revealedName: candidateProfile.displayName || 'the candidate',
            orgSlug: organization.slug,
            conversationId,
            profileId: candidateProfile.id,
          }
        );
      }
    } catch (emailError) {
      console.error('Failed to send identity revealed emails:', emailError);
      // Don't fail the request if email fails
    }

    // Post-MVP: emit a dedicated identity_revealed analytics event.

    console.log(`Identity revealed for conversation ${conversationId}`);
  } catch (error) {
    console.error('Identity reveal error:', error);
    throw new Error('Failed to trigger identity reveal');
  }
}

/**
 * Check if conversation is at revealed stage
 */
export async function isIdentityRevealed(conversationId: string): Promise<boolean> {
  try {
    const conversation = await db
      .select({ stage: conversations.stage })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation.length) {
      throw new Error('Conversation not found');
    }

    return conversation[0].stage === 'revealed';
  } catch (error) {
    console.error('Check identity reveal error:', error);
    return false;
  }
}
